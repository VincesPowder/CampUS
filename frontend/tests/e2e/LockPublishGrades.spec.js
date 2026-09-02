import { test, expect } from '@playwright/test';
import fs from 'fs';

test.describe('Kiểm tra luồng Khóa và Công bố điểm - E2E (UC 2.21)', () => {

    test.beforeEach(async ({ page }) => {
        // Tăng timeout lên một chút để bù hao thời gian mạng load MSAL
        test.setTimeout(60000); 

        if (fs.existsSync('sessionStorage.json')) {
            const sessionData = JSON.parse(fs.readFileSync('sessionStorage.json', 'utf-8'));
            // Đảm bảo parse đúng chuẩn JSON 2 lớp giống bên sinh viên
            const parsedData = typeof sessionData === 'string' ? JSON.parse(sessionData) : sessionData;
            
            await page.addInitScript((data) => {
                if (window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')) {
                    for (const key in data) { window.sessionStorage.setItem(key, data[key]); }
                    window.localStorage.setItem('user_email', 'admin@hcmus.edu.vn');
                }
            }, parsedData);
        }

        await page.goto('/');
        
        // Đợi UI chính hoặc nút "Quản lý học tập" xuất hiện
        await expect(page.locator('nav, aside').first()).toBeVisible({ timeout: 35000 });
        
        await page.getByRole('button', { name: 'Quản lý học tập', exact: true }).click();
        await expect(page.getByText('Môn học & Điểm')).toBeVisible({ timeout: 15000 });
    });

    test('[TC_2.21_01]: Verify clicking on Dashboard stat cards updates the status filter', async ({ page }) => {
        const uploadedStatCard = page.locator('button').filter({ hasText: 'Đã tải lên' }).first();
        await uploadedStatCard.click();

        const statusDropdown = page.locator('select').nth(2); 
        await expect(statusDropdown).toHaveValue('uploaded');
    });

    test('[TC_2.21_04]: Verify "Khóa điểm & Công bố" confirmation logic', async ({ page }) => {
        await page.locator('button').filter({ hasText: 'Đã tải lên' }).first().click();
        
        const firstRow = page.locator('tbody tr').first();
        await expect(firstRow).toBeVisible();
        await firstRow.click();

        const lockBtn = page.getByRole('button', { name: 'Khóa điểm & Công bố' });
        
        // Nếu nút khóa hiện ra, tiến hành bấm và xác nhận
        if (await lockBtn.isVisible()) {
            await lockBtn.click();

            const confirmDialogBtn = page.getByRole('button', { name: 'Xác nhận khóa' });
            await expect(confirmDialogBtn).toBeVisible();
            await confirmDialogBtn.click();

            const successIndicator = page.getByText('Điểm đã được khóa & công bố');
            await expect(successIndicator).toBeVisible();
        }
    });
});