import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { AdminApp } from '../../src/app/AdminSections';

global.fetch = vi.fn();

const mockAdminProfile = { email: 'admin@hcmus.edu.vn', name: 'Quản trị', msid: 'AD' };

describe('Unit Test: Manage Academic Years (UC 2.15)', () => {

    beforeEach(async () => {
        vi.clearAllMocks();
        global.fetch.mockImplementation((url) => {
            // SỬA Ở ĐÂY: Thêm Mock API cho Students để fix lỗi undefined.map()
            if (url.includes('/api/admin/students')) {
                return Promise.resolve({ ok: true, json: async () => ({ status: 'success', data: [] }) });
            }
            if (url.includes('/api/admin/academic/years')) {
                return Promise.resolve({
                    ok: true, json: async () => ({
                        status: 'success', data: [
                            { id: '25-26', label: '2025–2026', ngayBatDau: '01/09/2025', ngayKetThuc: '31/08/2026', soHocKy: 3, status: 'open' },
                            { id: '24-25', label: '2024–2025', ngayBatDau: '01/09/2024', ngayKetThuc: '31/08/2025', soHocKy: 3, status: 'closed' }
                        ]
                    })
                });
            }
            if (url.includes('/api/admin/academic/courses')) {
                return Promise.resolve({ ok: true, json: async () => ({ status: 'success', data: [] }) });
            }
            if (url.includes('/api/admin/sidebar-badges')) {
                return Promise.resolve({ ok: true, json: async () => ({ status: 'success', data: {} }) });
            }
            return Promise.resolve({ ok: true, json: async () => ({ status: 'success' }) });
        });

        await act(async () => {
            render(<AdminApp onLogout={vi.fn()} HelpButton={() => <div />} adminProfile={mockAdminProfile} />);
        });

        // Chuyển sang Quản lý học tập -> Tab Năm học
        await act(async () => {
            fireEvent.click(screen.getAllByRole('button', { name: /Quản lý học tập/i })[0]);
        });
        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: 'Năm học' }));
        });
    });

    it('[TC_2.15_01 & 05]: Verify list rendering and drill-down navigation', async () => {
        expect(await screen.findByText('2025–2026')).toBeInTheDocument();

        // Click vào dòng năm học để xem chi tiết (Drill-down)
        await act(async () => { fireEvent.click(screen.getByText('2025–2026')); });

        // Xác minh Header "Năm học 2025-2026" xuất hiện
        expect(await screen.findByText('Năm học 2025–2026')).toBeInTheDocument();
        // Xác minh UI báo chưa có môn học
        expect(screen.getByText('Chưa có môn học phần nào')).toBeInTheDocument();
    });

    it('[TC_2.15_02]: Verify dynamic ID generation in Add Modal', async () => {
        await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Thêm năm học/i })); });

        // Ô "Năm bắt đầu" có type="number" nên nó là spinbutton duy nhất
        const startYearInput = screen.getByRole('spinbutton');

        // Sửa năm bắt đầu thành 2028
        await act(async () => { fireEvent.change(startYearInput, { target: { value: '2028' } }); });

        // Ô "Năm kết thúc" là type text mặc định. Ta tìm nó thông qua Display Value
        const endYearInput = screen.getByDisplayValue('2029');
        expect(endYearInput).toBeInTheDocument();
        expect(endYearInput).toBeDisabled(); // Đảm bảo ô này bị disable đúng như UI

        // Text mã động trên header cũng phải update theo
        expect(screen.getByText(/Mã: 28-29/)).toBeInTheDocument();
    });

    it('[TC_2.15_04]: Verify direct status toggling (Close Year)', async () => {
        // Bấm nút Đóng năm học của năm 25-26
        const closeBtn = await screen.findByTitle('Đóng năm học');
        await act(async () => { fireEvent.click(closeBtn); });

        // Xác minh gọi API PUT
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/admin/academic/years/25-26'),
            expect.objectContaining({ method: 'PUT', body: expect.stringContaining('"status":"closed"') })
        );
    });
});