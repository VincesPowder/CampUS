import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';

// Nhập cả 2 hàm từ file App.tsx
import { LogoutConfirm, LogoutSuccess } from '../../src/app/App';

describe('Unit Test cho tính năng Đăng xuất (UC 2.4)', () => {

    // --- TEST CHO POPUP XÁC NHẬN ---
    it('[TC_2.4_06]: Phải hiển thị đúng giao diện popup xác nhận đăng xuất', () => {
        render(<LogoutConfirm onConfirm={vi.fn()} onCancel={vi.fn()} />);

        expect(screen.getByText('Đăng xuất?')).toBeInTheDocument();
        expect(screen.getByText('Bạn có chắc muốn đăng xuất khỏi hệ thống?')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Hủy' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Đăng xuất' })).toBeInTheDocument();
    });

    it('[TC_2.4_07]: Phải gọi hàm xử lý Hủy khi user click nút Hủy', () => {
        const mockOnCancel = vi.fn();
        render(<LogoutConfirm onConfirm={vi.fn()} onCancel={mockOnCancel} />);

        const cancelBtn = screen.getByRole('button', { name: 'Hủy' });
        fireEvent.click(cancelBtn);

        expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('[TC_2.4_08]: Phải gọi hàm xử lý Đăng xuất khi user click nút Đăng xuất', () => {
        const mockOnConfirm = vi.fn();
        render(<LogoutConfirm onConfirm={mockOnConfirm} onCancel={vi.fn()} />);

        const confirmBtn = screen.getByRole('button', { name: 'Đăng xuất' });
        fireEvent.click(confirmBtn);

        expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    });

    // --- TEST CHO POPUP THÀNH CÔNG ---
    it('[TC_2.4_09]: Phải hiển thị đúng popup thông báo Đăng xuất thành công', () => {
        render(<LogoutSuccess />);

        // Kiểm tra xem dòng chữ thông báo thành công có xuất hiện không
        expect(screen.getByText('Đã đăng xuất thành công!')).toBeInTheDocument();
    });
});