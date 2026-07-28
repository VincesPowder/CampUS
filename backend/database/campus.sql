-- =========================================================================
-- KHỞI TẠO DATABASE
-- =========================================================================

USE master
GO

IF EXISTS (SELECT * FROM sys.databases WHERE name = 'QLSV')
BEGIN
    ALTER DATABASE QLSV SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE QLSV;
END
GO

CREATE DATABASE QLSV
GO

USE QLSV
GO



-- =========================================================================
-- GIAI ĐOẠN 1: TẠO BẢNG VÀ KHỞI TẠO KHÓA CHÍNH
-- =========================================================================

-- -------------------------------------------------------------------------
-- A. NHÓM THÔNG TIN CHUNG & HỒ SƠ CÁ NHÂN
-- -------------------------------------------------------------------------

CREATE TABLE KHOA (
    MAKHOA varchar(15) primary key,
    TENKHOA nvarchar(80) not null
);
GO

CREATE TABLE NGANH (
    MANGANH varchar(15) primary key,
    TENNGANH nvarchar(60) not null,
    MAKHOA varchar(15)
); 
GO

CREATE TABLE CHUYENNGANH (
    MACN varchar(15) primary key,
    TENCN nvarchar(80) not null,
    MANGANH varchar(15)
); 
GO

CREATE TABLE SINHVIEN (
    MSSV char(8) primary key,
    HOTEN nvarchar(50) not null,
    LOAISV nvarchar(20),
    NGAYSINH date,
    NOISINH nvarchar(80),
    GIOITINH nvarchar(10) check(GIOITINH in (N'Nam', N'Nữ')),
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
    MACN varchar(15)
); 
GO

CREATE TABLE NGUOITHAN (
    MANT varchar(10) primary key,
    MSSV char(8),
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
    HKTHUONGTRU nvarchar(100)
); 
GO


-- -------------------------------------------------------------------------
-- B. NHÓM MÔN HỌC & HỌC PHẦN
-- -------------------------------------------------------------------------

CREATE TABLE NHOMHOCPHAN (
    MANHOM varchar(10) primary key,
    TENNHOM nvarchar(80) not null
); 
GO

CREATE TABLE MONHOC (
    MAMH varchar(10) primary key, 
    TENMH nvarchar(80) not null,
    SOTC int DEFAULT(0),
    SOTIET int DEFAULT(0),
    MANHOM varchar(10)
); 
GO

CREATE TABLE LOPHOCPHAN (
    MALHP varchar(10) primary key,
    MAMH varchar(10),
    NAMHOC varchar(10),
    HOCKY varchar(10),
    TENLOP nvarchar(20),
    TENGV nvarchar(80),
    MAILGV varchar(80),
    NGONNGU nvarchar(40)
); 
GO


-- -------------------------------------------------------------------------
-- C. NHÓM KẾT QUẢ & TIẾN ĐỘ HỌC TẬP
-- -------------------------------------------------------------------------

CREATE TABLE KETQUA_HOCTAP (
    MSSV char(8), 
    MALHP varchar(10),
    DIEMGK decimal(4,1),
    DIEMCK decimal(4,1),
    DIEMTB_HE10 decimal(4,1), 
    LOAIDIEM_HECHU nvarchar(5), 
    primary key (MSSV, MALHP)
); 
GO

CREATE TABLE TIENDO_HOCTAP (
    MSSV char(8) primary key,
    
    -- Khối Giáo dục đại cương
    TC_GDDC_DAT int default(0),
    TC_GDDC_YC int default(0),
    TRANGTHAI_GDDC nvarchar(20) CHECK (TRANGTHAI_GDDC IN (N'Đạt', N'Chưa đạt', N'Miễn')) DEFAULT (N'Chưa đạt'),
    
    -- Khối Cơ sở ngành
    TC_CSN_DAT int default(0),
    TC_CSN_YC int default(0),
    TRANGTHAI_CSN nvarchar(20) CHECK (TRANGTHAI_CSN IN (N'Đạt', N'Chưa đạt', N'Miễn')) DEFAULT (N'Chưa đạt'),
    
    -- Khối Chuyên ngành
    TC_CN_DAT int default(0),
    TC_CN_YC int default(0),
    TRANGTHAI_CN nvarchar(20) CHECK (TRANGTHAI_CN IN (N'Đạt', N'Chưa đạt', N'Miễn')) DEFAULT (N'Chưa đạt'),
    
    -- Khối Tốt nghiệp
    TC_TN_DAT int default(0),
    TC_TN_YC int default(0),
    TRANGTHAI_TN nvarchar(20) CHECK (TRANGTHAI_TN IN (N'Đạt', N'Chưa đạt', N'Miễn')) DEFAULT (N'Chưa đạt'),
    
    -- Các trạng thái phụ khác
    TRANGTHAI_GDTC nvarchar(30),
    TRANGTHAI_GDQP nvarchar(30),
    TRANGTHAI_TDNN nvarchar(30),
    
    -- Thuộc tính tính toán tự động: Tổng tín chỉ đạt & yêu cầu
    TONG_TC_DAT AS (TC_GDDC_DAT + TC_CSN_DAT + TC_CN_DAT + TC_TN_DAT),
    TONG_TC_YC AS (TC_GDDC_YC + TC_CSN_YC + TC_CN_YC + TC_TN_YC),
    
    -- Điểm trung bình tích lũy hệ 10
    DIEM_TB_TICHLUY decimal(4,2),
    
    -- Điều kiện tốt nghiệp (Điểm TB > 5.0 và các khối đạt/miễn)
    DUDIEUKIENTN varchar(50)
); 
GO

