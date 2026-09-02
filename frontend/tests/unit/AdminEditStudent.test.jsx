import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { AdminApp } from '../../src/app/AdminSections';

global.fetch = vi.fn();

const mockAdminProfile = { email: 'admin@hcmus.edu.vn', name: 'Quản trị', msid: 'AD' };
const mockStudent = { mssv: '24127001', hoTen: 'Nguyễn Văn A', email: 'a@sv', khoa: '2024', bacDT: 'ĐH', nganh: 'CNTT', loaiDT: 'CQ' };

describe('Unit Test: Update Student Academic Status (UC 2.19)', () => {

    beforeEach(async () => {
        vi.clearAllMocks();
        global.fetch.mockImplementation((url) => {
            if (url.includes('/api/admin/students/24127001')) {
                // Mock API GET chi tiết sinh viên
                if (url.includes('PUT')) {
                    return Promise.resolve({ ok: true, json: async () => ({ status: 'success' }) });
                }
                return Promise.resolve({ ok: true, json: async () => ({ status: 'success', data: { ...mockStudent, family: [] } }) });
            }
            if (url.includes('/api/admin/students')) {
                // Đảm bảo không bắt nhầm sang POST bằng cách check method nếu cần (mặc định là GET)
                return Promise.resolve({ ok: true, json: async () => ({ status: 'success', data: [mockStudent] }) });
            }
            if (url.includes('/api/admin/profile-edit-permission')) {
                return Promise.resolve({ ok: true, json: async () => ({ status: 'success', data: { enabled: false } }) });
            }
            if (url.includes('/api/admin/sidebar-badges')) {
                return Promise.resolve({ ok: true, json: async () => ({ status: 'success', data: {} }) });
            }
            return Promise.resolve({ ok: true, json: async () => ({ status: 'success', data: [] }) });
        });

        await act(async () => {
            render(<AdminApp onLogout={vi.fn()} HelpButton={() => <div />} adminProfile={mockAdminProfile} />);
        });

        // Chờ render xong bảng sinh viên và click vào dòng đầu tiên
        await act(async () => { fireEvent.click(await screen.findByText('Nguyễn Văn A')); });
        await screen.findByText('Hồ sơ sinh viên'); // Đợi Modal mở
    });

    it('[TC_2.19_01 & 02]: Verify transitioning to Edit mode and Read-only fields', async () => {
        // [TC_01] Bấm nút Chỉnh sửa (Dùng exact match để không bắt nhầm "Quyền chỉnh sửa")
        const editBtn = screen.getByRole('button', { name: 'Chỉnh sửa', exact: true });
        await act(async () => { fireEvent.click(editBtn); });

        // Nút Lưu và Hủy xuất hiện
        expect(screen.getByRole('button', { name: 'Lưu thay đổi' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Huỷ' })).toBeInTheDocument();

        // [TC_02] Kiểm tra ô nhập "Họ và tên" có tồn tại (đã chuyển thành thẻ <input>)
        const nameInput = screen.getByDisplayValue('Nguyễn Văn A');
        expect(nameInput.tagName).toBe('INPUT');

        // Kiểm tra MSSV vẫn KHÔNG phải là thẻ <input> (không tìm thấy input nào có value là 24127001)
        const mssvInput = screen.queryByDisplayValue('24127001');
        expect(mssvInput).not.toBeInTheDocument();
        // Nhưng text 24127001 vẫn tồn tại trên màn hình
        expect(screen.getAllByText(/24127001/)[0]).toBeInTheDocument();
    });

    it('[TC_2.19_03 & 04]: Verify local state updates and Cancel action', async () => {
        await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Chỉnh sửa', exact: true })); });

        // [TC_03] Gõ đổi tên
        const nameInput = screen.getByDisplayValue('Nguyễn Văn A');
        await act(async () => { fireEvent.change(nameInput, { target: { value: 'Nguyễn Văn B' } }); });

        expect(screen.getByDisplayValue('Nguyễn Văn B')).toBeInTheDocument();

        // [TC_04] Bấm Hủy
        await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Huỷ' })); });

        // Form revert lại tên cũ, mode quay về view (không còn nút Lưu)
        expect(screen.queryByRole('button', { name: 'Lưu thay đổi' })).not.toBeInTheDocument();
        expect(screen.getAllByText('Nguyễn Văn A')[0]).toBeInTheDocument();
        expect(screen.queryByDisplayValue('Nguyễn Văn B')).not.toBeInTheDocument();
    });

    it('[TC_2.19_05]: Verify Save action triggers API and updates parent', async () => {
        await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Chỉnh sửa', exact: true })); });

        // Đổi tên
        const nameInput = screen.getByDisplayValue('Nguyễn Văn A');
        await act(async () => { fireEvent.change(nameInput, { target: { value: 'Nguyễn Văn Mới' } }); });

        // Bấm Lưu thay đổi
        await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' })); });

        // Xác minh API PUT được gọi
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/admin/students/24127001'),
                expect.objectContaining({
                    method: 'PUT',
                    body: expect.stringContaining('"hoTen":"Nguyễn Văn Mới"')
                })
            );
        });

        // Xác minh modal quay về chế độ view
        expect(screen.queryByRole('button', { name: 'Lưu thay đổi' })).not.toBeInTheDocument();
    });
});