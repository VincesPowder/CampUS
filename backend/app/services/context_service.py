# backend/app/services/context_service.py
from app.models.student import SinhVien, LienHeHeThong
from app.models.academic import KetQuaHocTap, LopHocPhan, MonHoc, HocKyNamHoc
from app.models.tuition import HocPhi
from app import db

def build_student_context(mssv: str) -> dict:
    """
    Truy xuất dữ liệu riêng tư của sinh viên từ database bằng cách gọi các service backend có sẵn.
    Tuyệt đối không nhận MSSV từ client, chỉ nhận từ token đã xác thực.
    """
    context = {
        "student": {},
        "academic": {},
        "schedule": {},
        "exam": [],
        "tuition": [], 
        "surveys": {"pending": [], "completed": []} 
    }

    # 1. Lấy thông tin sinh viên
    student = SinhVien.query.filter_by(mssv=mssv).first()
    if not student:
        print(f"[CHATBOT ERROR] Không tìm thấy sinh viên với MSSV: {mssv}")
        return context

    context["student"] = {
        "mssv": student.mssv,
        "hoten": student.hoten,
        "email": student.mailtruong,
        "nganh": student.nganh.tennganh if student.nganh else "N/A",
        "nienkhoa": student.nienkhoa
    }

    # Bổ sung thông tin liên hệ Giáo vụ
    context["student"]["advisor_email"] = student.maillienlac or ""
    context["student"]["advisor_name"] = student.nguoilienlac or ""
    
    try:
        advisor_contact = LienHeHeThong.query.filter(
            LienHeHeThong.loai_lienhe.ilike('%Giáo vụ%') | LienHeHeThong.ten_donvi.ilike('%Giáo vụ%')
        ).first()
        if advisor_contact:
            context["student"]["faculty_advisor_email"] = advisor_contact.email or ""
            context["student"]["faculty_advisor_phone"] = advisor_contact.sdt or ""
        else:
            context["student"]["faculty_advisor_email"] = "giaovu@fit.hcmus.edu.vn"
            context["student"]["faculty_advisor_phone"] = ""
    except Exception as e:
        print(f"[CHATBOT ERROR] Lỗi lấy thông tin giáo vụ: {str(e)}")
        context["student"]["faculty_advisor_email"] = "giaovu@fit.hcmus.edu.vn"

    # 2. Gọi AcademicService để lấy điểm và tiến độ
    try:
        from app.services.academic_service import AcademicService
        summary = AcademicService.get_summary_grades(mssv, ma_hocky="ALL")
        context["academic"]["summary"] = summary
        
        progress = AcademicService.get_progress_data(mssv)
        context["academic"]["progress"] = progress
    except Exception as e:
        print(f"[CHATBOT ERROR] Lỗi AcademicService: {str(e)}")

    # 3. Gọi ScheduleService để lấy lịch học và lịch thi
    try:
        from app.services.schedule_service import ScheduleService
        filters = ScheduleService.get_filter_options(mssv)
        if filters:
            current_semester = filters[0]["ma_hocky"]
            
            # Lấy lịch học tất cả các tuần trong học kỳ
            for week in range(1, 16):
                schedule_data = ScheduleService.get_weekly_schedule(mssv, current_semester, week)
                context["schedule"][f"Tuan_{week}"] = schedule_data["days"]
            
            # Lấy lịch thi
            exam_data = ScheduleService.get_exam_schedule(mssv, current_semester)
            context["exam"] = exam_data
    except Exception as e:
        print(f"[CHATBOT ERROR] Lỗi ScheduleService: {str(e)}")

    # 4. Lấy Học phí theo Học kỳ - Năm học
    try:
        fees = (db.session.query(HocPhi, MonHoc, HocKyNamHoc)
                .join(LopHocPhan, HocPhi.malhp == LopHocPhan.malhp)
                .join(MonHoc, LopHocPhan.mamh == MonHoc.mamh)
                .join(HocKyNamHoc, LopHocPhan.ma_hocky == HocKyNamHoc.ma_hocky)
                .filter(HocPhi.mssv == mssv)
                .all())
        
        for f, subject, hk in fees:
            context["tuition"].append({
                "hoc_ky": hk.ten_hocky if hk else "",
                "nam_hoc": hk.namhoc if hk else "",
                "ten_mon": subject.tenmh,
                "so_tin_chi": f.sotchp,
                "hoc_phi_goc": f.hocphi_goc,
                "muc_giam": f.mucgiam,
                "thuc_dong": f.thucdong,
                "trang_thai": f.trangthai_thanhtoan
            })
    except Exception as e:
        print(f"[CHATBOT ERROR] Lỗi lấy học phí: {str(e)}")

    # 5. Bổ sung dữ liệu khảo sát
    try:
        from app.models.survey import SvKhaoSat, KhaoSat, CauHoiKhaoSat
        sv_surveys = db.session.query(SvKhaoSat, KhaoSat).join(
            KhaoSat, SvKhaoSat.maks == KhaoSat.maks
        ).filter(SvKhaoSat.mssv == mssv).all()

        for sv_ks, ks in sv_surveys:
            is_done = str(sv_ks.trangthai_lam) in ['1', 'Hoàn thành', 'Đã hoàn thành']
            question_count = CauHoiKhaoSat.query.filter_by(maks=ks.maks).count()

            survey_info = {
                "ma_khao_sat": ks.maks,
                "ten_khao_sat": ks.tenks,
                "mo_ta": ks.noidung or "",
                "han_nop": ks.handon or "",
                "so_cau_hoi": question_count,
                "trang_thai": "Đã hoàn thành" if is_done else "Chưa thực hiện"
            }

            if is_done:
                context["surveys"]["completed"].append(survey_info)
            else:
                context["surveys"]["pending"].append(survey_info)
    except Exception as e:
        print(f"[CHATBOT ERROR] Lỗi lấy dữ liệu khảo sát: {str(e)}")

    return context