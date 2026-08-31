# backend/app/services/schedule_service.py
import io
import re
import pandas as pd
from datetime import datetime, timedelta

from app.models.tuition import HocKyNamHoc, MonHoc, LopHocPhan, HocPhi
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
    2: "Thứ 2", 3: "Thứ 3", 4: "Thứ 4", 5: "Thứ 5", 6: "Thứ 6", 7: "Thứ 7", 8: "Chủ nhật"
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
        return d.strftime('%d/%m/%Y')
    return str(d)

class ScheduleService:
    @staticmethod
    def get_filter_options(mssv):
        """Lấy danh sách năm học, học kỳ và các tuần có sẵn của sinh viên."""
        try:
            hocphi_records = HocPhi.query.filter_by(mssv=mssv).all() if mssv else []
            malhp_list = [hp.malhp for hp in hocphi_records if hp.malhp]
            
            if malhp_list:
                classes = LopHocPhan.query.filter(LopHocPhan.malhp.in_(malhp_list)).all()
                ma_hk_list = list(set([c.ma_hocky for c in classes if c.ma_hocky]))
                semesters = HocKyNamHoc.query.filter(HocKyNamHoc.ma_hocky.in_(ma_hk_list)).all() if ma_hk_list else HocKyNamHoc.query.all()
            else:
                semesters = HocKyNamHoc.query.all()
            
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
            hocphi_records = HocPhi.query.filter_by(mssv=mssv).all() if mssv else []
            malhp_list = [hp.malhp for hp in hocphi_records if hp.malhp]

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

            # Lọc theo tuần (xử lý an toàn cho cả '1', 1, và NULL)
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
                    "lecturer": lhp.tengv if lhp else "",
                    "email": getattr(lhp, 'mailgv', '') or "",
                    "hinhthuc": item.hinhthuchoc or "TẬP TRUNG",
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
            hocphi_records = HocPhi.query.filter_by(mssv=mssv).all() if mssv else []
            malhp_list = [hp.malhp for hp in hocphi_records if hp.malhp]

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
                
                # Tự động tính Thứ trong tuần từ ngày thi
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

    @staticmethod
    def export_weekly_schedule_excel(mssv, ma_hocky, week_number):
        schedule_data = ScheduleService.get_weekly_schedule(mssv, ma_hocky, week_number)
        rows = []
        for day, items in schedule_data["days"].items():
            day_label = DAY_NAMES.get(day, f"Thứ {day}")
            for it in items:
                rows.append({
                    "Thứ": day_label,
                    "Mã Môn": it["mamh"],
                    "Tên Môn Học": it["tenmh"],
                    "Mã Lớp": it["malhp"],
                    "Tiết": it["period_range"],
                    "Thời Gian": it["time_range"],
                    "Phòng": it["room"],
                    "Giảng Viên": it["lecturer"],
                    "Hình Thức": it["hinhthuc"]
                })
        df = pd.DataFrame(rows) if rows else pd.DataFrame(columns=["Thứ", "Mã Môn", "Tên Môn Học", "Mã Lớp", "Tiết", "Thời Gian", "Phòng", "Giảng Viên", "Hình Thức"])
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name=f"TKB_Tuan_{week_number}")
        output.seek(0)
        return output

    @staticmethod
    def export_exam_schedule_excel(mssv, ma_hocky):
        exam_data = ScheduleService.get_exam_schedule(mssv, ma_hocky)
        rows = []
        for it in exam_data:
            rows.append({
                "STT": it["stt"],
                "Mã Môn": it["mamh"],
                "Tên Môn Học": it["tenmh"],
                "Mã Lớp": it["malhp"],
                "Thứ": it["thu"],
                "Ngày Thi": it["exam_date"],
                "Giờ Thi": it["time_range"],
                "Thời Gian Làm Bài": it["thoiGian"],
                "Phòng Thi": it["room"],
                "Hình Thức Thi": it["exam_format"]
            })
        df = pd.DataFrame(rows) if rows else pd.DataFrame(columns=["STT", "Mã Môn", "Tên Môn Học", "Mã Lớp", "Thứ", "Ngày Thi", "Giờ Thi", "Thời Gian Làm Bài", "Phòng Thi", "Hình Thức Thi"])
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name="Lich_Thi")
        output.seek(0)
        return output