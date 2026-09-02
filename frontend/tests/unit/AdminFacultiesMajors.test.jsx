import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { AdminApp } from '../../src/app/AdminSections';

global.fetch = vi.fn();

const mockAdminProfile = { email: 'admin@hcmus.edu.vn', name: 'Quản trị viên', msid: 'ADMIN' };

describe('Unit Test: Manage Faculties & Majors Integration (UC 2.14)', () => {

    beforeEach(async () => {
        vi.clearAllMocks();
        global.fetch.mockResolvedValue({
            ok: true,
            json: async () => ({
                status: 'success',
                data: [
                    { mssv: 'SV01', hoTen: 'Nguyễn A', nganh: 'Khoa Công nghệ thông tin', bacDT: 'Đại học' },
                    { mssv: 'SV02', hoTen: 'Lê B', nganh: 'Khoa Hóa học', bacDT: 'Đại học' }
                ]
            })
        });

        await act(async () => {
            render(<AdminApp onLogout={vi.fn()} HelpButton={() => <div />} adminProfile={mockAdminProfile} />);
        });
    });

    it('[TC_2.14_01 & TC_2.14_02]: Verify dynamic UI dropdown generation and grid mapping', async () => {
        // [TC_02]: Xác minh Tên Khoa/Ngành map đúng vào bảng
        expect(await screen.findByText('Khoa Công nghệ thông tin')).toBeInTheDocument();
        expect(screen.getByText('Khoa Hóa học')).toBeInTheDocument();

        // [TC_01]: Xác minh Bộ lọc tự động cào tên Khoa/Ngành từ list
        const filterBtn = screen.getByRole('button', { name: /Bộ lọc/i });
        await act(async () => { fireEvent.click(filterBtn); });

        // Tìm combobox (select) của field Khoa/Ngành
        const nganhSelects = screen.getAllByRole('combobox');
        // Dropdown thứ 2 là của Khoa/Ngành theo thứ tự UI (Khoá -> Khoa/Ngành -> Bậc ĐT)
        const nganhDropdown = nganhSelects[1];

        expect(nganhDropdown).toHaveTextContent('Khoa Công nghệ thông tin');
        expect(nganhDropdown).toHaveTextContent('Khoa Hóa học');
    });
});