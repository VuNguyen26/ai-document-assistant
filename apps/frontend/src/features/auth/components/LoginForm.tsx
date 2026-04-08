"use client";

import { getAccessToken } from "@/lib/auth/token-storage";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { login } from "../api/auth.api";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("test@example.com");
  const [password, setPassword] = useState("123456");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingExistingAuth, setIsCheckingExistingAuth] = useState(true);

  const redirectTo = searchParams.get("redirect") || "/documents";

  useEffect(() => {
    const token = getAccessToken();

    if (token) {
      router.replace(redirectTo);
      return;
    }

    setIsCheckingExistingAuth(false);
  }, [router, redirectTo]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Vui lòng nhập đầy đủ email và mật khẩu.");
      return;
    }

    try {
      setIsSubmitting(true);

      await login({
        email: email.trim(),
        password,
      });

      toast.success("Đăng nhập thành công.");
      router.replace(redirectTo);
      router.refresh();
    } catch (err) {
      const message = (err as Error).message || "Đăng nhập thất bại";
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isCheckingExistingAuth) {
    return (
      <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-white/90 p-8 shadow-2xl backdrop-blur">
        <div className="flex items-center justify-center py-10">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Đang kiểm tra đăng nhập...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-white/95 p-8 shadow-2xl backdrop-blur">
      <div className="mb-8">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-lg font-bold text-white shadow-sm">
          AI
        </div>

        <p className="text-sm font-medium text-slate-500">
          Welcome back
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
          Đăng nhập vào hệ thống
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          Tiếp tục với AI Document Assistant để quản lý tài liệu và chat grounded
          bằng AI.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Nhập email"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition focus:border-slate-400"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Mật khẩu
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Nhập mật khẩu"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition focus:border-slate-400"
          />
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-2xl bg-slate-900 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>
      </form>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
          Demo credentials
        </p>
        <div className="mt-3 grid gap-2 text-sm text-slate-600">
          <p>
            <span className="font-semibold text-slate-800">Email:</span>{" "}
            test@example.com
          </p>
          <p>
            <span className="font-semibold text-slate-800">Password:</span>{" "}
            123456
          </p>
        </div>
      </div>
    </div>
  );
}