from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS # Thêm dòng này

db = SQLAlchemy()

def create_app():
    app = Flask(__name__)
    
    # Cho phép Frontend (localhost:5173) gọi API thoải mái
    CORS(app, resources={r"/api/*": {"origins": "http://localhost:5173"}})
    
    # app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///instances/campus.db'
    # app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # db.init_app(app)
    
    # # Tạo database nếu chưa có (Chạy 1 lần đầu tiên)
    # with app.app_context():
    #     from app.models.user import User
    #     db.create_all()
    
    # Đăng ký Blueprints
    from app.routes.auth_routes import auth_bp
    app.register_blueprint(auth_bp)
    
    return app