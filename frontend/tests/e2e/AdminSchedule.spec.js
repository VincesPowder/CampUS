import { test, expect } from '@playwright/test';

test.describe('Kiểm tra luồng Lịch học / thi - E2E (UC 2.22)', () => {

    test.beforeEach(async ({ page }) => {
        await page.route('**/api/auth/ms-login', async route => {
            await route.fulfill({ status: 200, json: { token: 'fake', role: 'admin', user: { name: 'Admin' } } });
        });

        await page.route('**/api/admin/schedule/classes*', async route => {
            await route.fulfill({ status: 200, json: { status: 'success', data: [] } });
        });

        await page.route('**/api/admin/schedule/exams*', async route => {
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
        await page.locator('aside').getByRole('button', { name: 'Lịch học / thi' }).click();
    });

    test('[TC_2.22_01, 02, 04]: View switching, Exam Auto-populate and Submit', async ({ page }) => {
        // [TC_01] Chuyển sang Tab Lịch thi
        await page.getByRole('button', { name: 'Lịch thi' }).click();

        // Mở Modal Thêm lịch thi
        await page.getByRole('button', { name: 'Thêm lịch thi' }).click();

        // SỬA Ở ĐÂY: Thêm .first() để tránh Playwright bối rối giữa tiêu đề Modal và các nút bấm
        await expect(page.getByText('Thêm lịch thi').first()).toBeVisible();

        // [TC_02] Test Auto Field Population (Đổi Ca thi)
        // Dùng combo box Ca thi
        await page.locator('select').nth(1).selectOption('Ca 3');

        // Giờ thi tương ứng của Ca 3 trong code hiện tại là 13:30 – 17:10 (dùng cho cả Class và Exam để mapping base)
        // Verify input "Giờ thi" tự động đổi thành "13:30 – 17:10"
        await expect(page.locator('input[value="13:30 – 17:10"]')).toBeVisible();

        // Điền Tên môn
        await page.getByPlaceholder('Nhập tên môn học...').fill('Kiểm thử phần mềm');

        // Đổi Mock API GET để sau khi Save thành công, Lưới hiển thị ra dữ liệu mới
        await page.route('**/api/admin/schedule/exams*', async route => {
            if (route.request().method() === 'GET') {
                await route.fulfill({
                    status: 200, json: {
                        status: 'success', data: [
                            { id: 'E_NEW', tenMon: 'Kiểm thử phần mềm', maNhom: '24C', ngayThi: '10/10/2026', thu: 'Thứ hai', ca: 'Ca 3', gio: '13:30 – 17:10', thoiGian: '90', phong: 'C42', soThi: 45, hinhThuc: 'Tự luận' }
                        ]
                    }
                });
            } else {
                await route.continue();
            }
        });

        // [TC_04] Bấm nút Thêm lịch thi bên trong Modal (Dùng .first() để tránh Strict Mode)
        await page.getByRole('button', { name: 'Thêm lịch thi', exact: true }).first().click();

        // Modal đóng và hiển thị Kiểm thử phần mềm
        await expect(page.getByRole('cell', { name: 'Kiểm thử phần mềm' })).toBeVisible();
        await expect(page.getByRole('cell', { name: 'Ca 3' })).toBeVisible();
    });
});