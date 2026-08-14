import sqlite3
import os

db_path = "database/campus.db"
sql_path = "database/seed.sql"

# Tạo thư mục database nếu chưa có
os.makedirs(os.path.dirname(db_path), exist_ok=True)

print(f"Đang kết nối tới database: {db_path}...")
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print(f"Đang đọc và thực thi script từ: {sql_path}...")
with open(sql_path, "r", encoding="utf-8") as f:
    sql_script = f.read()

cursor.executescript(sql_script)
conn.commit()
conn.close()

print("Khởi tạo cơ sở dữ liệu và nạp dữ liệu mẫu thành công!")