CREATE TABLE TIENDO_NHOMHOCPHAN (
    MSSV char(8), 
    MANHOM varchar(10), 
    TC_DAT int default(0),
    TC_YEUCAU int default(0),
    primary key (MSSV, MANHOM)
); 
GO


-- -------------------------------------------------------------------------
-- D. NHÓM LỊCH HỌC, LỊCH THI & HỌC PHÍ
-- -------------------------------------------------------------------------

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
    HINHTHUCHOC nvarchar(30)
); 
GO

CREATE TABLE LICH_THI (
    MALICHTHI varchar(10) primary key,
    MALHP varchar(10),
    NGAYTHI date,
    GIOTHI time,
    THOIGIANLAMBAI int,
    PHONGTHI nvarchar(30)
); 
GO

CREATE TABLE HOCPHI (
    MSSV char(8), 
    MALHP varchar(10),
    SOTCHP int default(0),
    HOCPHI_GOC decimal(12,2) default(0),
    MUCGIAM decimal(12,2) default(0),
    HOTRO decimal(12,2) default(0),
    CHIPHIKHAC decimal(12,2) default(0),
    THUCDONG AS (HOCPHI_GOC - MUCGIAM - HOTRO + CHIPHIKHAC),
    GHICHU TEXT,
    TRANGTHAI_THANHTOAN varchar(50),
    NGAYTHANHTOAN datetime,
    primary key (MSSV, MALHP)
); 
GO


-- -------------------------------------------------------------------------
-- E. NHÓM KHẢO SÁT & THÔNG BÁO
-- -------------------------------------------------------------------------

CREATE TABLE KHAOSAT (
    MAKS varchar(20) primary key,
    TENKS varchar(80) not null,
    NOIDUNG TEXT,
    HANDON date
); 
GO

CREATE TABLE SV_KHAOSAT (
    MSSV char(8), 
    MAKS varchar(20),
    TRANGTHAI_LAM varchar(50),
    THOIGIAN_NOP datetime,
    primary key (MSSV, MAKS)
); 
GO

CREATE TABLE CAUHOI_KHAOSAT (
    MACH varchar(20) primary key,
    MAKS varchar(20),
    NOIDUNG_CAUHOI TEXT not null,
    LOAI_CAUHOI varchar(50),
    THUTU int
); 
GO

CREATE TABLE TRALOI_KHAOSAT (
    MACH varchar(20),
    MSSV char(8), 
    NOIDUNG_TRALOI TEXT,
    THOIGIAN_TRALOI datetime DEFAULT CURRENT_TIMESTAMP,
    primary key (MACH, MSSV)
); 
GO

CREATE TABLE THONGBAO (
    MATB varchar(20) primary key,
    TIEUDE varchar(80) not null,
    NOIDUNG TEXT,
    NGAYDANG datetime DEFAULT CURRENT_TIMESTAMP,
    MAKHOA varchar(15) 
); 
GO

CREATE TABLE SV_THONGBAO (
    MSSV char(8), 
    MATB varchar(20),
    TRANGTHAI_DOC TINYINT default(0), 
    THOIGIAN_DOC datetime,
    primary key (MSSV, MATB)
); 
GO


-- -------------------------------------------------------------------------
-- F. NHÓM CHATBOT
-- -------------------------------------------------------------------------

CREATE TABLE CHATBOT_SESSION (
    MASESSION varchar(10) primary key,
    MSSV char(8), 
    THOIGIAN_BATDAU datetime DEFAULT CURRENT_TIMESTAMP,
    THOIGIAN_KETTHUC datetime,
    MUCDO_HAILONG int,
    TRANGTHAI_GIAIQUYET varchar(50)
); 
GO

