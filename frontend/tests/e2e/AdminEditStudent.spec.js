import { test, expect } from '@playwright/test';

test.describe('Kiểm tra luồng Cập nhật hồ sơ sinh viên - E2E (UC 2.19)', () => {

    test.beforeEach(async ({ page }) => {
        await page.route('**/api/auth/ms-login', async route => {
            await route.fulfill({ status: 200, json: { token: 'fake', role: 'admin', user: { name: 'Admin' } } });
        });

        // Mock danh sách sinh viên
        const mockStudent = { mssv: '24127001', hoTen: 'Nguyễn Văn A', email: 'a@sv', gioiTinh: 'Nam', khoa: '2024', bacDT: 'ĐH', nganh: 'CNTT', loaiDT: 'CQ' };

        await page.route('**/api/admin/students', async route => {
            if (route.request().method() === 'GET') {
                await route.fulfill({ status: 200, json: { status: 'success', data: [mockStudent] } });
            } else {
                await route.continue();
            }
        });

        // Mock chi tiết và API PUT
        await page.route('**/api/admin/students/24127001', async route => {
            if (route.request().method() === 'GET') {
                await route.fulfill({ status: 200, json: { status: 'success', data: { ...mockStudent, family: [] } } });
            } else if (route.request().method() === 'PUT') {
                await route.fulfill({ status: 200, json: { status: 'success' } });
            }
        });

        await page.goto('http://localhost:5173/');
        const loginBtn = page.getByRole('button', { name: /Đăng nhập/i });
        if (await loginBtn.isVisible({ timeout: 2000 })) await loginBtn.click();

        await expect(page.locator('header')).toBeVisible({ timeout: 15000 });
    });

    test('[TC_2.19_01, 03, 04, 05]: Verify Edit Workflow and Cancel/Save Actions', async ({ page }) => {
        // Mở Modal
        await page.getByText('Nguyễn Văn A').click();
        await expect(page.getByText('Hồ sơ sinh viên')).toBeVisible();

        // [TC_01] Bấm Chỉnh sửa (SỬA: Thêm exact: true)
        await page.getByRole('button', { name: 'Chỉnh sửa', exact: true }).click();
        await expect(page.getByRole('button', { name: 'Lưu thay đổi' })).toBeVisible();

        // [TC_03] Nhập đổi tên
        const nameInput = page.locator('input[value="Nguyễn Văn A"]');
        await nameInput.fill('Nguyễn Văn Hủy');

        // [TC_04] Bấm Hủy, mở lại và xác minh chưa bị lưu
        await page.getByRole('button', { name: 'Huỷ', exact: true }).click();
        await expect(page.getByText('Nguyễn Văn Hủy')).toBeHidden();

        // Mở lại Edit mode (SỬA: Thêm exact: true)
        await page.getByRole('button', { name: 'Chỉnh sửa', exact: true }).click();
        await page.locator('input[value="Nguyễn Văn A"]').fill('Nguyễn Văn Đã Lưu');

        // [TC_05] Bấm Lưu thay đổi
        await page.getByRole('button', { name: 'Lưu thay đổi' }).click();

        // Xác minh UI trong Modal đã chuyển sang View mode và hiện tên mới
        await expect(page.getByRole('button', { name: 'Lưu thay đổi' })).toBeHidden();
        await expect(page.locator('.font-bold.text-white').filter({ hasText: 'Nguyễn Văn Đã Lưu' })).toBeVisible();

        // Đóng modal (nút X trên góc)
        await page.locator('button:has(svg.lucide-x)').click();

        // Xác minh tên mới đã được sync ra bảng danh sách ngoài cùng
        await expect(page.getByRole('cell', { name: 'Nguyễn Văn Đã Lưu' })).toBeVisible();
    });
});