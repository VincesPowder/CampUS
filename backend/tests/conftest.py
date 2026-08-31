import pytest
import sqlite3
import os
import sys

# --- SETUP ĐƯỜNG DẪN ROOT BACKEND ---
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app import create_app

@pytest.fixture(scope="session")
def app():
    """Tạo phiên bản Flask App cho test"""
    app = create_app()
    app.config.update({
        "TESTING": True,
    })
    yield app

@pytest.fixture()
def client(app):
    return app.test_client()

@pytest.fixture(autouse=True)
def mock_db_path(monkeypatch, tmp_path):
    """
    Tạo DB riêng biệt cho MỖI test case bằng cách TỰ ĐỘNG ĐỌC FILE SQL GỐC.
    """
    test_db_path = str(tmp_path / "test_campus_temp.db")
    
    # 1. Đường dẫn tới 2 file SQL gốc trong thư mục database
    schema_path = os.path.join(backend_dir, 'database', 'campus.sql')
    seed_path = os.path.join(backend_dir, 'database', 'seed.sql')

    # 2. Mở kết nối DB nháp
    conn = sqlite3.connect(test_db_path)
    cursor = conn.cursor()
    
    try:
        # 3. Đọc và thực thi file TẠO BẢNG (campus.sql)
        with open(schema_path, 'r', encoding='utf-8') as f:
            cursor.executescript(f.read())

        # 4. Đọc và thực thi file BƠM DỮ LIỆU (seed.sql)
        with open(seed_path, 'r', encoding='utf-8') as f:
            cursor.executescript(f.read())
            
    except Exception as e:
        print(f"\nLỗi khi đọc file SQL: {e}")
        print("Hãy chắc chắn rằng bạn đã lưu nội dung Tạo Bảng vào 'database/campus.sql' và nội dung Insert vào 'database/seed.sql'")
        raise e

    # 5. Lưu thay đổi và đóng kết nối
    conn.commit()
    conn.close()

    # 6. ÉP CODE GỐC ĐỌC FILE NHÁP NÀY
    # (Đảm bảo đường dẫn này khớp với chỗ khai báo DB_PATH trong code Flask của bạn)
    # Import các file route để kiểm tra xem file nào có biến DB_PATH
    import app.routes.auth_routes
    import app.routes.student_routes
    import app.routes.admin_routes
    import app.routes.ai_routes

    # Nếu file route nào có khai báo DB_PATH, tự động trỏ nó về DB nháp
    if hasattr(app.routes.auth_routes, 'DB_PATH'):
        monkeypatch.setattr(app.routes.auth_routes, 'DB_PATH', test_db_path)
        
    if hasattr(app.routes.student_routes, 'DB_PATH'):
        monkeypatch.setattr(app.routes.student_routes, 'DB_PATH', test_db_path)
        
    if hasattr(app.routes.admin_routes, 'DB_PATH'):
        monkeypatch.setattr(app.routes.admin_routes, 'DB_PATH', test_db_path)
        
    if hasattr(app.routes.ai_routes, 'DB_PATH'):
        monkeypatch.setattr(app.routes.ai_routes, 'DB_PATH', test_db_path)
    
    yield