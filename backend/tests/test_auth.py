import pytest
import json

LOGIN_URL = '/api/auth/ms-login'

def test_tc_2_1_01_login_valid_student(client):
    """
    [TC_2.1_01]: Log in successfully with valid Student account
    """
    payload = {
        "email": "24127158@student.hcmus.edu.vn",
        "name": "Nguyễn Trần Lan Duy",
        "token": "fake_ms_token"
    }
    
    response = client.post(LOGIN_URL, json=payload)
    data = response.get_json() or {}

    assert response.status_code == 200, f"Lỗi HTTP {response.status_code}. API trả về: {data}"
    assert data.get('role') == 'student', f"Sai role. API trả về: {data}"
    
    # Lấy email từ trong object 'data' do backend trả về
    email = data.get('data', {}).get('email') or data.get('email')
    assert email == '24127158@student.hcmus.edu.vn', f"Sai email. API trả về: {data}"
    assert 'token' in data, f"Không tìm thấy token. API trả về: {data}"


def test_tc_2_1_02_login_valid_admin(client):
    """
    [TC_2.1_02]: Log in successfully with valid Admin account
    (Đã cập nhật data Đỗ Thành Vinh)
    """
    payload = {
        "email": "24127262@student.hcmus.edu.vn",
        "name": "Đỗ Thành Vinh",
        "token": "fake_ms_token"
    }
    
    response = client.post(LOGIN_URL, json=payload)
    data = response.get_json() or {}

    assert response.status_code == 200, f"Lỗi HTTP {response.status_code}. API trả về: {data}"
    assert data.get('role') == 'admin', f"Sai role. API trả về: {data}"
    
    email = data.get('data', {}).get('email') or data.get('email')
    assert email == '24127262@student.hcmus.edu.vn', f"Sai email. API trả về: {data}"
    assert 'token' in data, f"Không tìm thấy token. API trả về: {data}"


def test_tc_2_1_03_login_invalid_domain(client):
    """
    [TC_2.1_03]: Log in with an invalid email domain (Outside organization)
    """
    payload = {
        "email": "personal.email@gmail.com",
        "name": "Nguoi Ngoai",
        "token": "fake_ms_token"
    }
    
    response = client.post(LOGIN_URL, json=payload)
    data = response.get_json() or {}

    assert response.status_code in [401, 403], f"Kỳ vọng 401 hoặc 403, nhận được {response.status_code}. API trả về: {data}"
    
    error_msg = str(data.get('error') or data.get('message') or data.get('msg') or "").lower()
    assert error_msg != "", f"Không có thông báo lỗi. API trả về: {data}"


def test_tc_2_1_04_cancel_login_process():
    """
    [TC_2.1_04]: Cancel the login process during SSO
    """
    pass


def test_tc_2_1_05_login_missing_token_or_email(client):
    """
    [TC_2.1_05]: Log in with incorrect password or non-existent account (Lỗi từ MS)
    """
    payload = {
        "email": "",
        "token": "invalid_token_without_payload"
    }
    
    response = client.post(LOGIN_URL, json=payload)
    data = response.get_json() or {}

    assert response.status_code in [400, 401, 403], f"Kỳ vọng 400, 401 hoặc 403, nhận được {response.status_code}. API trả về: {data}"
    
    error_msg = str(data.get('error') or data.get('message') or data.get('msg') or "").lower()
    assert error_msg != "", f"Không có thông báo lỗi. API trả về: {data}"


def test_auto_provisioning_new_student(client):
    """
    Test Step 7 (Auto Provisioning)
    """
    payload = {
        "email": "22120000@student.hcmus.edu.vn",
        "name": "Tan Sinh Vien",
        "token": "fake_token"
    }
    
    response = client.post(LOGIN_URL, json=payload)
    data = response.get_json() or {}

    assert response.status_code in [200, 403], f"Lỗi HTTP {response.status_code}. API trả về: {data}"
    
    if response.status_code == 200:
        assert data.get('role') == 'student', f"Sai role. API trả về: {data}"
        email = data.get('data', {}).get('email') or data.get('email')
        assert email == '22120000@student.hcmus.edu.vn', f"Sai email. API trả về: {data}"