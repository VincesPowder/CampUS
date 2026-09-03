import pytest
from unittest.mock import patch, MagicMock
from app import db
from app.models.academic import HocKyNamHoc, NhomHocPhan, MonHoc, LopHocPhan

def test_faculty_admin_course_isolation(app, client):
    """
    [TC_2.16_02]: Xác minh Giáo vụ Khoa (Faculty Admin) chỉ xem được danh sách Môn học của Khoa mình.
    """
    with app.app_context():
        # 1. Bơm dữ liệu nháp
        if not db.session.get(HocKyNamHoc, 'HK1_25-26'):
            db.session.add(HocKyNamHoc(ma_hocky='HK1_25-26', ten_hocky='HK1', namhoc='25-26'))
        if not db.session.get(NhomHocPhan, 'CS_TEST'):
            db.session.add(NhomHocPhan(manhom='CS_TEST', tennhom='Cơ sở'))
        
        # Môn 1 thuộc CNTT (Bắt đầu bằng FIT)
        m1 = MonHoc(mamh='FIT101', tenmh='Cấu trúc dữ liệu Test', manhom='CS_TEST', sotc=4)
        lhp1 = LopHocPhan(malhp='LHP_FIT_TEST', mamh='FIT101', ma_hocky='HK1_25-26')
        
        # Môn 2 thuộc Hóa (Bắt đầu bằng CHE)
        m2 = MonHoc(mamh='CHE101', tenmh='Hóa đại cương Test', manhom='CS_TEST', sotc=3)
        lhp2 = LopHocPhan(malhp='LHP_CHE_TEST', mamh='CHE101', ma_hocky='HK1_25-26')

        db.session.add_all([m1, lhp1, m2, lhp2])
        db.session.commit()

        # 2. Mock quyền đăng nhập (Giáo vụ khoa CNTT -> G.makhoa = 'FIT')
        with patch('app.routes.admin_routes.get_current_admin') as mock_admin:
            mock_admin.return_value = MagicMock(vaitro='Giáo vụ', makhoa='FIT')

            # 3. Gọi API lấy danh sách Môn học
            res = client.get('/api/admin/academic/courses')
            assert res.status_code == 200
            
            data = res.json['data']
            ma_mon_list = [c['maMon'] for c in data]
            
            # 4. Xác minh API trả về Môn CNTT và LỌC BỎ môn Hóa
            assert 'FIT101' in ma_mon_list
            assert 'CHE101' not in ma_mon_list