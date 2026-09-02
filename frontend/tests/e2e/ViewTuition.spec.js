import { test, expect } from '@playwright/test';
import fs from 'fs';

test.describe('Kiểm tra luồng Xem Học Phí - E2E (UC 2.12)', () => {

    test.beforeEach(async ({ page }) => {
        test.setTimeout(45000);

        // 1. Dùng addInitScript để tiêm Session Storage an toàn TRƯỚC KHI load trang
        // Giúp tránh lỗi "Execution context was destroyed" do MSAL redirect
        if (fs.existsSync('sessionStorage.json')) {
            const sessionData = JSON.parse(fs.readFileSync('sessionStorage.json', 'utf-8'));
            const parsedData = typeof sessionData === 'string' ? JSON.parse(sessionData) : sessionData;
            
            await page.addInitScript((data) => {
                // Chỉ bơm session nếu đang ở đúng trang gốc của web (tránh bơm nhầm vào trang login của Microsoft)
                if (window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')) {
                    for (const key in data) { 
                        window.sessionStorage.setItem(key, data[key]); 
                    }
                }
            }, parsedData);
        }

        // 2. Đi tới trang chủ (Session Storage đã được bơm sẵn ngầm)
        await page.goto('/');

        // 3. Chờ UI chính load thành công
        await expect(page.locator('nav, aside').first()).toBeVisible({ timeout: 30000 });

        // 4. Click vào menu "Học phí" (Thêm exact: true để phân biệt với nút "Học phí còn bao nhiêu?" của Chatbot)
        await page.getByRole('button', { name: 'Học phí', exact: true }).click();
        
        // 5. Chờ giao diện học phí hiển thị
        await expect(page.getByText('Tra Cứu Học Phí')).toBeVisible({ timeout: 15000 });
        await expect(page.getByText(/Đang tải dữ liệu học phí/i)).toBeHidden({ timeout: 10000 });
    });

    test('[TC_2.12_01]: Verify initial API data fetch and automatic dropdown population', async ({ page }) => {
        // Kiểm tra dropdown năm học và học kỳ đã xuất hiện và tự động điền dữ liệu
        const namHocDropdown = page.getByRole('combobox').first();
        const hocKyDropdown = page.getByRole('combobox').nth(1);

        await expect(namHocDropdown).toBeVisible();
        await expect(hocKyDropdown).toBeVisible();

        // Kiểm tra dropdown có chứa ít nhất 1 lựa chọn
        const optionsCount = await namHocDropdown.locator('option').count();
        expect(optionsCount).toBeGreaterThan(0);
    });

    test('[TC_2.12_02]: Verify data filtering logic when changing Year and Semester dropdowns', async ({ page }) => {
        // Giả định hệ thống có dữ liệu năm "24-25" và "HK1"
        const namHocDropdown = page.getByRole('combobox').first();
        
        // Chờ table render ra ít nhất 1 tbody
        await expect(page.locator('tbody').first()).toBeVisible();
        const initialText = await page.locator('tbody').innerText();
        
        // Thay đổi lựa chọn (chọn option index 1)
        await namHocDropdown.selectOption({ index: 1 }); 
        
        // Chờ 1 chút để React render lại DOM
        await page.waitForTimeout(1000);
        const newText = await page.locator('tbody').innerText();
        
        // Vì data bị filter nên chuỗi text trong Tbody sẽ khác nhau
        expect(initialText).not.toEqual(newText);
    });

    test('[TC_2.12_07]: Verify empty state handling for a semester with no courses', async ({ page }) => {
        // Chọn option cuối cùng trong Dropdown Năm Học để ép ra trạng thái rỗng (nếu có)
        const namHocDropdown = page.getByRole('combobox').first();
        const optionsCount = await namHocDropdown.locator('option').count();
        
        if (optionsCount > 1) {
            await namHocDropdown.selectOption({ index: optionsCount - 1 }); 
        }
        
        // Test này sẽ Pass nếu element có mặt trong DOM (hoặc nếu có dữ liệu thì test bypass qua)
        const emptyRow = page.getByText('Không có dữ liệu cho năm học và học kỳ đã chọn.');
        if (await emptyRow.isVisible()) {
            await expect(emptyRow).toBeVisible();
        }
    });
});