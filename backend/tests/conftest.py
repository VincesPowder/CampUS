import pytest
import sqlite3
import os
import sys

# --- FIX LỖI "No module named 'app'" ---
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)
# ---------------------------------------

from app import create_app

@pytest.fixture(scope="session")
def app():
    """Tạo phiên bản Flask App cho test"""
    app = create_app()
    app.config.update({
        "TESTING": True,
    })
    yield app

@pytest.fixture()
def client(app):
    return app.test_client()

@pytest.fixture(autouse=True)
def mock_db_path(monkeypatch, tmp_path):
    """
    Dùng tmp_path của Pytest để tạo ra 1 file DB riêng biệt cho MỖI test case.
    Sẽ không bao giờ bị lỗi trùng data hay Windows khóa file nữa.
    """
    # Pytest tự sinh ra đường dẫn file ngẫu nhiên trong thư mục tạm
    test_db_path = str(tmp_path / "test_campus_temp.db")
    
    # 1. TẠO FILE DB NHÁP
    conn = sqlite3.connect(test_db_path)
    cursor = conn.cursor()
    
    # 2. TẠO BẢNG ADMIN VÀ BƠM DATA
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS ADMIN_GIAOVU (
            MAGV TEXT PRIMARY KEY, HOTEN TEXT, EMAIL TEXT, VAITRO TEXT, MAKHOA TEXT, TRANGTHAI INTEGER
        )
    ''')
    cursor.execute("INSERT INTO ADMIN_GIAOVU (MAGV, HOTEN, EMAIL, VAITRO, MAKHOA, TRANGTHAI) VALUES ('GVU001', 'Đỗ Thành Vinh', '24127262@student.hcmus.edu.vn', 'Giáo vụ', 'CSC', 1)")
    cursor.execute("INSERT INTO ADMIN_GIAOVU (MAGV, HOTEN, EMAIL, VAITRO, MAKHOA, TRANGTHAI) VALUES ('GVU002', 'Tạ Mai Như Ngọc', '24127465@student.hcmus.edu.vn', 'Giáo vụ', 'MTH', 1)")
    
    # 3. TẠO BẢNG SINH VIÊN VÀ BƠM DATA
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS SINHVIEN (
            MSSV TEXT PRIMARY KEY, HOTEN TEXT, LOAISV TEXT, NGAYSINH TEXT, NOISINH TEXT, 
            GIOITINH TEXT, NIENKHOA TEXT, BACDAOTAO TEXT, LOAIDAOTAO TEXT, CCCD TEXT, 
            NGAYCAP TEXT, NOICAP TEXT, QUOCTICH TEXT, DANTOC TEXT, TONGIAO TEXT, 
            DCTHUONGTRU TEXT, DIENTHOAI TEXT, MAILCANHAN TEXT, DCHIENNAY TEXT, 
            NGAYVAODOAN TEXT, NGAYVAODANG TEXT, MAILTRUONG TEXT, SOTHENH TEXT, 
            TENNH TEXT, NGUOILIENLAC TEXT, DCLIENLAC TEXT, SDTLIENLAC TEXT, 
            MAILLIENLAC TEXT, QUANHE_NLL TEXT, MANGANH TEXT, MACN TEXT, AVATAR TEXT
        )
    ''')
    cursor.execute("""
        INSERT INTO SINHVIEN (MSSV, HOTEN, LOAISV, NGAYSINH, NOISINH, GIOITINH, NIENKHOA, BACDAOTAO, LOAIDAOTAO, CCCD, NGAYCAP, NOICAP, QUOCTICH, DANTOC, TONGIAO, DCTHUONGTRU, DIENTHOAI, MAILCANHAN, DCHIENNAY, NGAYVAODOAN, NGAYVAODANG, MAILTRUONG, SOTHENH, TENNH, NGUOILIENLAC, DCLIENLAC, SDTLIENLAC, MAILLIENLAC, QUANHE_NLL, MANGANH, MACN, AVATAR) VALUES 
        ('24001001', 'Nguyễn Văn An', 'Sinh viên (Đang học)', '2006-01-10', 'TP.HCM', 'Nam', '2024', 'Cử nhân', 'TCTA', '0792050001', '2023-03-12', 'Cục Cảnh sát quản lý hành chính về trật tự xã hội', 'Việt Nam', 'Kinh', 'Không', 'Quận 1, TP.HCM', '0901234501', 'an.ng@gmail.com', 'Quận 1, TP.HCM', '2021-03-26', NULL, '24001001@student.hcmus.edu.vn', '10111001', 'Vietcombank', 'Nguyễn Hữu B', 'Quận 1, TP.HCM', '0911234501', NULL, 'Cha', '7480201_DKD', NULL, NULL),
        ('24001002', 'Trần Thị Bảo', 'Sinh viên (Đang học)', '2006-02-15', 'Hà Nội', 'Nữ', '2024', 'Cử nhân', 'TCTA', '0792050002', '2023-03-12', 'Cục QLHC', 'Việt Nam', 'Kinh', 'Không', 'Quận 3, TP.HCM', '0901234502', 'bao.tr@gmail.com', 'Quận 3, TP.HCM', '2021-03-26', NULL, '24001002@student.hcmus.edu.vn', '10111002', 'Vietcombank', 'Trần Văn C', 'Quận 3, TP.HCM', '0911234502', NULL, 'Cha', '7480201_DKD', NULL, NULL),
        ('24001003', 'Lê Văn Cường', 'Sinh viên (Đang học)', '2006-03-20', 'Đà Nẵng', 'Nam', '2024', 'Cử nhân', 'TCTA', '0792050003', '2023-03-15', 'Cục QLHC', 'Việt Nam', 'Kinh', 'Không', 'Quận 5, TP.HCM', '0901234503', 'cuong.le@gmail.com', 'Quận 5, TP.HCM', '2021-03-31', NULL, '24001003@student.hcmus.edu.vn', '10111003', 'Vietcombank', 'Lê Thị D', 'Quận 5, TP.HCM', '0911234503', NULL, 'Mẹ', '7480201_DKD', NULL, NULL),
        ('24001004', 'Phạm Thị Dung', 'Sinh viên (Đang học)', '2006-04-25', 'Cần Thơ', 'Nữ', '2024', 'Cử nhân', 'TCTA', '0792050004', '2023-05-12', 'Cục QLHC', 'Việt Nam', 'Kinh', 'Không', 'Quận 7, TP.HCM', '0901234504', 'dung.ph@gmail.com', 'Quận 7, TP.HCM', '2021-04-26', NULL, '24001004@student.hcmus.edu.vn', '10111004', NULL, 'Phạm VĂn E', 'Quận 7, TP.HCM', '0911234504', NULL, 'Cha', '7480201_DKD', NULL, NULL),
        ('24001005', 'Hoàng Văn E', 'Sinh viên (Đang học)', '2006-05-30', 'Hải Phòng', 'Nam', '2024', 'Cử nhân', 'TCTA', '0792050005', '2023-09-21', 'Cục QlHC', 'Việt Nam', 'Kinh', 'Thiên Chúa Giáo', 'Quận 10, TP.HCM', '0901234505', 'em.ho@gmail.com', 'Quận 10, TP.HCM', '2021-04-16', NULL, '24001005@student.hcmus.edu.vn', NULL, NULL, 'Hoàng Thị F', 'Quận 10, TP.HCM', '0911234505', NULL, 'Mẹ', '7480201_DKD', NULL, NULL),
        ('24001006', 'Đặng Thị Phương', 'Sinh viên (Đang học)', '2006-06-05', 'Đồng Nai', 'Nữ', '2024', 'Cử nhân', 'TCTA', '0792050006', '2023-08-17', 'Cục QLHC', 'Việt Nam', 'Kinh', 'Không', 'Gò Vấp, TP.HCM', '0901234506', 'phuong.da@gmail.com', 'Gò Vấp, TP.HCM', '2021-05-12', NULL, '24001006@student.hcmus.edu.vn', NULL, NULL, 'Đặng Văn G', 'Gò Vấp. TP.HCM', '0911234506', NULL, 'Cha', '7480201_DKD', NULL, NULL),
        ('24001007', 'Vũ Văn Giang', 'Sinh viên (Đang học)', '2006-07-10', 'Bình Dương', 'Nam', '2024', 'Cử nhân', 'TCTA', '0792050007', '2023-04-25', 'Cục QLHC', 'Việt Nam', 'Kinh', 'Phật Giáo', 'Tân Bình, TP.HCM', '0901234507', 'giang.vu@gmail.com', 'Tân Bình, TP.HCM', '2021-06-26', NULL, '24001007@student.hcmus.edu.vn', '10111007', 'ACB', 'Vũ Thị H', 'Tân Bình, TP.HCM', '0911234507', NULL, 'Mẹ', '7480201_DKD', NULL, NULL),
        ('24001008', 'Võ Thị Hoa', 'Sinh Viên (Bảo lưu)', '2006-08-15', 'Long An', 'Nữ', '2024', 'Cử nhân', 'TCTA', '0792050008', '2023-03-16', 'Cục QLHC', 'Việt Nam', 'Kinh', 'Không', 'Bình Tân, TP.HCM', '0901234508', 'hoa.vo@gmail.com', 'Bình Tân, TP.HCM', '2021-05-14', NULL, '24001008@student.hcmus.edu.vn', '10111008', 'Techcombank', 'Vũ Văn I', 'Bình Tân, TP.HCM', '0911234508', NULL, 'Cha', '7480201_DKD', NULL, NULL),
        ('24001009', 'Phan Văn Inh', 'Sinh viên (Đang học)', '2006-02-12', 'Bến Tre', 'Nam', '2024', 'Cử nhân', 'TCTA', '0792050009', '2023-01-23', 'Cục QLHC', 'Việt Nam', 'Kinh', 'Không', 'Phú Nhuận, TP.HCM', '0901234509', 'inh.ph@gmail.com', 'Phú Nhuận, TP.HCM', '2021-09-12', NULL, '24001009@student.hcmus.edu.vn', NULL, NULL, 'Phan Thị K', 'Phú Nhuận, TP.HCM', '0911234509', NULL, 'Mẹ', '7480201_DKD', NULL, NULL),
        ('24001010', 'Trương Thị Kim', 'Sinh viên (Đang học)', '2006-10-25', 'Tiền Giang', 'Nữ', '2024', 'Cử nhân', 'TCTA', '0792050010', '2023-04-19', 'Cục QLHC', 'Việt Nam', 'Kinh', 'Không', 'Bình Thạnh, TP.HCM', '0901234510', 'kim.tr@gmail.com', 'Bình Thạnh, TP.HCM', '2021-07-23', NULL, '24001010@student.hcmus.edu.vn', NULL, NULL, 'Trương Văn L', 'Bình Thạnh, TP.HCM', '0911234510', NULL, 'Cha', '7480201_DKD', NULL, NULL),
        ('24001011', 'Bùi Văn Lâm', 'Sinh viên (Đang học)', '2006-01-12', 'Vĩnh Long', 'Nam', '2024', 'Cử nhân', 'TCTA', '0792050011', '2023-05-30', 'Cục QLHC', 'Việt Nam', 'Kinh', 'Cao Đài', 'Tân Phú, Việt Nam', '0901234511', 'lam.bu@gmail.com', 'Tân Phú, TP.HCM', '2021-09-12', NULL, '24001011@student.hcmus.edu.vn', '10111011', 'MBBank', 'Bùi Thị M', 'Tân Phú, TP.HCM', '0911234511', NULL, 'Mẹ', '7480201_DKD', NULL, NULL),
        ('24001012', 'Đỗ Thị Mai', 'Sinh viên (Đang học)', '2006-12-05', 'Cà Mau', 'Nữ', '2024', 'Cử nhân', 'TCTA', '0792050012', '2023-06-12', 'Cục QLHC', 'Việt Nam', 'Kinh', 'Không', 'Quận 12, TP.HCM', '0901234512', 'mai.do@gmail.com', 'Quận 12, TP.HCM', '2021-03-09', NULL, '24001012@student.hcmus.edu.vn', NULL, NULL, 'Đỗ Văn N', 'Quận 12, TP.HCM', '0911234512', NULL, 'Cha', '7480201_DKD', NULL, NULL),
        ('24001013', 'Hồ Văn Nam', 'Sinh viên (Đang học)', '2006-06-18', 'Bạc Liêu', 'Nam', '2024', 'Cử nhân', 'TCTA', '0792050013', '2023-09-16', 'Cục QLHC', 'Việt Nam', 'Kinh', 'Không', 'Thủ Đức, TP.HCM', '0901234513', 'nam.ho@gmail.com', 'Thủ Đức, TP.HCM', '2021-07-23', NULL, '24001013@student.hcmus.edu.vn', NULL, NULL, 'Hồ Thị O', 'Thủ Đức, TP.HCM', '0911234513', NULL, 'Mẹ', '7480201_DKD', NULL, NULL),
        ('24001014', 'Ngô Thị Oanh', 'Sinh viên (Đang học)', '2006-07-18', 'Kiên Giang', 'Nữ', '2024', 'Cử nhân', 'TCTA', '0792050014', '2023-10-23', 'Cục QLHC', 'Việt Nam', 'Kinh', 'Không', 'Quận 4, TP.HCM', '0901234514', 'oanh.ng@gmail.com', 'Quận 4, TP.HCM', '2021-04-26', NULL, '24001014@student.hcmus.edu.vn', NULL, NULL, 'Ngô Văn P', 'Quận 4, TP.HCM', '0911234514', NULL, 'Cha', '7480201_DKD', NULL, NULL),
        ('24001015', 'Dương Văn Phát', 'Sinh viên (Đang học)', '2006-12-23', 'An Giang', 'Nam', '2024', 'Cử nhân', 'TCTA', '0792050015', '2023-04-16', 'Cục QLHC', 'Việt Nam', 'Kinh', 'Phật Giáo', 'Quận 6, TP.HCM', '0901234515', 'phat.du@gmail.com', 'Quận 6, TP.HCM', '2021-06-19', NULL, '24001015@student.hcmus.edu.vn', '10111015', 'Sacombank', 'Dương Thị Q', 'Quận 6, TP.HCM', '0911234515', NULL, 'Mẹ', '7480201_DKD', NULL, NULL),
        ('24001016', 'Lê Thị Quỳnh', 'Sinh viên (Đang học)', '2006-07-31', 'Sóc Trăng', 'Nữ', '2024', 'Cử nhân', 'TCTA', '0792050016', '2023-08-19', 'Cục QLHC', 'Việt Nam', 'Kinh', 'Không', 'Quận 8, TP.HCM', '0901234516', 'quynh.ly@gmail.com', 'Quận 8, TP.HCM', '2021-03-15', NULL, '24001016@student.hcmus.edu.vn', '10111016', 'ACB', 'Lý Văn R', 'Quận 8, TP.HCM', '0911234516', NULL, 'Cha', '7480201_DKD', NULL, NULL),
        ('24001017', 'Phạm Văn Rạng', 'Sinh viên (Đang học)', '2006-02-19', 'Hậu Giang', 'Nam', '2024', 'Cử nhân', 'TCTA', '0792050017', '2023-01-23', 'Cục QLHC', 'Việt Nam', 'Kinh', 'Không', 'Quận 11, TP.HCM', '0901234517', 'rang.ph@gmail.com', 'Quận 11, TP.HCM', '2021-09-12', NULL, '24001017@student.hcmus.edu.vn', NULL, NULL, 'Phạm Thị S', 'Quận 11, TP.HCM', '0911234517', NULL, 'Mẹ', '7480201_DKD', NULL, NULL),
        ('24001018', 'Trần Thị Sương', 'Sinh viên (Đang học)', '2006-05-24', 'Trà Vinh', 'Nữ', '2024', 'Cử nhân ', 'TCTA', '0792050018', '2023-08-15', 'Cục QLHC', 'Việt Nam', 'Kinh', 'Không', ' Hóc Môn, TP.HCM', '0901234518', 'suong.tr@gmail.com', 'Hóc Môn, TP.HCM', '2021-10-02', NULL, '24001018@student.hcmus.edu.vn', '10111018', 'Agribank', 'Trần Văn T', 'Hóc Môn, TP.HCM', '0911234518', NULL, 'Cha', '7480201_DKD', NULL, NULL),
        ('24001019', 'Nguyễn Văn Toàn', 'Sinh viên (Đang học)', '2006-09-12', 'Tây Ninh', 'Nam', '2024', 'Cử nhân', 'TCTA', '0792050019', '2023-05-04', 'Cục QLHC', 'Việt Nam', 'Kinh', 'Thiên Chúa Giáo', 'Củ Chi, TP.HCM', '0901234519', 'toan.ng@gmail.com', 'Củ Chi, TP.HCM', '2021-05-06', NULL, '24001019@student.hcmus.edu.vn', NULL, NULL, 'Nguyễn Thị V', 'Củ Chi, TP.HCM', '0911234519', NULL, 'Mẹ', '7480201_DKD', NULL, NULL),
        ('24002001', 'Lê Hoàng Anh', 'Sinh viên (Đang học)', '2006-05-02', 'TP.HCM', 'Nam', '2024', 'Cử nhân', 'Đại trà', '0792050021', '2023-04-09', 'Cục QLHC', 'Việt Nam', 'Kinh', 'Không', 'Quận 7, TP.HCM', '0901234521', 'anh.le@gmail.com', 'Quận 7, TP.HCM', '2021-09-01', NULL, '24002001@student.hcmus.edu.vn', NULL, NULL, 'Lê Văn B', 'Quận 7, TP.HCM', '0911234520', NULL, 'Cha', '7460101_NN', NULL, NULL),
        ('24002002', 'Trần Mỹ Duyên', 'Sinh viên (Đang học)', '2006-09-06', 'Đồng Nai', 'Nữ', '2024', 'Cử nhân', 'Đại trà', '0792050022', '2023-08-04', 'Cục QLHC', 'Việt Nam', 'Kinh', 'Cao Đài', 'Gò Vấp, TP.HCM', '0901234522', 'duyen.tr@gmail.com', 'Gò Vấp, TP.HCM', '2021-04-09', NULL, '24002002@student.hcmus.edu.vn', NULL, NULL, 'Trần Văn C', 'Gò Vấp, TP.HCM', '0911234521', NULL, 'Cha', '7460101_NN', NULL, NULL),
        ('24002003', 'Phạm Quốc Huy', 'Sinh viên (Bảo lưu)', '2006-09-04', 'Bình Dương', 'Nam', '2024', 'Cử nhân', 'Đại trà', '0792050023', '2023-04-01', 'Cục QLHC', 'Việt Nam', 'Kinh', 'Không', 'Thủ Đức, TP.HCM', '0901234523', 'huy.ph@gmail.com', 'Thủ Đức, TP.HCM', '2021-06-30', NULL, '24002003@student.hcmus.edu.vn', '10111023', 'ACB', 'Phạm Thị D', 'Thủ Đức, TP.HCM', '0911234522', NULL, 'Mẹ', '7460101_NN', NULL, NULL),
        ('24002004', 'Nguyễn Ngọc Lan', 'Sinh viên (Đang học)', '2006-02-03', 'Phan Thiết', 'Nữ', '2024', 'Cử nhân', 'Đại trà', '0792050024', '2023-08-09', 'Cục QLHC', 'Việt Nam', 'Kinh', 'Không', 'Quận 7, TP.HCM', '0901234524', 'lan.ng@gmail.com', 'Quận 7, TP.HCM', '2021-06-04', NULL, '24002004@student.hcmus.edu.vn', NULL, NULL, 'Nguyễn Văn E', 'Quận 7, TP.HCM', '0911234523', NULL, 'Cha', '7460101_NN', NULL, NULL),
        ('24002005', 'Đinh Trọng Phúc', 'Sinh viên (Đang học)', '2006-07-19', 'Vũng Tàu', 'Nam', '2024', 'Cử nhân', 'Đại trà', '0792050025', '2023-01-31', 'Cục QLHC', 'Việt Nam', 'Kinh', 'Không', 'Quận 10, TP.HCM', '0901234525', 'phuc.dinh@gmail.com', 'Quận 10, TP.HCM', '2021-09-02', NULL, '24002005@student.hcmus.edu.vn', NULL, NULL, 'Đinh Thị F', 'Quận 10, TP.HCM', '0911234524', NULL, 'Mẹ', '7460101_NN', NULL, NULL),
        ('24002006', 'Vũ Trà My', 'Sinh viên (Đại trà)', '2006-06-11', 'Hà Nội', 'Nữ', '2024', 'Cử nhân', 'Đại trà', '0792050026', '2024-06-09', 'Cục QLHC', 'Việt Nam', 'Kinh', 'Không', 'Tân Bình, TP.HCM', '0901234526', 'my.vu@gmail.com', 'Tân Bình, TP.HCM', '2021-03-26', NULL, '24002006@student.hcmus.edu.vn', NULL, NULL, 'Vũ Văn G', 'Tân Bình, TP.HCM', '0911234525', NULL, 'Cha', '7460101_NN', NULL, NULL),
        ('24002007', 'Huỳnh Minh Sang', 'Sinh viên (Đang học)', '2006-07-22', 'Bến Tre', 'Nam', '2024', 'Cử nhân', 'Đại trà', '0792050027', '2024-06-02', 'Cục QLHC', 'Việt Nam', 'Kinh', 'Không', 'Bình Thạnh, TP.HCM', '0901234527', 'sang.huynh@gmail.com', 'Bình Thạnh, TP.HCM', '2021-09-06', NULL, '24002007@student.hcmus.edu.vn', NULL, NULL, 'Huỳnh Thị H', 'Bình Thạnh, TP.HCM', '0911234526', NULL, 'Mẹ', '7460101_NN', NULL, NULL),
        ('24002008', 'Bùi Tú Quyên', 'Sinh viên (Đang học)', '2006-06-19', 'Tiền Giang', 'Nữ', '2024', 'Cử nhân', 'Đại trà', '0792050028', '2024-09-29', 'Cục QLHC', 'Việt Nam', 'Kinh', 'Không', 'Quận 5, TP.HCM', '0901234528', 'uyen.bui@gmail.com', 'Quận 5, TP.HCM', '2021-10-02', NULL, '24002008@student.hcmus.edu.vn', '10111028', 'MBBank', 'Bùi Văn I', 'Quận 5, TP.HCM', '0911234527', NULL, 'Cha', '7460101_NN', NULL, NULL),
        ('24002009', 'Hồ Thanh Tùng', 'Sinh Viên (Đang học)', '2006-07-26', 'Lâm Đồng', 'Nam', '2024', 'Cử nhân', 'Đại trà', '0792050029', '2024-05-09', 'Cục QLHC', 'Việt Nam', 'Kinh', 'Không', 'Quận 3, TP.HCM', '0901234529', 'tung.ho@gmail.com', 'Quận 3, TP.HCM', '2021-08-12', NULL, '24002009@student.hcmus.edu.vn', '10111029', 'Vietcombank', 'Hồ Thị K', 'Quận 3, TP.HCM', '0911234528', NULL, 'Mẹ', '7460101_NN', NULL, NULL),
        ('24127132', 'Nguyễn Thị Ngọc Trâm', 'Sinh viên (Đang học)', '2006-02-06', 'Đà Nẵng', 'Nữ', '2024', 'Cử nhân', 'Đại trà', '0792050132', '2023-05-06', 'Cục QLHC', 'Việt Nam', 'Kinh', 'Không', 'Quận 5, TP.HCM', '0901234132', 'tram.ng@gmail.com', 'Quận 5, TP.HCM', '2021-04-06', NULL, '24127132@student.hcmus.edu.vn', '10071981', 'ACB', 'Nguyễn Thị Hoa', 'Quận 5, TP.HCM', '0911234532', NULL, 'Mẹ', '7460101_NN', 'GT', NULL),
        ('24127158', 'Nguyễn Trần Lan Duy', 'Sinh viên (Đang học)', '2006-07-20', 'Bến Tre', 'Nữ', '2024', 'Cử nhân', 'TCTA', '0548423215', '2023-04-30', 'Cục Cảnh sát quản lý hành chính về trật tự xã hội', 'Việt Nam', 'Kinh', 'Không', 'Xã Tân Thủy, tỉnh Vĩnh Long\n', '0123456789', 'nguyentranlanduy2016@gmail.com', 'phường An Đông, thành phố Hồ Chí Minh', '2021-05-31', NULL, '24127158@student.hcmus.edu.vn', '02101971', 'ACB', 'Trần Thị Thủy', 'Xã Tân Thủy, tỉnh Vĩnh Long\n', '0987654321', NULL, 'Mẹ', '7480201_DKD', 'HTTT', NULL)
    """)
    
    conn.commit()
    conn.close()

    # 4. ÉP CODE GỐC ĐỌC FILE NHÁP
    monkeypatch.setattr("app.routes.auth_routes.DB_PATH", test_db_path)
    
    # Bỏ luôn đoạn os.remove vì Pytest sẽ tự lo vụ dọn rác
    yield