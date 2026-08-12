from app import db
from datetime import datetime

class ThongBao(db.Model):
    __tablename__ = 'THONGBAO' #
    
    matb = db.Column(db.String(20), primary_key=True, name='MATB') #[cite: 2]
    tieude = db.Column(db.String(80), nullable=False, name='TIEUDE') #[cite: 2]
    noidung = db.Column(db.Text, name='NOIDUNG') #[cite: 2]
    ngaydang = db.Column(db.DateTime, default=datetime.utcnow, name='NGAYDANG') #[cite: 2]
    makhoa = db.Column(db.String(15), db.ForeignKey('KHOA.MAKHOA'), name='MAKHOA') #[cite: 2]

class SvThongBao(db.Model):
    __tablename__ = 'SV_THONGBAO' #[cite: 2]
    
    mssv = db.Column(db.String(8), db.ForeignKey('SINHVIEN.MSSV'), primary_key=True, name='MSSV') #[cite: 2]
    matb = db.Column(db.String(20), db.ForeignKey('THONGBAO.MATB'), primary_key=True, name='MATB') #[cite: 2]
    trangthai_doc = db.Column(db.Integer, default=0, name='TRANGTHAI_DOC') #[cite: 2]
    thoigian_doc = db.Column(db.DateTime, name='THOIGIAN_DOC') #[cite: 2]

    # Relationships để query nhanh dữ liệu[cite: 3]
    thongbao = db.relationship('ThongBao', backref='sv_thongbao_list') 
    sinhvien = db.relationship('SinhVien', backref='sv_thongbao_list')