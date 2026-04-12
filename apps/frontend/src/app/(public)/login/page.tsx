import { Suspense } from "react";
import LoginPageClient from "../../../features/auth/components/LoginPageClient";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
            Đang tải trang đăng nhập...
          </div>
        </div>
      }
    >
      <LoginPageClient />
    </Suspense>
  );
}