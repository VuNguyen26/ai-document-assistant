"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { clearAuthSession, getAuthUser } from "@/lib/auth/token-storage";

type DashboardLayoutProps = {
  children: ReactNode;
};

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "🏠" },
  { href: "/documents", label: "Documents", icon: "📄" },
  { href: "/workspaces", label: "Workspaces", icon: "🗂️" },
  { href: "/summaries", label: "Summaries", icon: "📝" },
  { href: "/translations", label: "Translations", icon: "🌐" },
  { href: "/profile", label: "Profile", icon: "👤" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const user = useMemo(() => getAuthUser(), []);

  useEffect(() => {
    setMounted(true);

    if (!getAuthUser()) {
      router.replace("/login");
    }
  }, [router]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  function handleLogout() {
    clearAuthSession();
    router.replace("/login");
  }

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">
        Đang tải...
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col">
          <div className="border-b border-slate-200 px-6 py-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              AI Document Assistant
            </p>
            <h1 className="mt-3 text-xl font-bold text-slate-950">
              Control Panel
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Quản lý tài liệu và workflow AI của anh.
            </p>
          </div>

          <nav className="flex-1 space-y-2 px-4 py-5">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    active
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-slate-200 px-4 py-4">
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <span>↩</span>
              <span>Đăng xuất</span>
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/85 backdrop-blur">
            <div className="flex items-center justify-between px-4 py-4 sm:px-6">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen((prev) => !prev)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 lg:hidden"
                >
                  ☰
                </button>

                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    Workspace
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-700">
                    {user.email}
                  </p>
                </div>
              </div>

              <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700">
                {user.role}
              </div>
            </div>

            {mobileMenuOpen ? (
              <div className="border-t border-slate-200 bg-white px-4 py-4 lg:hidden">
                <nav className="space-y-2">
                  {NAV_ITEMS.map((item) => {
                    const active = pathname === item.href;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                          active
                            ? "bg-slate-900 text-white"
                            : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        <span>{item.icon}</span>
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-left text-sm font-medium text-slate-700"
                  >
                    <span>↩</span>
                    <span>Đăng xuất</span>
                  </button>
                </nav>
              </div>
            ) : null}
          </header>

          {children}
        </main>
      </div>
    </div>
  );
}