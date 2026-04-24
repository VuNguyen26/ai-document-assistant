"use client";

import { getAccessToken } from "@/lib/auth/token-storage";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { login } from "../api/auth.api";

const DEMO_EMAIL = "test@example.com";
const DEMO_PASSWORD = "12345678";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState(DEMO_EMAIL);
  const [password, setPassword] = useState(DEMO_PASSWORD);
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
      <div className="w-full max-w-[420px] rounded-[28px] border border-white/10 bg-white/[0.08] p-6 shadow-2xl backdrop-blur-xl">
        <div className="rounded-2xl border border-white/10 bg-white/90 px-4 py-3 text-sm text-slate-600">
          Đang kiểm tra phiên đăng nhập...
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[420px]">
      <div className="rounded-[30px] border border-white/10 bg-white/[0.09] p-1 shadow-[0_28px_90px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
        <div className="rounded-[26px] border border-white/10 bg-[#f8fafc]/95 p-7 text-slate-950 shadow-inner sm:p-8">
          <div className="mb-7">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-sm font-bold text-white shadow-lg shadow-slate-950/20">
                AI
              </div>

              <div className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500 shadow-sm">
                Production
              </div>
            </div>

            <p className="text-sm font-medium text-slate-500">Welcome back</p>

            <h1 className="mt-2 text-[30px] font-semibold leading-tight tracking-[-0.04em] text-slate-950">
              Đăng nhập
            </h1>

            <p className="mt-3 max-w-sm text-sm leading-6 text-slate-500">
              Truy cập workspace để quản lý tài liệu, chat RAG, tóm tắt và dịch
              nội dung.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Email
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Mật khẩu
              </label>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu"
                autoComplete="current-password"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5"
              />
            </div>

            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-slate-950 px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-lg disabled:cursor-not-allowed disabled:translate-y-0 disabled:bg-slate-300 disabled:shadow-none"
            >
              {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
          </form>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Demo account
                </p>

                <div className="mt-2 space-y-1 text-sm text-slate-600">
                  <p>
                    <span className="font-semibold text-slate-800">Email:</span>{" "}
                    {DEMO_EMAIL}
                  </p>

                  <p>
                    <span className="font-semibold text-slate-800">
                      Password:
                    </span>{" "}
                    {DEMO_PASSWORD}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEmail(DEMO_EMAIL);
                  setPassword(DEMO_PASSWORD);
                  setError("");
                }}
                className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-white hover:text-slate-950"
              >
                Điền
              </button>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-slate-500">
        Railway backend · Vercel frontend
      </p>
    </div>
  );
}