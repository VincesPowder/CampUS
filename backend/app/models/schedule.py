# backend/app/models/schedule.py
from app import db
from datetime import datetime

class LichHoc(db.Model):
    __tablename__ = 'LICHHOC'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True, name='ID')
    malhp = db.Column(db.String(10), db.ForeignKey('LOPHOCPHAN.MALHP'), nullable=False, name='MALHP')
    thu = db.Column(db.Integer, nullable=False, name='THU') # 2 -> 8 (2: Thứ 2, ..., 8: Chủ nhật)
    tiet_bd = db.Column(db.Integer, nullable=False, name='TIET_BD')
    tiet_kt = db.Column(db.Integer, nullable=False, name='TIET_KT')
    gio_bd = db.Column(db.String(10), nullable=False, name='GIO_BD') # "07:30"
    gio_kt = db.Column(db.String(10), nullable=False, name='GIO_KT') # "09:50"
    phong = db.Column(db.String(50), nullable=False, name='PHONG')   # "F.201"
    loai_tiet = db.Column(db.String(20), default="LT", name='LOAI_TIET') # "LT" hoặc "TH"
    tuan_bd = db.Column(db.Integer, default=1, name='TUAN_BD')
    tuan_kt = db.Column(db.Integer, default=15, name='TUAN_KT')
    
    # Relationship với LopHocPhan trong tuition.py
    lophocphan = db.relationship('LopHocPhan', backref='lichhoc_list')

class LichThi(db.Model):
    __tablename__ = 'LICHTHI'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True, name='ID')
    malhp = db.Column(db.String(10), db.ForeignKey('LOPHOCPHAN.MALHP'), nullable=False, name='MALHP')
    ky_thi = db.Column(db.String(20), default="CK", name='KY_THI') # "GK" (Giữa kỳ) hoặc "CK" (Cuối kỳ)
    ngay_thi = db.Column(db.Date, nullable=False, name='NGAY_THI')
    thu = db.Column(db.Integer, nullable=False, name='THU') # 2 -> 8
    ca_thi = db.Column(db.String(20), nullable=False, name='CA_THI') # "Ca 1", "Ca 2"
    gio_bd = db.Column(db.String(10), nullable=False, name='GIO_BD') # "07:30"
    gio_kt = db.Column(db.String(10), nullable=False, name='GIO_KT') # "09:00"
    phong_thi = db.Column(db.String(50), nullable=False, name='PHONG_THI')
    hinhthuc_thi = db.Column(db.String(50), default="Tự luận", name='HINHTHUC_THI')
    sbd = db.Column(db.String(20), nullable=True, name='SBD')
    soluong_sv = db.Column(db.Integer, default=45, name='SOLUONG_SV')
    ghichu = db.Column(db.String(255), nullable=True, name='GHICHU')
    
    # Relationship với LopHocPhan trong tuition.py
    lophocphan = db.relationship('LopHocPhan', backref='lichthi_list')