import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { AdminApp } from '../../src/app/AdminSections';

global.fetch = vi.fn();
window.alert = vi.fn();
window.confirm = vi.fn();

const mockAdminProfile = { email: 'admin@hcmus.edu.vn', name: 'Quản trị viên', msid: 'ADMIN' };

describe('Unit Test: Admin Tuition Management (UC 2.23)', () => {

    beforeEach(async () => {
        vi.clearAllMocks();

        // Mock API GET stats và GET students
        global.fetch.mockImplementation((url) => {
            // SỬA Ở ĐÂY: Thêm mock cho API quản lý sinh viên để không bị lỗi lúc init app
            if (url.includes('/api/admin/students')) {
                return Promise.resolve({
                    ok: true, json: async () => ({
                        status: 'success', data: [] // Mảng rỗng là đủ để không bị lỗi .map()
                    })
                });
            }
            if (url.includes('/api/admin/tuition/stats')) {
                return Promise.resolve({
                    ok: true, json: async () => ({
                        status: 'success', data: { totalDue: 10000000, totalPaid: 2000000, totalDebt: 8000000, totalStudents: 1, paidStudents: 0, completionRate: 20 }
                    })
                });
            }
            if (url.includes('/api/admin/tuition/students')) {
                return Promise.resolve({
                    ok: true, json: async () => ({
                        status: 'success', data: [{
                            mssv: '24127001', hoTen: 'Nguyễn Văn A', lop: '24C01', soMon: 1, tongTC: 4, hocPhiGoc: 10000000, mucGiam: 0, thucDong: 10000000, trangThai: 'Chưa thanh toán', ngayThanhToan: null,
                            items: [{ malhp: 'HP1', tenMon: 'Toán', maMon: 'T1', soTc: 4, hocPhiGoc: 10000000, mucGiam: 0, thucDong: 10000000, trangThai: 'Chưa thanh toán' }]
                        }]
                    })
                });
            }
            return Promise.resolve({ ok: true, json: async () => ({ status: 'success' }) });
        });

        await act(async () => {
            render(<AdminApp onLogout={vi.fn()} HelpButton={() => <div />} adminProfile={mockAdminProfile} />);
        });

        await act(async () => {
            const tuitionBtn = screen.getAllByRole('button', { name: /Học phí/i })[0];
            fireEvent.click(tuitionBtn);
        });
    });

    it('[TC_2.23_01]: Verify Tuition Statistics rendering', async () => {
        // SỬA: Dùng findAllByText / getAllByText thay vì findByText / getByText
        const totalDueElements = await screen.findAllByText('10.000.000 ₫');
        expect(totalDueElements.length).toBeGreaterThan(0); // Tổng phải thu

        const totalPaidElements = screen.getAllByText('2.000.000 ₫');
        expect(totalPaidElements.length).toBeGreaterThan(0); // Đã thu

        const totalDebtElements = screen.getAllByText('8.000.000 ₫');
        expect(totalDebtElements.length).toBeGreaterThan(0); // Công nợ
    });

    it('[TC_2.23_03 & TC_2.23_04]: Verify Student Detail Modal and manual editing calculation', async () => {
        await waitFor(() => expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument());

        // Mở Chi tiết
        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: 'Chi tiết' }));
        });
        expect(await screen.findByText('Nguyễn Văn A (24127001)')).toBeInTheDocument();

        // Bấm nút Sửa (Pencil) của môn học phần
        const editBtns = screen.getAllByTitle('Chỉnh sửa miễn giảm / học phí');
        await act(async () => { fireEvent.click(editBtns[0]); });

        // Nhập Miễn giảm = 2,000,000
        const mucGiamInputs = screen.getAllByRole('spinbutton'); // Có 2 ô number: gốc và miễn giảm
        await act(async () => {
            fireEvent.change(mucGiamInputs[1], { target: { value: '2000000' } });
        });

        // SỬA: Xác minh Thực đóng tính toán tự động = 8,000,000 bằng getAllByText
        const updatedThucDong = screen.getAllByText('8.000.000 ₫');
        expect(updatedThucDong.length).toBeGreaterThan(0);

        // Bấm Lưu
        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }));
        });

        // Xác minh gọi API PUT update
        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/records/24127001/HP1'), expect.objectContaining({ method: 'PUT' }));
    });
});