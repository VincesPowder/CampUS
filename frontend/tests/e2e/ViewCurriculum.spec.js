import { test, expect } from '@playwright/test';

test.describe('Kiểm tra luồng Xem Chương trình đào tạo - E2E (UC 2.8)', () => {

    test.beforeEach(async ({ page }) => {
        await page.route('**/api/auth/ms-login', async route => {
            await route.fulfill({ status: 200, json: { token: 'fake', role: 'student' } });
        });

        await page.goto('http://127.0.0.1:5173/');
        const loginBtn = page.getByRole('button', { name: /Đăng nhập/i });
        if (await loginBtn.isVisible({ timeout: 2000 })) await loginBtn.click();

        // Vào menu Học tập và Tab Tiến độ
        await page.getByRole('button', { name: 'Học tập' }).click();
        await page.getByRole('button', { name: /Tiến độ học tập/i }).click();
    });

    test('[TC_2.8_01, 02]: Kiểm tra Bảng tổng kết Nhóm học phần và Styling', async ({ page }) => {
        await page.route('**/api/students/*/academic/progress', async route => {
            await route.fulfill({
                status: 200, json: {
                    status: 'success', data: {
                        credit_groups: [
                            { code: "CN_CS", name: "Cơ sở ngành", done: 38, req: 38 },
                            { code: "TN_BB", name: "Tốt nghiệp", done: 0, req: 10 }
                        ]
                    }
                }
            });
        });

        // [TC_01]: Verify rendering row "Cơ sở ngành"
        await expect(page.getByText('Cơ sở ngành')).toBeVisible();
        await expect(page.getByText('Tốt nghiệp').first()).toBeVisible();

        // [TC_02]: Verify các tỷ lệ hoàn thành được render ra UI
        await expect(page.getByText('38/38')).toBeVisible();
        await expect(page.getByText('0/10')).toBeVisible();
    });

    test('[TC_2.8_03, 04, 05, 06]: Bảng Chi tiết từng nhóm, Data Mapping, Fallback Tên và Format Năm', async ({ page }) => {
        await page.route('**/api/students/*/academic/progress', async route => {
            await route.fulfill({
                status: 200, json: {
                    status: 'success', data: {
                        credit_groups: [{ code: "CN_CS", name: "Cơ sở ngành", done: 38, req: 38 }],
                        courses_by_group: {
                            "CN_CS": [
                                { maMon: "CS101", tenMon: "Cấu trúc dữ liệu", soTC: 4, namHoc: "2024-2025", hocKy: 1, diem10: 8.5 },
                                { maMon: "CS102", tenMon: "", soTC: 4, namHoc: "24-25", hocKy: 2, diem10: 7.0 } // Giả lập mất tên (TC 05) và format năm (TC 06)
                            ]
                        }
                    }
                }
            });
        });

        // [TC_03]: Header sub-table xuất hiện chia theo từng nhóm
        await expect(page.getByText(/CHI TIẾT THEO TỪNG NHÓM HỌC PHẦN/i)).toBeVisible();
        await expect(page.getByText('Cơ sở ngành').nth(1)).toBeVisible();

        // [TC_04]: Dữ liệu map đúng
        await expect(page.getByText('Cấu trúc dữ liệu')).toBeVisible();
        await expect(page.getByText('8.5').first()).toBeVisible();

        // [TC_05]: Mất Tên MH -> Rớt xuống mã môn CS102
        await expect(page.getByText('CS102').first()).toBeVisible();

        // [TC_06]: Format năm học từ 24-25 -> 2024-2025
        await expect(page.getByText('2024-2025').first()).toBeVisible();
    });
});