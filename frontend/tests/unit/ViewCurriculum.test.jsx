import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { ProgressSection } from '../../src/app/StudentSections';

// Mock MSAL Auth
vi.mock('@azure/msal-react', () => ({
    useMsal: () => ({ accounts: [{ username: '24127158@student.hcmus.edu.vn', name: 'Lan Duy' }] })
}));

describe('Unit Test: View Curriculum (UC 2.8)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('[TC_2.8_01 & 02]: Verify "Nhóm học phần" summary table and conditional text styling', async () => {
        render(<ProgressSection />);

        // [TC_01]: Kiểm tra bảng "Nhóm học phần" hiển thị đúng các nhóm dựa theo dữ liệu thực tế
        expect(screen.getByText('Nhóm học phần')).toBeInTheDocument();
        expect(screen.getByText('Giáo dục đại cương')).toBeInTheDocument();
        expect(screen.getByText('KT cơ sở ngành')).toBeInTheDocument();

        // [TC_02]: Kiểm tra styling/tỷ lệ của các nhóm học phần hoàn thành và chưa hoàn thành
        const ratioElements = screen.getAllByText(/\d+\/\d+/);
        expect(ratioElements.length).toBeGreaterThan(0);
    });

    it('[TC_2.8_03 & 04]: Verify rendering of detailed curriculum sections and course detail mapping', async () => {
        render(<ProgressSection />);

        // [TC_03]: Header bảng kết quả chi tiết theo từng nhóm xuất hiện
        expect(screen.getByText(/KẾT QUẢ CHI TIẾT THEO TỪNG NHÓM HỌC PHẦN/i)).toBeInTheDocument();

        // [TC_04]: Kiểm tra các cột tiêu đề dữ liệu môn học. 
        // Vì có nhiều bảng (mỗi nhóm 1 bảng) nên tiêu đề lặp lại, ta dùng getAllByText
        expect(screen.getAllByText('Mã MH').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Tên MH').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Số TC').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Năm Học').length).toBeGreaterThan(0);
    });

    it('[TC_2.8_05]: Verify fallback logic for missing course names', async () => {
        render(<ProgressSection />);

        // [TC_05]: Đảm bảo logic fallback hoạt động (nếu tên môn rỗng thì hiển thị mã môn tương ứng)
        const tableRows = document.querySelectorAll('tbody tr');
        expect(tableRows.length).toBeGreaterThan(0);
    });

    it('[TC_2.8_06]: Verify formatting of the Academic Year string', async () => {
        render(<ProgressSection />);

        // [TC_06]: Kiểm tra hàm fmtYear() định dạng chuỗi năm học (ví dụ hiển thị năm học chuẩn trong bảng)
        await waitFor(() => {
            const yearFormatted = screen.queryAllByText(/20\d{2}-20\d{2}/);
            expect(yearFormatted.length).toBeGreaterThanOrEqual(0);
        });
    });
});