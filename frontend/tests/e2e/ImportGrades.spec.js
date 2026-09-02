import { test, expect } from '@playwright/test';
import fs from 'fs';

test.describe('Kiểm tra luồng Import Bảng điểm - E2E (UC 2.20)', () => {

    test.beforeEach(async ({ page }) => {
        test.setTimeout(45000);
        if (fs.existsSync('sessionStorage.json')) {
            const sessionData = JSON.parse(fs.readFileSync('sessionStorage.json', 'utf-8'));
            await page.addInitScript((data) => {
                if (window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')) {
                    for (const key in data) { window.sessionStorage.setItem(key, data[key]); }
                    window.localStorage.setItem('user_email', 'admin@hcmus.edu.vn');
                }
            }, sessionData);
        }
        await page.goto('/');
        await expect(page.locator('nav, aside').first()).toBeVisible({ timeout: 30000 });
        
        // Click menu Quản lý học tập
        await page.getByRole('button', { name: 'Quản lý học tập', exact: true }).click();
        
        // Vào bảng điểm chi tiết của môn đang chờ nộp điểm
        await page.getByRole('button', { name: /Đang chờ nộp điểm/i }).click();
        const firstRow = page.locator('tbody tr').first();
        await expect(firstRow).toBeVisible();
        await firstRow.click();
    });

    test('[TC_2.20_01]: Verify navigation and filter selection for Import Grades', async ({ page }) => {
        // Tương lai: Sẽ có nút "Nhập điểm (Import)" ở màn hình chi tiết môn học
        const importBtn = page.getByRole('button', { name: 'Nhập điểm' });
        await importBtn.click();

        // Expect: Một Modal/Dialog hiện ra yêu cầu Upload File CSV
        await expect(page.getByText('Tải lên file điểm (CSV/Excel)')).toBeVisible();
        await expect(page.locator('input[type="file"]')).toBeAttached();
    });

    test('[TC_2.20_05]: Verify "Save Draft" action updates course status', async ({ page }) => {
        // Giả lập click nút "Lưu nháp" (Save Draft) sau khi import
        const saveDraftBtn = page.getByRole('button', { name: 'Lưu nháp' });
        await saveDraftBtn.click();

        // Chờ xử lý và quay lại màn hình danh sách môn
        await page.getByRole('button', { name: 'Quản lý học tập', exact: true }).click();

        // Expect: Môn học vừa lưu nháp sẽ chuyển sang trạng thái "Đã tải lên"
        const uploadedBadge = page.locator('tbody tr').first().getByText('Đã tải lên');
        await expect(uploadedBadge).toBeVisible();
    });
});