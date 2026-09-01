import { test, expect } from '@playwright/test';

test.describe('Kiểm tra luồng Dự đoán điểm số - E2E (UC 2.9)', () => {

    test.beforeEach(async ({ page }) => {
        await page.route('**/api/auth/ms-login', async route => {
            await route.fulfill({ status: 200, json: { token: 'fake', role: 'student' } });
        });

        await page.goto('http://127.0.0.1:5173/');
        const loginBtn = page.getByRole('button', { name: /Đăng nhập/i });
        if (await loginBtn.isVisible({ timeout: 2000 })) await loginBtn.click();

        // Điều hướng vào Học tập -> Tiến độ học tập
        await page.getByRole('button', { name: 'Học tập' }).click();
        await page.getByRole('button', { name: /Tiến độ học tập/i }).click();
    });

    test('Kiểm tra tính năng Dự đoán điểm cần đạt', async ({ page }) => {
        // Đảm bảo module dự đoán điểm đã render
        await expect(page.getByRole('heading', { name: /Dự Đoán Điểm Số Cần Đạt/i })).toBeVisible();

        const spinbuttons = page.getByRole('spinbutton');

        // Điền tỉ lệ: Quá trình = 20%, Giữa kỳ = 30%, Cuối kỳ = 50%
        await spinbuttons.nth(0).fill('20');
        await spinbuttons.nth(1).fill('30');
        await spinbuttons.nth(2).fill('50');

        // Điền điểm: Quá trình = 8.0, Giữa kỳ = 7.5, Mục tiêu = 8.0
        await spinbuttons.nth(3).fill('8.0');
        await spinbuttons.nth(4).fill('7.5');
        await spinbuttons.nth(5).fill('8');

        // Kỳ vọng: (8 - 8.0*0.2 - 7.5*0.3) / 0.5 = (8 - 1.6 - 2.25) / 0.5 = 4.15 / 0.5 = 8.3
        await expect(page.getByText('8.3', { exact: true })).toBeVisible();
        await expect(page.getByText(/Thi đạt ≥ 8.3 điểm/i)).toBeVisible();
    });
});