from app import db
from datetime import datetime

class KhaoSat(db.Model):
    __tablename__ = 'KHAOSAT'
    maks = db.Column(db.String(20), primary_key=True, name='MAKS')
    tenks = db.Column(db.String(80), nullable=False, name='TENKS')
    noidung = db.Column(db.Text, name='NOIDUNG')
    handon = db.Column(db.String(50), name='HANDON')  # TEXT or String for date

class CauHoiKhaoSat(db.Model):
    __tablename__ = 'CAUHOI_KHAOSAT'
    mach = db.Column(db.String(20), primary_key=True, name='MACH')
    maks = db.Column(db.String(20), db.ForeignKey('KHAOSAT.MAKS'), name='MAKS')
    noidung_cauhoi = db.Column(db.Text, nullable=False, name='NOIDUNG_CAUHOI')
    loai_cauhoi = db.Column(db.String(50), name='LOAI_CAUHOI')
    thutu = db.Column(db.Integer, name='THUTU')

    khaosat = db.relationship('KhaoSat', backref='cauhois')

class SvKhaoSat(db.Model):
    __tablename__ = 'SV_KHAOSAT'
    mssv = db.Column(db.String(8), db.ForeignKey('SINHVIEN.MSSV'), primary_key=True, name='MSSV')
    maks = db.Column(db.String(20), db.ForeignKey('KHAOSAT.MAKS'), primary_key=True, name='MAKS')
    trangthai_lam = db.Column(db.String(50), name='TRANGTHAI_LAM')
    thoigian_nop = db.Column(db.DateTime, name='THOIGIAN_NOP')

    sinhvien = db.relationship('SinhVien', backref='sv_khaosat_list')
    khaosat = db.relationship('KhaoSat', backref='sv_khaosat_list')

class TraLoiKhaoSat(db.Model):
    __tablename__ = 'TRALOI_KHAOSAT'
    mach = db.Column(db.String(20), db.ForeignKey('CAUHOI_KHAOSAT.MACH'), primary_key=True, name='MACH')
    mssv = db.Column(db.String(8), db.ForeignKey('SINHVIEN.MSSV'), primary_key=True, name='MSSV')
    noidung_traloi = db.Column(db.Text, name='NOIDUNG_TRALOI')
    thoigian_traloi = db.Column(db.DateTime, default=datetime.utcnow, name='THOIGIAN_TRALOI')

    cauhoi = db.relationship('CauHoiKhaoSat', backref='tralois')
    sinhvien = db.relationship('SinhVien', backref='traloi_list')
