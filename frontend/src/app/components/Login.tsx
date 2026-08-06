import React, { useState, useEffect } from 'react';
import { useMsal } from "@azure/msal-react";
import { loginRequest } from '../authConfig';
import { GraduationCap } from "lucide-react";
import hcmusBg from "../../imports/image-14.png";

// Import các component UI
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";

type LoginProps = {
  onLogin: (role: "admin" | "student", method: "local" | "msal") => void;
};

export default function Login({ onLogin }: LoginProps) {
  const { instance, accounts, inProgress } = useMsal();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const PJS: React.CSSProperties = { fontFamily: "'Plus Jakarta Sans', sans-serif" };

  useEffect(() => {
    // Chỉ chạy logic khi MSAL đã xử lý xong các trạng thái (không còn inProgress)
    if (inProgress !== "none") return;

    const existingToken = localStorage.getItem('campus_token');
    const isLoggingIn = sessionStorage.getItem('campus_is_logging_in');

    // Dọn dẹp: Nếu không có tài khoản MSAL nào -> Xóa cờ nếu đang bị kẹt
    if (accounts.length === 0) {
      if (isLoggingIn) sessionStorage.removeItem('campus_is_logging_in');
      return;
    }

    // TRƯỜNG HỢP 1: ĐÃ CÓ TOKEN (Người dùng F5 tải lại trang)
    if (existingToken) {
      const userEmail = accounts[0].username || "";
      let userRole = "student"; // Default fallback

      try {
        // Giải mã JWT token (tách phần payload ở giữa và parse JSON)
        const payload = JSON.parse(atob(existingToken.split('.')[1]));
        
        // Ưu tiên role lấy từ token, nếu không có mới dùng fallback email
        userRole = payload.role || (userEmail.includes("@student") ? "student" : "admin");
      } catch (error) {
        console.error("Lỗi giải mã token:", error);
        userRole = userEmail.includes("@student") ? "student" : "admin";
      }

      onLogin(userRole, "msal");
      return;
    }

    // TRƯỜNG HỢP 2: VỪA REDIRECT TỪ MICROSOFT VỀ (Có cờ đánh dấu đang xử lý Login)
    if (isLoggingIn === 'true') {
      const processLogin = async () => {
        setIsProcessing(true);
        try {
          const account = accounts[0];
          const userEmail = account.username || "";

          // 1. Chặn domain sai
          if (!userEmail.endsWith("@student.hcmus.edu.vn") && !userEmail.endsWith("@hcmus.edu.vn")) {
            setError("Hệ thống chỉ hỗ trợ đăng nhập bằng email trường (@student.hcmus.edu.vn).");
            sessionStorage.removeItem('campus_is_logging_in');
            await instance.logoutRedirect({ account: account, postLogoutRedirectUri: window.location.origin });
            return;
          }

          // 2. Xin Access Token từ MSAL để gửi xuống backend
          const response = await instance.acquireTokenSilent({
            ...loginRequest,
            account: account
          });

          // 3. Gọi API Backend Flask
          const backendRes = await fetch('http://localhost:5000/api/auth/ms-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                token: response.accessToken, 
                email: userEmail,
                name: account?.name
            })
          });

          const data = await backendRes.json();
          if (!backendRes.ok) {
            setError(data.error || "Đăng nhập thất bại từ máy chủ Backend.");
            sessionStorage.removeItem('campus_is_logging_in');
            await instance.logoutRedirect({ account: account, postLogoutRedirectUri: window.location.origin });
            return;
          }

          // 4. Lưu token và vào App
          localStorage.setItem('campus_token', data.token);
          
          // QUAN TRỌNG: Xóa cờ đi sau khi login thành công. Nếu không xóa, lần sau bấm Logout nó sẽ tự động Login lại.
          sessionStorage.removeItem('campus_is_logging_in'); 
          onLogin(data.role || (userEmail.includes("@student") ? "student" : "admin"), "msal");

        } catch (err: any) {
          console.error("Lỗi xử lý đăng nhập:", err);
          setError("Lỗi xác thực. Vui lòng thử đăng nhập lại.");
          sessionStorage.removeItem('campus_is_logging_in');
        } finally {
          setIsProcessing(false);
        }
      };

      processLogin();
    }
  }, [inProgress, accounts, instance, onLogin]);

  const handleMsLogin = async () => {
    try {
      setError(null);
      // Bật cờ đánh dấu người dùng CHỦ ĐỘNG click nút đăng nhập
      sessionStorage.setItem('campus_is_logging_in', 'true');
      setIsProcessing(true);
      await instance.loginRedirect({
        ...loginRequest,
        prompt: "select_account",
      });
    } catch (e) {
      console.error(e);
      setError("Không thể chuyển hướng đến Microsoft.");
      setIsProcessing(false);
      sessionStorage.removeItem('campus_is_logging_in');
    }
  };

  const isLoading = inProgress !== "none" || isProcessing;

  return (
    <div
      className="min-h-screen flex items-center justify-center relative"
      style={{ backgroundImage: `url(${hcmusBg})`, backgroundSize: "cover", backgroundPosition: "center" }}
    >
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.55)" }} />

      <div className="relative z-10 bg-white shadow-2xl px-8 py-10 flex flex-col items-center w-full max-w-sm rounded-xl">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mb-4 border-2"
          style={{ borderColor: "#3E4B8E", background: "#eef2ff" }}
        >
          <GraduationCap className="w-8 h-8" style={{ color: "#3E4B8E" }} />
        </div>

        <h1 className="text-2xl font-bold mb-1 tracking-tight" style={{ ...PJS, color: "#3E4B8E" }}>
          CampUS
        </h1>
        <p className="text-xs text-gray-400 mb-8 tracking-widest font-medium">ĐĂNG NHẬP</p>

        {error && (
          <div className="w-full bg-red-50 text-red-500 text-xs px-3 py-3 mb-4 rounded border border-red-100 text-center leading-relaxed">
            {error}
          </div>
        )}

        <button
          onClick={handleMsLogin}
          type="button"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-lg py-3 px-4 text-sm font-semibold hover:bg-[#f0f3ff] hover:border-[#3E4B8E] transition-all group disabled:opacity-50"
          style={{ ...PJS, color: "#1e293b" }}
        >
          <svg width="20" height="20" viewBox="0 0 21 21" fill="none">
            <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
            <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
            <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
            <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
          </svg>
          <span className="group-hover:text-[#3E4B8E] transition-colors">
            {isLoading ? "Đang xử lý xác thực..." : "Đăng nhập với Microsoft"}
          </span>
        </button>

        <div className="mt-6 w-full text-center">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button type="button" className="text-xs text-gray-500 hover:text-blue-600 hover:underline" style={{ fontFamily: "'Inter', sans-serif" }}>
                Trợ giúp đăng nhập?
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Hỗ trợ đăng nhập</AlertDialogTitle>
                <AlertDialogDescription>
                  Hệ thống chỉ hỗ trợ đăng nhập qua cổng SSO Microsoft Entra ID bằng email nội bộ của trường. Nếu quên mật khẩu, vui lòng dùng cổng khôi phục của Microsoft.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Đóng</AlertDialogCancel>
                <AlertDialogAction onClick={() => window.open('https://myaccount.microsoft.com/security-info', '_blank')}>
                  Đến trang Khôi phục
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <p className="text-[9px] text-gray-400 text-center mt-8 tracking-wide">©GROUP 3 - AMONG US</p>
      </div>
    </div>
  );
}