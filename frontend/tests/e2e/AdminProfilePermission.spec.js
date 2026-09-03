import { test, expect } from '@playwright/test';

test.describe('Kiểm tra luồng Quản lý đợt cập nhật hồ sơ - E2E (UC 2.17)', () => {

    test.beforeEach(async ({ page }) => {
        await page.route('**/api/auth/ms-login', async route => {
            await route.fulfill({
                status: 200,
                json: { token: 'fake', role: 'admin', user: { name: 'Admin', email: 'admin@hcmus.edu.vn' } }
            });
        });

        // Mock dữ liệu danh sách sinh viên ban đầu
        await page.route('**/api/admin/students*', async route => {
            await route.fulfill({
                status: 200,
                json: {
                    status: 'success',
                    data: [
                        { mssv: '24127001', hoTen: 'Nguyễn Văn A', email: 'a@student.hcmus.edu.vn', gioiTinh: 'Nam', khoa: '2024', bacDT: 'Đại học', nganh: 'CNTT', loaiDT: 'Chính quy' }
                    ]
                }
            });
        });

        // Mock API quyền cập nhật
        await page.route('**/api/admin/profile-edit-permission', async route => {
            if (route.request().method() === 'GET') {
                await route.fulfill({
                    status: 200,
                    json: { status: 'success', data: { enabled: false, from: '', to: '', nganhs: [], khoas: [] } }
                });
            } else {
                await route.fulfill({ status: 200, json: { status: 'success', message: 'OK' } });
            }
        });

        await page.goto('http://127.0.0.1:5173/');
        const loginBtn = page.getByRole('button', { name: /Đăng nhập/i });
        if (await loginBtn.isVisible({ timeout: 2000 })) await loginBtn.click();

        await expect(page.locator('header')).toBeVisible({ timeout: 15000 });
    });

    test('[TC_2.17_01, 02, 03, 04]: Verify full permission cycle and active indicator', async ({ page }) => {
        // [TC_01]: Mở panel Quyền chỉnh sửa
        await page.getByRole('button', { name: /Quyền chỉnh sửa/i }).click();
        await expect(page.getByText('Quyền chỉnh sửa hồ sơ')).toBeVisible();
        await expect(page.getByText('Đang tắt')).toBeVisible();

        // [TC_02]: Bật toggle switch
        const switchBtn = page.locator('button:has(span.rounded-full.bg-white)').first();
        await switchBtn.click();
        await expect(page.getByText('Đang bật')).toBeVisible();

        // [TC_03]: Điền khoảng ngày bao trùm hôm nay
        const dateInputs = page.locator('input[type="date"]');
        await dateInputs.nth(0).fill('2020-01-01');
        await dateInputs.nth(1).fill('2030-12-31');

        // Xác minh banner xuất hiện
        await expect(page.getByText(/Sinh viên có thể chỉnh sửa hồ sơ từ 2020-01-01 đến 2030-12-31/i)).toBeVisible();

        // [TC_04]: Xác minh xuất hiện chấm xanh "Đang trong đợt chỉnh sửa" trên bảng sinh viên
        await expect(page.locator('span[title="Đang trong đợt chỉnh sửa"]')).toBeVisible();
    });
});