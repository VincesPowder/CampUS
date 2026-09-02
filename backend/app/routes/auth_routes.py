# backend/app/routes/auth_routes.py
from flask import Blueprint, request, jsonify, current_app
from sqlalchemy import func
from app.models.admin import AdminGiaoVu
from app.models.student import SinhVien
import jwt
import datetime

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')
@auth_bp.route('/ms-login', methods=['GET', 'POST'])
@auth_bp.route('/ms-login/', methods=['GET', 'POST'])
def ms_login():
    data = request.get_json(silent=True, force=True) or {}
    email = data.get('email', '').strip().lower()
    name = data.get('name', '')

    if not email and data.get('token'):
        try:
            token_claims = jwt.decode(data['token'], options={"verify_signature": False})
            email = (
                token_claims.get('preferred_username') 
                or token_claims.get('email') 
                or token_claims.get('upn') 
                or ''
            ).strip().lower()
            if not name:
                name = token_claims.get('name', '')
        except Exception as e:
            pass

    secret_key = str(current_app.config.get('SECRET_KEY') or 'campus_secret_key_2026_hcmus_super_secret_key_32bytes')

    # 1. Kiểm tra nếu là ADMIN / GIÁO VỤ (tìm theo cột email trong ADMIN_GIAOVU)
    admin = AdminGiaoVu.query.filter(func.lower(AdminGiaoVu.email) == email).first()
    if admin:
        if admin.trangthai and admin.trangthai.lower() in ['khóa', 'locked', 'inactive']:
            return jsonify({"status": "error", "message": "Tài khoản giáo vụ đang bị tạm khóa."}), 403

        admin_data = admin.to_dict()
        token_payload = {
            "sub": str(admin.magv),
            "email": str(admin.email),
            "name": str(admin.hoten or name),
            "role": "admin",
            "msid": str(admin.magv),
            "exp": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=7)
        }
        token = jwt.encode(token_payload, secret_key, algorithm="HS256")
        if isinstance(token, bytes):
            token = token.decode('utf-8')

        return jsonify({
            "status": "success",
            "role": "admin",
            "token": token,
            "data": admin_data
        }), 200

    # 2. Kiểm tra nếu là SINH VIÊN (tìm theo mailtruong hoặc theo mssv)
    sinhvien = SinhVien.query.filter(func.lower(SinhVien.mailtruong) == email).first()
    
    # Fallback: nếu mailtruong trong DB chưa cập nhật hoặc tìm theo tiền tố MSSV của email
    if not sinhvien:
        mssv_candidate = email.split('@')[0].strip()
        sinhvien = SinhVien.query.filter(func.lower(SinhVien.mssv) == mssv_candidate.lower()).first()

    if sinhvien:
        student_data = sinhvien.to_dict() if hasattr(sinhvien, 'to_dict') else {
            "mssv": sinhvien.mssv,
            "name": sinhvien.hoten,
            "hoten": sinhvien.hoten,
            "email": sinhvien.mailtruong or email,
            "mailtruong": sinhvien.mailtruong or email,
            "role": "student"
        }
        student_data['email'] = sinhvien.mailtruong or email
        student_data['role'] = 'student'

        token_payload = {
            "sub": str(sinhvien.mssv),
            "email": str(sinhvien.mailtruong or email),
            "name": str(sinhvien.hoten or name),
            "role": "student",
            "mssv": str(sinhvien.mssv),
            "exp": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=7)
        }
        token = jwt.encode(token_payload, secret_key, algorithm="HS256")
        if isinstance(token, bytes):
            token = token.decode('utf-8')

        return jsonify({
            "status": "success",
            "role": "student",
            "token": token,
            "data": student_data
        }), 200

    # 3. Email không có trong hệ thống
    return jsonify({
        "status": "error",
        "message": f"Tài khoản {email} không tồn tại trong hệ thống HCMUS."
    }), 403
