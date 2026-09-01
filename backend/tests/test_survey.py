import pytest
from unittest.mock import patch

def test_get_surveys_api_structure(client):
    """
    [TC_2.10_01, TC_2.10_03, TC_2.10_04]: Xác minh API GET trả về danh sách khảo sát.
    Test này chỉ đọc dữ liệu gốc hiện có, đảm bảo trả về HTTP 200 và cấu trúc chuẩn 
    (chứa status, rating, comment) phục vụ cho Frontend hiển thị.
    """
    response = client.get('/api/students/24127158/surveys')
    data = response.get_json() or {}

    # Kiểm tra trạng thái HTTP và định dạng trả về chung
    assert response.status_code == 200, "API lấy khảo sát phải trả về HTTP 200"
    assert data.get('status') == 'success'
    assert isinstance(data.get('data'), list), "Dữ liệu khảo sát phải là một mảng"

    # Kiểm tra sâu vào cấu trúc dữ liệu nếu có khảo sát trong DB gốc
    surveys = data.get('data')
    if surveys:
        first_survey = surveys[0]
        assert 'id' in first_survey
        assert 'status' in first_survey
        assert first_survey['status'] in ['completed', 'pending'], "Trạng thái phải là completed hoặc pending"
        
        courses = first_survey.get('courses', [])
        if courses:
            first_course = courses[0]
            assert 'rating' in first_course, "Thiếu trường rating cho UI map dữ liệu"
            assert 'comment' in first_course, "Thiếu trường comment cho UI map dữ liệu"


@patch('app.routes.student_routes.db.session.commit')
@patch('app.routes.student_routes.db.session.add')
def test_submit_survey_success(mock_add, mock_commit, client):
    """
    [TC_2.10_07]: Kiểm tra API POST nộp khảo sát.
    Sử dụng mock db.session.commit và add để đi xuyên qua luồng code của route 
    mà không hề thay đổi Database gốc của ứng dụng.
    """
    # Payload mô phỏng dữ liệu Frontend gửi xuống
    payload = {
        "responses": {
            "CH01": {
                "rating": 5,
                "comment": "Giảng viên rất tận tâm, môn học thú vị."
            },
            "CH02": {
                "rating": 4,
                "comment": ""
            }
        }
    }
    
    # Gửi request lên route submit
    response = client.post('/api/students/24127158/surveys/KS01/submit', json=payload)
    data = response.get_json() or {}

    # Xác minh logic trả về
    assert response.status_code == 200, "API nộp khảo sát phải trả về HTTP 200"
    assert data.get('status') == 'success'
    assert "thành công" in data.get('message', '').lower()
    
    # Đảm bảo các hàm thêm dữ liệu và commit đã được kích hoạt trong luồng logic (bị mock chặn lại)
    assert mock_commit.called, "Luồng API thiếu lệnh db.session.commit()"