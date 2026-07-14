"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { clearAuthSession, getAuthUser } from "@/lib/auth/token-storage";

type DashboardLayoutProps = {
  children: ReactNode;
};

const NAV_ITEMS = [
  {
    href: "/dashboard",
    label: "Tổng quan",
    description: "Bảng điều khiển",
    icon: "🏠",
  },
  {
    href: "/documents",
    label: "Tài liệu",
    description: "Tải lên và quản lý tệp",
    icon: "📄",
  },
  {
    href: "/workspaces",
    label: "Không gian làm việc",
    description: "Nhóm tài liệu",
    icon: "🗂️",
  },
  {
    href: "/summaries",
    label: "Tóm tắt",
    description: "Tóm tắt tài liệu bằng AI",
    icon: "📝",
  },
  {
    href: "/translations",
    label: "Dịch thuật",
    description: "Dịch nội dung",
    icon: "🌐",
  },
  {
    href: "/profile",
    label: "Hồ sơ",
    description: "Thông tin tài khoản",
    icon: "👤",
  },
  {
    href: "/settings",
    label: "Cài đặt",
    description: "Tùy chỉnh hệ thống",
    icon: "⚙️",
  },
];

function getPageTitle(pathname: string) {
  const activeItem = NAV_ITEMS.find((item) => {
    if (item.href === "/dashboard") {
      return pathname === item.href;
    }

    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  });

  return activeItem?.label ?? "Tổng quan";
}

function getPageDescription(pathname: string) {
  const activeItem = NAV_ITEMS.find((item) => {
    if (item.href === "/dashboard") {
      return pathname === item.href;
    }

    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  });

  return activeItem?.description ?? "Quản lý quy trình tài liệu AI";
}

function getRoleLabel(role?: string | null) {
  switch (role?.toUpperCase()) {
    case "ADMIN":
      return "Quản trị viên";
    case "USER":
      return "Người dùng";
    default:
      return role ?? "Người dùng";
  }
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<ReturnType<typeof getAuthUser> | null>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const authUser = getAuthUser();

      if (!authUser) {
        router.replace("/login");
        return;
      }

      setUser(authUser);
      setMounted(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [router]);

  function handleLogout() {
    clearAuthSession();
    router.replace("/login");
  }

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-sm text-slate-300">
        <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-5 shadow-2xl backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="h-3 w-3 animate-pulse rounded-full bg-blue-400" />
            <span>Đang tải không gian làm việc...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const pageTitle = getPageTitle(pathname);
  const pageDescription = getPageDescription(pathname);
  const roleLabel = getRoleLabel(user.role);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-80 shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col">
          <div className="border-b border-slate-200 px-6 py-6">
            <Link href="/dashboard" className="group block">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-xl text-white shadow-lg shadow-slate-900/20 transition group-hover:scale-105">
                  AI
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">
                    Document AI
                  </p>
                  <h1 className="mt-1 text-lg font-black tracking-tight text-slate-950">
                    Bảng điều khiển AI
                  </h1>
                </div>
              </div>

              <p className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
                Quản lý tài liệu, chat RAG, tóm tắt, dịch và tạo audio bằng AI.
              </p>
            </Link>
          </div>

          <nav className="flex-1 space-y-1.5 overflow-y-auto px-4 py-5">
            {NAV_ITEMS.map((item) => {
              const active =
                item.href === "/dashboard"
                  ? pathname === item.href
                  : pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center gap-3 rounded-2xl px-4 py-3 transition ${
                    active
                      ? "bg-slate-950 text-white shadow-lg shadow-slate-900/15"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                  }`}
                >
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg transition ${
                      active
                        ? "bg-white/15"
                        : "bg-slate-100 group-hover:bg-white"
                    }`}
                  >
                    {item.icon}
                  </span>

                  <span className="min-w-0">
                    <span className="block text-sm font-bold">
                      {item.label}
                    </span>
                    <span
                      className={`mt-0.5 block truncate text-xs ${
                        active ? "text-slate-300" : "text-slate-400"
                      }`}
                    >
                      {item.description}
                    </span>
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-slate-200 p-4">
            <div className="mb-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Đang đăng nhập
              </p>
              <p className="mt-2 truncate text-sm font-bold text-slate-900">
                {user.email}
              </p>
              <p className="mt-1 inline-flex rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                {roleLabel}
              </p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            >
              <span>↩</span>
              <span>Đăng xuất</span>
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen((prev) => !prev)}
                  aria-label="Mở menu điều hướng"
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-xl text-slate-700 transition hover:bg-slate-100 lg:hidden"
                >
                  {mobileMenuOpen ? "×" : "☰"}
                </button>

                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                    {pageDescription}
                  </p>
                  <h2 className="mt-1 truncate text-xl font-black tracking-tight text-slate-950 sm:text-2xl">
                    {pageTitle}
                  </h2>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <div className="hidden text-right sm:block">
                  <p className="truncate text-sm font-bold text-slate-900">
                    {user.email}
                  </p>
                  <p className="text-xs font-medium text-slate-400">
                    {roleLabel}
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-sm font-black uppercase text-white shadow-lg shadow-slate-900/20">
                  {user.email?.charAt(0) ?? "U"}
                </div>
              </div>
            </div>

            {mobileMenuOpen ? (
              <div className="border-t border-slate-200 bg-white px-4 py-4 shadow-xl lg:hidden">
                <nav className="space-y-2">
                  {NAV_ITEMS.map((item) => {
                    const active =
                      item.href === "/dashboard"
                        ? pathname === item.href
                        : pathname === item.href ||
                          pathname.startsWith(`${item.href}/`);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 rounded-2xl px-4 py-3 transition ${
                          active
                            ? "bg-slate-950 text-white"
                            : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-lg">
                          {item.icon}
                        </span>

                        <span>
                          <span className="block text-sm font-bold">
                            {item.label}
                          </span>
                          <span
                            className={`mt-0.5 block text-xs ${
                              active ? "text-slate-300" : "text-slate-400"
                            }`}
                          >
                            {item.description}
                          </span>
                        </span>
                      </Link>
                    );
                  })}

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-left text-sm font-bold text-red-600"
                  >
                    <span>↩</span>
                    <span>Đăng xuất</span>
                  </button>
                </nav>
              </div>
            ) : null}
          </header>

          <div className="px-4 py-6 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}