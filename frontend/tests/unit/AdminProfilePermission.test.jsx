import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { AdminApp } from '../../src/app/AdminSections';

global.fetch = vi.fn();

const mockAdminProfile = { email: 'admin@hcmus.edu.vn', name: 'Quản trị', msid: 'AD' };

describe('Unit Test: Manage Profile Update Periods (UC 2.17)', () => {

    beforeEach(async () => {
        vi.clearAllMocks();
        global.fetch.mockImplementation((url) => {
            if (url.includes('/api/admin/profile-edit-permission')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({
                        status: 'success',
                        data: {
                            enabled: false,
                            from: '',
                            to: '',
                            nganhs: [],
                            khoas: []
                        }
                    })
                });
            }
            if (url.includes('/api/admin/students')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({
                        status: 'success',
                        data: [
                            { mssv: '24127001', hoTen: 'Nguyễn Văn A', email: 'a@student.hcmus.edu.vn', gioiTinh: 'Nam', khoa: '2024', bacDT: 'Đại học', nganh: 'CNTT', loaiDT: 'Chính quy' }
                        ]
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
    });

    it('[TC_2.17_01 & 02]: Verify opening panel and toggling status switch', async () => {
        // [TC_01]: Mở panel Quyền chỉnh sửa
        const permBtn = screen.getByRole('button', { name: /Quyền chỉnh sửa/i });
        await act(async () => { fireEvent.click(permBtn); });

        expect(screen.getByText('Quyền chỉnh sửa hồ sơ')).toBeInTheDocument();
        expect(screen.getByText('Đang tắt')).toBeInTheDocument();
        expect(screen.getByText('Từ ngày')).toBeInTheDocument();
        expect(screen.getByText('Đến ngày')).toBeInTheDocument();

        // [TC_02]: Gạt công tắc bật quyền chỉnh sửa
        // Nút switch nằm cạnh chữ "Đang tắt"
        const switchBtn = screen.getByText('Đang tắt').nextElementSibling;
        await act(async () => { fireEvent.click(switchBtn); });

        expect(screen.getByText('Đang bật')).toBeInTheDocument();
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/admin/profile-edit-permission'),
            expect.objectContaining({
                method: 'POST',
                body: expect.stringContaining('"enabled":true')
            })
        );
    });

    it('[TC_2.17_03 & 04]: Verify date inputs, summary banner, and active green dot indicator', async () => {
        // 1. Mở panel
        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: /Quyền chỉnh sửa/i }));
        });

        // 2. Bật công tắc
        const switchBtn = screen.getByText('Đang tắt').nextElementSibling;
        await act(async () => { fireEvent.click(switchBtn); });

        // 3. Nhập khoảng ngày bao trùm ngày hôm nay (để kích hoạt trạng thái active)
        const dateInputs = screen.getAllByDisplayValue('');
        const fromInput = dateInputs.find(input => input.type === 'date') || dateInputs[0];

        // Tìm 2 ô input type="date"
        const allInputs = document.querySelectorAll('input[type="date"]');
        await act(async () => {
            fireEvent.change(allInputs[0], { target: { value: '2020-01-01' } });
            fireEvent.change(allInputs[1], { target: { value: '2030-12-31' } });
        });

        // [TC_03]: Banner tóm tắt hiển thị
        expect(screen.getByText(/Sinh viên có thể chỉnh sửa hồ sơ từ 2020-01-01 đến 2030-12-31/i)).toBeInTheDocument();

        // [TC_04]: Xác minh chấm xanh (active indicator) xuất hiện cạnh tên sinh viên
        const activeDot = document.querySelector('span[title="Đang trong đợt chỉnh sửa"]');
        expect(activeDot).toBeInTheDocument();
    });
});