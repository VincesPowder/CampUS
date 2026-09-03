import pytest
from app import create_app, db
from app.models.chat import ChatSession, ChatMessage
from unittest.mock import patch
import jwt

@pytest.fixture
def client():
    app = create_app()
    app.config['SECRET_KEY'] = 'test_secret_key_must_be_at_least_32_bytes_long'
    with app.test_client() as client:
        with app.app_context():
            db.create_all()
            yield client
            db.session.remove()
            db.drop_all()

def generate_valid_token(mssv="24127001", role="student"):
    """Tạo token giả lập sinh viên hợp lệ."""
    return jwt.encode({"sub": mssv, "role": role}, 'test_secret_key_must_be_at_least_32_bytes_long', algorithm="HS256")

@patch('app.routes.ai_routes.get_ai_response')
@patch('app.routes.ai_routes.build_student_context')
def test_tc_2_26_06_ai_processing_and_db_save(mock_build_context, mock_ai_response, client):
    """[TC_2.26_06]: Verify AI processing, context retrieval, and DB saving."""
    
    # Giả lập dữ liệu trả về từ các service
    mock_build_context.return_value = "Dữ liệu sinh viên giả lập"
    mock_ai_response.return_value = "Đây là câu trả lời từ AI."
    
    token = generate_valid_token()
    headers = {'Authorization': f'Bearer {token}'}
    payload = {'message': 'Học phí kỳ này bao nhiêu?'}

    response = client.post('/api/chatbot/ask', json=payload, headers=headers)
    
    # 1. Kiểm tra API trả về thành công
    assert response.status_code == 200
    data = response.get_json()
    assert data['status'] == 'success'
    assert data['data']['reply'] == "Đây là câu trả lời từ AI."
    
    # 2. Kiểm tra Database có lưu lịch sử không
    with client.application.app_context():
        session = ChatSession.query.filter_by(mssv="24127001").first()
        assert session is not None
        assert session.trangthai_giaiquyet == "Đã trả lời"
        
        # Phiên này phải có 2 tin nhắn (1 user, 1 bot)
        messages = ChatMessage.query.filter_by(masession=session.masession).all()
        assert len(messages) == 2
        assert any(m.loai_tinnhan == 'user' and m.noidung_tinnhan == 'Học phí kỳ này bao nhiêu?' for m in messages)
        assert any(m.loai_tinnhan == 'bot' and m.noidung_tinnhan == 'Đây là câu trả lời từ AI.' for m in messages)

@patch('app.routes.ai_routes.get_ai_response')
def test_tc_2_26_07_backend_error_handling(mock_ai_response, client):
    """[TC_2.26_07]: Verify backend error handling (Empty input & AI API crash)."""
    token = generate_valid_token()
    headers = {'Authorization': f'Bearer {token}'}
    
    # Test 1: Chặn câu hỏi rỗng
    response_empty = client.post('/api/chatbot/ask', json={'message': '   '}, headers=headers)
    assert response_empty.status_code == 400
    assert "Câu hỏi không được để trống" in response_empty.get_json()['message']
    
    # Test 2: Bắt lỗi khi service AI sập (Quota exceeded / Network error)
    mock_ai_response.side_effect = Exception("Lỗi kết nối tới hệ thống AI.")
    response_crash = client.post('/api/chatbot/ask', json={'message': 'Hello'}, headers=headers)
    
    assert response_crash.status_code == 500
    assert response_crash.get_json()['status'] == 'error'
    # Đảm bảo app không bị crash, vẫn trả về JSON thông báo đàng hoàng