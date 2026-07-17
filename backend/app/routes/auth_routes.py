from flask import Blueprint, request, jsonify
from app.models.user import User
from app import db
from datetime import datetime

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/api/auth/ms-login', methods=['POST'])
def ms_login():
    data = request.get_json()
    ms_token = data.get('token')
    
    # 1. Decode và verify token với Microsoft Entra ID (Dùng thư viện msal hoặc PyJWT)
    # Giả sử hàm verify_ms_token trả về payload chứa email, name, avatar
    # user_info = verify_ms_token(ms_token) 
    
    # if not user_info:
    #     return jsonify({"error": "Đăng nhập thất bại. Vui lòng cấp quyền truy cập hoặc thử lại."}), 401

    # email = user_info.get('email')
    
    # # 2. Kiểm tra domain email (Alternative Flow 1)
    # if not email.endswith('@student.hcmus.edu.vn'):
    #     return jsonify({"error": "Hệ thống chỉ hỗ trợ đăng nhập bằng email sinh viên (@student.hcmus.edu.vn). Vui lòng thử lại."}), 403
        
    # # 3. Auto-provisioning: Kiểm tra user có trong DB chưa
    # user = User.query.filter_by(email=email).first()
    
    # if not user:
    #     # Nếu chưa có, tự động tạo mới
    #     user = User(
    #         email=email,
    #         name=user_info.get('name'),
    #         avatar_url=user_info.get('avatar_url')
    #     )
    #     db.session.add(user)
    
    # # Cập nhật thời gian đăng nhập
    # user.last_login = datetime.utcnow()
    # db.session.commit()
    
    # # 4. Tạo JWT hoặc Session Cookie nội bộ của hệ thống và trả về cho Frontend
    # session_token = generate_app_token(user.id)
    
    # return jsonify({
    #     "message": "Đăng nhập thành công",
    #     "token": session_token,
    #     "user": {"name": user.name, "email": user.email, "avatar": user.avatar_url}
    # }), 200  
    
    print(f"Nhận được token từ Frontend: {ms_token[:20]}...")
    
    # Trả về Mock Data luôn để Frontend có thông tin lưu vào localStorage
    return jsonify({
        "message": "Đăng nhập thành công (Chế độ Mock)",
        "token": "mock_jwt_token_123456789",
        "user": {
            "name": "billie", 
            "email": "billie@student.hcmus.edu.vn", 
            "avatar": ""
        }
    }), 200