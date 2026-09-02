// @ts-check
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Thư mục chứa các file test e2e của bạn
  testDir: './tests/e2e',

  // Khai báo file chạy ngầm để lấy trạng thái đăng nhập thủ công
  globalSetup: './global-setup.js',

  /* ĐÃ SỬA THÀNH FALSE: Chạy lần lượt từng bài test để dễ quan sát */
  fullyParallel: false,

  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,

  /* ĐÃ SỬA THÀNH 1: Chỉ cho phép mở 1 cửa sổ trình duyệt (1 worker) */
  workers: 1,

  reporter: 'html',

  use: {
    /* Base URL để dùng trong các lệnh await page.goto('') */
    baseURL: 'http://localhost:5173',

    /* Tái sử dụng file Cookie/Local Storage từ globalSetup cho mọi test case */
    storageState: 'auth.json',

    /* Đang để false để bạn có thể nhìn thấy trình duyệt chạy (sau này muốn chạy ngầm thì đổi thành true) */
    headless: false,

    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});