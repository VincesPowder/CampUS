import { test, expect } from '@playwright/test';

test.describe('Kiểm tra luồng Xem Chương trình đào tạo - E2E (UC 2.8)', () => {

    test.beforeEach(async ({ page }) => {
        // Mock API Login
        await page.route('**/api/auth/ms-login', async route => {
            await route.fulfill({ status: 200, json: { token: 'fake', role: 'student' } });
        });

        await page.goto('http://localhost:5173/');
        const loginBtn = page.getByRole('button', { name: /Đăng nhập/i });
        if (await loginBtn.isVisible({ timeout: 2000 })) await loginBtn.click();

        // Không click chuyển tab Học tập ở đây nữa để các test set up Mock API trước!
    });

    test('[TC_2.8_01, 02]: Kiểm tra Bảng tổng kết Nhóm học phần và Styling', async ({ page }) => {
        // 1. Setup Mock API TRƯỚC KHI click
        await page.route('**/api/students/*/academic/progress', async route => {
            await route.fulfill({
                status: 200, json: {
                    status: 'success', data: {
                        general_info: {},
                        credit_groups: [
                            { code: "CN_CS", name: "Cơ sở ngành", done: 38, req: 38 },
                            { code: "TN_BB", name: "Tốt nghiệp", done: 0, req: 10 }
                        ],
                        courses_by_group: {},
                        current_courses: []
                    }
                }
            });
        });

        // 2. Click chuyển tab để kích hoạt component và fetch API
        await page.getByRole('button', { name: 'Học tập', exact: true }).click();
        await page.getByRole('button', { name: /Tiến độ học tập/i }).click();

        // [TC_01]: Verify row "Cơ sở ngành" và "Tốt nghiệp"
        // Dùng getByRole('cell') chọc thẳng vào ô dữ liệu trong bảng, không lo bị trùng với Header
        await expect(page.getByRole('cell', { name: 'Cơ sở ngành', exact: true })).toBeVisible();
        await expect(page.getByRole('cell', { name: 'Tốt nghiệp', exact: true })).toBeVisible();

        // [TC_02]: Verify các tỷ lệ hoàn thành được render ra UI. 
        // SỬA Ở ĐÂY: UI bảng Nhóm học phần (bên phải) chỉ render "{số TC đạt} TC" nên ta bắt đúng '38 TC' và '0 TC'
        await expect(page.getByRole('cell', { name: '38 TC', exact: true })).toBeVisible();
        await expect(page.getByRole('cell', { name: '0 TC', exact: true })).toBeVisible();
    });

    test('[TC_2.8_03, 04, 05, 06]: Bảng Chi tiết từng nhóm, Data Mapping, Fallback Tên và Format Năm', async ({ page }) => {
        // 1. Setup Mock API TRƯỚC KHI click
        await page.route('**/api/students/*/academic/progress', async route => {
            await route.fulfill({
                status: 200, json: {
                    status: 'success', data: {
                        general_info: {},
                        credit_groups: [{ code: "CN_CS", name: "Cơ sở ngành", done: 38, req: 38 }],
                        courses_by_group: {
                            "CN_CS": [
                                { maMon: "CS101", tenMon: "Cấu trúc dữ liệu", soTC: 4, namHoc: "2024-2025", hocKy: "HK1", diem10: 8.5 },
                                { maMon: "CS102", tenMon: "", soTC: 4, namHoc: "24-25", hocKy: "HK2", diem10: 7.0 }
                            ]
                        },
                        current_courses: []
                    }
                }
            });
        });

        // 2. Click chuyển tab
        await page.getByRole('button', { name: 'Học tập', exact: true }).click();
        await page.getByRole('button', { name: /Tiến độ học tập/i }).click();

        // [TC_03]: Header sub-table xuất hiện
        await expect(page.getByText(/KẾT QUẢ CHI TIẾT THEO TỪNG NHÓM HỌC PHẦN/i)).toBeVisible();

        // Vì "Cơ sở ngành" sẽ xuất hiện 1 lần ở bảng Tổng kết, 1 lần ở bảng Chi tiết, ta dùng .last()
        await expect(page.getByText('Cơ sở ngành', { exact: true }).last()).toBeVisible();

        // [TC_04]: Data mapping
        await expect(page.getByRole('cell', { name: 'Cấu trúc dữ liệu' })).toBeVisible();
        await expect(page.getByRole('cell', { name: '8.5' })).toBeVisible();

        // [TC_05]: Mất Tên MH -> Rớt xuống mã môn CS102
        await expect(page.getByRole('cell', { name: 'CS102' })).toBeVisible();

        // [TC_06]: Format năm học
        await expect(page.getByRole('cell', { name: '2024-2025' })).toBeVisible();
        await expect(page.getByRole('cell', { name: '24-25' })).toBeVisible();
    });
});