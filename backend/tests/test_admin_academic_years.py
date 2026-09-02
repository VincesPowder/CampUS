import pytest
from app import db
from app.models.academic import HocKyNamHoc

def test_create_academic_year(app, client):
    """
    [TC_2.15_03]: Xác minh tạo năm học mới sẽ tự động sinh nhiều records Học Kỳ.
    """
    with app.app_context():
        # Xóa rác nếu có
        HocKyNamHoc.query.filter_by(namhoc='99-00').delete()
        db.session.commit()

        payload = {
            "id": "99-00",
            "label": "2099-2100",
            "ngayBatDau": "01/09/2099",
            "ngayKetThuc": "31/08/2100",
            "soHocKy": 3,
            "status": "open"
        }

        # Bắn API tạo
        res = client.post('/api/admin/academic/years', json=payload)
        assert res.status_code == 201

        # Xác minh trong CSDL đã tự động tách ra làm 3 record: HK1, HK2, HK3
        hks = HocKyNamHoc.query.filter_by(namhoc='99-00').order_by(HocKyNamHoc.ma_hocky).all()
        assert len(hks) == 3
        assert hks[0].ma_hocky == "HK1_99-00"
        assert hks[1].ma_hocky == "HK2_99-00"
        assert hks[2].ma_hocky == "HK3_99-00"
        assert hks[0].trangthai == "open"


def test_update_academic_year_status(app, client):
    """
    [TC_2.15_04]: Xác minh cập nhật trạng thái Năm học sẽ áp dụng cho tất cả Học Kỳ bên trong.
    """
    with app.app_context():
        # Tạo dữ liệu giả lập
        if not db.session.get(HocKyNamHoc, 'HK1_88-89'):
            db.session.add(HocKyNamHoc(ma_hocky='HK1_88-89', ten_hocky='Học kỳ 1', namhoc='88-89', trangthai='open'))
            db.session.add(HocKyNamHoc(ma_hocky='HK2_88-89', ten_hocky='Học kỳ 2', namhoc='88-89', trangthai='open'))
            db.session.commit()

        payload = {
            "status": "closed"
        }

        # Bắn API cập nhật
        res = client.put('/api/admin/academic/years/88-89', json=payload)
        assert res.status_code == 200

        # Xác minh trong DB toàn bộ HK của năm học này đã bị đóng
        hk1 = db.session.get(HocKyNamHoc, 'HK1_88-89')
        hk2 = db.session.get(HocKyNamHoc, 'HK2_88-89')
        
        assert hk1.trangthai == "closed"
        assert hk2.trangthai == "closed"