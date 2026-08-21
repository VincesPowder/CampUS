# backend/app/models/academic.py
from app import db

class NhomHocPhan(db.Model):
    __tablename__ = 'NHOMHOCPHAN'
    __table_args__ = {'extend_existing': True}
    
    manhom = db.Column(db.String(10), primary_key=True, name='MANHOM')
    tennhom = db.Column(db.String(80), nullable=False, name='TENNHOM')

class ChuyenNganh(db.Model):
    __tablename__ = 'CHUYENNGANH'
    __table_args__ = {'extend_existing': True}
    
    macn = db.Column(db.String(15), primary_key=True, name='MACN')
    tencn = db.Column(db.String(80), nullable=False, name='TENCN')
    manganh = db.Column(db.String(15), db.ForeignKey('NGANH.MANGANH'), name='MANGANH')

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
    
    mssv = db.Column(db.String(8), db.ForeignKey('SINHVIEN.MSSV'), primary_key=True, name='MSSV')
    malhp = db.Column(db.String(10), db.ForeignKey('LOPHOCPHAN.MALHP'), primary_key=True, name='MALHP')
    diemgk = db.Column(db.Float, nullable=True, name='DIEMGK')
    diemck = db.Column(db.Float, nullable=True, name='DIEMCK')
    diemtb_he10 = db.Column(db.Float, nullable=True, name='DIEMTB_HE10')
    loaidiem_hechu = db.Column(db.String(5), nullable=True, name='LOAIDIEM_HECHU')
    trangthai = db.Column(db.String(30), default="Đạt", name='TRANGTHAI')
    
    sinhvien = db.relationship('SinhVien', backref='ketqua_hoctap_list', lazy=True)
    lophocphan = db.relationship('LopHocPhan', backref='ketqua_hoctap_list', lazy=True)

class TienDoHocTap(db.Model):
    __tablename__ = 'TIENDO_HOCTAP'
    __table_args__ = {'extend_existing': True}
    
    mssv = db.Column(db.String(8), db.ForeignKey('SINHVIEN.MSSV'), primary_key=True, name='MSSV')
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
    
    mssv = db.Column(db.String(8), db.ForeignKey('SINHVIEN.MSSV'), primary_key=True, name='MSSV')
    manhom = db.Column(db.String(10), db.ForeignKey('NHOMHOCPHAN.MANHOM'), primary_key=True, name='MANHOM')
    tc_dat = db.Column(db.Integer, default=0, name='TC_DAT')
    tc_yeucau = db.Column(db.Integer, default=0, name='TC_YEUCAU')
    
    sinhvien = db.relationship('SinhVien', backref='tiendo_nhom_list', lazy=True)
    nhomhocphan = db.relationship('NhomHocPhan', backref='tiendo_nhom_list', lazy=True)