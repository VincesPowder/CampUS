-- -------------------------------------------------------------------------
-- MỨC 1: CÁC BẢNG GỐC (KHÔNG CHỨA KHÓA NGOẠI)
-- -------------------------------------------------------------------------

-- Bảng Khoa
CREATE TABLE KHOA (
    MAKHOA varchar(15) primary key,
    TENKHOA nvarchar(80) not null,
    -- Gỡ khóa ngoại tham chiếu đến GIANGVIEN ở đây để chống lỗi liên kết vòng
    MAGV_TRUONGKHOA char(10) 
);

-- Bảng Nhóm học phần
CREATE TABLE NHOMHOCPHAN (
    MANHOM varchar(10) primary key,
    TENNHOM nvarchar(80) not null
); 

-- Bảng Học kỳ - Năm học
CREATE TABLE HOCKY_NAMHOC (
    MA_HOCKY varchar(10) primary key,
    TEN_HOCKY nvarchar(50) not null,
    NAMHOC varchar(20),
    TRANGTHAI TEXT,
    NGAYBATDAU date,
    NGAYKETTHUC date
);

-- Bảng Khảo sát
CREATE TABLE KHAOSAT (
    MAKS varchar(20) primary key,
    TENKS varchar(80) not null,
    NOIDUNG TEXT,
    HANDON date
); 

-- Bảng Liên hệ hệ thống
CREATE TABLE LIENHE_HETHONG (
    MA_LIENHE varchar(10) primary key,
    TEN_DONVI nvarchar(100),
    LOAI_LIENHE nvarchar(50),
    EMAIL varchar(100),
    SDT varchar(20),
    DIACHI nvarchar(255),
    GHICHU TEXT
);


-- -------------------------------------------------------------------------
-- MỨC 2: CÁC BẢNG PHỤ THUỘC VÀO MỨC 1
-- -------------------------------------------------------------------------

-- Bảng Giảng viên
CREATE TABLE GIANGVIEN (
    MAGV_GD char(10) primary key,
    HOTEN varchar(80) not null,
    DIENTHOAI varchar(20),
    MAIL varchar(100),
    CHUYENMON varchar(80),
    MAKHOA varchar(15),
    FOREIGN KEY (MAKHOA) REFERENCES KHOA(MAKHOA)
); 

-- Bảng Cán bộ giáo vụ quản trị hệ thống
CREATE TABLE ADMIN_GIAOVU (
    MAGV char(10) primary key,
    HOTEN varchar(80) not null,
    EMAIL varchar(100) UNIQUE,
    VAITRO varchar(100),
    MAKHOA varchar(15),
    TRANGTHAI varchar(50),
    FOREIGN KEY (MAKHOA) REFERENCES KHOA(MAKHOA)
); 

-- Bảng Ngành
CREATE TABLE NGANH (
    MANGANH varchar(15) primary key,
    TENNGANH nvarchar(60) not null,
    MAKHOA varchar(15),
    FOREIGN KEY (MAKHOA) REFERENCES KHOA(MAKHOA)
); 

-- Bảng Môn học
CREATE TABLE MONHOC (
    MAMH varchar(10) primary key, 
    TENMH nvarchar(80) not null,
    SOTC int DEFAULT 0,
    SOTIET int DEFAULT 0,
    MANHOM varchar(10),
    FOREIGN KEY (MANHOM) REFERENCES NHOMHOCPHAN(MANHOM)
); 

-- Bảng Thông báo
CREATE TABLE THONGBAO (
    MATB varchar(20) primary key,
    TIEUDE varchar(80) not null,
    NOIDUNG TEXT,
    NGAYDANG datetime DEFAULT CURRENT_TIMESTAMP,
    MAKHOA varchar(15),
    FOREIGN KEY (MAKHOA) REFERENCES KHOA(MAKHOA)
); 

-- Bảng Câu hỏi khảo sát
CREATE TABLE CAUHOI_KHAOSAT (
    MACH varchar(20) primary key,
    MAKS varchar(20),
    NOIDUNG_CAUHOI TEXT not null,
    LOAI_CAUHOI varchar(50),
    THUTU int,
    FOREIGN KEY (MAKS) REFERENCES KHAOSAT(MAKS)
); 

-- Bảng Đợt cập nhật hồ sơ
CREATE TABLE DOT_CAPNHAT_HOSO (
    MADOT varchar(20) primary key,
    TENDOT varchar(80) not null,
    THOIGIAN_BATDAU datetime,
    THOIGIAN_KETTHUC datetime,
    MA_HOCKY varchar(10),
    TRANGTHAI_MO TINYINT DEFAULT 1,
    FOREIGN KEY (MA_HOCKY) REFERENCES HOCKY_NAMHOC(MA_HOCKY)
); 


