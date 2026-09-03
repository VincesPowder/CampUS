import { test, expect } from '@playwright/test';

test.describe('Kiểm tra luồng Admin Quản lý Thông báo - E2E (UC 2.25)', () => {

    test.beforeEach(async ({ page }) => {
        // Mock Login
        await page.route('**/api/auth/ms-login', async route => {
            await route.fulfill({ status: 200, json: { token: 'fake', role: 'admin', user: { name: 'Admin', email: 'admin@hcmus.edu.vn' } } });
        });

        // Mock danh sách API
        await page.route('**/api/admin/notifications*', async route => {
            if (route.request().method() === 'GET') {
                await route.fulfill({
                    status: 200, json: {
                        status: 'success', data: [{ id: 'TB1', title: 'Thông báo Test', department: 'Phòng Đào tạo', content: 'ABC', readCount: 0 }]
                    }
                });
            } else if (route.request().method() === 'POST' || route.request().method() === 'DELETE') {
                await route.fulfill({ status: 200, json: { status: 'success' } });
            }
        });

        await page.goto('http://localhost:5173/');
        const loginBtn = page.getByRole('button', { name: /Đăng nhập/i });
        if (await loginBtn.isVisible({ timeout: 2000 })) await loginBtn.click();

        // Chờ Header tải và điều hướng sang tab Thông báo
        await expect(page.locator('header')).toBeVisible({ timeout: 15000 });
        await page.locator('aside').getByRole('button', { name: 'Thông báo' }).click();
        await expect(page.getByText('Tổng số thông báo')).toBeVisible();
    });

    test('[TC_2.25_01]: Verify filtering logic by Department and Search Keyword', async ({ page }) => {
        // Click chọn bộ lọc "Phòng Đào tạo"
        await page.getByRole('button', { name: 'Phòng Đào tạo' }).click();

        // Nhập ô tìm kiếm
        await page.getByPlaceholder('Tìm theo tiêu đề, nội dung...').fill('Test');

        // Xác minh thông báo vẫn xuất hiện (pass điều kiện lọc)
        await expect(page.locator('main').getByText('Thông báo Test')).toBeVisible();
    });

    test('[TC_2.25_02 & TC_2.25_03]: Compose Modal & Publish Announcement execution', async ({ page }) => {
        await page.getByRole('button', { name: 'Tạo thông báo' }).click();
        await expect(page.getByText('Soạn thông báo mới')).toBeVisible();

        // Xử lý sự kiện Alert do Validation (bỏ trống Nội dung)
        page.on('dialog', async dialog => {
            expect(dialog.message()).toBe('Vui lòng nhập nội dung thông báo.');
            await dialog.accept();
        });

        // Chỉ điền tiêu đề (Test TC_02)
        await page.getByPlaceholder('Nhập tiêu đề...').fill('Tiêu đề E2E');
        await page.getByRole('button', { name: 'Phát hành thông báo' }).click();

        // Điền đầy đủ nội dung (Test TC_03)
        await page.getByPlaceholder('Nhập nội dung thông báo gửi đến sinh viên...').fill('Nội dung E2E');

        // Bấm Phát hành -> Form sẽ đóng
        await page.getByRole('button', { name: 'Phát hành thông báo' }).click();
        await expect(page.getByText('Soạn thông báo mới')).toBeHidden();
    });

    test('[TC_2.25_05]: Verify Delete Confirmation logic', async ({ page }) => {
        // Tự động nhấn "OK" khi hộp thoại confirm của trình duyệt xuất hiện
        page.on('dialog', async dialog => {
            expect(dialog.message()).toContain('Bạn có chắc chắn muốn xóa thông báo này?');
            await dialog.accept();
        });

        // Bấm nút xóa (Trash icon)
        const deleteBtn = page.locator('button[title="Xóa thông báo"]').first();
        await deleteBtn.click();
    });
});