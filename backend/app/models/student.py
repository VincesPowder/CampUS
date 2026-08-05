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

class DotCapNhatHoSo(db.Model):
    __tablename__ = 'DOT_CAPNHAT_HOSO'
    madot = db.Column(db.String(20), primary_key=True, name='MADOT')
    tendot = db.Column(db.String(100), name='TENDOT')
    thoigian_batdau = db.Column(db.DateTime, name='THOIGIAN_BATDAU')
    thoigian_ketthuc = db.Column(db.DateTime, name='THOIGIAN_KETTHUC')
    trangthai_mo = db.Column(db.Integer, name='TRANGTHAI_MO')

class SinhVien(db.Model):
    __tablename__ = 'SINHVIEN'
    mssv = db.Column(db.String(20), primary_key=True, name='MSSV')
    hoten = db.Column(db.String(100), name='HOTEN')
    ngaysinh = db.Column(db.Date, name='NGAYSINH')
    noisinh = db.Column(db.String(100), name='NOISINH')
    gioitinh = db.Column(db.String(10), name='GIOITINH')
    nienkhoa = db.Column(db.String(20), name='NIENKHOA')
    bacdaotao = db.Column(db.String(50), name='BACDAOTAO')
    loaidaotao = db.Column(db.String(50), name='LOAIDAOTAO')
    cccd = db.Column(db.String(20), name='CCCD')
    ngaycap = db.Column(db.Date, name='NGAYCAP')
    noicap = db.Column(db.String(100), name='NOICAP')
    quoctich = db.Column(db.String(50), name='QUOCTICH')
    dantoc = db.Column(db.String(50), name='DANTOC')
    tongiao = db.Column(db.String(50), name='TONGIAO')
    dcthuongtru = db.Column(db.String(200), name='DCTHUONGTRU')
    dienthoai = db.Column(db.String(20), name='DIENTHOAI')
    mailcanhan = db.Column(db.String(100), name='MAILCANHAN')
    dchiennay = db.Column(db.String(200), name='DCHIENNAY')
    mailtruong = db.Column(db.String(100), name='MAILTRUONG')
    loaisv = db.Column(db.String(50), name='LOAISV')
    avatar = db.Column(db.String(255), name='AVATAR')
    manganh = db.Column(db.String(20), db.ForeignKey('NGANH.MANGANH'), name='MANGANH')

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