-- -------------------------------------------------------------------------
-- MỨC 3: CÁC BẢNG PHỤ THUỘC VÀO MỨC 2
-- -------------------------------------------------------------------------

-- Bảng Chuyên ngành
CREATE TABLE CHUYENNGANH (
    MACN varchar(15) primary key,
    TENCN nvarchar(80) not null,
    MANGANH varchar(15),
    FOREIGN KEY (MANGANH) REFERENCES NGANH(MANGANH)
); 

-- Bảng Lớp học phần
CREATE TABLE LOPHOCPHAN (
    MALHP varchar(10) primary key,
    MAMH varchar(10),
    MA_HOCKY varchar(10),
    TENLOP nvarchar(20),
    TENGV nvarchar(80),
    MAILGV varchar(80),
    NGONNGU nvarchar(40),
    TRANGTHAI nvarchar(30),
    FOREIGN KEY (MAMH) REFERENCES MONHOC(MAMH),
    FOREIGN KEY (MA_HOCKY) REFERENCES HOCKY_NAMHOC(MA_HOCKY)
); 

-- Bảng Chương trình đào tạo
CREATE TABLE CHUONGTRINH_DAOTAO (
    MANGANH varchar(15),
    MAMH varchar(10),
    HOCKY_KIENGHI varchar(50),
    TICHCHOTOTNGHIEP int default 0,
    LOAIMON varchar(100),
    primary key (MANGANH, MAMH),
    FOREIGN KEY (MANGANH) REFERENCES NGANH(MANGANH),
    FOREIGN KEY (MAMH) REFERENCES MONHOC(MAMH)
); 

-- Bảng Lịch sử import file
CREATE TABLE LICHSU_IMPORT_FILE (
    MA_IMPORT varchar(50) primary key,
    TEN_FILE varchar(80),
    LOAI_DULIEU varchar(100),
    THOIGIAN_UP datetime DEFAULT CURRENT_TIMESTAMP,
    KETQUA_THANHCONG int default 0,
    KETQUA_THATBAI int default 0,
    FILE_LOAI_TRU varchar(80),
    MAGV_UP char(10),
    FOREIGN KEY (MAGV_UP) REFERENCES ADMIN_GIAOVU(MAGV)
); 


-- -------------------------------------------------------------------------
-- MỨC 4: BẢNG TRUNG TÂM & LỊCH HỌC (Phụ thuộc vào Mức 3)
-- -------------------------------------------------------------------------

-- Bảng Sinh viên
CREATE TABLE SINHVIEN (
    MSSV char(8) primary key,
    HOTEN nvarchar(50) not null,
    LOAISV nvarchar(20),
    NGAYSINH date,
    NOISINH nvarchar(80),
    GIOITINH nvarchar(10) check(GIOITINH in ('Nam', 'Nữ')),
    NIENKHOA varchar(9),
    BACDAOTAO nvarchar(30),
    LOAIDAOTAO nvarchar(30),
    CCCD varchar(12) unique,
    NGAYCAP date,
    NOICAP nvarchar(80),
    QUOCTICH nvarchar(80),
    DANTOC nvarchar(50),
    TONGIAO nvarchar(50),
    DCTHUONGTRU nvarchar(120),
    DIENTHOAI varchar(15),
    MAILCANHAN varchar(50),
    DCHIENNAY nvarchar(80),
    NGAYVAODOAN date,
    NGAYVAODANG date,
    MAILTRUONG varchar(50) unique,
    SOTHENH varchar(50),
    TENNH nvarchar(80),
    NGUOILIENLAC nvarchar(80),
    DCLIENLAC nvarchar(80),
    SDTLIENLAC varchar(15),
    MAILLIENLAC varchar(50),
    QUANHE_NLL nvarchar(50),
    MANGANH varchar(15),
    MACN varchar(15),
    AVATAR varchar(255),
    FOREIGN KEY (MANGANH) REFERENCES NGANH(MANGANH),
    FOREIGN KEY (MACN) REFERENCES CHUYENNGANH(MACN)
); 

