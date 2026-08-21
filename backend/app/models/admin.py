# backend/app/models/admin.py
from app import db

class AdminGiaoVu(db.Model):
    __tablename__ = 'ADMIN_GIAOVU'
    __table_args__ = {'extend_existing': True}
    
    magv = db.Column(db.String(10), primary_key=True, name='MAGV')
    hoten = db.Column(db.String(80), nullable=False, name='HOTEN')
    email = db.Column(db.String(100), unique=True, nullable=False, name='EMAIL')
    vaitro = db.Column(db.String(100), name='VAITRO')
    makhoa = db.Column(db.String(15), db.ForeignKey('KHOA.MAKHOA'), nullable=True, name='MAKHOA')
    trangthai = db.Column(db.String(50), name='TRANGTHAI')
    
    khoa = db.relationship('Khoa', backref='admin_list', lazy=True)

    def to_dict(self):
        words = self.hoten.strip().split() if self.hoten else []
        initials = "".join([w[0] for w in words[-2:]]).upper() if len(words) >= 2 else (words[0][0].upper() if words else "AD")
        return {
            "username": self.magv,
            "magv": self.magv,
            "msid": self.magv,
            "name": self.hoten,
            "label": self.hoten,
            "hoten": self.hoten,
            "email": self.email,
            "role": "admin",
            "vaitro": self.vaitro or "Giáo vụ",
            "makhoa": self.makhoa or "",
            "tenkhoa": self.khoa.tenkhoa if self.khoa else "",
            "trangthai": self.trangthai or "Hoạt động",
            "initials": initials
        }