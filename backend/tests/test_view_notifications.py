import pytest
from app import db
from app.models.notification import SvThongBao

# Dùng MSSV 24127158 làm chuẩn cho các test case này
TEST_MSSV = "24127158"

def test_tc_2_13_04_get_notifications_list(client):
    """
    [TC_2.13_04]: Verify fetching and structural mapping of the main notifications list.
    """
    response = client.get(f'/api/students/{TEST_MSSV}/notifications')
    data = response.get_json()

    assert response.status_code == 200
    assert data['status'] == 'success'
    
    # DB mẫu có 2 thông báo cho mssv này
    assert len(data['data']) >= 2

    # Check cấu trúc 1 phần tử
    first_notif = data['data'][0]
    assert 'maTb' in first_notif
    assert 'tieuDe' in first_notif
    assert 'noiDung' in first_notif
    assert 'ngayDang' in first_notif
    assert 'trangThaiDoc' in first_notif
    assert 'khoa' in first_notif
    assert 'phong' in first_notif


def test_tc_2_13_05_visual_indicators_unread(client, app):
    """
    [TC_2.13_05]: Verify visual indicators for unread vs. read notifications.
    """
    # Khắc phục lỗi cache DB: Tự động reset TB002 về 0 (chưa đọc) trước khi test
    with app.app_context():
        tb2 = SvThongBao.query.filter_by(mssv=TEST_MSSV, matb='TB002').first()
        if tb2:
            tb2.trangthai_doc = 0
            db.session.commit()

    response = client.get(f'/api/students/{TEST_MSSV}/notifications')
    data = response.get_json()
    assert response.status_code == 200
    
    # Gom dữ liệu lại thành dictionary để dễ check
    notif_dict = {item['maTb']: item['trangThaiDoc'] for item in data['data']}
    
    # Kiểm tra chính xác trạng thái của từng TB
    assert notif_dict.get('TB001') == 1
    assert notif_dict.get('TB002') == 0


def test_tc_2_13_06_mark_as_read_success(client):
    """
    [TC_2.13_06]: Verify "Mark as Read" API integration.
    """
    test_matb = "TB002" 
    
    response = client.post(f'/api/students/{TEST_MSSV}/notifications/{test_matb}/read')
    data = response.get_json()

    assert response.status_code == 200
    assert data['status'] == 'success'
    assert data['message'] == 'Đã cập nhật trạng thái đọc'
    assert 'thoigian_doc' in data


def test_mark_all_notifications_read(client):
    """
    API mở rộng: Đánh dấu tất cả thông báo là đã đọc
    """
    response = client.post(f'/api/students/{TEST_MSSV}/notifications/read-all')
    data = response.get_json()

    assert response.status_code == 200
    assert data['status'] == 'success'
    assert data['message'] in ['Đã đánh dấu đọc tất cả thông báo', 'Không có thông báo nào chưa đọc']