import pytest

# Giả định Blueprint student được đăng ký với url_prefix='/api/student'
# Nếu của team bạn là '/student' hoặc '/api/students' thì bạn chỉnh lại chuỗi này nha.
STUDENT_API_URL = '/api/students'

def test_tc_2_5_01_general_information(client):
    """[TC_2.5_01]: Verify mapping of General Information (Thông tin chung)"""
    response = client.get(f'{STUDENT_API_URL}/24127158')
    data = response.get_json()

    assert response.status_code == 200
    assert data['mssv'] == '24127158'
    assert data['fullName'] == 'Nguyễn Trần Lan Duy'
    assert data['gender'] == 'Nữ'
    assert data['course'] == '2024'
    assert data['level'] == 'Cử nhân'
    assert data['trainingType'] == 'TCTA'
    # Test Relationship: Mã ngành 7480201_DKD phải map ra đúng Tên ngành và Khoa
    assert data['major'] == 'Công nghệ Thông tin'
    assert data['faculty'] == 'Công nghệ thông tin'

def test_tc_2_5_02_id_document_information(client):
    """[TC_2.5_02]: Verify mapping of ID Document Information (CCCD / Giấy tờ tùy thân)"""
    response = client.get(f'{STUDENT_API_URL}/24127158')
    data = response.get_json()

    assert data['cccd'] == '0548423215'
    assert data['issuedDate'] == '2023-04-30'
    assert data['nationality'] == 'Việt Nam'
    assert data['ethnic'] == 'Kinh'
    assert data['religion'] == 'Không'

def test_tc_2_5_03_address_information(client):
    """[TC_2.5_03]: Verify mapping of Address Information (Địa chỉ)"""
    response = client.get(f'{STUDENT_API_URL}/24127158')
    data = response.get_json()

    assert 'Xã Tân Thủy' in data['permanentAddress']
    assert 'phường An Đông' in data['currentAddress']

def test_tc_2_5_04_contact_information(client):
    """[TC_2.5_04]: Verify mapping of Contact Information (Thông tin liên hệ)"""
    response = client.get(f'{STUDENT_API_URL}/24127158')
    data = response.get_json()

    assert data['phone'] == '0123456789'
    assert data['personalEmail'] == 'nguyentranlanduy2016@gmail.com'
    assert data['officialEmail'] == '24127158@student.hcmus.edu.vn'
    assert data['joinUnionDate'] == '2021-05-31'

def test_tc_2_5_05_emergency_contact_information(client):
    """[TC_2.5_05]: Verify mapping of Emergency Contact Information (Thông tin người liên lạc)"""
    response = client.get(f'{STUDENT_API_URL}/24127158')
    data = response.get_json()

    assert data['advisor'] == 'Trần Thị Thủy'
    assert data['advisorPhone'] == '0987654321'
    assert data['advisorRelation'] == 'Mẹ'

def test_tc_2_5_06_bank_information(client):
    """[TC_2.5_06]: Verify mapping of Bank Information (Thông tin ngân hàng)"""
    response = client.get(f'{STUDENT_API_URL}/24127158')
    data = response.get_json()

    assert data['bankNumber'] == '02101971'
    assert data['bank'] == 'ACB'

def test_tc_2_5_07_null_handling_profile(client):
    """[TC_2.5_07]: Verify UI handling of NULL/Empty database values"""
    response = client.get(f'{STUDENT_API_URL}/24127158')
    data = response.get_json()

    # Trong DB test, ngày vào Đảng (NGAYVAODANG) và Email NLL (MAILLIENLAC) đang để NULL
    assert data['joinPartyDate'] is None
    assert data['advisorEmail'] is None

def test_tc_2_5_08_family_member_list_retrieval(client):
    """[TC_2.5_08]: Verify retrieval of family member list"""
    response = client.get(f'{STUDENT_API_URL}/24127158')
    data = response.get_json()

    family_list = data.get('family', [])
    assert isinstance(family_list, list)
    # Có ít nhất 1 dòng dữ liệu người thân (MANT: 241271581)
    assert len(family_list) >= 1 

def test_tc_2_5_09_family_summary_mapping(client):
    """[TC_2.5_09]: Verify data mapping of the family summary table"""
    response = client.get(f'{STUDENT_API_URL}/24127158')
    data = response.get_json()
    
    # Lấy người thân đầu tiên trong mảng
    family_member = data['family'][0]
    
    assert family_member['name'] == 'Trần Thị Thủy'
    assert family_member['dob'] == '1978'
    assert family_member['rel'] == 'Mẹ'
    assert family_member['job'] == 'Kinh doanh'

def test_tc_2_5_10_detailed_family_mapping(client):
    """[TC_2.5_10]: Verify data mapping of the detailed family member popup"""
    response = client.get(f'{STUDENT_API_URL}/24127158')
    data = response.get_json()
    
    family_member = data['family'][0]
    
    assert family_member['ethnic'] == 'Kinh'
    assert family_member['religion'] == 'Không'
    assert family_member['nationality'] == 'Việt Nam'
    assert family_member['province'] == 'Vĩnh Long'
    assert family_member['ward'] == 'Xã Tân Thủy'
    assert family_member['address'] == 'Xã Tân Thủy, Tỉnh Vĩnh Long'

def test_tc_2_5_11_family_null_handling(client):
    """[TC_2.5_11]: Verify UI handling of NULL values in detailed relative information"""
    response = client.get(f'{STUDENT_API_URL}/24127158')
    data = response.get_json()
    
    family_member = data['family'][0]
    
    # Cột MAIL của người thân này trong file conftest đang được set cứng là NULL
    assert family_member['email'] is None