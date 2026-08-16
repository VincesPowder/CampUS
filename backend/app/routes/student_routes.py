from flask import Blueprint, jsonify, request, send_file
import re
from app.models.student import SinhVien, DotCapNhatHoSo, NguoiThan
from app.models.tuition import HocPhi, LopHocPhan
from app.models.notification import SvThongBao, ThongBao
from app.services.schedule_service import ScheduleService
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
    """UC 2.5: Lấy thông vị cá nhân và học vụ"""
    student = SinhVien.query.get(mssv)
    if not student:
        return jsonify({'error': 'Không tìm thấy hồ sơ sinh viên'}), 404
    
    can_update = check_update_eligibility()
    faculty_name = student.nganh.khoa.tenkhoa if student.nganh and student.nganh.khoa else None
    major_name = student.nganh.tennganh if student.nganh else None
    
    family_data = []
    for nt in student.nguoithan_list:
        family_data.append({
            'id': nt.mant,
            'name': nt.hoten,
            'dob': str(nt.namsinh) if nt.namsinh else "—",
            'rel': nt.quanhe,
            'job': nt.nghenghiep,
            'workplace': nt.noilamviec,
            'phone': nt.sdt,
            'email': nt.mail,
            'ethnic': nt.dantoc,
            'religion': nt.tongiao,
            'nationality': nt.quoctich,
            'province': nt.tinhthanh,
            'ward': nt.phuongxa,
            'address': nt.hkthuongtru
        })
        
    profile_data = {
        'mssv': student.mssv,
        'fullName': student.hoten,
        'dob': format_date(student.ngaysinh),
        'placeOfBirth': student.noisinh,
        'gender': student.gioitinh,
        'cccd': student.cccd,
        'issuedDate': format_date(student.ngaycap),
        'issuedPlace': student.noicap,
        'nationality': student.quoctich,
        'ethnic': student.dantoc,
        'religion': student.tongiao,
        'permanentAddress': student.dcthuongtru,
        'currentAddress': student.dchiennay,
        
        # --- CÁC TRƯỜNG ĐÃ ĐƯỢC MAP KHỚP VỚI FRONTEND ---
        'contactAddress': student.dclienlac,
        'phone': student.dienthoai,
        'personalEmail': student.mailcanhan,
        'officialEmail': student.mailtruong,
        'joinUnionDate': format_date(student.ngayvaodoan),
        'joinPartyDate': format_date(student.ngayvaodang),
        
        'advisor': student.nguoilienlac,
        'advisorPhone': student.sdtlienlac,
        'advisorEmail': student.maillienlac,
        'advisorRelation': student.quanhe_nll,
        
        'bankNumber': student.sothenh,
        'bank': student.tennh,
        'bankBranch': None, # DB ko có chi nhánh nên trả về None để UI làm mờ
        'enrolledDate': None,
        # ------------------------------------------------
        
        'course': student.nienkhoa,
        'level': student.bacdaotao,
        'trainingType': student.loaidaotao,
        'major': major_name,
        'faculty': faculty_name,
        'status': student.loaisv,
        'avatar': student.avatar,
        'canUpdate': can_update,
        'family': family_data
    }

    return jsonify(profile_data), 200

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