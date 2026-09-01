import React, { useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { ScheduleSection } from '../../src/app/StudentSections';
import { TKBCellCard } from '../../src/app/shared';

// 1. Mock UseMsal
vi.mock('@azure/msal-react', () => ({
    useMsal: () => ({ accounts: [{ username: '24127158@student.hcmus.edu.vn' }] })
}));

// Wrapper quản lý State cho Component
const ScheduleWrapper = ({ initialTab = 'tkb' }) => {
    const [tab, setTab] = useState(initialTab);
    return <ScheduleSection tab={tab} setTab={setTab} studentMssv="24127158" />;
};

describe('Function 11: View Class/Exam Schedule (Frontend Unit)', () => {
    beforeEach(() => {
        global.fetch = vi.fn((url) => {
            if (url.includes('/schedule/filters')) {
                return Promise.resolve({ 
                    ok: true, 
                    json: () => Promise.resolve({ 
                        status: 'success', 
                        data: [{ ma_hocky: 'HK006', ten_hocky: 'HK3', namhoc: '25-26', ngaybatdau: '2026-05-18' }] 
                    }) 
                });
            }
            if (url.includes('/schedule/weekly')) {
                return Promise.resolve({ 
                    ok: true, 
                    json: () => Promise.resolve({ 
                        status: 'success', 
                        data: { 
                            days: { 
                                2: [{ mamh: 'CSC10006', tenmh: 'Cơ sở dữ liệu', start_period: 1, end_period: 4, room: 'F104', loai_tiet: 'LT' }],
                                3: [{ mamh: 'CSC10012', tenmh: 'Cơ sở lập trình', start_period: 1, end_period: 5, room: 'E103', loai_tiet: 'TH' }]
                            } 
                        } 
                    }) 
                });
            }
            if (url.includes('/schedule/exams')) {
                return Promise.resolve({ 
                    ok: true, 
                    json: () => Promise.resolve({ 
                        status: 'success', 
                        data: [{ tenmh: 'Cơ sở dữ liệu', malhp: '24C07', exam_date: '05/08/2026', time_range: '07:30', room: 'F104', exam_format: 'Tự luận' }] 
                    }) 
                });
            }
            return Promise.resolve({ ok: true, json: () => Promise.resolve({ status: 'error' }) });
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
        vi.unstubAllGlobals();
    });

    it('[TC_2.11_03]: Verify the rendering of the blue schedule header bar', async () => {
        render(<ScheduleWrapper tab="tkb" />);
        await waitFor(() => {
            const hk3Elements = screen.getAllByText('HK3');
            expect(hk3Elements.length).toBeGreaterThan(0);
            
            const yearElements = screen.getAllByText('25-26');
            expect(yearElements.length).toBeGreaterThan(0);

            const weekHeader = screen.getByText(/Tuần\s*1/i, { selector: 'span' });
            expect(weekHeader).toBeInTheDocument();
            
            expect(screen.getAllByText('|').length).toBeGreaterThan(0);
        });
    });

    it('[TC_2.11_04]: Verify Grid rowSpan logic for multi-slot classes', async () => {
        render(<ScheduleWrapper tab="tkb" />);
        await waitFor(() => {
            const csltClass = screen.getByText('Cơ sở lập trình');
            const tdElement = csltClass.closest('td');
            expect(tdElement).toHaveAttribute('rowspan', '2');
        });
    });

    it('[TC_2.11_05]: Verify <TKBCellCard/> content and badge rendering', () => {
        const mockItem = {
            tenMon: 'Hệ quản trị CSDL',
            maNhom: '24C05',
            tiet: '1-5',
            phong: 'F105',
            gv: 'Trần Văn A',
            isLab: true,
            ngonNgu: 'Tiếng Việt',
            hinhThuc: 'TẬP TRUNG',
        };

        render(<TKBCellCard entry={mockItem} isCurrentCa={false} />);
        
        expect(screen.getByText('Hệ quản trị CSDL')).toBeInTheDocument();
        expect(screen.getByText(/F105/i)).toBeInTheDocument();
        expect(screen.getByText(/Trần Văn A/i)).toBeInTheDocument();
        
        const thBadge = screen.getByText('TH');
        expect(thBadge).toBeInTheDocument();
        expect(thBadge.className).toContain('bg-orange-100');
        expect(thBadge.className).toContain('text-orange-600');
    });

    // it('[TC_2.11_07]: Verify "Today" highlighting logic in the weekly grid', async () => {
    //     // Chỉ mock đối tượng Date, giữ nguyên setTimeout/setInterval để waitFor hoạt động
    //     vi.useFakeTimers({ toFake: ['Date'] });
    //     vi.setSystemTime(new Date('2026-05-19T12:00:00+07:00')); // Múi giờ +7 đảm bảo chuẩn Thứ 3

    //     render(<ScheduleWrapper tab="tkb" />);

    //     await waitFor(() => {
    //         const thubaElement = screen.getByText('Thứ ba');
            
    //         // Tìm ngược lên thẻ chứa class bg-orange-50.
    //         // Nếu không tìm thấy, fallback lấy thẻ th để báo lỗi in ra class chính xác
    //         let highlightedContainer = thubaElement.closest('.bg-orange-50');
    //         if (!highlightedContainer) {
    //             highlightedContainer = thubaElement.closest('th') || thubaElement.parentElement;
    //         }
            
    //         expect(highlightedContainer?.className).toMatch(/bg-orange-50/);
    //         expect(highlightedContainer?.className).toMatch(/text-orange-/);
    //     });
    // });

    it('[TC_2.11_08]: Verify data mapping in the "TKB Thi" (Exam Schedule) table', async () => {
        render(<ScheduleWrapper initialTab="thi" />);
        await waitFor(() => {
            expect(screen.getByText('Phòng thi')).toBeInTheDocument();
            expect(screen.getByText('Cơ sở dữ liệu')).toBeInTheDocument();
            expect(screen.getByText('24C07')).toBeInTheDocument();
            expect(screen.getByText('05/08/2026')).toBeInTheDocument();
            expect(screen.getByText('F104')).toBeInTheDocument();
            expect(screen.getByText('Tự luận')).toBeInTheDocument();
        });
    });
});