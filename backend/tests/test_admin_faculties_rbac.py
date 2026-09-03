import pytest
from unittest.mock import patch, MagicMock
from app import db
from app.models.student import SinhVien, Khoa, Nganh
from app.routes.admin_routes import resolve_manganh

def test_resolve_manganh_helper(app):
    """
    [TC_2.14_03]: Xác minh Backend helper resolve_manganh ánh xạ đúng text thành mã Ngành.
    """
    with app.app_context():
        if not db.session.get(Khoa, 'TEST_KHOA'):
            db.session.add(Khoa(makhoa='TEST_KHOA', tenkhoa='Khoa Test'))
        if not db.session.get(Nganh, 'TEST_NGANH'):
            db.session.add(Nganh(manganh='TEST_NGANH', tennganh='Ngành Test', makhoa='TEST_KHOA'))
        db.session.commit()

        res1 = resolve_manganh('TEST_NGANH')
        assert res1 == 'TEST_NGANH'

        res2 = resolve_manganh('Ngành Test')
        assert res2 == 'TEST_NGANH'

def test_faculty_admin_data_isolation(app, client):
    """
    [TC_2.14_04]: Xác minh Giáo vụ Khoa chỉ xem được sinh viên Khoa mình (RBAC).
    """
    with app.app_context():
        # 1. Dọn dẹp rác từ lần chạy test trước (nếu có)
        SinhVien.query.filter_by(mssv='999111').delete()
        SinhVien.query.filter_by(mssv='999222').delete()

        # 2. Đảm bảo Khoa & Ngành đã tồn tại mà không bị văng lỗi trùng khóa
        if not db.session.get(Khoa, 'FIT_ISO'):
            db.session.add(Khoa(makhoa='FIT_ISO', tenkhoa='CNTT ISO'))
        if not db.session.get(Khoa, 'CHE_ISO'):
            db.session.add(Khoa(makhoa='CHE_ISO', tenkhoa='Hóa ISO'))
        if not db.session.get(Nganh, 'SE_ISO'):
            db.session.add(Nganh(manganh='SE_ISO', tennganh='KTPM ISO', makhoa='FIT_ISO'))
        if not db.session.get(Nganh, 'CHEM_ISO'):
            db.session.add(Nganh(manganh='CHEM_ISO', tennganh='Hóa học ISO', makhoa='CHE_ISO'))
        
        # 3. Bơm sinh viên test
        sv1 = SinhVien(mssv='999111', hoten='SV Khoa CNTT', manganh='SE_ISO')
        sv2 = SinhVien(mssv='999222', hoten='SV Khoa Hóa', manganh='CHEM_ISO')
        db.session.add_all([sv1, sv2])
        db.session.commit()

        # 4. Mock quyền đăng nhập (Giáo vụ khoa CNTT ISO)
        with patch('app.routes.admin_routes.get_current_admin') as mock_admin:
            mock_admin.return_value = MagicMock(vaitro='Giáo vụ', makhoa='FIT_ISO')

            res = client.get('/api/admin/students')
            assert res.status_code == 200
            
            # 5. Xác minh dữ liệu trả về CHỈ có sinh viên khoa FIT_ISO
            data = res.json['data']
            mssv_list = [s['mssv'] for s in data]
            assert '999111' in mssv_list
            assert '999222' not in mssv_list

def test_faculty_admin_create_student_restriction(app, client):
    """
    [TC_2.14_05]: Xác minh chặn Giáo vụ thêm sinh viên vào ngành thuộc Khoa khác.
    """
    with app.app_context():
        # 1. Đảm bảo Khoa/Ngành có sẵn
        if not db.session.get(Khoa, 'FIT_RES'):
            db.session.add(Khoa(makhoa='FIT_RES', tenkhoa='CNTT RES'))
        if not db.session.get(Nganh, 'SE_RES'):
            db.session.add(Nganh(manganh='SE_RES', tennganh='KTPM RES', makhoa='FIT_RES'))
        db.session.commit()

        # 2. Xóa sinh viên test từ lần chạy trước để có thể test hàm POST
        SinhVien.query.filter_by(mssv='999333').delete()
        db.session.commit()

        # 3. Mock quyền đăng nhập là Giáo vụ khoa HÓA (CHE_RES)
        with patch('app.routes.admin_routes.get_current_admin') as mock_admin:
            mock_admin.return_value = MagicMock(vaitro='Giáo vụ', makhoa='CHE_RES')

            payload = {
                "mssv": "999333",
                "hoTen": "Sinh Viên Test Khác Khoa",
                "nganh": "SE_RES" # Giáo vụ khoa Hóa cố tình thêm SV vào khoa CNTT
            }
            res = client.post('/api/admin/students', json=payload)

            # 4. Xác minh Backend chặn thao tác với mã 403 Forbidden
            assert res.status_code == 403
            assert "thuộc khoa của mình" in res.json["message"]