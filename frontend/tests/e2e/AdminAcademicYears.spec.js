import { test, expect } from '@playwright/test';

test.describe('Kiểm tra luồng Quản lý Năm học - E2E (UC 2.15)', () => {

    test.beforeEach(async ({ page }) => {
        await page.route('**/api/auth/ms-login', async route => {
            await route.fulfill({ status: 200, json: { token: 'fake', role: 'admin', user: { name: 'Admin', email: 'admin@hcmus.edu.vn' } } });
        });

        // Trả về danh sách rỗng ban đầu
        await page.route('**/api/admin/academic/years', async route => {
            if (route.request().method() === 'GET') {
                await route.fulfill({ status: 200, json: { status: 'success', data: [] } });
            } else if (route.request().method() === 'POST') {
                await route.fulfill({ status: 201, json: { status: 'success' } });
            }
        });
        await page.route('**/api/admin/academic/courses*', async route => {
            await route.fulfill({ status: 200, json: { status: 'success', data: [] } });
        });

        await page.goto('http://localhost:5173/');
        const loginBtn = page.getByRole('button', { name: /Đăng nhập/i });
        if (await loginBtn.isVisible({ timeout: 2000 })) await loginBtn.click();

        await expect(page.locator('header')).toBeVisible({ timeout: 15000 });

        // Điều hướng
        await page.locator('aside').getByRole('button', { name: 'Quản lý học tập' }).click();
        await page.getByRole('button', { name: 'Năm học' }).click();
    });

    test('[TC_2.15_03]: Verify successful creation of a new academic year', async ({ page }) => {
        await page.getByRole('button', { name: 'Thêm năm học' }).click();
        await expect(page.getByText('Thêm năm học mới')).toBeVisible();

        // Nhập thông tin
        const inputs = page.locator('input[type="number"]');
        await inputs.first().fill('2028'); // Đổi thành 2028

        // Nhập ngày
        await page.getByPlaceholder('VD: 01/09/2026').fill('05/09/2028');
        await page.getByPlaceholder('VD: 31/08/2027').fill('31/08/2029');

        // Mock lại API GET để trả về năm học vừa tạo
        await page.route('**/api/admin/academic/years', async route => {
            if (route.request().method() === 'GET') {
                await route.fulfill({
                    status: 200, json: {
                        status: 'success', data: [{
                            id: '28-29', label: '2028–2029', status: 'open', soHocKy: 3
                        }]
                    }
                });
            } else {
                await route.continue();
            }
        });

        // SỬA Ở ĐÂY: Thêm .first() để phân biệt nút lưu trong Modal với nút ở ngoài màn hình
        await page.getByRole('button', { name: 'Thêm năm học', exact: true }).first().click();

        // Xác minh Modal đóng và dữ liệu mới xuất hiện trên Grid
        await expect(page.getByText('Thêm năm học mới')).toBeHidden();
        await expect(page.getByRole('cell', { name: '2028–2029' })).toBeVisible();
        await expect(page.getByRole('cell', { name: '28-29' })).toBeVisible();
    });
});