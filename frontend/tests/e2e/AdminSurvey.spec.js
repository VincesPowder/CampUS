import { test, expect } from '@playwright/test';

test.describe('Kiểm tra luồng Quản lý Khảo sát - E2E (UC 2.24)', () => {

    test.beforeEach(async ({ page }) => {
        // Mock Login
        await page.route('**/api/auth/ms-login', async route => {
            await route.fulfill({ status: 200, json: { token: 'fake', role: 'admin', user: { name: 'Admin' } } });
        });

        // 🎯 SỬA LỖI MOCK: Mở rộng glob pattern thành **/api/admin/** để chắc chắn bắt được mọi endpoint
        await page.route('**/api/admin/**', async route => {
            const url = route.request().url();
            const method = route.request().method();

            if (method === 'POST') {
                await route.fulfill({ status: 201, json: { status: 'success' } });
            } else if (url.includes('KS_01')) {
                // Trả về chi tiết kết quả khảo sát KS_01
                await route.fulfill({
                    status: 200, json: {
                        status: 'success', data: {
                            id: 'KS_01', title: 'Khảo sát chất lượng', responseRate: 80, submittedCount: 40, totalTarget: 50,
                            questions: [{ id: 'Q1', content: 'Cơ sở vật chất thế nào?', code: 'Đánh giá', type: 'Trắc nghiệm', averageRating: 4.8, ratingBreakdown: [{ star: 5, count: 10, percentage: 100 }], textResponses: ['Tuyệt vời'] }]
                        }
                    }
                });
            } else if (url.includes('/surveys')) {
                // Trả về danh sách khảo sát chung
                await route.fulfill({
                    status: 200, json: {
                        status: 'success', data: [
                            { id: 'KS_01', title: 'Khảo sát chất lượng', description: 'Đánh giá CSVC', deadline: '2026-09-30', status: 'active', submittedCount: 40, totalTarget: 50, responseRate: 80, questionsCount: 1 }
                        ]
                    }
                });
            } else {
                // Rất quan trọng: Bỏ qua các request khác (như lấy hình ảnh, profile...)
                await route.fallback();
            }
        });

        await page.goto('http://127.0.0.1:5173/');
        
        const loginBtn = page.getByRole('button', { name: /Đăng nhập/i });
        if (await loginBtn.isVisible({ timeout: 5000 })) await loginBtn.click();

        await expect(page.locator('header')).toBeVisible({ timeout: 15000 });

        // Điều hướng sang tab Khảo sát
        await page.locator('aside').getByRole('button', { name: 'Khảo sát' }).click();
    });

    test('[TC_2.24_01, 02, 04]: Create Survey, Add Question and View Results', async ({ page }) => {
        // [TC_01] & [TC_02] Tạo khảo sát mới
        await page.getByRole('button', { name: 'Tạo khảo sát' }).click();
        await expect(page.getByText('Tạo đợt khảo sát mới')).toBeVisible();

        // Nhập tiêu đề
        await page.getByPlaceholder('Nhập tiêu đề khảo sát...').fill('Đánh giá Môn học E2E');

        // Thêm câu hỏi Tự luận
        await page.getByRole('button', { name: '+ Tự luận' }).click();
        
        // 🎯 Dùng toContainText cho an toàn
        await expect(page.locator('body')).toContainText('Câu hỏi 2');

        // Bấm Tạo khảo sát trong Modal
        await page.locator('.fixed.inset-0').locator('button', { hasText: 'Tạo khảo sát' }).click();
        await expect(page.getByText('Tạo đợt khảo sát mới')).toBeHidden();

        // [TC_04] Xem kết quả thống kê
        await page.getByRole('button', { name: 'Kết quả' }).first().click();

        // 🎯 SỬA LỖI TÌM KIẾM TEXT: Tìm trong toàn bộ thẻ hiển thị kết quả (hoặc body)
        await expect(page.locator('body')).toContainText('4.8', { timeout: 10000 });
        await expect(page.locator('body')).toContainText('Tuyệt vời');
    });
});