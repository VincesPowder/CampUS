from flask import Blueprint, jsonify, request, send_file
import re
from app.models.student import SinhVien, DotCapNhatHoSo, NguoiThan, ChuyenNganh, Nganh, Khoa
from app.models.academic import TienDoHocTap, TienDoNhomHocPhan, NhomHocPhan, KetQuaHocTap
from app.models.tuition import HocPhi, LopHocPhan
from app.models.notification import SvThongBao, ThongBao
from app.services.schedule_service import ScheduleService
from app.services.academic_service import AcademicService
from app import db
from datetime import datetime

student_bp = Blueprint('student', __name__)

@student_bp.route('/schedule/filters', methods=['GET'])
def get_filters():
    mssv = request.args.get('mssv', default='', type=str)
    filters = ScheduleService.get_filter_options(mssv)
    return jsonify({"status": "success", "data": filters}), 200

@student_bp.route('/schedule/weekly', methods=['GET'])
def get_weekly_schedule():
    mssv = request.args.get('mssv', default='', type=str)
    ma_hocky = request.args.get('ma_hocky', default='HK1', type=str)
    week_number = request.args.get('week', default=1, type=int)

    data = ScheduleService.get_weekly_schedule(mssv, ma_hocky, week_number)
    return jsonify({"status": "success", "data": data}), 200

@student_bp.route('/schedule/exams', methods=['GET'])
def get_exam_schedule():
    mssv = request.args.get('mssv', default='', type=str)
    ma_hocky = request.args.get('ma_hocky', default='HK1', type=str)

    data = ScheduleService.get_exam_schedule(mssv, ma_hocky)
    return jsonify({"status": "success", "data": data}), 200

@student_bp.route('/schedule/weekly/export', methods=['GET'])
def export_weekly_excel():
    mssv = request.args.get('mssv', default='', type=str)
    ma_hocky = request.args.get('ma_hocky', default='HK1', type=str)
    week_number = request.args.get('week', default=1, type=int)

    excel_file = ScheduleService.export_weekly_schedule_excel(mssv, ma_hocky, week_number)
    return send_file(
        excel_file,
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        as_attachment=True,
        download_name=f"TKB_Tuan_{week_number}.xlsx"
    )

@student_bp.route('/schedule/exams/export', methods=['GET'])
def export_exams_excel():
    mssv = request.args.get('mssv', default='', type=str)
    ma_hocky = request.args.get('ma_hocky', default='HK1', type=str)

    excel_file = ScheduleService.export_exam_schedule_excel(mssv, ma_hocky)
    return send_file(
        excel_file,
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        as_attachment=True,
        download_name="Lich_Thi.xlsx"
    )

def format_date(date_val):
    """Hàm helper để định dạng ngày an toàn, chống sập server khi SQLite trả về chuỗi"""
    if not date_val:
        return None
    if hasattr(date_val, 'strftime'):
        return date_val.strftime('%Y-%m-%d')
    return str(date_val)

def check_update_eligibility():
    """Kiểm tra xem hệ thống có đang mở đợt cập nhật hồ sơ không"""
    now = datetime.now()
    active_period = DotCapNhatHoSo.query.filter(
        DotCapNhatHoSo.trangthai_mo == 1,
        DotCapNhatHoSo.thoigian_batdau <= now,
        DotCapNhatHoSo.thoigian_ketthuc >= now
    ).first()
    return active_period is not None

