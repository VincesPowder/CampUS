from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS 
import os
from dotenv import load_dotenv

# 1. Đọc file .env
load_dotenv()

db = SQLAlchemy()

def create_app():
    app = Flask(__name__)
    
    # 2. CẤU HÌNH SECRET KEY
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'campus_secret_key_2026_hcmus_super_secret')
    
    # 3. CHO PHÉP CORS (Cả localhost và domain trên Render đều gọi API được)
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)
    
    # 4. KẾT NỐI DATABASE (ƯU TIÊN NEON.TECH, NẾU KHÔNG CÓ THÌ FALLBACK SQLITE)
    database_url = os.getenv('DATABASE_URL')
    if database_url:
        # Chuẩn hóa nếu link bắt đầu bằng postgres://
        if database_url.startswith("postgres://"):
            database_url = database_url.replace("postgres://", "postgresql://", 1)
        # Bỏ đuôi channel_binding nếu có để tránh lỗi psycopg2
        database_url = database_url.replace("&channel_binding=require", "").replace("?channel_binding=require", "")
        app.config['SQLALCHEMY_DATABASE_URI'] = database_url
        print(f"👉 Đang kết nối tới PostgreSQL: {database_url[:35]}...")
    else:
        # Fallback về SQLite ở máy local
        basedir = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
        db_path = os.path.join(basedir, 'database', 'campus.db')
        app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
        print(f"👉 Đang kết nối tới SQLite cục bộ: {db_path}")

    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    db.init_app(app)
    
    # Đăng ký Blueprints
    from app.routes.auth_routes import auth_bp
    app.register_blueprint(auth_bp)
    
    from app.routes.student_routes import student_bp
    app.register_blueprint(student_bp, url_prefix='/api/students')
    
    from app.routes.admin_routes import admin_bp
    app.register_blueprint(admin_bp)
    
    from app.routes.ai_routes import ai_bp
    app.register_blueprint(ai_bp)
    
    return app
