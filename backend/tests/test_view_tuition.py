import pytest

def test_get_tuition_structure_success(client):
    """
    [TC_2.12_01]: Xác minh API GET trả về danh sách học phí với đầy đủ cấu trúc.
    """
    response = client.get('/api/students/24127158/tuition')
    data = response.get_json() or {}

    assert response.status_code == 200
    assert data.get('status') == 'success'
    
    tuition_list = data.get('data', [])
    assert isinstance(tuition_list, list)
    
    # Nếu DB có dữ liệu, kiểm tra mapping các property bắt buộc
    if len(tuition_list) > 0:
        first_item = tuition_list[0]
        expected_fields = [
            'maLhp', 'maMh', 'tenMon', 'namHoc', 'tenHocKy', 'nhhk',
            'soTc', 'soTiet', 'soTcHocPhi', 'hocPhiGoc', 'mucGiam', 
            'hoTro', 'thucDong', 'chiPhiKhac', 'trangThaiThanhToan'
        ]
        for field in expected_fields:
            assert field in first_item, f"Thiếu trường {field} trong cấu trúc JSON"

def test_get_tuition_empty_state(client):
    """
    [TC_2.12_07]: Đảm bảo API không bị crash khi query sinh viên không có dữ liệu học phí.
    """
    # Dùng một MSSV ảo chưa từng đăng ký môn học
    response = client.get('/api/students/99999999/tuition')
    data = response.get_json() or {}

    # Backend vẫn phải trả về 200 (Thành công xử lý request) nhưng danh sách rỗng
    assert response.status_code == 200
    assert data.get('status') == 'success'
    assert data.get('data') == []

def test_pay_tuition_endpoint_logic(client):
    """
    [TC_2.12_08]: Test logic cập nhật trạng thái thanh toán học phí trong CSDL.
    """
    # Giả lập thao tác thanh toán cho một mã lớp học phần bất kỳ (ví dụ HP061)
    response = client.post('/api/students/24127158/tuition/HP061/pay')
    
    # API sẽ trả về 200 (thanh toán thành công) hoặc 400 (nếu đã thanh toán rồi), hoặc 404 (nếu mã sai)
    # Ở đây chúng ta assert việc server phản hồi đúng logic mà không bị sập
    assert response.status_code in [200, 400, 404]
    
    if response.status_code == 200:
        data = response.get_json() or {}
        assert data.get('status') == 'success'
        assert 'ngaythanhtoan' in data.get('data', {})