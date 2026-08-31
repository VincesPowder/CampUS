from flask import Blueprint, jsonify, request, send_file
import re
from datetime import datetime
from app import db

# Models
from app.models.student import SinhVien, DotCapNhatHoSo, NguoiThan, ChuyenNganh, Nganh, Khoa
from app.models.academic import (
    TienDoHocTap, TienDoNhomHocPhan, NhomHocPhan, 
    KetQuaHocTap, LopHocPhan, MonHoc, HocKyNamHoc
)
from app.models.tuition import HocPhi
from app.models.notification import SvThongBao, ThongBao
from app.services.schedule_service import ScheduleService
from app.services.academic_service import AcademicService

student_bp = Blueprint('student', __name__)

def format_date(date_val):
    """Helper định dạng ngày an toàn"""
    if not date_val:
        return None
    if hasattr(date_val, 'strftime'):
        return date_val.strftime('%Y-%m-%d')
    return str(date_val)

def check_update_eligibility():
    """Kiểm tra đợt cập nhật hồ sơ có đang mở hay không"""
    now = datetime.now()
    active_period = DotCapNhatHoSo.query.filter(
        DotCapNhatHoSo.trangthai_mo == 1,
        DotCapNhatHoSo.thoigian_batdau <= now,
        DotCapNhatHoSo.thoigian_ketthuc >= now
    ).first()
    return active_period is not None


# =============================================================================
# 1. SCHEDULE ROUTES (LỊCH HỌC & LỊCH THI)
# =============================================================================

@student_bp.route('/schedule/filters', methods=['GET'])
@student_bp.route('/<mssv>/schedule/filters', methods=['GET'])
def get_filters(mssv=None):
    mssv_query = mssv or request.args.get('mssv', default='', type=str)
    filters = ScheduleService.get_filter_options(mssv_query)
    return jsonify({"status": "success", "data": filters}), 200

@student_bp.route('/schedule/weekly', methods=['GET'])
@student_bp.route('/<mssv>/schedule/weekly', methods=['GET'])
def get_weekly_schedule(mssv=None):
    mssv_query = mssv or request.args.get('mssv', default='', type=str)
    ma_hocky = request.args.get('ma_hocky', default='HK001', type=str)
    week_number = request.args.get('week', default=1, type=int)

    data = ScheduleService.get_weekly_schedule(mssv_query, ma_hocky, week_number)
    return jsonify({"status": "success", "data": data}), 200

@student_bp.route('/schedule/exams', methods=['GET'])
@student_bp.route('/<mssv>/schedule/exams', methods=['GET'])
def get_exam_schedule(mssv=None):
    mssv_query = mssv or request.args.get('mssv', default='', type=str)
    ma_hocky = request.args.get('ma_hocky', default='HK001', type=str)

    data = ScheduleService.get_exam_schedule(mssv_query, ma_hocky)
    return jsonify({"status": "success", "data": data}), 200

# backend/app/routes/student_routes.py (Đoạn route xuất file)

@student_bp.route('/schedule/weekly/export', methods=['GET'])
@student_bp.route('/<mssv>/schedule/weekly/export', methods=['GET'])
def export_weekly_csv(mssv=None):
    mssv_query = mssv or request.args.get('mssv', default='', type=str)
    ma_hocky = request.args.get('ma_hocky', default='HK001', type=str)
    week_number = request.args.get('week', default=1, type=int)

    csv_file = ScheduleService.export_weekly_schedule_csv(mssv_query, ma_hocky, week_number)
    return send_file(
        csv_file,
        mimetype="text/csv; charset=utf-8-sig",
        as_attachment=True,
        download_name=f"TKB_Tuan_{week_number}.csv"
    )

@student_bp.route('/schedule/exams/export', methods=['GET'])
@student_bp.route('/<mssv>/schedule/exams/export', methods=['GET'])
def export_exams_csv(mssv=None):
    mssv_query = mssv or request.args.get('mssv', default='', type=str)
    ma_hocky = request.args.get('ma_hocky', default='HK001', type=str)

    csv_file = ScheduleService.export_exam_schedule_csv(mssv_query, ma_hocky)
    return send_file(
        csv_file,
        mimetype="text/csv; charset=utf-8-sig",
        as_attachment=True,
        download_name="Lich_Thi.csv"
    )

