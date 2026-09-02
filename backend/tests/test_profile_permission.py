import pytest
from datetime import datetime, timedelta
from app import db
from app.models.student import SinhVien, DotCapNhatHoSo

def test_admin_get_and_set_permission(app, client):
    """
    [TC_2.17_01 & 03]: Xác minh API Admin lấy và cập nhật cấu hình đợt cập nhật hồ sơ.
    """
    with app.app_context():
        # 1. Gọi API cấu hình bật đợt
        payload = {
            "enabled": True,
            "from": "2026-01-01",
            "to": "2026-12-31"
        }
        res_post = client.post('/api/admin/profile-edit-permission', json=payload)
        assert res_post.status_code == 200

        # 2. Gọi GET để kiểm tra dữ liệu đã lưu
        res_get = client.get('/api/admin/profile-edit-permission')
        assert res_get.status_code == 200
        data = res_get.json['data']
        assert data['enabled'] is True
        assert data['from'] == "2026-01-01"
        assert data['to'] == "2026-12-31"


def test_student_update_restricted_when_period_closed(app, client):
    """
    [TC_2.17_05 - Part 1]: Chặn sinh viên cập nhật khi đợt bị ĐÓNG (403 Forbidden).
    """
    with app.app_context():
        # Chuẩn bị sinh viên test
        SinhVien.query.filter_by(mssv='999888').delete()
        db.session.add(SinhVien(mssv='999888', hoten='Test SinhVien'))

        # Đảm bảo tắt mọi đợt cập nhật
        DotCapNhatHoSo.query.delete()
        dot_closed = DotCapNhatHoSo(
            madot="DOT_TEST_OFF",
            tendot="Đợt đã đóng",
            thoigian_batdau=datetime.now() - timedelta(days=10),
            thoigian_ketthuc=datetime.now() + timedelta(days=10),
            trangthai_mo=0  # Đã tắt
        )
        db.session.add(dot_closed)
        db.session.commit()

        # Gọi API cập nhật thông tin
        payload = {"phone": "0909123456"}
        res = client.put('/api/students/999888/update', json=payload)

        assert res.status_code == 403
        assert "Thời gian cập nhật hồ sơ đã kết thúc" in res.json.get('error', '')


def test_student_update_allowed_when_period_active(app, client):
    """
    [TC_2.17_05 - Part 2]: Cho phép sinh viên cập nhật khi đợt đang MỞ và còn hạn (200 OK).
    """
    with app.app_context():
        # Chuẩn bị sinh viên test
        if not SinhVien.query.filter_by(mssv='999888').first():
            db.session.add(SinhVien(mssv='999888', hoten='Test SinhVien'))

        # Mở đợt cập nhật có hiệu lực
        DotCapNhatHoSo.query.delete()
        dot_active = DotCapNhatHoSo(
            madot="DOT_TEST_ON",
            tendot="Đợt đang mở",
            thoigian_batdau=datetime.now() - timedelta(days=1),
            thoigian_ketthuc=datetime.now() + timedelta(days=5),
            trangthai_mo=1  # Đang bật
        )
        db.session.add(dot_active)
        db.session.commit()

        # Gọi API cập nhật thông tin
        payload = {
            "currentAddress": "123 Đường Test, TP.HCM",
            "phone": "0988776655",
            "personalEmail": "test@gmail.com"
        }
        res = client.put('/api/students/999888/update', json=payload)

        assert res.status_code == 200
        assert "thành công" in res.json.get('message', '')

        # Kiểm tra dữ liệu thực sự được cập nhật trong DB
        sv = SinhVien.query.get('999888')
        assert sv.dienthoai == "0988776655"
        assert sv.dchiennay == "123 Đường Test, TP.HCM"