-- Bảng Lịch học
CREATE TABLE LICH_HOC (
    MALICHHOC varchar(10) primary key,
    MALHP varchar(10),
    TUAN nvarchar(30),
    NGAYBATDAU date,
    NGAYKETTHUC date,
    THU nvarchar(15),
    THOIGIAN_BD time,
    THOIGIAN_KT time,
    PHONGHOC nvarchar(30),
    HINHTHUCHOC nvarchar(30),
    FOREIGN KEY (MALHP) REFERENCES LOPHOCPHAN(MALHP)
); 

-- Bảng Lịch thi
CREATE TABLE LICH_THI (
    MALICHTHI varchar(10) primary key,
    MALHP varchar(10),
    NGAYTHI date,
    GIOTHI time,
    THOIGIANLAMBAI int,
    PHONGTHI nvarchar(30),
    FOREIGN KEY (MALHP) REFERENCES LOPHOCPHAN(MALHP)
); 


-- -------------------------------------------------------------------------
-- MỨC 5: CÁC BẢNG PHỤ THUỘC VÀO SINH VIÊN
-- -------------------------------------------------------------------------

-- Bảng Người thân
CREATE TABLE NGUOITHAN (
    MANT varchar(10) primary key,
    MSSV char(8) not null,
    HOTEN nvarchar(80) not null,
    NAMSINH int,
    QUANHE nvarchar(30),
    NGHENGHIEP nvarchar(80),
    NOILAMVIEC nvarchar(80),
    SDT varchar(15),
    MAIL varchar(50),
    DANTOC nvarchar(50),
    TONGIAO nvarchar(50),
    QUOCTICH nvarchar(80),
    TINHTHANH nvarchar(80),
    PHUONGXA nvarchar(100),
    HKTHUONGTRU nvarchar(100),
    FOREIGN KEY (MSSV) REFERENCES SINHVIEN(MSSV)
); 

-- Bảng Kết quả học tập
CREATE TABLE KETQUA_HOCTAP (
    MSSV char(8), 
    MALHP varchar(10),
    DIEMGK decimal(4,1),
    DIEMCK decimal(4,1),
    DIEMTB_HE10 decimal(4,2), 
    LOAIDIEM_HECHU nvarchar(5), 
    TRANGTHAI nvarchar(30),
    primary key (MSSV, MALHP),
    FOREIGN KEY (MSSV) REFERENCES SINHVIEN(MSSV),
    FOREIGN KEY (MALHP) REFERENCES LOPHOCPHAN(MALHP)
); 

-- Bảng Tiến độ học tập
CREATE TABLE TIENDO_HOCTAP (
    MSSV char(8) primary key,
    TC_GDDC_DAT int default 0,
    TC_GDDC_YC int default 0,
    TRANGTHAI_GDDC nvarchar(20) DEFAULT 'Chưa đạt',
    TC_CSN_DAT int default 0,
    TC_CSN_YC int default 0,
    TRANGTHAI_CSN nvarchar(20) DEFAULT 'Chưa đạt',
    TC_CN_DAT int default 0,
    TC_CN_YC int default 0,
    TRANGTHAI_CN nvarchar(20) DEFAULT 'Chưa đạt',
    TC_TN_DAT int default 0,
    TC_TN_YC int default 0,
    TRANGTHAI_TN nvarchar(20) DEFAULT 'Chưa đạt',
    TRANGTHAI_GDTC nvarchar(30),
    TRANGTHAI_GDQP nvarchar(30),
    TRANGTHAI_TDNN nvarchar(30),
    TONG_TC_DAT INT,
    TONG_TC_YC INT,
    DIEM_TB_TICHLUY decimal(4,2),
    DUDIEUKIENTN varchar(50),
    FOREIGN KEY (MSSV) REFERENCES SINHVIEN(MSSV)
); 

-- Bảng Tiến độ & Nhóm học phần
CREATE TABLE TIENDO_NHOMHOCPHAN (
    MSSV char(8), 
    MANHOM varchar(10), 
    TC_DAT int default 0,
    TC_YEUCAU int default 0,
    primary key (MSSV, MANHOM),
    FOREIGN KEY (MSSV) REFERENCES SINHVIEN(MSSV),
    FOREIGN KEY (MANHOM) REFERENCES NHOMHOCPHAN(MANHOM)
); 

-- Bảng Học phí
CREATE TABLE HOCPHI (
    MSSV char(8), 
    MALHP varchar(10),
    SOTCHP int default 0,
    HOCPHI_GOC decimal(12,2) default 0,
    MUCGIAM decimal(12,2) default 0,
    HOTRO decimal(12,2) default 0,
    CHIPHIKHAC decimal(12,2) default 0,
    THUCDONG DECIMAL(12,2),
    GHICHU TEXT,
    TRANGTHAI_THANHTOAN varchar(50),
    NGAYTHANHTOAN datetime,
    primary key (MSSV, MALHP),
    FOREIGN KEY (MSSV) REFERENCES SINHVIEN(MSSV),
    FOREIGN KEY (MALHP) REFERENCES LOPHOCPHAN(MALHP)
); 

