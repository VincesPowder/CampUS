# backend/app/models/academic.py
from app import db
from datetime import datetime

class HocKyNamHoc(db.Model):
    __tablename__ = 'HOCKY_NAMHOC'
    __table_args__ = {'extend_existing': True}
    
    ma_hocky = db.Column(db.String(10), primary_key=True, name='MA_HOCKY')
    ten_hocky = db.Column(db.String(50), nullable=False, name='TEN_HOCKY')
    namhoc = db.Column(db.String(20), name='NAMHOC')
    trangthai = db.Column(db.String(50), default='open', name='TRANGTHAI')
    ngaybatdau = db.Column(db.Date, name='NGAYBATDAU')
    ngayketthuc = db.Column(db.Date, name='NGAYKETTHUC')
    
    lophocphan_list = db.relationship('LopHocPhan', backref='hocky_namhoc', lazy=True)

class NhomHocPhan(db.Model):
    __tablename__ = 'NHOMHOCPHAN'
    __table_args__ = {'extend_existing': True}
    
    manhom = db.Column(db.String(10), primary_key=True, name='MANHOM')
    tennhom = db.Column(db.String(80), nullable=False, name='TENNHOM')
    
    monhoc_list = db.relationship('MonHoc', backref='nhomhocphan', lazy=True)

class MonHoc(db.Model):
    __tablename__ = 'MONHOC'
    __table_args__ = {'extend_existing': True}
    
    mamh = db.Column(db.String(10), primary_key=True, name='MAMH')
    tenmh = db.Column(db.String(80), nullable=False, name='TENMH')
    sotc = db.Column(db.Integer, default=0, name='SOTC')
    sotiet = db.Column(db.Integer, default=0, name='SOTIET')
    manhom = db.Column(db.String(10), db.ForeignKey('NHOMHOCPHAN.MANHOM'), name='MANHOM')
    
    lophocphan_list = db.relationship('LopHocPhan', backref='monhoc', lazy=True)

class ChuyenNganh(db.Model):
    __tablename__ = 'CHUYENNGANH'
    __table_args__ = {'extend_existing': True}
    
    macn = db.Column(db.String(15), primary_key=True, name='MACN')
    tencn = db.Column(db.String(80), nullable=False, name='TENCN')
    manganh = db.Column(db.String(15), db.ForeignKey('NGANH.MANGANH'), name='MANGANH')

class LopHocPhan(db.Model):
    __tablename__ = 'LOPHOCPHAN'
    __table_args__ = {'extend_existing': True}
    
    malhp = db.Column(db.String(10), primary_key=True, name='MALHP')
    mamh = db.Column(db.String(10), db.ForeignKey('MONHOC.MAMH'), name='MAMH')
    ma_hocky = db.Column(db.String(10), db.ForeignKey('HOCKY_NAMHOC.MA_HOCKY'), name='MA_HOCKY')
    tenlop = db.Column(db.String(20), name='TENLOP')
    tengv = db.Column(db.String(80), name='TENGV')
    mailgv = db.Column(db.String(80), name='MAILGV')
    ngonngu = db.Column(db.String(40), default='Tiếng Việt', name='NGONNGU')
    trangthai = db.Column(db.String(30), default='pending', name='TRANGTHAI')
    
    ketqua_list = db.relationship('KetQuaHocTap', backref='lophocphan', lazy=True, cascade="all, delete-orphan")

class ChuongTrinhDaoTao(db.Model):
    __tablename__ = 'CHUONGTRINH_DAOTAO'
    __table_args__ = {'extend_existing': True}
    
    manganh = db.Column(db.String(15), db.ForeignKey('NGANH.MANGANH'), primary_key=True, name='MANGANH')
    mamh = db.Column(db.String(10), db.ForeignKey('MONHOC.MAMH'), primary_key=True, name='MAMH')
    hocky_kienghi = db.Column(db.String(50), name='HOCKY_KIENGHI')
    tichchototnghiep = db.Column(db.Integer, default=0, name='TICHCHOTOTNGHIEP')
    loaimon = db.Column(db.String(100), name='LOAIMON')
    
    monhoc = db.relationship('MonHoc', backref='chuongtrinh_list', lazy=True)

