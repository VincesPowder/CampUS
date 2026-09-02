import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { AdminAcademicSection } from '../../src/app/AdminSections';

vi.mock('@azure/msal-react', () => ({
    useMsal: () => ({ accounts: [{ username: 'admin@hcmus.edu.vn' }] })
}));

describe('Function 19: Import & Validate Class Grades (Frontend Unit)', () => {
    beforeEach(() => {
        window.__CURRENT_ADMIN_EMAIL__ = "admin@hcmus.edu.vn";
        global.fetch = vi.fn((url) => {
            if (url.includes('/academic/courses?')) {
                return Promise.resolve({ ok: true, json: () => Promise.resolve({ 
                    status: 'success', 
                    data: [{ id: 'LHP01', maMon: 'CSC10001', tenMon: 'Nhập môn CNTT', lop: '24C01', status: 'uploaded' }] 
                })});
            }
            if (url.includes('/grades')) {
                return Promise.resolve({ ok: true, json: () => Promise.resolve({ 
                    status: 'success', 
                    data: [{ mssv: '24127001', hoTen: 'Nguyễn Văn An', diemCC: null, diemGK: null, diemCK: null, diemTK: null }] 
                })});
            }
            if (url.includes('/years')) {
                return Promise.resolve({ ok: true, json: () => Promise.resolve({ status: 'success', data: [] }) });
            }
            return Promise.resolve({ ok: true, json: () => Promise.resolve({ status: 'error' }) });
        });
    });

    afterEach(() => { vi.clearAllMocks(); });

    const openEditModal = async () => {
        render(<AdminAcademicSection />);
        await waitFor(() => screen.getByText('Nhập môn CNTT'));
        fireEvent.click(screen.getByText('Nhập môn CNTT'));
        
        await waitFor(() => screen.getByText('Nguyễn Văn An'));
        
        // CÁCH TÌM NÚT CHUẨN HƠN: Lấy dòng <tr> chứa "Nguyễn Văn An" rồi tìm tất cả nút <button> bên trong dòng đó. 
        // Nút cuối cùng trong dòng chính là nút Edit (có chứa icon Pencil).
        const row = screen.getByText('Nguyễn Văn An').closest('tr');
        const editBtn = row.querySelectorAll('button')[0];
        
        fireEvent.click(editBtn);
        
        await waitFor(() => screen.getByText('Chỉnh sửa điểm'));
    };

    it('[TC_2.20_03]: Verify grade boundaries validation', async () => {
        await openEditModal();
        
        // Tìm ô input bằng placeholder hoặc role
        const ccInput = screen.getAllByRole('spinbutton')[0];
        
        // Form HTML5 phải giới hạn khoảng điểm hợp lệ 0-10
        expect(ccInput).toHaveAttribute('min', '0');
        expect(ccInput).toHaveAttribute('max', '10');
    });

    it('[TC_2.20_04]: Verify automatic calculation of Overall Grade (diemTK) upon import/edit', async () => {
        await openEditModal();
        
        const ccInput = screen.getAllByRole('spinbutton')[0];
        const gkInput = screen.getAllByRole('spinbutton')[1];
        const ckInput = screen.getAllByRole('spinbutton')[2];

        // Nhập điểm: 5*0.1 + 6*0.3 + 7*0.6 = 6.5
        fireEvent.change(ccInput, { target: { value: '5.0' } });
        fireEvent.change(gkInput, { target: { value: '6.0' } });
        fireEvent.change(ckInput, { target: { value: '7.0' } });

        expect(screen.getByText('6.5')).toBeInTheDocument();
    });

    it('[TC_2.20_06]: Verify "Lưu thay đổi" action is blocked without Edit Reason', async () => {
        await openEditModal();
        const saveBtn = screen.getByText('Lưu thay đổi');
        
        // Ban đầu chưa nhập lý do -> Nút lưu bị khóa
        expect(saveBtn).toBeDisabled();

        const reasonSelect = screen.getByRole('combobox');
        
        // Lấy tự động option hợp lệ đầu tiên trong danh sách thả xuống (bỏ qua option 0 là "— Chọn lý do —")
        const firstValidReason = reasonSelect.options[1].value;
        
        fireEvent.change(reasonSelect, { target: { value: firstValidReason } });

        // Nhập lý do thành công -> Mở khóa
        expect(saveBtn).not.toBeDisabled();
    });
    
});