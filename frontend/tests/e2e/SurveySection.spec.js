import { test, expect } from '@playwright/test';

test.describe('Kiểm tra luồng Khảo sát sinh viên - E2E (UC 2.10)', () => {

    test.beforeEach(async ({ page }) => {
        // Mock API Login để auto vào thẳng hệ thống với tư cách Sinh viên
        await page.route('**/api/auth/ms-login', async route => {
            await route.fulfill({ status: 200, json: { token: 'fake', role: 'student' } });
        });

        await page.goto('http://127.0.0.1:5173/');
        const loginBtn = page.getByRole('button', { name: /Đăng nhập/i });
        if (await loginBtn.isVisible({ timeout: 2000 })) await loginBtn.click();

        // Lưu ý: Chưa click sang tab "Khảo sát" ở đây vì cần mock dữ liệu khảo sát riêng cho từng Test Case ở bên dưới trước khi điều hướng.
    });

    test('[TC_2.10_01]: Hiển thị trạng thái rỗng khi không có khảo sát', async ({ page }) => {
        // Mock API trả về danh sách khảo sát rỗng
        await page.route('**/api/students/*/surveys', async route => {
            if (route.request().method() === 'GET') {
                await route.fulfill({ status: 200, json: { status: 'success', data: [] } });
            } else {
                await route.continue();
            }
        });

        // Điều hướng vào Khảo sát
        await page.getByRole('button', { name: 'Khảo sát' }).click();

        // Xác minh giao diện Empty State
        await expect(page.getByText(/Không có khảo sát nào cần thực hiện/i)).toBeVisible();
    });

    test('[TC_2.10_02]: Tự động mở form khi chỉ có 1 khảo sát pending', async ({ page }) => {
        // Mock API trả về 1 khảo sát pending
        await page.route('**/api/students/*/surveys', async route => {
            if (route.request().method() === 'GET') {
                await route.fulfill({
                    status: 200, json: {
                        status: 'success',
                        data: [{
                            id: 'KS01', title: 'Khảo sát Tự động mở', status: 'pending', description: 'Mô tả', deadline: '2026-10-10',
                            courses: [{ id: 'MH01', name: 'Cấu trúc dữ liệu', code: 'INT101', rating: null, comment: '' }]
                        }]
                    }
                });
            } else {
                await route.continue();
            }
        });

        await page.getByRole('button', { name: 'Khảo sát' }).click();

        // Bỏ qua màn hình danh sách, thấy ngay tên môn học và nút Gửi đánh giá
        await expect(page.getByText('Cấu trúc dữ liệu')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Gửi đánh giá' })).toBeVisible();
    });

    test('[TC_2.10_04 & TC_2.10_08]: Xem trước khảo sát đã hoàn thành (Read-only)', async ({ page }) => {
        // Mock API trả về 1 khảo sát đã completed
        await page.route('**/api/students/*/surveys', async route => {
            if (route.request().method() === 'GET') {
                await route.fulfill({
                    status: 200, json: {
                        status: 'success',
                        data: [{
                            id: 'KS01', title: 'Khảo sát Đã xong', status: 'completed', description: 'Mô tả', deadline: '2026-10-10',
                            courses: [{ id: 'MH01', name: 'Môn A', code: 'A1', rating: 4, comment: 'Dạy rất nhiệt tình' }]
                        }]
                    }
                });
            } else {
                await route.continue();
            }
        });

        await page.getByRole('button', { name: 'Khảo sát' }).click();

        // Click vào khảo sát trong list (vì completed nên không auto-open)
        await page.getByText('Khảo sát Đã xong').click();

        // Kiểm tra UI read-only và dữ liệu pre-fill
        await expect(page.getByText('Bản xem trước')).toBeVisible();

        // SỬA Ở ĐÂY: Dùng .first() để bỏ qua textbox của AI Chatbot
        const textarea = page.getByRole('textbox').first();
        await expect(textarea).toHaveValue('Dạy rất nhiệt tình');
        await expect(textarea).toHaveAttribute('readonly', '');

        await expect(page.getByRole('button', { name: 'Gửi đánh giá' })).toBeHidden();
    });

    test('[TC_2.10_05, 06, 07]: Validation nút Submit và Gửi khảo sát thành công', async ({ page }) => {
        // Mock API trả về 1 khảo sát gồm 2 môn học cần đánh giá
        await page.route('**/api/students/*/surveys', async route => {
            if (route.request().method() === 'GET') {
                await route.fulfill({
                    status: 200, json: {
                        status: 'success',
                        data: [{
                            id: 'KS01', title: 'Khảo sát Đa môn', status: 'pending', description: 'Mô tả', deadline: '2026-10-10',
                            courses: [
                                { id: 'MH01', name: 'Toán', code: 'T1', rating: null, comment: '' },
                                { id: 'MH02', name: 'Lý', code: 'L1', rating: null, comment: '' }
                            ]
                        }]
                    }
                });
            } else {
                await route.continue();
            }
        });

        // Mock API POST để chặn việc gửi DB thật và trả về success giả lập
        await page.route('**/api/students/*/surveys/*/submit', async route => {
            await route.fulfill({ status: 200, json: { status: 'success' } });
        });

        await page.getByRole('button', { name: 'Khảo sát' }).click();

        const submitBtn = page.getByRole('button', { name: 'Gửi đánh giá' });

        // Kiểm tra logic Validation lúc chưa điền đủ
        await expect(submitBtn).toBeDisabled();
        await expect(page.getByText(/Vui lòng đánh giá tất cả 2 môn học/i)).toBeVisible();

        // Đánh giá 5 sao ("Rất tốt") cho môn Toán (phần tử đầu tiên)
        await page.locator('button[title="Rất tốt"]').first().click();
        await expect(submitBtn).toBeDisabled(); // Vẫn khóa vì thiếu môn Lý

        // Đánh giá 5 sao cho môn Lý (phần tử thứ 2)
        await page.locator('button[title="Rất tốt"]').nth(1).click();
        await expect(submitBtn).toBeEnabled(); // Đã đủ, nút mở khóa
        await expect(page.getByText(/Vui lòng đánh giá tất cả/i)).toBeHidden();

        // Click Gửi
        await submitBtn.click();

        // Kiểm tra màn hình thành công
        await expect(page.getByText('Đã gửi đánh giá thành công!')).toBeVisible();

        // Nút Quay lại
        await page.getByRole('button', { name: 'Quay lại', exact: true }).click();
        await expect(page.getByText('Đã gửi đánh giá thành công!')).toBeHidden();
    });
});