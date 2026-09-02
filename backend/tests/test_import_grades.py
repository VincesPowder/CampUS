import io
import pytest
from app import create_app, db
from app.models.academic import MonHoc, LopHocPhan, KetQuaHocTap, HocKyNamHoc
from app.models.student import SinhVien
from app.models.user import User

@pytest.fixture
def client():
    app = create_app()
    with app.test_client() as client:
        with app.app_context():
            db.create_all()
            yield client
            db.session.remove()
            db.drop_all()

def setup_mock_data():
    """Tạo dữ liệu giả lập cho các bài test import grades."""
    
    hk = HocKyNamHoc(ma_hocky="HK1_2024", ten_hocky="Học kỳ 1", namhoc="2024-2025")
    db.session.add(hk)

    mh = MonHoc(mamh="MH01", tenmh="Cơ sở dữ liệu", sotc=4)
    db.session.add(mh)
    
    # 1. TẠO MÔN HỌC Ở TRẠNG THÁI "ĐANG CHỜ NỘP ĐIỂM" (Cho TC_05 Lưu nháp)
    # Theo model, trangthai mặc định đã là 'pending' (Đang chờ)
    lhp_pending = LopHocPhan(malhp="LHP01", mamh="MH01", tenlop="24KTPM_1", ma_hocky="HK1_2024", trangthai="pending")
    db.session.add(lhp_pending)
    
    # 2. TẠO MÔN HỌC Ở TRẠNG THÁI "ĐÃ TẢI LÊN" (Cho TC_01 Tìm nút Import)
    # Bạn thay 'uploaded' bằng chuỗi trạng thái đúng trong DB của bạn nhé
    lhp_uploaded = LopHocPhan(malhp="LHP02", mamh="MH01", tenlop="24KTPM_2", ma_hocky="HK1_2024", trangthai="uploaded")
    db.session.add(lhp_uploaded)
    
    # Tạo sinh viên cho cả 2 lớp
    sv = SinhVien(mssv="24127001", hoten="Nguyễn Văn A")
    db.session.add(sv)
    
    kq1 = KetQuaHocTap(mssv="24127001", malhp="LHP01")
    kq2 = KetQuaHocTap(mssv="24127001", malhp="LHP02")
    db.session.add_all([kq1, kq2])
    
    # User admin
    admin = User(email="admin_test@hcmus.edu.vn", name="Admin Test")
    db.session.add(admin)
    
    db.session.commit()

def test_tc_2_20_02_csv_format_validation(client):
    """[TC_2.20_02]: Bắt lỗi file sai định dạng"""
    with client.application.app_context():
        setup_mock_data()

    data = {'file': (io.BytesIO(b"Not a valid CSV content"), 'grades.txt')}
    headers = {"X-Admin-Email": "admin_test@hcmus.edu.vn"}

    response = client.post(
        '/api/admin/academic/courses/LHP01/import-grades', 
        data=data, 
        content_type='multipart/form-data', 
        headers=headers
    )

    assert response.status_code in [400]

def test_tc_2_20_01_import_valid_csv(client):
    """[TC_2.20_01]: Import thành công file CSV hợp lệ"""
    with client.application.app_context():
        setup_mock_data()
        
    csv_content = "STT,MSSV,Họ và tên,GK (30%),CK (60%),Tổng kết,Kết quả,Ghi chú\n1,24127001,Nguyễn Văn A,8.0,9.0,,,"
    data = {'file': (io.BytesIO(csv_content.encode('utf-8-sig')), 'grades.csv')}
    headers = {"X-Admin-Email": "admin_test@hcmus.edu.vn"}
    
    response = client.post(
        '/api/admin/academic/courses/LHP01/import-grades', 
        data=data, 
        content_type='multipart/form-data', 
        headers=headers
    )
    
    assert response.status_code in [200]