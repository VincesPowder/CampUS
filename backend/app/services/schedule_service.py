# backend/app/services/schedule_service.py
import io
import pandas as pd
from datetime import datetime, timedelta

from app.models.student import SinhVien
from app.models.tuition import HocKyNamHoc, MonHoc, LopHocPhan, HocPhi
from app.models.schedule import LichHoc, LichThi

DAY_NAMES = {
    2: "Thứ 2",
    3: "Thứ 3",
    4: "Thứ 4",
    5: "Thứ 5",
    6: "Thứ 6",
    7: "Thứ 7",
    8: "Chủ nhật"
}

class ScheduleService:
    @staticmethod
    def get_filter_options(mssv):
        """Lấy danh sách năm học, học kỳ và các tuần có sẵn của sinh viên."""
        # Lấy các lớp học phần sinh viên đã đăng ký (dựa trên bảng HOCPHI)
        hocphi_records = HocPhi.query.filter_by(mssv=mssv).all() if mssv else []
        malhp_list = [hp.malhp for hp in hocphi_records]
        
        if malhp_list:
            classes = LopHocPhan.query.filter(LopHocPhan.malhp.in_(malhp_list)).all()
            ma_hk_list = list(set([c.ma_hocky for c in classes]))
            semesters = HocKyNamHoc.query.filter(HocKyNamHoc.ma_hocky.in_(ma_hk_list)).all()
        else:
            semesters = HocKyNamHoc.query.all()
        
        result = []
        for sem in semesters:
            weeks = []
            for w in range(1, 16):  # Mặc định 15 tuần học
                weeks.append({
                    "week_number": w,
                    "label": f"Tuần {w:02d}",
                })
            
            result.append({
                "ma_hocky": sem.ma_hocky,
                "ten_hocky": sem.ten_hocky,
                "namhoc": sem.namhoc,
                "label": f"{sem.ten_hocky} ({sem.namhoc})" if sem.namhoc else sem.ten_hocky,
                "weeks": weeks
            })
        return result

    @staticmethod
    def get_weekly_schedule(mssv, ma_hocky, week_number):
        """Lấy thời khóa biểu tuần theo MSSV và Học kỳ."""
        hocphi_records = HocPhi.query.filter_by(mssv=mssv).all() if mssv else []
        malhp_list = [hp.malhp for hp in hocphi_records]

        if not malhp_list:
            # Fallback nếu test chưa có dữ liệu học phí: lấy tất cả lớp của học kỳ đó
            classes = LopHocPhan.query.filter_by(ma_hocky=ma_hocky).all()
            malhp_list = [c.malhp for c in classes]

        classes = LopHocPhan.query.filter(
            LopHocPhan.malhp.in_(malhp_list),
            LopHocPhan.ma_hocky == ma_hocky
        ).all()
        valid_malhp = [c.malhp for c in classes]

        days_data = {day: [] for day in range(2, 9)}
        if not valid_malhp:
            return {"ma_hocky": ma_hocky, "week_number": week_number, "days": days_data, "total_classes": 0}

        schedules = LichHoc.query.filter(
            LichHoc.malhp.in_(valid_malhp),
            LichHoc.tuan_bd <= week_number,
            LichHoc.tuan_kt >= week_number
        ).all()

        for item in schedules:
            lhp = item.lophocphan
            mh = lhp.monhoc if lhp else None
            days_data[item.thu].append({
                "schedule_id": item.id,
                "malhp": lhp.malhp if lhp else "",
                "tenlop": lhp.tenlop if lhp else "",
                "mamh": mh.mamh if mh else "",
                "tenmh": mh.tenmh if mh else "",
                "sotc": mh.sotc if mh else 0,
                "loai_tiet": item.loai_tiet,
                "period_range": f"Tiết {item.tiet_bd} - {item.tiet_kt}",
                "start_period": item.tiet_bd,
                "end_period": item.tiet_kt,
                "time_range": f"{item.gio_bd} - {item.gio_kt}",
                "room": item.phong,
                "lecturer": lhp.tengv if lhp else "",
                "format": "CLC" if "CLC" in (lhp.tenlop or "") else "Đại trà"
            })

        for day in days_data:
            days_data[day].sort(key=lambda x: x["start_period"])

        return {
            "ma_hocky": ma_hocky,
            "week_number": week_number,
            "days": days_data,
            "total_classes": len(schedules)
        }

    @staticmethod
    def get_exam_schedule(mssv, ma_hocky):
        """Lấy danh sách lịch thi chi tiết."""
        hocphi_records = HocPhi.query.filter_by(mssv=mssv).all() if mssv else []
        malhp_list = [hp.malhp for hp in hocphi_records]

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

        exams = LichThi.query.filter(LichThi.malhp.in_(valid_malhp)).order_by(LichThi.ngay_thi, LichThi.gio_bd).all()
        
        result = []
        for idx, ex in enumerate(exams, 1):
            lhp = ex.lophocphan
            mh = lhp.monhoc if lhp else None
            result.append({
                "id": ex.id,
                "stt": idx,
                "mamh": mh.mamh if mh else "",
                "tenmh": mh.tenmh if mh else "",
                "malhp": lhp.malhp if lhp else "",
                "tenlop": lhp.tenlop if lhp else "",
                "sotc": mh.sotc if mh else 0,
                "day_name": DAY_NAMES.get(ex.thu, f"Thứ {ex.thu}"),
                "exam_date": ex.ngay_thi.strftime("%d/%m/%Y"),
                "shift": ex.ca_thi,
                "time_range": f"{ex.gio_bd} - {ex.gio_kt}",
                "room": ex.phong_thi,
                "seat_number": ex.sbd or f"{idx:02d}",
                "total_students": ex.soluong_sv,
                "exam_format": ex.hinhthuc_thi,
                "notes": ex.ghichu or ""
            })
        return result

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
                    "Hình Thức": it["format"]
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
                "Thứ": it["day_name"],
                "Ngày Thi": it["exam_date"],
                "Ca Thi": it["shift"],
                "Giờ Thi": it["time_range"],
                "Phòng Thi": it["room"],
                "SBD": it["seat_number"],
                "Hình Thức Thi": it["exam_format"],
                "Ghi Chú": it["notes"]
            })
        df = pd.DataFrame(rows) if rows else pd.DataFrame(columns=["STT", "Mã Môn", "Tên Môn Học", "Mã Lớp", "Thứ", "Ngày Thi", "Ca Thi", "Giờ Thi", "Phòng Thi", "SBD", "Hình Thức Thi", "Ghi Chú"])
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name="Lich_Thi")
        output.seek(0)
        return output