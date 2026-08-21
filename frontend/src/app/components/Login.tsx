import React, { useState, useEffect } from 'react';
import { useMsal } from "@azure/msal-react";
import { loginRequest } from '../authConfig';
import bgImage from "@imports/bg.jpg"; 

type LoginProps = {
  onLogin: (role: "admin" | "student", method: "local" | "msal", profileData?: any) => void;
};

export default function Login({ onLogin }: LoginProps) {
  const { instance, accounts, inProgress } = useMsal();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const PJS: React.CSSProperties = { fontFamily: "'Plus Jakarta Sans', sans-serif" };

  useEffect(() => {
    if (inProgress !== "none") return;

    const existingToken = localStorage.getItem('campus_token');
    const isLoggingIn = sessionStorage.getItem('campus_is_logging_in');

    if (accounts.length === 0) {
      if (isLoggingIn) sessionStorage.removeItem('campus_is_logging_in');
      return;
    }

    // Tự động khôi phục phiên nếu đã có token
    if (existingToken) {
      try {
        const tokenParts = existingToken.split('.');
        if (tokenParts.length === 3) {
          const tokenPayload = tokenParts; 
          const base64 = tokenPayload.replace(/-/g, '+').replace(/_/g, '/');
          const pad = base64.length % 4;
          const paddedBase64 = pad ? base64 + new Array(5 - pad).join('=') : base64;
          
          const decodedData = JSON.parse(decodeURIComponent(escape(window.atob(paddedBase64))));
          const userRole = (decodedData.role as "admin" | "student") || "student";
          onLogin(userRole, "msal", decodedData);
          return;
        }
      } catch (error) {
        localStorage.removeItem('campus_token');
        onLogin("student", "msal");
      }
      return;
    }

    // Xử lý đăng nhập sau khi redirect từ Microsoft về
    if (isLoggingIn === 'true') {
      const processLogin = async () => {
        setIsProcessing(true);
        try {
          const account = accounts[0];
          const userEmail = account.username || "";

          const response = await instance.acquireTokenSilent({
            ...loginRequest,
            account: account
          });

          const backendRes = await fetch('/api/auth/ms-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                token: response.accessToken, 
                email: userEmail,
                name: account?.name
            })
          });

          const resData = await backendRes.json();
          if (!backendRes.ok) {
            setError(resData.message || "Đăng nhập thất bại.");
            sessionStorage.removeItem('campus_is_logging_in');
            await instance.logoutRedirect({ account: account, postLogoutRedirectUri: window.location.origin });
            return;
          }

          localStorage.setItem('campus_token', resData.token);
          sessionStorage.removeItem('campus_is_logging_in'); 

          const finalRole = resData.role as "admin" | "student";
          onLogin(finalRole, "msal", resData.data);

        } catch (err: any) {
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
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background photo */}
      <img src={bgImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
      {/* Dark overlay */}
      <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(10,22,40,0.55) 0%, rgba(10,22,40,0.72) 100%)" }} />

      <div className="relative z-10 w-full max-w-sm mx-4">
        {/* Card */}
        <div className="rounded-2xl shadow-2xl overflow-hidden">

          {/* ── Top: Navy branding ── */}
          <div className="px-8 pt-8 pb-7 text-center" style={{ background: "linear-gradient(135deg,#11284D 0%,#264B6F 100%)" }}>
            <div className="w-16 h-16 rounded-full bg-white/15 border border-white/25 flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl font-bold text-white" style={PJS}>C</span>
            </div>
            <h1 className="text-xl font-bold text-white" style={PJS}>CampUS</h1>
            <p className="text-white/55 text-xs mt-1">Trường ĐH Khoa học Tự nhiên — ĐHQG HCM</p>
          </div>

          {/* ── Bottom: White, image-3 style ── */}
          <div className="bg-white pt-7 pb-3 flex flex-col items-center">
            <h2 className="font-bold mb-6 text-center text-[15px]" style={{ ...PJS, color: "var(--primary)" }}>ĐĂNG NHẬP</h2>

            {/* Thông báo lỗi */}
            {error && (
              <div className="w-10/12 bg-red-50 text-red-500 text-xs px-3 py-2 mb-4 rounded border border-red-100 text-center leading-relaxed">
                {error}
              </div>
            )}

            {/* Microsoft button */}
            <button
              onClick={handleMsLogin}
              disabled={isLoading}
              className="inline-flex items-center gap-3 px-4 py-3 rounded border border-[#BFBB9A] hover:border-[#11284D] hover:bg-[#F4EFDF]/60 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {/* Windows logo */}
              <svg width="20" height="20" viewBox="0 0 21 21" fill="none" className="flex-shrink-0">
                <rect x="1"  y="1"  width="9" height="9" fill="#F25022"/>
                <rect x="11" y="1"  width="9" height="9" fill="#7FBA00"/>
                <rect x="1"  y="11" width="9" height="9" fill="#00A4EF"/>
                <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
              </svg>
              <span className="text-sm font-semibold group-hover:text-[#11284D] transition-colors" style={{ fontFamily: "'Inter', sans-serif", color: "var(--foreground)" }}>
                {isLoading ? "Đang xử lý..." : "Đăng nhập với Microsoft"}
              </span>
            </button>

            {/* Note */}
            <p className="text-center text-[11px] mt-8 leading-relaxed" style={{ color: "var(--muted-foreground)", fontFamily: "'Inter', sans-serif" }}>
              Vui lòng sử dụng email chính thức nhà trường đã cung cấp
              <br />
              <span style={{ color: "var(--primary)" }}>(@student.hcmus.edu.vn / @hcmus.edu.vn)</span>
            </p>

            {/* Footer inside white section */}
            <p className="text-center text-[10px] mt-5" style={{ color: "var(--muted-foreground)", fontFamily: "'Inter', sans-serif" }}>©GROUP 3 - AMONG US · HCMUS</p>
          </div>
        </div>
      </div>
    </div>
  );
}