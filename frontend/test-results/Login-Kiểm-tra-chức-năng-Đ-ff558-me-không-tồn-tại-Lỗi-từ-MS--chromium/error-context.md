# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: Login.spec.js >> Kiểm tra chức năng Đăng nhập - Frontend E2E >> [TC_2.1_05]: Báo lỗi khi nhập username không tồn tại (Lỗi từ MS)
- Location: tests\e2e\Login.spec.js:90:5

# Error details

```
Error: browserType.launch: Executable doesn't exist at C:\Users\DELL\AppData\Local\ms-playwright\chromium_headless_shell-1234\chrome-headless-shell-win64\chrome-headless-shell.exe
╔════════════════════════════════════════════════════════════╗
║ Looks like Playwright was just installed or updated.       ║
║ Please run the following command to download new browsers: ║
║                                                            ║
║     pnpm exec playwright install                           ║
║                                                            ║
║ <3 Playwright Team                                         ║
╚════════════════════════════════════════════════════════════╝
```