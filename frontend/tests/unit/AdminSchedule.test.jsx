import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { AdminApp } from '../../src/app/AdminSections';

global.fetch = vi.fn();
window.confirm = vi.fn(() => true); // Mock hàm confirm() của trình duyệt khi xóa

const mockAdminProfile = { email: 'admin@hcmus.edu.vn', name: 'Quản trị', msid: 'AD' };

describe('Unit Test: Manage Schedules & Exams (UC 2.22)', () => {

    beforeEach(async () => {
        vi.clearAllMocks();
        global.fetch.mockImplementation((url) => {
            if (url.includes('/api/admin/schedule/classes')) {
                if (url.includes('DELETE')) return Promise.resolve({ ok: true, json: async () => ({ status: 'success' }) });
                if (url.includes('POST')) return Promise.resolve({ ok: true, json: async () => ({ status: 'success' }) });
                return Promise.resolve({
                    ok: true, json: async () => ({
                        status: 'success', data: [
                            { id: 'C1', maMon: 'CS101', tenMon: 'Cấu trúc dữ liệu', lop: '24C', giangVien: 'GV A', thu: 'Thứ hai', gio: '07:30', phong: 'A1', tuan: '1', hinhThuc: 'Trực tiếp' }
                        ]
                    })
                });
            }
            if (url.includes('/api/admin/schedule/exams')) {
                if (url.includes('POST')) return Promise.resolve({ ok: true, json: async () => ({ status: 'success' }) });
                return Promise.resolve({
                    ok: true, json: async () => ({
                        status: 'success', data: [
                            { id: 'E1', tenMon: 'Toán rời rạc', maNhom: '24C', ngayThi: '01/01/2026', thu: 'Thứ hai', ca: 'Ca 1', gio: '07:30', thoiGian: '90', phong: 'A1', soThi: 40, hinhThuc: 'Tự luận' }
                        ]
                    })
                });
            }
            if (url.includes('/api/admin/sidebar-badges')) return Promise.resolve({ ok: true, json: async () => ({ status: 'success', data: {} }) });
            return Promise.resolve({ ok: true, json: async () => ({ status: 'success', data: [] }) });
        });

        await act(async () => {
            render(<AdminApp onLogout={vi.fn()} HelpButton={() => <div />} adminProfile={mockAdminProfile} />);
        });

        // Điều hướng sang Lịch học / thi
        await act(async () => { fireEvent.click(screen.getAllByRole('button', { name: /Lịch học \/ thi/i })[0]); });
    });

    it('[TC_2.22_01]: Verify switching between TKB Tuần and TKB Thi views', async () => {
        // Mặc định là TKB Tuần
        expect(await screen.findByText('Cấu trúc dữ liệu')).toBeInTheDocument();

        // Chuyển sang Lịch thi
        await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Lịch thi' })); });
        expect(await screen.findByText('Toán rời rạc')).toBeInTheDocument();
        expect(screen.queryByText('Cấu trúc dữ liệu')).not.toBeInTheDocument();
    });

    it('[TC_2.22_02 & 04]: Verify auto field population in Exam Modal and Submission', async () => {
        // Chuyển sang Lịch thi và mở Modal Thêm lịch thi
        await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Lịch thi' })); });
        await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Thêm lịch thi' })); });

        // Tìm Dropdown Ca thi và Ô Input Giờ thi
        const caSelect = screen.getByDisplayValue('Ca 1');
        const gioInput = screen.getByDisplayValue('07:30 – 09:30'); // Giá trị mặc định của blank form

        // Đổi sang Ca 2
        await act(async () => { fireEvent.change(caSelect, { target: { value: 'Ca 2' } }); });

        // [TC_02] Xác minh Giờ thi tự động đổi thành "09:30 – 11:30" theo đúng dictionary caMap
        expect(gioInput).toHaveValue('09:30 – 11:30');

        // Điền Tên môn và Lưu [TC_04]
        const inputs = screen.getAllByRole('textbox');
        await act(async () => { fireEvent.change(inputs[0], { target: { value: 'Môn Thi Test' } }); });

        // Nút Lưu nằm trong Modal sẽ là phần tử đầu tiên trong mảng
        const saveBtn = screen.getAllByRole('button', { name: 'Thêm lịch thi', exact: true })[0];
        await act(async () => { fireEvent.click(saveBtn); });

        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/admin/schedule/exams'),
            expect.objectContaining({ method: 'POST', body: expect.stringContaining('"tenMon":"Môn Thi Test"') })
        );
    });

    it('[TC_2.22_05]: Verify schedule deletion logic in the list view', async () => {
        // Lấy nút xóa (thùng rác) của dòng Cấu trúc dữ liệu
        const deleteBtn = await screen.findByTitle('Xóa');
        await act(async () => { fireEvent.click(deleteBtn); });

        // Xác minh hàm confirm() đã được gọi và API DELETE đã bắn đi
        expect(window.confirm).toHaveBeenCalled();
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/admin/schedule/classes/C1'),
            expect.objectContaining({ method: 'DELETE' })
        );
    });
});