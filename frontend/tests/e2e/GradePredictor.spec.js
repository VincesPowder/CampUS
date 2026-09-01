import { test, expect } from '@playwright/test';

test.describe('Kiểm tra luồng Dự đoán điểm số - E2E (UC 2.9)', () => {

    test.beforeEach(async ({ page }) => {
        // Mock API Login để vào thẳng hệ thống
        await page.route('**/api/auth/ms-login', async route => {
            await route.fulfill({ status: 200, json: { token: 'fake', role: 'student' } });
        });

        // Mock API Progress để cố định dữ liệu môn học, đảm bảo Test chạy ổn định không phụ thuộc DB thật
        await page.route('**/api/students/*/academic/progress', async route => {
            await route.fulfill({
                status: 200, json: {
                    status: 'success', data: {
                        general_info: {},
                        credit_groups: [],
                        courses_by_group: {},
                        current_courses: [
                            // Dữ liệu mô phỏng trùng khớp với TC_01 và hình UI
                            { maMon: "INT101", tenMon: "Nhập môn Công nghệ thông tin", soTC: 4, namHoc: "24-25", hocKy: "HK1", diemGK: 8, diemCK: null }
                        ],
                        radar_data: []
                    }
                }
            });
        });

        await page.goto('http://127.0.0.1:5173/');
        const loginBtn = page.getByRole('button', { name: /Đăng nhập/i });
        if (await loginBtn.isVisible({ timeout: 2000 })) await loginBtn.click();

        // Điều hướng vào Học tập -> Tiến độ học tập (dùng exact để né nút AI Chat)
        await page.getByRole('button', { name: 'Học tập', exact: true }).click();
        await page.getByRole('button', { name: /Tiến độ học tập/i }).click();

        // Đảm bảo module đã render xong
        await expect(page.getByText('Dự Đoán Điểm Số').first()).toBeVisible();
    });

    test('[TC_2.9_01, 02, 03]: Tự động điền điểm, tính trọng số CK và cảnh báo vượt 100%', async ({ page }) => {
        const ccWeight = page.locator('tr').filter({ hasText: 'Quá trình (CC)' }).locator('input').first();
        const gkWeight = page.locator('tr').filter({ hasText: 'Giữa kỳ (GK)' }).locator('input').first();
        const ckWeight = page.locator('tr').filter({ hasText: 'Cuối kỳ (CK)' }).locator('span').first();
        const gkScore = page.locator('tr').filter({ hasText: 'Giữa kỳ (GK)' }).locator('input').nth(1);

        // TC_01: Verify autofill. Khi chọn môn, điểm GK tự động điền 8 (lấy từ Mock API)
        await expect(gkScore).toHaveValue('8');

        // TC_02: Trọng số CK tự động cập nhật (100 - 20 - 40 = 40)
        await ccWeight.fill('20');
        await gkWeight.fill('40');
        await expect(ckWeight).toHaveText('40%');

        // TC_03: Cảnh báo khi vượt 100%. Trọng số CK bị kẹp về 0%.
        await ccWeight.fill('60');
        await gkWeight.fill('50');
        await expect(page.getByText(/vượt 100%/i)).toBeVisible();
        await expect(ckWeight).toHaveText('0%');
    });

    test('[TC_2.9_04]: Tính toán Điểm tổng kết với Điểm cộng', async ({ page }) => {
        const ccRow = page.locator('tr').filter({ hasText: 'Quá trình (CC)' });
        const gkRow = page.locator('tr').filter({ hasText: 'Giữa kỳ (GK)' });
        const ckRow = page.locator('tr').filter({ hasText: 'Cuối kỳ (CK)' });
        const bonusRow = page.locator('tr').filter({ hasText: 'Điểm cộng' });

        // Đặt trọng số: CC=10%, GK=30%, CK tự động là 60%
        await ccRow.locator('input').first().fill('10');
        await gkRow.locator('input').first().fill('30');
        await expect(ckRow.locator('span').first()).toHaveText('60%');

        // Đặt điểm số: CC=8, GK=7, CK=9, Điểm cộng=0.5
        await ccRow.locator('input').nth(1).fill('8');
        await gkRow.locator('input').nth(1).fill('7');
        await ckRow.locator('input').first().fill('9');
        await bonusRow.locator('input').first().fill('0.5');

        // Kỳ vọng: 8*0.1 + 7*0.3 + 9*0.6 + 0.5 = 8.80
        await expect(page.getByText('8.80').first()).toBeVisible();
    });

    test('[TC_2.9_05, 06, 07, 08]: Dự đoán điểm số và các trường hợp biên', async ({ page }) => {
        const ccRow = page.locator('tr').filter({ hasText: 'Quá trình (CC)' });
        const gkRow = page.locator('tr').filter({ hasText: 'Giữa kỳ (GK)' });
        const ckRow = page.locator('tr').filter({ hasText: 'Cuối kỳ (CK)' });

        // SỬA Ở ĐÂY: Dùng CSS Sibling Selector để tóm chính xác thẻ input nằm ngay sau label "Mục tiêu:"
        const targetInput = page.locator('label:has-text("Mục tiêu:") + input');

        // Setup Trọng số theo UI trong hình: CC=20%, GK=30%, CK=50%
        await ccRow.locator('input').first().fill('20');
        await gkRow.locator('input').first().fill('30');

        // Setup Điểm có sẵn: CC=10.0, GK=8 (Trùng khớp tuyệt đối với UI mẫu)
        await ccRow.locator('input').nth(1).fill('10.0');
        await gkRow.locator('input').nth(1).fill('8');

        // TC_06: Dự đoán hợp lệ -> Mục tiêu 8.0, xuất ra cần CK: 7.2
        await targetInput.fill('8.0');
        await expect(page.getByText('Cần CK:')).toBeVisible();
        await expect(page.getByText('7.2')).toBeVisible();

        // TC_07: Không khả thi -> Mục tiêu 10.0 (Cần CK 11.2 > 10.0)
        await targetInput.fill('10.0');
        await expect(page.getByText('Không khả thi')).toBeVisible();

        // TC_08: Đã đủ điểm -> Mục tiêu 4.0 (Hiện tại đã có 4.4 điểm)
        await targetInput.fill('4.0');
        await expect(page.getByText('Đã đủ điểm')).toBeVisible();

        // TC_05: Thay đổi mục tiêu dự đoán sang Giữa kỳ (GK)
        await page.getByTitle('Dự đoán điểm Giữa kỳ (GK)').click();
        await expect(page.getByText('Cần GK:')).toBeVisible();

        // Khi dự đoán GK, ta cần bổ sung điểm CK
        await ckRow.locator('input').first().fill('8.8');
        await targetInput.fill('8.0');

        // Kỳ vọng GK cần = (8.0 - (10*0.2 + 8.8*0.5)) / 0.3 = 5.333... -> Làm tròn 5.3
        await expect(page.getByText('5.3')).toBeVisible();
    });
});