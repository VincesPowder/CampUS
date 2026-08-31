# backend/app/services/ai_service.py
import os
import time

try:
    from google import genai
    AI_LIBRARY = "new"
except ImportError:
    import google.generativeai as genai
    AI_LIBRARY = "old"

def get_ai_response(system_prompt: str, user_question: str) -> str:
    """
    Gửi câu hỏi và ngữ cảnh lên mô hình Gemini để nhận câu trả lời.
    Đọc API key từ biến môi trường backend (không bao giờ gửi lên client).
    """
    api_key = os.getenv('AI_API_KEY')
    # Sử dụng duy nhất model mới nhất mà Google yêu cầu
    model_name = os.getenv('AI_MODEL_NAME', 'gemini-3.6-flash')
    
    if not api_key:
        raise ValueError("AI_API_KEY is not set in environment variables.")

    full_prompt = f"{system_prompt}\n\n---\nNgười dùng hỏi: {user_question}"
    
    # Thử tối đa 2 lần (để xử lý lỗi Rate Limit tạm thời)
    last_error = ""
    for attempt in range(2):
        try:
            if AI_LIBRARY == "new":
                client = genai.Client(api_key=api_key)
                response = client.models.generate_content(
                    model=model_name,
                    contents=full_prompt
                )
                return response.text
            else:
                genai.configure(api_key=api_key)
                model = genai.GenerativeModel(model_name)
                response = model.generate_content(full_prompt)
                return response.text

        except Exception as e:
            # In lỗi chi tiết ra Terminal để debug
            print(f"[CHATBOT ERROR] Model {model_name} thất bại (Lần {attempt + 1}): {str(e)}")
            last_error = str(e)
            
            # Nếu lỗi 429 (Rate Limit), đọc thời gian chờ từ thông báo lỗi rồi thử lại
            if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
                # Trích xuất số giây chờ (ví dụ: "retry in 38.84s")
                import re
                wait_time = re.search(r"retry in (\d+\.?\d*)s", str(e))
                wait_seconds = float(wait_time.group(1)) if wait_time else 30.0
                
                print(f"[CHATBOT ERROR] Đang chờ {wait_seconds} giây để thử lại...")
                time.sleep(wait_seconds + 1) # Cộng thêm 1 giây cho an toàn
                continue # Thử lại vòng lặp tiếp theo
            else:
                # Lỗi khác (sai key, lỗi bảo mật 403...) thì dừng luôn
                break
    
    # Tất cả đều thất bại
    print(f"[CHATBOT ERROR] Tất cả model đều thất bại. Chi tiết: {last_error}")
    raise Exception("Lỗi kết nối tới hệ thống AI.")