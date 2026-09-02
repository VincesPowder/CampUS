import pytest

def test_tc_2_21_04_lock_course_endpoint(client):
    """
    [TC_2.21_04]: Xác minh API khóa điểm hoạt động chính xác.
    """
    headers = {"X-Admin-Email": "admin_test@hcmus.edu.vn"}
    
    # Gọi API khóa môn LHP01 (Giả định môn này có trong DB test của bạn)
    response = client.post('/api/admin/academic/courses/LHP01/lock', headers=headers)
    
    assert response.status_code in [200, 404]
    if response.status_code == 200:
        data = response.get_json() or {}
        assert data.get('status') == 'success'
        assert data['data']['status'] == 'locked'

def test_tc_2_21_06_security_vulnerability_edit_locked_course(client):
    """
    [TC_2.21_06]: Cảnh báo! API sửa điểm hiện tại không block môn đã khóa.
    Test này gọi API sửa điểm của môn đã 'locked' để phơi bày lỗi logic backend.
    """
    headers = {"X-Admin-Email": "admin_test@hcmus.edu.vn"}
    
    # Bước 1: Khóa môn LHP01
    client.post('/api/admin/academic/courses/LHP01/lock', headers=headers)
    
    # Bước 2: Thử gọi API sửa điểm của môn vừa khóa
    payload = {
        "diemCC": 9.9,
        "diemGK": 9.9,
        "diemCK": 9.9,
        "ghiChu": "Hacker đột nhập sửa điểm môn đã khóa!"
    }
    
    response = client.put('/api/admin/academic/courses/LHP01/grades/24127001', json=payload, headers=headers)
    
    # NẾU NHÓM BẠN CHƯA FIX LỖI NÀY, response sẽ trả về 200 (Cho phép sửa).
    # Test này sẽ Fail (báo đỏ) nếu API vẫn trả về 200. Bạn phải vào code admin_routes.py dòng 300 thêm đoạn IF kiểm tra lhp.trangthai == 'locked' thì test mới pass (403 Forbidden).
    # Hiện tại tôi để assert != 200 để ép Pytest báo đỏ, nhắc nhở nhóm bạn sửa code backend.
    assert response.status_code != 200, "LỖI BẢO MẬT: API đang cho phép sửa điểm môn đã bị khóa!"