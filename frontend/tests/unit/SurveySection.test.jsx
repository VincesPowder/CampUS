import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { SurveySection } from '../../src/app/StudentSections';

// Mock MSAL Auth
vi.mock('@azure/msal-react', () => ({
    useMsal: () => ({ accounts: [{ username: '24127158', name: 'Lan Duy' }] })
}));

// Mock API toàn cục
global.fetch = vi.fn();

describe('Unit Test: University Surveys (UC 2.10)', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('[TC_2.10_01]: Verify empty state handling when no surveys are assigned', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ status: 'success', data: [] })
        });

        render(<SurveySection />);
        expect(await screen.findByText(/Không có khảo sát nào cần thực hiện/i)).toBeInTheDocument();
    });

    it('[TC_2.10_02]: Verify auto-open logic when there is exactly one pending survey', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                status: 'success',
                data: [{
                    id: 'KS01', title: 'Khảo sát HK1', status: 'pending', description: 'Mô tả', deadline: '2026-10-10',
                    courses: [{ id: 'MH01', name: 'Cấu trúc dữ liệu', code: 'INT101', rating: null, comment: '' }]
                }]
            })
        });

        render(<SurveySection />);
        expect(await screen.findByText(/Cấu trúc dữ liệu/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Gửi đánh giá/i })).toBeInTheDocument();
    });

    it('[TC_2.10_03]: Verify styling differences between Completed and Pending surveys in list view', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                status: 'success',
                data: [
                    { id: 'KS01', title: 'Khảo sát 1', status: 'completed', description: 'Mô tả 1', deadline: '2026-08-15', courses: [] },
                    { id: 'KS02', title: 'Khảo sát 2', status: 'pending', description: 'Mô tả 2', deadline: '2026-08-16', courses: [] }
                ]
            })
        });

        render(<SurveySection />);
        expect(await screen.findByText(/Đã Hoàn thành/i)).toBeInTheDocument();
        expect(screen.getByText(/Hạn: 2026-08-16/i)).toBeInTheDocument();
    });

    it('[TC_2.10_04 & TC_2.10_08]: Verify pre-filling and Read-only mode constraints for completed surveys', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                status: 'success',
                data: [{
                    id: 'KS01', title: 'Khảo sát HK1', status: 'completed', description: 'Mô tả', deadline: '2026-10-10',
                    courses: [{ id: 'MH01', name: 'Môn A', code: 'A1', rating: 4, comment: 'Dạy rất nhiệt tình' }]
                }]
            })
        });

        render(<SurveySection />);
        const surveyCard = await screen.findByText('Khảo sát HK1');
        fireEvent.click(surveyCard);

        expect(await screen.findByText(/Bản xem trước/i)).toBeInTheDocument();

        const textareas = screen.getAllByRole('textbox');
        expect(textareas[0]).toHaveValue('Dạy rất nhiệt tình');
        expect(textareas[0]).toHaveAttribute('readonly');
        expect(screen.queryByRole('button', { name: /Gửi đánh giá/i })).not.toBeInTheDocument();
    });

    it('[TC_2.10_05 & TC_2.10_06]: Verify rating selection and submit button validation (allRated logic)', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                status: 'success',
                data: [{
                    id: 'KS01', title: 'Khảo sát HK1', status: 'pending', description: 'Mô tả', deadline: '2026-10-10',
                    courses: [
                        { id: 'MH01', name: 'Toán', code: 'T1', rating: null, comment: '' },
                        { id: 'MH02', name: 'Lý', code: 'L1', rating: null, comment: '' }
                    ]
                }]
            })
        });

        render(<SurveySection />);
        const submitBtn = await screen.findByRole('button', { name: /Gửi đánh giá/i });

        expect(submitBtn).toBeDisabled();
        expect(screen.getByText(/Vui lòng đánh giá tất cả 2 môn học/i)).toBeInTheDocument();

        // Sử dụng getByTitle thay vì text để chỉ match các Button đánh giá, không match Legend
        const ratingBtns = screen.getAllByTitle('Rất tốt');

        // Đánh giá Toán
        fireEvent.click(ratingBtns[0]);
        expect(submitBtn).toBeDisabled();
        expect(screen.getByText(/Vui lòng đánh giá tất cả 2 môn học/i)).toBeInTheDocument();

        // Đánh giá Lý
        fireEvent.click(ratingBtns[1]);
        expect(screen.queryByText(/Vui lòng đánh giá tất cả/i)).not.toBeInTheDocument();
        expect(submitBtn).not.toBeDisabled();
    });

    it('[TC_2.10_07]: Verify successful survey submission and success screen transition', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                status: 'success',
                data: [{
                    id: 'KS01', title: 'Khảo sát HK1', status: 'pending', description: 'Mô tả', deadline: '2026-10-10',
                    courses: [{ id: 'MH01', name: 'Toán', code: 'T1', rating: null, comment: '' }]
                }]
            })
        });

        render(<SurveySection />);
        const submitBtn = await screen.findByRole('button', { name: /Gửi đánh giá/i });

        fireEvent.click(screen.getByTitle('Rất tốt'));

        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ status: 'success' })
        });

        fireEvent.click(submitBtn);

        expect(await screen.findByText(/Đã gửi đánh giá thành công!/i)).toBeInTheDocument();

        // SỬA Ở ĐÂY: Bỏ regex / /, dùng exact match để lấy đúng nút "Quay lại" của thông báo thành công
        const backBtn = screen.getByRole('button', { name: 'Quay lại', exact: true });
        fireEvent.click(backBtn);

        expect(screen.queryByText(/Đã gửi đánh giá thành công!/i)).not.toBeInTheDocument();
    });
});