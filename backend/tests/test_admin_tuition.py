import pytest
from unittest.mock import patch, MagicMock

def test_update_tuition_record_success(app, client):
    """
    [TC_2.23_04_Backend]: Cập nhật mức miễn giảm và ghi chú của 1 môn học phần.
    """
    with app.app_context():
        with patch('app.routes.admin_routes.get_current_admin') as mock_admin, \
             patch('app.routes.admin_routes.SinhVien.query') as mock_sv_query, \
             patch('app.routes.admin_routes.HocPhi.query') as mock_hp_query, \
             patch('app.routes.admin_routes.db.session') as mock_db:

            mock_admin.return_value = MagicMock(vaitro='SuperAdmin', makhoa=None)
            mock_sv_query.filter_by.return_value.first.return_value = MagicMock(mssv="24127001")
            
            # Mock HocPhi record
            hp_record = MagicMock(hocphi_goc=5000000.0, mucgiam=0.0)
            mock_hp_query.filter_by.return_value.first.return_value = hp_record

            payload = {
                "mucGiam": 1000000.0,
                "hocPhiGoc": 5000000.0,
                "trangThai": "Chưa thanh toán",
                "ghiChu": "Học bổng khoa"
            }
            
            res = client.put('/api/admin/tuition/records/24127001/HP01', json=payload, headers={"X-Admin-Email": "admin@test.com"})

            assert res.status_code == 200
            assert res.json["status"] == "success"
            # Kiểm tra gán trị giá trị
            assert hp_record.mucgiam == 1000000.0
            assert hp_record.thucdong == 4000000.0 # 5tr - 1tr
            assert hp_record.ghichu == "Học bổng khoa"
            assert mock_db.commit.called

def test_pay_all_tuition_success(app, client):
    """
    [TC_2.23_05_Backend]: Xác nhận "Thu tiền" sẽ chuyển đổi toàn bộ môn đang chờ thành "Đã thanh toán".
    """
    with app.app_context():
        with patch('app.routes.admin_routes.get_current_admin') as mock_admin, \
             patch('app.routes.admin_routes.SinhVien.query') as mock_sv_query, \
             patch('app.routes.admin_routes.HocPhi.query') as mock_hp_query, \
             patch('app.routes.admin_routes.db.session') as mock_db:

            mock_admin.return_value = MagicMock(vaitro='SuperAdmin', makhoa=None)
            mock_sv_query.filter_by.return_value.first.return_value = MagicMock(mssv="24127001")
            
            # Trả về 2 record chưa đóng
            hp1 = MagicMock(trangthai_thanhtoan="Chưa thanh toán")
            hp2 = MagicMock(trangthai_thanhtoan="Chưa thanh toán")
            mock_hp_query.filter_by.return_value.all.return_value = [hp1, hp2]

            res = client.post('/api/admin/tuition/students/24127001/pay', headers={"X-Admin-Email": "admin@test.com"})

            assert res.status_code == 200
            assert res.json["status"] == "success"
            # Kiểm tra trạng thái đã được đổi
            assert hp1.trangthai_thanhtoan == "Đã thanh toán"
            assert hp2.trangthai_thanhtoan == "Đã thanh toán"
            assert mock_db.commit.called