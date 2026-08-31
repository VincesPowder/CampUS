from app import db
from datetime import datetime

class Khoa(db.Model):
    __tablename__ = 'KHOA'
    makhoa = db.Column(db.String(20), primary_key=True, name='MAKHOA')
    tenkhoa = db.Column(db.String(100), name='TENKHOA')

class Nganh(db.Model):
    __tablename__ = 'NGANH'
    manganh = db.Column(db.String(20), primary_key=True, name='MANGANH')
    tennganh = db.Column(db.String(100), name='TENNGANH')
    makhoa = db.Column(db.String(20), db.ForeignKey('KHOA.MAKHOA'), name='MAKHOA')
    
    khoa = db.relationship('Khoa', backref='nganhs')
    
class ChuyenNganh(db.Model):
    __tablename__ = 'CHUYENNGANH'
    __table_args__ = {'extend_existing': True}
    macn = db.Column(db.String(15), primary_key=True, name='MACN')
    tencn = db.Column(db.String(80), nullable=False, name='TENCN')
    manganh = db.Column(db.String(15), db.ForeignKey('NGANH.MANGANH'), name='MANGANH')
    
    nganh = db.relationship('Nganh', backref='chuyennganhs')

class DotCapNhatHoSo(db.Model):
    __tablename__ = 'DOT_CAPNHAT_HOSO'
    madot = db.Column(db.String(20), primary_key=True, name='MADOT')
    tendot = db.Column(db.String(100), name='TENDOT')
    thoigian_batdau = db.Column(db.DateTime, name='THOIGIAN_BATDAU')
    thoigian_ketthuc = db.Column(db.DateTime, name='THOIGIAN_KETTHUC')
    trangthai_mo = db.Column(db.Integer, name='TRANGTHAI_MO')

class SinhVien(db.Model):
    __tablename__ = 'SINHVIEN'
    
    # Thông tin cơ bản
    mssv = db.Column(db.String(20), primary_key=True, name='MSSV')
    hoten = db.Column(db.String(100), name='HOTEN')
    loaisv = db.Column(db.String(50), name='LOAISV')
    ngaysinh = db.Column(db.Date, name='NGAYSINH')
    noisinh = db.Column(db.String(100), name='NOISINH')
    gioitinh = db.Column(db.String(10), name='GIOITINH')
    nienkhoa = db.Column(db.String(20), name='NIENKHOA')
    bacdaotao = db.Column(db.String(50), name='BACDAOTAO')
    loaidaotao = db.Column(db.String(50), name='LOAIDAOTAO')
    
    # Định danh
    cccd = db.Column(db.String(20), name='CCCD')
    ngaycap = db.Column(db.Date, name='NGAYCAP')
    noicap = db.Column(db.String(100), name='NOICAP')
    quoctich = db.Column(db.String(50), name='QUOCTICH')
    dantoc = db.Column(db.String(50), name='DANTOC')
    tongiao = db.Column(db.String(50), name='TONGIAO')
    
    # Liên hệ cá nhân
    dcthuongtru = db.Column(db.String(200), name='DCTHUONGTRU')
    dienthoai = db.Column(db.String(20), name='DIENTHOAI')
    mailcanhan = db.Column(db.String(100), name='MAILCANHAN')
    dchiennay = db.Column(db.String(200), name='DCHIENNAY')
    
    # Thông tin Đoàn/Đảng & Trường
    ngayvaodoan = db.Column(db.Date, name='NGAYVAODOAN')
    ngayvaodang = db.Column(db.Date, name='NGAYVAODANG')
    mailtruong = db.Column(db.String(100), name='MAILTRUONG')
    
    # Thông tin ngân hàng
    sothenh = db.Column(db.String(50), name='SOTHENH')
    tennh = db.Column(db.String(100), name='TENNH')
    
    # Liên lạc khẩn cấp (Người liên lạc)
    nguoilienlac = db.Column(db.String(100), name='NGUOILIENLAC')
    dclienlac = db.Column(db.String(200), name='DCLIENLAC')
    sdtlienlac = db.Column(db.String(20), name='SDTLIENLAC')
    maillienlac = db.Column(db.String(100), name='MAILLIENLAC')
    quanhe_nll = db.Column(db.String(50), name='QUANHE_NLL')
    
    # Ngành / Chuyên ngành
    manganh = db.Column(db.String(20), db.ForeignKey('NGANH.MANGANH'), name='MANGANH')
    macn = db.Column(db.String(20), name='MACN')
    
    # Khác
    avatar = db.Column(db.String(255), name='AVATAR')

    # Relationships
    nganh = db.relationship('Nganh', backref='sinhviens')
    
class NguoiThan(db.Model):
    __tablename__ = 'NGUOITHAN'
    mant = db.Column(db.String(20), primary_key=True, name='MANT')
    mssv = db.Column(db.String(20), db.ForeignKey('SINHVIEN.MSSV'), name='MSSV')
    hoten = db.Column(db.String(100), name='HOTEN')
    namsinh = db.Column(db.Integer, name='NAMSINH')
    quanhe = db.Column(db.String(50), name='QUANHE')
    nghenghiep = db.Column(db.String(100), name='NGHENGHIEP')
    noilamviec = db.Column(db.String(200), name='NOILAMVIEC')
    sdt = db.Column(db.String(20), name='SDT')
    mail = db.Column(db.String(100), name='MAIL')
    dantoc = db.Column(db.String(50), name='DANTOC')
    tongiao = db.Column(db.String(50), name='TONGIAO')
    quoctich = db.Column(db.String(50), name='QUOCTICH')
    tinhthanh = db.Column(db.String(100), name='TINHTHANH')
    phuongxa = db.Column(db.String(100), name='PHUONGXA')
    hkthuongtru = db.Column(db.String(200), name='HKTHUONGTRU')

    # Thiết lập relationship ngược lại với bảng SinhVien
    sinhvien = db.relationship('SinhVien', backref=db.backref('nguoithan_list', lazy=True))
    
# Thêm vào backend/app/models/student.py

class LienHeHeThong(db.Model):
    __tablename__ = 'LIENHE_HETHONG'
    __table_args__ = {'extend_existing': True}
    
    ma_lienhe = db.Column(db.String(10), primary_key=True, name='MA_LIENHE')
    ten_donvi = db.Column(db.String(100), name='TEN_DONVI')
    loai_lienhe = db.Column(db.String(50), name='LOAI_LIENHE')
    email = db.Column(db.String(100), name='EMAIL')
    sdt = db.Column(db.String(20), name='SDT')
    diachi = db.Column(db.String(255), name='DIACHI')
    ghichu = db.Column(db.Text, name='GHICHU')