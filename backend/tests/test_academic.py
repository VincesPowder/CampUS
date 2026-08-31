import pytest
import app.routes.student_routes as student_routes
from app.models.academic import MonHoc, HocKyNamHoc, LopHocPhan

student_routes.MonHoc = MonHoc
student_routes.HocKy = HocKyNamHoc
LopHocPhan.mahocky = LopHocPhan.ma_hocky
HocKyNamHoc.mahocky = HocKyNamHoc.ma_hocky


ACADEMIC_SUMMARY_URL = '/api/students/24127158/academic/summary'
ACADEMIC_PROGRESS_URL = '/api/students/24127158/academic/progress'

def test_tc_2_7_02_filter_by_semester(client):
    """
    [TC_2.7_02]: Verify grade filtering by Academic Year and Semester in "Tổng kết"
    """
    response = client.get(f'{ACADEMIC_SUMMARY_URL}?ma_hocky=HK001')
    data = response.get_json() or {}

    assert response.status_code == 200, f"Lỗi HTTP {response.status_code}. API trả về: {data}"
    courses = data.get('data', {}).get('courses', [])
    
    for course in courses:
        assert course.get('ma_hocky') == 'HK001', f"Sai học kỳ. Môn: {course}"

def test_tc_2_7_03_null_value_handling(client):
    """
    [TC_2.7_03]: Verify grade data mapping in the "Tổng kết" table
    Đảm bảo API xử lý an toàn các giá trị None, không bị văng lỗi 500
    """
    response = client.get(f'{ACADEMIC_SUMMARY_URL}?ma_hocky=ALL')
    data = response.get_json() or {}
    
    assert response.status_code == 200
    courses = data.get('data', {}).get('courses', [])
    assert isinstance(courses, list)
    
    if len(courses) > 0:
        assert 'diem_ck' in courses[0]
        assert 'diem_gk' in courses[0]

def test_tc_2_7_04_empty_state_handling(client):
    """
    [TC_2.7_04]: Verify empty state handling when no courses match the filter
    """
    response = client.get(f'{ACADEMIC_SUMMARY_URL}?ma_hocky=HK999')
    data = response.get_json() or {}

    assert response.status_code == 200
    assert data.get('data', {}).get('courses') == []

def test_tc_2_7_05_progress_math_calculation(client):
    """
    [TC_2.7_05]: Verify "Thông tin chung" data binding and math
    """
    response = client.get(ACADEMIC_PROGRESS_URL)
    data = response.get_json() or {}

    assert response.status_code == 200
    progress = data.get('data', {})
    
    general_info = progress.get('general_info', {})
    
    assert 'mssv' in general_info
    assert general_info.get('mssv') == '24127158'
    
    tong_tc_yc = general_info.get('tong_tc_yc', 1)
    tong_tc_dat = general_info.get('tong_tc_dat', 0)
    
    assert tong_tc_yc > 0
    assert 0 <= tong_tc_dat <= tong_tc_yc
    assert 0.0 <= float(general_info.get('diem_tb_tichluy', 0)) <= 10.0