# =============================================================================
# 2. PROFILE & FAMILY ROUTES (HỒ SƠ CÁ NHÂN & GIA ĐÌNH)
# =============================================================================

@student_bp.route('/<mssv>', methods=['GET'])
def get_profile(mssv):
    student = SinhVien.query.get(mssv)
    if not student:
        return jsonify({"status": "error", "message": "Không tìm thấy sinh viên"}), 404

    ten_cn = "Chưa phân chuyên ngành"
    if student.macn:
        try:
            cn_obj = ChuyenNganh.query.get(student.macn)
            if cn_obj and cn_obj.tencn:
                ten_cn = cn_obj.tencn
        except Exception:
            pass

    ten_nganh = student.nganh.tennganh if (student.nganh and student.nganh.tennganh) else "Công nghệ thông tin"
    ten_khoa = student.nganh.khoa.tenkhoa if (student.nganh and student.nganh.khoa and student.nganh.khoa.tenkhoa) else "Khoa Công nghệ thông tin"

    data = {
        "mssv": student.mssv,
        "fullName": student.hoten or "",
        "hoten": student.hoten or "",
        "role": "Sinh viên",
        "status": student.loaisv or "Đang học",
        
        "dob": format_date(student.ngaysinh),
        "ngaysinh": format_date(student.ngaysinh),
        "placeOfBirth": student.noisinh or "",
        "noisinh": student.noisinh or "",
        "gender": student.gioitinh or "",
        "gioitinh": student.gioitinh or "",
        
        "course": student.nienkhoa or "K24",
        "nienkhoa": student.nienkhoa or "K24",
        "level": student.bacdaotao or "Đại học",
        "bacdaotao": student.bacdaotao or "Đại học",
        "trainingType": student.loaidaotao or "Chất lượng cao",
        "loaidaotao": student.loaidaotao or "Chất lượng cao",
        
        "major": ten_nganh,
        "nganh": ten_nganh,
        "faculty": ten_khoa,
        "khoa": ten_khoa,
        "specialization": ten_cn,
        "chuyenNganh": ten_cn,
        "macn": student.macn or "",
        
        "cccd": student.cccd or "",
        "issuedDate": format_date(student.ngaycap),
        "issuedPlace": student.noicap or "",
        "nationality": student.quoctich or "Việt Nam",
        "ethnic": student.dantoc or "Kinh",
        "religion": student.tongiao or "Không",
        
        "permanentAddress": student.dcthuongtru or "",
        "currentAddress": student.dchiennay or "",
        "contactAddress": student.dclienlac or "",
        
        "phone": student.dienthoai or "",
        "personalEmail": student.mailcanhan or "",
        "officialEmail": student.mailtruong or f"{student.mssv}@student.hcmus.edu.vn",
        
        "enrolledDate": "05/09/2024",
        "joinUnionDate": format_date(student.ngayvaodoan),
        "joinPartyDate": format_date(student.ngayvaodang),
        
        "advisor": student.nguoilienlac or "",
        "advisorPhone": student.sdtlienlac or "",
        "advisorEmail": student.maillienlac or "",
        "advisorRelation": student.quanhe_nll or "",
        
        "bankNumber": student.sothenh or "",
        "bank": student.tennh or "",
        "bankBranch": "Chi nhánh TP.HCM",
        
        "avatar": student.avatar or "",
        "canUpdate": check_update_eligibility(),
        
        "family": [
            {
                "id": nt.mant,
                "mant": nt.mant,
                "name": nt.hoten,
                "dob": str(nt.namsinh) if nt.namsinh else "",
                "rel": nt.quanhe or "",
                "job": nt.nghenghiep or "",
                "workplace": nt.noilamviec or "",
                "phone": nt.sdt or "",
                "email": nt.mail or "",
                "ethnic": nt.dantoc or "Kinh",
                "religion": nt.tongiao or "Không",
                "nationality": nt.quoctich or "Việt Nam",
                "province": nt.tinhthanh or "",
                "ward": nt.phuongxa or "",
                "address": nt.hkthuongtru or "",
            }
            for nt in (student.nguoithan_list if hasattr(student, 'nguoithan_list') else [])
        ]
    }
    return jsonify(data), 200

