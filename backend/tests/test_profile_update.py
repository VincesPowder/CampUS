import pytest
from unittest.mock import patch, MagicMock

UPDATE_PROFILE_URL = '/api/students/24127158/update'
UPDATE_FAMILY_URL = '/api/students/24127158/family/1'

# --- TEST CASES ---

@patch('app.routes.student_routes.check_update_eligibility')
@patch('app.routes.student_routes.SinhVien')
@patch('app.routes.student_routes.db.session.commit')
def test_tc_2_6_01_update_profile_open_period(mock_commit, mock_sinhvien_class, mock_check, client):
    """
    [TC_2.6_01]: Successfully update personal profile when the update period is OPEN
    """
    mock_check.return_value = True
    
    # Giả lập đối tượng SinhVien được tìm thấy mà không chọc vào DB thật
    mock_student = MagicMock()
    mock_sinhvien_class.query.get.return_value = mock_student
    
    payload = {
        "currentAddress": "123 Đường Nguyễn Văn Cừ, Q5",
        "phone": "0901234567",
        "personalEmail": "duy.nguyen@gmail.com"
    }
    
    response = client.put(UPDATE_PROFILE_URL, json=payload)
    data = response.get_json() or {}
    
    assert response.status_code == 200, f"Lỗi HTTP: {data}"
    assert data.get('message') == 'Cập nhật thông tin thành công'
    mock_commit.assert_called_once()


@patch('app.routes.student_routes.check_update_eligibility')
def test_tc_2_6_02_update_profile_closed_period(mock_check, client):
    """
    [TC_2.6_02]: Disallow profile update when the update period is CLOSED
    """
    mock_check.return_value = False
    
    payload = {
        "phone": "0987654321"
    }
    
    response = client.put(UPDATE_PROFILE_URL, json=payload)
    data = response.get_json() or {}
    
    assert response.status_code == 403
    assert data.get('error') == 'Thời gian cập nhật hồ sơ đã kết thúc'


# TUYỆT ĐỐI KHÔNG ĐỂ @patch Ở ĐÂY
def test_tc_2_6_03_update_family_details(client):
    """
    [TC_2.6_03]: Successfully update family member details
    """
    # Tạo một App Context ảo trước khi bắt đầu chọc vào các Model của DB
    with client.application.app_context():
        # Đưa các lệnh patch vào bên trong block with
        with patch('app.routes.student_routes.check_update_eligibility') as mock_check, \
             patch('app.routes.student_routes.NguoiThan') as mock_nguoithan_class, \
             patch('app.routes.student_routes.db.session.commit') as mock_commit:
            
            mock_check.return_value = True
            
            # Giả lập tìm thấy người thân trong DB ảo
            mock_nt = MagicMock()
            mock_nguoithan_class.query.filter_by.return_value.first.return_value = mock_nt
            
            payload = {
                "phone": "0911222333",
                "email": "me@gmail.com",
                "job": "Kế toán",
                "workplace": "Công ty ABC",
                "address": "Bến Tre",
                "province": "Bến Tre",
                "ward": "Ba Tri"
            }
            
            response = client.put(UPDATE_FAMILY_URL, json=payload)
            data = response.get_json() or {}
            
            assert response.status_code == 200, f"Lỗi HTTP: {data}"
            assert data.get('message') == 'Cập nhật thành công'
            mock_commit.assert_called_once()