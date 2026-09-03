import React from 'react';
import {
    render,
    screen,
    fireEvent,
    act,
    waitFor,
} from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { AdminApp } from '../../src/app/AdminSections';

global.fetch = vi.fn();
window.confirm = vi.fn(() => true);

const mockAdminProfile = {
    email: 'admin@hcmus.edu.vn',
    name: 'Quản trị',
    msid: 'AD',
};

describe('Unit Test: Create & Deploy Surveys (UC 2.24)', () => {
    beforeEach(async () => {
        vi.clearAllMocks();

        global.fetch.mockImplementation((url, options = {}) => {
            const method = options.method || 'GET';

            // =========================
            // DELETE survey
            // =========================
            if (
                url.includes('/api/admin/surveys/KS_01') &&
                method === 'DELETE'
            ) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({
                        status: 'success',
                    }),
                });
            }

            // =========================
            // GET survey detail
            // =========================
            if (
                url.includes('/api/admin/surveys/KS_01') &&
                method === 'GET'
            ) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({
                        status: 'success',
                        data: {
                            id: 'KS_01',
                            title: 'Khảo sát chất lượng',
                            responseRate: 80,
                            submittedCount: 40,
                            totalTarget: 50,
                            questions: [
                                {
                                    id: 'Q1',
                                    content: 'Cơ sở vật chất thế nào?',
                                    code: 'Trắc nghiệm',
                                    averageRating: 4.5,
                                    ratingBreakdown: [
                                        {
                                            star: 5,
                                            count: 30,
                                            percentage: 75,
                                        },
                                    ],
                                    textResponses: ['Rất tốt'],
                                },
                            ],
                        },
                    }),
                });
            }

            // =========================
            // POST create survey
            // =========================
            if (
                url.includes('/api/admin/surveys') &&
                method === 'POST'
            ) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({
                        status: 'success',
                        data: {
                            id: 'KS_NEW',
                            title: 'Khảo sát Mới Test',
                        },
                    }),
                });
            }

            // =========================
            // GET survey list
            // =========================
            if (
                url.includes('/api/admin/surveys') &&
                method === 'GET'
            ) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({
                        status: 'success',
                        data: [
                            {
                                id: 'KS_01',
                                title: 'Khảo sát chất lượng',
                                description: 'Đánh giá CSVC',
                                deadline: '2026-09-30',
                                status: 'active',
                                submittedCount: 40,
                                totalTarget: 50,
                                responseRate: 80,
                                questionsCount: 2,
                            },
                        ],
                    }),
                });
            }

            // =========================
            // Admin students
            // =========================
            if (url.includes('/api/admin/students')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({
                        status: 'success',
                        data: [],
                    }),
                });
            }

            // =========================
            // Profile edit permission
            // =========================
            if (url.includes('/api/admin/profile-edit-permission')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({
                        status: 'success',
                        data: {},
                    }),
                });
            }

            // =========================
            // Sidebar badges
            // =========================
            if (url.includes('/api/admin/sidebar-badges')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({
                        status: 'success',
                        data: {},
                    }),
                });
            }

            // =========================
            // Default response
            // =========================
            return Promise.resolve({
                ok: true,
                json: async () => ({
                    status: 'success',
                    data: [],
                }),
            });
        });

        await act(async () => {
            render(
                <AdminApp
                    onLogout={vi.fn()}
                    HelpButton={() => <div />}
                    adminProfile={mockAdminProfile}
                />
            );
        });

        // Điều hướng sang tab Khảo sát
        await act(async () => {
            fireEvent.click(
                screen.getAllByRole('button', {
                    name: /Khảo sát/i,
                })[0]
            );
        });
    });

    // =========================================================
    // TC_2.24_01 & TC_2.24_02
    // =========================================================
    it(
        '[TC_2.24_01 & 02]: Verify dynamic question adding in Create Survey Modal and Submit',
        async () => {
            // Mở modal Tạo khảo sát
            await act(async () => {
                fireEvent.click(
                    screen.getByRole('button', {
                        name: /Tạo khảo sát/i,
                    })
                );
            });

            expect(
                screen.getByText('Tạo đợt khảo sát mới')
            ).toBeInTheDocument();

            // Thêm câu hỏi tự luận
            await act(async () => {
                fireEvent.click(
                    screen.getByRole('button', {
                        name: /\+ Tự luận/i,
                    })
                );
            });

            expect(
                screen.getByText('Câu hỏi 2')
            ).toBeInTheDocument();

            // =====================================================
            // Nhập tiêu đề
            // =====================================================
            const titleInput =
                screen.getByPlaceholderText(
                    'Nhập tiêu đề khảo sát...'
                );

            await act(async () => {
                fireEvent.change(titleInput, {
                    target: {
                        value: 'Khảo sát Mới Test',
                    },
                });
            });

            // =====================================================
            // Nhập ngày
            // =====================================================
            const dateInputs =
                document.querySelectorAll(
                    'input[type="date"]'
                );

            if (dateInputs.length > 0) {
                await act(async () => {
                    fireEvent.change(dateInputs[0], {
                        target: {
                            value: '2026-12-31',
                        },
                    });
                });
            }

            // =====================================================
            // Nhập nội dung câu hỏi
            // =====================================================
            const questionInputs =
                screen.getAllByPlaceholderText(
                    /Nhập nội dung câu hỏi/i
                );

            if (questionInputs.length > 0) {
                await act(async () => {
                    fireEvent.change(questionInputs[0], {
                        target: {
                            value: 'Bạn có hài lòng không?',
                        },
                    });
                });
            }

            // Nếu có câu hỏi thứ 2 thì nhập luôn
            if (questionInputs.length > 1) {
                await act(async () => {
                    fireEvent.change(questionInputs[1], {
                        target: {
                            value: 'Bạn có góp ý gì không?',
                        },
                    });
                });
            }

            // =====================================================
            // Submit
            // =====================================================
            const submitButtons =
                screen.getAllByRole('button', {
                    name: 'Tạo khảo sát',
                });

            // Nút trong modal thường là nút cuối cùng
            const submitBtn =
                submitButtons[submitButtons.length - 1];

            await act(async () => {
                fireEvent.click(submitBtn);
            });

            // =====================================================
            // Kiểm tra POST
            // =====================================================
            await waitFor(() => {
                expect(global.fetch).toHaveBeenCalledWith(
                    expect.stringContaining(
                        '/api/admin/surveys'
                    ),
                    expect.objectContaining({
                        method: 'POST',
                        body: expect.stringContaining(
                            'Khảo sát Mới Test'
                        ),
                    })
                );
            });
        }
    );

    // =========================================================
    // TC_2.24_04
    // =========================================================
    it(
        '[TC_2.24_04]: Verify survey results and breakdown rendering',
        async () => {
            const resultBtns =
                await screen.findAllByRole('button', {
                    name: /Kết quả/i,
                });

            await act(async () => {
                fireEvent.click(resultBtns[0]);
            });

            expect(
                await screen.findByText('4.5 / 5.0 ⭐')
            ).toBeInTheDocument();

            expect(
                screen.getByText('Rất tốt')
            ).toBeInTheDocument();
        }
    );

    // =========================================================
    // TC_2.24_05
    // =========================================================
    it(
        '[TC_2.24_05]: Verify survey deletion functionality',
        async () => {
            const deleteBtn =
                await screen.findByTitle('Xóa khảo sát');

            await act(async () => {
                fireEvent.click(deleteBtn);
            });

            expect(
                window.confirm
            ).toHaveBeenCalled();

            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining(
                    '/api/admin/surveys/KS_01'
                ),
                expect.objectContaining({
                    method: 'DELETE',
                })
            );
        }
    );

    it('[TC_2.24_03]: Verify survey filtering and status count stats', async () => {
        // Kiểm tra việc bấm nút lọc trạng thái "Đang diễn ra"
        const activeFilterBtn = screen.getByRole('button', { name: 'Đang diễn ra' });
        await act(async () => { fireEvent.click(activeFilterBtn); });

        // Xác minh API gọi với đúng query param lọc status=active
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/admin/surveys?status=active'),
            expect.any(Object)
        );

        // Kiểm tra việc bấm nút lọc trạng thái "Đã kết thúc"
        const closedFilterBtn = screen.getByRole('button', { name: 'Đã kết thúc' });
        await act(async () => { fireEvent.click(closedFilterBtn); });

        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/admin/surveys?status=closed'),
            expect.any(Object)
        );
    });
});