import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { HelpButton } from '../../src/app/shared';

// Mock API fetch cho HelpButton
global.fetch = vi.fn();

describe('Unit Test: Message Support Team (UC 2.27)', () => {

    beforeEach(() => {
        vi.clearAllMocks();

        // Cấp dữ liệu mock chuẩn từ API
        global.fetch.mockResolvedValue({
            ok: true,
            json: async () => ({
                status: 'success',
                data: [
                    { label: "Phòng đào tạo", email: "daotao@hcmus.edu.vn", role: "Học vụ" },
                    { label: "Phòng giáo vụ", email: "giaovu@hcmus.edu.vn", role: "Học vụ" },
                    { label: "Phòng kỹ thuật", email: "kythuat@hcmus.edu.vn", role: "Hỗ trợ" }
                ]
            })
        });

        // Render kèm vùng outside để test click outside
        render(
            <div data-testid="outside-area" style={{ width: '100vw', height: '100vh' }}>
                <HelpButton />
            </div>
        );
    });

    it('[TC_2.27_01 & TC_2.27_03]: Verify Help dropdown toggle and mapping of contact data', async () => {
        const helpBtn = screen.getByRole('button', { name: /Liên hệ hỗ trợ/i });

        expect(screen.queryByText('Phòng đào tạo')).not.toBeInTheDocument();

        // TC_01: Click mở dropdown
        fireEvent.click(helpBtn);

        // TC_03: Chờ API mock render đủ 3 item
        await waitFor(() => {
            expect(screen.getByText('Phòng đào tạo')).toBeInTheDocument();
            expect(screen.getByText('Phòng giáo vụ')).toBeInTheDocument();
            expect(screen.getByText('Phòng kỹ thuật')).toBeInTheDocument();
        });
    });

    it('[TC_2.27_02]: Verify "Click Outside" to close logic', async () => {
        const helpBtn = screen.getByRole('button', { name: /Liên hệ hỗ trợ/i });
        fireEvent.click(helpBtn);

        expect(await screen.findByText('Phòng đào tạo')).toBeInTheDocument();

        // Mô phỏng click ra ngoài
        const outsideArea = screen.getByTestId('outside-area');
        fireEvent.mouseDown(outsideArea);

        // Dropdown biến mất
        await waitFor(() => {
            expect(screen.queryByText('Phòng đào tạo')).not.toBeInTheDocument();
        });
    });

    it('[TC_2.27_04]: Verify proper mailto: link generation', async () => {
        const helpBtn = screen.getByRole('button', { name: /Liên hệ hỗ trợ/i });
        fireEvent.click(helpBtn);

        const daoTaoLink = await screen.findByRole('link', { name: /daotao@hcmus.edu.vn/i });

        // Xác minh href chuẩn xác để kích hoạt native email client
        expect(daoTaoLink).toHaveAttribute('href', 'mailto:daotao@hcmus.edu.vn');
    });

    it('[TC_2.27_05]: Verify hover state styling on contact rows', async () => {
        const helpBtn = screen.getByRole('button', { name: /Liên hệ hỗ trợ/i });
        fireEvent.click(helpBtn);

        const rowLabel = await screen.findByText('Phòng kỹ thuật');
        const rowDiv = rowLabel.closest('div.hover\\:bg-secondary\\/40');

        // Xác minh thẻ bọc ngoài có class hover đổi màu (tailwind)
        expect(rowDiv).toHaveClass('hover:bg-secondary/40');
    });
});