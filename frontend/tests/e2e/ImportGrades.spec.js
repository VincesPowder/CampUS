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
        
        // 1. Click menu Quản lý học tập
        await page.getByText('Quản lý học tập').first().click();
        
        // Chờ bảng dữ liệu load xong
        await expect(page.locator('table')).toBeVisible();
    });

    test('[TC_2.20_01]: Verify navigation and filter selection for Import Grades', async ({ page }) => {
        // 2. Chuyển sang Tab có dữ liệu (Ví dụ: Tab Đã khóa có 11 môn)
        await page.getByText('Đã khóa & công bố').first().click();
        
        // 3. Chọn dòng có mã môn học (chứa chữ CSC) để tránh click nhầm dòng rỗng
        const validCourseRow = page.locator('tbody tr').filter({ hasText: 'CSC' }).first();
        await expect(validCourseRow).toBeVisible();
        await validCourseRow.click();

        // 4. Đợi sang trang chi tiết và có nút Nhập Excel
        const importBtn = page.locator('button').filter({ hasText: 'Nhập Excel' }).first();
        await expect(importBtn).toBeVisible({ timeout: 15000 });
        await importBtn.click();

        // 5. Expect: Có input file được gắn vào DOM trong Modal
        await expect(page.locator('input[type="file"]')).toBeAttached();
    });
});