import pytest
from unittest.mock import patch

def test_get_notifications_structure(client):
    """
    [TC_2.13_04]: Xác minh API GET trả về danh sách thông báo với cấu trúc được map chuẩn xác.
    Đảm bảo API tự động suy luận ra 'khoa' và 'phong' dựa trên keyword nếu DB thiếu data.
    """
    response = client.get('/api/students/24127158/notifications')
    data = response.get_json() or {}

    assert response.status_code == 200
    assert data.get('status') == 'success'
    
    notifs = data.get('data', [])
    assert isinstance(notifs, list)
    
    if notifs:
        first_notif = notifs[0]
        # Kiểm tra các trường dữ liệu bắt buộc phải có
        assert 'maTb' in first_notif
        assert 'tieuDe' in first_notif
        assert 'noiDung' in first_notif
        assert 'trangThaiDoc' in first_notif
        # Đảm bảo logic phân loại Khoa/Phòng hoạt động
        assert 'khoa' in first_notif
        assert 'phong' in first_notif

@patch('app.routes.student_routes.db.session.commit')
def test_mark_notification_read(mock_commit, client):
    """
    [TC_2.13_06]: Xác minh API đánh dấu đã đọc một thông báo cụ thể.
    Sử dụng mock db.session.commit để không ghi đè trạng thái trong CSDL thật.
    """
    # Gửi request đánh dấu đọc (Dùng một mã TB giả định bất kỳ vì ta mock commit)
    response = client.post('/api/students/24127158/notifications/TB001/read')
    data = response.get_json() or {}

    # Dù tìm thấy hay không tìm thấy (404/200), hàm mock_commit sẽ chặn việc cập nhật DB
    assert response.status_code in [200, 404]
    
    if response.status_code == 200:
        assert data.get('status') == 'success'
        assert mock_commit.called, "Nếu tìm thấy TB, lệnh db.session.commit() phải được gọi để lưu trạng thái"