import { test, expect } from '@playwright/test';

test.describe('Kiểm tra luồng Admin Quản lý Học phí - E2E (UC 2.23)', () => {

    test.beforeEach(async ({ page }) => {
        // Mock Login
        await page.route('**/api/auth/ms-login', async route => {
            await route.fulfill({ status: 200, json: { token: 'fake', role: 'admin', user: { name: 'Admin', email: 'admin@hcmus.edu.vn' } } });
        });

        // Mock API
        await page.route('**/api/admin/tuition/stats', async route => {
            await route.fulfill({ status: 200, json: { status: 'success', data: { totalDue: 100, totalPaid: 0, totalDebt: 100, totalStudents: 1, paidStudents: 0, completionRate: 0 } } });
        });
        await page.route('**/api/admin/tuition/students*', async route => {
            await route.fulfill({
                status: 200, json: {
                    status: 'success', data: [{
                        mssv: '24127001', hoTen: 'Nguyễn Văn E2E', lop: '24C', soMon: 1, tongTC: 4, hocPhiGoc: 100, mucGiam: 0, thucDong: 100, trangThai: 'Chưa thanh toán', ngayThanhToan: null, items: []
                    }]
                }
            });
        });
        await page.route('**/api/admin/tuition/students/*/pay', async route => {
            await route.fulfill({ status: 200, json: { status: 'success' } });
        });

        await page.goto('http://127.0.0.1:5173/');
        const loginBtn = page.getByRole('button', { name: /Đăng nhập/i });
        if (await loginBtn.isVisible({ timeout: 2000 })) await loginBtn.click();

        await expect(page.locator('header')).toBeVisible({ timeout: 15000 });
        // Vào Quản lý Học phí
        await page.locator('aside').getByRole('button', { name: 'Học phí' }).click();
        await expect(page.getByText('Tổng học phí phải thu')).toBeVisible();
    });

    test('[TC_2.23_02]: Verify Status and Search filtering logic', async ({ page }) => {
        // Bấm filter Chưa thanh toán
        await page.getByRole('button', { name: 'Chưa thanh toán' }).click();

        // Tìm MSSV
        await page.getByPlaceholder('Tìm kiếm MSSV, tên sinh viên...').fill('24127001');
        await expect(page.getByText('Nguyễn Văn E2E')).toBeVisible();
    });

    test('[TC_2.23_05]: Verify "Thu tiền" (Confirm Pay All) execution', async ({ page }) => {
        page.on('dialog', async dialog => {
            expect(dialog.message()).toContain('Xác nhận thu toàn bộ học phí');
            await dialog.accept();
        });

        // Bấm nút Thu tiền
        const payBtn = page.getByRole('button', { name: 'Thu tiền' });
        await payBtn.click();

        // Vì API đã trả mock success, giao diện sẽ reload lại (fetchTuitionData)
        await expect(page.getByText('Nguyễn Văn E2E')).toBeVisible();
    });
});