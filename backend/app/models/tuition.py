from app import db

class HocKyNamHoc(db.Model):
    __tablename__ = 'HOCKY_NAMHOC'
    ma_hocky = db.Column(db.String(10), primary_key=True, name='MA_HOCKY')
    ten_hocky = db.Column(db.String(50), name='TEN_HOCKY')
    namhoc = db.Column(db.String(20), name='NAMHOC')

class MonHoc(db.Model):
    __tablename__ = 'MONHOC'
    mamh = db.Column(db.String(10), primary_key=True, name='MAMH')
    tenmh = db.Column(db.String(80), name='TENMH')
    sotc = db.Column(db.Integer, default=0, name='SOTC')
    sotiet = db.Column(db.Integer, default=0, name='SOTIET')

class LopHocPhan(db.Model):
    __tablename__ = 'LOPHOCPHAN' 
    malhp = db.Column(db.String(10), primary_key=True, name='MALHP') 
    mamh = db.Column(db.String(10), db.ForeignKey('MONHOC.MAMH'), name='MAMH') 
    ma_hocky = db.Column(db.String(10), db.ForeignKey('HOCKY_NAMHOC.MA_HOCKY'), name='MA_HOCKY') 
    tenlop = db.Column(db.String(20), name='TENLOP') 
    tengv = db.Column(db.String(80), name='TENGV') 

    # Thêm relationship để dễ dàng query JOIN
    monhoc = db.relationship('MonHoc', backref='lophocphan_list')
    hocky_namhoc = db.relationship('HocKyNamHoc', backref='lophocphan_list')

class HocPhi(db.Model):
    __tablename__ = 'HOCPHI' 
    mssv = db.Column(db.String(8), db.ForeignKey('SINHVIEN.MSSV'), primary_key=True, name='MSSV') 
    malhp = db.Column(db.String(10), db.ForeignKey('LOPHOCPHAN.MALHP'), primary_key=True, name='MALHP') 
    sotchp = db.Column(db.Integer, default=0, name='SOTCHP') 
    hocphi_goc = db.Column(db.Numeric(12, 2), default=0, name='HOCPHI_GOC') 
    mucgiam = db.Column(db.Numeric(12, 2), default=0, name='MUCGIAM') 
    hotro = db.Column(db.Numeric(12, 2), default=0, name='HOTRO') 
    chiphikhac = db.Column(db.Numeric(12, 2), default=0, name='CHIPHIKHAC') 
    thucdong = db.Column(db.Numeric(12, 2), name='THUCDONG') 
    ghichu = db.Column(db.Text, name='GHICHU') 
    trangthai_thanhtoan = db.Column(db.String(50), name='TRANGTHAI_THANHTOAN') 
    ngaythanhtoan = db.Column(db.DateTime, name='NGAYTHANHTOAN') 

    sinhvien = db.relationship('SinhVien', backref='hocphi_list')
    lophocphan = db.relationship('LopHocPhan', backref='hocphi_list')