# backend/app/models/schedule.py
from app import db

class LichHoc(db.Model):
    __tablename__ = 'LICH_HOC'
    
    malichhoc = db.Column(db.String(10), primary_key=True, name='MALICHHOC')
    malhp = db.Column(db.String(10), db.ForeignKey('LOPHOCPHAN.MALHP'), nullable=False, name='MALHP')
    tuan = db.Column(db.String(30), name='TUAN')
    ngaybatdau = db.Column(db.Date, name='NGAYBATDAU')
    ngayketthuc = db.Column(db.Date, name='NGAYKETTHUC')
    thu = db.Column(db.String(15), name='THU') # "Hai", "Ba", "Tư", "Năm", "Sáu", "Bảy", "Chủ nhật"
    thoigian_bd = db.Column(db.Time, name='THOIGIAN_BD')
    thoigian_kt = db.Column(db.Time, name='THOIGIAN_KT')
    phonghoc = db.Column(db.String(30), name='PHONGHOC')
    hinhthuchoc = db.Column(db.String(30), default="TẬP TRUNG", name='HINHTHUCHOC')
    
    lophocphan = db.relationship('LopHocPhan', backref='lichhoc_list')

class LichThi(db.Model):
    __tablename__ = 'LICH_THI'
    
    malichthi = db.Column(db.String(10), primary_key=True, name='MALICHTHI')
    malhp = db.Column(db.String(10), db.ForeignKey('LOPHOCPHAN.MALHP'), nullable=False, name='MALHP')
    ngaythi = db.Column(db.Date, name='NGAYTHI')
    giothi = db.Column(db.Time, name='GIOTHI')
    thoigianlambai = db.Column(db.Integer, default=90, name='THOIGIANLAMBAI')
    phongthi = db.Column(db.String(30), name='PHONGTHI')
    
    lophocphan = db.relationship('LopHocPhan', backref='lichthi_list')