import pytest
from unittest.mock import patch, MagicMock

def test_create_admin_notification_success(app, client):
    """
    [TC_2.25_03_Backend]: Verify Publish Announcement execution and database distribution.
    Xác minh API tạo thông báo thành công và phân phối tới toàn bộ sinh viên bằng app_context.
    """
    with app.app_context():
        # Dùng patch để mock Authentication, Query Sinh viên và hàm lưu Database
        with patch('app.routes.admin_routes.get_current_admin') as mock_admin, \
             patch('app.routes.admin_routes.SinhVien.query') as mock_sv_query, \
             patch('app.routes.admin_routes.db.session') as mock_db:

            # 1. Mock Admin đăng nhập là SuperAdmin (Toàn quyền trường)
            admin_mock = MagicMock()
            admin_mock.vaitro = 'SuperAdmin'
            admin_mock.makhoa = None
            mock_admin.return_value = admin_mock

            # 2. Mock CSDL trả về danh sách có 2 sinh viên
            sv1 = MagicMock(mssv="24127001")
            sv2 = MagicMock(mssv="24127002")
            mock_sv_query.all.return_value = [sv1, sv2]

            # 3. Gửi Request POST tạo thông báo
            payload = {
                "title": "Thông báo Khẩn cấp",
                "content": "Sinh viên nghỉ học do bão.",
                "department": "Phòng Đào tạo"
            }
            response = client.post('/api/admin/notifications', json=payload, headers={"X-Admin-Email": "admin@test.com"})

            # 4. Xác minh kết quả trả về
            assert response.status_code == 201
            assert response.json["status"] == "success"
            assert "id" in response.json
            
            # 5. Xác minh thao tác ghi DB
            # Phải có 3 lần gọi db.session.add():
            # - 1 lần tạo bảng ThongBao
            # - 2 lần phân phối vào bảng SvThongBao cho 2 sinh viên giả lập ở trên
            assert mock_db.add.call_count == 3
            assert mock_db.commit.called