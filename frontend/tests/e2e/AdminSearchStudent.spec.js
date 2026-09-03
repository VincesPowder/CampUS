import { test, expect } from '@playwright/test';

test.describe('Kiểm tra luồng Tìm kiếm Danh bạ Sinh viên - E2E (UC 2.18)', () => {

    test.beforeEach(async ({ page }) => {
        await page.route('**/api/auth/ms-login', async route => {
            await route.fulfill({ status: 200, json: { token: 'fake', role: 'admin', user: { name: 'Admin' } } });
        });

        // Mock danh sách sinh viên
        const mockStudents = [
            { mssv: '24127001', hoTen: 'Nguyễn Văn A', email: 'a@sv', gioiTinh: 'Nam', khoa: '2024', bacDT: 'ĐH', nganh: 'CNTT', loaiDT: 'CQ' },
            { mssv: '23127002', hoTen: 'Trần Thị B', email: 'b@sv', gioiTinh: 'Nữ', khoa: '2023', bacDT: 'ĐH', nganh: 'Hóa học', loaiDT: 'CQ' }
        ];

        await page.route('**/api/admin/students', async route => {
            await route.fulfill({ status: 200, json: { status: 'success', data: mockStudents } });
        });

        // Mock chi tiết 1 sinh viên khi mở Modal
        await page.route('**/api/admin/students/24127001', async route => {
            await route.fulfill({ status: 200, json: { status: 'success', data: { ...mockStudents[0], family: [] } } });
        });

        await page.goto('http://localhost:5173/');
        const loginBtn = page.getByRole('button', { name: /Đăng nhập/i });
        if (await loginBtn.isVisible({ timeout: 2000 })) await loginBtn.click();

        await expect(page.locator('header')).toBeVisible({ timeout: 15000 });
        // Quản lý sinh viên là tab mặc định nên không cần bấm
    });

    test('[TC_2.18_01, 02, 03]: Verify Search and Filtering logic', async ({ page }) => {
        // [TC_01] Tìm kiếm nhanh
        await page.getByPlaceholder('Tìm kiếm theo tên, MSSV, email...').fill('Nguyễn Văn A');
        await expect(page.getByRole('cell', { name: 'Nguyễn Văn A' })).toBeVisible();
        await expect(page.getByRole('cell', { name: 'Trần Thị B' })).toBeHidden();

        // Xóa search
        await page.getByPlaceholder('Tìm kiếm theo tên, MSSV, email...').fill('');

        // [TC_02] & [TC_03] Lọc qua form Dropdown
        await page.getByRole('button', { name: 'Bộ lọc' }).click();

        const selects = page.locator('select');
        await selects.nth(1).selectOption('Hóa học'); // Ngành

        await expect(page.getByRole('cell', { name: 'Trần Thị B' })).toBeVisible();
        await expect(page.getByRole('cell', { name: 'Nguyễn Văn A' })).toBeHidden();

        await page.getByRole('button', { name: 'Xóa bộ lọc' }).click();
        await expect(page.getByRole('cell', { name: 'Nguyễn Văn A' })).toBeVisible();
    });

    test('[TC_2.18_04, 05]: Verify Student Detail Modal Navigation', async ({ page }) => {
        // Click mở Modal sinh viên
        await page.getByText('Nguyễn Văn A').click();

        // Kiểm tra Header Modal
        await expect(page.getByText('Hồ sơ sinh viên')).toBeVisible();
        await expect(page.getByText('Thông tin gia đình')).toBeVisible();

        // Chuyển Tab Thông tin gia đình
        await page.getByText('Thông tin gia đình').click();
        await expect(page.getByText('Chưa có thông tin gia đình trong hệ thống.')).toBeVisible();

        // SỬA Ở ĐÂY: Nhắm chính xác vào nút Đóng có chứa icon dấu X thay vì lấy nút cuối cùng
        await page.locator('button:has(svg.lucide-x)').click();

        // Xác minh modal đã ẩn
        await expect(page.getByText('Hồ sơ sinh viên')).toBeHidden();
    });
});