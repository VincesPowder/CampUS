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
    data = response.get_json()

    assert response.status_code == 200
    assert data['message'] == 'Đăng nhập thành công'
    assert data['role'] == 'student'
    assert data['user']['email'] == '24127158@student.hcmus.edu.vn'
    assert 'jwt_token_student' in data['token']


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
    data = response.get_json()

    assert response.status_code == 200
    assert data['role'] == 'admin'
    assert data['user']['email'] == '24127262@student.hcmus.edu.vn'
    assert data['user']['name'] == 'Đỗ Thành Vinh'
    assert 'jwt_token_admin' in data['token']


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
    data = response.get_json()

    assert response.status_code == 403
    assert 'chỉ hỗ trợ đăng nhập bằng email sinh viên' in data['error']


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
    data = response.get_json()

    assert response.status_code == 400
    assert 'Đăng nhập thất bại' in data['error']


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
    data = response.get_json()

    assert response.status_code == 200
    assert data['role'] == 'student'
    assert data['user']['email'] == '22120000@student.hcmus.edu.vn'