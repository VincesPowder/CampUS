import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';

// Import đúng component từ file chứa UI của bạn
import { ProfileSection } from '../../src/app/StudentSections';

// 1. Mock thư viện MSAL (Giả lập trạng thái đã đăng nhập của Microsoft)
vi.mock('@azure/msal-react', () => ({
    useMsal: () => ({
        accounts: [{ username: '24127158@student.hcmus.edu.vn', name: 'Nguyễn Trần Lan Duy' }]
    })
}));

// 2. Data giả lập y hệt cấu trúc API backend trả về
const mockStudentData = {
    mssv: '24127158',
    fullName: 'Nguyễn Trần Lan Duy',
    role: 'Sinh viên',
    status: 'Đang học',
    major: 'Công nghệ Thông tin',
    joinPartyDate: '', // Cố tình để rỗng để test case 13
    family: [
        { id: 1, name: 'Trần Thị Thủy', dob: '1978', rel: 'Mẹ', job: 'Kinh doanh' }
    ]
};

describe('Unit Test cho giao diện Hồ sơ cá nhân (UC 2.5)', () => {
    beforeEach(() => {
        // Đánh tráo hàm fetch của trình duyệt thành hàm giả lập trả về mockStudentData
        global.fetch = vi.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve(mockStudentData)
            })
        );

        vi.clearAllMocks();
    });

    // --- TEST 12: HIỂN THỊ LAYOUT CƠ BẢN ---
    it('[TC_2.5_12]: Phải hiển thị đúng layout và thông tin cơ bản của sinh viên', async () => {
        render(<ProfileSection avatarUrl={null} onAvatarChange={vi.fn()} />);

        // Phải dùng await findByText vì giao diện cần thời gian vài mili-giây để fetch xong API
        expect(await screen.findByText('Nguyễn Trần Lan Duy')).toBeInTheDocument();
        expect(screen.getByText('24127158')).toBeInTheDocument();
        expect(screen.getByText('Công nghệ Thông tin')).toBeInTheDocument();
    });

    // --- TEST 13: XỬ LÝ DỮ LIỆU RỖNG TRÊN UI ---
    it('[TC_2.5_13]: Phải hiển thị "Chưa cập nhật" nếu dữ liệu từ API trả về rỗng', async () => {
        render(<ProfileSection avatarUrl={null} onAvatarChange={vi.fn()} />);

        await screen.findByText('Nguyễn Trần Lan Duy');

        // Cột joinPartyDate bị rỗng, UI sẽ tự in ra chữ "Chưa cập nhật" (được in nghiêng mờ)
        const emptyFields = screen.getAllByText('Chưa cập nhật');
        expect(emptyFields.length).toBeGreaterThan(0);
    });

    // --- TEST 14: CHUYỂN TAB ---
    it('[TC_2.5_14]: Phải chuyển đổi đúng nội dung khi click qua lại giữa các tab', async () => {
        render(<ProfileSection avatarUrl={null} onAvatarChange={vi.fn()} />);
        await screen.findByText('Nguyễn Trần Lan Duy');

        // Click sang tab Gia đình
        const familyTabBtn = screen.getByRole('button', { name: 'Thông tin gia đình' });
        fireEvent.click(familyTabBtn);

        // Kiểm tra xem tên của mẹ có xuất hiện trong bảng không
        expect(await screen.findByText('Trần Thị Thủy')).toBeInTheDocument();
        expect(screen.getByText('Kinh doanh')).toBeInTheDocument();
    });

    // --- TEST 15: TƯƠNG TÁC POPUP NGƯỜI THÂN ---
    it('[TC_2.5_15]: Phải mở Popup chi tiết khi click vào dòng người thân trong bảng', async () => {
        render(<ProfileSection avatarUrl={null} onAvatarChange={vi.fn()} />);
        await screen.findByText('Nguyễn Trần Lan Duy');

        // Sang tab Gia đình và click vào dòng chứa tên mẹ
        fireEvent.click(screen.getByRole('button', { name: 'Thông tin gia đình' }));
        const familyRow = await screen.findByText('Trần Thị Thủy');
        fireEvent.click(familyRow);

        // Kiểm tra Tiêu đề của cái Modal popup đã hiện lên
        expect(await screen.findByText('Thông tin thành viên gia đình')).toBeInTheDocument();
    });

    // --- TEST 16: ĐÓNG POPUP CHI TIẾT ---
    it('[TC_2.5_16]: Phải đóng Popup chi tiết khi click nút Đóng', async () => {
        render(<ProfileSection avatarUrl={null} onAvatarChange={vi.fn()} />);
        await screen.findByText('Nguyễn Trần Lan Duy');

        // Mở popup
        fireEvent.click(screen.getByRole('button', { name: 'Thông tin gia đình' }));
        fireEvent.click(await screen.findByText('Trần Thị Thủy'));
        expect(await screen.findByText('Thông tin thành viên gia đình')).toBeInTheDocument();

        // Nhấn nút Đóng
        const closeBtn = screen.getByRole('button', { name: 'Đóng' });
        fireEvent.click(closeBtn);

        // Đợi một chút và kiểm tra tiêu đề Modal không còn nằm trong file tài liệu (Document) nữa
        await waitFor(() => {
            expect(screen.queryByText('Thông tin thành viên gia đình')).not.toBeInTheDocument();
        });
    });
});