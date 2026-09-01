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
        // UI render "Không có khảo sát nào" thay vì "Không có khảo sát nào cần thực hiện"
        expect(await screen.findByText(/Không có khảo sát nào/i)).toBeInTheDocument();
    });

    it('[TC_2.10_02]: Verify opening a pending survey from list', async () => {
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

        // CẬP NHẬT: Không còn auto-open, phải click vào card Khảo sát
        const surveyCard = await screen.findByText('Khảo sát HK1');
        fireEvent.click(surveyCard);

        expect(await screen.findByText(/Cấu trúc dữ liệu/i)).toBeInTheDocument();
        // Tên nút là "Gửi khảo sát" thay vì "Gửi đánh giá"
        expect(screen.getByRole('button', { name: /Gửi khảo sát/i })).toBeInTheDocument();
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
        // UI hiển thị "✓ Đã hoàn thành" thay vì "Đã Hoàn thành"
        expect(await screen.findByText(/✓ Đã hoàn thành/i)).toBeInTheDocument();
        expect(screen.getByText(/Hạn: 2026-08-16/i)).toBeInTheDocument();
    });

    it('[TC_2.10_04 & TC_2.10_08]: Verify pre-filling and Read-only mode constraints for completed surveys', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                status: 'success',
                data: [{
                    id: 'KS01', title: 'Khảo sát HK1', status: 'completed', description: 'Mô tả', deadline: '2026-10-10',
                    courses: [{ id: 'MH01', name: 'Môn A', code: 'A1', type: 'Trắc nghiệm', rating: 4, comment: 'Dạy rất nhiệt tình' }]
                }]
            })
        });

        render(<SurveySection />);
        // Mở khảo sát từ list
        const surveyCard = await screen.findByText('Khảo sát HK1');
        fireEvent.click(surveyCard);

        // UI hiển thị "Bản xem lại" thay vì "Bản xem trước"
        expect(await screen.findByText(/Bản xem lại/i)).toBeInTheDocument();

        const textareas = screen.getAllByRole('textbox');
        expect(textareas[0]).toHaveValue('Dạy rất nhiệt tình');
        expect(textareas[0]).toHaveAttribute('readonly');
        expect(screen.queryByRole('button', { name: /Gửi khảo sát/i })).not.toBeInTheDocument();
    });

    it('[TC_2.10_05 & TC_2.10_06]: Verify rating selection and submit button validation (allRated logic)', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                status: 'success',
                data: [{
                    id: 'KS01', title: 'Khảo sát HK1', status: 'pending', description: 'Mô tả', deadline: '2026-10-10',
                    courses: [
                        { id: 'MH01', name: 'Toán', code: 'T1', type: 'Trắc nghiệm', rating: null, comment: '' },
                        { id: 'MH02', name: 'Lý', code: 'L1', type: 'Trắc nghiệm', rating: null, comment: '' }
                    ]
                }]
            })
        });

        render(<SurveySection />);
        // Mở khảo sát
        const surveyCard = await screen.findByText('Khảo sát HK1');
        fireEvent.click(surveyCard);

        const submitBtn = await screen.findByRole('button', { name: /Gửi khảo sát/i });

        expect(submitBtn).toBeDisabled();
        // Cập nhật Label warning mới
        expect(screen.getByText(/Vui lòng hoàn thành tất cả các câu hỏi trắc nghiệm và tự luận trước khi gửi/i)).toBeInTheDocument();

        const ratingBtns = screen.getAllByTitle('Rất tốt');

        // Đánh giá Toán
        fireEvent.click(ratingBtns[0]);
        expect(submitBtn).toBeDisabled();
        expect(screen.getByText(/Vui lòng hoàn thành tất cả/i)).toBeInTheDocument();

        // Đánh giá Lý
        fireEvent.click(ratingBtns[1]);
        expect(screen.queryByText(/Vui lòng hoàn thành tất cả/i)).not.toBeInTheDocument();
        expect(submitBtn).not.toBeDisabled();
    });

    it('[TC_2.10_07]: Verify successful survey submission and success screen transition', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                status: 'success',
                data: [{
                    id: 'KS01', title: 'Khảo sát HK1', status: 'pending', description: 'Mô tả', deadline: '2026-10-10',
                    courses: [{ id: 'MH01', name: 'Toán', code: 'T1', type: 'Trắc nghiệm', rating: null, comment: '' }]
                }]
            })
        });

        render(<SurveySection />);

        // Mở khảo sát
        const surveyCard = await screen.findByText('Khảo sát HK1');
        fireEvent.click(surveyCard);

        const submitBtn = await screen.findByRole('button', { name: /Gửi khảo sát/i });

        fireEvent.click(screen.getByTitle('Rất tốt'));

        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ status: 'success' })
        });

        fireEvent.click(submitBtn);

        expect(await screen.findByText(/Đã gửi đánh giá thành công!/i)).toBeInTheDocument();

        // Nút quay lại giờ là "Quay lại danh sách"
        const backBtn = screen.getByRole('button', { name: 'Quay lại danh sách', exact: true });
        fireEvent.click(backBtn);

        expect(screen.queryByText(/Đã gửi đánh giá thành công!/i)).not.toBeInTheDocument();
    });
});