@student_bp.route('/<mssv>/update', methods=['PUT'])
def update_profile(mssv):
    if not check_update_eligibility():
        return jsonify({'error': 'Thời gian cập nhật hồ sơ đã kết thúc'}), 403

    student = SinhVien.query.get(mssv)
    if not student:
        return jsonify({'error': 'Không tìm thấy hồ sơ sinh viên'}), 404

    data = request.json or {}
    if 'currentAddress' in data: student.dchiennay = data['currentAddress']
    if 'phone' in data: student.dienthoai = data['phone']
    if 'personalEmail' in data: student.mailcanhan = data['personalEmail']

    db.session.commit()
    return jsonify({'message': 'Cập nhật thông tin thành công'}), 200

@student_bp.route('/<mssv>/family/<mant>', methods=['PUT'])
def update_family(mssv, mant):
    if not check_update_eligibility():
        return jsonify({'error': 'Thời gian cập nhật hồ sơ đã kết thúc'}), 403

    nt = NguoiThan.query.filter_by(mssv=mssv, mant=mant).first()
    if not nt:
        return jsonify({'error': 'Không tìm thấy dữ liệu người thân'}), 404

    data = request.json or {}
    if 'phone' in data: nt.sdt = data['phone']
    if 'email' in data: nt.mail = data['email']
    if 'job' in data: nt.nghenghiep = data['job']
    if 'workplace' in data: nt.noilamviec = data['workplace']
    if 'address' in data: nt.hkthuongtru = data['address']
    if 'province' in data: nt.tinhthanh = data['province']
    if 'ward' in data: nt.phuongxa = data['ward']

    db.session.commit()
    return jsonify({'message': 'Cập nhật thành công'}), 200


# =============================================================================
# 3. TUITION ROUTES (HỌC PHÍ)
# =============================================================================

@student_bp.route('/<mssv>/tuition', methods=['GET'])
def get_tuition(mssv):
    danh_sach_hoc_phi = HocPhi.query.filter_by(mssv=mssv).all()
    result = []
    for hp in danh_sach_hoc_phi:
        lhp = hp.lophocphan
        mh = lhp.monhoc if lhp else None
        hk = lhp.hocky_namhoc if lhp else None
        
        result.append({
            "maLhp": hp.malhp,
            "maMh": lhp.mamh if lhp else "—",
            "tenMon": mh.tenmh if mh and mh.tenmh else (lhp.tenlop if lhp and lhp.tenlop else "—"),
            "namHoc": hk.namhoc if hk and hk.namhoc else "—",
            "tenHocKy": hk.ten_hocky if hk and hk.ten_hocky else "—",
            "nhhk": f"{hk.namhoc} / {hk.ten_hocky}" if hk and hk.namhoc and hk.ten_hocky else "—",
            "soTc": float(mh.sotc) if mh and mh.sotc is not None else 0.0,
            "soTiet": int(mh.sotiet) if mh and mh.sotiet is not None else 0,
            "soTcHocPhi": float(hp.sotchp) if hp and hp.sotchp is not None else 0.0,
            "hocPhiGoc": float(hp.hocphi_goc) if hp and hp.hocphi_goc is not None else 0.0,
            "mucGiam": float(hp.mucgiam) if hp and hp.mucgiam is not None else 0.0,
            "hoTro": float(hp.hotro) if hp and hp.hotro is not None else 0.0,
            "thucDong": float(hp.thucdong) if hp and hp.thucdong is not None else 0.0,
            "chiPhiKhac": float(hp.chiphikhac) if hp and hp.chiphikhac is not None else 0.0,
            "ghiChu": hp.ghichu if hp and hp.ghichu else "—",
            "trangThaiThanhToan": hp.trangthai_thanhtoan,
            "ngayThanhToan": hp.ngaythanhtoan.strftime('%d/%m/%Y') if hp and hp.ngaythanhtoan else None
        })

    return jsonify({"status": "success", "data": result}), 200

