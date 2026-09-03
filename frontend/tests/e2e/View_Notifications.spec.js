import { test, expect } from '@playwright/test';

test.describe('Kiểm tra luồng Xem Thông Báo - E2E (UC 2.13)', () => {

    test.beforeEach(async ({ page }) => {
        // Mock API Login
        await page.route('**/api/auth/ms-login', async route => {
            await route.fulfill({ status: 200, json: { token: 'fake-jwt-token', role: 'student' } });
        });

        // Mock API trả về danh sách thông báo
        await page.route('**/api/students/*/notifications', async route => {
            await route.fulfill({
                status: 200, json: {
                    status: 'success',
                    data: [
                        { maTb: 'TB1', tieuDe: 'TB Chưa đọc', noiDung: 'Nội dung chi tiết thông báo số 1', trangThaiDoc: 0, khoa: 'Khoa CNTT', ngayDang: new Date().toISOString() },
                        { maTb: 'TB2', tieuDe: 'TB Đã đọc', noiDung: 'Nội dung 2', trangThaiDoc: 1, khoa: null, phong: 'Phòng Đào tạo', ngayDang: '2025-08-10' }
                    ]
                }
            });
        });

        await page.goto('http://localhost:5173/');

        // 1. Thao tác click nút Đăng nhập trên màn hình Login để vào hệ thống
        const loginBtn = page.getByRole('button', { name: /Đăng nhập/i });
        if (await loginBtn.isVisible({ timeout: 3000 })) {
            await loginBtn.click();
        }

        // 2. Chờ cho đến khi thẻ <header> của giao diện chính xuất hiện thành công
        await expect(page.locator('header')).toBeVisible({ timeout: 15000 });
    });

    test('[TC_2.13_01 & 02 & 03]: Đếm Badge chuông, Relative time Dropdown, và chuyển hướng Chi tiết', async ({ page }) => {
        const headerBellBtn = page.locator('header button:has(svg.lucide-bell)');

        // Xác minh Badge chứa số đếm unread là 1
        await expect(page.locator('header span.bg-destructive')).toHaveText('1', { timeout: 10000 });

        // Mở dropdown thông báo
        await headerBellBtn.click();
        await expect(page.getByText('Vừa xong').or(page.getByText(/phút trước/))).toBeVisible();

        // Click vào thông báo trong dropdown để xem nội dung
        await page.getByText('TB Chưa đọc').click();

        // Kiểm tra nội dung chi tiết hiển thị đúng
        await expect(page.getByText('Nội dung chi tiết thông báo số 1')).toBeVisible();
    });

    test('[TC_2.13_06]: Xác minh gọi API đánh dấu đã đọc (Mark as Read)', async ({ page }) => {
        let isPostRequestFired = false;

        await page.route('**/api/students/*/notifications/TB1/read', async route => {
            isPostRequestFired = true;
            await route.fulfill({ status: 200, json: { status: 'success' } });
        });

        const headerBellBtn = page.locator('header button:has(svg.lucide-bell)');
        await headerBellBtn.click();

        // Click thông báo từ dropdown để kích hoạt hành động đọc
        await page.getByText('TB Chưa đọc').click();

        // Đảm bảo request POST /read đã được gửi đi tới backend
        await page.waitForTimeout(500);
        expect(isPostRequestFired).toBeTruthy();

        // Kiểm tra badge đếm số lượng trên chuông đã biến mất
        await expect(page.locator('header span.bg-destructive')).toBeHidden();
    });
});