import pytest
from unittest.mock import patch, MagicMock
from app import db
from app.models.student import SinhVien, NguoiThan

def test_admin_api_update_student_details(app, client):
    """
    [TC_2.19_05_BE]: Xác minh API cho phép Admin cập nhật hồ sơ sinh viên và gia đình.
    """
    with app.app_context():
        # Dọn dẹp rác và bơm 1 sinh viên vào Database
        SinhVien.query.filter_by(mssv='999000').delete()
        NguoiThan.query.filter_by(mssv='999000').delete()
        
        sv = SinhVien(mssv='999000', hoten='Tên Cũ', dienthoai='000')
        db.session.add(sv)
        db.session.commit()

        # Payload gửi từ React (có kèm thông tin family)
        payload = {
            "mssv": "999000",
            "hoTen": "Tên Đã Cập Nhật",
            "sdt": "0987654321",
            "family": [
                {
                    "name": "Người Thân 1",
                    "rel": "Mẹ",
                    "phone": "0123"
                }
            ]
        }

        # Mock bypass middleware của Admin
        with patch('app.routes.admin_routes.get_current_admin') as mock_admin:
            mock_admin.return_value = MagicMock(vaitro='Giáo vụ')

            # Gọi API PUT cập nhật
            res = client.put('/api/admin/students/999000', json=payload)
            assert res.status_code == 200
            assert "thành công" in res.json.get('message', '')

        # Kiểm tra dữ liệu dưới Database đã đổi chưa
        sv_db = SinhVien.query.get('999000')
        assert sv_db.hoten == 'Tên Đã Cập Nhật'
        assert sv_db.dienthoai == '0987654321'

        # Kiểm tra danh sách người thân đã được insert vào DB chưa
        family_db = NguoiThan.query.filter_by(mssv='999000').all()
        assert len(family_db) == 1
        assert family_db[0].hoten == 'Người Thân 1'
        assert family_db[0].quanhe == 'Mẹ'