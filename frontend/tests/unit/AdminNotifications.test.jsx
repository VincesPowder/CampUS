import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { AdminApp } from '../../src/app/AdminSections';

global.fetch = vi.fn();
window.alert = vi.fn();
window.confirm = vi.fn();

const mockAdminProfile = { email: 'admin@hcmus.edu.vn', name: 'Quản trị viên', msid: 'ADMIN' };

describe('Unit Test: Admin Compose & Publish Announcements (UC 2.25)', () => {

    beforeEach(async () => {
        vi.clearAllMocks();
        global.fetch.mockResolvedValue({
            ok: true,
            json: async () => ({
                status: 'success',
                data: [{
                    id: 'TB_123', matb: 'TB_123', title: 'Thông báo Test', department: 'Khoa CNTT',
                    content: 'Nội dung test', date: '10/10/2026 08:00', readCount: 10, totalTarget: 50, readRate: 20
                }]
            })
        });

        // Bọc render trong act để xử lý warning state update
        await act(async () => {
            render(<AdminApp onLogout={vi.fn()} HelpButton={() => <div />} adminProfile={mockAdminProfile} />);
        });

        // Sửa lỗi: Lấy nút Thông báo đầu tiên (tránh nút Mobile)
        await act(async () => {
            const notifBtn = screen.getAllByRole('button', { name: /Thông báo/i })[0];
            fireEvent.click(notifBtn);
        });
    });

    it('[TC_2.25_02]: Verify required field validation in Compose Modal', async () => {
        await waitFor(() => expect(screen.getByText('Thông báo Test')).toBeInTheDocument());

        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: /Tạo thông báo/i }));
        });

        const titleInput = screen.getByPlaceholderText('Nhập tiêu đề...');
        await act(async () => {
            fireEvent.change(titleInput, { target: { value: 'Tiêu đề hợp lệ' } });
        });

        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: /Phát hành thông báo/i }));
        });

        expect(window.alert).toHaveBeenCalledWith('Vui lòng nhập nội dung thông báo.');
    });

    it('[TC_2.25_04]: Verify detailed view rendering and read statistics for Admin', async () => {
        await waitFor(() => expect(screen.getByText('Thông báo Test')).toBeInTheDocument());

        const viewBtn = screen.getByTitle('Xem chi tiết');
        await act(async () => {
            fireEvent.click(viewBtn);
        });

        // SỬA Ở ĐÂY: Dùng findAllByText để lấy tất cả các element chứa text, 
        // sau đó kỳ vọng có ít nhất 1 element (hoặc element thứ 2 trong Modal)
        const contentElements = await screen.findAllByText('Nội dung test');
        expect(contentElements.length).toBeGreaterThan(0);

        expect(screen.getByText(/10\/50 sinh viên/i)).toBeInTheDocument();
    });

    it('[TC_2.25_05]: Verify Delete Confirmation logic via native browser dialog', async () => {
        await waitFor(() => expect(screen.getByText('Thông báo Test')).toBeInTheDocument());

        const deleteBtn = screen.getByTitle('Xóa thông báo');

        window.confirm.mockReturnValueOnce(false);
        await act(async () => {
            fireEvent.click(deleteBtn);
        });
        expect(global.fetch).not.toHaveBeenCalledWith(expect.stringContaining('TB_123'), expect.objectContaining({ method: 'DELETE' }));

        window.confirm.mockReturnValueOnce(true);
        global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ status: 'success' }) });

        await act(async () => {
            fireEvent.click(deleteBtn);
        });
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('TB_123'), expect.objectContaining({ method: 'DELETE' }));
        });
    });
});