@student_bp.route('/<mssv>/tuition/<malhp>/pay', methods=['POST'])
def pay_tuition(mssv, malhp):
    hocphi = db.session.query(HocPhi).filter_by(mssv=mssv, malhp=malhp).first()
    if not hocphi:
        return jsonify({'status': 'error', 'message': 'Không tìm thấy thông tin học phí'}), 404
        
    if str(hocphi.trangthai_thanhtoan) in ['1', 'Đã thanh toán']:
        return jsonify({'status': 'error', 'message': 'Học phí này đã được thanh toán'}), 400
    
    hocphi.trangthai_thanhtoan = 1
    hocphi.ngaythanhtoan = datetime.utcnow()
    db.session.commit()
    
    return jsonify({
        'status': 'success', 
        'message': 'Thanh toán học phí thành công',
        'data': {
            'malhp': hocphi.malhp,
            'trangthai_thanhtoan': hocphi.trangthai_thanhtoan,
            'ngaythanhtoan': hocphi.ngaythanhtoan.strftime('%d/%m/%Y %H:%M')
        }
    }), 200


# =============================================================================
# 4. NOTIFICATIONS ROUTES (THÔNG BÁO)
# =============================================================================

@student_bp.route('/<mssv>/notifications', methods=['GET'])
def get_notifications(mssv):
    notifications = db.session.query(SvThongBao, ThongBao).join(
        ThongBao, SvThongBao.matb == ThongBao.matb
    ).filter(SvThongBao.mssv == mssv).order_by(ThongBao.ngaydang.desc()).all()

    result = []
    for sv_tb, tb in notifications:
        donvi = getattr(tb.khoa, 'tenkhoa', None) if hasattr(tb, 'khoa') and tb.khoa else None
        if not donvi:
            tieude_lower = tb.tieude.lower() if tb.tieude else ""
            if any(k in tieude_lower for k in ["học phần", "lịch thi", "đào tạo"]):
                donvi = "Phòng Đào tạo"
            elif any(k in tieude_lower for k in ["học bổng", "công tác sv"]):
                donvi = "Phòng Công tác SV"
            else:
                donvi = "Khoa CNTT"

        khoa = donvi if "phòng" not in donvi.lower() else None
        phong = donvi if "phòng" in donvi.lower() else None

        result.append({
            'maTb': tb.matb,
            'tieuDe': tb.tieude,
            'noiDung': tb.noidung,
            'ngayDang': tb.ngaydang.strftime('%d/%m/%Y %H:%M') if tb.ngaydang else None,
            'trangThaiDoc': sv_tb.trangthai_doc,
            'thoiGianDoc': sv_tb.thoigian_doc.strftime('%d/%m/%Y %H:%M') if sv_tb.thoigian_doc else None,
            'khoa': khoa,
            'phong': phong
        })
    return jsonify({'status': 'success', 'data': result}), 200

@student_bp.route('/<mssv>/notifications/<matb>/read', methods=['POST'])
def mark_notification_read(mssv, matb):
    sv_tb = db.session.query(SvThongBao).filter_by(mssv=mssv, matb=matb).first()
    if not sv_tb:
        return jsonify({'status': 'error', 'message': 'Không tìm thấy thông báo'}), 404
    
    sv_tb.trangthai_doc = 1
    sv_tb.thoigian_doc = datetime.utcnow()
    db.session.commit()
    return jsonify({'status': 'success', 'message': 'Đã đánh dấu đọc'}), 200

@student_bp.route('/<mssv>/notifications/read-all', methods=['POST'])
def mark_all_notifications_read(mssv):
    unread = db.session.query(SvThongBao).filter_by(mssv=mssv, trangthai_doc=0).all()
    if unread:
        now = datetime.utcnow()
        for sv_tb in unread:
            sv_tb.trangthai_doc = 1
            sv_tb.thoigian_doc = now
        db.session.commit()
    return jsonify({'status': 'success', 'message': 'Đã đánh dấu đọc tất cả'}), 200


# =============================================================================
# 5. SURVEYS ROUTES (KHẢO SÁT)
# =============================================================================

