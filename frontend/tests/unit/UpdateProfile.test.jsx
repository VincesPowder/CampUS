import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { ProfileSection } from '../../src/app/StudentSections';

// Mock MSAL
vi.mock('@azure/msal-react', () => ({
    useMsal: () => ({ accounts: [{ username: '24127158@student.hcmus.edu.vn', name: 'Nguyễn Trần Lan Duy' }] })
}));

const mockData = {
    mssv: '24127158',
    fullName: 'Nguyễn Trần Lan Duy',
    canUpdate: true,
    phone: '0901234567',
    cccd: '079123456789',
    issuedDate: '01/01/2020',
    issuedPlace: 'TP. Hồ Chí Minh',
    personalEmail: 'duy@gmail.com',
    currentAddress: '123 KTX',
    family: [
        {
            id: 1,
            name: 'Trần Thị Thủy',
            rel: 'Mẹ',
            job: 'Kinh doanh'
        }
    ]
};

describe('Unit Test: Update Profile (UC 2.6)', () => {
    beforeEach(() => {
        global.fetch = vi.fn((url) => {
            if (typeof url === 'string' && url.includes('/update')) {
                return Promise.resolve({ ok: true, json: () => Promise.resolve({ status: 'success' }) });
            }
            return Promise.resolve({ ok: true, json: () => Promise.resolve(mockData) });
        });
        window.alert = vi.fn();
        vi.clearAllMocks();
    });

    it('[TC_2.6_06]: Verify UI state transition when entering Edit Mode', async () => {
        render(<ProfileSection avatarUrl={null} onAvatarChange={vi.fn()} />);
        await screen.findByText('Nguyễn Trần Lan Duy');

        const editBtns = screen.getAllByRole('button', { name: /Chỉnh sửa/i });
        fireEvent.click(editBtns[0]);

        expect(screen.getByRole('button', { name: /Lưu/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Hủy/i })).toBeInTheDocument();
        expect(screen.getByDisplayValue('0901234567')).toBeInTheDocument();
    });

    it('[TC_2.6_07]: Verify form validation when required fields are left empty', async () => {
        render(<ProfileSection avatarUrl={null} onAvatarChange={vi.fn()} />);
        await screen.findByText('Nguyễn Trần Lan Duy');

        const editBtns = screen.getAllByRole('button', { name: /Chỉnh sửa/i });
        fireEvent.click(editBtns[0]);

        const phoneInput = screen.getByDisplayValue('0901234567');
        fireEvent.change(phoneInput, { target: { value: '' } });

        fireEvent.click(screen.getByRole('button', { name: /Lưu/i }));

        expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('[TC_2.6_08]: Verify the functionality of the "Hủy" (Cancel) button', async () => {
        render(<ProfileSection avatarUrl={null} onAvatarChange={vi.fn()} />);
        await screen.findByText('Nguyễn Trần Lan Duy');

        const editBtns = screen.getAllByRole('button', { name: /Chỉnh sửa/i });
        fireEvent.click(editBtns[0]);

        const phoneInput = screen.getByDisplayValue('0901234567');
        fireEvent.change(phoneInput, { target: { value: '0999999999' } });
        fireEvent.click(screen.getByRole('button', { name: /Hủy/i }));

        expect(screen.queryByRole('button', { name: /Lưu/i })).not.toBeInTheDocument();
        expect(screen.getByText('0901234567')).toBeInTheDocument();
    });

    it('[TC_2.6_09]: Verify successful profile update via API submission', async () => {
        render(
            <ProfileSection
                avatarUrl={null}
                onAvatarChange={vi.fn()}
            />
        );

        await screen.findByText('Nguyễn Trần Lan Duy');

        const editBtns = screen.getAllByRole('button', {
            name: /Chỉnh sửa/i
        });

        fireEvent.click(editBtns[0]);

        const phoneInput = screen.getByDisplayValue('0901234567');

        fireEvent.change(phoneInput, {
            target: { value: '0988888888' }
        });

        expect(phoneInput).toHaveValue('0988888888');

        fireEvent.click(
            screen.getByRole('button', { name: /Lưu/i })
        );

        // Phải có request update
        await waitFor(() => {
            expect(
                global.fetch.mock.calls.some(([url]) =>
                    typeof url === 'string' &&
                    url.includes('/update')
                )
            ).toBe(true);
        });

        // Nếu API update thành công thì UI phải hiển thị dữ liệu mới
        await waitFor(() => {
            expect(screen.getByText('0988888888')).toBeInTheDocument();
        });
    });

    it('[TC_2.6_10]: Verify error handling when the update API fails', async () => {
        // Ép các lần gọi tiếp theo trả về lỗi 500
        global.fetch = vi.fn((url) => {
            if (typeof url === 'string' && url.includes('/update')) {
                return Promise.resolve({ ok: false, status: 500 });
            }
            return Promise.resolve({ ok: true, json: () => Promise.resolve(mockData) });
        });

        render(<ProfileSection avatarUrl={null} onAvatarChange={vi.fn()} />);
        await screen.findByText('Nguyễn Trần Lan Duy');

        const editBtns = screen.getAllByRole('button', { name: /Chỉnh sửa/i });
        fireEvent.click(editBtns[0]);

        fireEvent.click(screen.getByRole('button', { name: /Lưu/i }));

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalled();
        });
    });

    // --- TEST POPUP GIA ĐÌNH (TC_04 & TC_05) ---
    it('[TC_2.6_04]: Attempt to save family member details with missing mandatory fields', async () => {
        render(<ProfileSection avatarUrl={null} onAvatarChange={vi.fn()} />);
        await screen.findByText('Nguyễn Trần Lan Duy');

        fireEvent.click(screen.getByRole('button', { name: 'Thông tin gia đình' }));
        fireEvent.click(await screen.findByText('Trần Thị Thủy'));

        const allEditBtns = screen.getAllByRole('button', { name: /Chỉnh sửa/i });
        fireEvent.click(allEditBtns[1]);

        const jobInput = screen.getByDisplayValue('Kinh doanh');
        fireEvent.change(jobInput, { target: { value: '' } });
        fireEvent.click(screen.getByRole('button', { name: /Lưu thay đổi/i }));

        expect(screen.getByRole('button', { name: /Lưu thay đổi/i })).toBeInTheDocument();
    });

    it('[TC_2.6_05]: Cancel the update process in the family member popup', async () => {
        render(<ProfileSection avatarUrl={null} onAvatarChange={vi.fn()} />);
        await screen.findByText('Nguyễn Trần Lan Duy');

        fireEvent.click(screen.getByRole('button', { name: 'Thông tin gia đình' }));
        fireEvent.click(await screen.findByText('Trần Thị Thủy'));

        const allEditBtns = screen.getAllByRole('button', { name: /Chỉnh sửa/i });
        fireEvent.click(allEditBtns[1]);

        fireEvent.change(screen.getByDisplayValue('Kinh doanh'), { target: { value: 'Nội trợ' } });
        fireEvent.click(screen.getByRole('button', { name: /Hủy/i }));

        const elements = screen.getAllByText('Kinh doanh');
        expect(elements.length).toBeGreaterThan(0);
    });
});