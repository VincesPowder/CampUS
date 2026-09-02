# backend/app/routes/admin_routes.py
from flask import Blueprint, request, jsonify, make_response, g
from functools import wraps
from datetime import datetime
import csv
import io
import re

from app import db
from app.models.student import SinhVien, NguoiThan, DotCapNhatHoSo, Khoa, Nganh, LienHeHeThong
from app.models.academic import HocKyNamHoc, MonHoc, LopHocPhan, KetQuaHocTap, LichSuChinhSua, TienDoHocTap, TienDoNhomHocPhan
from app.models.notification import ThongBao, SvThongBao
from app.models.survey import KhaoSat, CauHoiKhaoSat, SvKhaoSat, TraLoiKhaoSat
from app.models.tuition import HocPhi
from app.models.user import User
from app.models.admin import AdminGiaoVu
from app.models.schedule import LichHoc, LichThi

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')

# ══════════════════════════════════════════════════════════════════════════════
# ─── HELPER FUNCTIONS & DECORATORS ───────────────────────────────────────────
# ══════════════════════════════════════════════════════════════════════════════

def get_current_admin():
    """
    Lấy thông tin Giáo vụ / Quản trị viên từ Header X-Admin-Email hoặc Query param.
    """
    admin_email = request.headers.get('X-Admin-Email') or request.args.get('admin_email')
    if not admin_email:
        return None
    return AdminGiaoVu.query.filter_by(email=admin_email, trangthai=1).first()

