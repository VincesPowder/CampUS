# backend/app/services/schedule_service.py
import io
import csv
from datetime import datetime

from app import db
from app.models.academic import HocKyNamHoc, MonHoc, LopHocPhan, KetQuaHocTap
from app.models.tuition import HocPhi
from app.models.schedule import LichHoc, LichThi

MAP_THU_TO_INT = {
    "hai": 2, "thứ hai": 2, "thứ 2": 2, "2": 2, "t2": 2,
    "ba": 3, "thứ ba": 3, "thứ 3": 3, "3": 3, "t3": 3,
    "tư": 4, "tu": 4, "thứ tư": 4, "thứ 4": 4, "4": 4, "t4": 4,
    "năm": 5, "nam": 5, "thứ năm": 5, "thứ 5": 5, "5": 5, "t5": 5,
    "sáu": 6, "sau": 6, "thứ sáu": 6, "thứ 6": 6, "6": 6, "t6": 6,
    "bảy": 7, "bay": 7, "thứ bảy": 7, "thứ 7": 7, "7": 7, "t7": 7,
    "chủ nhật": 8, "chu nhat": 8, "cn": 8, "8": 8
}

DAY_NAMES = {
    2: "Thứ hai", 3: "Thứ ba", 4: "Thứ tư", 5: "Thứ năm", 6: "Thứ sáu", 7: "Thứ bảy", 8: "Chủ nhật"
}

DAYS_OF_WEEK_VI = ["Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy", "Chủ nhật"]

def convert_thu(thu_str):
    if not thu_str:
        return 2
    return MAP_THU_TO_INT.get(str(thu_str).lower().strip(), 2)

def fmt_time(t):
    if not t:
        return ""
    if hasattr(t, 'strftime'):
        return t.strftime('%H:%M')
    return str(t)[:5]

def fmt_date(d):
    if not d:
        return ""
    if hasattr(d, 'strftime'):
        return d.strftime('%Y-%m-%d')  # Ví dụ: 2024-09-16, 2024-10-07
    return str(d)

