import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import App from '../../src/app/App'; 

// 1. Mock useMsal
vi.mock('@azure/msal-react', () => ({
  useMsal: () => ({
    instance: { getAllAccounts: () => [], logoutRedirect: vi.fn() },
    accounts: [{ username: "24127001@student.hcmus.edu.vn", name: "Test Student" }],
  })
}));

// 2. Mock Login Component để bypass auth màn hình chính
vi.mock('../../src/app/components/Login', () => ({
  default: ({ onLogin }) => (
    <button data-testid="mock-login-btn" onClick={() => onLogin('student')}>
      Bypass Login
    </button>
  )
}));

// Ignore warning Act(...) của React khi test
const originalConsoleError = console.error;
console.error = (...args) => {
  if (/Warning.*not wrapped in act/.test(args[0])) return;
  originalConsoleError(...args);
};

describe('Kiểm tra AI Chatbot - Unit Test (UC 2.26)', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    localStorage.setItem("campus_token", "fake_token");

    // MOCK scrollIntoView
    window.HTMLElement.prototype.scrollIntoView = vi.fn();

    // MOCK Fetch API mặc định để tránh crash ProfileSection
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ 
        status: "success", 
        data: [],
        fullName: "Mock Student", 
        role: "Sinh viên",
        mssv: "24127001"
      })
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.clearAllMocks();
  });

  it('[TC_2.26_03]: Verify empty input prevention and "Enter" key submission', async () => {
    render(<App />);

    fireEvent.click(screen.getByTestId('mock-login-btn'));

    const toggleBtn = screen.getByTitle('Trợ lý AI');
    fireEvent.click(toggleBtn);

    const input = screen.getByPlaceholderText(/Nhập câu hỏi/i);
    const sendBtn = input.nextElementSibling; 

    expect(sendBtn.style.cursor).toBe('not-allowed');

    fireEvent.change(input, { target: { value: '   ' } });
    expect(sendBtn.style.cursor).toBe('not-allowed');

    global.fetch.mockImplementationOnce(async (url) => {
        if (url.includes('/api/chatbot/ask')) {
            return { ok: true, json: async () => ({ status: "success", data: { reply: "Xin chào!" } }) };
        }
        return { ok: true, json: async () => ({ status: "success", data: [] }) };
    });

    fireEvent.change(input, { target: { value: 'Lịch thi của tôi' } });
    expect(sendBtn.style.cursor).toBe('pointer');

    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', shiftKey: false });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/chatbot/ask'), expect.anything());
    });
  });

  it('[TC_2.26_05]: Verify minimize functionality', async () => {
    render(<App />);
    
    fireEvent.click(screen.getByTestId('mock-login-btn'));

    const toggleBtn = screen.getByTitle('Trợ lý AI');
    fireEvent.click(toggleBtn);

    // 🎯 SỬA LỖI: Định vị chính xác DOM của Header và Nút Minimize
    const headerTitle = screen.getAllByText('HCMUS AI')[0];
    const header = headerTitle.closest('.flex-shrink-0'); // Lấy div header bao ngoài
    const chatContainer = header.parentElement; // Main container
    const minimizeBtn = header.querySelectorAll('button')[0]; // Nút minimize là nút button đầu tiên ở góc phải header

    // Kiểm tra chiều cao lúc đang mở
    expect(chatContainer.style.maxHeight).toBe('520px');

    // Bấm thu nhỏ
    fireEvent.click(minimizeBtn);

    // Dùng waitFor để chờ React State render lại DOM
    await waitFor(() => {
      expect(chatContainer.style.maxHeight).toBe('56px');
    });
  });
});