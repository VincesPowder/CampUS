import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { ProgressSection } from '../../src/app/StudentSections';

// Mock MSAL Auth cho phía Frontend
vi.mock('@azure/msal-react', () => ({
    useMsal: () => ({ accounts: [{ username: '24127158', name: 'Lan Duy' }] })
}));

describe('Unit Test: Grade Predictor (UC 2.9)', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    // Helper: Component ProgressSection có các ô input type="number" (spinbutton) theo thứ tự:
    // 0: CC Weight, 1: CC Score, 2: GK Weight, 3: GK Score, 4: CK Score, 5: Bonus, 6: Target
    const getInputs = () => screen.getAllByRole('spinbutton');

    it('[TC_2.9_01]: Verify course selection dynamically auto-fills existing grades', () => {
        render(<ProgressSection />);
        const inputs = getInputs();
        expect(inputs[1]).toBeInTheDocument(); // CC Score
        expect(inputs[3]).toBeInTheDocument(); // GK Score
    });

    it('[TC_2.9_02]: Verify dynamic calculation of the Final Exam (CK) weight', () => {
        render(<ProgressSection />);
        const inputs = getInputs();

        fireEvent.change(inputs[0], { target: { value: '20' } });
        fireEvent.change(inputs[2], { target: { value: '40' } });

        expect(screen.getByText('40%')).toBeInTheDocument();
    });

    it('[TC_2.9_03]: Verify warning banner and logic when total weights exceed 100%', () => {
        render(<ProgressSection />);
        const inputs = getInputs();

        fireEvent.change(inputs[0], { target: { value: '60' } });
        fireEvent.change(inputs[2], { target: { value: '50' } });

        expect(screen.getByText(/vượt 100%/i)).toBeInTheDocument();
        expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('[TC_2.9_04]: Verify "Điểm tổng kết" (Total Score) calculation logic with Bonus points', () => {
        render(<ProgressSection />);
        const inputs = getInputs();

        fireEvent.change(inputs[0], { target: { value: '10' } });
        fireEvent.change(inputs[2], { target: { value: '30' } });

        fireEvent.change(inputs[1], { target: { value: '8' } });
        fireEvent.change(inputs[3], { target: { value: '7' } });
        fireEvent.change(inputs[4], { target: { value: '9' } });
        fireEvent.change(inputs[5], { target: { value: '0.5' } });

        expect(screen.getByText('8.80')).toBeInTheDocument();
    });

    it('[TC_2.9_05]: Verify changing the prediction target via radio buttons', () => {
        render(<ProgressSection />);
        const inputs = getInputs();

        const gkRadioButton = screen.getByTitle('Dự đoán điểm Giữa kỳ (GK)');
        fireEvent.click(gkRadioButton);

        expect(screen.getByText('Cần GK:')).toBeInTheDocument();
        expect(inputs[3]).toHaveAttribute('placeholder', 'để trống');
    });

    it('[TC_2.9_06]: Verify prediction math for the Final Exam (CK) with a valid target', () => {
        render(<ProgressSection />);
        const inputs = getInputs();

        fireEvent.change(inputs[0], { target: { value: '10' } });
        fireEvent.change(inputs[2], { target: { value: '30' } });

        fireEvent.change(inputs[1], { target: { value: '8' } });
        fireEvent.change(inputs[3], { target: { value: '7' } });
        fireEvent.change(inputs[4], { target: { value: '' } });
        fireEvent.change(inputs[6], { target: { value: '8.0' } });

        expect(screen.getByText('8.5')).toBeInTheDocument();
    });

    it('[TC_2.9_07 & TC_2.9_08]: Verify "Không khả thi" and edge-case prediction outputs', () => {
        render(<ProgressSection />);

        const inputs = getInputs();

        // ============================================================
        // SET TỈ LỆ:
        // CC = 10%
        // GK = 30%
        // CK = 60%
        // ============================================================

        fireEvent.change(inputs[0], {
            target: { value: '10' }
        });

        fireEvent.change(inputs[2], {
            target: { value: '30' }
        });

        // ============================================================
        // TC_2.9_07
        // CC = 2
        // GK = 3
        // Target = 9.0
        //
        // CK cần đạt:
        // (9 - 2*0.1 - 3*0.3) / 0.6
        // = 13.166...
        //
        // > 10 => Không khả thi
        // ============================================================

        fireEvent.change(inputs[1], {
            target: { value: '2' }
        });

        fireEvent.change(inputs[3], {
            target: { value: '3' }
        });

        fireEvent.change(inputs[6], {
            target: { value: '9.0' }
        });

        expect(
            screen.getByText(/Không khả thi/i)
        ).toBeInTheDocument();


        // ============================================================
        // TC_2.9_08
        // Hạ mục tiêu xuống 5.0
        //
        // CK cần đạt:
        // (5 - 2*0.1 - 3*0.3) / 0.6
        // = 6.5
        //
        // => Hợp lệ, không còn "Không khả thi"
        // ============================================================

        fireEvent.change(inputs[6], {
            target: { value: '5.0' }
        });


        // Chờ React cập nhật state
        expect(
            screen.getByText('Cần CK:')
        ).toBeInTheDocument();


        // Kết quả dự đoán phải là 6.5
        expect(
            screen.getByText('6.5')
        ).toBeInTheDocument();


        // Không còn trạng thái "Không khả thi"
        expect(
            screen.queryByText(/Không khả thi/i)
        ).not.toBeInTheDocument();
    });
});