class KetQuaHocTap(db.Model):
    __tablename__ = 'KETQUA_HOCTAP'
    __table_args__ = {'extend_existing': True}
    
    mssv = db.Column(db.String(20), db.ForeignKey('SINHVIEN.MSSV'), primary_key=True, name='MSSV')
    malhp = db.Column(db.String(10), db.ForeignKey('LOPHOCPHAN.MALHP'), primary_key=True, name='MALHP')
    diemgk = db.Column(db.Float, nullable=True, name='DIEMGK')
    diemck = db.Column(db.Float, nullable=True, name='DIEMCK')
    diemtb_he10 = db.Column(db.Float, nullable=True, name='DIEMTB_HE10')
    loaidiem_hechu = db.Column(db.String(5), nullable=True, name='LOAIDIEM_HECHU')
    trangthai = db.Column(db.String(30), default="Đạt", name='TRANGTHAI')
    
    sinhvien = db.relationship('SinhVien', backref=db.backref('ketqua_hoctap_list', lazy=True))

    # Thuộc tính ảo cho frontend (không lưu vào bảng KETQUA_HOCTAP)
    @property
    def diemcc(self):
        return 10.0

    @property
    def ghichu(self):
        return ""

class TienDoHocTap(db.Model):
    __tablename__ = 'TIENDO_HOCTAP'
    __table_args__ = {'extend_existing': True}
    
    mssv = db.Column(db.String(20), db.ForeignKey('SINHVIEN.MSSV'), primary_key=True, name='MSSV')
    tc_gddc_dat = db.Column(db.Integer, default=0, name='TC_GDDC_DAT')
    tc_gddc_yc = db.Column(db.Integer, default=0, name='TC_GDDC_YC')
    trangthai_gddc = db.Column(db.String(20), default='Chưa đạt', name='TRANGTHAI_GDDC')
    
    tc_csn_dat = db.Column(db.Integer, default=0, name='TC_CSN_DAT')
    tc_csn_yc = db.Column(db.Integer, default=0, name='TC_CSN_YC')
    trangthai_csn = db.Column(db.String(20), default='Chưa đạt', name='TRANGTHAI_CSN')
    
    tc_cn_dat = db.Column(db.Integer, default=0, name='TC_CN_DAT')
    tc_cn_yc = db.Column(db.Integer, default=0, name='TC_CN_YC')
    trangthai_cn = db.Column(db.String(20), default='Chưa đạt', name='TRANGTHAI_CN')
    
    tc_tn_dat = db.Column(db.Integer, default=0, name='TC_TN_DAT')
    tc_tn_yc = db.Column(db.Integer, default=0, name='TC_TN_YC')
    trangthai_tn = db.Column(db.String(20), default='Chưa đạt', name='TRANGTHAI_TN')
    
    trangthai_gdtc = db.Column(db.String(30), name='TRANGTHAI_GDTC')
    trangthai_gdqp = db.Column(db.String(30), name='TRANGTHAI_GDQP')
    trangthai_tdnn = db.Column(db.String(30), name='TRANGTHAI_TDNN')
    
    tong_tc_dat = db.Column(db.Integer, name='TONG_TC_DAT')
    tong_tc_yc = db.Column(db.Integer, name='TONG_TC_YC')
    diem_tb_tichluy = db.Column(db.Float, name='DIEM_TB_TICHLUY')
    dudieukientn = db.Column(db.String(50), name='DUDIEUKIENTN')
    
    sinhvien = db.relationship('SinhVien', backref='tiendo_hoctap', uselist=False, lazy=True)

class TienDoNhomHocPhan(db.Model):
    __tablename__ = 'TIENDO_NHOMHOCPHAN'
    __table_args__ = {'extend_existing': True}
    
    mssv = db.Column(db.String(20), db.ForeignKey('SINHVIEN.MSSV'), primary_key=True, name='MSSV')
    manhom = db.Column(db.String(10), db.ForeignKey('NHOMHOCPHAN.MANHOM'), primary_key=True, name='MANHOM')
    tc_dat = db.Column(db.Integer, default=0, name='TC_DAT')
    tc_yeucau = db.Column(db.Integer, default=0, name='TC_YEUCAU')
    
    sinhvien = db.relationship('SinhVien', backref='tiendo_nhom_list', lazy=True)
    nhomhocphan = db.relationship('NhomHocPhan', backref='tiendo_nhom_list', lazy=True)

class LichSuChinhSua(db.Model):
    __tablename__ = 'LICHSU_CHINHSUA'
    __table_args__ = {'extend_existing': True}
    
    malog = db.Column(db.String(50), primary_key=True, name='MALOG')
    mssv = db.Column(db.String(20), db.ForeignKey('SINHVIEN.MSSV'), name='MSSV')
    magv = db.Column(db.String(10), db.ForeignKey('ADMIN_GIAOVU.MAGV'), name='MAGV')
    thoigian_sua = db.Column(db.DateTime, default=datetime.utcnow, name='THOIGIAN_SUA')
    bang_bi_sua = db.Column(db.String(100), default='KETQUA_HOCTAP', name='BANG_BI_SUA')
    dulieu_cu = db.Column(db.Text, name='DULIEU_CU')
    dulieu_moi = db.Column(db.Text, name='DULIEU_MOI')
    nguoithuchien = db.Column(db.String(10), name='NGUOITHUCHIEN')