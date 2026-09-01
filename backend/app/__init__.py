from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS 
import os
from dotenv import load_dotenv

# 1. GỌI HÀM NÀY ĐỂ MÁY ĐỌC FILE .env
load_dotenv()

db = SQLAlchemy()

def create_app():
    app = Flask(__name__)
    
    # Cho phép Frontend (localhost:5173) gọi API thoải mái
    CORS(app, resources={r"/api/*": {"origins": "http://localhost:5173"}})
    
    # 2. ÉP FLASK ĐỌC ĐÚNG FILE DB CỦA BẠN (DÙNG ĐƯỜNG DẪN TUYỆT ĐỐI)
    basedir = os.path.abspath(os.path.dirname(os.path.dirname(__file__))) # Trỏ ra thư mục backend/
    db_path = os.path.join(basedir, 'database', 'campus.db')              # Nối với thư mục database/
    
    # Đọc từ .env, nếu không có thì dùng đường dẫn tuyệt đối vừa tạo
    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    db.init_app(app)
    
    # Đăng ký Blueprints
    from app.routes.auth_routes import auth_bp
    app.register_blueprint(auth_bp)
    
    # 3. THÊM DÒNG NÀY ĐỂ ĐĂNG KÝ CÁC API CỦA PROFILE (UC 2.5, 2.6)
    from app.routes.student_routes import student_bp
    app.register_blueprint(student_bp, url_prefix='/api/students')
    
    from app.routes.admin_routes import admin_bp
    app.register_blueprint(admin_bp)
    
    # 4. ĐĂNG KÝ BLUEPRINT CHO CHATBOT AI (Đã thêm để tránh lỗi 404)
    from app.routes.ai_routes import ai_bp
    app.register_blueprint(ai_bp)
    
    return app