@student_bp.route('/<mssv>/surveys', methods=['GET'])
def get_surveys(mssv):
    from app.models.survey import SvKhaoSat, KhaoSat, CauHoiKhaoSat, TraLoiKhaoSat
    
    # Bảng quy đổi chữ cái sang thang điểm 1 - 5
    LETTER_TO_RATING = {
        'A': 5, 'B': 4, 'C': 3, 'D': 2, 'E': 1,
        'a': 5, 'b': 4, 'c': 3, 'd': 2, 'e': 1
    }

    # 1. Lấy tất cả khảo sát có trong hệ thống
    all_surveys = KhaoSat.query.all()

    result = []
    for ks in all_surveys:
        sv_ks = SvKhaoSat.query.filter_by(mssv=mssv, maks=ks.maks).first()
        is_done = sv_ks is not None and str(sv_ks.trangthai_lam) in ['1', 'Hoàn thành', 'Đã hoàn thành']
        
        questions = CauHoiKhaoSat.query.filter_by(maks=ks.maks).order_by(CauHoiKhaoSat.thutu).all()
        courses_list = []
        
        for q in questions:
            is_essay = "tự luận" in (q.loai_cauhoi or "").lower()
            
            course_info = {
                "id": q.mach,
                "code": q.loai_cauhoi or "Trắc nghiệm",
                "type": q.loai_cauhoi or "Trắc nghiệm",
                "name": q.noidung_cauhoi,
                "rating": None,
                "comment": ""
            }
            
            if is_done:
                traloi = TraLoiKhaoSat.query.filter_by(mach=q.mach, mssv=mssv).first()
                if traloi and traloi.noidung_traloi:
                    raw_text = traloi.noidung_traloi.strip()
                    
                    if is_essay:
                        # Câu hỏi tự luận: toàn bộ text là nội dung trả lời
                        course_info["comment"] = raw_text
                    else:
                        # Câu hỏi trắc nghiệm: kiểm tra các dạng lưu trữ
                        # Dạng 1: "Rating: 5. Comment: ..."
                        match = re.search(r"Rating:\s*(\d+)(?:\.\s*Comment:\s*(.*))?", raw_text, re.IGNORECASE | re.DOTALL)
                        if match:
                            course_info["rating"] = int(match.group(1))
                            course_info["comment"] = (match.group(2) or "").strip()
                        # Dạng 2: Chữ cái A, B, C, D, E (từ CSDL seed)
                        elif raw_text in LETTER_TO_RATING:
                            course_info["rating"] = LETTER_TO_RATING[raw_text]
                            course_info["comment"] = ""  # Xóa ký tự A khỏi ô góp ý
                        # Dạng 3: Số đơn lẻ "1", "2", "3", "4", "5"
                        elif raw_text.isdigit() and 1 <= int(raw_text) <= 5:
                            course_info["rating"] = int(raw_text)
                            course_info["comment"] = ""
                        else:
                            course_info["comment"] = raw_text
                            
            courses_list.append(course_info)
        
        deadline_str = format_date(ks.handon) if ks.handon else "2026-09-05"
        result.append({
            "id": ks.maks,
            "title": ks.tenks,
            "description": ks.noidung or "",
            "deadline": deadline_str,
            "status": "completed" if is_done else "pending",
            "courses": courses_list
        })

    return jsonify({"status": "success", "data": result}), 200

@student_bp.route('/<mssv>/surveys/<maks>/submit', methods=['POST'])
def submit_survey(mssv, maks):
    from app.models.survey import SvKhaoSat, TraLoiKhaoSat
    data = request.get_json() or {}
    responses = data.get('responses', {})

    for mach, res in responses.items():
        rating = res.get('rating')
        comment = (res.get('comment') or "").strip()

        if rating is not None and comment:
            noidung = f"Rating: {rating}. Comment: {comment}"
        elif rating is not None:
            noidung = f"Rating: {rating}"
        else:
            noidung = comment

        traloi = TraLoiKhaoSat.query.filter_by(mach=mach, mssv=mssv).first()
        if traloi:
            traloi.noidung_traloi = noidung
            traloi.thoigian_traloi = datetime.utcnow()
        else:
            db.session.add(TraLoiKhaoSat(mach=mach, mssv=mssv, noidung_traloi=noidung, thoigian_traloi=datetime.utcnow()))

    sv_ks = SvKhaoSat.query.filter_by(mssv=mssv, maks=maks).first()
    if sv_ks:
        sv_ks.trangthai_lam = '1'
        sv_ks.thoigian_nop = datetime.utcnow()
    else:
        db.session.add(SvKhaoSat(mssv=mssv, maks=maks, trangthai_lam='1', thoigian_nop=datetime.utcnow()))

    db.session.commit()
    return jsonify({"status": "success", "message": "Nộp khảo sát thành công"}), 200

