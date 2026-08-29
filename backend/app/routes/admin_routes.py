# backend/app/routes/admin_routes.py
from flask import Blueprint, request, jsonify, make_response
from datetime import datetime
import csv
import io
from app import db
from app.models.student import SinhVien, NguoiThan, DotCapNhatHoSo, Khoa, Nganh
from app.models.academic import HocKyNamHoc, MonHoc, LopHocPhan, KetQuaHocTap, LichSuChinhSua, TienDoHocTap, TienDoNhomHocPhan
from app.models.notification import SvThongBao
from app.models.survey import SvKhaoSat, TraLoiKhaoSat
from app.models.tuition import HocPhi
from app.models.user import User


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

def resolve_manganh(nganh_input):
    if not nganh_input:
        first_ng = Nganh.query.first()
        return first_ng.manganh if first_ng else None
    
    nganh_obj = Nganh.query.filter(
        (Nganh.manganh == nganh_input) | 
        (Nganh.tennganh.ilike(f"%{nganh_input}%"))
    ).first()
    
    if nganh_obj:
        return nganh_obj.manganh
        
    first_ng = Nganh.query.first()
    return first_ng.manganh if first_ng else None

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
                # Người liên lạc
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
        manganh_val = resolve_manganh(data.get('nganh'))
        
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
        if 'nganh' in data and data['nganh']:
            manganh_val = resolve_manganh(data['nganh'])
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
        
        # Cập nhật danh sách người thân
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

# ─── 5. Xóa sinh viên ────────────────────────────────────────────────────────
@admin_bp.route('/students/<mssv>', methods=['DELETE'])
def delete_student(mssv):
    try:
        s = SinhVien.query.filter_by(mssv=mssv).first()
        if not s:
            return jsonify({"status": "error", "message": "Không tìm thấy sinh viên"}), 404
        
        # Xóa các ràng buộc dữ liệu liên kết
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

