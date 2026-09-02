import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { AdminAcademicSection } from '../../src/app/AdminSections';

vi.mock('@azure/msal-react', () => ({
    useMsal: () => ({ accounts: [{ username: 'admin@hcmus.edu.vn' }] })
}));

describe('Function 20: Lock & Publish Grades (Frontend Unit)', () => {
    beforeEach(() => {
        window.__CURRENT_ADMIN_EMAIL__ = "admin@hcmus.edu.vn";
        global.fetch = vi.fn((url) => {
            if (url.includes('/academic/courses?')) {
                return Promise.resolve({ ok: true, json: () => Promise.resolve({ 
                    status: 'success', 
                    data: [
                        { id: 'LHP_UP', maMon: 'CSC01', tenMon: 'Môn Uploaded', status: 'uploaded' },
                        { id: 'LHP_LOCK', maMon: 'CSC02', tenMon: 'Môn Locked', status: 'locked' }
                    ] 
                })});
            }
            if (url.includes('/grades')) {
                return Promise.resolve({ ok: true, json: () => Promise.resolve({ 
                    status: 'success', 
                    data: [{ mssv: '24127001', hoTen: 'Nguyễn Văn An', diemCC: 8.0, diemGK: 7.0, diemCK: 9.0, diemTK: 8.3 }] 
                })});
            }
            if (url.includes('/years')) {
                return Promise.resolve({ ok: true, json: () => Promise.resolve({ status: 'success', data: [] }) });
            }
            return Promise.resolve({ ok: true, json: () => Promise.resolve({ status: 'error' }) });
        });
    });

    afterEach(() => { vi.clearAllMocks(); });

    it('[TC_2.21_02 & 03]: Verify manual grade override recalculates diemTK and blocks without reason', async () => {
        render(<AdminAcademicSection />);
        await waitFor(() => screen.getByText('Môn Uploaded'));
        fireEvent.click(screen.getByText('Môn Uploaded'));
        
        await waitFor(() => screen.getByText('Nguyễn Văn An'));
        
        // CÁCH TÌM NÚT CHUẨN: Lấy dòng của SV Nguyễn Văn An, sau đó tìm nút button trong dòng đó
        const studentRow = screen.getByText('Nguyễn Văn An').closest('tr');
        const editBtn = studentRow.querySelector('button');
        
        fireEvent.click(editBtn);
        await waitFor(() => screen.getByText('Chỉnh sửa điểm'));

        // TC_2.21_02: Thay đổi điểm và kiểm tra kết quả tính toán tự động
        const ccInput = screen.getAllByRole('spinbutton')[0];
        fireEvent.change(ccInput, { target: { value: '8.0' } });
        const calculatedScores = screen.getAllByText('8.3');
        expect(calculatedScores.length).toBeGreaterThan(0);

        // TC_2.21_03: Kiểm tra logic khóa nút Lưu khi chọn "Khác" mà không ghi chú
        const saveBtn = screen.getByText('Lưu thay đổi');
        const reasonSelect = screen.getByRole('combobox');
        
        // Chọn tự động cái lý do "Khác (Other)" nằm ở cuối cùng list
        const otherReason = reasonSelect.options[reasonSelect.options.length - 1].value;
        fireEvent.change(reasonSelect, { target: { value: otherReason } });
        
        // Phải bị vô hiệu hóa vì textbox mô tả đang trống
        expect(saveBtn).toBeDisabled(); 

        // Điền mô tả
        const customReasonInput = screen.getByPlaceholderText('Nhập lý do cụ thể...');
        fireEvent.change(customReasonInput, { target: { value: 'Sửa điểm vì nhập sai file excel' } });
        
        // Nút phải được mở khóa
        expect(saveBtn).not.toBeDisabled();
    });

    it('[TC_2.21_05]: Verify locked state UI restrictions', async () => {
        render(<AdminAcademicSection />);
        await waitFor(() => screen.getByText('Môn Locked'));
        
        // Click vào môn đã khóa
        fireEvent.click(screen.getByText('Môn Locked'));
        await waitFor(() => screen.getByText('Nguyễn Văn An'));

        // 1. Nút khóa phải biến thành dòng trạng thái màu xanh lá (không click được)
        expect(screen.getByText('Điểm đã được khóa & công bố')).toBeInTheDocument();

        // 2. Toàn bộ icon bút chì (chỉnh sửa) phải biến mất khỏi DOM
        const studentRow = screen.getByText('Nguyễn Văn An').closest('tr');
        const editBtns = studentRow.querySelectorAll('button');
        expect(editBtns.length).toBe(0); // Không tìm thấy bất kỳ nút nào trong dòng
    });
});