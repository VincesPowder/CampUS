import { test, expect } from '@playwright/test';

test.describe('Kiểm tra chức năng Đăng nhập - Frontend E2E', () => {
    test.use({ storageState: { cookies: [], origins: [] } });
    // Mở trang web trước mỗi test case để đảm bảo trạng thái luôn mới
    test.beforeEach(async ({ page }) => {
        await page.goto('http://127.0.0.1:5173/');
    });

    test.skip('[TC_2.1_01]: Đăng nhập thành công với tài khoản Sinh viên', async ({ page }) => {
        // Mock API trả về data thành công cho Sinh viên
        await page.route('**/api/auth/ms-login', async route => {
            const json = {
                message: 'Đăng nhập thành công',
                token: 'jwt_token_student_24127158',
                role: 'student',
                user: {
                    name: 'Nguyễn Trần Lan Duy',
                    email: '24127158@student.hcmus.edu.vn',
                    avatar: ''
                }
            };
            await route.fulfill({ json, status: 200 });
        });

        // Bấm nút đăng nhập
        await page.getByRole('button', { name: /Đăng nhập với Microsoft/i }).click();

        // Kiểm tra các phần tử trên giao diện đã hiển thị đúng sau khi login thành công chưa
        await expect(page.getByText('Hồ sơ cá nhân', { exact: true })).toBeVisible();
        await expect(page.getByText('Nguyễn Trần Lan Duy')).toBeVisible();
        await expect(page.getByText('24127158')).toBeVisible();
    });


    test.skip('[TC_2.1_02]: Đăng nhập thành công với tài khoản Admin/Giáo vụ', async ({ page }) => {
        // Mock API trả về data thành công cho Admin
        await page.route('**/api/auth/ms-login', async route => {
            const json = {
                message: 'Đăng nhập thành công',
                token: 'jwt_token_admin_GVU001',
                role: 'admin',
                user: {
                    name: 'Đỗ Thành Vinh',
                    email: '24127262@student.hcmus.edu.vn',
                    avatar: ''
                }
            };
            await route.fulfill({ json, status: 200 });
        });

        await page.getByRole('button', { name: /Đăng nhập với Microsoft/i }).click();

        // Kiểm tra UI render đúng giao diện của Admin dựa trên hình ảnh thực tế
        await expect(page.getByText('CampUS Admin')).toBeVisible();
        await expect(page.getByText('Quản lý sinh viên').first()).toBeVisible();
    });


    test.skip('[TC_2.1_03]: Đăng nhập bằng email ngoài tổ chức (sai domain)', async ({ page }) => {
        // Mock API trả về lỗi 403 giống backend khi domain không hợp lệ
        await page.route('**/api/auth/ms-login', async route => {
            const json = {
                error: 'Hệ thống chỉ hỗ trợ đăng nhập bằng email sinh viên (@student.hcmus.edu.vn). Vui lòng thử lại.'
            };
            await route.fulfill({ json, status: 403 });
        });

        await page.getByRole('button', { name: /Đăng nhập với Microsoft/i }).click();

        // Kiểm tra thông báo lỗi hiển thị trên UI
        const errorToast = page.getByText('chỉ hỗ trợ đăng nhập bằng email sinh viên');
        await expect(errorToast).toBeVisible();
    });


    test.skip('[TC_2.1_04]: Hủy quá trình đăng nhập (Cancel SSO)', async ({ page }) => {
        // Giả lập trạng thái người dùng tắt popup/hủy đăng nhập từ Microsoft
        await page.evaluate(() => {
            window.localStorage.setItem('msal.cancel.test', 'true');
        });

        await page.getByRole('button', { name: /Đăng nhập với Microsoft/i }).click();

        // Khi hủy, ứng dụng vẫn đứng ở trang đăng nhập (URL không đổi và nút đăng nhập vẫn còn)
        await expect(page.getByRole('button', { name: /Đăng nhập với Microsoft/i })).toBeVisible();
    });


    test('[TC_2.1_05]: Báo lỗi khi nhập username không tồn tại (Lỗi từ MS)', async ({ page, context }) => {
        // Thêm 2 dòng này để xóa sạch phiên đăng nhập cũ, ép Microsoft hiện lại form nhập email
        await context.clearCookies();
        await page.evaluate(() => window.sessionStorage.clear());

        await page.getByRole('button', { name: /Đăng nhập với Microsoft/i }).click();

        // Nhập email sai định dạng/không tồn tại
        const emailInput = page.locator('input[name="loginfmt"]');
        await emailInput.fill('bnmsdafmhqwb');

        await page.getByRole('button', { name: /Next/i }).click();

        // Kiểm tra lỗi từ hệ thống Microsoft trả về
        const errorMessage = page.getByText("We couldn't find an account with that username.");
        await expect(errorMessage).toBeVisible();
    });

});