# ─── 6. Nhập sinh viên từ file CSV ──────────────────────────────────────────
@admin_bp.route('/students/import', methods=['POST'])
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
        
        for row in csv_reader:
            if not row or len(row) < 2:
                continue
            mssv = row[0].strip()
            hoten = row.strip()
            if not mssv or not hoten:
                continue
                
            email = row.strip() if len(row) > 2 and row.strip() else f"{mssv}@student.hcmus.edu.vn"
            gioitinh = row.strip() if len(row) > 3 and row.strip() else "Nam"
            nienkhoa = row.strip() if len(row) > 4 and row.strip() else "2024"
            bacdaotao = row.strip() if len(row) > 5 and row.strip() else "Đại học"
            loaidaotao = row[6].strip() if len(row) > 6 and row[6].strip() else "Chính quy"
            
            existing = SinhVien.query.filter_by(mssv=mssv).first()
            if existing:
                existing.hoten = hoten
                existing.mailtruong = email
                existing.gioitinh = gioitinh
                existing.nienkhoa = nienkhoa
                existing.bacdaotao = bacdaotao
                existing.loaidaotao = loaidaotao
            else:
                manganh_val = resolve_manganh(None)
                new_sv = SinhVien(
                    mssv=mssv,
                    hoten=hoten,
                    mailtruong=email,
                    gioitinh=gioitinh,
                    nienkhoa=nienkhoa,
                    bacdaotao=bacdaotao,
                    loaidaotao=loaidaotao,
                    manganh=manganh_val
                )
                db.session.add(new_sv)
            imported_count += 1
            
        db.session.commit()
        return jsonify({"status": "success", "message": f"Đã nhập thành công {imported_count} sinh viên"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500

# ─── 7. Xuất sinh viên ra file CSV ──────────────────────────────────────────
@admin_bp.route('/students/export', methods=['GET'])
def export_students():
    try:
        students = SinhVien.query.order_by(SinhVien.mssv.desc()).all()
        
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

# ─── 8. Quyền chỉnh sửa hồ sơ ────────────────────────────────────────────────
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
    
#########################################################

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

# Hàm đảm bảo có dữ liệu môn học phần và học kỳ trong DB
def ensure_academic_seed_data():
    try:
        if HocKyNamHoc.query.count() == 0:
            hk1 = HocKyNamHoc(ma_hocky="HK3_25-26", ten_hocky="Học kỳ 3", namhoc="25-26", trangthai="open", ngaybatdau=parse_date("01/06/2026"), ngayketthuc=parse_date("31/08/2026"))
            hk2 = HocKyNamHoc(ma_hocky="HK2_25-26", ten_hocky="Học kỳ 2", namhoc="25-26", trangthai="open", ngaybatdau=parse_date("15/01/2026"), ngayketthuc=parse_date("30/05/2026"))
            hk3 = HocKyNamHoc(ma_hocky="HK1_25-26", ten_hocky="Học kỳ 1", namhoc="25-26", trangthai="closed", ngaybatdau=parse_date("01/09/2025"), ngayketthuc=parse_date("10/01/2026"))
            db.session.add_all([hk1, hk2, hk3])
            db.session.commit()

        if MonHoc.query.count() == 0:
            m1 = MonHoc(mamh="CSC10001", tenmh="Nhập môn lập trình", sotc=4, sotiet=60)
            m2 = MonHoc(mamh="CSC10002", tenmh="Kỹ thuật lập trình", sotc=4, sotiet=60)
            m3 = MonHoc(mamh="CSC10003", tenmh="Cấu trúc dữ liệu và giải thuật", sotc=4, sotiet=60)
            m4 = MonHoc(mamh="MTH10001", tenmh="Giải tích 1", sotc=3, sotiet=45)
            m5 = MonHoc(mamh="PHY10001", tenmh="Vật lý đại cương 1", sotc=3, sotiet=45)
            db.session.add_all([m1, m2, m3, m4, m5])
            db.session.commit()

        if LopHocPhan.query.count() == 0:
            l1 = LopHocPhan(malhp="LHP01", mamh="CSC10001", ma_hocky="HK3_25-26", tenlop="24C01", tengv="TS. Nguyễn Văn A", mailgv="nva@hcmus.edu.vn", trangthai="locked")
            l2 = LopHocPhan(malhp="LHP02", mamh="CSC10002", ma_hocky="HK3_25-26", tenlop="24C02", tengv="ThS. Trần Thị B", mailgv="ttb@hcmus.edu.vn", trangthai="uploaded")
            l3 = LopHocPhan(malhp="LHP03", mamh="CSC10003", ma_hocky="HK3_25-26", tenlop="24C03", tengv="TS. Đỗ Văn E", mailgv="dve@hcmus.edu.vn", trangthai="pending")
            l4 = LopHocPhan(malhp="LHP04", mamh="MTH10001", ma_hocky="HK3_25-26", tenlop="24T01", tengv="PGS.TS Lê Văn C", mailgv="lvc@hcmus.edu.vn", trangthai="uploaded")
            db.session.add_all([l1, l2, l3, l4])
            db.session.commit()

        # Đảm bảo có kết quả học tập cho lớp học phần
        if KetQuaHocTap.query.count() == 0:
            students = SinhVien.query.all()
            for lhp in LopHocPhan.query.all():
                for i, sv in enumerate(students):
                    seed_val = (i * 7 + 13) % 10
                    cc = 8.5 + (seed_val % 3) * 0.5
                    gk = 6.0 + (seed_val % 5) * 0.8
                    ck = 5.5 + (seed_val % 6) * 0.7
                    if i % 8 == 0: gk, ck = 4.0, 3.5
                    
                    tb = round(cc * 0.1 + gk * 0.3 + ck * 0.6, 1)
                    chu, tt = tinh_diem_chu(tb)
                    
                    kq = KetQuaHocTap(
                        mssv=sv.mssv,
                        malhp=lhp.malhp,
                        diemcc=round(cc, 1),
                        diemgk=round(gk, 1),
                        diemck=round(ck, 1),
                        diemtb_he10=tb,
                        loaidiem_hechu=chu,
                        trangthai=tt,
                        ghichu="Điểm thi chính thức"
                    )
                    db.session.add(kq)
            db.session.commit()
    except Exception as e:
        db.session.rollback()
        print("Lỗi seed academic data:", e)

# ─── 1. Lấy danh sách Môn học / Lớp học phần từ CSDL ─────────────────────────
@admin_bp.route('/academic/courses', methods=['GET'])
def get_academic_courses():
    try:
        ensure_academic_seed_data()
        
        nam_hoc = request.args.get('namHoc', '')
        hoc_ky = request.args.get('hocKy', '')
        status = request.args.get('status', '')
        khoa = request.args.get('khoa', '')
        search = request.args.get('search', '').strip().lower()

        lhps = LopHocPhan.query.join(MonHoc).join(HocKyNamHoc).all()
        result = []

        for lhp in lhps:
            mh = lhp.monhoc
            hk = lhp.hocky_namhoc
            
            # Phân tách năm học và học kỳ số
            nh_val = hk.namhoc if hk else "25-26"
            hk_so = 3
            if hk and "HK1" in hk.ten_hocky: hk_so = 1
            elif hk and "HK2" in hk.ten_hocky: hk_so = 2
            elif hk and "HK3" in hk.ten_hocky: hk_so = 3

            ten_khoa = "CNTT"
            if mh and mh.mamh.startswith("MTH"): ten_khoa = "Toán - Tin"
            elif mh and mh.mamh.startswith("PHY"): ten_khoa = "Vật lý"
            elif mh and mh.mamh.startswith("CHE"): ten_khoa = "Hóa học"

            # Đếm số lượng sinh viên trong lớp học phần từ KETQUA_HOCTAP
            so_sv = KetQuaHocTap.query.filter_by(malhp=lhp.malhp).count()
            if so_sv == 0:
                so_sv = SinhVien.query.count()

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
                "status": lhp.trangthai or "pending",
                "ngayNopDiem": "20/07/2026" if lhp.trangthai in ["uploaded", "locked"] else None,
                "hocKy": hk_so,
                "namHoc": nh_val,
                "maNhom": lhp.tenlop or "",
                "tenNhom": "Nhóm 1"
            }

            # Lọc theo điều kiện tìm kiếm
            if nam_hoc and item["namHoc"] != nam_hoc: continue
            if hoc_ky and str(item["hocKy"]) != str(hoc_ky): continue
            if status and status != "all" and item["status"] != status: continue
            if khoa and khoa != "all" and item["khoa"] != khoa: continue
            if search:
                if (search not in item["tenMon"].lower() and 
                    search not in item["maMon"].lower() and 
                    search not in item["giangVien"].lower()):
                    continue
                    
            result.append(item)

        return jsonify({"status": "success", "data": result}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# ─── 2. Lấy bảng điểm chi tiết của Môn học phần từ CSDL ──────────────────────
@admin_bp.route('/academic/courses/<course_id>/grades', methods=['GET'])
def get_course_grades(course_id):
    try:
        ensure_academic_seed_data()
        
        kqs = KetQuaHocTap.query.filter_by(malhp=course_id).all()
        
        grades_list = []
        for kq in kqs:
            sv = kq.sinhvien
            # Điểm CC mặc định 10 hoặc tính từ GK/CK
            diem_cc = 10.0
            grades_list.append({
                "mssv": kq.mssv,
                "hoTen": sv.hoten if sv else f"Sinh viên {kq.mssv}",
                "diemCC": diem_cc,
                "diemGK": kq.diemgk,
                "diemCK": kq.diemck,
                "diemTK": kq.diemtb_he10,
                "ghiChu": "Điểm chính thức"
            })

        return jsonify({"status": "success", "data": grades_list}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# ─── 3. Chỉnh sửa điểm sinh viên vào CSDL ────────────────────────────────────
@admin_bp.route('/academic/courses/<course_id>/grades/<mssv>', methods=['PUT'])
def update_student_grade(course_id, mssv):
    try:
        data = request.get_json() or {}
        kq = KetQuaHocTap.query.filter_by(malhp=course_id, mssv=mssv).first()
        
        if not kq:
            kq = KetQuaHocTap(mssv=mssv, malhp=course_id)
            db.session.add(kq)

        cc = float(data.get('diemCC', 10.0)) if data.get('diemCC') is not None else 10.0
        gk = float(data.get('diemGK')) if data.get('diemGK') is not None else None
        ck = float(data.get('diemCK')) if data.get('diemCK') is not None else None
        ly_do = data.get('ghiChu', '')

        kq.diemgk = gk
        kq.diemck = ck

        # Tính lại điểm tổng kết hệ 10 và hệ chữ
        if gk is not None and ck is not None:
            tb = round(cc * 0.1 + gk * 0.3 + ck * 0.6, 1)
            chu, tt = tinh_diem_chu(tb)
            kq.diemtb_he10 = tb
            kq.loaidiem_hechu = chu
            kq.trangthai = tt

        # Ghi log chỉnh sửa điểm vào LICHSU_CHINHSUA
        try:
            log = LichSuChinhSua(
                malog=f"LOG_{int(datetime.now().timestamp())}",
                mssv=mssv,
                bang_bi_sua="KETQUA_HOCTAP",
                dulieu_moi=f"GK={gk}, CK={ck}, LyDo={ly_do}",
                nguoithuchien="ADMIN"
            )
            db.session.add(log)
        except Exception:
            pass

        db.session.commit()
        return jsonify({"status": "success", "message": "Cập nhật điểm thành công"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500

# ─── 4. Khóa & Công bố điểm môn học ───────────────────────────────────────────
@admin_bp.route('/academic/courses/<course_id>/lock', methods=['POST'])
def lock_course_grades(course_id):
    try:
        lhp = LopHocPhan.query.filter_by(malhp=course_id).first()
        if lhp:
            lhp.trangthai = "locked"
            db.session.commit()
            
        return jsonify({
            "status": "success",
            "message": f"Đã khóa và công bố điểm môn học {course_id}",
            "data": {
                "id": course_id,
                "status": "locked",
                "ngayNopDiem": datetime.now().strftime('%d/%m/%Y')
            }
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500

# ─── 5. Xuất bảng điểm môn học ra file CSV ────────────────────────────────────
@admin_bp.route('/academic/courses/<course_id>/export-grades', methods=['GET'])
def export_course_grades(course_id):
    try:
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

# ─── 6. Lấy danh sách Năm học từ CSDL ─────────────────────────────────────────
@admin_bp.route('/academic/years', methods=['GET'])
def get_academic_years():
    try:
        ensure_academic_seed_data()
        
        # Gom nhóm từ bảng HOCKY_NAMHOC
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

        # Đảm bảo có ít nhất các năm học chuẩn
        if not years_map:
            years_map["25-26"] = {"id": "25-26", "label": "2025–2026", "ngayBatDau": "01/09/2025", "ngayKetThuc": "31/08/2026", "soHocKy": 3, "status": "open"}
            years_map["24-25"] = {"id": "24-25", "label": "2024–2025", "ngayBatDau": "01/09/2024", "ngayKetThuc": "31/08/2025", "soHocKy": 3, "status": "closed"}

        years_list = sorted(list(years_map.values()), key=lambda x: x["id"], reverse=True)
        return jsonify({"status": "success", "data": years_list}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# ─── 7. Thêm / Cập nhật Năm học ───────────────────────────────────────────────
@admin_bp.route('/academic/years', methods=['POST'])
def create_academic_year():
    try:
        data = request.get_json() or {}
        year_id = data.get('id', '')
        label = data.get('label', '')
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
# ─── QUẢN LÝ KHẢO SÁT (ADMIN SURVEY MANAGEMENT) ──────────────────────────────
# ══════════════════════════════════════════════════════════════════════════════
from app.models.survey import KhaoSat, CauHoiKhaoSat, SvKhaoSat, TraLoiKhaoSat
from app.models.student import SinhVien
import re

# ── 1. Lấy danh sách khảo sát cho Admin ──
@admin_bp.route('/surveys', methods=['GET'])
def get_admin_surveys():
    try:
        search = request.args.get('search', '').strip().lower()
        status_filter = request.args.get('status', 'all')

        surveys = KhaoSat.query.all()
        total_students = SinhVien.query.count() or 1
        result = []

        for ks in surveys:
            # Đếm số lượng sinh viên đã nộp khảo sát
            submitted_count = SvKhaoSat.query.filter_by(maks=ks.maks, trangthai_lam='1').count()
            target_count = SvKhaoSat.query.filter_by(maks=ks.maks).count() or total_students
            rate = round((submitted_count / target_count) * 100) if target_count > 0 else 0

            # Phân loại trạng thái (active / closed)
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

# ── 2. Xem chi tiết & Thống kê kết quả khảo sát ──
@admin_bp.route('/surveys/<maks>', methods=['GET'])
def get_admin_survey_detail(maks):
    try:
        ks = KhaoSat.query.filter_by(maks=maks).first()
        if not ks:
            return jsonify({"status": "error", "message": "Không tìm thấy khảo sát"}), 404

        questions = CauHoiKhaoSat.query.filter_by(maks=ks.maks).order_by(CauHoiKhaoSat.thutu).all()
        questions_data = []

        for q in questions:
            # Lấy toàn bộ câu trả lời của câu hỏi này
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

            # Phân tích % của từng mức sao (1 -> 5)
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

# ── 3. Tạo khảo sát mới ──
@admin_bp.route('/surveys', methods=['POST'])
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

        # Thêm danh sách câu hỏi / môn học cần đánh giá
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

        # Gán khảo sát cho toàn bộ sinh viên trong CSDL
        students = SinhVien.query.all()
        for sv in students:
            db.session.add(SvKhaoSat(mssv=sv.mssv, maks=maks, trangthai_lam='0'))

        db.session.commit()
        return jsonify({"status": "success", "message": "Tạo khảo sát thành công", "id": maks}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500

# ── 4. Xóa khảo sát ──
@admin_bp.route('/surveys/<maks>', methods=['DELETE'])
def delete_admin_survey(maks):
    try:
        ks = KhaoSat.query.filter_by(maks=maks).first()
        if not ks:
            return jsonify({"status": "error", "message": "Không tìm thấy khảo sát"}), 404

        # Xóa câu trả lời của các câu hỏi thuộc khảo sát này
        cauhois = CauHoiKhaoSat.query.filter_by(maks=maks).all()
        for ch in cauhois:
            TraLoiKhaoSat.query.filter_by(mach=ch.mach).delete()

        # Xóa phân công sinh viên, câu hỏi và khảo sát
        SvKhaoSat.query.filter_by(maks=maks).delete()
        CauHoiKhaoSat.query.filter_by(maks=maks).delete()
        db.session.delete(ks)

        db.session.commit()
        return jsonify({"status": "success", "message": "Đã xóa khảo sát thành công"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500

# ── 5. Xuất kết quả khảo sát ra file CSV ──
@admin_bp.route('/surveys/<maks>/export', methods=['GET'])
def export_admin_survey(maks):
    try:
        ks = KhaoSat.query.filter_by(maks=maks).first()
        if not ks: return jsonify({"status": "error", "message": "Không tìm thấy"}), 404

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["MSSV", "Mã câu hỏi", "Nội dung câu hỏi", "Điểm đánh giá (Rating)", "Ý kiến nhận xét", "Thời gian làm"])

        cauhois = {ch.mach: ch.noidung_cauhoi for ch in CauHoiKhaoSat.query.filter_by(maks=maks).all()}
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
# ─── QUẢN LÝ LỊCH HỌC & LỊCH THI (SCHEDULE & EXAMS) ──────────────────────────
# ══════════════════════════════════════════════════════════════════════════════
from app.models.schedule import LichHoc, LichThi

def parse_time_val(time_str):
    if not time_str: return None
    try:
        t_clean = str(time_str).strip().split('–')[0].strip().split('-')[0].strip()
        return datetime.strptime(t_clean, '%H:%M').time()
    except Exception:
        return None

def ensure_schedule_seed_data():
    try:
        lhps = LopHocPhan.query.all()
        if not lhps: return

        if LichHoc.query.count() == 0:
            thu_list = ["Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"]
            phong_list = ["C.42", "I.23", "F.102", "B.31", "E.201", "Lab 03"]
            
            for idx, lhp in enumerate(lhps[:15]):
                lh = LichHoc(
                    malichhoc=f"LH_{lhp.malhp}_{idx+1}",
                    malhp=lhp.malhp,
                    tuan="1–15",
                    ngaybatdau=parse_date("01/09/2025"),
                    ngayketthuc=parse_date("15/01/2026"),
                    thu=thu_list[idx % len(thu_list)],
                    thoigian_bd=parse_time_val("07:30"),
                    thoigian_kt=parse_time_val("10:00"),
                    phonghoc=phong_list[idx % len(phong_list)],
                    hinhthuchoc="Trực tiếp" if idx % 4 != 0 else "Trực tuyến"
                )
                db.session.add(lh)
            db.session.commit()

        if LichThi.query.count() == 0:
            phong_thi = ["I.42", "C.31", "F.201", "E.102", "B.22"]
            for idx, lhp in enumerate(lhps[:12]):
                lt = LichThi(
                    malichthi=f"LT_{lhp.malhp}_{idx+1}",
                    malhp=lhp.malhp,
                    ngaythi=parse_date(f"{20 + (idx % 8)}/11/2026"),
                    giothi=parse_time_val("07:30" if idx % 2 == 0 else "13:30"),
                    thoigianlambai=90 if idx % 3 != 0 else 120,
                    phongthi=phong_thi[idx % len(phong_thi)]
                )
                db.session.add(lt)
            db.session.commit()
    except Exception as e:
        db.session.rollback()
        print("Lỗi seed schedule:", e)

# ── 1. Danh sách Lịch học (TKB) ──
# Thêm hàm chuẩn hóa thứ
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

@admin_bp.route('/schedule/classes', methods=['GET'])
def get_admin_classes():
    try:
        ensure_schedule_seed_data()
        nam_hoc = request.args.get('namHoc', '')
        hoc_ky = request.args.get('hocKy', '')
        thu = request.args.get('thu', '')
        search = request.args.get('search', '').strip().lower()

        lich_hocs = LichHoc.query.join(LopHocPhan).all()
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

            # Lọc theo thứ chuẩn hóa
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

# ── 2. Thêm / Sửa / Xóa Lịch học ──
@admin_bp.route('/schedule/classes', methods=['POST'])
def create_class_schedule():
    try:
        data = request.get_json() or {}
        malhp = data.get('malhp')
        if not malhp:
            first_lhp = LopHocPhan.query.first()
            malhp = first_lhp.malhp if first_lhp else "HP001"

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
def update_class_schedule(id):
    try:
        data = request.get_json() or {}
        lh = LichHoc.query.filter_by(malichhoc=id).first()
        if not lh: return jsonify({"status": "error", "message": "Không tìm thấy lịch học"}), 404

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
def delete_class_schedule(id):
    try:
        LichHoc.query.filter_by(malichhoc=id).delete()
        db.session.commit()
        return jsonify({"status": "success", "message": "Đã xóa lịch học"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500

# ── 3. Danh sách Lịch thi ──
@admin_bp.route('/schedule/exams', methods=['GET'])
def get_admin_exams():
    try:
        ensure_schedule_seed_data()
        search = request.args.get('search', '').strip().lower()

        lich_this = LichThi.query.join(LopHocPhan).all()
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

# ── 4. Thêm / Sửa / Xóa Lịch thi ──
@admin_bp.route('/schedule/exams', methods=['POST'])
def create_exam_schedule():
    try:
        data = request.get_json() or {}
        first_lhp = LopHocPhan.query.first()
        malhp = first_lhp.malhp if first_lhp else "HP001"

        malt = f"LT_{int(datetime.now().timestamp())}"
        
        tg_num = 90
        try:
            tg_num = int(str(data.get('thoiGian', '90')).replace('phút', '').strip())
        except Exception:
            pass

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
def update_exam_schedule(id):
    try:
        data = request.get_json() or {}
        lt = LichThi.query.filter_by(malichthi=id).first()
        if not lt: return jsonify({"status": "error", "message": "Không tìm thấy lịch thi"}), 404

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
def delete_exam_schedule(id):
    try:
        LichThi.query.filter_by(malichthi=id).delete()
        db.session.commit()
        return jsonify({"status": "success", "message": "Đã xóa lịch thi"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500

# ── 5. Xuất Lịch học / Lịch thi ra file CSV ──
@admin_bp.route('/schedule/classes/export', methods=['GET'])
def export_classes_csv():
    try:
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["STT", "Mã MH", "Tên môn học", "Lớp", "Giảng viên", "Thứ", "Thời gian", "Phòng", "Tuần", "Hình thức"])

        lich_hocs = LichHoc.query.join(LopHocPhan).all()
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
                lh.hinhthuchoc or ""
            ])

        res = make_response(output.getvalue())
        res.headers["Content-Disposition"] = "attachment; filename=thoi_khoa_bieu.csv"
        res.headers["Content-type"] = "text/csv; charset=utf-8-sig"
        return res
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@admin_bp.route('/schedule/exams/export', methods=['GET'])
def export_exams_csv():
    try:
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["STT", "Tên môn học", "Mã nhóm", "Ngày thi", "Thứ", "Giờ thi", "Thời gian", "Phòng thi", "Số thí sinh", "Hình thức"])

        lich_this = LichThi.query.join(LopHocPhan).all()
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