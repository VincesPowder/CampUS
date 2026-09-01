import pytest
from unittest.mock import patch
from app.services.context_service import build_student_context

def test_build_student_context_fetches_support_contact(app):
    """
    Xác minh logic trích xuất thông tin liên hệ hỗ trợ (Giáo vụ) từ bảng LIENHE_HETHONG 
    để nạp vào context cho AI Chatbot xử lý.
    """
    # Mượn fixture 'app' từ conftest.py để tạo bối cảnh (app_context)
    with app.app_context():
        # Đưa patch vào trong context bằng 'with' thay vì dùng decorator ở ngoài
        with patch('app.services.context_service.LienHeHeThong.query') as mock_lh_query, \
             patch('app.services.context_service.SinhVien.query') as mock_sv_query:
            
            # 1. Mock SinhVien
            mock_sv = mock_sv_query.filter_by.return_value.first.return_value
            mock_sv.mssv = "24127158"
            mock_sv.hoten = "Lan Duy"
            mock_sv.maillienlac = "advisor@test.com"
            mock_sv.nguoilienlac = "Cô Cố Vấn"
            mock_sv.nganh = None
            mock_sv.nienkhoa = "2024"
            
            # 2. Mock LienHeHeThong (Mô phỏng DB trả về thông tin phòng hỗ trợ)
            mock_support = mock_lh_query.filter.return_value.first.return_value
            mock_support.email = "daotao@hcmus.edu.vn"
            mock_support.sdt = "02838353193"
            
            # Thực thi
            context = build_student_context("24127158")
            
            # Xác minh dữ liệu liên hệ hỗ trợ đã được inject đúng vào context
            assert "student" in context
            assert context["student"]["faculty_advisor_email"] == "daotao@hcmus.edu.vn"
            assert context["student"]["faculty_advisor_phone"] == "02838353193"


def test_build_student_context_support_contact_fallback(app):
    """
    Xác minh fallback data khi bảng LIENHE_HETHONG không có dữ liệu (trả về None).
    """
    with app.app_context():
        with patch('app.services.context_service.LienHeHeThong.query') as mock_lh_query, \
             patch('app.services.context_service.SinhVien.query') as mock_sv_query:
            
            mock_sv = mock_sv_query.filter_by.return_value.first.return_value
            mock_sv.mssv = "24127158"
            
            # Ép query danh bạ hỗ trợ trả về rỗng (None)
            mock_lh_query.filter.return_value.first.return_value = None
            
            context = build_student_context("24127158")
            
            # Xác minh hệ thống tự động gán email fallback mặc định mà không bị crash
            assert context["student"]["faculty_advisor_email"] == "giaovu@fit.hcmus.edu.vn"
            assert context["student"]["faculty_advisor_phone"] == ""