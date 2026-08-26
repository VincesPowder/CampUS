# backend/app/models/tuition.py
from app import db
from app.models.academic import HocKyNamHoc, LopHocPhan, MonHoc

class HocPhi(db.Model):
    __tablename__ = 'HOCPHI'
    __table_args__ = {'extend_existing': True}
    
    mssv = db.Column(db.String(20), db.ForeignKey('SINHVIEN.MSSV'), primary_key=True, name='MSSV')
    malhp = db.Column(db.String(10), db.ForeignKey('LOPHOCPHAN.MALHP'), primary_key=True, name='MALHP')
    sotchp = db.Column(db.Integer, default=0, name='SOTCHP')
    hocphi_goc = db.Column(db.Float, default=0.0, name='HOCPHI_GOC')
    mucgiam = db.Column(db.Float, default=0.0, name='MUCGIAM')
    hotro = db.Column(db.Float, default=0.0, name='HOTRO')
    chiphikhac = db.Column(db.Float, default=0.0, name='CHIPHIKHAC')
    thucdong = db.Column(db.Float, default=0.0, name='THUCDONG')
    ghichu = db.Column(db.Text, name='GHICHU')
    trangthai_thanhtoan = db.Column(db.String(50), default='Chưa thanh toán', name='TRANGTHAI_THANHTOAN')
    ngaythanhtoan = db.Column(db.DateTime, name='NGAYTHANHTOAN')

    sinhvien = db.relationship('SinhVien', backref=db.backref('hocphi_list', lazy=True))
    lophocphan = db.relationship('LopHocPhan', backref=db.backref('hocphi_list', lazy=True))