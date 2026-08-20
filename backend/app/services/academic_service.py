# backend/app/services/academic_service.py
from app.models.student import SinhVien
from app.models.tuition import HocKyNamHoc, MonHoc, LopHocPhan
from app.models.academic import BangDiem, NhomHocPhan, ChuyenNganh

def convert_to_letter_and_gpa4(score10):
    if score10 is None:
        return "-", 0.0, "Đang học"
    s = float(score10)
    if s >= 9.0: return "A+", 4.0, "Đạt"
    if s >= 8.5: return "A", 3.7, "Đạt"
    if s >= 8.0: return "B+", 3.5, "Đạt"
    if s >= 7.0: return "B", 3.0, "Đạt"
    if s >= 6.5: return "C+", 2.5, "Đạt"
    if s >= 5.5: return "C", 2.0, "Đạt"
    if s >= 5.0: return "D+", 1.5, "Đạt"
    if s >= 4.0: return "D", 1.0, "Đạt"
    return "F", 0.0, "Không đạt"

class AcademicService:
    @staticmethod
    def get_summary_grades(mssv, ma_hocky=None):
        """Lấy bảng điểm tổng kết học kỳ hoặc toàn khóa."""
        try:
            query = BangDiem.query.filter_by(mssv=mssv)
            records = query.all()
            
            grades_list = []
            total_credits_enrolled = 0
            total_credits_passed = 0
            sum_score_weighted = 0.0
            sum_credits_graded = 0

            for r in records:
                lhp = r.lophocphan
                if not lhp: continue
                if ma_hocky and ma_hocky != "ALL" and lhp.ma_hocky != ma_hocky:
                    continue

                mh = lhp.monhoc
                hk = lhp.hocky if hasattr(lhp, 'hocky') and lhp.hocky else HocKyNamHoc.query.get(lhp.ma_hocky)
                
                sotc = mh.sotc if mh else 3
                diem_tk = r.diem_tongket
                
                diem_chu, diem_4, trang_thai = convert_to_letter_and_gpa4(diem_tk)
                if r.diem_chu: diem_chu = r.diem_chu
                if r.diem_he4 is not None: diem_4 = r.diem_he4
                if r.trangthai: trang_thai = r.trangthai

                total_credits_enrolled += sotc
                if trang_thai == "Đạt": total_credits_passed += sotc

                if diem_tk is not None:
                    sum_score_weighted += diem_tk * sotc
                    sum_credits_graded += sotc

                grades_list.append({
                    "malhp": lhp.malhp,
                    "mamh": mh.mamh if mh else "",
                    "tenmh": mh.tenmh if mh else lhp.tenlop,
                    "sotc": sotc,
                    "ma_hocky": lhp.ma_hocky,
                    "ten_hocky": hk.ten_hocky if hk else lhp.ma_hocky,
                    "namhoc": hk.namhoc if hk else "",
                    "diem_qt": r.diem_qt,
                    "diem_gk": r.diem_gk,
                    "diem_ck": r.diem_ck,
                    "diem_tongket": diem_tk,
                    "diem_he4": diem_4,
                    "diem_chu": diem_chu,
                    "ketqua": trang_thai,
                })

            gpa_10 = round(sum_score_weighted / sum_credits_graded, 2) if sum_credits_graded > 0 else 0.0
            gpa_4 = round((gpa_10 / 10.0) * 4.0, 2)

            return {
                "mssv": mssv,
                "ma_hocky": ma_hocky or "ALL",
                "gpa_10": gpa_10,
                "gpa_4": gpa_4,
                "total_enrolled": total_credits_enrolled,
                "total_passed": total_credits_passed,
                "courses": grades_list
            }
        except Exception as e:
            print("Lỗi get_summary_grades:", e)
            return {"mssv": mssv, "ma_hocky": ma_hocky or "ALL", "gpa_10": 0.0, "gpa_4": 0.0, "total_enrolled": 0, "total_passed": 0, "courses": []}

    @staticmethod
    def get_progress_data(mssv):
        """Lấy tiến độ tín chỉ, nhóm học phần, điều kiện tốt nghiệp và Radar chart chuyên ngành."""
        try:
            student = SinhVien.query.get(mssv)
            records = BangDiem.query.filter_by(mssv=mssv).all()
            
            TOTAL_DEGREE_CREDITS = 138
            
            completed_credits = 0
            debt_credits = 0
            sum_score_weighted = 0.0
            sum_credits_graded = 0
            
            course_categories = {
                "GDDC": {"name": "Giáo dục đại cương", "completed": 0, "required": 40, "courses": []},
                "CSN": {"name": "Cơ sở nhóm ngành & Ngành", "completed": 0, "required": 52, "courses": []},
                "CN": {"name": "Chuyên ngành & Tự chọn", "completed": 0, "required": 36, "courses": []},
                "KLTN": {"name": "Khóa luận / Tốt nghiệp", "completed": 0, "required": 10, "courses": []},
            }

            radar_categories = {
                "AI & Data Science": {"scores": [], "label": "Trí tuệ nhân tạo & KH Dữ liệu"},
                "Software Engineering": {"scores": [], "label": "Công nghệ phần mềm"},
                "Networks & Systems": {"scores": [], "label": "Mạng máy tính & Hệ thống"},
                "Information Security": {"scores": [], "label": "An toàn thông tin"},
                "Data Analytics": {"scores": [], "label": "Phân tích dữ liệu"}
            }

            has_gdtc = False
            has_gdqp = False
            has_foreign_lang = True

            for r in records:
                lhp = r.lophocphan
                if not lhp: continue
                mh = lhp.monhoc
                sotc = mh.sotc if mh else 3
                diem_tk = r.diem_tongket
                name_lower = (mh.tenmh if mh else lhp.tenlop).lower()

                if "thể dục" in name_lower or "gdtc" in name_lower:
                    if r.trangthai == "Đạt" or (diem_tk and diem_tk >= 5.0): has_gdtc = True
                if "quốc phòng" in name_lower or "gdqp" in name_lower:
                    if r.trangthai == "Đạt" or (diem_tk and diem_tk >= 5.0): has_gdqp = True

                if r.trangthai == "Đạt" or (diem_tk is not None and diem_tk >= 4.0):
                    completed_credits += sotc
                    if diem_tk is not None:
                        sum_score_weighted += diem_tk * sotc
                        sum_credits_graded += sotc
                elif r.trangthai == "Không đạt" or (diem_tk is not None and diem_tk < 4.0):
                    debt_credits += sotc

                cat_key = "GDDC"
                if any(k in name_lower for k in ["toán", "giải tích", "đại số", "vật lý", "triết học", "pháp luật"]):
                    cat_key = "GDDC"
                elif any(k in name_lower for k in ["lập trình", "cấu trúc dữ liệu", "cơ sở dữ liệu", "mạng máy tính", "hệ điều hành"]):
                    cat_key = "CSN"
                elif any(k in name_lower for k in ["chuyên đề", "trí tuệ nhân tạo", "web", "di động", "bảo mật"]):
                    cat_key = "CN"
                elif any(k in name_lower for k in ["khóa luận", "đồ án tốt nghiệp", "thực tập"]):
                    cat_key = "KLTN"
                
                if r.trangthai == "Đạt" or (diem_tk and diem_tk >= 4.0):
                    course_categories[cat_key]["completed"] += sotc

                course_categories[cat_key]["courses"].append({
                    "code": mh.mamh if mh else lhp.malhp,
                    "name": mh.tenmh if mh else lhp.tenlop,
                    "credits": sotc,
                    "grade": diem_tk if diem_tk is not None else "—",
                    "status": r.trangthai or "Đạt"
                })

                if diem_tk is not None:
                    if any(k in name_lower for k in ["trí tuệ nhân tạo", "học máy", "dữ liệu", "xác suất", "python"]):
                        radar_categories["AI & Data Science"]["scores"].append(diem_tk)
                    if any(k in name_lower for k in ["phần mềm", "lập trình", "web", "oop", "kiến trúc"]):
                        radar_categories["Software Engineering"]["scores"].append(diem_tk)
                    if any(k in name_lower for k in ["mạng", "hệ điều hành", "hệ thống", "vi xử lý"]):
                        radar_categories["Networks & Systems"]["scores"].append(diem_tk)
                    if any(k in name_lower for k in ["an toàn", "bảo mật", "mã hóa", "an ninh"]):
                        radar_categories["Information Security"]["scores"].append(diem_tk)
                    if any(k in name_lower for k in ["thống kê", "cơ sở dữ liệu", "khai phá", "big data"]):
                        radar_categories["Data Analytics"]["scores"].append(diem_tk)

            remaining_credits = max(0, TOTAL_DEGREE_CREDITS - completed_credits)
            gpa = round(sum_score_weighted / sum_credits_graded, 2) if sum_credits_graded > 0 else 0.0

            radar_chart_data = []
            for key, val in radar_categories.items():
                avg = round(sum(val["scores"]) / len(val["scores"]), 1) if val["scores"] else 7.5
                radar_chart_data.append({
                    "subject": val["label"],
                    "score": avg,
                    "fullMark": 10
                })

            return {
                "mssv": mssv,
                "hoten": student.hoten if student else "",
                "gpa": gpa,
                "total_credits": TOTAL_DEGREE_CREDITS,
                "completed_credits": completed_credits,
                "remaining_credits": remaining_credits,
                "debt_credits": debt_credits,
                "conditions": {
                    "gdtc": has_gdtc,
                    "gdqp": has_gdqp,
                    "foreign_language": has_foreign_lang
                },
                "donut_chart": [
                    {"name": "Hoàn thành", "value": completed_credits, "color": "#1e3a5f"},
                    {"name": "Còn thiếu", "value": remaining_credits, "color": "#cbd5e1"},
                    {"name": "Đang nợ", "value": debt_credits, "color": "#f59e0b"},
                ],
                "radar_chart": radar_chart_data,
                "categories": list(course_categories.values())
            }
        except Exception as e:
            print("Lỗi get_progress_data:", e)
            return {
                "mssv": mssv,
                "hoten": "",
                "gpa": 0.0,
                "total_credits": 138,
                "completed_credits": 0,
                "remaining_credits": 138,
                "debt_credits": 0,
                "conditions": {"gdtc": False, "gdqp": False, "foreign_language": False},
                "donut_chart": [{"name": "Hoàn thành", "value": 0, "color": "#1e3a5f"}, {"name": "Còn thiếu", "value": 138, "color": "#cbd5e1"}, {"name": "Đang nợ", "value": 0, "color": "#f59e0b"}],
                "radar_chart": [],
                "categories": []
            }