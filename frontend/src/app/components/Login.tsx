import { useState } from 'react';
import { useMsal } from "@azure/msal-react";
import { loginRequest } from '../authConfig';
import { Button } from './ui/button';
import { Alert } from './ui/alert';
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

export default function Login() {
    const { instance } = useMsal();
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Bước 4 & 5: Gọi popup Microsoft để user đăng nhập [source: 2]
            const response = await instance.loginPopup(loginRequest);
            const userEmail = response.account?.username || "";

            // Xử lý nhánh Alternative Flow 1 ngay tại frontend để tối ưu [source: 2]
            if (!userEmail.endsWith("@student.hcmus.edu.vn")) {
                setError("Hệ thống chỉ hỗ trợ đăng nhập bằng email sinh viên (@student.hcmus.edu.vn). Vui lòng thử lại.");
                await instance.logoutPopup(); // Force logout tk sai
                setIsLoading(false);
                return;
            }

            // Bước 6: Gửi token xuống Backend
            const backendRes = await fetch('http://localhost:5000/api/auth/ms-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: response.accessToken })
            });

            const data = await backendRes.json();

            if (!backendRes.ok) {
                setError(data.error || "Đăng nhập thất bại. Vui lòng cấp quyền truy cập hoặc thử lại."); // [source: 2]
                setIsLoading(false);
                return;
            }

            // Lưu token JWT của backend và chuyển hướng
            localStorage.setItem('campus_token', data.token);
            window.location.href = '/dashboard';

        } catch (err) {
            // Xử lý nhánh Alternative Flow 2 (từ chối quyền hoặc lỗi popup) [source: 2]
            setError("Đăng nhập thất bại. Vui lòng cấp quyền truy cập hoặc thử lại.");
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
            <div className="p-8 bg-white shadow-lg rounded-xl max-w-md w-full text-center">
                <h1 className="text-3xl font-bold mb-2 text-primary">CampUS</h1>
                <p className="text-gray-500 mb-8">Nền tảng quản lý học tập thông minh</p>
                
                {error && (
                    <Alert variant="destructive" className="mb-6 text-left">
                        {error}
                    </Alert>
                )}

                <Button 
                    onClick={handleLogin} 
                    className="w-full h-12 text-md mb-6"
                    disabled={isLoading}
                >
                    {isLoading ? "Đang kết nối..." : "Đăng nhập với tài khoản sinh viên"}
                </Button>
                
                {/* Use-case 2.2: Forgot Password Dialog [source: 2] */}
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <button className="text-sm text-blue-600 hover:underline">
                            Quên mật khẩu?
                        </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Quên mật khẩu?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Mật khẩu của bạn được quản lý bởi hệ thống Microsoft Workspace của trường. Bạn sẽ được chuyển hướng đến cổng hỗ trợ của nhà trường để khôi phục.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Hủy</AlertDialogCancel>
                            <AlertDialogAction onClick={() => window.open('https://myaccount.microsoft.com/security-info', '_blank')}>
                                Đến trang Khôi phục
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    );
}