CREATE TABLE CHATBOT_MESSAGE (
    MAMSG varchar(10) primary key,
    MASESSION varchar(10),
    NGUOIGUI char(8),
    NOIDUNG_TINNHAN TEXT,
    THOIGIAN_GUI datetime DEFAULT CURRENT_TIMESTAMP,
    LOAI_TINNHAN nvarchar(50),
    INTENT_PHATHIEN nvarchar(80)
); 
GO


-- -------------------------------------------------------------------------
-- G. NHÓM ADMIN & LƯU VẾT HỆ THỐNG
-- -------------------------------------------------------------------------

CREATE TABLE ADMIN_GIAOVU (
    MAGV char(10) primary key,
    HOTEN varchar(80) not null,
    EMAIL varchar(100) UNIQUE,
    VAITRO varchar(100),
    MAKHOA varchar(15),
    TRANGTHAI varchar(50)
); 
GO

CREATE TABLE GIANGVIEN (
    MAGV_GD char(10) primary key,
    HOTEN varchar(80) not null,
    DIENTHOAI varchar(20),
    MAIL varchar(100),
    CHUYENMON varchar(80),
    MAKHOA varchar(15)
); 
GO

CREATE TABLE CHUONGTRINH_DAOTAO (
    MANGANH varchar(15),
    MAMH varchar(10),
    HOCKY_KIENGHI varchar(50),
    TICHCHOTOTNGHIEP int default(0),
    LOAIMON varchar(100),
    primary key (MANGANH, MAMH)
); 
GO

CREATE TABLE QUANLY_TINHTRANG_SV (
    MAQUYETDINH varchar(20) primary key,
    MSSV char(8),
    TINHTRANG_MOI varchar(100),
    NGAYKY_QD date,
    HOCKY_APDUNG varchar(10),
    NAMHOC_APDUNG varchar(20),
    MAGV_THUCHIEN char(10)
); 
GO

CREATE TABLE DOT_CAPNHAT_HOSO (
    MADOT varchar(20) primary key,
    TENDOT varchar(80) not null,
    THOIGIAN_BATDAU datetime,
    THOIGIAN_KETTHUC datetime,
    NAMHOC varchar(20),
    HOCKY varchar(10),
    TRANGTHAI_MO TINYINT DEFAULT 1
); 
GO

CREATE TABLE LICHSU_CHINHSUA (
    MALOG varchar(50) primary key,
    MSSV char(8),
    MAGV char(10),
    THOIGIAN_SUA datetime DEFAULT CURRENT_TIMESTAMP,
    BANG_BI_SUA varchar(100),
    DULIEU_CU TEXT,
    DULIEU_MOI TEXT,
    NGUOITHUCHIEN char(10)
); 
GO

CREATE TABLE LICHSU_IMPORT_FILE (
    MA_IMPORT varchar(50) primary key,
    TEN_FILE varchar(80),
    LOAI_DULIEU varchar(100),
    THOIGIAN_UP datetime DEFAULT CURRENT_TIMESTAMP,
    KETQUA_THANHCONG int default(0),
    KETQUA_THATBAI int default(0),
    FILE_LOAI_TRU varchar(80),
    MAGV_UP char(10)
); 
GO



-- =========================================================================
-- GIAI ĐOẠN 2: THIẾT LẬP KHÓA NGOẠI 
-- =========================================================================

-- 1. Nhóm thông tin chung & Hồ sơ cá nhân
ALTER TABLE NGANH ADD 
CONSTRAINT FK_NGANH_KHOA FOREIGN KEY (MAKHOA) 
REFERENCES KHOA(MAKHOA); 
GO

ALTER TABLE CHUYENNGANH ADD 
CONSTRAINT FK_CN_NGANH FOREIGN KEY (MANGANH) 
REFERENCES NGANH(MANGANH); 
GO

ALTER TABLE SINHVIEN ADD 
CONSTRAINT FK_SV_NGANH FOREIGN KEY (MANGANH) 
REFERENCES NGANH(MANGANH); 
GO

ALTER TABLE SINHVIEN ADD 
CONSTRAINT FK_SV_CN FOREIGN KEY (MACN) 
REFERENCES CHUYENNGANH(MACN); 
GO

ALTER TABLE NGUOITHAN ADD 
CONSTRAINT FK_NT_SV FOREIGN KEY (MSSV) 
REFERENCES SINHVIEN(MSSV); 
GO


