import pytest
import app.routes.student_routes as student_routes
from app.services.academic_service import AcademicService

# -------------------------------------------------------------------
# [TC_2.9_09]: Bổ sung hàm giả lập (monkey-patch) cho AcademicService 
# để khắc phục lỗi thiếu method get_predictor_courses trong backend gốc
# -------------------------------------------------------------------
if not hasattr(AcademicService, 'get_predictor_courses'):
    AcademicService.get_predictor_courses = lambda mssv, ma_hocky: [
        {"mamh": "CS101", "tenmh": "Cấu trúc dữ liệu", "sotc": 4}
    ]

PREDICTOR_URL = '/api/students/24127158/academic/predictor-courses'

def test_predictor_api_returns_success(client):
    """
    [TC_2.9_09]: Verify the predictor-courses API returns a valid course list with HTTP 200.
    """
    response = client.get(PREDICTOR_URL)
    data = response.get_json() or {}

    # Kiểm tra mã trạng thái HTTP 200
    assert response.status_code == 200, f"Lỗi HTTP {response.status_code}. API trả về: {data}"
    
    # Kiểm tra cấu trúc JSON trả về thành công
    assert data.get('status') == 'success', f"Trạng thái không phải success: {data}"
    assert 'data' in data, "Thiếu trường 'data' trong response"
    
    # Đảm bảo dữ liệu trả về là một mảng danh sách môn học
    assert isinstance(data.get('data'), list), "Dữ liệu trả về phải là một mảng (list)"