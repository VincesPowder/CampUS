import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { NotificationsSection, getRelativeTime } from '../../src/app/StudentSections';
import App from '../../src/app/App';

// 1. Mock MSAL
vi.mock('@azure/msal-react', () => ({
    useMsal: () => ({
        instance: { getAllAccounts: () => [], setActiveAccount: vi.fn(), logoutRedirect: vi.fn() },
        accounts: [{ username: '24127158@student.hcmus.edu.vn', name: 'Nguyễn Trần Lan Duy' }]
    })
}));

// 2. Mock ResizeObserver và scrollIntoView cho UI ảo
global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));
window.HTMLElement.prototype.scrollIntoView = vi.fn();

// 3. MOCK COMPONENT LOGIN
vi.mock('../../src/app/components/Login', () => ({
    default: ({ onLogin }) => (
        <button onClick={() => onLogin('student')}>Bypass Login</button>
    )
}));

const now = new Date();
now.setHours(now.getHours() - 2);

const mockNotifications = [
    {
        maTb: "TB001",
        tieuDe: "Nhắc nhở đăng kí chuyên ngành 2025-2026",
        noiDung: "Tất cả sinh viên chương trình TCTA khóa 2024...",
        ngayDang: now.toISOString(),
        trangThaiDoc: 1,
        khoa: "Khoa CNTT",
        phong: null
    },
    {
        maTb: "TB002",
        tieuDe: "Đổi phòng học",
        noiDung: "Các lớp có tiết tại phòng E301 sáng 01/08/2026 chuyển sang phòng I32",
        ngayDang: "26/07/2026 00:00",
        trangThaiDoc: 0,
        khoa: "Khoa CNTT",
        phong: null
    }
];

describe('Function 12: View Notifications (Frontend Coverage)', () => {
    beforeEach(() => {
        // Nâng cấp Fetch Mock để phân luồng API chính xác
        global.fetch = vi.fn((url) => {
            if (url.includes('/read')) {
                return Promise.resolve({ ok: true, json: () => Promise.resolve({ status: 'success' }) });
            }
            if (url.includes('/notifications')) {
                return Promise.resolve({ ok: true, json: () => Promise.resolve({ status: 'success', data: mockNotifications }) });
            }
            if (url.includes('/surveys')) {
                return Promise.resolve({ ok: true, json: () => Promise.resolve({ status: 'success', data: [] }) });
            }
            // Trả về Profile giả để App.tsx không bị crash
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve({
                    fullName: 'Nguyễn Trần Lan Duy',
                    mssv: '24127158',
                    role: 'Sinh viên',
                    status: 'Đang học'
                })
            });
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('[TC_2.13_01, 02 & 03]: Verify unread badge, relative time, and navigation via App Dropdown', async () => {
        render(<App />);

        fireEvent.click(screen.getByText('Bypass Login'));

        await waitFor(() => {
            expect(screen.getByText('1', { selector: 'span.bg-destructive' })).toBeInTheDocument();
        });

        const bellBadge = screen.getByText('1', { selector: 'span.bg-destructive' });
        fireEvent.click(bellBadge.closest('button'));

        await waitFor(() => {
            expect(screen.getByText('Đổi phòng học')).toBeInTheDocument();
            expect(screen.getByText(/2 giờ trước/)).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Tất cả'));

        await waitFor(() => {
            expect(screen.getByText('2/2 thông báo')).toBeInTheDocument();
        });
    });

    it('[TC_2.13_04 & 05]: Verify fetching, structural mapping, and visual indicators', async () => {
        render(<NotificationsSection />);

        await waitFor(() => {
            expect(screen.getByText('2/2 thông báo')).toBeInTheDocument();
        });

        expect(screen.getByText('Nhắc nhở đăng kí chuyên ngành 2025-2026')).toBeInTheDocument();
        expect(screen.getAllByText('Khoa CNTT').length).toBe(2);

        const unreadTitle = screen.getByText('Đổi phòng học');
        expect(unreadTitle.className).toContain('font-bold');

        const readTitle = screen.getByText('Nhắc nhở đăng kí chuyên ngành 2025-2026');
        expect(readTitle.className).not.toContain('font-bold');
    });

    it('[TC_2.13_06 & 09]: Verify detail view, "Mark as Read", and "Back" button', async () => {
        render(<NotificationsSection />);
        await waitFor(() => expect(screen.getByText('2/2 thông báo')).toBeInTheDocument());

        const unreadItem = screen.getByText('Đổi phòng học');
        fireEvent.click(unreadItem);

        expect(global.fetch).toHaveBeenCalledWith(
            '/api/students/24127158/notifications/TB002/read',
            expect.objectContaining({ method: 'POST' })
        );

        await waitFor(() => {
            expect(screen.getByText('Chi tiết thông báo')).toBeInTheDocument();
            expect(screen.getByText('Các lớp có tiết tại phòng E301 sáng 01/08/2026 chuyển sang phòng I32')).toBeInTheDocument();
        });

        const backBtn = screen.getByRole('button');
        fireEvent.click(backBtn);

        await waitFor(() => {
            expect(screen.queryByText('Chi tiết thông báo')).not.toBeInTheDocument();
            expect(screen.getByText('2/2 thông báo')).toBeInTheDocument();
        });
    });

    it('[TC_2.13_07]: Verify data filtering by Khoa/Bộ môn', async () => {
        render(<NotificationsSection />);
        await waitFor(() => expect(screen.getByText('2/2 thông báo')).toBeInTheDocument());

        fireEvent.click(screen.getByText('Lọc'));

        await waitFor(() => {
            expect(screen.getByText('Lọc thông báo')).toBeInTheDocument();
        });

        const khoaCheckbox = screen.getAllByText('Khoa CNTT')[0];
        fireEvent.click(khoaCheckbox);

        expect(screen.getByText('2/2 thông báo')).toBeInTheDocument();
    });

    it('[TC_2.13_08]: Verify text-based search functionality', async () => {
        render(<NotificationsSection />);
        await waitFor(() => expect(screen.getByText('2/2 thông báo')).toBeInTheDocument());

        const searchInput = screen.getByPlaceholderText('Tìm kiếm thông báo...');
        fireEvent.change(searchInput, { target: { value: 'đổi phòng' } });

        expect(screen.getByText('Đổi phòng học')).toBeInTheDocument();
        expect(screen.queryByText('Nhắc nhở đăng kí chuyên ngành 2025-2026')).not.toBeInTheDocument();
    });
});