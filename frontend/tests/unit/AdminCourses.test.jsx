import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { AdminApp } from '../../src/app/AdminSections';

global.fetch = vi.fn();

const mockAdminProfile = { email: 'admin@hcmus.edu.vn', name: 'Quản trị', msid: 'AD' };

describe('Unit Test: Manage Courses (UC 2.16)', () => {

    beforeEach(async () => {
        vi.clearAllMocks();
        global.fetch.mockImplementation((url) => {
            if (url.includes('/api/admin/academic/courses')) {
                // SỬA Ở ĐÂY: Dùng url.includes('khoa=') để né vụ URL encode
                if (url.includes('khoa=')) {
                    return Promise.resolve({
                        ok: true, json: async () => ({
                            status: 'success', data: [
                                { id: 'LHP2', maMon: 'CHE101', tenMon: 'Hóa đại cương', lop: '24C02', soTC: 3, khoa: 'Hóa học', giangVien: 'Lê Văn B', status: 'uploaded', hocKy: 1, namHoc: '25-26' }
                            ]
                        })
                    });
                }

                return Promise.resolve({
                    ok: true, json: async () => ({
                        status: 'success', data: [
                            { id: 'LHP1', maMon: 'FIT101', tenMon: 'Cấu trúc dữ liệu', lop: '24C01', soTC: 4, khoa: 'CNTT', giangVien: 'Nguyễn Văn A', status: 'pending', hocKy: 1, namHoc: '25-26' },
                            { id: 'LHP2', maMon: 'CHE101', tenMon: 'Hóa đại cương', lop: '24C02', soTC: 3, khoa: 'Hóa học', giangVien: 'Lê Văn B', status: 'uploaded', hocKy: 1, namHoc: '25-26' }
                        ]
                    })
                });
            }
            if (url.includes('/api/admin/academic/years')) {
                return Promise.resolve({
                    ok: true, json: async () => ({
                        status: 'success', data: [{ id: '25-26', label: '2025–2026', status: 'open', soHocKy: 3 }]
                    })
                });
            }
            if (url.includes('/api/admin/sidebar-badges')) {
                return Promise.resolve({ ok: true, json: async () => ({ status: 'success', data: {} }) });
            }
            return Promise.resolve({ ok: true, json: async () => ({ status: 'success', data: [] }) });
        });

        await act(async () => {
            render(<AdminApp onLogout={vi.fn()} HelpButton={() => <div />} adminProfile={mockAdminProfile} />);
        });

        // Chuyển sang Quản lý học tập (Mặc định ở tab Môn học & Điểm)
        await act(async () => {
            fireEvent.click(screen.getAllByRole('button', { name: /Quản lý học tập/i })[0]);
        });
    });

    it('[TC_2.16_01 & TC_2.16_03]: Verify grid rendering and filtering', async () => {
        // [TC_01] Grid Render ban đầu
        expect(await screen.findByText('Cấu trúc dữ liệu')).toBeInTheDocument();
        expect(screen.getByText('Hóa đại cương')).toBeInTheDocument();

        // [TC_03] Chọn Lọc khoa "Hóa học"
        const khoaFilter = screen.getByDisplayValue('Tất cả khoa');
        await act(async () => { fireEvent.change(khoaFilter, { target: { value: 'Hóa học' } }); });

        // Đợi React render lại theo API mới
        await waitFor(() => {
            expect(screen.queryByText('Cấu trúc dữ liệu')).not.toBeInTheDocument();
        });
        expect(screen.getByText('Hóa đại cương')).toBeInTheDocument();
    });

    it('[TC_2.16_04 & TC_2.16_05]: Verify Add Modal validation and Payload', async () => {
        // 1. Phải vào chi tiết Năm học mới có nút Thêm môn học
        await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Năm học' })); });
        await act(async () => { fireEvent.click(await screen.findByText('2025–2026')); });

        // Mở Modal
        const addCourseBtn = await screen.findByRole('button', { name: /Thêm môn học/i });
        await act(async () => { fireEvent.click(addCourseBtn); });

        // [TC_04] Nút Submit bị disable khi rỗng
        // SỬA Ở ĐÂY: Vì modal render trước toolbar trong DOM, nút Modal sẽ mang index 0
        const submitBtns = screen.getAllByRole('button', { name: 'Thêm môn học' });
        const submitBtn = submitBtns[0];

        expect(submitBtn).toBeDisabled();

        // [TC_05] Nhập dữ liệu
        const inputs = screen.getAllByRole('textbox');
        await act(async () => {
            fireEvent.change(inputs[0], { target: { value: 'PHY101' } }); // Mã môn
            fireEvent.change(inputs[1], { target: { value: 'Vật lý 1' } }); // Tên môn
        });

        // Nút đã được Enable
        expect(submitBtn).not.toBeDisabled();

        // Bấm Submit
        await act(async () => { fireEvent.click(submitBtn); });

        // Xác minh payload bắn xuống API POST
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/admin/academic/courses'),
            expect.objectContaining({
                method: 'POST',
                body: expect.stringContaining('"maMon":"PHY101"')
            })
        );
    });
});