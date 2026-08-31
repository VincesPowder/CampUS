import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { AcademicSection, ProgressSection } from '../../src/app/StudentSections';

// Mock MSAL
vi.mock('@azure/msal-react', () => ({
    useMsal: () => ({ accounts: [{ username: '24127158@student.hcmus.edu.vn', name: 'Nguyễn Trần Lan Duy' }] })
}));

describe('Unit Test: View Academic Progress (UC 2.7)', () => {
    beforeEach(() => {
        global.fetch = vi.fn((url) => {
            if (url.includes('/summary')) {
                // Mock cho TC_04: Học kỳ không có dữ liệu
                if (url.includes('HK999')) {
                    return Promise.resolve({ ok: true, json: () => Promise.resolve({ status: "success", data: { courses: [] } }) });
                }
                // Mock cho TC_02: Chuyển sang Học kỳ 2
                if (url.includes('HK002')) {
                    return Promise.resolve({
                        ok: true, json: () => Promise.resolve({
                            status: "success", data: { courses: [{ mamh: "MTH101", tenmh: "Giải tích 1", sotc: 4, ten_hocky: "HK002", diem_gk: 8, diem_ck: 9, diem_tongket: 8.5, ketqua: "Đạt" }] }
                        })
                    });
                }
                // Mặc định (HK001) cho TC_03: Xử lý điểm null
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        status: "success",
                        data: {
                            gpa_10: 8.5, gpa_4: 3.6, total_passed: 40,
                            courses: [
                                { mamh: "CS101", tenmh: "Cấu trúc dữ liệu", sotc: 4, ten_hocky: "HK001", diem_gk: null, diem_ck: null, diem_tongket: null, ketqua: "Chưa đạt" }
                            ]
                        }
                    })
                });
            }
            if (url.includes('/progress')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        status: "success",
                        data: { completed_credits: 40, total_credits: 120, gpa: 8.5, conditions: { gdtc: true, gdqp: true, foreign_language: false } }
                    })
                });
            }
            return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
        });
        vi.clearAllMocks();
    });

    // ==========================================
    // TC_2.7_01: Chuyển Tab
    // ==========================================
    it('[TC_2.7_01]: Verify tab switching between "Tổng kết" and "Tiến độ học tập"', async () => {
        render(<AcademicSection />);

        // Mặc định ở tab Tổng kết, Combobox (Select lọc học kỳ) phải hiển thị
        expect(screen.getByRole('combobox')).toBeInTheDocument();

        // Click chuyển sang Tab Tiến độ
        fireEvent.click(screen.getByRole('button', { name: /Tiến độ học tập/i }));

        await waitFor(() => {
            // Dropdown biến mất, thay bằng UI của Tiến độ học tập
            expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
            expect(screen.getByText('Dự Đoán Điểm Số Cần Đạt')).toBeInTheDocument();
        });
    });

    // ==========================================
    // TC_2.7_02: Lọc Học kỳ
    // ==========================================
    it('[TC_2.7_02]: Verify grade filtering by Academic Year and Semester in "Tổng kết"', async () => {
        render(<AcademicSection subTab="tong-ket" />);

        // Đợi dữ liệu lần 1 load xong
        await screen.findByText('Cấu trúc dữ liệu');

        // Đổi giá trị của filter dropdown sang HK002
        const dropdown = screen.getByRole('combobox');
        fireEvent.change(dropdown, { target: { value: 'HK002' } });

        // Xác nhận fetch API được gọi với param mới và UI cập nhật môn mới
        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('ma_hocky=HK002'));
        expect(await screen.findByText('Giải tích 1')).toBeInTheDocument();
    });

    // ==========================================
    // TC_2.7_03: Xử lý Null ra "—"
    // ==========================================
    it('[TC_2.7_03]: Verify grade data mapping handles null values as "—"', async () => {
        render(<AcademicSection subTab="tong-ket" />);
        await screen.findByText('Cấu trúc dữ liệu');

        // Môn học có điểm null sẽ render dấu "—"
        const nullCells = await screen.findAllByText('—');
        expect(nullCells.length).toBeGreaterThan(0);
    });

    // ==========================================
    // TC_2.7_04: Hiển thị Empty State
    // ==========================================
    it('[TC_2.7_04]: Verify empty state handling when no courses match', async () => {
        // Ép API trả về mảng courses rỗng ngay từ đầu
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ status: "success", data: { courses: [] } })
        });

        render(<AcademicSection subTab="tong-ket" />);

        // Chờ giao diện render thông báo rỗng
        expect(await screen.findByText('Chưa có dữ liệu điểm')).toBeInTheDocument();
    });

    // ==========================================
    // TC_2.7_05: Thông tin chung (Data binding)
    // ==========================================
    it('[TC_2.7_05]: Verify "Thông tin chung" (General Info) data binding and math', async () => {
        render(<AcademicSection subTab="tien-do" />);

        // Kiểm tra data binding hiển thị tiến độ từ API progress
        expect(await screen.findByText('40')).toBeInTheDocument(); // completed_credits
        expect(screen.getByText('/ 120 Tín chỉ')).toBeInTheDocument(); // total_credits
    });

    // ==========================================
    // TC_2.7_06: Donut Chart
    // ==========================================
    it('[TC_2.7_06]: Verify "Tiến độ tín chỉ" (Credit Progress Donut Chart) rendering', async () => {
        // Biểu đồ Tiến độ tín chỉ nằm trong component ProgressSection
        render(<ProgressSection />);

        // Kiểm tra chữ "Hoàn thành" và "Còn thiếu" xuất hiện trong chú thích
        expect(screen.getByText('Hoàn thành')).toBeInTheDocument();
        expect(screen.getByText('Còn thiếu')).toBeInTheDocument();

        // Kiểm tra Donut Chart renders thẻ SVG không bị lỗi
        const svgElements = document.querySelectorAll('svg');
        expect(svgElements.length).toBeGreaterThan(0);
    });

    // ==========================================
    // TC_2.7_07: Tooltip Radar Chart
    // ==========================================
    it('[TC_2.7_07]: Verify "Chỉ số phù hợp chuyên ngành" (Radar Chart) tooltip interactions', async () => {
        // Biểu đồ Radar nằm trong component ProgressSection
        render(<ProgressSection />);

        // Tìm element nhóm cánh sao của Radar (.rg)
        const radarGroups = document.querySelectorAll('g.rg');
        expect(radarGroups.length).toBeGreaterThan(0);

        // Mô phỏng sự kiện hover (mouseEnter) vào nhóm đầu tiên
        fireEvent.mouseEnter(radarGroups[0]);

        // Tooltip (class .rtt) phải tồn tại và chứa nội dung chuyên ngành tương ứng
        const tooltip = radarGroups[0].querySelector('.rtt');
        expect(tooltip).toBeInTheDocument();
        expect(tooltip).toHaveTextContent(/Trí tuệ nhân tạo|Hệ thống & Mạng|Phần mềm/i);
    });
});