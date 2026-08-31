# backend/app/models/notification.py
from app import db
from datetime import datetime

class ThongBao(db.Model):
    __tablename__ = 'THONGBAO'
    __table_args__ = {'extend_existing': True}
    
    matb = db.Column(db.String(20), primary_key=True, name='MATB')
    tieude = db.Column(db.String(150), nullable=False, name='TIEUDE')
    noidung = db.Column(db.Text, name='NOIDUNG')
    ngaydang = db.Column(db.DateTime, default=datetime.utcnow, name='NGAYDANG')
    makhoa = db.Column(db.String(15), db.ForeignKey('KHOA.MAKHOA'), nullable=True, name='MAKHOA')

    khoa = db.relationship('Khoa', backref=db.backref('thongbao_list', lazy=True))

class SvThongBao(db.Model):
    __tablename__ = 'SV_THONGBAO'
    __table_args__ = {'extend_existing': True}
    
    mssv = db.Column(db.String(20), db.ForeignKey('SINHVIEN.MSSV'), primary_key=True, name='MSSV')
    matb = db.Column(db.String(20), db.ForeignKey('THONGBAO.MATB'), primary_key=True, name='MATB')
    trangthai_doc = db.Column(db.Integer, default=0, name='TRANGTHAI_DOC')
    thoigian_doc = db.Column(db.DateTime, nullable=True, name='THOIGIAN_DOC')

    thongbao = db.relationship('ThongBao', backref=db.backref('sv_thongbao_list', lazy=True, cascade="all, delete-orphan"))
    sinhvien = db.relationship('SinhVien', backref=db.backref('sv_thongbao_list', lazy=True, cascade="all, delete-orphan"))