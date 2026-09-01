import { test, expect } from '@playwright/test';
import fs from 'fs';

test.describe('Kiểm tra luồng Xem Thời Khóa Biểu - E2E (UC 2.11)', () => {

    test.beforeEach(async ({ page }) => {
        // 1. Đi tới trang chủ lần đầu (lúc này chưa có session storage nên MSAL có thể chuẩn bị redirect)
        await page.goto('/');

        // 2. Bơm Session Storage đã lưu từ bước global-setup vào lại trình duyệt
        if (fs.existsSync('sessionStorage.json')) {
            const sessionData = JSON.parse(fs.readFileSync('sessionStorage.json', 'utf-8'));
            
            // Ép chuỗi JSON thành Object thực tế trong môi trường trình duyệt
            const parsedData = typeof sessionData === 'string' ? JSON.parse(sessionData) : sessionData;
            
            await page.evaluate((data) => {
                for (const key in data) {
                    window.sessionStorage.setItem(key, data[key]);
                }
            }, parsedData);
        }

        // 3. Reload lại trang để MSAL đọc được token vừa bơm và cho phép vào giao diện bên trong
        await page.reload();

        // 4. Đảm bảo giao diện bên trong đã load xong
        await expect(page.locator('nav, aside').first()).toBeVisible({ timeout: 15000 });

        // 5. Click vào menu "Lịch học / thi"
        await page.getByRole('button', { name: 'Lịch học / thi' }).click();
        
        // 6. Đảm bảo đang ở tab TKB Tuần
        await expect(page.getByText('Tuần trước')).toBeVisible({ timeout: 10000 });
    });

    test('[TC_2.11_01]: Chuyển tab giữa "TKB Tuần" và "TKB Thi"', async ({ page }) => {
        await page.getByText('TKB Thi').click();
        
        await expect(page.getByRole('button', { name: /Tuần trước/i })).toBeHidden();
        await expect(page.getByRole('button', { name: /Tuần sau/i })).toBeHidden();

        await expect(page.getByRole('table')).toBeVisible();
        await expect(page.getByText('Ngày thi').first()).toBeVisible();
        await expect(page.getByText('Hình thức').first()).toBeVisible();
    });

    test('[TC_2.11_02]: Cập nhật state khi đổi Dropdown lọc toàn cục', async ({ page }) => {
        const namHocDropdown = page.getByRole('combobox').first();
        await namHocDropdown.selectOption('24-25');

        await expect(page.getByText(/Đang tải/i)).toBeHidden({ timeout: 5000 });

        const blueHeader = page.locator('div').filter({ hasText: '24-25' }).filter({ hasText: 'Tuần' }).first();
        await expect(blueHeader).toBeVisible();
    });

    test('[TC_2.11_06]: Nút phân trang "Tuần trước" / "Tuần sau" disable đúng boundary', async ({ page }) => {
        const weekDropdown = page.getByRole('combobox').nth(2);
        const prevBtn = page.getByRole('button', { name: /Tuần trước/i });
        const nextBtn = page.getByRole('button', { name: /Tuần sau/i });

        await weekDropdown.selectOption('1');
        await expect(prevBtn).toBeDisabled();

        await weekDropdown.selectOption('10');
        await expect(nextBtn).toBeDisabled();
    });

    test('[Bổ sung]: Kiểm tra tính năng tải file Xuất Excel', async ({ page }) => {
        const downloadPromise = page.waitForEvent('download');
        
        await page.getByRole('button', { name: 'Xuất Excel' }).click();
        
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toMatch(/TKB/i);
    });
});