class ScheduleService:
    @staticmethod
    def get_filter_options(mssv):
        """Lấy danh sách năm học, học kỳ và các tuần có sẵn của sinh viên."""
        try:
            # Ưu tiên lấy từ KETQUA_HOCTAP, fallback sang HOCPHI
            malhp_list = []
            if mssv:
                kq_records = KetQuaHocTap.query.filter_by(mssv=mssv).all()
                malhp_list = [kq.malhp for kq in kq_records if kq.malhp]
                if not malhp_list:
                    hp_records = HocPhi.query.filter_by(mssv=mssv).all()
                    malhp_list = [hp.malhp for hp in hp_records if hp.malhp]

            if malhp_list:
                classes = LopHocPhan.query.filter(LopHocPhan.malhp.in_(malhp_list)).all()
                ma_hk_list = list(set([c.ma_hocky for c in classes if c.ma_hocky]))
                semesters = HocKyNamHoc.query.filter(HocKyNamHoc.ma_hocky.in_(ma_hk_list)).order_by(HocKyNamHoc.ma_hocky.desc()).all() if ma_hk_list else HocKyNamHoc.query.all()
            else:
                semesters = HocKyNamHoc.query.order_by(HocKyNamHoc.ma_hocky.desc()).all()
            
            result = []
            for sem in semesters:
                weeks = []
                for w in range(1, 16):
                    weeks.append({
                        "week_number": w,
                        "label": f"Tuần {w:02d}",
                    })
                
                result.append({
                    "ma_hocky": sem.ma_hocky,
                    "ten_hocky": sem.ten_hocky or sem.ma_hocky,
                    "namhoc": sem.namhoc or "",
                    "label": f"{sem.ten_hocky} ({sem.namhoc})" if sem.namhoc else sem.ten_hocky,
                    "ngayBatDau": fmt_date(sem.ngaybatdau),
                    "ngayKetThuc": fmt_date(sem.ngayketthuc),
                    "weeks": weeks
                })
            return result
        except Exception as e:
            print("Lỗi get_filter_options:", e)
            return []

    @staticmethod
    def get_weekly_schedule(mssv, ma_hocky, week_number):
        days_data = {day: [] for day in range(2, 9)}
        try:
            # Lấy danh sách lớp học phần của sinh viên
            malhp_list = []
            if mssv:
                kq_records = KetQuaHocTap.query.filter_by(mssv=mssv).all()
                malhp_list = [kq.malhp for kq in kq_records if kq.malhp]
                if not malhp_list:
                    hp_records = HocPhi.query.filter_by(mssv=mssv).all()
                    malhp_list = [hp.malhp for hp in hp_records if hp.malhp]

            if not malhp_list:
                classes = LopHocPhan.query.filter_by(ma_hocky=ma_hocky).all()
                malhp_list = [c.malhp for c in classes]

            classes = LopHocPhan.query.filter(
                LopHocPhan.malhp.in_(malhp_list),
                LopHocPhan.ma_hocky == ma_hocky
            ).all()
            valid_malhp = [c.malhp for c in classes]

            if not valid_malhp:
                return {"ma_hocky": ma_hocky, "week_number": week_number, "days": days_data, "total_classes": 0}

            # Lọc lịch học theo tuần
            query = LichHoc.query.filter(LichHoc.malhp.in_(valid_malhp))
            if week_number and week_number > 0:
                query = query.filter((LichHoc.tuan == str(week_number)) | (LichHoc.tuan == int(week_number)) | (LichHoc.tuan == None))
            
            schedules = query.all()

            for item in schedules:
                lhp = item.lophocphan
                mh = lhp.monhoc if lhp else None
                thu_num = convert_thu(item.thu)
                
                t_start = fmt_time(item.thoigian_bd) or "07:30"
                t_end = fmt_time(item.thoigian_kt) or "11:10"
                
                start_p = 1 if "07" in t_start else (3 if "09" in t_start else (6 if "13" in t_start else 8))
                end_p = start_p + 4

                days_data[thu_num].append({
                    "schedule_id": item.malichhoc,
                    "malhp": lhp.malhp if lhp else "",
                    "tenlop": lhp.tenlop if lhp else "",
                    "mamh": mh.mamh if mh else "",
                    "tenmh": mh.tenmh if mh else (lhp.tenlop if lhp else "Môn học"),
                    "sotc": mh.sotc if mh else 0,
                    "loai_tiet": "TH" if "TH" in (lhp.tenlop or "") or "thực hành" in (mh.tenmh.lower() if mh else "") else "LT",
                    "period_range": f"Tiết {start_p} - {end_p}",
                    "start_period": start_p,
                    "end_period": end_p,
                    "time_range": f"{t_start} - {t_end}",
                    "room": item.phonghoc or "Chưa xếp",
                    "tuan": item.tuan or str(week_number),
                    "ngayBatDau": fmt_date(item.ngaybatdau),
                    "ngayKetThuc": fmt_date(item.ngayketthuc),
                    "lecturer": lhp.tengv if lhp else "",
                    "email": getattr(lhp, 'mailgv', '') or "",
                    "hinhthuc": item.hinhthuchoc or "Trực tiếp",
                    "format": getattr(lhp, 'ngonngu', 'Tiếng Việt') or "Tiếng Việt"
                })

            for day in days_data:
                days_data[day].sort(key=lambda x: x["start_period"])

            return {
                "ma_hocky": ma_hocky,
                "week_number": week_number,
                "days": days_data,
                "total_classes": len(schedules)
            }
        except Exception as e:
            print("Lỗi get_weekly_schedule:", e)
            return {"ma_hocky": ma_hocky, "week_number": week_number, "days": days_data, "total_classes": 0}

    @staticmethod
    def get_exam_schedule(mssv, ma_hocky):
        """Lấy danh sách lịch thi chi tiết từ bảng LICH_THI."""
        try:
            malhp_list = []
            if mssv:
                kq_records = KetQuaHocTap.query.filter_by(mssv=mssv).all()
                malhp_list = [kq.malhp for kq in kq_records if kq.malhp]
                if not malhp_list:
                    hp_records = HocPhi.query.filter_by(mssv=mssv).all()
                    malhp_list = [hp.malhp for hp in hp_records if hp.malhp]

            if not malhp_list:
                classes = LopHocPhan.query.filter_by(ma_hocky=ma_hocky).all()
                malhp_list = [c.malhp for c in classes]

            classes = LopHocPhan.query.filter(
                LopHocPhan.malhp.in_(malhp_list),
                LopHocPhan.ma_hocky == ma_hocky
            ).all()
            valid_malhp = [c.malhp for c in classes]

            if not valid_malhp:
                return []

            exams = LichThi.query.filter(LichThi.malhp.in_(valid_malhp)).all()
            
            result = []
            for idx, ex in enumerate(exams, 1):
                lhp = ex.lophocphan
                mh = lhp.monhoc if lhp else None
                
                if ex.ngaythi:
                    thu_str = DAYS_OF_WEEK_VI[ex.ngaythi.weekday()]
                else:
                    thu_str = "Chưa có"

                t_start = fmt_time(ex.giothi) or "07:30"
                exam_date_str = fmt_date(ex.ngaythi) or "Chưa có"
                duration_str = f"{ex.thoigianlambai or 90} phút"

                result.append({
                    "id": ex.malichthi or idx,
                    "stt": idx,
                    "mamh": mh.mamh if mh else "",
                    "tenmh": mh.tenmh if mh else (lhp.tenlop if lhp else "Môn thi"),
                    "malhp": lhp.malhp if lhp else "",
                    "tenlop": lhp.tenlop if lhp else "",
                    "sotc": mh.sotc if mh else 0,
                    "thu": thu_str,
                    "day_name": thu_str,
                    "exam_date": exam_date_str,
                    "shift": "Ca 1" if "07" in t_start else ("Ca 2" if "09" in t_start else "Ca 3"),
                    "time_range": t_start,
                    "thoiGian": duration_str,
                    "room": ex.phongthi or "Chưa xếp",
                    "seat_number": f"{idx:02d}",
                    "soThi": idx,
                    "total_students": 45,
                    "exam_format": "Thực hành" if "TH" in (lhp.tenlop or "") or "thực hành" in (mh.tenmh.lower() if mh else "") else "Tự luận",
                    "notes": ""
                })
            return result
        except Exception as e:
            print("Lỗi get_exam_schedule:", e)
            return []

    # ── Xuất TKB tuần ra CSV (Đã bổ sung cột Ngày bắt đầu, Ngày kết thúc) ──
    @staticmethod
    def export_weekly_schedule_csv(mssv, ma_hocky, week_number):
        schedule_data = ScheduleService.get_weekly_schedule(mssv, ma_hocky, week_number)
        output = io.StringIO()
        writer = csv.writer(output)
        
        headers = [
            "STT", "Thứ", "Mã Môn", "Tên Môn Học", "Mã Lớp", "Tiết", 
            "Thời Gian", "Phòng", "Tuần", "Ngày bắt đầu", "Ngày kết thúc", 
            "Giảng Viên", "Hình Thức"
        ]
        writer.writerow(headers)
        
        stt = 1
        for day, items in schedule_data["days"].items():
            day_label = DAY_NAMES.get(day, f"Thứ {day}")
            for it in items:
                writer.writerow([
                    stt,
                    day_label,
                    it.get("mamh", ""),
                    it.get("tenmh", ""),
                    it.get("malhp", ""),
                    it.get("period_range", ""),
                    it.get("time_range", ""),
                    it.get("room", ""),
                    it.get("tuan", ""),
                    it.get("ngayBatDau", ""),
                    it.get("ngayKetThuc", ""),
                    it.get("lecturer", ""),
                    it.get("hinhthuc", "")
                ])
                stt += 1
                
        return io.BytesIO(output.getvalue().encode('utf-8-sig'))

    # ── Xuất Lịch thi ra CSV ──
    @staticmethod
    def export_exam_schedule_csv(mssv, ma_hocky):
        exam_data = ScheduleService.get_exam_schedule(mssv, ma_hocky)
        output = io.StringIO()
        writer = csv.writer(output)
        
        headers = [
            "STT", "Mã Môn", "Tên Môn Học", "Mã Lớp", "Số TC", 
            "Thứ", "Ngày Thi", "Giờ Thi", "Thời Gian Làm Bài", "Phòng Thi", "Hình Thức Thi"
        ]
        writer.writerow(headers)
        
        for it in exam_data:
            writer.writerow([
                it.get("stt", ""),
                it.get("mamh", ""),
                it.get("tenmh", ""),
                it.get("malhp", ""),
                it.get("sotc", ""),
                it.get("thu", ""),
                it.get("exam_date", ""),
                it.get("time_range", ""),
                it.get("thoiGian", ""),
                it.get("room", ""),
                it.get("exam_format", "")
            ])
            
        return io.BytesIO(output.getvalue().encode('utf-8-sig'))

    # Alias tương thích ngược
    @staticmethod
    def export_weekly_schedule_excel(mssv, ma_hocky, week_number):
        return ScheduleService.export_weekly_schedule_csv(mssv, ma_hocky, week_number)

    @staticmethod
    def export_exam_schedule_excel(mssv, ma_hocky):
        return ScheduleService.export_exam_schedule_csv(mssv, ma_hocky)