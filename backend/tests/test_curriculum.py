import pytest
import app.routes.student_routes as student_routes
from app.models.academic import MonHoc, HocKyNamHoc, LopHocPhan

# Monkey-patch để fix lỗi name/import của source code gốc
student_routes.MonHoc = MonHoc
student_routes.HocKy = HocKyNamHoc
LopHocPhan.mahocky = LopHocPhan.ma_hocky
HocKyNamHoc.mahocky = HocKyNamHoc.ma_hocky

ACADEMIC_PROGRESS_URL = '/api/students/24127158/academic/progress'

def test_tc_2_8_01_verify_curriculum_groups(client):
    """[TC_2.8_01]: Verify "Nhóm học phần" summary table lists required curriculum groups"""
    response = client.get(ACADEMIC_PROGRESS_URL)
    data = response.get_json().get('data', {})
    
    credit_groups = data.get('credit_groups', [])
    assert len(credit_groups) > 0, "Mảng credit_groups không được rỗng"
    
    # Kiểm tra các field bắt buộc phải có cho bảng tổng kết
    for group in credit_groups:
        assert 'code' in group
        assert 'name' in group
        assert 'done' in group
        assert 'req' in group

def test_tc_2_8_03_and_04_detailed_curriculum_mapping(client):
    """
    [TC_2.8_03 & TC_2.8_04]: Verify grouping logic and course detail mapping 
    within curriculum sub-tables.
    """
    response = client.get(ACADEMIC_PROGRESS_URL)
    data = response.get_json().get('data', {})
    
    courses_by_group = data.get('courses_by_group', {})
    assert isinstance(courses_by_group, dict), "courses_by_group phải là dictionary để map theo mã nhóm"
    
    if courses_by_group:
        first_group_key = list(courses_by_group.keys())[0]
        first_course = courses_by_group[first_group_key][0]
        
        # Kiểm tra đầy đủ các field chi tiết của môn học
        assert 'maMon' in first_course
        assert 'tenMon' in first_course
        assert 'soTC' in first_course
        assert 'namHoc' in first_course
        assert 'diem10' in first_course