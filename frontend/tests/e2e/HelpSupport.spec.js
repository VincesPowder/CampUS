import { test, expect } from '@playwright/test';

test.describe('Kiểm tra chức năng Trợ giúp / Support Team - E2E (UC 2.27)', () => {

    test.beforeEach(async ({ page }) => {
        // Bypass Login
        await page.route('**/api/auth/ms-login', async route => {
            await route.fulfill({ status: 200, json: { token: 'fake', role: 'student' } });
        });

        // Mock trực tiếp API danh bạ từ Admin
        await page.route('**/api/admin/contacts', async route => {
            await route.fulfill({
                status: 200,
                json: {
                    status: 'success',
                    data: [
                        { label: "Phòng đào tạo", email: "daotao@hcmus.edu.vn", role: "Học vụ" },
                        { label: "Phòng kỹ thuật", email: "kythuat@hcmus.edu.vn", role: "Hỗ trợ" }
                    ]
                }
            });
        });

        await page.goto('http://localhost:5173/');
        const loginBtn = page.getByRole('button', { name: /Đăng nhập/i });
        if (await loginBtn.isVisible({ timeout: 2000 })) await loginBtn.click();

        // Chờ Header tải xong
        await expect(page.locator('header')).toBeVisible({ timeout: 15000 });
    });

    test('[TC_2.27_01 -> 04]: Mở dropdown, kiểm tra liên hệ và Click outside', async ({ page }) => {
        // [TC_01]: Xác định nút HelpButton trên Header (Bắt bằng title)
        const helpBtn = page.getByTitle('Liên hệ hỗ trợ');

        // Dropdown ban đầu chưa hiển thị
        await expect(page.getByText('Phòng đào tạo')).toBeHidden();

        // Click để mở Dropdown
        await helpBtn.click();

        // [TC_03]: Xác minh phòng ban xuất hiện dựa vào Mock
        await expect(page.getByText('Phòng đào tạo')).toBeVisible();
        await expect(page.getByText('Phòng kỹ thuật')).toBeVisible();

        // [TC_04]: Xác minh thuộc tính href trỏ đúng mailto:
        const mailLink = page.getByRole('link', { name: 'daotao@hcmus.edu.vn' });
        await expect(mailLink).toHaveAttribute('href', 'mailto:daotao@hcmus.edu.vn');

        // [TC_02]: Click Outside - Click vào nội dung chính (main) để đóng
        await page.locator('main').click();

        // Xác minh Dropdown đã bị đóng
        await expect(page.getByText('Phòng đào tạo')).toBeHidden();
    });
});