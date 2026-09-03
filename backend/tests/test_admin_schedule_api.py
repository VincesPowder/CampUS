import pytest
from unittest.mock import patch, MagicMock
from app import db
from app.models.schedule import LichHoc
from app.models.academic import LopHocPhan, MonHoc

def test_admin_api_create_class_schedule(app, client):
    """
    [TC_2.22_03_BE]: Xác minh API POST /api/admin/schedule/classes nhận payload và lưu Lịch học.
    """
    with app.app_context():
        # 1. Bơm môn học và lớp học phần nháp để tránh lỗi Foreign Key
        if not db.session.get(MonHoc, 'TEST_MH'):
            db.session.add(MonHoc(mamh='TEST_MH', tenmh='Môn Test API', sotc=3))
        if not db.session.get(LopHocPhan, 'TEST_LHP'):
            db.session.add(LopHocPhan(malhp='TEST_LHP', mamh='TEST_MH', tenlop='24TEST'))
        db.session.commit()

        # 2. Payload Lịch học
        payload = {
            "malhp": "TEST_LHP",
            "thu": "Thứ ba",
            "gio": "07:30",
            "phong": "F.102",
            "tuan": "1-15",
            "hinhThuc": "Trực tiếp"
        }

        # 3. Giả lập quyền Admin (SuperAdmin) để pass qua @faculty_required
        with patch('app.routes.admin_routes.get_current_admin') as mock_admin:
            mock_admin.return_value = MagicMock(vaitro='SuperAdmin', makhoa=None)
            
            # Gọi API
            res = client.post('/api/admin/schedule/classes', json=payload)
            
        assert res.status_code == 201
        assert res.json['status'] == 'success'
        assert "Thêm lịch học thành công" in res.json['message']
        
        # 4. Xác minh bản ghi đã thực sự được tạo dưới SQLite
        lh = LichHoc.query.filter_by(malhp='TEST_LHP').first()
        assert lh is not None
        assert lh.phonghoc == "F.102"
        assert lh.thu == "Thứ ba"

def test_admin_api_delete_class_schedule(app, client):
    """
    [TC_2.22_05_BE]: Xác minh API DELETE /api/admin/schedule/classes/<id> xóa Lịch học thành công.
    """
    with app.app_context():
        # 1. Tìm lịch học vừa tạo ở test trên, hoặc tạo mới nếu chạy độc lập
        lh = LichHoc.query.filter_by(malhp='TEST_LHP').first()
        if not lh:
            lh = LichHoc(malichhoc='LH_TEST_DEL', malhp='TEST_LHP')
            db.session.add(lh)
            db.session.commit()
            
        malichhoc = lh.malichhoc

        # 2. Giả lập quyền Admin gọi API xóa
        with patch('app.routes.admin_routes.get_current_admin') as mock_admin:
            mock_admin.return_value = MagicMock(vaitro='SuperAdmin', makhoa=None)
            res = client.delete(f'/api/admin/schedule/classes/{malichhoc}')
        
        assert res.status_code == 200
        assert res.json['status'] == 'success'
        assert "Đã xóa lịch học" in res.json['message']
        
        # 3. Xác minh đã bay màu khỏi database
        deleted_lh = LichHoc.query.filter_by(malichhoc=malichhoc).first()
        assert deleted_lh is None