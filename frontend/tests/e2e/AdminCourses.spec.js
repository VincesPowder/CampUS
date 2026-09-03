import { test, expect } from '@playwright/test';

test.describe('Kiểm tra luồng Quản lý Môn học - E2E (UC 2.16)', () => {

    test.beforeEach(async ({ page }) => {
        await page.route('**/api/auth/ms-login', async route => {
            await route.fulfill({ status: 200, json: { token: 'fake', role: 'admin', user: { name: 'Admin', email: 'admin@hcmus.edu.vn' } } });
        });

        // Trả về mock data cho Năm học để có chỗ drill-down
        await page.route('**/api/admin/academic/years', async route => {
            await route.fulfill({
                status: 200, json: {
                    status: 'success', data: [{
                        id: '25-26', label: '2025–2026', status: 'open', soHocKy: 3
                    }]
                }
            });
        });

        // Trả về mock data trống cho môn học
        await page.route('**/api/admin/academic/courses*', async route => {
            if (route.request().method() === 'GET') {
                await route.fulfill({ status: 200, json: { status: 'success', data: [] } });
            } else if (route.request().method() === 'POST') {
                await route.fulfill({ status: 201, json: { status: 'success' } });
            }
        });

        await page.goto('http://localhost:5173/');
        const loginBtn = page.getByRole('button', { name: /Đăng nhập/i });
        if (await loginBtn.isVisible({ timeout: 2000 })) await loginBtn.click();

        await expect(page.locator('header')).toBeVisible({ timeout: 15000 });

        // Điều hướng
        await page.locator('aside').getByRole('button', { name: 'Quản lý học tập' }).click();
    });

    test('[TC_2.16_05]: Verify successful submission of a new course into the catalog', async ({ page }) => {
        // Chuyển sang Tab Năm Học và bấm vào Năm 25-26
        await page.getByRole('button', { name: 'Năm học' }).click();
        await page.getByText('2025–2026').click();

        // Bấm Thêm môn học
        await page.getByRole('button', { name: 'Thêm môn học' }).click();

        // Điền form
        await page.getByPlaceholder('VD: CSC10006').fill('ENG101');
        await page.getByPlaceholder('VD: Cơ sở dữ liệu').fill('Tiếng Anh Cơ Bản');
        await page.getByPlaceholder('VD: 24C07').fill('24E01');

        // Sửa Mock API: Phải mock lại CẢ lệnh POST thành công, nếu không UI sẽ báo lỗi và không gọi lại lệnh GET!
        await page.route('**/api/admin/academic/courses*', async route => {
            if (route.request().method() === 'GET') {
                await route.fulfill({
                    status: 200, json: {
                        status: 'success', data: [
                            { id: 'LHP_ENG', maMon: 'ENG101', tenMon: 'Tiếng Anh Cơ Bản', lop: '24E01', soTC: 3, khoa: 'Ngoại Ngữ', status: 'pending', hocKy: 1, namHoc: '25-26' }
                        ]
                    }
                });
            } else if (route.request().method() === 'POST') {
                // SỬA Ở ĐÂY: Trả về thành công thay vì route.continue()
                await route.fulfill({ status: 201, json: { status: 'success' } });
            }
        });

        // Bấm Submit (Dùng .first() vì Modal render trước Toolbar nên nút Submit của modal mang số thứ tự đầu tiên)
        await page.getByRole('button', { name: 'Thêm môn học', exact: true }).first().click();

        // Xác minh Modal đóng và Môn học mới hiển thị trên Grid
        await expect(page.getByText('Thêm môn học vào năm học')).toBeHidden();
        await expect(page.getByRole('cell', { name: 'ENG101' })).toBeVisible();
        await expect(page.getByRole('cell', { name: 'Tiếng Anh Cơ Bản' })).toBeVisible();
    });
});