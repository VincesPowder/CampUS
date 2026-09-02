# backend/app/services/academic_service.py
from app.models.student import SinhVien
from app.models.tuition import HocKyNamHoc, MonHoc, LopHocPhan
from app.models.academic import (
    KetQuaHocTap, 
    TienDoHocTap, 
    TienDoNhomHocPhan, 
    NhomHocPhan, 
    ChuongTrinhDaoTao
)

def convert_to_gpa4(score10):
    if score10 is None: return 0.0
    s = float(score10)
    if s >= 9.0: return 4.0
    if s >= 8.5: return 3.7
    if s >= 8.0: return 3.5
    if s >= 7.0: return 3.0
    if s >= 6.5: return 2.5
    if s >= 5.5: return 2.0
    if s >= 5.0: return 1.5
    if s >= 4.0: return 1.0
    return 0.0

class AcademicService:
    @staticmethod
    def get_summary_grades(mssv, ma_hocky=None):
        """Lấy bảng điểm chi tiết từ bảng KETQUA_HOCTAP."""
        try:
            records = KetQuaHocTap.query.filter_by(mssv=mssv).all()
            
            courses_list = []
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
                diem_10 = r.diemtb_he10
                diem_4 = convert_to_gpa4(diem_10)

                total_credits_enrolled += sotc
                if r.trangthai == "Đạt" or (diem_10 is not None and diem_10 >= 4.0):
                    total_credits_passed += sotc

                if diem_10 is not None:
                    sum_score_weighted += diem_10 * sotc
                    sum_credits_graded += sotc

                courses_list.append({
                    "malhp": lhp.malhp,
                    "mamh": mh.mamh if mh else "",
                    "tenmh": mh.tenmh if mh else lhp.tenlop,
                    "sotc": sotc,
                    "ma_hocky": lhp.ma_hocky,
                    "ten_hocky": hk.ten_hocky if hk else lhp.ma_hocky,
                    "namhoc": hk.namhoc if hk else "",
                    "diem_qt": r.diemcc,
                    "diem_gk": r.diemgk,
                    "diem_ck": r.diemck,
                    "diem_tongket": diem_10,
                    "diem_he4": diem_4,
                    "diem_chu": r.loaidiem_hechu or "—",
                    "ketqua": r.trangthai or ("Đạt" if diem_10 and diem_10 >= 4.0 else "Không đạt"),
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
                "courses": courses_list
            }
        except Exception as e:
            print("Lỗi get_summary_grades:", e)
            return {"mssv": mssv, "ma_hocky": ma_hocky or "ALL", "gpa_10": 0.0, "gpa_4": 0.0, "total_enrolled": 0, "total_passed": 0, "courses": []}

    @staticmethod
    def get_progress_data(mssv):
        """Lấy dữ liệu tiến độ từ bảng TIENDO_HOCTAP & TIENDO_NHOMHOCPHAN."""
        try:
            student = SinhVien.query.get(mssv)
            tiendo = TienDoHocTap.query.get(mssv)
            records = KetQuaHocTap.query.filter_by(mssv=mssv).all()

            # 1. Thông tin chung & Tiến độ tín chỉ
            total_credits_required = tiendo.tong_tc_yc if (tiendo and tiendo.tong_tc_yc) else 138
            completed_credits = tiendo.tong_tc_dat if (tiendo and tiendo.tong_tc_dat is not None) else 0
            
            # Tính nợ tín chỉ từ các môn bị điểm F / Không đạt
            debt_credits = 0
            for r in records:
                mh = r.lophocphan.monhoc if (r.lophocphan and r.lophocphan.monhoc) else None
                sotc = mh.sotc if mh else 3
                if r.trangthai == "Không đạt" or (r.diemtb_he10 is not None and r.diemtb_he10 < 4.0):
                    debt_credits += sotc

            remaining_credits = max(0, total_credits_required - completed_credits)
            gpa = float(tiendo.diem_tb_tichluy) if (tiendo and tiendo.diem_tb_tichluy is not None) else 0.0

            # 2. Điều kiện tốt nghiệp
            conditions = {
                "gdtc": tiendo.trangthai_gdtc == "Đạt" if (tiendo and tiendo.trangthai_gdtc) else False,
                "gdqp": tiendo.trangthai_gdqp == "Đạt" if (tiendo and tiendo.trangthai_gdqp) else False,
                "foreign_language": tiendo.trangthai_tdnn == "Đạt" if (tiendo and tiendo.trangthai_tdnn) else False
            }

            # 3. Tiến độ theo Nhóm học phần
            categories = []
            if tiendo:
                categories = [
                    {
                        "name": "Giáo dục đại cương",
                        "completed": tiendo.tc_gddc_dat or 0,
                        "required": tiendo.tc_gddc_yc or 40,
                        "status": tiendo.trangthai_gddc or "Chưa đạt"
                    },
                    {
                        "name": "Cơ sở nhóm ngành & Ngành",
                        "completed": tiendo.tc_csn_dat or 0,
                        "required": tiendo.tc_csn_yc or 52,
                        "status": tiendo.trangthai_csn or "Chưa đạt"
                    },
                    {
                        "name": "Chuyên ngành & Tự chọn",
                        "completed": tiendo.tc_cn_dat or 0,
                        "required": tiendo.tc_cn_yc or 36,
                        "status": tiendo.trangthai_cn or "Chưa đạt"
                    },
                    {
                        "name": "Khóa luận / Tốt nghiệp",
                        "completed": tiendo.tc_tn_dat or 0,
                        "required": tiendo.tc_tn_yc or 10,
                        "status": tiendo.trangthai_tn or "Chưa đạt"
                    }
                ]
            else:
                # Lấy từ TIENDO_NHOMHOCPHAN nếu có
                nhom_records = TienDoNhomHocPhan.query.filter_by(mssv=mssv).all()
                for nr in nhom_records:
                    nh = nr.nhomhocphan
                    categories.append({
                        "name": nh.tennhom if nh else nr.manhom,
                        "completed": nr.tc_dat or 0,
                        "required": nr.tc_yeucau or 0,
                        "status": "Đạt" if nr.tc_dat >= nr.tc_yeucau else "Chưa đạt"
                    })

            # 4. Chỉ số phù hợp chuyên ngành (Radar Chart)
            radar_map = {
                "AI & Data Science": {"scores": [], "label": "Trí tuệ nhân tạo & KH Dữ liệu"},
                "Software Engineering": {"scores": [], "label": "Công nghệ phần mềm"},
                "Networks & Systems": {"scores": [], "label": "Mạng máy tính & Hệ thống"},
                "Information Security": {"scores": [], "label": "An toàn thông tin"},
                "Data Analytics": {"scores": [], "label": "Phân tích dữ liệu"}
            }

            for r in records:
                lhp = r.lophocphan
                if not lhp or r.diemtb_he10 is None: continue
                mh = lhp.monhoc
                name_lower = (mh.tenmh if mh else lhp.tenlop).lower()
                d = float(r.diemtb_he10)

                if any(k in name_lower for k in ["trí tuệ nhân tạo", "học máy", "dữ liệu", "xác suất", "python"]):
                    radar_map["AI & Data Science"]["scores"].append(d)
                if any(k in name_lower for k in ["phần mềm", "lập trình", "web", "oop", "kiến trúc"]):
                    radar_map["Software Engineering"]["scores"].append(d)
                if any(k in name_lower for k in ["mạng", "hệ điều hành", "hệ thống", "vi xử lý"]):
                    radar_map["Networks & Systems"]["scores"].append(d)
                if any(k in name_lower for k in ["an toàn", "bảo mật", "mã hóa", "an ninh"]):
                    radar_map["Information Security"]["scores"].append(d)
                if any(k in name_lower for k in ["thống kê", "cơ sở dữ liệu", "khai phá", "big data"]):
                    radar_map["Data Analytics"]["scores"].append(d)

            radar_chart = []
            for k, val in radar_map.items():
                avg = round(sum(val["scores"]) / len(val["scores"]), 1) if val["scores"] else 7.5
                radar_chart.append({"subject": val["label"], "score": avg, "fullMark": 10})

            return {
                "mssv": mssv,
                "hoten": student.hoten if student else "",
                "gpa": gpa,
                "total_credits": total_credits_required,
                "completed_credits": completed_credits,
                "remaining_credits": remaining_credits,
                "debt_credits": debt_credits,
                "dudieukientn": tiendo.dudieukientn if tiendo else "Chưa đủ điều kiện",
                "conditions": conditions,
                "donut_chart": [
                    {"name": "Hoàn thành", "value": completed_credits, "color": "#1e3a5f"},
                    {"name": "Còn thiếu", "value": remaining_credits, "color": "#cbd5e1"},
                    {"name": "Đang nợ", "value": debt_credits, "color": "#f59e0b"},
                ],
                "radar_chart": radar_chart,
                "categories": categories
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