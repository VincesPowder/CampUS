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
            
        stream = io.StringIO(file.stream.read().decode("utf-8-sig"), newline=None)
        csv_reader = csv.reader(stream)
        header = next(csv_reader, None)
        imported_count = 0
        
        default_nganh = None
        if not g.is_super_admin and g.makhoa:
            ng = Nganh.query.filter_by(makhoa=g.makhoa).first()
            default_nganh = ng.manganh if ng else None
        else:
            default_nganh = resolve_manganh(None)
        
        for row in csv_reader:
            if not row or len(row) < 2:
                continue
            mssv = row[0].strip()
            hoten = row.strip()
            if not mssv or not hoten:
                continue
                
            email = row.strip() if len(row) > 2 and row.strip() else f"{mssv}@student.hcmus.edu.vn"
            gioitinh = row.strip() if len(row) > 3 and row.strip() else "Nam"
            nienkhoa = row[4].strip() if len(row) > 4 and row[4].strip() else "2024"
            bacdaotao = row[5].strip() if len(row) > 5 and row[5].strip() else "Đại học"
            loaidaotao = row[6].strip() if len(row) > 6 and row[6].strip() else "Chính quy"
            
            existing = SinhVien.query.filter_by(mssv=mssv).first()
            if existing:
                # Kiểm tra quyền nếu là giáo vụ khoa
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
        return jsonify({"status": "error", "message": str(e)}), 500

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
        
        # Phân quyền: Giáo vụ chỉ xem các LHP môn của Khoa mình
        if not g.is_super_admin and g.makhoa:
            query = query.filter(MonHoc.mamh.like(f"{g.makhoa}%"))

        lhps = query.all()
        result = []

        for lhp in lhps:
            mh = lhp.monhoc
            hk = lhp.hocky_namhoc
            
            nh_val = hk.namhoc if hk else "25-26"
            hk_so = 3
            if hk and "HK1" in hk.ten_hocky: hk_so = 1
            elif hk and "HK2" in hk.ten_hocky: hk_so = 2
            elif hk and "HK3" in hk.ten_hocky: hk_so = 3

            ten_khoa = "CNTT"
            if mh and mh.mamh.startswith("MTH"): ten_khoa = "Toán - Tin"
            elif mh and mh.mamh.startswith("PHY"): ten_khoa = "Vật lý"
            elif mh and mh.mamh.startswith("CHE"): ten_khoa = "Hóa học"

            so_sv = KetQuaHocTap.query.filter_by(malhp=lhp.malhp).count()
            if so_sv == 0:
                so_sv = SinhVien.query.count()
                
            raw_tt = str(lhp.trangthai or "").strip().lower()
            if "close" in raw_tt or "lock" in raw_tt or "khóa" in raw_tt:
                st_val = "locked"
            elif "open" in raw_tt or "upload" in raw_tt or "nộp" in raw_tt:
                st_val = "uploaded"
            else:
                st_val = "pending"

            item = {
                "id": lhp.malhp,
                "maMon": mh.mamh if mh else "",
                "tenMon": mh.tenmh if mh else "",
                "lop": lhp.tenlop or "24C01",
                "soTC": mh.sotc if mh else 3,
                "soTiet": mh.sotiet if mh else 45,
                "khoa": ten_khoa,
                "giangVien": lhp.tengv or "Chưa phân công",
                "emailGV": lhp.mailgv or "",
                "soSV": so_sv,
                "status": st_val,
                "ngayNopDiem": "20/07/2026" if lhp.trangthai in ["uploaded", "locked"] else None,
                "hocKy": hk_so,
                "namHoc": nh_val,
                "maNhom": lhp.tenlop or "",
                "tenNhom": "Nhóm 1"
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
            
        if not g.is_super_admin and g.makhoa:
            if lhp.monhoc and not lhp.monhoc.mamh.startswith(g.makhoa):
                return jsonify({"status": "error", "message": "Không có quyền xem điểm môn học khoa khác"}), 403
            
        kqs = KetQuaHocTap.query.filter_by(malhp=course_id).all()
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
        lhp = LopHocPhan.query.filter_by(malhp=course_id).first()
        if not lhp:
            return jsonify({"status": "error", "message": "Không tìm thấy lớp học phần"}), 404
            
        if not g.is_super_admin and g.makhoa:
            if lhp.monhoc and not lhp.monhoc.mamh.startswith(g.makhoa):
                return jsonify({"status": "error", "message": "Không có quyền sửa điểm môn học khoa khác"}), 403

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
        writer.writerow(["STT", "MSSV", "Họ và tên", "GK", "CK", "Tổng kết", "Điểm chữ", "Kết quả", "Ghi chú"])
        
        for i, kq in enumerate(kqs):
            sv = kq.sinhvien
            writer.writerow([
                i + 1,
                kq.mssv,
                sv.hoten if sv else "",
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

@admin_bp.route('/academic/years', methods=['GET'])
def get_academic_years():
    try:
        hks = HocKyNamHoc.query.all()
        years_map = {}
        
        for hk in hks:
            nh = hk.namhoc or "25-26"
            if nh not in years_map:
                p1, p2 = nh.split("-") if "-" in nh else (nh, "")
                label = f"20{p1}–20{p2}" if p2 else nh
                years_map[nh] = {
                    "id": nh,
                    "label": label,
                    "ngayBatDau": format_date(hk.ngaybatdau) or "01/09/2025",
                    "ngayKetThuc": format_date(hk.ngayketthuc) or "31/08/2026",
                    "soHocKy": 3,
                    "status": hk.trangthai or "open"
                }

        if not years_map:
            years_map["25-26"] = {"id": "25-26", "label": "2025–2026", "ngayBatDau": "01/09/2025", "ngayKetThuc": "31/08/2026", "soHocKy": 3, "status": "open"}
            years_map["24-25"] = {"id": "24-25", "label": "2024–2025", "ngayBatDau": "01/09/2024", "ngayKetThuc": "31/08/2025", "soHocKy": 3, "status": "closed"}

        years_list = sorted(list(years_map.values()), key=lambda x: x["id"], reverse=True)
        return jsonify({"status": "success", "data": years_list}), 200
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
def update_academic_year(year_id):
    try:
        data = request.get_json() or {}
        status = data.get('status')
        start_d = parse_date(data.get('ngayBatDau'))
        end_d = parse_date(data.get('ngayKetThuc'))
        
        hks = HocKyNamHoc.query.filter_by(namhoc=year_id).all()
        for hk in hks:
            if status: hk.trangthai = status
            if start_d: hk.ngaybatdau = start_d
            if end_d: hk.ngayketthuc = end_d
            
        db.session.commit()
        return jsonify({"status": "success", "message": f"Cập nhật năm học {year_id} thành công"}), 200
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
        if not g.is_super_admin and g.makhoa:
            query = query.filter(MonHoc.mamh.like(f"{g.makhoa}%"))

        lich_hocs = query.all()
        result = []

        for lh in lich_hocs:
            lhp = lh.lophocphan
            mh = lhp.monhoc if lhp else None
            bd_str = lh.thoigian_bd.strftime('%H:%M') if lh.thoigian_bd else "07:30"
            kt_str = lh.thoigian_kt.strftime('%H:%M') if lh.thoigian_kt else "11:10"
            thu_chuan = normalize_thu(lh.thu)

            item = {
                "id": lh.malichhoc,
                "malichhoc": lh.malichhoc,
                "malhp": lh.malhp,
                "maMon": mh.mamh if mh else (lhp.mamh if lhp else ""),
                "tenMon": mh.tenmh if mh else (lhp.tenlop if lhp else "Môn học"),
                "lop": lhp.tenlop if lhp else "24C07",
                "giangVien": lhp.tengv if lhp else "Chưa phân công",
                "thu": thu_chuan,
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
        if not lh: return jsonify({"status": "error", "message": "Không tìm thấy lịch học"}), 404

        if not g.is_super_admin and g.makhoa:
            if lh.lophocphan and lh.lophocphan.monhoc and not lh.lophocphan.monhoc.mamh.startswith(g.makhoa):
                return jsonify({"status": "error", "message": "Không có quyền sửa lịch học của khoa khác"}), 403

        if 'thu' in data: lh.thu = data['thu']
        if 'phong' in data: lh.phonghoc = data['phong']
        if 'tuan' in data: lh.tuan = data['tuan']
        if 'hinhThuc' in data: lh.hinhthuchoc = data['hinhThuc']
        if 'gio' in data: lh.thoigian_bd = parse_time_val(data['gio'])

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
            query = query.filter(MonHoc.mamh.like(f"{g.makhoa}%"))

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

            gio_str = lt.giothi.strftime('%H:%M') if lt.giothi else "07:30"
            ca_str = "Ca 1" if gio_str.startswith("07") else ("Ca 2" if gio_str.startswith("09") else "Ca 3")

            item = {
                "id": lt.malichthi,
                "malichthi": lt.malichthi,
                "malhp": lt.malhp,
                "tenMon": mh.tenmh if mh else (lhp.tenlop if lhp else "Môn thi"),
                "maNhom": lhp.tenlop if lhp else "24C07",
                "ngayThi": ngay_str,
                "thu": thu_str,
                "ca": ca_str,
                "gio": f"{gio_str} – 09:30",
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
        writer.writerow(["STT", "Mã MH", "Tên môn học", "Lớp", "Giảng viên", "Thứ", "Thời gian", "Phòng", "Tuần", "Ngày bắt đầu", "Ngày kết thúc", "Hình thức"])

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
            
            if str(r.trangthai_thanhtoan) not in ['1', 'Đã thanh toán']:
                group["trangThai"] = "Chưa thanh toán"

            if r.ngaythanhtoan:
                group["ngayThanhToan"] = r.ngaythanhtoan.strftime('%d/%m/%Y')

            group["items"].append({
                "malhp": r.malhp,
                "maMon": mh.mamh if mh else (lhp.mamh if lhp else ""),
                "tenMon": mh.tenmh if mh else (lhp.tenlop if lhp else "Môn học phần"),
                "soTc": r.sotchp,
                "hocPhiGoc": r.hocphi_goc,
                "mucGiam": r.mucgiam,
                "thucDong": r.thucdong,
                "trangThai": r.trangthai_thanhtoan,
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
        
        # Phân quyền: Giáo vụ chỉ xem thông báo của Khoa mình + Thông báo toàn trường (makhoa is None)
        if not g.is_super_admin and g.makhoa:
            query = query.filter((ThongBao.makhoa == g.makhoa) | (ThongBao.makhoa == None))

        thongbaos = query.order_by(ThongBao.ngaydang.desc()).all()
        total_students = SinhVien.query.count() or 1
        result = []

        for tb in thongbaos:
            donvi = getattr(tb.khoa, 'tenkhoa', None) if hasattr(tb, 'khoa') and tb.khoa else None
            if not donvi:
                t_lower = (tb.tieude or "").lower()
                if "học phí" in t_lower or "tài chính" in t_lower:
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
        
        # Gán mã khoa theo quyền quản trị
        makhoa_val = g.makhoa if (not g.is_super_admin and g.makhoa) else None

        tb = ThongBao(
            matb=matb,
            tieude=data.get('title') or data.get('tieuDe', 'Thông báo mới'),
            noidung=data.get('content') or data.get('noiDung', ''),
            ngaydang=datetime.now(),
            makhoa=makhoa_val
        )
        db.session.add(tb)

        # Phân phối thông báo tới sinh viên thuộc khoa (hoặc toàn trường)
        if not g.is_super_admin and g.makhoa:
            students = SinhVien.query.join(Nganh).filter(Nganh.makhoa == g.makhoa).all()
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


# ══════════════════════════════════════════════════════════════════════════════
# ─── 6. PHÂN HỆ QUẢN LÝ KHẢO SÁT (SURVEY MANAGEMENT) ─────────────────────────
# ══════════════════════════════════════════════════════════════════════════════

@admin_bp.route('/surveys', methods=['GET'])
@faculty_required
def get_admin_surveys():
    try:
        search = request.args.get('search', '').strip().lower()
        status_filter = request.args.get('status', 'all')

        surveys = KhaoSat.query.all()
        total_students = SinhVien.query.count() or 1
        result = []

        for ks in surveys:
            submitted_count = SvKhaoSat.query.filter_by(maks=ks.maks, trangthai_lam='1').count()
            target_count = SvKhaoSat.query.filter_by(maks=ks.maks).count() or total_students
            rate = round((submitted_count / target_count) * 100) if target_count > 0 else 0

            is_active = True
            if ks.handon:
                try:
                    deadline_dt = datetime.strptime(str(ks.handon).strip(), '%Y-%m-%d')
                    is_active = datetime.now().date() <= deadline_dt.date()
                except Exception:
                    pass

            st_key = "active" if is_active else "closed"

            item = {
                "id": ks.maks,
                "maks": ks.maks,
                "title": ks.tenks,
                "description": ks.noidung or "",
                "deadline": ks.handon or "2026-08-30",
                "status": st_key,
                "totalTarget": target_count,
                "submittedCount": submitted_count,
                "responseRate": rate,
                "questionsCount": len(ks.cauhois) if hasattr(ks, 'cauhois') else 0
            }

            if status_filter != 'all' and item["status"] != status_filter:
                continue
            if search and (search not in item["title"].lower() and search not in item["description"].lower()):
                continue

            result.append(item)

        return jsonify({"status": "success", "data": result}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@admin_bp.route('/surveys/<maks>', methods=['GET'])
@faculty_required
def get_admin_survey_detail(maks):
    try:
        ks = KhaoSat.query.filter_by(maks=maks).first()
        if not ks:
            return jsonify({"status": "error", "message": "Không tìm thấy khảo sát"}), 404

        query_q = CauHoiKhaoSat.query.filter_by(maks=ks.maks)
        
        # Phân quyền câu hỏi theo Khoa
        if not g.is_super_admin and g.makhoa:
            query_q = query_q.filter(
                (CauHoiKhaoSat.loai_cauhoi.like(f"{g.makhoa}%")) | 
                (CauHoiKhaoSat.loai_cauhoi == 'Tự luận') |
                (CauHoiKhaoSat.loai_cauhoi == 'Đánh giá')
            )

        questions = query_q.order_by(CauHoiKhaoSat.thutu).all()
        questions_data = []

        for q in questions:
            answers = TraLoiKhaoSat.query.filter_by(mach=q.mach).all()
            ratings_list = []
            text_comments = []
            rating_counts = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}

            for a in answers:
                if a.noidung_traloi:
                    match = re.search(r"Rating:\s*(\d+)\.\s*Comment:\s*(.*)", a.noidung_traloi, re.IGNORECASE | re.DOTALL)
                    if match:
                        r_val = int(match.group(1))
                        if 1 <= r_val <= 5:
                            ratings_list.append(r_val)
                            rating_counts[r_val] += 1
                        cmt = match.group(2).strip()
                        if cmt: text_comments.append(cmt)
                    else:
                        text_comments.append(a.noidung_traloi)

            total_ratings = len(ratings_list)
            avg_rating = round(sum(ratings_list) / total_ratings, 1) if total_ratings > 0 else 0

            rating_breakdown = []
            for star in range(5, 0, -1):
                count = rating_counts[star]
                pct = round((count / total_ratings) * 100) if total_ratings > 0 else 0
                rating_breakdown.append({
                    "star": star,
                    "count": count,
                    "percentage": pct
                })

            questions_data.append({
                "id": q.mach,
                "code": q.loai_cauhoi or "—",
                "content": q.noidung_cauhoi,
                "averageRating": avg_rating,
                "totalRatings": total_ratings,
                "ratingBreakdown": rating_breakdown,
                "textResponses": text_comments
            })

        total_submitted = SvKhaoSat.query.filter_by(maks=maks, trangthai_lam='1').count()
        total_target = SvKhaoSat.query.filter_by(maks=maks).count() or 1

        return jsonify({
            "status": "success",
            "data": {
                "id": ks.maks,
                "title": ks.tenks,
                "description": ks.noidung or "",
                "deadline": ks.handon or "",
                "submittedCount": total_submitted,
                "totalTarget": total_target,
                "responseRate": round((total_submitted / total_target) * 100),
                "questions": questions_data
            }
        }), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@admin_bp.route('/surveys', methods=['POST'])
@faculty_required
def create_admin_survey():
    try:
        data = request.get_json() or {}
        maks = f"KS_{int(datetime.now().timestamp())}"

        ks = KhaoSat(
            maks=maks,
            tenks=data.get('title', 'Khảo sát mới'),
            noidung=data.get('description', ''),
            handon=data.get('deadline', '2026-08-30')
        )
        db.session.add(ks)

        questions = data.get('questions', [])
        for idx, q in enumerate(questions):
            mach = f"CH_{maks}_{idx+1}"
            ch = CauHoiKhaoSat(
                mach=mach,
                maks=maks,
                noidung_cauhoi=q.get('name') or q.get('content', f'Câu hỏi {idx+1}'),
                loai_cauhoi=q.get('code') or q.get('type', 'Đánh giá'),
                thutu=idx+1
            )
            db.session.add(ch)

        if not g.is_super_admin and g.makhoa:
            students = SinhVien.query.join(Nganh).filter(Nganh.makhoa == g.makhoa).all()
        else:
            students = SinhVien.query.all()

        for sv in students:
            db.session.add(SvKhaoSat(mssv=sv.mssv, maks=maks, trangthai_lam='0'))

        db.session.commit()
        return jsonify({"status": "success", "message": "Tạo khảo sát thành công", "id": maks}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500

@admin_bp.route('/surveys/<maks>', methods=['DELETE'])
@faculty_required
def delete_admin_survey(maks):
    try:
        ks = KhaoSat.query.filter_by(maks=maks).first()
        if not ks:
            return jsonify({"status": "error", "message": "Không tìm thấy khảo sát"}), 404

        cauhois = CauHoiKhaoSat.query.filter_by(maks=maks).all()
        for ch in cauhois:
            TraLoiKhaoSat.query.filter_by(mach=ch.mach).delete()

        SvKhaoSat.query.filter_by(maks=maks).delete()
        CauHoiKhaoSat.query.filter_by(maks=maks).delete()
        db.session.delete(ks)

        db.session.commit()
        return jsonify({"status": "success", "message": "Đã xóa khảo sát thành công"}), 200
    except Exception as e:
        db.session.rollback()
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
        # 1. Đếm môn học phần chờ nộp điểm theo Khoa
        course_query = LopHocPhan.query.join(MonHoc).filter(
            ~LopHocPhan.trangthai.ilike('%closed%'),
            ~LopHocPhan.trangthai.ilike('%locked%')
        )
        if not g.is_super_admin and g.makhoa:
            course_query = course_query.filter(MonHoc.mamh.like(f"{g.makhoa}%"))
        pending_courses = course_query.count()

        # 2. Đếm số khảo sát còn hạn
        now_str = datetime.now().strftime('%Y-%m-%d')
        active_surveys = KhaoSat.query.filter(KhaoSat.handon >= now_str).count()
        if active_surveys == 0:
            active_surveys = KhaoSat.query.count()

        # 3. Đếm số sinh viên nợ học phí theo Khoa
        tuition_query = db.session.query(HocPhi.mssv).join(SinhVien).join(Nganh).filter(
            HocPhi.trangthai_thanhtoan != 'Đã thanh toán',
            HocPhi.trangthai_thanhtoan != 1,
            HocPhi.trangthai_thanhtoan != '1'
        )
        if not g.is_super_admin and g.makhoa:
            tuition_query = tuition_query.filter(Nganh.makhoa == g.makhoa)
        unpaid_tuition = tuition_query.distinct().count()

        # 4. Đếm số thông báo theo Khoa
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