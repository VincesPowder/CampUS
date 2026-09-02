import pytest

def test_get_schedule_filters(client):
    """
    Kiểm tra API trả về dropdown lọc Học Kỳ / Năm Học.
    """
    response = client.get('/api/students/24127158/schedule/filters')
    data = response.get_json() or {}

    assert response.status_code == 200
    assert data.get('status') == 'success'
    assert isinstance(data.get('data'), list)

def test_get_weekly_schedule(client):
    """
    [TC_2.11_01_Backend]: Xác minh API GET trả về Thời khóa biểu Tuần chuẩn xác.
    """
    response = client.get('/api/students/24127158/schedule/weekly?ma_hocky=HK006&week=1')
    data = response.get_json() or {}

    assert response.status_code == 200
    assert data.get('status') == 'success'
    
    # Kiểm tra object cấu trúc ngày (days)
    schedule_data = data.get('data', {})
    assert 'days' in schedule_data
    assert isinstance(schedule_data['days'], dict)

def test_get_exam_schedule(client):
    """
    [TC_2.11_08_Backend]: Xác minh API GET trả về Lịch Thi với các trường dữ liệu cần thiết.
    """
    response = client.get('/api/students/24127158/schedule/exams?ma_hocky=HK006')
    data = response.get_json() or {}

    assert response.status_code == 200
    assert data.get('status') == 'success'
    
    exams = data.get('data', [])
    assert isinstance(exams, list)
    
    # Nếu trong Database test có lịch thi, kiểm tra mapping property
    if exams:
        first_exam = exams[0]
        assert 'tenmh' in first_exam
        assert 'exam_date' in first_exam
        assert 'room' in first_exam
        assert 'exam_format' in first_exam