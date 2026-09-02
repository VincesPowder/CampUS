from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS 
import os
from dotenv import load_dotenv

# 1. Đọc file .env
load_dotenv()

# 2. XỬ LÝ LỖI CHỮ HOA/CHỮ THƯỜNG CỦA POSTGRESQL (TỰ ĐỘNG CHUYỂN IDENTIFIER VỀ LOWERCASE)
try:
    from sqlalchemy.dialects.postgresql.base import PGIdentifierPreparer, PGDialect
    from sqlalchemy.dialects.postgresql.psycopg2 import PGDialect_psycopg2

    class CaseInsensitivePreparer(PGIdentifierPreparer):
        def quote_identifier(self, value):
            return f'"{str(value).lower()}"'

        def quote(self, ident, force=None):
            if ident:
                return f'"{str(ident).lower()}"'
            return '""'

    PGDialect.preparer = CaseInsensitivePreparer
    PGDialect_psycopg2.preparer = CaseInsensitivePreparer
except Exception as e:
    print(f"Warning patching preparer: {e}")

db = SQLAlchemy()

def create_app():
    app = Flask(__name__)
    
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'campus_secret_key_2026_hcmus_super_secret')
    
    # Cho phép CORS cho toàn bộ domain
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)
    
    # Kết nối Database Neon.tech
    database_url = os.getenv('DATABASE_URL')
    if database_url:
        if database_url.startswith("postgres://"):
            database_url = database_url.replace("postgres://", "postgresql://", 1)
        database_url = database_url.replace("&channel_binding=require", "").replace("?channel_binding=require", "")
        app.config['SQLALCHEMY_DATABASE_URI'] = database_url
    else:
        basedir = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
        db_path = os.path.join(basedir, 'database', 'campus.db')
        app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'

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
