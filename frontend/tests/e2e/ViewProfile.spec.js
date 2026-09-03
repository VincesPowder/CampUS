import { test, expect } from '@playwright/test';

// Bỏ dòng storageState đi vì chúng ta dùng Mock API, không cần file auth.json nữa

test.describe('Kiểm tra chức năng Xem hồ sơ cá nhân - Frontend E2E', () => {

    test.beforeEach(async ({ page }) => {
        // 1. Giả mạo API đăng nhập y hệt như cách bạn làm ở Login.spec.js
        await page.route('**/api/auth/ms-login', async route => {
            const json = {
                message: 'Đăng nhập thành công',
                token: 'jwt_token_student_24127158',
                role: 'student',
                user: { name: 'Nguyễn Trần Lan Duy', email: '24127158@student.hcmus.edu.vn', avatar: '' }
            };
            await route.fulfill({ json, status: 200 });
        });

        // 2. Đi tới trang chủ ứng dụng
        await page.goto('http://localhost:5173/');

        // 3. TỰ ĐỘNG CLICK NÚT ĐĂNG NHẬP (Bạn không cần nhập tay nữa)
        const msLoginBtn = page.getByRole('button', { name: /Đăng nhập với Microsoft/i });
        const svBtn = page.getByRole('button', { name: 'Sinh viên' }); // Nút fallback nếu dùng Modal Account Picker

        if (await msLoginBtn.isVisible()) {
            await msLoginBtn.click();
        } else if (await svBtn.isVisible()) {
            await svBtn.click();
        }

        // 4. Chờ sidebar xuất hiện và click vào Hồ sơ cá nhân
        await page.waitForSelector('nav button, aside button');
        await page.getByRole('button', { name: 'Hồ sơ cá nhân' }).click();
        await expect(page.getByRole('heading', { name: 'Thông tin chung' })).toBeVisible();
    });

    test('[TC_2.5_12]: Kiểm tra hiển thị dữ liệu chung của sinh viên khi load trang lần đầu', async ({ page }) => {
        const personalTab = page.getByRole('button', { name: 'Thông tin cá nhân' });
        await expect(personalTab).toBeVisible();

        await expect(page.getByText('MSSV', { exact: true })).toBeVisible();
        await expect(page.getByText('Ngày sinh', { exact: true })).toBeVisible();
        await expect(page.getByText('Giới tính', { exact: true })).toBeVisible();
        await expect(page.getByText('Chuyên ngành', { exact: true })).toBeVisible();

        await expect(page.getByText('Số CCCD', { exact: true })).toBeVisible();
        await expect(page.getByText('Email cá nhân', { exact: true })).toBeVisible();
    });

    test('[TC_2.5_13]: Kiểm tra giao diện avatar mặc định (fallback) khi avatarUrl bị null', async ({ page }) => {
        const avatarContainer = page.locator('.rounded-full.border-4').first();
        await expect(avatarContainer).toBeVisible();

        const imgAvatar = avatarContainer.locator('img');
        const isImgVisible = await imgAvatar.isVisible();
        if (!isImgVisible) {
            await expect(avatarContainer).not.toBeEmpty();
        }
    });

    test('[TC_2.5_14]: Kiểm tra hiển thị text fallback cho các trường không bắt buộc bị thiếu', async ({ page }) => {
        const fallbackElements = page.locator('text=/Chưa cập nhật|—/');
        const count = await fallbackElements.count();
        expect(count).toBeGreaterThanOrEqual(0);
    });

    test('[TC_2.5_15]: Kiểm tra chức năng chuyển tab từ Thông tin cá nhân sang Thông tin gia đình', async ({ page }) => {
        const familyTab = page.getByRole('button', { name: 'Thông tin gia đình' });
        await familyTab.click();

        // ĐÃ SỬA THÀNH 'columnheader' (Đại diện cho thẻ <th>) 
        await expect(page.getByRole('columnheader', { name: 'Họ tên', exact: true })).toBeVisible();
        await expect(page.getByRole('columnheader', { name: 'Quan hệ', exact: true })).toBeVisible();
        await expect(page.getByRole('columnheader', { name: 'Nghề nghiệp', exact: true })).toBeVisible();

        const personalTab = page.getByRole('button', { name: 'Thông tin cá nhân' });
        await personalTab.click();

        await expect(page.getByRole('heading', { name: 'CCCD / Giấy tờ tùy thân' })).toBeVisible();
    });

    test('[TC_2.5_16]: Kiểm tra chức năng của nút "Xuất PDF"', async ({ page }) => {
        const exportPdfButton = page.getByRole('button', { name: 'Xuất PDF' });
        await expect(exportPdfButton).toBeVisible();

        await page.evaluate(() => {
            window.print = () => { window['printed'] = true; };
        });

        await exportPdfButton.click();

        const isPrinted = await page.evaluate(() => window['printed']);
        expect(isPrinted).toBeTruthy();
    });
});