def faculty_required(f):
    """
    Decorator tự động nạp thông tin Khoa vào biến toàn cục `g`.
    - SuperAdmin / makhoa=None: Toàn quyền toàn trường.
    - Giáo vụ khoa: Giới hạn theo g.makhoa.
    - Fallback: Mặc định toàn trường nếu chưa truyền Header.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        admin = get_current_admin()
        if admin:
            g.admin = admin
            g.makhoa = admin.makhoa
            g.is_super_admin = (admin.vaitro == 'SuperAdmin' or admin.makhoa is None)
        else:
            g.admin = None
            g.makhoa = request.args.get('khoa_filter', None)
            g.is_super_admin = True if not g.makhoa else False
            
        return f(*args, **kwargs)
    return decorated_function

def parse_date(date_str):
    if not date_str or str(date_str).strip() in ['', '—', 'None']:
        return None
    for fmt in ('%d/%m/%Y', '%Y-%m-%d', '%Y/%m/%d'):
        try:
            return datetime.strptime(str(date_str).strip(), fmt).date()
        except ValueError:
            pass
    return None

def format_date(d):
    return d.strftime('%d/%m/%Y') if d else ""

def parse_time_val(time_str):
    if not time_str: return None
    try:
        t_clean = str(time_str).strip().split('–')[0].strip().split('-')[0].strip()
        return datetime.strptime(t_clean, '%H:%M').time()
    except Exception:
        return None

def normalize_thu(thu_str):
    if not thu_str: return "Thứ hai"
    t = str(thu_str).strip().lower()
    if "hai" in t or t == "2": return "Thứ hai"
    if "ba" in t or t == "3": return "Thứ ba"
    if "tư" in t or "tu" in t or t == "4": return "Thứ tư"
    if "năm" in t or "nam" in t or t == "5": return "Thứ năm"
    if "sáu" in t or "sau" in t or t == "6": return "Thứ sáu"
    if "bảy" in t or "bay" in t or t == "7": return "Thứ bảy"
    if "nhật" in t or "nhat" in t or "cn" in t: return "Chủ nhật"
    return thu_str

def resolve_manganh(nganh_input, makhoa_limit=None):
    query = Nganh.query
    if makhoa_limit:
        query = query.filter_by(makhoa=makhoa_limit)
        
    if not nganh_input:
        first_ng = query.first()
        return first_ng.manganh if first_ng else None
    
    nganh_obj = query.filter(
        (Nganh.manganh == nganh_input) | 
        (Nganh.tennganh.ilike(f"%{nganh_input}%"))
    ).first()
    
    if nganh_obj:
        return nganh_obj.manganh
        
    first_ng = query.first()
    return first_ng.manganh if first_ng else None

def tinh_diem_chu(diem_he10):
    if diem_he10 is None: return "", "Chưa có"
    d = float(diem_he10)
    if d >= 9.0: return "A+", "Đạt"
    if d >= 8.5: return "A", "Đạt"
    if d >= 8.0: return "B+", "Đạt"
    if d >= 7.0: return "B", "Đạt"
    if d >= 6.5: return "C+", "Đạt"
    if d >= 5.5: return "C", "Đạt"
    if d >= 5.0: return "D+", "Đạt"
    if d >= 4.0: return "D", "Đạt"
    return "F", "Không đạt"

def xac_dinh_ca_thi(giothi_val):
    """
    Phân loại ca thi chuẩn theo giờ bắt đầu trong DB
    """
    if not giothi_val:
        return "Ca 1"
    
    if hasattr(giothi_val, 'hour'):
        hour = giothi_val.hour
        minute = giothi_val.minute
    else:
        try:
            parts = str(giothi_val).split(':')
            hour = int(parts[0])
            minute = int(parts) if len(parts) > 1 else 0
        except Exception:
            return "Ca 1"
            
    total_minutes = hour * 60 + minute

    if total_minutes < 9 * 60 + 15:       # Trước 09:15 -> Ca 1
        return "Ca 1"
    elif total_minutes < 12 * 60:         # 09:15 đến 12:00 -> Ca 2
        return "Ca 2"
    elif total_minutes < 15 * 60:         # 12:00 đến 15:00 -> Ca 3
        return "Ca 3"
    elif total_minutes < 17 * 60 + 30:    # 15:00 đến 17:30 -> Ca 4
        return "Ca 4"
    else:                                 # Sau 17:30 -> Ca 5
        return "Ca 5"

def get_faculty_lhp_ids(makhoa):
    """
    Lấy danh sách mã lớp học phần (Python list) mà sinh viên thuộc khoa đang theo học
    """
    if not makhoa:
        return []
    try:
        rows = db.session.query(KetQuaHocTap.malhp)\
            .join(SinhVien, KetQuaHocTap.mssv == SinhVien.mssv)\
            .join(Nganh, SinhVien.manganh == Nganh.manganh)\
            .filter(Nganh.makhoa == makhoa)\
            .distinct().all()
        return [r[0] for r in rows if r[0]]
    except Exception as e:
        print("Lỗi get_faculty_lhp_ids:", e)
        return []
# ══════════════════════════════════════════════════════════════════════════════
# ─── 0. THÔNG TIN ADMIN HIỆN TẠI ──────────────────────────────────────────────
# ══════════════════════════════════════════════════════════════════════════════

@admin_bp.route('/me', methods=['GET'])
@faculty_required
def get_current_admin_info():
    if not g.admin:
        return jsonify({
            "status": "success",
            "data": {
                "magv": "SUPER",
                "hoTen": "Quản trị viên toàn trường",
                "email": "admin@hcmus.edu.vn",
                "vaiTro": "SuperAdmin",
                "maKhoa": None,
                "tenKhoa": "Toàn trường",
                "isSuperAdmin": True
            }
        }), 200
        
    ten_khoa = g.admin.khoa.tenkhoa if g.admin.khoa else "Toàn trường"
    return jsonify({
        "status": "success",
        "data": {
            "magv": g.admin.magv,
            "hoTen": g.admin.hoten,
            "email": g.admin.email,
            "vaiTro": g.admin.vaitro or "Giáo vụ",
            "maKhoa": g.admin.makhoa,
            "tenKhoa": ten_khoa,
            "isSuperAdmin": g.is_super_admin
        }
    }), 200


# ══════════════════════════════════════════════════════════════════════════════
# ─── 1. PHÂN HỆ QUẢN LÝ SINH VIÊN (STUDENT MANAGEMENT) ───────────────────────
# ══════════════════════════════════════════════════════════════════════════════

@admin_bp.route('/students', methods=['GET'])
@faculty_required
def get_students():
    try:
        query = SinhVien.query.join(Nganh).join(Khoa)
        
        # Phân quyền: Giáo vụ khoa chỉ xem SV thuộc khoa mình
        if not g.is_super_admin and g.makhoa:
            query = query.filter(Nganh.makhoa == g.makhoa)
            
        search = request.args.get('search', '').strip()
        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                (SinhVien.hoten.ilike(search_pattern)) |
                (SinhVien.mssv.ilike(search_pattern)) |
                (SinhVien.mailtruong.ilike(search_pattern))
            )
            
        students = query.order_by(SinhVien.mssv.desc()).all()
        result = []
        for s in students:
            ten_khoa = s.nganh.khoa.tenkhoa if (s.nganh and s.nganh.khoa) else ""
            ten_nganh = s.nganh.tennganh if s.nganh else ""
            
            result.append({
                "mssv": s.mssv,
                "hoTen": s.hoten or "",
                "email": s.mailtruong or f"{s.mssv}@student.hcmus.edu.vn",
                "gioiTinh": s.gioitinh or "Nam",
                "khoa": s.nienkhoa or "2024",
                "nganh": ten_khoa or ten_nganh or "",
                "tenNganh": ten_nganh,
                "bacDT": s.bacdaotao or "Đại học",
                "loaiDT": s.loaidaotao or "Chính quy",
                "chuyenNganh": s.macn or "",
                "ngaySinh": format_date(s.ngaysinh),
                "noiSinh": s.noisinh or "",
                "cccd": s.cccd or "",
                "ngayCap": format_date(s.ngaycap),
                "noiCap": s.noicap or "",
                "quocTich": s.quoctich or "Việt Nam",
                "danToc": s.dantoc or "Kinh",
                "tonGiao": s.tongiao or "Không",
                "sdt": s.dienthoai or "",
                "personalEmail": s.mailcanhan or "",
                "ngayVaoTruong": "01/09/2024",
                "ngayVaoDoan": format_date(s.ngayvaodoan) or "—",
                "ngayVaoDang": format_date(s.ngayvaodang) or "—",
                "thuongTru": s.dcthuongtru or "",
                "hienNay": s.dchiennay or "",
                "lienLac": s.dclienlac or "",
                "cvTen": s.nguoilienlac or "",
                "cvSdt": s.sdtlienlac or "",
                "cvEmail": s.maillienlac or "",
                "cvQuanHe": s.quanhe_nll or "Giảng viên cố vấn",
                "nganHang": s.tennh or "",
                "stk": s.sothenh or "",
                "chiNhanh": "TP. Hồ Chí Minh"
            })
        return jsonify({"status": "success", "data": result}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@admin_bp.route('/students/<mssv>', methods=['GET'])
@faculty_required
def get_student_detail(mssv):
    try:
        s = SinhVien.query.filter_by(mssv=mssv).first()
        if not s:
            return jsonify({"status": "error", "message": "Không tìm thấy sinh viên"}), 404
            
        # Phân quyền: Giáo vụ chỉ xem chi tiết sinh viên thuộc khoa mình
        if not g.is_super_admin and g.makhoa:
            if s.nganh and s.nganh.makhoa != g.makhoa:
                return jsonify({"status": "error", "message": "Không có quyền truy cập sinh viên khoa khác"}), 403
        
        ten_khoa = s.nganh.khoa.tenkhoa if (s.nganh and s.nganh.khoa) else ""
        ten_nganh = s.nganh.tennganh if s.nganh else ""
        
        family = []
        for mem in s.nguoithan_list:
            family.append({
                "id": mem.mant,
                "name": mem.hoten or "",
                "dob": str(mem.namsinh) if mem.namsinh else "",
                "rel": mem.quanhe or "",
                "job": mem.nghenghiep or "",
                "workplace": mem.noilamviec or "",
                "phone": mem.sdt or "",
                "email": mem.mail or "",
                "ethnic": mem.dantoc or "Kinh",
                "religion": mem.tongiao or "Không",
                "nationality": mem.quoctich or "Việt Nam",
                "address": mem.hkthuongtru or ""
            })
            
        return jsonify({
            "status": "success",
            "data": {
                "mssv": s.mssv,
                "hoTen": s.hoten,
                "email": s.mailtruong or f"{s.mssv}@student.hcmus.edu.vn",
                "gioiTinh": s.gioitinh or "Nam",
                "khoa": s.nienkhoa or "2024",
                "nganh": ten_khoa or ten_nganh or "",
                "bacDT": s.bacdaotao or "Đại học",
                "loaiDT": s.loaidaotao or "Chính quy",
                "chuyenNganh": s.macn or "",
                "ngaySinh": format_date(s.ngaysinh),
                "noiSinh": s.noisinh or "",
                "cccd": s.cccd or "",
                "ngayCap": format_date(s.ngaycap),
                "noiCap": s.noicap or "",
                "quocTich": s.quoctich or "Việt Nam",
                "danToc": s.dantoc or "Kinh",
                "tonGiao": s.tongiao or "Không",
                "sdt": s.dienthoai or "",
                "personalEmail": s.mailcanhan or "",
                "ngayVaoTruong": "01/09/2024",
                "ngayVaoDoan": format_date(s.ngayvaodoan) or "—",
                "ngayVaoDang": format_date(s.ngayvaodang) or "—",
                "thuongTru": s.dcthuongtru or "",
                "hienNay": s.dchiennay or "",
                "lienLac": s.dclienlac or "",
                "cvTen": s.nguoilienlac or "",
                "cvSdt": s.sdtlienlac or "",
                "cvEmail": s.maillienlac or "",
                "cvQuanHe": s.quanhe_nll or "Giảng viên cố vấn",
                "nganHang": s.tennh or "",
                "stk": s.sothenh or "",
                "chiNhanh": "TP. Hồ Chí Minh",
                "family": family
            }
        }), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@admin_bp.route('/students', methods=['POST'])
@faculty_required
def add_student():
    try:
        data = request.get_json() or {}
        mssv = str(data.get('mssv', '')).strip()
        ho_ten = str(data.get('hoTen', '')).strip()
        
        if not mssv or not ho_ten:
            return jsonify({"status": "error", "message": "MSSV và Họ tên là bắt buộc"}), 400
            
        existing = SinhVien.query.filter_by(mssv=mssv).first()
        if existing:
            return jsonify({"status": "error", "message": f"Sinh viên với MSSV {mssv} đã tồn tại"}), 400
            
        email = data.get('email', '').strip() or f"{mssv}@student.hcmus.edu.vn"
        manganh_val = resolve_manganh(data.get('nganh'), makhoa_limit=g.makhoa if not g.is_super_admin else None)
        
        # Phân quyền: Kiểm tra ngành có thuộc Khoa của giáo vụ không
        if not g.is_super_admin and g.makhoa:
            ng_obj = Nganh.query.filter_by(manganh=manganh_val).first()
            if not ng_obj or ng_obj.makhoa != g.makhoa:
                return jsonify({"status": "error", "message": "Bạn chỉ có thể thêm sinh viên vào ngành thuộc khoa của mình"}), 403
        
        new_sv = SinhVien(
            mssv=mssv,
            hoten=ho_ten,
            mailtruong=email,
            gioitinh=data.get('gioiTinh', 'Nam'),
            nienkhoa=data.get('khoa', '2024'),
            bacdaotao=data.get('bacDT', 'Đại học'),
            loaidaotao=data.get('loaiDT', 'Chính quy'),
            macn=data.get('chuyenNganh', ''),
            manganh=manganh_val,
            ngaysinh=parse_date(data.get('ngaySinh')),
            noisinh=data.get('noiSinh', ''),
            cccd=data.get('cccd', ''),
            dienthoai=data.get('sdt', ''),
            mailcanhan=data.get('personalEmail', ''),
            dcthuongtru=data.get('thuongTru', ''),
            dchiennay=data.get('hienNay', '')
        )
        
        db.session.add(new_sv)
        db.session.commit()
        return jsonify({"status": "success", "message": "Thêm sinh viên thành công"}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500

@admin_bp.route('/students/<mssv>', methods=['PUT'])
@faculty_required
def update_student(mssv):
    try:
        s = SinhVien.query.filter_by(mssv=mssv).first()
        if not s:
            return jsonify({"status": "error", "message": "Không tìm thấy sinh viên"}), 404
            
        # Phân quyền: Kiểm tra quyền sửa sinh viên thuộc Khoa
        if not g.is_super_admin and g.makhoa:
            if s.nganh and s.nganh.makhoa != g.makhoa:
                return jsonify({"status": "error", "message": "Không có quyền chỉnh sửa sinh viên khoa khác"}), 403
                
        data = request.get_json() or {}
        
        if 'hoTen' in data: s.hoten = data['hoTen']
        if 'gioiTinh' in data: s.gioitinh = data['gioiTinh']
        if 'khoa' in data: s.nienkhoa = data['khoa']
        if 'bacDT' in data: s.bacdaotao = data['bacDT']
        if 'loaiDT' in data: s.loaidaotao = data['loaiDT']
        if 'chuyenNganh' in data: s.macn = data['chuyenNganh']
        if 'email' in data: s.mailtruong = data['email']
        if 'nganh' in data and data['nganh']:
            manganh_val = resolve_manganh(data['nganh'], makhoa_limit=g.makhoa if not g.is_super_admin else None)
            if manganh_val:
                s.manganh = manganh_val
        
        if 'ngaySinh' in data: s.ngaysinh = parse_date(data['ngaySinh'])
        if 'noiSinh' in data: s.noisinh = data['noiSinh']
        if 'cccd' in data: s.cccd = data['cccd']
        if 'ngayCap' in data: s.ngaycap = parse_date(data['ngayCap'])
        if 'noiCap' in data: s.noicap = data['noiCap']
        if 'quocTich' in data: s.quoctich = data['quocTich']
        if 'danToc' in data: s.dantoc = data['danToc']
        if 'tonGiao' in data: s.tongiao = data['tonGiao']
        if 'sdt' in data: s.dienthoai = data['sdt']
        if 'personalEmail' in data: s.mailcanhan = data['personalEmail']
        if 'thuongTru' in data: s.dcthuongtru = data['thuongTru']
        if 'hienNay' in data: s.dchiennay = data['hienNay']
        if 'lienLac' in data: s.dclienlac = data['lienLac']
        
        if 'cvTen' in data: s.nguoilienlac = data['cvTen']
        if 'cvSdt' in data: s.sdtlienlac = data['cvSdt']
        if 'cvEmail' in data: s.maillienlac = data['cvEmail']
        if 'cvQuanHe' in data: s.quanhe_nll = data['cvQuanHe']
        
        if 'nganHang' in data: s.tennh = data['nganHang']
        if 'stk' in data: s.sothenh = data['stk']
        
        if 'family' in data and isinstance(data['family'], list):
            NguoiThan.query.filter_by(mssv=mssv).delete()
            for idx, m in enumerate(data['family']):
                if m.get('name'):
                    dob_val = None
                    if m.get('dob'):
                        try: dob_val = int(str(m['dob'])[:4])
                        except ValueError: dob_val = None
                            
                    new_mem = NguoiThan(
                        mant=f"NT_{mssv}_{idx+1}_{int(datetime.now().timestamp())}",
                        mssv=mssv,
                        hoten=m.get('name', ''),
                        namsinh=dob_val,
                        quanhe=m.get('rel', ''),
                        nghenghiep=m.get('job', ''),
                        noilamviec=m.get('workplace', ''),
                        sdt=m.get('phone', ''),
                        mail=m.get('email', ''),
                        dantoc=m.get('ethnic', 'Kinh'),
                        tongiao=m.get('religion', 'Không'),
                        quoctich=m.get('nationality', 'Việt Nam'),
                        hkthuongtru=m.get('address', '')
                    )
                    db.session.add(new_mem)
                    
        db.session.commit()
        return jsonify({"status": "success", "message": "Cập nhật thành công"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500

@admin_bp.route('/students/<mssv>', methods=['DELETE'])
@faculty_required
def delete_student(mssv):
    try:
        s = SinhVien.query.filter_by(mssv=mssv).first()
        if not s:
            return jsonify({"status": "error", "message": "Không tìm thấy sinh viên"}), 404
        
        # Phân quyền: Giáo vụ chỉ được xóa SV thuộc Khoa mình
        if not g.is_super_admin and g.makhoa:
            if s.nganh and s.nganh.makhoa != g.makhoa:
                return jsonify({"status": "error", "message": "Không có quyền xóa sinh viên thuộc khoa khác"}), 403
        
        NguoiThan.query.filter_by(mssv=mssv).delete()
        KetQuaHocTap.query.filter_by(mssv=mssv).delete()
        TienDoHocTap.query.filter_by(mssv=mssv).delete()
        TienDoNhomHocPhan.query.filter_by(mssv=mssv).delete()
        SvThongBao.query.filter_by(mssv=mssv).delete()
        SvKhaoSat.query.filter_by(mssv=mssv).delete()
        TraLoiKhaoSat.query.filter_by(mssv=mssv).delete()
        HocPhi.query.filter_by(mssv=mssv).delete()
        User.query.filter_by(email=s.mailtruong).delete()
        
        db.session.delete(s)
        db.session.commit()
        return jsonify({"status": "success", "message": f"Đã xóa sinh viên {mssv}"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500

@admin_bp.route('/students/import', methods=['POST'])
@faculty_required
def import_students():
    try:
        if 'file' not in request.files:
            return jsonify({"status": "error", "message": "Không tìm thấy file tải lên"}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({"status": "error", "message": "Tên file không hợp lệ"}), 400

        # Đọc dữ liệu file an toàn
        raw_bytes = file.stream.read()
        try:
            content_str = raw_bytes.decode("utf-8-sig")
        except UnicodeDecodeError:
            try:
                content_str = raw_bytes.decode("utf-8")
            except UnicodeDecodeError:
                content_str = raw_bytes.decode("latin-1")
                
        stream = io.StringIO(content_str, newline=None)
        
        # Tự động nhận diện dấu phẩy , hoặc dấu chấm phẩy ;
        first_line = content_str.splitlines()[0] if content_str.splitlines() else ""
        delim = ';' if ';' in first_line and ',' not in first_line else ','
        
        csv_reader = csv.reader(stream, delimiter=delim)
        header = next(csv_reader, None)  # Bỏ qua dòng tiêu đề
        imported_count = 0
        
        # Ngành mặc định theo Khoa của giáo vụ
        default_nganh = None
        if not g.is_super_admin and g.makhoa:
            ng = Nganh.query.filter_by(makhoa=g.makhoa).first()
            default_nganh = ng.manganh if ng else None
        else:
            default_nganh = resolve_manganh(None)

        def get_col(r, idx, default_val=""):
            if idx < len(r) and r[idx] is not None:
                val = str(r[idx]).strip()
                return val if val else default_val
            return default_val
        
        for row in csv_reader:
            if not row or len(row) < 2:
                continue
                
            # Lấy từng cột theo đúng chỉ mục số 0, 1, 2, 3, 4, 5, 6
            mssv      = get_col(row, 0)
            hoten     = get_col(row, 1)
            
            if not mssv or not hoten:
                continue
                
            email     = get_col(row, 2, f"{mssv}@student.hcmus.edu.vn")
            gioitinh  = get_col(row, 3, "Nam")
            nienkhoa  = get_col(row, 4, "2024")
            bacdaotao = get_col(row, 5, "Đại học")
            loaidaotao= get_col(row, 6, "Chính quy")
            
            existing = SinhVien.query.filter_by(mssv=mssv).first()
            if existing:
                # Nếu là giáo vụ khoa thì chỉ sửa sinh viên khoa mình
                if not g.is_super_admin and g.makhoa:
                    if existing.nganh and existing.nganh.makhoa != g.makhoa:
                        continue
                existing.hoten = hoten
                existing.mailtruong = email
                existing.gioitinh = gioitinh
                existing.nienkhoa = nienkhoa
                existing.bacdaotao = bacdaotao
                existing.loaidaotao = loaidaotao
            else:
                new_sv = SinhVien(
                    mssv=mssv,
                    hoten=hoten,
                    mailtruong=email,
                    gioitinh=gioitinh,
                    nienkhoa=nienkhoa,
                    bacdaotao=bacdaotao,
                    loaidaotao=loaidaotao,
                    manganh=default_nganh
                )
                db.session.add(new_sv)
            imported_count += 1
            
        db.session.commit()
        return jsonify({"status": "success", "message": f"Đã nhập thành công {imported_count} sinh viên"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": f"Lỗi xử lý file: {str(e)}"}), 500

@admin_bp.route('/students/export', methods=['GET'])
@faculty_required
def export_students():
    try:
        query = SinhVien.query.join(Nganh)
        if not g.is_super_admin and g.makhoa:
            query = query.filter(Nganh.makhoa == g.makhoa)
            
        students = query.order_by(SinhVien.mssv.desc()).all()
        
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["MSSV", "Họ và tên", "Email trường", "Giới tính", "Khóa", "Bậc ĐT", "Loại ĐT", "CCCD", "Điện thoại", "Email cá nhân", "Thường trú", "Hiện nay"])
        
        for s in students:
            writer.writerow([
                s.mssv,
                s.hoten or "",
                s.mailtruong or f"{s.mssv}@student.hcmus.edu.vn",
                s.gioitinh or "Nam",
                s.nienkhoa or "2024",
                s.bacdaotao or "Đại học",
                s.loaidaotao or "Chính quy",
                s.cccd or "",
                s.dienthoai or "",
                s.mailcanhan or "",
                s.dcthuongtru or "",
                s.dchiennay or ""
            ])
            
        response = make_response(output.getvalue())
        response.headers["Content-Disposition"] = "attachment; filename=danh_sach_sinh_vien.csv"
        response.headers["Content-type"] = "text/csv; charset=utf-8-sig"
        return response
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@admin_bp.route('/profile-edit-permission', methods=['GET', 'POST'])
def profile_edit_permission():
    try:
        dot = DotCapNhatHoSo.query.order_by(DotCapNhatHoSo.madot.desc()).first()
        
        if request.method == 'POST':
            data = request.get_json() or {}
            enabled = 1 if data.get('enabled') else 0
            from_date = parse_date(data.get('from'))
            to_date = parse_date(data.get('to'))
            
            from_dt = datetime.combine(from_date, datetime.min.time()) if from_date else None
            to_dt = datetime.combine(to_date, datetime.max.time()) if to_date else None
            
            if not dot:
                dot = DotCapNhatHoSo(
                    madot="DOT_01",
                    tendot="Cập nhật hồ sơ sinh viên",
                    thoigian_batdau=from_dt,
                    thoigian_ketthuc=to_dt,
                    trangthai_mo=enabled
                )
                db.session.add(dot)
            else:
                dot.trangthai_mo = enabled
                if from_dt: dot.thoigian_batdau = from_dt
                if to_dt: dot.thoigian_ketthuc = to_dt
                
            db.session.commit()
            return jsonify({"status": "success", "message": "Đã lưu cài đặt quyền chỉnh sửa"}), 200
            
        if not dot:
            return jsonify({
                "status": "success",
                "data": {"enabled": False, "from": "", "to": "", "nganhs": [], "khoas": []}
            }), 200
            
        now = datetime.now()
        is_active = (dot.trangthai_mo == 1)
        if dot.thoigian_batdau and dot.thoigian_ketthuc:
            is_active = is_active and (dot.thoigian_batdau <= now <= dot.thoigian_ketthuc)
            
        return jsonify({
            "status": "success",
            "data": {
                "enabled": dot.trangthai_mo == 1,
                "isActive": is_active,
                "from": dot.thoigian_batdau.strftime('%Y-%m-%d') if dot.thoigian_batdau else "",
                "to": dot.thoigian_ketthuc.strftime('%Y-%m-%d') if dot.thoigian_ketthuc else "",
                "nganhs": [],
                "khoas": []
            }
        }), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


# ══════════════════════════════════════════════════════════════════════════════
# ─── 2. PHÂN HỆ QUẢN LÝ HỌC TẬP & ĐIỂM SỐ (ACADEMIC & GRADES) ────────────────
# ══════════════════════════════════════════════════════════════════════════════

#  Bảng ánh xạ Mã nhóm -> Tên nhóm học phần chuẩn ĐH KHTN
MAP_TEN_NHOM_HP = {
    "CN_CS": "Kiến thức cơ sở ngành",
    "CN_NG": "Kiến thức bắt buộc ngành",
    "CN_TC": "Kiến thức tự chọn ngành",
    "CN_TD": "Kiến thức tự chọn tự do",
    "CN_TN_BB": "Kiến thức tốt nghiệp BB",
    "CN_TN_TC": "Kiến thức tốt nghiệp TC",
    "GD_QP": "Giáo dục quốc phòng – An ninh",
    "GD_TC": "Giáo dục thể chất",
    "LL_CT": "Lý luận chính trị - Pháp luật",
    "TH_BB": "Tin học",
    "TN_BB": "Toán - KHTN - Công nghệ (Bắt buộc)",
    "TN_TC1": "Toán - KHTN (Tự chọn 1)",
    "TN_TC2": "Toán - KHTN (Tự chọn 2)",
    "XH_TC": "Khoa học xã hội - Kinh tế - Kỹ năng",
}

@admin_bp.route('/academic/courses', methods=['GET'])
@faculty_required
def get_academic_courses():
    try:
        nam_hoc = request.args.get('namHoc', '')
        hoc_ky = request.args.get('hocKy', '')
        status = request.args.get('status', '')
        khoa_param = request.args.get('khoa', '')
        search = request.args.get('search', '').strip().lower()

        query = LopHocPhan.query.join(MonHoc).join(HocKyNamHoc)
        
        if not g.is_super_admin and g.makhoa:
            valid_ids = get_faculty_lhp_ids(g.makhoa)
            if valid_ids:
                query = query.filter(LopHocPhan.malhp.in_(valid_ids))
            else:
                query = query.filter(MonHoc.mamh.like(f"{g.makhoa}%"))
                
            # Loại trừ vĩnh viễn môn Tin học cơ sở đối với khoa CNTT
            if g.makhoa == "CSC":
                query = query.filter(MonHoc.mamh != 'CSC00003')

        lhps = query.all()
        result = []
        ten_khoa_admin = "CNTT" if g.makhoa == "CSC" else ("Toán - Tin" if g.makhoa == "MTH" else "CNTT")

        for lhp in lhps:
            mh = lhp.monhoc
            hk = lhp.hocky_namhoc
            
            nh_val = hk.namhoc if hk else "25-26"
            hk_so = 3
            if hk and "HK1" in hk.ten_hocky: hk_so = 1
            elif hk and "HK2" in hk.ten_hocky: hk_so = 2
            elif hk and "HK3" in hk.ten_hocky: hk_so = 3

            # Đếm sinh viên
            if not g.is_super_admin and g.makhoa:
                so_sv = KetQuaHocTap.query\
                    .join(SinhVien, KetQuaHocTap.mssv == SinhVien.mssv)\
                    .join(Nganh, SinhVien.manganh == Nganh.manganh)\
                    .filter(KetQuaHocTap.malhp == lhp.malhp, Nganh.makhoa == g.makhoa)\
                    .count()
                if so_sv == 0:
                    so_sv = KetQuaHocTap.query.filter_by(malhp=lhp.malhp).count()
            else:
                so_sv = KetQuaHocTap.query.filter_by(malhp=lhp.malhp).count()
                
            raw_tt = str(lhp.trangthai or "").strip().lower()
            st_val = "locked" if ("close" in raw_tt or "lock" in raw_tt or "khóa" in raw_tt) else ("uploaded" if ("open" in raw_tt or "upload" in raw_tt or "nộp" in raw_tt) else "pending")

            # 1. LẤY MÃ NHÓM TỪ BẢNG MONHOC (Nếu DB đang để NULL thì nhận diện theo mã môn)
            m_code = (mh.mamh or "").upper()
            ma_nhom_db = getattr(mh, 'manhom', None)
            
            if not ma_nhom_db:
                if m_code.startswith("CSC10") or m_code.startswith("CSC13") or m_code.startswith("CSC14"):
                    ma_nhom_db = "CN_CS"
                elif m_code.startswith("CSC10121"):
                    ma_nhom_db = "CN_TD"
                elif m_code.startswith("BAA0003") or "quốc phòng" in (mh.tenmh or "").lower():
                    ma_nhom_db = "GD_QP"
                elif m_code.startswith("BAA0002") or "thể dục" in (mh.tenmh or "").lower():
                    ma_nhom_db = "GD_TC"
                elif m_code.startswith("BAA001") or "triết" in (mh.tenmh or "").lower() or "chính trị" in (mh.tenmh or "").lower():
                    ma_nhom_db = "LL_CT"
                elif m_code.startswith("MTH") or m_code.startswith("PHY") or m_code.startswith("CHE"):
                    ma_nhom_db = "TN_BB"
                elif m_code.startswith("BAA0000"):
                    ma_nhom_db = "XH_TC"
                else:
                    ma_nhom_db = "CN_CS"

            # 🎯 2. LẤY TÊN NHÓM TƯƠNG ỨNG TỪ TỪ ĐIỂN
            ten_nhom_db = MAP_TEN_NHOM_HP.get(ma_nhom_db, "Kiến thức cơ sở ngành")

            # Số tiết học
            so_tiet_val = mh.sotiet if (mh and mh.sotiet) else ((mh.sotc * 15) if (mh and mh.sotc) else 45)

            item = {
                "id": lhp.malhp,
                "maMon": mh.mamh if mh else "",
                "tenMon": mh.tenmh if mh else "",
                "lop": lhp.tenlop or "24C01",
                "soTC": mh.sotc if mh else 3,
                "soTiet": so_tiet_val,
                "khoa": ten_khoa_admin,
                "giangVien": lhp.tengv or "Chưa phân công",
                "emailGV": lhp.mailgv or "",
                "soSV": so_sv,
                "status": st_val,
                "ngayNopDiem": "20/07/2026" if lhp.trangthai in ["uploaded", "locked"] else None,
                "hocKy": hk_so,
                "namHoc": nh_val,
                "maNhom": ma_nhom_db,   # Trả về đúng mã nhóm: CN_CS, CN_TD, GD_QP...
                "tenNhom": ten_nhom_db  # Trả về đúng tên nhóm: Kiến thức cơ sở ngành...
            }

            if nam_hoc and item["namHoc"] != nam_hoc: continue
            if hoc_ky and str(item["hocKy"]) != str(hoc_ky): continue
            if status and status != "all" and item["status"] != status: continue
            if khoa_param and khoa_param != "all" and item["khoa"] != khoa_param: continue
            if search:
                if (search not in item["tenMon"].lower() and 
                    search not in item["maMon"].lower() and 
                    search not in item["giangVien"].lower()):
                    continue
                    
            result.append(item)

        return jsonify({"status": "success", "data": result}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@admin_bp.route('/academic/courses/<course_id>/grades', methods=['GET'])
@faculty_required
def get_course_grades(course_id):
    try:
        lhp = LopHocPhan.query.filter_by(malhp=course_id).first()
        if not lhp:
            return jsonify({"status": "error", "message": "Không tìm thấy lớp học phần"}), 404
            
        query_kq = KetQuaHocTap.query.filter_by(malhp=course_id)
        
        # 🎯 Khi mở bảng điểm lớp (dù là môn Vật lý hay Toán), Giáo vụ chỉ quản lý điểm của SV Khoa mình
        if not g.is_super_admin and g.makhoa:
            query_kq = query_kq.join(SinhVien, KetQuaHocTap.mssv == SinhVien.mssv)\
                               .join(Nganh, SinhVien.manganh == Nganh.manganh)\
                               .filter(Nganh.makhoa == g.makhoa)

        kqs = query_kq.all()
        grades_list = []
        for kq in kqs:
            sv = kq.sinhvien
            grades_list.append({
                "mssv": kq.mssv,
                "hoTen": sv.hoten if sv else f"Sinh viên {kq.mssv}",
                "diemCC": kq.diemcc if kq.diemcc is not None else 10.0,
                "diemGK": kq.diemgk,
                "diemCK": kq.diemck,
                "diemTK": kq.diemtb_he10,
                "ghiChu": kq.ghichu or "Điểm chính thức"
            })

        return jsonify({"status": "success", "data": grades_list}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@admin_bp.route('/academic/courses/<course_id>/grades/<mssv>', methods=['PUT'])
@faculty_required
def update_student_grade(course_id, mssv):
    try:
        # Kiểm tra xem sinh viên được sửa điểm có thuộc khoa của Giáo vụ không
        if not g.is_super_admin and g.makhoa:
            sv = SinhVien.query.filter_by(mssv=mssv).first()
            if sv and sv.nganh and sv.nganh.makhoa != g.makhoa:
                return jsonify({"status": "error", "message": "Không có quyền sửa điểm sinh viên thuộc khoa khác"}), 403

        data = request.get_json() or {}
        kq = KetQuaHocTap.query.filter_by(malhp=course_id, mssv=mssv).first()
        if not kq:
            kq = KetQuaHocTap(mssv=mssv, malhp=course_id)
            db.session.add(kq)

        cc = float(data.get('diemCC', 10.0)) if data.get('diemCC') is not None else 10.0
        gk = float(data.get('diemGK')) if data.get('diemGK') is not None else None
        ck = float(data.get('diemCK')) if data.get('diemCK') is not None else None
        ly_do = data.get('ghiChu', '')

        kq.diemcc = cc
        kq.diemgk = gk
        kq.diemck = ck

        if gk is not None and ck is not None:
            tb = round(cc * 0.1 + gk * 0.3 + ck * 0.6, 1)
            chu, tt = tinh_diem_chu(tb)
            kq.diemtb_he10 = tb
            kq.loaidiem_hechu = chu
            kq.trangthai = tt

        try:
            log = LichSuChinhSua(
                malog=f"LOG_{int(datetime.now().timestamp())}",
                mssv=mssv,
                bang_bi_sua="KETQUA_HOCTAP",
                dulieu_moi=f"LHP={course_id}, GK={gk}, CK={ck}, LyDo={ly_do}",
                nguoithuchien=g.admin.hoten if g.admin else "ADMIN"
            )
            db.session.add(log)
        except Exception:
            pass

        db.session.commit()
        return jsonify({"status": "success", "message": "Cập nhật điểm thành công"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500

@admin_bp.route('/academic/courses/<course_id>/lock', methods=['POST'])
@faculty_required
def lock_course_grades(course_id):
    try:
        lhp = LopHocPhan.query.filter_by(malhp=course_id).first()
        if not lhp:
            return jsonify({"status": "error", "message": "Không tìm thấy lớp học phần"}), 404

        if not g.is_super_admin and g.makhoa:
            if lhp.monhoc and not lhp.monhoc.mamh.startswith(g.makhoa):
                return jsonify({"status": "error", "message": "Không có quyền khóa điểm môn học khoa khác"}), 403
                
        lhp.trangthai = "locked"
        db.session.commit()
            
        return jsonify({
            "status": "success",
            "message": f"Đã khóa và công bố điểm môn học {course_id}",
            "data": {"id": course_id, "status": "locked", "ngayNopDiem": datetime.now().strftime('%d/%m/%Y')}
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500

@admin_bp.route('/academic/courses/<course_id>/export-grades', methods=['GET'])
@faculty_required
def export_course_grades(course_id):
    try:
        lhp = LopHocPhan.query.filter_by(malhp=course_id).first()
        if not lhp:
            return jsonify({"status": "error", "message": "Không tìm thấy lớp học phần"}), 404

        if not g.is_super_admin and g.makhoa:
            if lhp.monhoc and not lhp.monhoc.mamh.startswith(g.makhoa):
                return jsonify({"status": "error", "message": "Không có quyền xuất điểm môn học khoa khác"}), 403

        kqs = KetQuaHocTap.query.filter_by(malhp=course_id).all()
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["STT", "MSSV", "Họ và tên", "CC (10%)", "GK (30%)", "CK (60%)", "Tổng kết", "Điểm chữ", "Kết quả", "Ghi chú"])
        
        for i, kq in enumerate(kqs):
            sv = kq.sinhvien
            writer.writerow([
                i + 1,
                kq.mssv,
                sv.hoten if sv else "",
                kq.diemcc if kq.diemcc is not None else "",
                kq.diemgk if kq.diemgk is not None else "",
                kq.diemck if kq.diemck is not None else "",
                kq.diemtb_he10 if kq.diemtb_he10 is not None else "",
                kq.loaidiem_hechu or "",
                kq.trangthai or "",
                kq.ghichu or ""
            ])

        response = make_response(output.getvalue())
        response.headers["Content-Disposition"] = f"attachment; filename=bang_diem_{course_id}.csv"
        response.headers["Content-type"] = "text/csv; charset=utf-8-sig"
        return response
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    
@admin_bp.route('/academic/courses/<course_id>/import-grades', methods=['POST'])
@faculty_required
def import_course_grades(course_id):
    try:
        lhp = LopHocPhan.query.filter_by(malhp=course_id).first()
        if not lhp:
            return jsonify({"status": "error", "message": "Không tìm thấy lớp học phần"}), 404

        if lhp.trangthai == "locked":
            return jsonify({"status": "error", "message": "Lớp học phần đã khóa điểm, không thể chỉnh sửa hoặc nhập thêm điểm mới"}), 400

        if 'file' not in request.files:
            return jsonify({"status": "error", "message": "Không tìm thấy file tải lên"}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({"status": "error", "message": "Tên file không hợp lệ"}), 400

        # Đọc dữ liệu file an toàn (hỗ trợ UTF-8 có BOM & không BOM)
        raw_bytes = file.stream.read()
        try:
            content_str = raw_bytes.decode("utf-8-sig")
        except UnicodeDecodeError:
            try:
                content_str = raw_bytes.decode("utf-8")
            except UnicodeDecodeError:
                content_str = raw_bytes.decode("latin-1")
                
        stream = io.StringIO(content_str, newline=None)
        first_line = content_str.splitlines()[0] if content_str.splitlines() else ""
        delim = ';' if ';' in first_line and ',' not in first_line else ','
        
        csv_reader = csv.reader(stream, delimiter=delim)
        header = next(csv_reader, None)  # Bỏ qua dòng tiêu đề
        imported_count = 0

        def get_col(r, idx, default_val=""):
            if idx < len(r) and r[idx] is not None:
                val = str(r[idx]).strip()
                return val if val else default_val
            return default_val

        def to_score(val):
            if not val or val in ['—', 'None', 'null', '']:
                return None
            try:
                s = float(str(val).replace(',', '.'))
                return min(10.0, max(0.0, s))
            except ValueError:
                return None

        for row in csv_reader:
            if not row or len(row) < 2:
                continue

            col0 = get_col(row, 0)
            col1 = get_col(row, 1)

            # Tự động nhận diện: Cột MSSV ở vị trí 1 (nếu có cột STT) hoặc ở vị trí 0
            if len(col0) >= 7 and col0.isdigit():
                mssv    = col0
                cc_val  = to_score(get_col(row, 2))
                gk_val  = to_score(get_col(row, 3))
                ck_val  = to_score(get_col(row, 4))
                ghi_chu = get_col(row, 8)
            elif len(col1) >= 7 and col1.isdigit():
                mssv    = col1
                cc_val  = to_score(get_col(row, 3))
                gk_val  = to_score(get_col(row, 4))
                ck_val  = to_score(get_col(row, 5))
                ghi_chu = get_col(row, 9)
            else:
                continue

            # Phân quyền: Giáo vụ chỉ nhập điểm cho sinh viên thuộc Khoa mình
            if not g.is_super_admin and g.makhoa:
                sv = SinhVien.query.filter_by(mssv=mssv).first()
                if sv and sv.nganh and sv.nganh.makhoa != g.makhoa:
                    continue

            kq = KetQuaHocTap.query.filter_by(malhp=course_id, mssv=mssv).first()
            if not kq:
                kq = KetQuaHocTap(malhp=course_id, mssv=mssv)
                db.session.add(kq)

            if cc_val is not None: kq.diemcc = cc_val
            if gk_val is not None: kq.diemgk = gk_val
            if ck_val is not None: kq.diemck = ck_val
            if ghi_chu: kq.ghichu = ghi_chu

            # Tự động tính điểm tổng kết và xếp loại Đạt / Không đạt
            cc_calc = kq.diemcc if kq.diemcc is not None else 10.0
            if kq.diemgk is not None and kq.diemck is not None:
                tb = round(cc_calc * 0.1 + kq.diemgk * 0.3 + kq.diemck * 0.6, 1)
                chu, tt = tinh_diem_chu(tb)
                kq.diemtb_he10 = tb
                kq.loaidiem_hechu = chu
                kq.trangthai = tt

            imported_count += 1

        # Cập nhật trạng thái lớp học phần thành uploaded nếu đang là pending
        if lhp.trangthai == "pending":
            lhp.trangthai = "uploaded"

        db.session.commit()
        return jsonify({
            "status": "success", 
            "message": f"Đã nhập thành công điểm cho {imported_count} sinh viên!"
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": f"Lỗi xử lý file điểm: {str(e)}"}), 500

@admin_bp.route('/academic/years', methods=['GET'])
@faculty_required
def get_academic_years():
    try:
        all_semesters = HocKyNamHoc.query.all()
        
        years_map = {}
        for s in all_semesters:
            nh = s.namhoc or "25-26"
            if nh not in years_map:
                years_map[nh] = []
            years_map[nh].append(s)

        result = []
        sorted_years = sorted(years_map.keys(), reverse=True)

        for nh in sorted_years:
            sems = years_map[nh]
            
            if '-' in nh:
                p1, p2 = nh.split('-', 1)
                start_y = f"20{p1}" if len(p1) == 2 else p1
                end_y = f"20{p2}" if len(p2) == 2 else p2
                label = f"{start_y}–{end_y}"
            else:
                label = nh

            # Ngày bắt đầu từ HK1
            hk1 = next((s for s in sems if "HK1" in (s.ten_hocky or "").upper()), None)
            start_date_obj = hk1.ngaybatdau if (hk1 and hk1.ngaybatdau) else min((s.ngaybatdau for s in sems if s.ngaybatdau), default=None)

            # Ngày kết thúc từ HK3
            hk3 = next((s for s in sems if "HK3" in (s.ten_hocky or "").upper()), None)
            end_date_obj = hk3.ngayketthuc if (hk3 and hk3.ngayketthuc) else max((s.ngayketthuc for s in sems if s.ngayketthuc), default=None)

            # Format ngày ra DD/MM/YYYY an toàn
            def fmt(d):
                if not d: return "—"
                if hasattr(d, 'strftime'): return d.strftime('%d/%m/%Y')
                d_str = str(d).split(' ')[0]
                if '-' in d_str:
                    y, m, day = d_str.split('-')
                    return f"{day}/{m}/{y}"
                return d_str

            # Trạng thái: Chỉ đóng khi tất cả HK đã Closed
            has_open_sem = any(
                str(s.trangthai or "").strip().lower() in ['open', 'mở', 'active', '1'] 
                for s in sems
            )
            year_status = "open" if has_open_sem else "closed"

            result.append({
                "id": nh,
                "label": label,
                "namHoc": nh,
                "ngayBatDau": fmt(start_date_obj),
                "ngayKetThuc": fmt(end_date_obj),
                "soHocKy": len(sems),
                "status": year_status
            })

        return jsonify({"status": "success", "data": result}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@admin_bp.route('/academic/years', methods=['POST'])
def create_academic_year():
    try:
        data = request.get_json() or {}
        year_id = data.get('id', '')
        so_hk = data.get('soHocKy', 3)
        start_d = parse_date(data.get('ngayBatDau'))
        end_d = parse_date(data.get('ngayKetThuc'))
        
        for hk_idx in range(1, so_hk + 1):
            ma_hk = f"HK{hk_idx}_{year_id}"
            existing = HocKyNamHoc.query.filter_by(ma_hocky=ma_hk).first()
            if not existing:
                new_hk = HocKyNamHoc(
                    ma_hocky=ma_hk,
                    ten_hocky=f"Học kỳ {hk_idx}",
                    namhoc=year_id,
                    trangthai=data.get('status', 'open'),
                    ngaybatdau=start_d,
                    ngayketthuc=end_d
                )
                db.session.add(new_hk)
                
        db.session.commit()
        return jsonify({"status": "success", "message": "Thêm năm học thành công"}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500

@admin_bp.route('/academic/years/<year_id>', methods=['PUT'])
@faculty_required
def update_academic_year(year_id):
    try:
        data = request.get_json() or {}
        new_status = data.get('status')
        
        # Nếu đổi trạng thái năm học:
        if new_status:
            st_db = "Open" if new_status == "open" else "Closed"
            # Nếu đóng năm học -> Đóng tất cả các học kỳ trong năm học đó
            if new_status == "closed":
                HocKyNamHoc.query.filter_by(namhoc=year_id).update({"trangthai": "Closed"})
            # Nếu mở năm học -> Mở học kỳ HK3 (hoặc học kỳ mới nhất)
            elif new_status == "open":
                hk3 = HocKyNamHoc.query.filter_by(namhoc=year_id, ten_hocky="HK3").first()
                if hk3:
                    hk3.trangthai = "Open"
                else:
                    last_hk = HocKyNamHoc.query.filter_by(namhoc=year_id).order_by(HocKyNamHoc.ma_hocky.desc()).first()
                    if last_hk: last_hk.trangthai = "Open"

            db.session.commit()
            
        return jsonify({"status": "success", "message": "Cập nhật năm học thành công"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500


# ══════════════════════════════════════════════════════════════════════════════
# ─── 3. PHÂN HỆ QUẢN LÝ LỊCH HỌC & LỊCH THI (SCHEDULE & EXAMS) ──────────────
# ══════════════════════════════════════════════════════════════════════════════

@admin_bp.route('/schedule/classes', methods=['GET'])
@faculty_required
def get_admin_classes():
    try:
        nam_hoc = request.args.get('namHoc', '')
        hoc_ky = request.args.get('hocKy', '')
        thu = request.args.get('thu', '')
        search = request.args.get('search', '').strip().lower()

        query = LichHoc.query.join(LopHocPhan).join(MonHoc)
        
        # 🎯 Chỉ lấy Lịch học của những lớp mà sinh viên CNTT theo học
        if not g.is_super_admin and g.makhoa:
            valid_ids = get_faculty_lhp_ids(g.makhoa)
            if valid_ids:
                query = query.filter(LopHocPhan.malhp.in_(valid_ids))
            else:
                query = query.filter(MonHoc.mamh.like(f"{g.makhoa}%"))
                
            if g.makhoa == "CSC":
                query = query.filter(MonHoc.mamh != 'CSC00003')

        lich_hocs = query.all()
        result = []

        for lh in lich_hocs:
            lhp = lh.lophocphan
            mh = lhp.monhoc if lhp else None
            bd_str = lh.thoigian_bd.strftime('%H:%M') if lh.thoigian_bd else "07:30"
            kt_str = lh.thoigian_kt.strftime('%H:%M') if lh.thoigian_kt else "11:10"
            thu_chuan = normalize_thu(lh.thu)

            ngay_str = ""
            if lh.ngaybatdau and lh.ngayketthuc:
                ngay_str = f"{lh.ngaybatdau.strftime('%d/%m/%Y')} – {lh.ngayketthuc.strftime('%d/%m/%Y')}"
            elif lh.ngaybatdau:
                ngay_str = f"{lh.ngaybatdau.strftime('%d/%m/%Y')} – {lh.ngaybatdau.strftime('%d/%m/%Y')}"
            else:
                ngay_str = "16/09/2024 – 21/09/2024"

            item = {
                "id": lh.malichhoc,
                "malichhoc": lh.malichhoc,
                "malhp": lh.malhp,
                "maMon": mh.mamh if mh else (lhp.mamh if lhp else ""),
                "tenMon": mh.tenmh if mh else (lhp.tenlop if lhp else "Môn học"),
                "lop": lhp.tenlop if lhp else "24C07",
                "giangVien": lhp.tengv if lhp else "Chưa phân công",
                "thu": thu_chuan,
                "ngay": ngay_str,
                "tiet": "1–4" if bd_str.startswith("07") else "7–10",
                "gio": f"{bd_str} – {kt_str}",
                "phong": lh.phonghoc or "I.44",
                "tuan": lh.tuan or "1",
                "hinhThuc": lh.hinhthuchoc or "Trực tiếp",
                "hocKy": 1,
                "namHoc": "25-26"
            }

            if thu and thu != "all":
                if normalize_thu(item["thu"]) != normalize_thu(thu):
                    continue

            if search:
                if (search not in item["tenMon"].lower() and 
                    search not in item["maMon"].lower() and 
                    search not in item["giangVien"].lower() and 
                    search not in item["phong"].lower() and 
                    search not in item["lop"].lower()):
                    continue

            result.append(item)

        return jsonify({"status": "success", "data": result}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@admin_bp.route('/schedule/classes', methods=['POST'])
@faculty_required
def create_class_schedule():
    try:
        data = request.get_json() or {}
        malhp = data.get('malhp')
        
        if not malhp:
            query_lhp = LopHocPhan.query.join(MonHoc)
            if not g.is_super_admin and g.makhoa:
                query_lhp = query_lhp.filter(MonHoc.mamh.like(f"{g.makhoa}%"))
            first_lhp = query_lhp.first()
            malhp = first_lhp.malhp if first_lhp else "HP001"
        else:
            if not g.is_super_admin and g.makhoa:
                lhp_check = LopHocPhan.query.filter_by(malhp=malhp).first()
                if lhp_check and lhp_check.monhoc and not lhp_check.monhoc.mamh.startswith(g.makhoa):
                    return jsonify({"status": "error", "message": "Không có quyền thêm lịch học cho môn khoa khác"}), 403

        malh = f"LH_{int(datetime.now().timestamp())}"
        lh = LichHoc(
            malichhoc=malh,
            malhp=malhp,
            tuan=data.get('tuan', '1–15'),
            thu=data.get('thu', 'Thứ hai'),
            thoigian_bd=parse_time_val(data.get('gio', '07:30')),
            thoigian_kt=parse_time_val("10:00"),
            phonghoc=data.get('phong', 'C.42'),
            hinhthuchoc=data.get('hinhThuc', 'Trực tiếp')
        )
        db.session.add(lh)
        db.session.commit()
        return jsonify({"status": "success", "message": "Thêm lịch học thành công"}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500

@admin_bp.route('/schedule/classes/<id>', methods=['PUT'])
@faculty_required
def update_class_schedule(id):
    try:
        data = request.get_json() or {}
        lh = LichHoc.query.filter_by(malichhoc=id).first()
        if not lh:
            return jsonify({"status": "error", "message": "Không tìm thấy lịch học"}), 404

        lhp = lh.lophocphan
        mh = lhp.monhoc if lhp else None

        # Cập nhật thông tin lịch học
        if 'thu' in data: lh.thu = data['thu']
        if 'phong' in data: lh.phonghoc = data['phong']
        if 'tuan' in data: lh.tuan = str(data['tuan'])
        if 'hinhThuc' in data: lh.hinhthuchoc = data['hinhThuc']

        # Cập nhật giờ học
        if 'gio' in data and data['gio']:
            parts = str(data['gio']).replace('–', '-').split('-')
            lh.thoigian_bd = parse_time_val(parts[0].strip())
            if len(parts) > 1:
                lh.thoigian_kt = parse_time_val(parts.strip())

        # Cập nhật giảng viên và tên môn
        if lhp and 'giangVien' in data: lhp.tengv = data['giangVien']
        if lhp and 'lop' in data: lhp.tenlop = data['lop']
        if mh and 'tenMon' in data: mh.tenmh = data['tenMon']

        db.session.commit()
        return jsonify({"status": "success", "message": "Cập nhật lịch học thành công"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500

@admin_bp.route('/schedule/classes/<id>', methods=['DELETE'])
@faculty_required
def delete_class_schedule(id):
    try:
        lh = LichHoc.query.filter_by(malichhoc=id).first()
        if not lh: return jsonify({"status": "error", "message": "Không tìm thấy lịch học"}), 404

        if not g.is_super_admin and g.makhoa:
            if lh.lophocphan and lh.lophocphan.monhoc and not lh.lophocphan.monhoc.mamh.startswith(g.makhoa):
                return jsonify({"status": "error", "message": "Không có quyền xóa lịch học của khoa khác"}), 403

        db.session.delete(lh)
        db.session.commit()
        return jsonify({"status": "success", "message": "Đã xóa lịch học"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500

@admin_bp.route('/schedule/exams', methods=['GET'])
@faculty_required
def get_admin_exams():
    try:
        search = request.args.get('search', '').strip().lower()

        query = LichThi.query.join(LopHocPhan).join(MonHoc)
        
        if not g.is_super_admin and g.makhoa:
            subquery_lhp_sv = db.session.query(KetQuaHocTap.malhp)\
                .join(SinhVien, KetQuaHocTap.mssv == SinhVien.mssv)\
                .join(Nganh, SinhVien.manganh == Nganh.manganh)\
                .filter(Nganh.makhoa == g.makhoa)\
                .distinct().subquery()
                
            query = query.filter(LopHocPhan.malhp.in_(subquery_lhp_sv))

        lich_this = query.all()
        result = []
        thu_names = ["Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy", "Chủ nhật"]

        for lt in lich_this:
            lhp = lt.lophocphan
            mh = lhp.monhoc if lhp else None
            ngay_str = format_date(lt.ngaythi) or "28/11/2026"
            thu_str = "Thứ hai"
            if lt.ngaythi:
                thu_str = thu_names[lt.ngaythi.weekday()]

            # 1. Chỉ lấy giờ bắt đầu HH:MM từ DB
            gio_str = lt.giothi.strftime('%H:%M') if lt.giothi else "07:30"
            
            # 2. Tính ca thi chuẩn xác
            ca_str = xac_dinh_ca_thi(lt.giothi)

            item = {
                "id": lt.malichthi,
                "malichthi": lt.malichthi,
                "malhp": lt.malhp,
                "tenMon": mh.tenmh if mh else (lhp.tenlop if lhp else "Môn thi"),
                "maNhom": lhp.tenlop if lhp else "24C07",
                "ngayThi": ngay_str,
                "thu": thu_str,
                "ca": ca_str,
                "gio": gio_str,
                "thoiGian": f"{lt.thoigianlambai or 90} phút",
                "phong": lt.phongthi or "I.42",
                "soThi": lt.sothisinh or 45,
                "hinhThuc": lt.hinhthucthi or "Tự luận",
                "hocKy": 1,
                "namHoc": "25-26"
            }

            if search:
                if (search not in item["tenMon"].lower() and 
                    search not in item["maNhom"].lower() and 
                    search not in item["phong"].lower()):
                    continue

            result.append(item)

        return jsonify({"status": "success", "data": result}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@admin_bp.route('/schedule/exams', methods=['POST'])
@faculty_required
def create_exam_schedule():
    try:
        data = request.get_json() or {}
        malhp = data.get('malhp')
        
        if not malhp:
            query_lhp = LopHocPhan.query.join(MonHoc)
            if not g.is_super_admin and g.makhoa:
                query_lhp = query_lhp.filter(MonHoc.mamh.like(f"{g.makhoa}%"))
            first_lhp = query_lhp.first()
            malhp = first_lhp.malhp if first_lhp else "HP001"
        else:
            if not g.is_super_admin and g.makhoa:
                lhp_check = LopHocPhan.query.filter_by(malhp=malhp).first()
                if lhp_check and lhp_check.monhoc and not lhp_check.monhoc.mamh.startswith(g.makhoa):
                    return jsonify({"status": "error", "message": "Không có quyền thêm lịch thi cho môn khoa khác"}), 403

        malt = f"LT_{int(datetime.now().timestamp())}"
        tg_num = 90
        try: tg_num = int(str(data.get('thoiGian', '90')).replace('phút', '').strip())
        except Exception: pass

        lt = LichThi(
            malichthi=malt,
            malhp=malhp,
            ngaythi=parse_date(data.get('ngayThi')),
            giothi=parse_time_val(data.get('gio', '07:30')),
            thoigianlambai=tg_num,
            phongthi=data.get('phong', 'I.42')
        )
        db.session.add(lt)
        db.session.commit()
        return jsonify({"status": "success", "message": "Thêm lịch thi thành công"}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500

@admin_bp.route('/schedule/exams/<id>', methods=['PUT'])
@faculty_required
def update_exam_schedule(id):
    try:
        data = request.get_json() or {}
        lt = LichThi.query.filter_by(malichthi=id).first()
        if not lt: return jsonify({"status": "error", "message": "Không tìm thấy lịch thi"}), 404

        if not g.is_super_admin and g.makhoa:
            if lt.lophocphan and lt.lophocphan.monhoc and not lt.lophocphan.monhoc.mamh.startswith(g.makhoa):
                return jsonify({"status": "error", "message": "Không có quyền sửa lịch thi của khoa khác"}), 403

        if 'ngayThi' in data: lt.ngaythi = parse_date(data['ngayThi'])
        if 'phong' in data: lt.phongthi = data['phong']
        if 'thoiGian' in data:
            try: lt.thoigianlambai = int(str(data['thoiGian']).replace('phút', '').strip())
            except Exception: pass
        if 'gio' in data: lt.giothi = parse_time_val(data['gio'])

        db.session.commit()
        return jsonify({"status": "success", "message": "Cập nhật lịch thi thành công"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500

@admin_bp.route('/schedule/exams/<id>', methods=['DELETE'])
@faculty_required
def delete_exam_schedule(id):
    try:
        lt = LichThi.query.filter_by(malichthi=id).first()
        if not lt: return jsonify({"status": "error", "message": "Không tìm thấy lịch thi"}), 404

        if not g.is_super_admin and g.makhoa:
            if lt.lophocphan and lt.lophocphan.monhoc and not lt.lophocphan.monhoc.mamh.startswith(g.makhoa):
                return jsonify({"status": "error", "message": "Không có quyền xóa lịch thi của khoa khác"}), 403

        db.session.delete(lt)
        db.session.commit()
        return jsonify({"status": "success", "message": "Đã xóa lịch thi"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500

@admin_bp.route('/schedule/classes/export', methods=['GET'])
@faculty_required
def export_classes_csv():
    try:
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["STT", "Mã MH", "Tên môn học", "Lớp", "Giảng viên", "Thứ", "Ngày", "Thời gian", "Phòng", "Tuần", "Ngày bắt đầu", "Ngày kết thúc", "Hình thức"])

        query = LichHoc.query.join(LopHocPhan).join(MonHoc)
        if not g.is_super_admin and g.makhoa:
            query = query.filter(MonHoc.mamh.like(f"{g.makhoa}%"))

        lich_hocs = query.all()
        for idx, lh in enumerate(lich_hocs):
            lhp = lh.lophocphan
            mh = lhp.monhoc if lhp else None
            bd = lh.thoigian_bd.strftime('%H:%M') if lh.thoigian_bd else "07:30"
            kt = lh.thoigian_kt.strftime('%H:%M') if lh.thoigian_kt else "10:00"
            writer.writerow([
                idx + 1,
                mh.mamh if mh else (lhp.mamh if lhp else ""),
                mh.tenmh if mh else "",
                lhp.tenlop if lhp else "",
                lhp.tengv if lhp else "",
                lh.thu or "",
                f"{bd} - {kt}",
                lh.phonghoc or "",
                lh.tuan or "",
                format_date(lh.ngaybatdau),
                format_date(lh.ngayketthuc),
                lh.hinhthuchoc or ""
            ])

        res = make_response(output.getvalue())
        res.headers["Content-Disposition"] = "attachment; filename=thoi_khoa_bieu.csv"
        res.headers["Content-type"] = "text/csv; charset=utf-8-sig"
        return res
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@admin_bp.route('/schedule/exams/export', methods=['GET'])
@faculty_required
def export_exams_csv():
    try:
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["STT", "Tên môn học", "Mã nhóm", "Ngày thi", "Thứ", "Giờ thi", "Thời gian", "Phòng thi", "Số thí sinh", "Hình thức"])

        query = LichThi.query.join(LopHocPhan).join(MonHoc)
        if not g.is_super_admin and g.makhoa:
            query = query.filter(MonHoc.mamh.like(f"{g.makhoa}%"))

        lich_this = query.all()
        for idx, lt in enumerate(lich_this):
            lhp = lt.lophocphan
            mh = lhp.monhoc if lhp else None
            writer.writerow([
                idx + 1,
                mh.tenmh if mh else "",
                lhp.tenlop if lhp else "",
                format_date(lt.ngaythi),
                "Thứ hai",
                lt.giothi.strftime('%H:%M') if lt.giothi else "07:30",
                f"{lt.thoigianlambai or 90} phút",
                lt.phongthi or "",
                lt.sothisinh or 45,
                lt.hinhthucthi or ""
            ])

        res = make_response(output.getvalue())
        res.headers["Content-Disposition"] = "attachment; filename=lich_thi.csv"
        res.headers["Content-type"] = "text/csv; charset=utf-8-sig"
        return res
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


# ══════════════════════════════════════════════════════════════════════════════
# ─── 4. PHÂN HỆ QUẢN LÝ HỌC PHÍ (TUITION MANAGEMENT) ─────────────────────────
# ══════════════════════════════════════════════════════════════════════════════

@admin_bp.route('/tuition/stats', methods=['GET'])
@faculty_required
def get_tuition_stats():
    try:
        query = HocPhi.query.join(SinhVien).join(Nganh)
        
        # Phân quyền: Thống kê học phí theo sinh viên thuộc Khoa
        if not g.is_super_admin and g.makhoa:
            query = query.filter(Nganh.makhoa == g.makhoa)
            
        records = query.all()
        
        total_due = sum(r.thucdong or 0 for r in records)
        total_paid = sum(r.thucdong or 0 for r in records if str(r.trangthai_thanhtoan) in ['1', 'Đã thanh toán'])
        total_debt = total_due - total_paid

        all_students = set(r.mssv for r in records)
        paid_students = set(r.mssv for r in records if str(r.trangthai_thanhtoan) in ['1', 'Đã thanh toán'])
        
        return jsonify({
            "status": "success",
            "data": {
                "totalDue": total_due,
                "totalPaid": total_paid,
                "totalDebt": total_debt,
                "totalStudents": len(all_students),
                "paidStudents": len(paid_students),
                "completionRate": round((total_paid / total_due * 100)) if total_due > 0 else 0
            }
        }), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@admin_bp.route('/tuition/students', methods=['GET'])
@faculty_required
def get_tuition_students():
    try:
        search = request.args.get('search', '').strip().lower()
        status_filter = request.args.get('status', 'all')

        query = HocPhi.query.join(SinhVien).join(Nganh)
        if not g.is_super_admin and g.makhoa:
            query = query.filter(Nganh.makhoa == g.makhoa)

        records = query.all()
        students_map = {}
        for r in records:
            sv = r.sinhvien
            lhp = r.lophocphan
            mh = lhp.monhoc if lhp else None

            #Chuẩn hóa kiểm tra đã thanh toán (chấp nhận cả 1, '1', True, 'Đã thanh toán')
            is_item_paid = (
                r.trangthai_thanhtoan is True or 
                r.trangthai_thanhtoan == 1 or 
                str(r.trangthai_thanhtoan).strip() in ['1', 'Đã thanh toán', 'paid']
            )
            trang_thai_chu = "Đã thanh toán" if is_item_paid else "Chưa thanh toán"

            if r.mssv not in students_map:
                students_map[r.mssv] = {
                    "mssv": r.mssv,
                    "hoTen": sv.hoten if sv else f"Sinh viên {r.mssv}",
                    "lop": sv.nienkhoa or "K24",
                    "soMon": 0,
                    "tongTC": 0,
                    "hocPhiGoc": 0.0,
                    "mucGiam": 0.0,
                    "thucDong": 0.0,
                    "trangThai": "Đã thanh toán",
                    "ngayThanhToan": None,
                    "items": []
                }

            group = students_map[r.mssv]
            group["soMon"] += 1
            group["tongTC"] += (r.sotchp or 0)
            group["hocPhiGoc"] += (r.hocphi_goc or 0.0)
            group["mucGiam"] += (r.mucgiam or 0.0)
            group["thucDong"] += (r.thucdong or 0.0)
            
            if not is_item_paid:
                group["trangThai"] = "Chưa thanh toán"

            if r.ngaythanhtoan:
                group["ngayThanhToan"] = r.ngaythanhtoan.strftime('%d/%m/%Y')

            # 🎯 Đưa trạng thái đã chuẩn hóa dạng chữ vào danh sách môn học
            group["items"].append({
                "malhp": r.malhp,
                "maMon": mh.mamh if mh else (lhp.mamh if lhp else ""),
                "tenMon": mh.tenmh if mh else (lhp.tenlop if lhp else "Môn học phần"),
                "soTc": r.sotchp,
                "hocPhiGoc": r.hocphi_goc,
                "mucGiam": r.mucgiam,
                "thucDong": r.thucdong,
                "trangThai": trang_thai_chu, 
                "ngayThanhToan": r.ngaythanhtoan.strftime('%d/%m/%Y') if r.ngaythanhtoan else "—",
                "ghiChu": r.ghichu or "—"
            })

        result = list(students_map.values())
        filtered = []
        for s in result:
            if status_filter == 'paid' and s["trangThai"] != 'Đã thanh toán': continue
            if status_filter == 'unpaid' and s["trangThai"] != 'Chưa thanh toán': continue
            if search and (search not in s["hoTen"].lower() and search not in s["mssv"].lower() and search not in s["lop"].lower()):
                continue
            filtered.append(s)

        return jsonify({"status": "success", "data": filtered}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@admin_bp.route('/tuition/students/<mssv>/pay', methods=['POST'])
@faculty_required
def pay_student_all_tuition(mssv):
    try:
        sv = SinhVien.query.filter_by(mssv=mssv).first()
        if not sv:
            return jsonify({"status": "error", "message": "Không tìm thấy sinh viên"}), 404

        if not g.is_super_admin and g.makhoa:
            if sv.nganh and sv.nganh.makhoa != g.makhoa:
                return jsonify({"status": "error", "message": "Không có quyền duyệt học phí sinh viên khoa khác"}), 403

        records = HocPhi.query.filter_by(mssv=mssv).all()
        if not records:
            return jsonify({"status": "error", "message": "Không tìm thấy hồ sơ học phí của sinh viên"}), 404

        now = datetime.now()
        for r in records:
            r.trangthai_thanhtoan = "Đã thanh toán"
            r.ngaythanhtoan = now

        db.session.commit()
        return jsonify({"status": "success", "message": f"Đã xác nhận thanh toán học phí thành công cho sinh viên {mssv}"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500

@admin_bp.route('/tuition/records/<mssv>/<malhp>', methods=['PUT'])
@faculty_required
def update_tuition_record(mssv, malhp):
    try:
        sv = SinhVien.query.filter_by(mssv=mssv).first()
        if not sv:
            return jsonify({"status": "error", "message": "Không tìm thấy sinh viên"}), 404

        if not g.is_super_admin and g.makhoa:
            if sv.nganh and sv.nganh.makhoa != g.makhoa:
                return jsonify({"status": "error", "message": "Không có quyền chỉnh sửa học phí sinh viên khoa khác"}), 403

        hp = HocPhi.query.filter_by(mssv=mssv, malhp=malhp).first()
        if not hp:
            return jsonify({"status": "error", "message": "Không tìm thấy khoản học phí"}), 404

        data = request.get_json() or {}
        if 'mucGiam' in data: hp.mucgiam = float(data['mucGiam'])
        if 'hocPhiGoc' in data: hp.hocphi_goc = float(data['hocPhiGoc'])
        if 'ghiChu' in data: hp.ghichu = data['ghiChu']
        if 'trangThai' in data: 
            hp.trangthai_thanhtoan = data['trangThai']
            if str(data['trangThai']) in ['1', 'Đã thanh toán']:
                hp.ngaythanhtoan = datetime.now()

        hp.thucdong = max(0.0, float(hp.hocphi_goc or 0.0) - float(hp.mucgiam or 0.0))
        db.session.commit()
        return jsonify({"status": "success", "message": "Cập nhật học phí thành công"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500

@admin_bp.route('/tuition/export', methods=['GET'])
@faculty_required
def export_tuition_csv():
    try:
        query = HocPhi.query.join(SinhVien).join(Nganh)
        if not g.is_super_admin and g.makhoa:
            query = query.filter(Nganh.makhoa == g.makhoa)

        records = query.all()
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["STT", "MSSV", "Họ và tên", "Mã môn", "Tên môn học", "Số TC", "Học phí gốc", "Miễn giảm", "Thực đóng", "Trạng thái", "Ngày thanh toán", "Ghi chú"])

        for idx, r in enumerate(records):
            sv = r.sinhvien
            lhp = r.lophocphan
            mh = lhp.monhoc if lhp else None

            writer.writerow([
                idx + 1,
                r.mssv,
                sv.hoten if sv else "",
                mh.mamh if mh else (lhp.mamh if lhp else ""),
                mh.tenmh if mh else "",
                r.sotchp or 0,
                f"{int(r.hocphi_goc or 0):,}",
                f"{int(r.mucgiam or 0):,}",
                f"{int(r.thucdong or 0):,}",
                r.trangthai_thanhtoan,
                r.ngaythanhtoan.strftime('%d/%m/%Y') if r.ngaythanhtoan else "",
                r.ghichu or ""
            ])

        res = make_response(output.getvalue())
        res.headers["Content-Disposition"] = "attachment; filename=danh_sach_hoc_phi.csv"
        res.headers["Content-type"] = "text/csv; charset=utf-8-sig"
        return res
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


# ══════════════════════════════════════════════════════════════════════════════
# ─── 5. PHÂN HỆ QUẢN LÝ THÔNG BÁO (NOTIFICATION MANAGEMENT) ───────────────────
# ══════════════════════════════════════════════════════════════════════════════

@admin_bp.route('/notifications', methods=['GET'])
@faculty_required
def get_admin_notifications():
    try:
        search = request.args.get('search', '').strip().lower()
        dept_filter = request.args.get('department', 'all')

        query = ThongBao.query
        
        # Giáo vụ xem thông báo của khoa mình + thông báo chung toàn trường
        if not g.is_super_admin and g.makhoa:
            query = query.filter((ThongBao.makhoa == g.makhoa) | (ThongBao.makhoa == None))

        thongbaos = query.order_by(ThongBao.ngaydang.desc()).all()
        total_students = SinhVien.query.count() or 1
        result = []

        for tb in thongbaos:
            donvi = getattr(tb.khoa, 'tenkhoa', None) if hasattr(tb, 'khoa') and tb.khoa else None
            
            if not donvi:
                if tb.makhoa == 'MTH':
                    donvi = "Khoa Toán - Tin"
                elif tb.makhoa == 'CSC':
                    donvi = "Khoa CNTT"
                else:
                    t_lower = (tb.tieude or "").lower()
                    if "toán" in t_lower:
                        donvi = "Khoa Toán - Tin"
                    elif "học phí" in t_lower or "tài chính" in t_lower:
                        donvi = "Phòng Kế hoạch Tài chính"
                    elif "học bổng" in t_lower or "công tác" in t_lower:
                        donvi = "Phòng Công tác SV"
                    elif "lịch thi" in t_lower or "học phần" in t_lower or "đào tạo" in t_lower:
                        donvi = "Phòng Đào tạo"
                    else:
                        donvi = "Khoa CNTT"

            read_count = SvThongBao.query.filter_by(matb=tb.matb, trangthai_doc=1).count()
            target_count = SvThongBao.query.filter_by(matb=tb.matb).count() or total_students
            rate = round((read_count / target_count) * 100) if target_count > 0 else 0

            item = {
                "id": tb.matb,
                "matb": tb.matb,
                "title": tb.tieude,
                "tieuDe": tb.tieude,
                "content": tb.noidung or "",
                "noiDung": tb.noidung or "",
                "date": tb.ngaydang.strftime('%d/%m/%Y %H:%M') if tb.ngaydang else "Vừa xong",
                "ngayDang": tb.ngaydang.strftime('%d/%m/%Y %H:%M') if tb.ngaydang else "Vừa xong",
                "department": donvi,
                "target": "Toàn trường" if not tb.makhoa else f"Khoa {donvi}",
                "readCount": read_count,
                "totalTarget": target_count,
                "readRate": rate,
                "status": "sent"
            }

            if dept_filter != 'all' and item["department"] != dept_filter:
                continue
            if search and (search not in item["title"].lower() and search not in item["content"].lower()):
                continue

            result.append(item)

        return jsonify({"status": "success", "data": result}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@admin_bp.route('/notifications', methods=['POST'])
@faculty_required
def create_admin_notification():
    try:
        data = request.get_json() or {}
        matb = f"TB_{int(datetime.now().timestamp())}"
        
        dept = data.get('department', '')
        makhoa_val = g.makhoa
        if not makhoa_val:
            if "Toán" in dept or dept == "MTH":
                makhoa_val = "MTH"
            elif "CNTT" in dept or dept == "CSC":
                makhoa_val = "CSC"

        tb = ThongBao(
            matb=matb,
            tieude=data.get('title') or data.get('tieuDe', 'Thông báo mới'),
            noidung=data.get('content') or data.get('noiDung', ''),
            ngaydang=datetime.now(),
            makhoa=makhoa_val
        )
        db.session.add(tb)

        # Phân phối thông báo tới sinh viên thuộc khoa
        if makhoa_val:
            students = SinhVien.query.join(Nganh).filter(Nganh.makhoa == makhoa_val).all()
        else:
            students = SinhVien.query.all()

        for sv in students:
            db.session.add(SvThongBao(mssv=sv.mssv, matb=matb, trangthai_doc=0))

        db.session.commit()
        return jsonify({"status": "success", "message": "Đã phát thông báo mới thành công", "id": matb}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500

@admin_bp.route('/notifications/<matb>', methods=['PUT'])
@faculty_required
def update_admin_notification(matb):
    try:
        tb = ThongBao.query.filter_by(matb=matb).first()
        if not tb:
            return jsonify({"status": "error", "message": "Không tìm thấy thông báo"}), 404

        if not g.is_super_admin and g.makhoa:
            if tb.makhoa and tb.makhoa != g.makhoa:
                return jsonify({"status": "error", "message": "Không có quyền sửa thông báo khoa khác"}), 403

        data = request.get_json() or {}
        if 'title' in data or 'tieuDe' in data:
            tb.tieude = data.get('title') or data.get('tieuDe')
        if 'content' in data or 'noiDung' in data:
            tb.noidung = data.get('content') or data.get('noiDung')

        db.session.commit()
        return jsonify({"status": "success", "message": "Cập nhật thông báo thành công"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500

@admin_bp.route('/notifications/<matb>', methods=['DELETE'])
@faculty_required
def delete_admin_notification(matb):
    try:
        tb = ThongBao.query.filter_by(matb=matb).first()
        if not tb:
            return jsonify({"status": "error", "message": "Không tìm thấy thông báo"}), 404

        if not g.is_super_admin and g.makhoa:
            if tb.makhoa and tb.makhoa != g.makhoa:
                return jsonify({"status": "error", "message": "Không có quyền xóa thông báo khoa khác"}), 403

        SvThongBao.query.filter_by(matb=matb).delete()
        ThongBao.query.filter_by(matb=matb).delete()
        db.session.commit()
        return jsonify({"status": "success", "message": "Đã xóa thông báo thành công"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500


# =============================================================================
# SURVEY MANAGEMENT ROUTES (QUẢN LÝ KHẢO SÁT & KẾT QUẢ)
# =============================================================================
from app.models.survey import KhaoSat, CauHoiKhaoSat, SvKhaoSat, TraLoiKhaoSat

# 1. Danh sách khảo sát
@admin_bp.route('/surveys', methods=['GET'])
@faculty_required
def get_admin_surveys():
    try:
        search = request.args.get('search', '').strip().lower()
        status_filter = request.args.get('status', 'all')

        surveys = KhaoSat.query.all()
        total_students = SinhVien.query.count() or 1
        result = []
        now = datetime.now()

        for ks in surveys:
            submitted_count = SvKhaoSat.query.filter_by(maks=ks.maks, trangthai_lam='1').count()
            target_count = SvKhaoSat.query.filter_by(maks=ks.maks).count() or total_students
            rate = round((submitted_count / target_count) * 100) if target_count > 0 else 0

            # Kiểm tra hạn nộp chuẩn xác (hỗ trợ cả datetime và date string)
            is_active = True
            if ks.handon:
                try:
                    raw_str = str(ks.handon).strip()
                    parsed_dt = None
                    for fmt in ('%Y-%m-%d %H:%M:%S', '%Y-%m-%d %H:%M', '%Y-%m-%d'):
                        try:
                            parsed_dt = datetime.strptime(raw_str, fmt)
                            break
                        except ValueError:
                            pass
                    if parsed_dt:
                        is_active = (now <= parsed_dt)
                    else:
                        d_part = raw_str.split(' ')[0]
                        is_active = (now.date() <= datetime.strptime(d_part, '%Y-%m-%d').date())
                except Exception:
                    is_active = False

            st_key = "active" if is_active else "closed"

            # Đếm số câu hỏi
            q_count = CauHoiKhaoSat.query.filter_by(maks=ks.maks).count()

            item = {
                "id": ks.maks,
                "maks": ks.maks,
                "title": ks.tenks,
                "description": ks.noidung or "",
                "deadline": str(ks.handon) if ks.handon else "2026-09-05",
                "status": st_key,
                "totalTarget": target_count,
                "submittedCount": submitted_count,
                "responseRate": rate,
                "questionsCount": q_count
            }

            if status_filter != 'all' and item["status"] != status_filter:
                continue
            if search and (search not in item["title"].lower() and search not in item["description"].lower()):
                continue

            result.append(item)

        return jsonify({"status": "success", "data": result}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


# 2. Chi tiết & Thống kê kết quả phản hồi của từng câu hỏi
@admin_bp.route('/surveys/<maks>', methods=['GET'])
@faculty_required
def get_survey_details(maks):
    try:
        ks = KhaoSat.query.filter_by(maks=maks).first()
        if not ks:
            return jsonify({"status": "error", "message": "Không tìm thấy khảo sát"}), 404

        questions = CauHoiKhaoSat.query.filter_by(maks=maks).order_by(CauHoiKhaoSat.thutu).all()
        submitted_count = SvKhaoSat.query.filter_by(maks=maks, trangthai_lam='1').count()
        total_target = SvKhaoSat.query.filter_by(maks=maks).count() or SinhVien.query.count() or 1
        rate = round((submitted_count / total_target) * 100) if total_target > 0 else 0

        LETTER_TO_STAR = {'A': 5, 'B': 4, 'C': 3, 'D': 2, 'E': 1, 'a': 5, 'b': 4, 'c': 3, 'd': 2, 'e': 1}
        q_list = []

        for q in questions:
            is_essay = "tự luận" in (q.loai_cauhoi or "").lower()
            answers = TraLoiKhaoSat.query.filter_by(mach=q.mach).all()
            
            star_counts = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
            text_responses = []
            valid_ratings = []

            for ans in answers:
                txt = (ans.noidung_traloi or "").strip()
                if not txt:
                    continue

                if is_essay:
                    # Câu hỏi tự luận: Lưu toàn bộ câu trả lời dạng chữ
                    text_responses.append(txt)
                else:
                    # Câu hỏi trắc nghiệm: Tách Rating và Comment
                    rating_found = None
                    comment_found = ""

                    match = re.search(r"Rating:\s*(\d+)(?:\.\s*Comment:\s*(.*))?", txt, re.IGNORECASE | re.DOTALL)
                    if match:
                        rating_found = int(match.group(1))
                        comment_found = (match.group(2) or "").strip()
                    elif txt in LETTER_TO_STAR:
                        rating_found = LETTER_TO_STAR[txt]
                    elif txt.isdigit() and 1 <= int(txt) <= 5:
                        rating_found = int(txt)
                    else:
                        comment_found = txt

                    if rating_found and 1 <= rating_found <= 5:
                        star_counts[rating_found] += 1
                        valid_ratings.append(rating_found)

                    if comment_found:
                        text_responses.append(comment_found)

            total_ratings = len(valid_ratings)
            avg_rating = round(sum(valid_ratings) / total_ratings, 1) if total_ratings > 0 else 0.0

            breakdown = []
            for s in range(5, 0, -1):
                c = star_counts[s]
                pct = round((c / total_ratings) * 100) if total_ratings > 0 else 0
                breakdown.append({"star": s, "count": c, "percentage": pct})

            q_list.append({
                "id": q.mach,
                "content": q.noidung_cauhoi,
                "type": "Tự luận" if is_essay else "Trắc nghiệm",
                "code": q.loai_cauhoi or ("Tự luận" if is_essay else "Trắc nghiệm"),
                "isEssay": is_essay,
                "averageRating": avg_rating,
                "totalRatings": total_ratings,
                "ratingBreakdown": breakdown,
                "textResponses": text_responses
            })

        return jsonify({
            "status": "success",
            "data": {
                "id": ks.maks,
                "title": ks.tenks,
                "description": ks.noidung or "",
                "deadline": str(ks.handon) if ks.handon else "",
                "submittedCount": submitted_count,
                "totalTarget": total_target,
                "responseRate": rate,
                "questions": q_list
            }
        }), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


# 3. Tạo khảo sát mới
@admin_bp.route('/surveys', methods=['POST'])
@faculty_required
def create_admin_survey():
    try:
        data = request.get_json() or {}
        title = data.get('title') or 'Khảo sát mới'
        desc = data.get('description') or ''
        deadline = data.get('deadline') or '2026-09-30'
        questions = data.get('questions', [])

        maks = f"KS_{int(datetime.now().timestamp())}"
        ks = KhaoSat(maks=maks, tenks=title, noidung=desc, handon=deadline)
        db.session.add(ks)

        for i, q in enumerate(questions):
            q_name = q.get('name') or f'Câu hỏi {i+1}'
            q_type = q.get('type') or ('Tự luận' if 'tự luận' in q_name.lower() else 'Trắc nghiệm')
            mach = f"CH_{maks}_{i+1}"
            ch = CauHoiKhaoSat(mach=mach, maks=maks, noidung_cauhoi=q_name, loai_cauhoi=q_type, thutu=i+1)
            db.session.add(ch)

        # Phân phối tới sinh viên
        students = SinhVien.query.all()
        for sv in students:
            db.session.add(SvKhaoSat(mssv=sv.mssv, maks=maks, trangthai_lam='0'))

        db.session.commit()
        return jsonify({"status": "success", "message": "Tạo khảo sát thành công"}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500


# 4. Xóa khảo sát
@admin_bp.route('/surveys/<maks>', methods=['DELETE'])
@faculty_required
def delete_admin_survey(maks):
    try:
        # Xóa câu trả lời, câu hỏi, phân phối và khảo sát
        TraLoiKhaoSat.query.filter(TraLoiKhaoSat.mach.in_(
            db.session.query(CauHoiKhaoSat.mach).filter_by(maks=maks)
        )).delete(synchronize_session=False)

        CauHoiKhaoSat.query.filter_by(maks=maks).delete()
        SvKhaoSat.query.filter_by(maks=maks).delete()
        KhaoSat.query.filter_by(maks=maks).delete()

        db.session.commit()
        return jsonify({"status": "success", "message": "Xóa khảo sát thành công"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500


# 5. Xuất kết quả khảo sát ra CSV
@admin_bp.route('/surveys/<maks>/export', methods=['GET'])
@faculty_required
def export_survey_csv(maks):
    try:
        ks = KhaoSat.query.filter_by(maks=maks).first()
        if not ks: return jsonify({"status": "error", "message": "Không tìm thấy khảo sát"}), 404

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["MSSV", "Mã câu hỏi", "Nội dung câu hỏi", "Loại câu hỏi", "Nội dung phản hồi", "Thời gian làm"])

        answers = db.session.query(TraLoiKhaoSat, CauHoiKhaoSat)\
            .join(CauHoiKhaoSat, TraLoiKhaoSat.mach == CauHoiKhaoSat.mach)\
            .filter(CauHoiKhaoSat.maks == maks).all()

        for ans, q in answers:
            writer.writerow([
                ans.mssv,
                q.mach,
                q.noidung_cauhoi,
                q.loai_cauhoi,
                ans.noidung_traloi,
                ans.thoigian_traloi.strftime('%d/%m/%Y %H:%M') if ans.thoigian_traloi else ""
            ])

        res = make_response(output.getvalue())
        res.headers["Content-Disposition"] = f"attachment; filename=ket_qua_khao_sat_{maks}.csv"
        res.headers["Content-type"] = "text/csv; charset=utf-8-sig"
        return res
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    
@admin_bp.route('/surveys/<maks>/export', methods=['GET'])
@faculty_required
def export_admin_survey(maks):
    try:
        ks = KhaoSat.query.filter_by(maks=maks).first()
        if not ks: return jsonify({"status": "error", "message": "Không tìm thấy khảo sát"}), 404

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["MSSV", "Mã câu hỏi", "Nội dung câu hỏi", "Điểm đánh giá (Rating)", "Ý kiến nhận xét", "Thời gian làm"])

        cauhois_query = CauHoiKhaoSat.query.filter_by(maks=maks)
        if not g.is_super_admin and g.makhoa:
            cauhois_query = cauhois_query.filter(
                (CauHoiKhaoSat.loai_cauhoi.like(f"{g.makhoa}%")) | 
                (CauHoiKhaoSat.loai_cauhoi == 'Tự luận') |
                (CauHoiKhaoSat.loai_cauhoi == 'Đánh giá')
            )

        cauhois = {ch.mach: ch.noidung_cauhoi for ch in cauhois_query.all()}
        answers = TraLoiKhaoSat.query.filter(TraLoiKhaoSat.mach.in_(list(cauhois.keys()))).all()

        for a in answers:
            rating = ""
            comment = a.noidung_traloi or ""
            if a.noidung_traloi:
                match = re.search(r"Rating:\s*(\d+)\.\s*Comment:\s*(.*)", a.noidung_traloi, re.IGNORECASE | re.DOTALL)
                if match:
                    rating = match.group(1)
                    comment = match.group(2).strip()

            writer.writerow([
                a.mssv,
                a.mach,
                cauhois.get(a.mach, ""),
                rating,
                comment,
                a.thoigian_traloi.strftime('%d/%m/%Y %H:%M') if a.thoigian_traloi else ""
            ])

        res = make_response(output.getvalue())
        res.headers["Content-Disposition"] = f"attachment; filename=ket_qua_khao_sat_{maks}.csv"
        res.headers["Content-type"] = "text/csv; charset=utf-8-sig"
        return res
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


# ══════════════════════════════════════════════════════════════════════════════
# ─── 7. HỆ THỐNG LIÊN HỆ & BADGES SIDEBAR ADMIN ──────────────────────────────
# ══════════════════════════════════════════════════════════════════════════════

@admin_bp.route('/contacts', methods=['GET'])
def get_system_contacts():
    try:
        contacts = LienHeHeThong.query.all()
        result = []
        for c in contacts:
            result.append({
                "id": c.ma_lienhe,
                "label": c.ten_donvi or "Đơn vị hỗ trợ",
                "email": c.email or "",
                "phone": c.sdt or "",
                "address": c.diachi or "",
                "role": c.loai_lienhe or "Hỗ trợ"
            })
            
        if not result:
            result = [
                {"id": "LH01", "label": "Giáo vụ", "email": "giaovu@fit.hcmus.edu.vn", "role": "Học vụ"},
                {"id": "LH02", "label": "Phòng Đào tạo", "email": "pdt_khtn@hcmus.edu.vn", "role": "Học vụ"},
                {"id": "LH03", "label": "AmongUS", "email": "campusofficial2026@gmail.com", "role": "Hỗ trợ kĩ thuật"}
            ]
            
        return jsonify({"status": "success", "data": result}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@admin_bp.route('/sidebar-badges', methods=['GET'])
@faculty_required
def get_sidebar_badges():
    try:
        # 1. Đếm môn học phần chờ nộp điểm của sinh viên thuộc Khoa
        course_query = LopHocPhan.query.join(MonHoc).filter(
            ~LopHocPhan.trangthai.ilike('%closed%'),
            ~LopHocPhan.trangthai.ilike('%locked%')
        )
        if not g.is_super_admin and g.makhoa:
            subquery_lhp_sv = db.session.query(KetQuaHocTap.malhp)\
                .join(SinhVien, KetQuaHocTap.mssv == SinhVien.mssv)\
                .join(Nganh, SinhVien.manganh == Nganh.manganh)\
                .filter(Nganh.makhoa == g.makhoa)\
                .distinct().subquery()
            course_query = course_query.filter(
                (LopHocPhan.malhp.in_(subquery_lhp_sv)) |
                (MonHoc.mamh.like(f"{g.makhoa}%"))
            )
        pending_courses = course_query.count()

        # 2. Khảo sát còn hạn
        now_str = datetime.now().strftime('%Y-%m-%d')
        active_surveys = KhaoSat.query.filter(KhaoSat.handon >= now_str).count()
        if active_surveys == 0:
            active_surveys = KhaoSat.query.count()

        # 3. Sinh viên nợ học phí theo Khoa
        tuition_query = db.session.query(HocPhi.mssv).join(SinhVien).join(Nganh).filter(
            HocPhi.trangthai_thanhtoan != 'Đã thanh toán',
            HocPhi.trangthai_thanhtoan != 1,
            HocPhi.trangthai_thanhtoan != '1'
        )
        if not g.is_super_admin and g.makhoa:
            tuition_query = tuition_query.filter(Nganh.makhoa == g.makhoa)
        unpaid_tuition = tuition_query.distinct().count()

        # 4. Thông báo theo Khoa
        notif_query = ThongBao.query
        if not g.is_super_admin and g.makhoa:
            notif_query = notif_query.filter((ThongBao.makhoa == g.makhoa) | (ThongBao.makhoa == None))
        total_notifs = notif_query.count()

        return jsonify({
            "status": "success",
            "data": {
                "students": 0,
                "academic": pending_courses,
                "survey": active_surveys,
                "schedule": 0,
                "tuition": unpaid_tuition,
                "notifications": total_notifs
            }
        }), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    
# API THÊM MÔN HỌC VÀO NĂM HỌC
@admin_bp.route('/academic/courses', methods=['POST'])
@faculty_required
def create_academic_course():
    try:
        data = request.get_json() or {}
        ma_mon = (data.get('maMon') or '').strip().upper()
        ten_mon = (data.get('tenMon') or '').strip()
        so_tc = int(data.get('soTC') or 3)
        so_tiet = int(data.get('soTiet') or (so_tc * 15))
        hoc_ky = int(data.get('hocKy') or 1)
        nam_hoc = (data.get('namHoc') or '25-26').strip()
        lop = data.get('lop') or data.get('maNhom') or '24C01'
        gv = data.get('giangVien') or 'Chưa phân công'
        khoa_ten = data.get('khoa') or 'CNTT'
        
        if not ma_mon or not ten_mon:
            return jsonify({"status": "error", "message": "Mã môn và tên môn là bắt buộc"}), 400

        # 1. Tạo hoặc cập nhật MonHoc
        mh = MonHoc.query.filter_by(mamh=ma_mon).first()
        if not mh:
            mh = MonHoc(mamh=ma_mon, tenmh=ten_mon, sotc=so_tc, sotiet=so_tiet)
            db.session.add(mh)
        else:
            mh.tenmh = ten_mon
            mh.sotc = so_tc
            mh.sotiet = so_tiet

        # 2. Tạo hoặc gán HocKyNamHoc
        ma_hk = f"HK{hoc_ky}_{nam_hoc}"
        hk = HocKyNamHoc.query.filter_by(ma_hocky=ma_hk).first()
        if not hk:
            hk = HocKyNamHoc(ma_hocky=ma_hk, ten_hocky=f"Học kỳ {hoc_ky}", namhoc=nam_hoc, trangthai="open")
            db.session.add(hk)

        # 3. Tạo LopHocPhan
        malhp = f"LHP_{ma_mon}_{lop}_{int(datetime.now().timestamp())}"
        lhp = LopHocPhan(
            malhp=malhp,
            mamh=ma_mon,
            ma_hocky=ma_hk,
            tenlop=lop,
            tengv=gv,
            trangthai="pending"
        )
        db.session.add(lhp)
        db.session.commit()

        return jsonify({"status": "success", "message": "Thêm môn học vào năm học thành công"}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500

# API XÓA MÔN HỌC KHỎI NĂM HỌC
@admin_bp.route('/academic/courses/<course_id>', methods=['DELETE'])
@faculty_required
def delete_academic_course(course_id):
    try:
        lhp = LopHocPhan.query.filter_by(malhp=course_id).first()
        if not lhp:
            return jsonify({"status": "error", "message": "Không tìm thấy lớp học phần"}), 404
        
        KetQuaHocTap.query.filter_by(malhp=course_id).delete()
        LichHoc.query.filter_by(malhp=course_id).delete()
        LichThi.query.filter_by(malhp=course_id).delete()
        HocPhi.query.filter_by(malhp=course_id).delete()
        db.session.delete(lhp)
        db.session.commit()
        return jsonify({"status": "success", "message": "Đã xóa môn học thành công"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500