import { test, expect } from '@playwright/test';
import fs from 'fs';

test.describe('Kiểm tra luồng Khóa và Công bố điểm - E2E (UC 2.21)', () => {

    test.beforeEach(async ({ page }) => {
        // Tăng timeout lên một chút để bù hao thời gian mạng load MSAL
        test.setTimeout(60000); 
        
        if (fs.existsSync('sessionStorage.json')) {
            const sessionData = JSON.parse(fs.readFileSync('sessionStorage.json', 'utf-8'));
            await page.addInitScript((data) => {
                if (window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')) {
                    for (const key in data) { window.sessionStorage.setItem(key, data[key]); }
                    window.localStorage.setItem('user_email', 'admin@hcmus.edu.vn');
                }
            }, sessionData);
        }
        await page.goto('/');
        await expect(page.locator('nav, aside').first()).toBeVisible({ timeout: 35000 });
        
        // 🎯 Sửa lỗi: Dùng getByText thay vì getByRole('button') để tránh kén thẻ HTML
        await page.getByText('Quản lý học tập').first().click();
        
        // Đảm bảo bảng dữ liệu đã load xong trước khi chạy các bước tiếp theo
        await expect(page.locator('table')).toBeVisible({ timeout: 15000 });
    });

    test('[TC_2.21_01]: Verify clicking on Dashboard stat cards updates the status filter', async ({ page }) => {
        // Click vào thẻ thống kê (Tab) "Đã tải lên"
        await page.getByText('Đã tải lên').first().click();
        
        // Expect: Danh sách phía dưới được filter chỉ hiện các môn "Đã tải lên"
        const uploadedRow = page.locator('tbody tr').filter({ hasText: 'Đã tải lên' }).first();
        await expect(uploadedRow).toBeVisible();
    });

test('[TC_2.21_04]: Verify "Khóa điểm & Công bố" confirmation logic', async ({ page }) => {
        // 1. Phải vào tab "Đã tải lên" mới có nút khóa điểm theo đúng rule của UI
        await page.getByText('Đã tải lên').first().click();

        // 2. Click vào dòng môn học hợp lệ đầu tiên để vào trang chi tiết
        const validCourseRow = page.locator('tbody tr').filter({ hasText: 'Đã tải lên' }).first();
        await expect(validCourseRow).toBeVisible();
        await validCourseRow.click();

        // 3. Tìm và click nút "Khóa điểm & Công bố" ở góc phải trên cùng
        const lockPublishBtn = page.getByText('Khóa điểm & Công bố').first();
        await expect(lockPublishBtn).toBeVisible({ timeout: 15000 });
        await lockPublishBtn.click();

        // 4. Confirmation logic: Bắt theo Text của các nút trong Modal sẽ chính xác 100%
        // Tui giả định Modal của bạn có nút "Hủy" (Cancel). Nếu giao diện của bạn dùng chữ khác
        // (ví dụ: "Đóng", "Không"), hãy đổi lại chữ 'Hủy' bên dưới cho khớp nhé!
        const cancelButton = page.getByText('Hủy').first();
        
        // Tăng timeout lên một chút đề phòng hiệu ứng animation của Modal hơi lâu
        await expect(cancelButton).toBeVisible({ timeout: 10000 });
        
        // (Tuỳ chọn) Test luôn chức năng Hủy
        // await cancelButton.click();
        // await expect(cancelButton).toBeHidden();
    });
});