# backend/app/models/chat.py
from app import db

class ChatSession(db.Model):
    """
    Model cho bảng CHATBOT_SESSION, lưu lịch sử phiên chat của sinh viên.
    """
    __tablename__ = 'CHATBOT_SESSION'
    masession = db.Column('MASESSION', db.String(10), primary_key=True)
    
    # Chỉ định tên cột trong DB là 'MSSV' và tham chiếu đúng khóa ngoại
    mssv = db.Column('MSSV', db.String(8), db.ForeignKey('SINHVIEN.MSSV'), nullable=False)
    
    # Sửa tên cột cho đúng với Database (Viết hoa)
    thoigian_batdau = db.Column('THOIGIAN_BATDAU', db.DateTime, default=db.func.current_timestamp())
    thoigian_ketthuc = db.Column('THOIGIAN_KETTHUC', db.DateTime)
    
    # SỬA LỖI CHÍNH: 'muccdo' -> 'MUCDO_HAILONG'
    muccdo_hailong = db.Column('MUCDO_HAILONG', db.Integer)
    
    trangthai_giaiquyet = db.Column('TRANGTHAI_GIAIQUYET', db.String(50))

class ChatMessage(db.Model):
    """
    Model cho bảng CHATBOT_MESSAGE, lưu tin nhắn trong phiên chat.
    """
    __tablename__ = 'CHATBOT_MESSAGE'
    mamsg = db.Column('MAMSG', db.String(10), primary_key=True)
    masession = db.Column('MASESSION', db.String(10), db.ForeignKey('CHATBOT_SESSION.MASESSION'), nullable=False)
    nguoigui = db.Column('NGUOIGUI', db.String(8), nullable=False)
    noidung_tinnhan = db.Column('NOIDUNG_TINNHAN', db.Text)
    thoigian_gui = db.Column('THOIGIAN_GUI', db.DateTime, default=db.func.current_timestamp())
    loai_tinnhan = db.Column('LOAI_TINNHAN', db.String(50))
    intent_phathien = db.Column('INTENT_PHATHIEN', db.String(80))