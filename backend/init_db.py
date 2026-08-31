import sqlite3
import os

db_path = "database/campus.db"
schema_path = "database/campus.sql"
seed_path = "database/seed.sql"      

# 1. Xóa file database cũ nếu đã tồn tại
if os.path.exists(db_path):
    os.remove(db_path)
    print(f"Đã xóa database cũ: {db_path}...")

# 2. Tạo thư mục database nếu chưa có
os.makedirs(os.path.dirname(db_path), exist_ok=True)

print(f"Đang kết nối tới database mới: {db_path}...")
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# 3. Đọc và thực thi file campus.sql để TẠO BẢNG
print(f"Đang tạo cấu trúc các bảng từ: {schema_path}...")
with open(schema_path, "r", encoding="utf-8") as f:
    schema_script = f.read()
cursor.executescript(schema_script)

# 4. Đọc và thực thi file seed.sql để NẠP DỮ LIỆU
print(f"Đang nạp dữ liệu mẫu từ: {seed_path}...")
with open(seed_path, "r", encoding="utf-8") as f:
    seed_script = f.read()
cursor.executescript(seed_script)

conn.commit()
conn.close()

print("Khởi tạo cấu trúc và nạp dữ liệu mẫu thành công!")