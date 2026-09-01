import { test, expect } from '@playwright/test';

test.describe('Kiểm tra luồng Xem Tiến độ học tập - E2E (UC 2.7)', () => {

    test.beforeEach(async ({ page }) => {
        // Mock Login để vào thẳng App
        await page.route('**/api/auth/ms-login', async route => {
            await route.fulfill({ status: 200, json: { token: 'fake', role: 'student', user: { name: 'Duy' } } });
        });

        await page.goto('http://127.0.0.1:5173/');
        const loginBtn = page.getByRole('button', { name: /Đăng nhập/i });
        if (await loginBtn.isVisible({ timeout: 2000 })) await loginBtn.click();

        // Vào menu Học tập (SỬA LỖI Ở ĐÂY: Thêm exact: true để né nút Chat AI)
        await page.getByRole('button', { name: 'Học tập', exact: true }).click();

        // Đảm bảo trang Học tập đã load xong
        await expect(page.getByRole('button', { name: 'Tổng kết' }).first()).toBeVisible();
    });

    // =========================================================================
    // NHÓM 1: CÁC TEST CASE Ở TAB "TỔNG KẾT" (TC 02, TC 03, TC 04)
    // =========================================================================
    test('[TC_2.7_02, 03, 04]: Tab Tổng kết - Lọc điểm, Xử lý Null và Bảng trống', async ({ page }) => {
        // Mock API trả về danh sách điểm
        await page.route('**/api/students/*/academic/summary*', async route => {
            const url = new URL(route.request().url());
            if (url.searchParams.get('ma_hocky') === 'HK999') {
                // Trả về rỗng cho trường hợp Empty State [TC_04]
                await route.fulfill({ status: 200, json: { status: 'success', data: { courses: [] } } });
            } else {
                // Trả về data có chứa điểm null [TC_03]
                await route.fulfill({
                    status: 200, json: {
                        status: 'success', data: {
                            courses: [
                                { mamh: "CS101", tenmh: "Cấu trúc dữ liệu", sotc: 4, diem_gk: null, diem_ck: 8, ketqua: "Đạt" }
                            ]
                        }
                    }
                });
            }
        });

        // [TC_02]: Chọn một học kỳ có data từ dropdown
        await page.locator('select').first().selectOption('HK001');
        await expect(page.getByText('Cấu trúc dữ liệu')).toBeVisible();

        // [TC_03]: Cột giữa kỳ bị null, expect UI hiển thị dấu "—"
        await expect(page.getByText('—').first()).toBeVisible();

        // [TC_04]: Chọn học kỳ không có data để test Empty State
        // Dùng Playwright evaluate để ép đổi giá trị select thêm option HK ảo
        await page.locator('select').first().evaluate((node) => {
            const option = document.createElement('option');
            option.value = 'HK999';
            option.text = 'HK Ảo';
            node.appendChild(option);
        });
        await page.locator('select').first().selectOption('HK999');

        // SỬA LỖI UI MỚI: Update câu thông báo cho khớp với UI thực tế
        await expect(page.getByText('Chưa có môn học nào trong học kỳ này.')).toBeVisible();
    });

    // =========================================================================
    // NHÓM 2: CÁC TEST CASE CHUYỂN TAB VÀ XEM "TIẾN ĐỘ" (TC 01, TC 05, TC 06, TC 07)
    // =========================================================================
    test('[TC_2.7_01, 05, 06, 07]: Tab Tiến độ - Chuyển tab, Biểu đồ và Tooltip', async ({ page }) => {

        // Mock API GET progress cho các TC 05, 06, 07
        await page.route('**/api/students/*/academic/progress', async route => {
            await route.fulfill({
                status: 200, json: {
                    status: 'success', data: {
                        // SỬA LỖI MOCK DATA: Đồng bộ chuẩn cấu trúc general_info
                        general_info: { tong_tc_dat: 40, tong_tc_yc: 120 },
                        credit_groups: [],
                        courses_by_group: {},
                        current_courses: [],
                        radar_data: [
                            { label: ["Trí tuệ nhân tạo", "& KH Dữ liệu"], fullName: "Trí tuệ nhân tạo & Khoa học dữ liệu", score: 8.2, fullMark: 10 }
                        ]
                    }
                }
            });
        });

        // [TC_01]: Chuyển sang tab Tiến độ học tập
        const progressTab = page.getByRole('button', { name: /Tiến độ học tập/i });
        await progressTab.click();

        // Xác nhận chuyển Tab thành công: Chữ "Dự Đoán Điểm Số" sẽ xuất hiện
        await expect(page.getByText('Dự Đoán Điểm Số').first()).toBeVisible();

        // [TC_05]: Kiểm tra Data binding (Thông tin chung - Hiện Tiến độ tích lũy)
        await expect(page.getByText('Tổng TC tích lũy')).toBeVisible();
        await expect(page.getByRole('cell', { name: '40/120 TC' })).toBeVisible();

        // [TC_06 & 07]: Kiểm tra biểu đồ Radar và Tooltip (Hover)
        // Tìm element nhóm Radar (.rg) và hover
        const radarGroups = page.locator('g.rg'); // Các nhóm cánh sao trong SVG

        await expect(radarGroups.first()).toBeVisible({ timeout: 5000 });
        if (await radarGroups.count() > 0) {
            const firstGroup = radarGroups.first();
            await firstGroup.hover();

            // Tooltip class .rtt xuất hiện khi hover
            const tooltip = firstGroup.locator('.rtt');
            await expect(tooltip).toBeVisible();
        }
    });

});