-- Bảng Danh sách sinh viên khảo sát
CREATE TABLE SV_KHAOSAT (
    MSSV char(8), 
    MAKS varchar(20),
    TRANGTHAI_LAM varchar(50),
    THOIGIAN_NOP datetime,
    primary key (MSSV, MAKS),
    FOREIGN KEY (MSSV) REFERENCES SINHVIEN(MSSV),
    FOREIGN KEY (MAKS) REFERENCES KHAOSAT(MAKS)
); 

-- Bảng Trả lời khảo sát
CREATE TABLE TRALOI_KHAOSAT (
    MACH varchar(20),
    MSSV char(8), 
    NOIDUNG_TRALOI TEXT,
    THOIGIAN_TRALOI datetime DEFAULT CURRENT_TIMESTAMP,
    primary key (MACH, MSSV),
    FOREIGN KEY (MACH) REFERENCES CAUHOI_KHAOSAT(MACH),
    FOREIGN KEY (MSSV) REFERENCES SINHVIEN(MSSV)
); 

-- Bảng Trạng thái sinh viên xem thông báo 
CREATE TABLE SV_THONGBAO (
    MSSV char(8), 
    MATB varchar(20),
    TRANGTHAI_DOC TINYINT default 0, 
    THOIGIAN_DOC datetime,
    primary key (MSSV, MATB),
    FOREIGN KEY (MSSV) REFERENCES SINHVIEN(MSSV),
    FOREIGN KEY (MATB) REFERENCES THONGBAO(MATB)
); 

-- Bảng Chatbot Session
CREATE TABLE CHATBOT_SESSION (
    MASESSION varchar(10) primary key,
    MSSV char(8) not null, 
    THOIGIAN_BATDAU datetime DEFAULT CURRENT_TIMESTAMP,
    THOIGIAN_KETTHUC datetime,
    MUCDO_HAILONG int,
    TRANGTHAI_GIAIQUYET varchar(50),
    FOREIGN KEY (MSSV) REFERENCES SINHVIEN(MSSV)
); 

-- Bảng Quản lý tình trạng sinh viên
CREATE TABLE QUANLY_TINHTRANG_SV (
    MAQUYETDINH varchar(20) primary key,
    MSSV char(8),
    TINHTRANG_MOI varchar(100),
    NGAYKY_QD date,
    MA_HOCKY varchar(10),
    MAGV_THUCHIEN char(10),
    LYDO nvarchar(255),
    FOREIGN KEY (MSSV) REFERENCES SINHVIEN(MSSV),
    FOREIGN KEY (MAGV_THUCHIEN) REFERENCES ADMIN_GIAOVU(MAGV),
    FOREIGN KEY (MA_HOCKY) REFERENCES HOCKY_NAMHOC(MA_HOCKY)
); 

-- Bảng Lịch sử chỉnh sửa dữ liệu
CREATE TABLE LICHSU_CHINHSUA (
    MALOG varchar(50) primary key,
    MSSV char(8),
    MAGV char(10),
    THOIGIAN_SUA datetime DEFAULT CURRENT_TIMESTAMP,
    BANG_BI_SUA varchar(100),
    DULIEU_CU TEXT,
    DULIEU_MOI TEXT,
    NGUOITHUCHIEN char(10),
    FOREIGN KEY (MSSV) REFERENCES SINHVIEN(MSSV),
    FOREIGN KEY (MAGV) REFERENCES ADMIN_GIAOVU(MAGV)
); 


-- -------------------------------------------------------------------------
-- MỨC 6: BẢNG CUỐI CÙNG
-- -------------------------------------------------------------------------

-- Bảng lưu toàn bộ tin nhắn trong từng phiên chatbot
CREATE TABLE CHATBOT_MESSAGE (
    MAMSG varchar(10) primary key,
    MASESSION varchar(10),
    NGUOIGUI char(8) not null,
    NOIDUNG_TINNHAN TEXT,
    THOIGIAN_GUI datetime DEFAULT CURRENT_TIMESTAMP,
    LOAI_TINNHAN nvarchar(50),
    INTENT_PHATHIEN nvarchar(80),
    FOREIGN KEY (MASESSION) REFERENCES CHATBOT_SESSION(MASESSION)
);