-- 2. Nhóm học tập, Tiến độ & Môn học
ALTER TABLE MONHOC ADD 
CONSTRAINT FK_MH_NHOMHP FOREIGN KEY (MANHOM) 
REFERENCES NHOMHOCPHAN(MANHOM); 
GO

ALTER TABLE LOPHOCPHAN ADD 
CONSTRAINT FK_LHP_MH FOREIGN KEY (MAMH) 
REFERENCES MONHOC(MAMH); 
GO

ALTER TABLE KETQUA_HOCTAP ADD 
CONSTRAINT FK_KQ_SV FOREIGN KEY (MSSV) 
REFERENCES SINHVIEN(MSSV); 
GO

ALTER TABLE KETQUA_HOCTAP ADD 
CONSTRAINT FK_KQ_LHP FOREIGN KEY (MALHP) 
REFERENCES LOPHOCPHAN(MALHP); 
GO

ALTER TABLE TIENDO_HOCTAP ADD 
CONSTRAINT FK_TD_SV FOREIGN KEY (MSSV) 
REFERENCES SINHVIEN(MSSV); 
GO

ALTER TABLE TIENDO_NHOMHOCPHAN ADD 
CONSTRAINT FK_TDNHOM_SV FOREIGN KEY (MSSV) 
REFERENCES SINHVIEN(MSSV); 
GO
ALTER TABLE TIENDO_NHOMHOCPHAN ADD 
CONSTRAINT FK_TDNHOM_NHOM FOREIGN KEY (MANHOM) 
REFERENCES NHOMHOCPHAN(MANHOM); 
GO

-- 3. Nhóm lịch học & Lịch thi
ALTER TABLE LICH_HOC ADD 
CONSTRAINT FK_LH_LHP FOREIGN KEY (MALHP) 
REFERENCES LOPHOCPHAN(MALHP); 
GO

ALTER TABLE LICH_THI ADD 
CONSTRAINT FK_LT_LHP FOREIGN KEY (MALHP) 
REFERENCES LOPHOCPHAN(MALHP); 
GO


-- 4. Nhóm học phí
ALTER TABLE HOCPHI ADD 
CONSTRAINT FK_HP_SV FOREIGN KEY (MSSV) 
REFERENCES SINHVIEN(MSSV); 
GO

ALTER TABLE HOCPHI ADD 
CONSTRAINT FK_HP_LHP FOREIGN KEY (MALHP) 
REFERENCES LOPHOCPHAN(MALHP); 
GO


-- 5. Nhóm khảo sát & Thông báo
ALTER TABLE SV_KHAOSAT ADD 
CONSTRAINT FK_SVKS_SV FOREIGN KEY (MSSV) 
REFERENCES SINHVIEN(MSSV); 
GO

ALTER TABLE SV_KHAOSAT ADD 
CONSTRAINT FK_SVKS_KS FOREIGN KEY (MAKS) 
REFERENCES KHAOSAT(MAKS); 
GO

ALTER TABLE CAUHOI_KHAOSAT ADD 
CONSTRAINT FK_CHKS_KS FOREIGN KEY (MAKS) 
REFERENCES KHAOSAT(MAKS); 
GO

ALTER TABLE TRALOI_KHAOSAT ADD 
CONSTRAINT FK_TLKS_CH FOREIGN KEY (MACH) 
REFERENCES CAUHOI_KHAOSAT(MACH); 
GO

ALTER TABLE TRALOI_KHAOSAT ADD 
CONSTRAINT FK_TLKS_SV FOREIGN KEY (MSSV) 
REFERENCES SINHVIEN(MSSV); 
GO

ALTER TABLE THONGBAO ADD 
CONSTRAINT FK_TB_KHOA FOREIGN KEY (MAKHOA) 
REFERENCES KHOA(MAKHOA); 
GO

ALTER TABLE SV_THONGBAO ADD 
CONSTRAINT FK_SVTB_SV FOREIGN KEY (MSSV) 
REFERENCES SINHVIEN(MSSV); 
GO

ALTER TABLE SV_THONGBAO ADD 
CONSTRAINT FK_SVTB_TB FOREIGN KEY (MATB) 
REFERENCES THONGBAO(MATB); 
GO


-- 6. Nhóm Chatbot
ALTER TABLE CHATBOT_SESSION ADD 
CONSTRAINT FK_CHAT_SV FOREIGN KEY (MSSV) 
REFERENCES SINHVIEN(MSSV); 
GO

ALTER TABLE CHATBOT_MESSAGE ADD 
CONSTRAINT FK_MSG_SESSION FOREIGN KEY (MASESSION) 
REFERENCES CHATBOT_SESSION(MASESSION); 
GO

