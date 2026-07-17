# CampUS 

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-07405E?style=for-the-badge&logo=sqlite&logoColor=white)

Dự án **CampUS** là một hệ thống web toàn diện, hỗ trợ sinh viên và quản trị viên nhà trường trong việc theo dõi tiến độ học tập, hồ sơ cá nhân, học phí, lịch học/thi và xử lý các nghiệp vụ nội bộ. Hệ thống được tích hợp Trí tuệ Nhân tạo (AI) để hỗ trợ tư vấn (Chatbot) và gợi ý học tập.

---

## Yêu cầu hệ thống

Trước khi khởi chạy dự án, hãy đảm bảo máy tính của bạn đã được cài đặt các phần mềm sau:

1. **[Node.js](https://nodejs.org/en/)** (Phiên bản 18.x trở lên)
2. **[pnpm](https://pnpm.io/)** (Trình quản lý gói cho Frontend - Cài đặt thông qua lệnh: `npm install -g pnpm`)
3. **[Python](https://www.python.org/downloads/)** (Phiên bản 3.8 - 3.11)
4. **[Git](https://git-scm.com/)**

---

## Hướng dẫn Cài đặt & Khởi chạy chi tiết

Dự án được chia làm 2 phần độc lập: **Backend** và **Frontend**. Bạn cần khởi chạy Backend trước, sau đó mới chạy Frontend.

### Phần 1: Thiết lập Backend (Python / Flask)

1. Mở Terminal / Command Prompt và di chuyển vào thư mục `backend`:
   ```bash
   cd backend
   ```
2. Tạo môi trường ảo (Virtual Environment) để chứa các thư viện:
   ```bash
   python -m venv venv
   ```
3. Kích hoạt môi trường ảo:
   - **Trên Windows:** 
     ```bash
     venv\Scripts\activate
     ```
   - **Trên macOS / Linux:** 
     ```bash
     source venv/bin/activate
     ```
4. Cài đặt các thư viện phụ thuộc:
   ```bash
   pip install -r requirements.txt
   ```
5. *(Tùy chọn)* Khởi tạo cơ sở dữ liệu và dữ liệu mẫu (Mock data):
   ```bash
   python app/services/mock_data/seed.py
   ```
6. Khởi chạy server Backend:
   ```bash
   python run.py
   ```
   *Terminal sẽ hiện thông báo Backend đang chạy tại: `http://127.0.0.1:5000`*

### Phần 2: Thiết lập Frontend (React / Vite)

1. Mở **thêm một cửa sổ Terminal mới** và di chuyển vào thư mục `frontend`:
   ```bash
   cd frontend
   ```
2. Cài đặt các gói thư viện bằng pnpm:
   ```bash
   pnpm install
   ```
3. Khởi chạy giao diện Frontend:
   ```bash
   pnpm dev
   ```
   *Frontend sẽ sẵn sàng tại địa chỉ: `http://localhost:5173`*

---

## Cấu hình Biến môi trường (.env)

Nếu hệ thống yêu cầu kết nối với Microsoft MSAL (Login bằng email nhà trường) hoặc API Trí tuệ Nhân tạo (Generative AI), bạn cần sao chép các file `.env.example` thành `.env` và điền key thích hợp.

**1. Thư mục `frontend/` (Tạo file `.env`):**
```env
# URL kết nối Backend
VITE_API_URL=http://127.0.0.1:5000/api

# Cấu hình MSAL (Microsoft Authentication)
VITE_MSAL_CLIENT_ID=your_client_id_here
VITE_MSAL_TENANT_ID=your_tenant_id_here
```

**2. Thư mục `backend/` (Tạo file `.env`):**
```env
FLASK_ENV=development
SECRET_KEY=your_super_secret_key_campus

# API Key cho các tính năng AI (Chatbox, Recommender)
GEMINI_API_KEY=your_google_gemini_api_key_here
```

---

## Cấu trúc Thư mục Dự án

```text
CampUS/
├── backend/                       # Mã nguồn Backend (Flask)
│   ├── app/
│   │   ├── instances/campus.db    # Cơ sở dữ liệu SQLite
│   │   ├── models/                # Định nghĩa các bảng Database
│   │   ├── routes/                # Các Endpoints API (auth, users, ai...)
│   │   └── services/              # Logic xử lý (AI chatbot, recommender)
│   ├── requirements.txt           # Danh sách các thư viện Python
│   └── run.py                     # File khởi động Backend
│
└── frontend/                      # Mã nguồn Frontend (React/Vite)
    ├── src/
    │   ├── app/                   # Các màn hình, UI Components, MSAL config
    │   ├── data/                  # Dữ liệu Mock
    │   └── styles/                # Cấu hình Tailwind CSS, PostCSS
    ├── index.html
    ├── package.json               # Cấu hình thư viện Node.js
    └── postcss.config.mjs         # Cấu hình PostCSS (Tailwind v4)
```

## Hỗ trợ & Khắc phục lỗi thường gặp
- **Lỗi `Cannot find module 'autoprefixer'` ở Frontend:** Chạy lệnh `pnpm add -D autoprefixer @tailwindcss/postcss` trong thư mục frontend.
- **Lỗi không đăng nhập được Microsoft:** Đảm bảo sử dụng đúng tài khoản email nội bộ (VD: `@student.hcmus.edu.vn`) và đã cấu hình MSAL hợp lệ.
- **Lỗi Port 5000 / 5173 đã được sử dụng:** Hãy tắt các terminal đang chạy ngầm hoặc khởi động lại máy tính.

---
*Developed by Group 3 - AMONG US*