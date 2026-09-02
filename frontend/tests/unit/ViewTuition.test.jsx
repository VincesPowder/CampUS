import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { TuitionSection } from '../../src/app/StudentSections';

// 1. Mock UseMsal
vi.mock('@azure/msal-react', () => ({
    useMsal: () => ({ accounts: [{ username: '24127158@student.hcmus.edu.vn' }] })
}));

describe('Function 12: View Tuition (Frontend Unit)', () => {
    beforeEach(() => {
        global.fetch = vi.fn((url) => {
            if (url.includes('/tuition')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        status: 'success',
                        data: [
                            {
                                maLhp: "24C07", maMh: "CSC10006", tenMon: "Cơ sở dữ liệu",
                                namHoc: "25-26", tenHocKy: "HK3", nhhk: "25-26 / HK3",
                                soTc: 4.0, soTiet: 75, soTcHocPhi: 7.25,
                                hocPhiGoc: 6887500, mucGiam: 0, hoTro: 0, thucDong: 6887500, chiPhiKhac: 0,
                                ghiChu: "", trangThaiThanhToan: "Chưa thanh toán", ngayThanhToan: "20/08/2026"
                            },
                            {
                                maLhp: "24C04", maMh: "BAA00012", tenMon: "Kinh tế chính trị Mác-Lênin",
                                namHoc: "25-26", tenHocKy: "HK3", nhhk: "25-26 / HK3",
                                soTc: 2.0, soTiet: 30, soTcHocPhi: 2.00,
                                hocPhiGoc: 896000, mucGiam: 10000, hoTro: 0, thucDong: 886000, chiPhiKhac: 0,
                                ghiChu: "", trangThaiThanhToan: "Chưa thanh toán", ngayThanhToan: "20/08/2026"
                            }
                        ]
                    })
                });
            }
            return Promise.resolve({ ok: true, json: () => Promise.resolve({ status: 'error' }) });
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('[TC_2.12_01]: Verify automatic dropdown population and sorting logic', async () => {
        // Dùng luôn data mock ở phần beforeEach (có chứa năm học 25-26)
        render(<TuitionSection />);
        
        await waitFor(() => {
            // Lấy dropdown thông qua element gần label "Năm học:"
            const yearDropdowns = screen.getAllByRole('combobox');
            const namHocDropdown = yearDropdowns[0];
            
            // Assert code tự động set state mặc định là năm học cao nhất
            expect(namHocDropdown.value).toBe('25-26');
        });
    });

    it('[TC_2.12_03]: Verify the structural mapping of combined table columns', async () => {
        render(<TuitionSection />);
        await waitFor(() => {
            // Kiểm tra cột mã kết hợp [maMh/maLhp]
            expect(screen.getByText('[CSC10006/24C07]')).toBeInTheDocument();
            expect(screen.getByText('[BAA00012/24C04]')).toBeInTheDocument();
            
            // Kiểm tra tên môn dòng thứ 2
            expect(screen.getByText('Cơ sở dữ liệu')).toBeInTheDocument();
            expect(screen.getByText('Kinh tế chính trị Mác-Lênin')).toBeInTheDocument();
        });
    });

    it('[TC_2.12_04]: Verify formatting of currency fields', async () => {
        render(<TuitionSection />);
        await waitFor(() => {
            // Số 6887500 sẽ được format qua hàm toLocaleString() (phụ thuộc môi trường, có thể là . hoặc ,)
            // Ta dùng regex để bao phủ cả 2 trường hợp format locale
            const formattedMoney = screen.getAllByText(/6\.887\.500|6,887,500/);
            expect(formattedMoney.length).toBeGreaterThan(0);
        });
    });

    it('[TC_2.12_05]: Verify the mathematical aggregation in the "Tổng Cộng" row', async () => {
        render(<TuitionSection />);
        await waitFor(() => {
            expect(screen.getByText('Tổng Cộng:')).toBeInTheDocument();
            
            // TC: 4.0 + 2.0 = 6.0
            expect(screen.getByText('6.0')).toBeInTheDocument();
            
            // Tiết: 75 + 30 = 105
            expect(screen.getByText('105')).toBeInTheDocument();

            // Tổng thực đóng: 6887500 + 886000 = 7773500
            const sumThucDong = screen.getAllByText(/7\.773\.500|7,773,500/);
            expect(sumThucDong.length).toBeGreaterThan(0);
        });
    });

    it('[TC_2.12_06]: Verify the "Tổng số tiền phải đóng" highlight box', async () => {
        render(<TuitionSection />);
        await waitFor(() => {
            // Kiểm tra thẻ highlight box góc dưới
            expect(screen.getByText('Tổng số tiền phải đóng:')).toBeInTheDocument();
            
            // Check chuỗi "VNĐ" được gắn vào đuôi
            const totalBox = screen.getByText(/7\.773\.500 VNĐ|7,773,500 VNĐ/);
            expect(totalBox).toBeInTheDocument();
            expect(totalBox.className).toContain('text-[17px]');
            expect(totalBox.className).toContain('font-bold');

            // Check ngày cập nhật hiển thị chính xác từ backend (20/08/2026)
            expect(screen.getByText(/20\/08\/2026/)).toBeInTheDocument();
        });
    });

    it('[TC_2.12_07]: Verify empty state handling when API returns no data', async () => {
        // Ép API trả về mảng rỗng chỉ cho riêng test case này
        global.fetch = vi.fn(() => 
            Promise.resolve({ ok: true, json: () => Promise.resolve({ status: 'success', data: [] }) })
        );

        render(<TuitionSection />);
        await waitFor(() => {
            expect(screen.getByText('Không có dữ liệu học phí nào được tìm thấy trên hệ thống.')).toBeInTheDocument();
        });
    });
});