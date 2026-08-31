import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import * as msalReact from '@azure/msal-react';

import Login from '../../src/app/components/Login';

// 1. Mock (Làm giả) thư viện MSAL để không gọi api thật lên Microsoft
vi.mock('@azure/msal-react', () => ({
    useMsal: vi.fn(),
}));

// 2. Mock file hình ảnh để Unit test không bị lỗi khi import file tĩnh
vi.mock('@imports/bg.jpg', () => ({
    default: 'mocked-bg.jpg',
}));

describe('Unit Test cho Component Login', () => {
    const mockLoginRedirect = vi.fn();
    const mockOnLogin = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();

        msalReact.useMsal.mockReturnValue({
            instance: {
                loginRedirect: mockLoginRedirect,
                acquireTokenSilent: vi.fn(),
                logoutRedirect: vi.fn(),
            },
            accounts: [],
            inProgress: 'none',
        });
    });

    it('[TC_2.1_06]: Phải render đúng giao diện mặc định ban đầu', () => {
        render(<Login onLogin={mockOnLogin} />);

        expect(screen.getByText('CampUS')).toBeInTheDocument();
        expect(screen.getByText('ĐĂNG NHẬP')).toBeInTheDocument();

        const loginBtn = screen.getByRole('button', { name: /Đăng nhập với Microsoft/i });
        expect(loginBtn).toBeInTheDocument();
        expect(loginBtn).not.toBeDisabled();
    });

    it('[TC_2.1_07]: Phải gọi hàm loginRedirect của MSAL khi user click nút', async () => {
        render(<Login onLogin={mockOnLogin} />);

        const loginBtn = screen.getByRole('button', { name: /Đăng nhập với Microsoft/i });

        fireEvent.click(loginBtn);

        expect(mockLoginRedirect).toHaveBeenCalledTimes(1);
    });

    it('[TC_2.1_08]: Phải hiển thị nút "Đang xử lý..." và disable nút khi inProgress đang chạy', () => {
        msalReact.useMsal.mockReturnValue({
            instance: { loginRedirect: mockLoginRedirect },
            accounts: [],
            inProgress: 'login',
        });

        render(<Login onLogin={mockOnLogin} />);

        const processingBtn = screen.getByRole('button', { name: /Đang xử lý.../i });
        expect(processingBtn).toBeInTheDocument();
        expect(processingBtn).toBeDisabled();
    });
});