import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App';
import './styles/index.css'; // Đổi lại đúng đường dẫn của ông nhé

// 1. Import MSAL & Config
import { PublicClientApplication } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";
import { msalConfig } from './app/authConfig';

// 2. Khởi tạo instance
const msalInstance = new PublicClientApplication(msalConfig);

// 3. Khởi tạo MSAL (bắt buộc với msal-browser v3) trước khi render React
msalInstance.initialize().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      {/* Bọc toàn bộ App trong MsalProvider */}
      <MsalProvider instance={msalInstance}>
        <App />
      </MsalProvider>
    </React.StrictMode>
  );
}).catch(err => {
  console.error("Lỗi khởi tạo MSAL:", err);
  // Có thể render một màn hình báo lỗi ở đây nếu MSAL tịt hẳn
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <div style={{ padding: 20, color: 'red' }}>Lỗi hệ thống SSO. Vui lòng liên hệ IT.</div>
  );
});