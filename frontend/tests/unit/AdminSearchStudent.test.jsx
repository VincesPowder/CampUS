import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { AdminApp } from '../../src/app/AdminSections';

global.fetch = vi.fn();

const mockAdminProfile = { email: 'admin@hcmus.edu.vn', name: 'Quản trị', msid: 'AD' };

const mockStudents = [
    { mssv: '24127001', hoTen: 'Nguyễn Văn A', email: 'nva@student.hcmus.edu.vn', gioiTinh: 'Nam', khoa: '2024', bacDT: 'Đại học', nganh: 'CNTT', loaiDT: 'Chính quy' },
    { mssv: '23127002', hoTen: 'Trần Thị B', email: 'ttb@student.hcmus.edu.vn', gioiTinh: 'Nữ', khoa: '2023', bacDT: 'Đại học', nganh: 'Hóa học', loaiDT: 'Chính quy' }
];

describe('Unit Test: View & Search Student Directory (UC 2.18)', () => {

    beforeEach(async () => {
        vi.clearAllMocks();
        global.fetch.mockImplementation((url) => {
            if (url.includes('/api/admin/students/24127001')) {
                return Promise.resolve({ ok: true, json: async () => ({ status: 'success', data: { ...mockStudents[0], family: [] } }) });
            }
            if (url.includes('/api/admin/students')) {
                return Promise.resolve({ ok: true, json: async () => ({ status: 'success', data: mockStudents }) });
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
    });

    it('[TC_2.18_01]: Verify text-based search functionality', async () => {
        expect(await screen.findByText('Nguyễn Văn A')).toBeInTheDocument();
        expect(screen.getByText('Trần Thị B')).toBeInTheDocument();

        // Gõ tìm kiếm MSSV
        const searchInput = screen.getByPlaceholderText('Tìm kiếm theo tên, MSSV, email...');
        await act(async () => { fireEvent.change(searchInput, { target: { value: '24127001' } }); });

        // Component tự lọc (Client-side)
        expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument();
        expect(screen.queryByText('Trần Thị B')).not.toBeInTheDocument();
        expect(screen.getByText('Hiển thị 1 / 2 sinh viên')).toBeInTheDocument();
    });

    it('[TC_2.18_02 & 03]: Verify multi-criteria filtering and clear filter', async () => {
        // Mở bộ lọc (Lúc này chỉ có 1 nút)
        await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Bộ lọc/i })); });

        // Lọc theo Khoa/Ngành "Hóa học"
        const selects = screen.getAllByRole('combobox');
        const nganhFilter = selects[1];
        await act(async () => { fireEvent.change(nganhFilter, { target: { value: 'Hóa học' } }); });

        expect(screen.queryByText('Nguyễn Văn A')).not.toBeInTheDocument();
        expect(screen.getByText('Trần Thị B')).toBeInTheDocument();

        // SỬA LỖI Ở ĐÂY: Dùng getAllByRole và lấy phần tử đầu tiên để né nút "Xóa bộ lọc"
        const filterBtns = screen.getAllByRole('button', { name: /Bộ lọc/i });
        expect(filterBtns[0]).toHaveTextContent('1');

        // Bấm xóa bộ lọc
        await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Xóa bộ lọc' })); });
        expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument();
        expect(screen.getByText('Trần Thị B')).toBeInTheDocument();
    });

    it('[TC_2.18_04 & 05]: Verify Student Detail Modal navigation and Tab switching', async () => {
        // Click vào 1 dòng sinh viên
        await act(async () => { fireEvent.click(await screen.findByText('Nguyễn Văn A')); });

        // Modal mở ra
        expect(await screen.findByText('Hồ sơ sinh viên')).toBeInTheDocument();
        expect(screen.getByText('Thông tin gia đình')).toBeInTheDocument();

        // Click chuyển tab Thông tin gia đình
        await act(async () => { fireEvent.click(screen.getByText('Thông tin gia đình')); });

        // Render UI của tab gia đình
        expect(await screen.findByText('Chưa có thông tin gia đình trong hệ thống.')).toBeInTheDocument();

        // Chuyển lại tab Hồ sơ
        await act(async () => { fireEvent.click(screen.getByText('Hồ sơ sinh viên')); });
        expect(await screen.findByText('Thông tin học tập')).toBeInTheDocument();
    });
});