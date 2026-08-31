# backend/app/routes/ai_routes.py
from flask import Blueprint, request, jsonify, current_app
from datetime import datetime
import uuid
import jwt
from app.models.chat import ChatSession, ChatMessage
from app.services.ai_service import get_ai_response
from app.services.context_service import build_student_context
from app import db

ai_bp = Blueprint('ai', __name__, url_prefix='/api/chatbot')

def get_authenticated_mssv():
    """
    Hàm trích xuất MSSV từ JWT Token trong header.
    MSSV nằm ở trường 'sub' trong payload được tạo bởi auth_routes.py.
    
    Returns:
        Tuple (mssv, error_message). Nếu lỗi, mssv là None.
    """
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None, "Thiếu token xác thực."
    
    token = auth_header.split(' ')[1]
    try:
        secret_key = str(current_app.config.get('SECRET_KEY') or 'campus_secret_key_2026_hcmus_super_secret_key_32bytes')
        payload = jwt.decode(token, secret_key, algorithms=["HS256"])
        
        if payload.get('role') != 'student':
            return None, "Chỉ sinh viên mới có thể sử dụng chatbot này."
        
        mssv = payload.get('sub')
        if not mssv:
            return None, "Không xác định được MSSV từ token."
            
        return mssv, None
    except jwt.PyJWTError:
        return None, "Token không hợp lệ hoặc đã hết hạn."

@ai_bp.route('/ask', methods=['POST'])
def ask_chatbot():
    """
    Endpoint xử lý câu hỏi của sinh viên.
    Chỉ nhận dữ liệu từ user, không bao giờ tin tưởng MSSV do client gửi lên.
    """
    try:
        # 1. Xác thực người dùng từ token (Bảo mật quan trọng nhất)
        mssv, error = get_authenticated_mssv()
        if error:
            return jsonify({"status": "error", "message": error}), 401

        # 2. Lấy câu hỏi từ frontend
        data = request.get_json() or {}
        question = data.get('message', '').strip()
        if not question:
            return jsonify({"status": "error", "message": "Câu hỏi không được để trống."}), 400

        # 3. Lấy dữ liệu riêng tư của sinh viên dựa trên MSSV từ token
        context = build_student_context(mssv)

        # 4. Tạo System Prompt an toàn (không cho AI tự truy vấn SQL)
        system_prompt = f"""
Bạn là trợ lý học vụ HCMUS AI. Bạn CHỈ ĐƯỢC PHÉP trả lời dựa trên dữ liệu sinh viên được cung cấp dưới đây.
Nếu thông tin không có trong dữ liệu, hãy trả lời rằng bạn không có thông tin này.
Dữ liệu sinh viên (MSSV: {mssv}):
{context}

QUY TẮC ỨNG XỬ:
        - Xưng "tôi", gọi sinh viên là "bạn".
        - Lịch sự, chuyên nghiệp, KHÔNG dùng "dạ", "vâng", "nha", "nhé".
        - KHÔNG dùng emoji, không văn nói.
        - Trả lời dứt khoát, rõ ràng, độ dài vừa đủ.
        - Nếu có nhiều ý, dùng dấu chấm đen đầu dòng (•).

        ĐẶC BIỆT:
        - KHÔNG đưa ra quyết định thay sinh viên (ví dụ: "bạn nên học môn nào", "bạn nên chọn ngành nào") mà hãy đưa ra các danh sách các môn từ tháp đến cao với các mức dưới 5, dưới 8.5 trên 8.5
        - Với câu hỏi về lộ trình săp tới xem điểm các môn của sinh viên, môn về lĩnh vực nào thấp khuyên sinh viên nên chú ý tập trung bồi dưỡng, nhóm môn nào điểm cao khuyên sinh viên cứ phát huy thế mạnh
            - Nếu sinh viên hỏi về học phí theo học kỳ hoặc năm học:
        Hãy tìm trong dữ liệu "tuition" các mục có "hoc_ky" và "nam_hoc" khớp với câu hỏi.
        Nếu có nhiều học kỳ, hãy liệt kê rõ ràng từng học kỳ, tổng tiền đã đóng, tiền còn nợ.
        Nếu không tìm thấy học kỳ đó, nói rõ bạn không có dữ liệu học phí cho học kỳ đó.
        - Nếu sinh viên hỏi về cách liên hệ giáo vụ:
        Hãy dùng dữ liệu "advisor_email" hoặc "faculty_advisor_email" đã có trong context.
        Không tự bịa email nếu context không có.
        Hướng dẫn sinh viên soạn thư với tiêu đề rõ ràng, kèm MSSV, và nội dung cần hỗ trợ.
        - Với câu hỏi về chọn ngành: hướng dẫn sinh viên vào "Học tập → Tiến độ học tập" để xem biểu đồ, nhấn mạnh biểu đồ chỉ mang tính tham khảo.
        - Với câu hỏi hướng dẫn xem điểm thi hoặc số tín chỉ tích lũy: hướng dẫn sinh viên vào "Học tập -> Tiến độ học tập"
        - Với câu hỏi về quy trình và giấy tờ: hướng dẫn sinh viên gửi mail cho giáo vụ.
        - Với câu hỏi lịch học: nếu không có lịch, hãy kiểm tra lịch thi trước khi kết luận.
        - Nếu sinh viên hỏi về khảo sát (ví dụ: "Tôi còn khảo sát nào chưa làm?"):
            Hãy xem dữ liệu "surveys" trong context.
            Nếu có mục "pending", hãy liệt kê tên các khảo sát chưa làm và hạn nộp.
            Nếu có mục "completed", hãy xác nhận sinh viên đã hoàn thành.
            Nếu không có khảo sát nào, hãy nói rõ sinh viên không có khảo sát nào cần thực hiện.
"""

        # 5. Gọi AI
        ai_response = get_ai_response(system_prompt, question)

        # 6. Lưu lịch sử chat vào database (Bảng CHATBOT_SESSION và CHATBOT_MESSAGE)
        session_id = str(uuid.uuid4())[:10]
        
        new_session = ChatSession(
            masession=session_id, 
            mssv=mssv, 
            thoigian_batdau=datetime.now(), 
            trangthai_giaiquyet="Đã trả lời"
        )
        db.session.add(new_session)
        
        # Lưu tin nhắn của user
        db.session.add(ChatMessage(
            mamsg=str(uuid.uuid4())[:10], 
            masession=session_id, 
            nguoigui=mssv, 
            noidung_tinnhan=question, 
            loai_tinnhan="user"
        ))
        
        # Lưu tin nhắn của bot
        db.session.add(ChatMessage(
            mamsg=str(uuid.uuid4())[:10], 
            masession=session_id, 
            nguoigui="AI", 
            noidung_tinnhan=ai_response, 
            loai_tinnhan="bot"
        ))
        
        db.session.commit()

        # 7. Trả về JSON cho Frontend
        return jsonify({"status": "success", "data": {"reply": ai_response}})

    except Exception as e:
        # In lỗi chi tiết ra Terminal để debug
        print(f"[CHATBOT ERROR] {str(e)}") 
        # Trả về UI thông báo chung chung, không lộ dữ liệu
        return jsonify({"status": "error", "message": "Có lỗi xảy ra, vui lòng thử lại."}), 500