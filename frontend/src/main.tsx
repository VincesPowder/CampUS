import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";

// 1. Import các module MSAL và cấu hình
import { PublicClientApplication } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";
import { msalConfig } from "./app/authConfig"; // Đảm bảo đường dẫn này đúng với vị trí file authConfig.ts

// 2. Khởi tạo MSAL instance
const msalInstance = new PublicClientApplication(msalConfig);

// 3. Đợi MSAL initialize() chạy xong rồi mới render App
msalInstance.initialize().then(() => {
  createRoot(document.getElementById("root")!).render(
    // 4. Bọc App bằng MsalProvider để truyền instance xuống các component con
    <MsalProvider instance={msalInstance}>
      <App />
    </MsalProvider>
  );
}).catch(e => {
  console.error("Lỗi khởi tạo MSAL:", e);
});