-- 7. Phần Admin & Lưu vết hệ thống
ALTER TABLE ADMIN_GIAOVU ADD 
CONSTRAINT FK_AD_KHOA FOREIGN KEY (MAKHOA) 
REFERENCES KHOA(MAKHOA); 
GO

ALTER TABLE GIANGVIEN ADD 
CONSTRAINT FK_GV_KHOA FOREIGN KEY (MAKHOA) 
REFERENCES KHOA(MAKHOA); 
GO
ALTER TABLE CHUONGTRINH_DAOTAO ADD 
CONSTRAINT FK_CTDT_NGANH FOREIGN KEY (MANGANH) 
REFERENCES NGANH(MANGANH); 
GO

ALTER TABLE CHUONGTRINH_DAOTAO ADD 
CONSTRAINT FK_CTDT_MH FOREIGN KEY (MAMH) 
REFERENCES MONHOC(MAMH); 
GO

ALTER TABLE QUANLY_TINHTRANG_SV ADD 
CONSTRAINT FK_TT_SV FOREIGN KEY (MSSV) 
REFERENCES SINHVIEN(MSSV); 

GO

ALTER TABLE QUANLY_TINHTRANG_SV ADD 
CONSTRAINT FK_TT_GV FOREIGN KEY (MAGV_THUCHIEN) 
REFERENCES ADMIN_GIAOVU(MAGV); 
GO

ALTER TABLE LICHSU_CHINHSUA ADD 
CONSTRAINT FK_LOG_SV FOREIGN KEY (MSSV) 
REFERENCES SINHVIEN(MSSV); 
GO

ALTER TABLE LICHSU_CHINHSUA ADD
CONSTRAINT FK_LOG_GV FOREIGN KEY (MAGV) 
REFERENCES ADMIN_GIAOVU(MAGV); 
GO

ALTER TABLE LICHSU_IMPORT_FILE ADD 
CONSTRAINT FK_IMPORT_GV FOREIGN KEY (MAGV_UP) 
REFERENCES ADMIN_GIAOVU(MAGV); 
GO

-- =========================================================================
-- 1. CẬP NHẬT ĐIỂM TRUNG BÌNH TÍCH LŨY (DIEM_TB_TICHLUY)
-- Công thức: Tổng(Điểm hệ 10 của môn * Số tín chỉ môn đó) / Tổng(Số tín chỉ các môn đã có điểm)
-- =========================================================================
UPDATE td
SET td.DIEM_TB_TICHLUY = sub.DIEMTB
FROM TIENDO_HOCTAP td
INNER JOIN (
    SELECT 
        kq.MSSV,
        CAST(SUM(kq.DIEMTB_HE10 * mh.SOTC) * 1.0 / NULLIF(SUM(mh.SOTC), 0) AS DECIMAL(4,2)) AS DIEMTB
    FROM KETQUA_HOCTAP kq
    JOIN LOPHOCPHAN lhp ON kq.MALHP = lhp.MALHP
    JOIN MONHOC mh ON lhp.MAMH = mh.MAMH
    WHERE kq.DIEMTB_HE10 IS NOT NULL AND mh.SOTC > 0
    GROUP BY kq.MSSV
) sub ON td.MSSV = sub.MSSV;
GO

-- =========================================================================
-- 2. CẬP NHẬT ĐIỀU KIỆN TỐT NGHIỆP (DUDIEUKIENTN)
-- Điều kiện: Điểm tích lũy > 5.0 VÀ tất cả các khối tín chỉ (GDDC, CSN, CN, TN) 
-- đều đạt trạng thái 'Đạt' hoặc 'Miễn'. Nếu đúng: 'Đã đủ điều kiện tốt nghiệp', ngược lại: 'Chưa đủ điều kiện tốt nghiệp'
-- =========================================================================
UPDATE TIENDO_HOCTAP
SET DUDIEUKIENTN = CASE 
    WHEN ISNULL(DIEM_TB_TICHLUY, 0) > 5.0 
         AND TRANGTHAI_GDDC IN (N'Đạt', N'Miễn')
         AND TRANGTHAI_CSN  IN (N'Đạt', N'Miễn')
         AND TRANGTHAI_CN   IN (N'Đạt', N'Miễn')
         AND TRANGTHAI_TN   IN (N'Đạt', N'Miễn')
    THEN N'Đã đủ điều kiện tốt nghiệp'
    ELSE N'Chưa đủ điều kiện tốt nghiệp'
END;
GO