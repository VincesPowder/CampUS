import { test, expect } from '@playwright/test';

test.describe('Kiểm tra hiển thị Khoa/Ngành - E2E (UC 2.14)', () => {

    test.beforeEach(async ({ page }) => {
        await page.route('**/api/auth/ms-login', async route => {
            await route.fulfill({ status: 200, json: { token: 'fake', role: 'admin', user: { name: 'Admin', email: 'admin@hcmus.edu.vn' } } });
        });

        await page.route('**/api/admin/students*', async route => {
            await route.fulfill({
                status: 200, json: {
                    status: 'success', data: [
                        { mssv: '24127000', hoTen: 'Trần C', nganh: 'Toán học', bacDT: 'Đại học', loaiDT: 'Chính quy' }
                    ]
                }
            });
        });

        await page.goto('http://127.0.0.1:5173/');
        const loginBtn = page.getByRole('button', { name: /Đăng nhập/i });
        if (await loginBtn.isVisible({ timeout: 2000 })) await loginBtn.click();

        await expect(page.locator('header')).toBeVisible({ timeout: 15000 });
    });

    test('[TC_2.14_01]: Kiểm tra hiển thị Ngành/Khoa trên Grid và Dropdown', async ({ page }) => {
        // Table cell hiển thị đúng ngành
        await expect(page.getByRole('cell', { name: 'Toán học' })).toBeVisible();

        // Mở bộ lọc
        await page.getByRole('button', { name: 'Bộ lọc' }).click();

        // Chọn option Toán học trong dropdown
        const selects = page.locator('select');
        await selects.nth(1).selectOption('Toán học');

        // Lọc thành công, sinh viên vẫn hiển thị
        await expect(page.getByRole('cell', { name: 'Trần C' })).toBeVisible();
    });
});