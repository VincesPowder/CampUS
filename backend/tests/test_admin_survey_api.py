import pytest
from unittest.mock import patch, MagicMock
from app import db
from app.models.survey import KhaoSat, CauHoiKhaoSat

def test_admin_api_create_and_get_survey(app, client):
    """
    [TC_2.24_02_BE & 04_BE]: Xác minh API Tạo khảo sát và API lấy thống kê kết quả.
    """
    with app.app_context():
        # Dọn dẹp rác
        KhaoSat.query.filter_by(maks='KS_TEST_999').delete()
        
        payload = {
            "title": "Khảo sát Kiểm thử Tự động",
            "description": "Mô tả khảo sát test",
            "deadline": "2026-12-31",
            "questions": [
                {"name": "Giảng viên dạy tốt không?", "type": "Đánh giá"},
                {"name": "Góp ý thêm", "type": "Tự luận"}
            ]
        }

        # Giả lập quyền SuperAdmin
        with patch('app.routes.admin_routes.get_current_admin') as mock_admin:
            mock_admin.return_value = MagicMock(vaitro='SuperAdmin', makhoa=None)
            
            # 1. Gọi API POST tạo khảo sát
            res_post = client.post('/api/admin/surveys', json=payload)
            assert res_post.status_code == 201
            assert res_post.json['status'] == 'success'
            
            maks_val = res_post.json['id']

            # 2. Gọi API GET lấy chi tiết thống kê kết quả
            res_get = client.get(f'/api/admin/surveys/{maks_val}')
            assert res_get.status_code == 200
            
            data = res_get.json['data']
            assert data['title'] == "Khảo sát Kiểm thử Tự động"
            assert len(data['questions']) == 2
            assert data['questions'][0]['content'] == "Giảng viên dạy tốt không?"