import base64
import json
import os
import sqlite3

from flask import Blueprint, request, jsonify

auth_bp = Blueprint('auth', __name__)

DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'database', 'campus.db'))

def _get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def _find_user_by_email(email: str):
    normalized_email = (email or '').strip().lower()
    if not normalized_email:
        return None

    with _get_db_connection() as conn:
        # Ưu tiên check Admin trước
        admin = conn.execute(
            """
            SELECT lower(EMAIL) AS email, HOTEN AS name, MAGV AS admin_id, 'admin' AS role, '' AS avatar
            FROM ADMIN_GIAOVU
            WHERE lower(EMAIL) = ?
            LIMIT 1
            """,
            (normalized_email,),
        ).fetchone()
        if admin:
            return dict(admin)

        # Check Sinh viên
        student = conn.execute(
            """
            SELECT lower(MAILTRUONG) AS email, HOTEN AS name, MSSV AS student_id, 'student' AS role, AVATAR AS avatar
            FROM SINHVIEN
            WHERE lower(MAILTRUONG) = ? OR lower(MAILCANHAN) = ?
            LIMIT 1
            """,
            (normalized_email, normalized_email),
        ).fetchone()
        if student:
            return dict(student)

    return None

def _extract_email_from_token(token: str):
    if not token:
        return ''
    try:
        payload = token.split('.')[1]
        padding = '=' * (-len(payload) % 4)
        decoded = base64.urlsafe_b64decode(payload + padding).decode('utf-8')
        token_data = json.loads(decoded)
        for key in ('preferred_username', 'upn', 'email', 'username'):
            value = token_data.get(key)
            if isinstance(value, str) and '@' in value:
                return value
    except Exception:
        return ''
    return ''

def _provision_student(email: str, name: str, avatar: str):
    """
    Tự động cấp phát tài khoản nếu sinh viên lần đầu đăng nhập
    """
    mssv = email.split('@')[0]
    
    # Fallback cho tên nếu Graph API của MS không trả về name
    if not name:
        name = f"Sinh viên {mssv}"
        
    with _get_db_connection() as conn:
        conn.execute(
            """
            INSERT INTO SINHVIEN (MSSV, HOTEN, MAILTRUONG, AVATAR, LOAISV)
            VALUES (?, ?, ?, ?, 'Sinh viên (Đang học)')
            """,
            (mssv, name, email, avatar)
        )
        conn.commit()
        
    return {
        'email': email,
        'name': name,
        'student_id': mssv,
        'role': 'student',
        'avatar': avatar
    }

# Đã xóa endpoint /api/auth/login cũ vì CampUS không sử dụng username/password

@auth_bp.route('/api/auth/ms-login', methods=['POST'])
def ms_login():
    data = request.get_json(silent=True) or {}
    token = data.get('token', '')
    
    # Nhận dữ liệu Name, Avatar (nếu Frontend đã gọi Graph API)
    email = (data.get('email') or '').strip().lower()
    name = data.get('name', '').strip()
    avatar = data.get('avatar', '').strip()

    if not email:
        email = _extract_email_from_token(token).strip().lower()

    # Xử lý Alt Flow 2: Lỗi xác thực từ MS Provider
    if not email:
        return jsonify({'error': 'Đăng nhập thất bại. Vui lòng cấp quyền truy cập hoặc thử lại.'}), 400

    # Xử lý Alt Flow 1: Domain không hợp lệ
    if not email.endswith('@student.hcmus.edu.vn'):
        return jsonify({
            'error': 'Hệ thống chỉ hỗ trợ đăng nhập bằng email sinh viên (@student.hcmus.edu.vn). Vui lòng thử lại.'
        }), 403

    user = _find_user_by_email(email)
    
    # Xử lý Step 7: Auto-provisioning nếu profile chưa tồn tại trong DB
    if not user:
        try:
            user = _provision_student(email, name, avatar)
        except Exception as e:
            return jsonify({'error': f'Lỗi khởi tạo hồ sơ: {str(e)}'}), 500

    return jsonify({
        'message': 'Đăng nhập thành công',
        'token': f"jwt_token_{user['role']}_{user.get('student_id') or user.get('admin_id')}",
        'role': user['role'],
        'user': {
            'name': user['name'],
            'email': user['email'],
            'avatar': user.get('avatar') or ''
        }
    }), 200