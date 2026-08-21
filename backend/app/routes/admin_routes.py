# backend/app/routes/admin_routes.py
from flask import Blueprint, request, jsonify
from datetime import datetime
from app import db
from app.models.student import SinhVien, NguoiThan, DotCapNhatHoSo, Khoa, Nganh

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')

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

# ─── 1. Lấy danh sách sinh viên ──────────────────────────────────────────────
@admin_bp.route('/students', methods=['GET'])
def get_students():
    try:
        query = SinhVien.query
        
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
                # Thông tin cá nhân
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
                # Cố vấn / người liên hệ
                "cvTen": s.nguoilienlac or "",
                "cvSdt": s.sdtlienlac or "",
                "cvEmail": s.maillienlac or "",
                "cvQuanHe": s.quanhe_nll or "Giảng viên cố vấn",
                # Ngân hàng
                "nganHang": s.tennh or "",
                "stk": s.sothenh or "",
                "chiNhanh": "TP. Hồ Chí Minh"
            })
        return jsonify({"status": "success", "data": result}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# ─── 2. Lấy chi tiết sinh viên & gia đình ─────────────────────────────────────
@admin_bp.route('/students/<mssv>', methods=['GET'])
def get_student_detail(mssv):
    try:
        s = SinhVien.query.filter_by(mssv=mssv).first()
        if not s:
            return jsonify({"status": "error", "message": "Không tìm thấy sinh viên"}), 404
        
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
                "province": mem.tinhthanh or "",
                "ward": mem.phuongxa or "",
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

# ─── 3. Thêm sinh viên mới ────────────────────────────────────────────────────
@admin_bp.route('/students', methods=['POST'])
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
        
        new_sv = SinhVien(
            mssv=mssv,
            hoten=ho_ten,
            mailtruong=email,
            gioitinh=data.get('gioiTinh', 'Nam'),
            nienkhoa=data.get('khoa', '2024'),
            bacdaotao=data.get('bacDT', 'Đại học'),
            loaidaotao=data.get('loaiDT', 'Chính quy'),
            macn=data.get('chuyenNganh', ''),
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

# ─── 4. Cập nhật hồ sơ sinh viên & người thân ─────────────────────────────────
@admin_bp.route('/students/<mssv>', methods=['PUT'])
def update_student(mssv):
    try:
        s = SinhVien.query.filter_by(mssv=mssv).first()
        if not s:
            return jsonify({"status": "error", "message": "Không tìm thấy sinh viên"}), 404
            
        data = request.get_json() or {}
        
        if 'hoTen' in data: s.hoten = data['hoTen']
        if 'gioiTinh' in data: s.gioitinh = data['gioiTinh']
        if 'khoa' in data: s.nienkhoa = data['khoa']
        if 'bacDT' in data: s.bacdaotao = data['bacDT']
        if 'loaiDT' in data: s.loaidaotao = data['loaiDT']
        if 'chuyenNganh' in data: s.macn = data['chuyenNganh']
        if 'email' in data: s.mailtruong = data['email']
        
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
        
        # Cập nhật thông tin gia đình (nếu có)
        if 'family' in data and isinstance(data['family'], list):
            NguoiThan.query.filter_by(mssv=mssv).delete()
            for idx, m in enumerate(data['family']):
                if m.get('name'):
                    dob_val = None
                    if m.get('dob'):
                        try:
                            dob_val = int(str(m['dob'])[:4])
                        except ValueError:
                            dob_val = None
                            
                    new_mem = NguoiThan(
                        mant=f"NT_{mssv}_{idx+1}",
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

# ─── 5. Quyền chỉnh sửa hồ sơ (Đợt cập nhật hồ sơ) ───────────────────────────
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
            
        # GET request
        if not dot:
            return jsonify({
                "status": "success",
                "data": {
                    "enabled": False,
                    "from": "",
                    "to": "",
                    "nganhs": [],
                    "khoas": []
                }
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