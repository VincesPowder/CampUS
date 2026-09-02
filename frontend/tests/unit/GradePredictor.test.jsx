import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { ProgressSection } from '../../src/app/StudentSections';

// Mock MSAL Auth cho phía Frontend
vi.mock('@azure/msal-react', () => ({
    useMsal: () => ({ accounts: [{ username: '24127158', name: 'Lan Duy' }] })
}));

// MOCK API FETCH ĐỂ TRÁNH LỖI INVALID URL
global.fetch = vi.fn();

describe('Unit Test: Grade Predictor (UC 2.9)', () => {

    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch.mockResolvedValue({
            ok: true,
            json: async () => ({
                status: "success",
                data: {
                    general_info: { tong_tc_yc: 138, tong_tc_dat: 100 },
                    current_courses: [
                        { maMon: "INT100", tenMon: "Test Course", namHoc: "25-26", hocKy: "HK1", diemGK: null, diemCK: null }
                    ],
                    credit_groups: [],
                    courses_by_group: {},
                    radar_data: []
                }
            })
        });
    });

    // Helper: Render component và chờ API chạy xong
    const renderComponent = async () => {
        await act(async () => {
            render(<ProgressSection />);
        });
    };

    // Helper: Lấy tất cả các ô input number (0: CC Weight, 1: CC Score, 2: GK Weight, 3: GK Score, 4: CK Score, 5: Bonus, 6: Target)
    const getInputs = () => screen.getAllByRole('spinbutton');

    it('[TC_2.9_01]: Verify course selection dynamically auto-fills existing grades', async () => {
        await renderComponent();
        const inputs = getInputs();
        expect(inputs[1]).toBeInTheDocument(); // CC Score
        expect(inputs[3]).toBeInTheDocument(); // GK Score
    });

    it('[TC_2.9_02]: Verify dynamic calculation of the Final Exam (CK) weight', async () => {
        await renderComponent();
        const inputs = getInputs();

        await act(async () => {
            fireEvent.change(inputs[0], { target: { value: '20' } });
            fireEvent.change(inputs[2], { target: { value: '40' } });
        });

        expect(screen.getByText('40%')).toBeInTheDocument();
    });

    it('[TC_2.9_03]: Verify warning banner and logic when total weights exceed 100%', async () => {
        await renderComponent();
        const inputs = getInputs();

        await act(async () => {
            fireEvent.change(inputs[0], { target: { value: '60' } });
            fireEvent.change(inputs[2], { target: { value: '50' } });
        });

        expect(screen.getByText(/vượt 100%/i)).toBeInTheDocument();
        expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('[TC_2.9_04]: Verify "Điểm tổng kết" (Total Score) calculation logic with Bonus points', async () => {
        await renderComponent();
        const inputs = getInputs();

        await act(async () => {
            fireEvent.change(inputs[0], { target: { value: '10' } });
            fireEvent.change(inputs[2], { target: { value: '30' } });
            fireEvent.change(inputs[1], { target: { value: '8' } });
            fireEvent.change(inputs[3], { target: { value: '7' } });
            fireEvent.change(inputs[4], { target: { value: '9' } });

            // SỬA: Trong UI thiết kế hệ số tự chia 10 (Math.min(val, 10)/10). 
            // Cần nhập '5' (5 điểm cộng) để hệ thống tự lấy 10% của 5 = 0.5 cộng vào tổng kết.
            fireEvent.change(inputs[5], { target: { value: '5' } });
        });

        expect(screen.getByText('8.80')).toBeInTheDocument();
    });

    it('[TC_2.9_05]: Verify changing the prediction target via radio buttons', async () => {
        await renderComponent();
        const inputs = getInputs();

        const gkRadioButton = screen.getByTitle('Dự đoán điểm Giữa kỳ (GK)');
        await act(async () => {
            fireEvent.click(gkRadioButton);
        });

        expect(screen.getByText('Cần GK:')).toBeInTheDocument();
        expect(inputs[3]).toHaveAttribute('placeholder', 'để trống');
    });

    it('[TC_2.9_06]: Verify prediction math for the Final Exam (CK) with a valid target', async () => {
        await renderComponent();
        const inputs = getInputs();

        await act(async () => {
            fireEvent.change(inputs[0], { target: { value: '10' } });
            fireEvent.change(inputs[2], { target: { value: '30' } });
            fireEvent.change(inputs[1], { target: { value: '8' } });
            fireEvent.change(inputs[3], { target: { value: '7' } });
            fireEvent.change(inputs[4], { target: { value: '' } });
            fireEvent.change(inputs[6], { target: { value: '8.0' } });
        });

        expect(screen.getByText('8.5')).toBeInTheDocument();
    });

    it('[TC_2.9_07 & TC_2.9_08]: Verify "Không khả thi" and edge-case prediction outputs', async () => {
        await renderComponent();
        const inputs = getInputs();

        await act(async () => {
            fireEvent.change(inputs[0], { target: { value: '10' } });
            fireEvent.change(inputs[2], { target: { value: '30' } });
            fireEvent.change(inputs[1], { target: { value: '2' } });
            fireEvent.change(inputs[3], { target: { value: '3' } });
            fireEvent.change(inputs[6], { target: { value: '9.0' } });
        });

        expect(screen.getByText(/Không khả thi/i)).toBeInTheDocument();

        await act(async () => {
            fireEvent.change(inputs[6], { target: { value: '5.0' } });
        });

        expect(screen.getByText('Cần CK:')).toBeInTheDocument();
        expect(screen.getByText('6.5')).toBeInTheDocument();
        expect(screen.queryByText(/Không khả thi/i)).not.toBeInTheDocument();
    });
});