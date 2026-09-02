import pytest
import io
from app import db
from app.models.academic import LopHocPhan, KetQuaHocTap
from app.models.student import SinhVien

def setup_mock_data():
    if not SinhVien.query.filter_by(mssv='24127001').first():
        db.session.add(SinhVien(mssv='24127001', hoten='Nguyễn Văn An'))
    if not LopHocPhan.query.filter_by(malhp='LHP01').first():
        db.session.add(LopHocPhan(malhp='LHP01', trangthai='uploaded'))
    db.session.commit()

def test_tc_2_20_02_csv_format_validation(client):
    """[TC_2.20_02]: Bắt lỗi file sai định dạng"""
    with client.application.app_context():
        setup_mock_data()

    data = { 'file': (io.BytesIO(b"Dummy txt"), 'grades.txt') }
    headers = {"X-Admin-Email": "admin_test@hcmus.edu.vn"}
    
    response = client.post('/api/admin/academic/courses/LHP01/import-grades', data=data, content_type='multipart/form-data', headers=headers)
    
    assert response.status_code == 400
    assert 'định dạng file sai' in response.get_json()['message'].lower()

def test_tc_2_20_07_backend_grade_calculation(client):
    """[TC_2.20_07]: Backend tự tính điểm tổng kết"""
    with client.application.app_context():
        setup_mock_data()

    payload = {"diemCC": 5.0, "diemGK": 6.0, "diemCK": 7.0, "ghiChu": "Import"}
    headers = {"X-Admin-Email": "admin_test@hcmus.edu.vn"}
    
    response = client.put('/api/admin/academic/courses/LHP01/grades/24127001', json=payload, headers=headers)
    
    assert response.status_code == 200
    assert response.get_json()['status'] == 'success'