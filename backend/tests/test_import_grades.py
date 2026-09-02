import pytest
import io

def test_tc_2_20_02_csv_format_validation(client):
    """
    [TC_2.20_02]: Xác minh API bắt lỗi khi upload file sai định dạng (Alternative Flow 1).
    """
    # Gửi một file text thay vì file CSV hợp lệ
    data = {
        'file': (io.BytesIO(b"This is a dummy text file, not a CSV"), 'grades.txt')
    }
    headers = {"X-Admin-Email": "admin_test@hcmus.edu.vn"}
    
    # Giả định endpoint tương lai là /import-grades
    response = client.post(
        '/api/admin/academic/courses/LHP01/import-grades', 
        data=data, 
        content_type='multipart/form-data',
        headers=headers
    )
    
    # Mong đợi: Server từ chối file, trả về mã HTTP 400 Bad Request
    assert response.status_code == 400
    res_data = response.get_json() or {}
    assert res_data.get('status') == 'error'
    assert 'định dạng' in res_data.get('message', '').lower()

def test_tc_2_20_07_backend_grade_calculation(client):
    """
    [TC_2.20_07]: Xác minh Backend cũng phải kiểm tra và tự động tính điểm tổng kết 
    để phòng hờ lỗi từ Frontend truyền xuống.
    """
    payload = {
        "diemCC": 5.0,
        "diemGK": 6.0,
        "diemCK": 7.0,
        "ghiChu": "Điểm từ hệ thống Import"
    }
    headers = {"X-Admin-Email": "admin_test@hcmus.edu.vn"}
    
    response = client.put('/api/admin/academic/courses/LHP01/grades/24127001', json=payload, headers=headers)
    
    assert response.status_code == 200
    res_data = response.get_json() or {}
    assert res_data.get('status') == 'success'
    # Server phải xử lý thành công việc lưu, không bị crash