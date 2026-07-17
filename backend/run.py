from app import create_app

# Khởi tạo ứng dụng Flask từ hàm create_app trong app/__init__.py
app = create_app()

if __name__ == '__main__':
    # Chạy server ở chế độ debug, lắng nghe ở cổng 5000
    app.run(debug=True, host='127.0.0.1', port=5000)