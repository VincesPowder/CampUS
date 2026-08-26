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