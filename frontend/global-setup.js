import { chromium } from '@playwright/test';
import fs from 'fs'; // Thư viện đọc ghi file của Node.js

async function globalSetup() {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    console.log('Đang mở trình duyệt. Vui lòng thao tác đăng nhập Microsoft...');
    await page.goto('http://localhost:5173/');

    // Chờ bạn đăng nhập tay và web load vào giao diện bên trong
    await page.waitForSelector('nav button, aside button', { timeout: 0 });

    // 1. Lưu LocalStorage & Cookies mặc định
    await page.context().storageState({ path: 'auth.json' });

    // 2. LƯU THÊM SESSION STORAGE CỦA MICROSOFT
    const sessionStorage = await page.evaluate(() => JSON.stringify(sessionStorage));
    fs.writeFileSync('sessionStorage.json', sessionStorage, 'utf-8');

    console.log('Đã lưu toàn bộ phiên đăng nhập (bao gồm SessionStorage)!');
    await browser.close();
}

export default globalSetup;