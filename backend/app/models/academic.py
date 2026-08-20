# backend/app/models/academic.py
from app import db

class NhomHocPhan(db.Model):
    __tablename__ = 'NHOMHOCPHAN'
    __table_args__ = {'extend_existing': True}
    
    manhom = db.Column(db.String(10), primary_key=True, name='MANHOM')
    tennhom = db.Column(db.String(100), nullable=False, name='TENNHOM')
    sotc_batbuoc = db.Column(db.Integer, default=0, name='SOTC_BATBUOC')
    sotc_tuchon = db.Column(db.Integer, default=0, name='SOTC_TUCHON')

class ChuyenNganh(db.Model):
    __tablename__ = 'CHUYENNGANH'
    __table_args__ = {'extend_existing': True}
    
    macn = db.Column(db.String(15), primary_key=True, name='MACN')
    tencn = db.Column(db.String(100), nullable=False, name='TENCN')
    manganh = db.Column(db.String(15), db.ForeignKey('NGANH.MANGANH'), name='MANGANH')

class BangDiem(db.Model):
    __tablename__ = 'BANGDIEM'
    __table_args__ = {'extend_existing': True}
    
    mssv = db.Column(db.String(20), db.ForeignKey('SINHVIEN.MSSV'), primary_key=True, name='MSSV')
    malhp = db.Column(db.String(10), db.ForeignKey('LOPHOCPHAN.MALHP'), primary_key=True, name='MALHP')
    diem_qt = db.Column(db.Float, nullable=True, name='DIEM_QT') # Điểm quá trình
    diem_gk = db.Column(db.Float, nullable=True, name='DIEM_GK') # Điểm giữa kỳ
    diem_ck = db.Column(db.Float, nullable=True, name='DIEM_CK') # Điểm cuối kỳ
    diem_tongket = db.Column(db.Float, nullable=True, name='DIEM_TONGKET') # Thang điểm 10
    diem_he4 = db.Column(db.Float, nullable=True, name='DIEM_HE4')         # Thang điểm 4
    diem_chu = db.Column(db.String(5), nullable=True, name='DIEM_CHU')    # A+, A, B+, B...
    trangthai = db.Column(db.String(20), default="Đạt", name='TRANGTHAI') # Đạt / Không đạt / Đang học
    
    sinhvien = db.relationship('SinhVien', backref='bangdiem_list', lazy=True)
    lophocphan = db.relationship('LopHocPhan', backref='bangdiem_list', lazy=True)