# =============================================================================
# 6. ACADEMIC & PROGRESS ROUTES (HỌC TẬP & TIẾN ĐỘ ĐÀO TẠO)
# =============================================================================

@student_bp.route('/<mssv>/academic/summary', methods=['GET'])
@student_bp.route('/academic/summary', methods=['GET'])
def get_academic_summary(mssv=None):
    mssv_query = mssv or request.args.get('mssv', default='', type=str)
    ma_hocky = request.args.get('ma_hocky', default=None, type=str)
    data = AcademicService.get_summary_grades(mssv_query, ma_hocky)
    return jsonify({"status": "success", "data": data}), 200

@student_bp.route('/<mssv>/academic/progress', methods=['GET'])
def get_academic_progress(mssv):
    sv = SinhVien.query.filter_by(mssv=mssv).first()
    if not sv:
        return jsonify({"status": "error", "message": "Không tìm thấy sinh viên"}), 404

    # 1. Lấy thông tin chung tiến độ
    td = TienDoHocTap.query.filter_by(mssv=mssv).first()
    
    # 2. Lấy danh sách nhóm học phần từ CSDL
    nhom_list = []
    nhoms = db.session.query(NhomHocPhan, TienDoNhomHocPhan).\
        outerjoin(TienDoNhomHocPhan, (NhomHocPhan.manhom == TienDoNhomHocPhan.manhom) & (TienDoNhomHocPhan.mssv == mssv)).all()
    
    for nhom, tiendo in nhoms:
        nhom_list.append({
            "code": nhom.manhom,
            "name": nhom.tennhom,
            "done": tiendo.tc_dat if tiendo else 0,
            "req": tiendo.tc_yeucau if tiendo else 0
        })

    # 3. Lấy kết quả môn học chi tiết theo nhóm (SỬA LỖI JOIN MODEL HocKyNamHoc)
    courses = db.session.query(
        KetQuaHocTap, LopHocPhan, MonHoc, HocKyNamHoc
    ).join(LopHocPhan, KetQuaHocTap.malhp == LopHocPhan.malhp)\
     .join(MonHoc, LopHocPhan.mamh == MonHoc.mamh)\
     .join(HocKyNamHoc, LopHocPhan.ma_hocky == HocKyNamHoc.ma_hocky)\
     .filter(KetQuaHocTap.mssv == mssv).all()

    courses_by_group = {}
    current_courses = []
    total_passed_tc = 0
    total_points = 0.0
    total_gpa_tc = 0

    for kq, lhp, mh, hk in courses:
        group_code = mh.manhom if (hasattr(mh, 'manhom') and mh.manhom) else "TN_BB"
        if group_code not in courses_by_group:
            courses_by_group[group_code] = []
        
        diem10 = kq.diemtb_he10
        sotc = mh.sotc or 0
        
        if diem10 is not None:
            if diem10 >= 5.0:
                total_passed_tc += sotc
            total_points += (diem10 * sotc)
            total_gpa_tc += sotc

        c_data = {
            "maMon": mh.mamh,
            "tenMon": mh.tenmh,
            "soTC": sotc,
            "namHoc": hk.namhoc if hk else "2024-2025",
            "hocKy": hk.ten_hocky if hk else "HK1",
            "diemGK": kq.diemgk,
            "diemCK": kq.diemck,
            "diem10": diem10
        }
        courses_by_group[group_code].append(c_data)
        current_courses.append(c_data)

    calculated_gpa = round(total_points / total_gpa_tc, 2) if total_gpa_tc > 0 else 0.0

    general_info = {
        "mssv": sv.mssv,
        "fullName": sv.hoten,
        "gddc": f"{td.tc_gddc_dat if td and td.tc_gddc_dat is not None else 40}/{td.tc_gddc_yc if td and td.tc_gddc_yc is not None else 56}",
        "csn": f"{td.tc_csn_dat if td and td.tc_csn_dat is not None else 30}/{td.tc_csn_yc if td and td.tc_csn_yc is not None else 38}",
        "tot_nghiep": f"{td.tc_tn_dat if td and td.tc_tn_dat is not None else 0}/{td.tc_tn_yc if td and td.tc_tn_yc is not None else 10}",
        "chuyen_nganh": f"{td.tc_cn_dat if td and td.tc_cn_dat is not None else 3}/{td.tc_cn_yc if td and td.tc_cn_yc is not None else 34}",
        "gdtc": td.trangthai_gdtc if (td and td.trangthai_gdtc) else "Chưa cập nhật",
        "gdqp": td.trangthai_gdqp if (td and td.trangthai_gdqp) else "Chưa cập nhật",
        "tdnn": td.trangthai_tdnn if (td and td.trangthai_tdnn) else "Chưa cập nhật",
        "tong_tc_dat": td.tong_tc_dat if (td and td.tong_tc_dat) else total_passed_tc,
        "tong_tc_yc": td.tong_tc_yc if (td and td.tong_tc_yc) else 138,
        "diem_tb_tichluy": td.diem_tb_tichluy if (td and td.diem_tb_tichluy) else calculated_gpa,
        "dudieukientn": td.dudieukientn if (td and td.dudieukientn) else ("Đạt" if (td and td.tong_tc_dat and td.tong_tc_dat >= 138) else "Chưa")
    }

    # 4. Chỉ số định hướng chuyên ngành (Radar)
    radar_data = [
        {"label": ["Trí tuệ nhân tạo", "& KH Dữ liệu"], "fullName": "Trí tuệ nhân tạo & Khoa học dữ liệu", "score": 7.6, "fullMark": 10, "specs": ["Khoa học máy tính", "Công nghệ tri thức", "Thị giác máy tính", "Khoa học dữ liệu"]},
        {"label": ["Hệ thống & Mạng"], "fullName": "Hệ thống & Mạng", "score": 6.7, "fullMark": 10, "specs": ["Mạng máy tính và Viễn thông", "(hướng An toàn thông tin)"]},
        {"label": ["Phân tích &", "PT Phần mềm"], "fullName": "Phân tích & Phát triển Phần mềm", "score": 8.0, "fullMark": 10, "specs": ["Công nghệ phần mềm", "Hệ thống thông tin"]},
        {"label": ["Tổng quan", "& Ứng dụng rộng"], "fullName": "Tổng quan & Ứng dụng rộng", "score": 7.3, "fullMark": 10, "specs": ["Công nghệ thông tin"]}
    ]

    return jsonify({
        "status": "success",
        "data": {
            "completed_credits": general_info["tong_tc_dat"],
            "total_credits": general_info["tong_tc_yc"],
            "gpa": general_info["diem_tb_tichluy"],
            "conditions": {
                "gdtc": general_info["gdtc"] in ["Đạt", "✓ Đã đạt", "✓ Đã hoàn thành"],
                "gdqp": general_info["gdqp"] in ["Đạt", "✓ Đã đạt", "✓ Đã hoàn thành"],
                "foreign_language": general_info["tdnn"] in ["Đạt", "✓ Đã đạt", "✓ Đã hoàn thành"]
            },
            "general_info": general_info,
            "credit_groups": nhom_list,
            "radar_data": radar_data,
            "courses_by_group": courses_by_group,
            "current_courses": current_courses
        }
    }), 200

@student_bp.route('/<mssv>/academic/predictor-courses', methods=['GET'])
@student_bp.route('/academic/predictor-courses', methods=['GET'])
def get_predictor_courses(mssv=None):
    mssv_query = mssv or request.args.get('mssv', default='', type=str)
    ma_hocky = request.args.get('ma_hocky', default=None, type=str)
    data = AcademicService.get_predictor_courses(mssv_query, ma_hocky)
    return jsonify({"status": "success", "data": data}), 200