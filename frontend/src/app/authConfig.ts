import { Configuration } from "@azure/msal-browser";

export const msalConfig: Configuration = {
    auth: {
        // Thay bằng Client ID lấy từ Microsoft Entra ID (Azure AD)
        clientId: "69b453e1-9064-4549-a110-7ef5367fd983", 
        // Dùng tenant cụ thể của trường KHTN hoặc 'organizations'
        authority: "https://login.microsoftonline.com/40127cd4-45f3-49a3-b05d-315a43a9f033", 
        // Đường dẫn trả về sau khi login thành công
        redirectUri: "http://localhost:5173", 
    },
    cache: {
        cacheLocation: "sessionStorage", // Lưu cache trong session
        storeAuthStateInCookie: false, 
    }
};

export const loginRequest = {
    scopes: ["User.Read"]
};