import { test, expect } from '@playwright/test';
import fs from 'fs';

test.describe('Kiểm tra AI Chatbot - E2E (UC 2.26)', () => {

    test.beforeEach(async ({ page }) => {
        test.setTimeout(60000); 

        if (fs.existsSync('sessionStorage.json')) {
            const sessionData = JSON.parse(fs.readFileSync('sessionStorage.json', 'utf-8'));
            await page.addInitScript((data) => {
                if (window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')) {
                    for (const key in data) { window.sessionStorage.setItem(key, data[key]); }
                    window.localStorage.setItem('user_email', '24127001@student.hcmus.edu.vn'); 
                }
            }, sessionData);
        }
        await page.goto('/');
        
        await expect(page.locator('nav, aside').first()).toBeVisible({ timeout: 45000 });

        await page.evaluate(() => {
            localStorage.setItem('campus_token', 'fake_token_for_test');
        });
    });

    test('[TC_2.26_01]: Verify Chatbot floating button toggle and UI expansion', async ({ page }) => {
        const toggleBtn = page.locator('button[title="Trợ lý AI"]');
        await expect(toggleBtn).toBeVisible({ timeout: 15000 });
        await toggleBtn.click();

        // 🎯 SỬA LỖI: Dùng .first() để tránh Playwright bị bối rối vì có 2 chữ HCMUS AI
        const chatbotHeader = page.getByText('HCMUS AI').first();
        await expect(chatbotHeader).toBeVisible();

        const chatInput = page.getByPlaceholder('Nhập câu hỏi... (Enter để gửi)');
        await expect(chatInput).toBeFocused();
    });

    test('[TC_2.26_02]: Verify predefined quick-reply suggestions trigger message', async ({ page }) => {
        const toggleBtn = page.locator('button[title="Trợ lý AI"]');
        await expect(toggleBtn).toBeVisible({ timeout: 15000 });
        await toggleBtn.click();

        const quickReplyChip = page.getByText('Học phí').first();
        await expect(quickReplyChip).toBeVisible();

        await page.route('**/api/chatbot/ask', async route => {
            await route.fulfill({ json: { status: "success", data: { reply: "Đây là dữ liệu học phí giả lập." } } });
        });

        await quickReplyChip.click();

        await expect(page.locator('.max-w-\\[76\\%\\]').filter({ hasText: 'Học phí' })).toBeVisible();
    });

    test('[TC_2.26_04]: Verify auto-scroll behavior upon new message', async ({ page }) => {
        const toggleBtn = page.locator('button[title="Trợ lý AI"]');
        await expect(toggleBtn).toBeVisible({ timeout: 15000 });
        await toggleBtn.click();

        await page.route('**/api/chatbot/ask', async route => {
            await route.fulfill({ json: { status: "success", data: { reply: "Dòng 1\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\nDòng cuối cùng." } } });
        });

        // 🎯 SỬA LỖI: Gõ câu hỏi và nhấn phím Enter để gửi, chính xác 100%
        const chatInput = page.getByPlaceholder('Nhập câu hỏi... (Enter để gửi)');
        await chatInput.fill('Test cuộn trang');
        await chatInput.press('Enter');

        const lastLine = page.getByText('Dòng cuối cùng.');
        await expect(lastLine).toBeVisible({ timeout: 10000 });

        await page.waitForTimeout(500);

        await expect(lastLine).toBeInViewport();
    });
});