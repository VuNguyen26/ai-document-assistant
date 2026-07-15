"use client";

import Link from "next/link";
import {
  getAuthUserDisplayName,
  getAuthUserIdentifier,
  getAuthUserInitial,
  getAuthUserRoleLabel,
} from "@/features/auth/utils/auth-user-display";
import { getAuthUser } from "@/lib/auth/token-storage";

export default function ProfilePage() {
  const user = getAuthUser();
  const userDisplayName = getAuthUserDisplayName(user);
  const userIdentifier = getAuthUserIdentifier(user);
  const userInitial = getAuthUserInitial(user);
  const roleLabel = getAuthUserRoleLabel(user);

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-8 p-6 sm:p-8 xl:grid-cols-[1.05fr_0.95fr] xl:p-10">
          <div>
            <Link
              href="/dashboard"
              className="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
            >
              ← Quay lại tổng quan
            </Link>

            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-indigo-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Tài khoản
            </div>

            <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              Hồ sơ
            </h1>

            <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
              Xem thông tin phiên hiện tại và quyền truy cập trong hệ thống
              Document AI Assistant.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-indigo-600 text-2xl font-semibold uppercase text-white shadow-sm shadow-indigo-600/20">
                {userInitial}
              </div>

              <div className="min-w-0">
                <p className="truncate text-lg font-semibold tracking-tight text-slate-950">
                  {userDisplayName}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  {user?.isGuest
                    ? "Phiên khách riêng tư"
                    : "Tài khoản đang đăng nhập"}
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                {roleLabel}
              </span>

              <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                Phiên đang hoạt động
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[390px_minmax(0,1fr)]">
        <aside className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-500">
            Tóm tắt
          </p>

          <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
            Tổng quan tài khoản
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Thông tin cơ bản của phiên hiện tại được lưu riêng trên trình duyệt
            này.
          </p>

          <div className="mt-6 space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Danh tính
              </p>
              <p className="mt-1 truncate text-sm font-semibold text-slate-900">
                {userIdentifier}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Vai trò
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {roleLabel}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Nguồn phiên đăng nhập
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {user?.isGuest
                  ? "Phiên khách trên trình duyệt này"
                  : "Bộ nhớ xác thực cục bộ"}
              </p>
            </div>
          </div>
        </aside>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-500">
                Quyền truy cập
              </p>

              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                Chức năng khả dụng
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Phiên này có thể quản lý tài liệu, phiên chat và các đầu ra AI
                đã tạo.
              </p>
            </div>

            <Link
              href="/settings"
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
            >
              Mở cài đặt
            </Link>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {[
              {
                title: "Tài liệu",
                description: "Tải lên và quản lý tệp để xử lý.",
                href: "/documents",
              },
              {
                title: "Chat",
                description: "Đặt câu hỏi với trích dẫn có căn cứ.",
                href: "/documents",
              },
              {
                title: "Tóm tắt",
                description: "Tạo bản tóm tắt có thể tái sử dụng từ tài liệu.",
                href: "/summaries",
              },
              {
                title: "Dịch thuật",
                description: "Dịch nội dung đã tạo hoặc đã trích xuất.",
                href: "/translations",
              },
            ].map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
              >
                <div className="mb-5 h-1.5 w-10 rounded-full bg-indigo-500 transition group-hover:w-14" />

                <h3 className="text-lg font-semibold tracking-tight text-slate-950">
                  {item.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {item.description}
                </p>

                <p className="mt-5 text-sm font-semibold text-slate-400 transition group-hover:text-indigo-600">
                  Mở chức năng →
                </p>
              </Link>
            ))}
          </div>
        </section>
      </section>
    </div>
  );
}