@student_bp.route('/<mssv>', methods=['GET'])
def get_profile(mssv):
    student = SinhVien.query.get(mssv)
    if not student:
        return jsonify({"status": "error", "message": "Không tìm thấy sinh viên"}), 404

    # 1. Tra cứu Chuyên ngành an toàn qua mã MACN (không dùng student.chuyennganh)
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

    # 2. Định dạng dữ liệu trả về (hỗ trợ cả camelCase và snake_case cho Frontend)
    data = {
        # Thông tin cơ bản
        "mssv": student.mssv,
        "fullName": student.hoten or "",
        "hoten": student.hoten or "",
        "role": "Sinh viên",
        "status": "Đang học",
        
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
        "trainingType": student.loaidaotao or (student.loaisv or "Chất lượng cao"),
        "loaidaotao": student.loaidaotao or (student.loaisv or "Chất lượng cao"),
        
        # Ngành & Chuyên ngành
        "major": ten_nganh,
        "nganh": ten_nganh,
        "tennganh": ten_nganh,
        "faculty": ten_khoa,
        "khoa": ten_khoa,
        "tenkhoa": ten_khoa,
        
        "specialization": ten_cn,
        "chuyenNganh": ten_cn,
        "chuyennganh": ten_cn,
        "tenchuyennganh": ten_cn,
        "macn": student.macn or "",
        
        # Định danh & Liên hệ
        "cccd": student.cccd or "",
        "issuedDate": format_date(student.ngaycap),
        "ngaycap": format_date(student.ngaycap),
        "issuedPlace": student.noicap or "",
        "noicap": student.noicap or "",
        "nationality": student.quoctich or "Việt Nam",
        "quoctich": student.quoctich or "Việt Nam",
        "ethnic": student.dantoc or "Kinh",
        "dantoc": student.dantoc or "Kinh",
        "religion": student.tongiao or "Không",
        "tongiao": student.tongiao or "Không",
        
        "permanentAddress": student.dcthuongtru or "",
        "dcthuongtru": student.dcthuongtru or "",
        "currentAddress": student.dchiennay or "",
        "dchiennay": student.dchiennay or "",
        "contactAddress": student.dclienlac or "",
        "dclienlac": student.dclienlac or "",
        
        "phone": student.dienthoai or "",
        "dienthoai": student.dienthoai or "",
        "personalEmail": student.mailcanhan or "",
        "mailcanhan": student.mailcanhan or "",
        "officialEmail": student.mailtruong or f"{student.mssv}@student.hcmus.edu.vn",
        "mailtruong": student.mailtruong or f"{student.mssv}@student.hcmus.edu.vn",
        
        "enrolledDate": "05/09/2024",
        "joinUnionDate": format_date(student.ngayvaodoan),
        "ngayvaodoan": format_date(student.ngayvaodoan),
        "joinPartyDate": format_date(student.ngayvaodang),
        "ngayvaodang": format_date(student.ngayvaodang),
        
        # Người liên lạc khẩn cấp
        "advisor": student.nguoilienlac or "",
        "nguoilienlac": student.nguoilienlac or "",
        "advisorPhone": student.sdtlienlac or "",
        "sdtlienlac": student.sdtlienlac or "",
        "advisorEmail": student.maillienlac or "",
        "maillienlac": student.maillienlac or "",
        "advisorRelation": student.quanhe_nll or "",
        "quanhe_nll": student.quanhe_nll or "",
        
        # Ngân hàng
        "bankNumber": student.sothenh or "",
        "sothenh": student.sothenh or "",
        "bank": student.tennh or "",
        "tennh": student.tennh or "",
        "bankBranch": "Chi nhánh TP.HCM",
        
        "avatar": student.avatar or "",
        "canUpdate": check_update_eligibility(),
        
        # Danh sách người thân
        "family": [
            {
                "id": nt.mant,
                "mant": nt.mant,
                "name": nt.hoten,
                "hoten": nt.hoten,
                "dob": str(nt.namsinh) if nt.namsinh else "",
                "namsinh": nt.namsinh,
                "rel": nt.quanhe or "",
                "quanhe": nt.quanhe or "",
                "job": nt.nghenghiep or "",
                "nghenghiep": nt.nghenghiep or "",
                "workplace": nt.noilamviec or "",
                "noilamviec": nt.noilamviec or "",
                "phone": nt.sdt or "",
                "sdt": nt.sdt or "",
                "email": nt.mail or "",
                "mail": nt.mail or "",
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
    """UC 2.6: Cập nhật thông tin hồ sơ cá nhân"""
    if not check_update_eligibility():
        return jsonify({'error': 'Thời gian cập nhật hồ sơ đã kết thúc'}), 403

    student = SinhVien.query.get(mssv)
    if not student:
        return jsonify({'error': 'Không tìm thấy hồ sơ sinh viên'}), 404

    data = request.json
    
    if 'currentAddress' in data:
        student.dchiennay = data['currentAddress']
    if 'phone' in data:
        student.dienthoai = data['phone']
    if 'personalEmail' in data:
        student.mailcanhan = data['personalEmail']

    db.session.commit()
    return jsonify({'message': 'Cập nhật thông tin thành công'}), 200

@student_bp.route('/<mssv>/family/<mant>', methods=['PUT'])
def update_family(mssv, mant):
    """Cập nhật thông tin liên lạc của người thân"""
    if not check_update_eligibility():
        return jsonify({'error': 'Thời gian cập nhật hồ sơ đã kết thúc'}), 403

    nt = NguoiThan.query.filter_by(mssv=mssv, mant=mant).first()
    if not nt:
        return jsonify({'error': 'Không tìm thấy dữ liệu người thân'}), 404

    data = request.json
    
    if 'phone' in data: nt.sdt = data['phone']
    if 'email' in data: nt.mail = data['email']
    if 'job' in data: nt.nghenghiep = data['job']
    if 'workplace' in data: nt.noilamviec = data['workplace']
    if 'address' in data: nt.hkthuongtru = data['address']
    if 'province' in data: nt.tinhthanh = data['province']
    if 'ward' in data: nt.phuongxa = data['ward']

    db.session.commit()
    return jsonify({'message': 'Cập nhật thành công'}), 200

@student_bp.route('/<mssv>/tuition', methods=['GET'])
def get_tuition(mssv):
    # Lấy toàn bộ học phí của sinh viên
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
            
            # Kiểm tra chặt chẽ is not None cho tất cả các trường số
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

@student_bp.route('/<mssv>/notifications', methods=['GET'])
def get_notifications(mssv):
    """Lấy danh sách thông báo của sinh viên"""
    notifications = db.session.query(SvThongBao, ThongBao).join(
        ThongBao, SvThongBao.matb == ThongBao.matb
    ).filter(SvThongBao.mssv == mssv).order_by(ThongBao.ngaydang.desc()).all()

    result = []
    for sv_tb, tb in notifications:
        # Bóc tách Khoa / Phòng từ bảng THONGBAO 
        donvi = getattr(tb.khoa, 'tenkhoa', None) if hasattr(tb, 'khoa') and tb.khoa else None
        
        # Fallback tự động nhận diện nếu dữ liệu `MAKHOA` trong DB đang null
        if not donvi:
            tieude_lower = tb.tieude.lower() if tb.tieude else ""
            if "học phần" in tieude_lower or "lịch thi" in tieude_lower or "đào tạo" in tieude_lower:
                donvi = "Phòng Đào tạo"
            elif "học bổng" in tieude_lower or "công tác sv" in tieude_lower:
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
    """Đánh dấu một thông báo cụ thể là đã đọc"""
    sv_tb = db.session.query(SvThongBao).filter_by(mssv=mssv, matb=matb).first()
    
    if not sv_tb:
        return jsonify({'status': 'error', 'message': 'Không tìm thấy thông báo'}), 404
    
    sv_tb.trangthai_doc = 1
    sv_tb.thoigian_doc = datetime.utcnow()
    
    db.session.commit()
    
    return jsonify({
        'status': 'success', 
        'message': 'Đã cập nhật trạng thái đọc',
        'thoigian_doc': sv_tb.thoigian_doc.strftime('%d/%m/%Y %H:%M')
    }), 200


@student_bp.route('/<mssv>/notifications/read-all', methods=['POST'])
def mark_all_notifications_read(mssv):
    """Đánh dấu tất cả thông báo của sinh viên là đã đọc"""
    unread_notifications = db.session.query(SvThongBao).filter_by(mssv=mssv, trangthai_doc=0).all()
    
    if not unread_notifications:
        return jsonify({'status': 'success', 'message': 'Không có thông báo nào chưa đọc'}), 200

    now = datetime.utcnow()
    for sv_tb in unread_notifications:
        sv_tb.trangthai_doc = 1
        sv_tb.thoigian_doc = now
        
    db.session.commit()
    
    return jsonify({'status': 'success', 'message': 'Đã đánh dấu đọc tất cả thông báo'}), 200


# ---------------------------------------------------------
# API KHẢO SÁT
# ---------------------------------------------------------

@student_bp.route('/<mssv>/surveys', methods=['GET'])
def get_surveys(mssv):
    """Lấy danh sách khảo sát của sinh viên"""
    from app.models.survey import SvKhaoSat, KhaoSat, CauHoiKhaoSat, TraLoiKhaoSat
    sv_surveys = db.session.query(SvKhaoSat, KhaoSat).join(
        KhaoSat, SvKhaoSat.maks == KhaoSat.maks
    ).filter(SvKhaoSat.mssv == mssv).all()

    # Nếu chưa có khảo sát nào được gán cho sinh viên này, gán tự động
    if not sv_surveys:
        surveys = KhaoSat.query.all()
        for ks in surveys:
            # Kiểm tra xem đã tồn tại chưa để tránh lỗi trùng lặp khóa chính
            exists = SvKhaoSat.query.filter_by(mssv=mssv, maks=ks.maks).first()
            if not exists:
                sv_ks = SvKhaoSat(mssv=mssv, maks=ks.maks, trangthai_lam='0')
                db.session.add(sv_ks)
        db.session.commit()
        # Query lại sau khi gán
        sv_surveys = db.session.query(SvKhaoSat, KhaoSat).join(
            KhaoSat, SvKhaoSat.maks == KhaoSat.maks
        ).filter(SvKhaoSat.mssv == mssv).all()

    result = []
    for sv_ks, ks in sv_surveys:
        # Nhận diện trạng thái đã hoàn thành hay chưa
        is_done = sv_ks.trangthai_lam in ['1', 'Hoàn thành', 'Đã hoàn thành']
        status = "completed" if is_done else "pending"

        # Lấy danh sách câu hỏi của khảo sát này
        questions = CauHoiKhaoSat.query.filter_by(maks=ks.maks).order_by(CauHoiKhaoSat.thutu).all()
        courses_list = []
        
        for q in questions:
            course_info = {
                "id": q.mach,
                "code": q.loai_cauhoi or "—",
                "name": q.noidung_cauhoi,
                "rating": None,
                "comment": ""
            }
            
            # Bóc tách dữ liệu từ TRALOI_KHAOSAT nếu sinh viên đã làm
            if is_done:
                traloi = TraLoiKhaoSat.query.filter_by(mach=q.mach, mssv=mssv).first()
                if traloi and traloi.noidung_traloi:
                    match = re.search(r"Rating:\s*(\d+)\.\s*Comment:\s*(.*)", traloi.noidung_traloi, re.IGNORECASE | re.DOTALL)
                    if match:
                        course_info["rating"] = int(match.group(1))
                        course_info["comment"] = match.group(2).strip()
                    else:
                        course_info["comment"] = traloi.noidung_traloi
            
            courses_list.append(course_info)
        
        # Chuyển đổi định dạng ngày tháng hạn nộp của khảo sát
        deadline_str = format_date(ks.handon) if ks.handon else "2026-08-15"
        if deadline_str and 'T' in deadline_str:
            # Định dạng lại chuỗi datetime ISO nếu có
            try:
                dt_parts = deadline_str.split('T')[0].split('-')
                deadline_str = f"{dt_parts[2]}/{dt_parts[1]}/{dt_parts[0]}"
            except Exception:
                pass
        
        result.append({
            "id": ks.maks,
            "title": ks.tenks,
            "description": ks.noidung or "",
            "deadline": deadline_str,
            "status": status,
            "courses": courses_list
        })

    return jsonify({"status": "success", "data": result}), 200

@student_bp.route('/<mssv>/surveys/<maks>/submit', methods=['POST'])
def submit_survey(mssv, maks):
    """Nộp câu trả lời khảo sát của sinh viên"""
    from app.models.survey import SvKhaoSat, TraLoiKhaoSat
    data = request.get_json() or {}
    responses = data.get('responses', {})

    for mach, res in responses.items():
        rating = res.get('rating')
        comment = res.get('comment') or ""
        # Định dạng câu trả lời lưu trong database
        noidung = f"Rating: {rating}. Comment: {comment}" if rating else comment

        # Cập nhật hoặc thêm mới câu trả lời
        traloi = TraLoiKhaoSat.query.filter_by(mach=mach, mssv=mssv).first()
        if traloi:
            traloi.noidung_traloi = noidung
            traloi.thoigian_traloi = datetime.utcnow()
        else:
            traloi = TraLoiKhaoSat(
                mach=mach,
                mssv=mssv,
                noidung_traloi=noidung,
                thoigian_traloi=datetime.utcnow()
            )
            db.session.add(traloi)

    # Cập nhật trạng thái làm khảo sát thành '1' (Hoàn thành)
    sv_ks = SvKhaoSat.query.filter_by(mssv=mssv, maks=maks).first()
    if sv_ks:
        sv_ks.trangthai_lam = '1'
        sv_ks.thoigian_nop = datetime.utcnow()
    else:
        sv_ks = SvKhaoSat(
            mssv=mssv,
            maks=maks,
            trangthai_lam='1',
            thoigian_nop=datetime.utcnow()
        )
        db.session.add(sv_ks)

    db.session.commit()
    return jsonify({"status": "success", "message": "Nộp khảo sát thành công"}), 200


# ---------------------------------------------------------
# API HỌC PHÍ
# ---------------------------------------------------------

@student_bp.route('/<mssv>/tuition/<malhp>/pay', methods=['POST'])
def pay_tuition(mssv, malhp):
    """Mô phỏng tính năng thanh toán học phí cho một lớp học phần"""
    hocphi = db.session.query(HocPhi).filter_by(mssv=mssv, malhp=malhp).first()
    
    if not hocphi:
        return jsonify({'status': 'error', 'message': 'Không tìm thấy thông tin học phí'}), 404
        
    if hocphi.trangthai_thanhtoan == 'Đã thanh toán':
        return jsonify({'status': 'error', 'message': 'Học phí này đã được thanh toán rồi'}), 400
    
    hocphi.trangthai_thanhtoan = 'Đã thanh toán'
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
    general_info = {
        "mssv": sv.mssv,
        "fullName": sv.hoten,
        "gddc": f"{td.tc_gddc_dat if td else 40}/{td.tc_gddc_yc if td else 56}",
        "csn": f"{td.tc_csn_dat if td else 30}/{td.tc_csn_yc if td else 38}",
        "tot_nghiep": f"{td.tc_tn_dat if td else 0}/{td.tc_tn_yc if td else 10}",
        "chuyen_nganh": f"{td.tc_cn_dat if td else 3}/{td.tc_cn_yc if td else 34}",
        "gdtc": td.trangthai_gdtc if td else "Chưa cập nhật",
        "gdqp": td.trangthai_gdqp if td else "Chưa cập nhật",
        "tdnn": td.trangthai_tdnn if td else "Chưa cập nhật",
        "tong_tc_dat": td.tong_tc_dat if td else 73,
        "tong_tc_yc": td.tong_tc_yc if td else 138,
        "diem_tb_tichluy": td.diem_tb_tichluy if td else 2.85,
        "dudieukientn": td.dudieukientn if td else "Chưa"
    }

    # 2. Lấy danh sách nhóm học phần
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

    # 3. Lấy kết quả môn học chi tiết theo nhóm
    courses = db.session.query(
        KetQuaHocTap, LopHocPhan, MonHoc, HocKy
    ).join(LopHocPhan, KetQuaHocTap.malhp == LopHocPhan.malhp)\
     .join(MonHoc, LopHocPhan.mamh == MonHoc.mamh)\
     .join(HocKy, LopHocPhan.mahocky == HocKy.mahocky)\
     .filter(KetQuaHocTap.mssv == mssv).all()

    # Nhóm môn học theo mã nhóm học phần (hoặc tiền tố môn học)
    courses_by_group = {}
    current_courses = []
    for kq, lhp, mh, hk in courses:
        group_code = mh.manhom if hasattr(mh, 'manhom') and mh.manhom else "TN_BB"
        if group_code not in courses_by_group:
            courses_by_group[group_code] = []
        
        c_data = {
            "maMon": mh.mamh,
            "tenMon": mh.tenmh,
            "soTC": mh.sotc,
            "namHoc": hk.namhoc if hasattr(hk, 'namhoc') else "2024-2025",
            "hocKy": hk.hocky if hasattr(hk, 'hocky') else 1,
            "diemGK": kq.diemgk,
            "diemCK": kq.diemck,
            "diem10": kq.diemtb_he10
        }
        courses_by_group[group_code].append(c_data)
        current_courses.append(c_data)

    # 4. Chỉ số radar định hướng chuyên ngành
    radar_data = [
        {"label": ["Trí tuệ nhân tạo", "& KH Dữ liệu"], "fullName": "Trí tuệ nhân tạo & Khoa học dữ liệu", "score": 7.6, "fullMark": 10, "specs": ["Khoa học máy tính", "Công nghệ tri thức", "Thị giác máy tính", "Khoa học dữ liệu"]},
        {"label": ["Hệ thống & Mạng"], "fullName": "Hệ thống & Mạng", "score": 6.7, "fullMark": 10, "specs": ["Mạng máy tính và Viễn thông", "(hướng An toàn thông tin)"]},
        {"label": ["Phân tích &", "PT Phần mềm"], "fullName": "Phân tích & Phát triển Phần mềm", "score": 8.0, "fullMark": 10, "specs": ["Công nghệ phần mềm", "Hệ thống thông tin"]},
        {"label": ["Tổng quan", "& Ứng dụng rộng"], "fullName": "Tổng quan & Ứng dụng rộng", "score": 7.3, "fullMark": 10, "specs": ["Công nghệ thông tin"]}
    ]

    return jsonify({
        "status": "success",
        "data": {
            "general_info": general_info,
            "credit_groups": nhom_list if nhom_list else [
                {"code": "LL_CT", "name": "Lý luận chính trị", "done": 10, "req": 10},
                {"code": "XH_TC", "name": "Khoa học xã hội", "done": 4, "req": 4},
                {"code": "TN_BB", "name": "Toán - Tin học - KHTN", "done": 20, "req": 26},
                {"code": "CN_CS", "name": "Cơ sở ngành", "done": 30, "req": 38},
                {"code": "CN_NG", "name": "Cơ sở nhánh ngành", "done": 3, "req": 10},
                {"code": "CN_TD", "name": "Chuyên ngành tự chọn", "done": 0, "req": 24},
                {"code": "TN_KL", "name": "Tốt nghiệp", "done": 0, "req": 10}
            ],
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