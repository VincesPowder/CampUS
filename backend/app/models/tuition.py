from app import db

class LopHocPhan(db.Model):
    __tablename__ = 'LOPHOCPHAN' #[cite: 2]
    
    malhp = db.Column(db.String(10), primary_key=True, name='MALHP') #[cite: 2]
    mamh = db.Column(db.String(10), db.ForeignKey('MONHOC.MAMH'), name='MAMH') #[cite: 2]
    ma_hocky = db.Column(db.String(10), db.ForeignKey('HOCKY_NAMHOC.MA_HOCKY'), name='MA_HOCKY') #[cite: 2]
    tenlop = db.Column(db.String(20), name='TENLOP') #[cite: 2]
    tengv = db.Column(db.String(80), name='TENGV') #[cite: 2]

class HocPhi(db.Model):
    __tablename__ = 'HOCPHI' #[cite: 2]
    
    mssv = db.Column(db.String(8), db.ForeignKey('SINHVIEN.MSSV'), primary_key=True, name='MSSV') #[cite: 2]
    malhp = db.Column(db.String(10), db.ForeignKey('LOPHOCPHAN.MALHP'), primary_key=True, name='MALHP') #[cite: 2]
    sotchp = db.Column(db.Integer, default=0, name='SOTCHP') #[cite: 2]
    hocphi_goc = db.Column(db.Numeric(12, 2), default=0, name='HOCPHI_GOC') #[cite: 2]
    mucgiam = db.Column(db.Numeric(12, 2), default=0, name='MUCGIAM') #[cite: 2]
    hotro = db.Column(db.Numeric(12, 2), default=0, name='HOTRO') #[cite: 2]
    chiphikhac = db.Column(db.Numeric(12, 2), default=0, name='CHIPHIKHAC') #[cite: 2]
    thucdong = db.Column(db.Numeric(12, 2), name='THUCDONG') #[cite: 2]
    ghichu = db.Column(db.Text, name='GHICHU') #[cite: 2]
    trangthai_thanhtoan = db.Column(db.String(50), name='TRANGTHAI_THANHTOAN') #[cite: 2]
    ngaythanhtoan = db.Column(db.DateTime, name='NGAYTHANHTOAN') #[cite: 2]

    # Relationships[cite: 3]
    sinhvien = db.relationship('SinhVien', backref='hocphi_list')
    lophocphan = db.relationship('LopHocPhan', backref='hocphi_list')