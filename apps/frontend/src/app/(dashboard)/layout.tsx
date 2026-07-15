"use client";

import Link from "next/link";
import { ensureAuthSession, logout } from "@/features/auth/api/auth.api";
import {
  getAuthUserDisplayName,
  getAuthUserIdentifier,
  getAuthUserInitial,
  getAuthUserRoleLabel,
} from "@/features/auth/utils/auth-user-display";
import type { StoredAuthUser } from "@/lib/auth/token-storage";
import { usePathname } from "next/navigation";
import { ReactNode, useCallback, useEffect, useState } from "react";

type DashboardLayoutProps = {
  children: ReactNode;
};

type NavIconName =
  | "overview"
  | "documents"
  | "workspaces"
  | "summaries"
  | "translations"
  | "profile"
  | "settings"
  | "menu"
  | "close"
  | "refresh";

type NavItem = {
  href: string;
  label: string;
  description: string;
  icon: NavIconName;
};

const PRIMARY_NAV: NavItem[] = [
  {
    href: "/dashboard",
    label: "Tổng quan",
    description: "Tình hình không gian làm việc",
    icon: "overview",
  },
  {
    href: "/documents",
    label: "Tài liệu",
    description: "Tải lên và quản lý tệp",
    icon: "documents",
  },
  {
    href: "/workspaces",
    label: "Không gian làm việc",
    description: "Nhóm tài liệu theo ngữ cảnh",
    icon: "workspaces",
  },
  {
    href: "/summaries",
    label: "Tóm tắt",
    description: "Tạo và quản lý bản tóm tắt",
    icon: "summaries",
  },
  {
    href: "/translations",
    label: "Dịch thuật",
    description: "Dịch nội dung tài liệu",
    icon: "translations",
  },
];

const SECONDARY_NAV: NavItem[] = [
  {
    href: "/profile",
    label: "Hồ sơ",
    description: "Thông tin phiên hiện tại",
    icon: "profile",
  },
  {
    href: "/settings",
    label: "Cài đặt",
    description: "Tùy chỉnh không gian làm việc",
    icon: "settings",
  },
];

const ALL_NAV_ITEMS = [...PRIMARY_NAV, ...SECONDARY_NAV];

const ICON_PATHS: Record<NavIconName, string[]> = {
  overview: [
    "M4 13h6V4H4v9Z",
    "M14 20h6V11h-6v9Z",
    "M14 4h6v3h-6V4Z",
    "M4 17h6v3H4v-3Z",
  ],
  documents: ["M7 3h7l4 4v14H7V3Z", "M14 3v5h5", "M10 13h5", "M10 17h5"],
  workspaces: ["M3 7h7l2 2h9v10H3V7Z", "M3 7V5h7l2 2"],
  summaries: ["M5 4h14v16H5V4Z", "M8 8h8", "M8 12h8", "M8 16h5"],
  translations: [
    "M4 5h8",
    "M8 3v2c0 4-2 7-5 9",
    "M5 9c1 2 3 4 6 5",
    "m14 6-4 9",
    "m15 15 4-9 4 9",
    "M16.5 12h5",
  ],
  profile: ["M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z", "M4 21a8 8 0 0 1 16 0"],
  settings: [
    "M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z",
    "M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2 3.46-.08-.02a1.7 1.7 0 0 0-1.78.26l-.5.29a1.7 1.7 0 0 0-.88 1.58V22h-4v-.09a1.7 1.7 0 0 0-.88-1.58l-.5-.29a1.7 1.7 0 0 0-1.78-.26l-.08.02-2-3.46.06-.06A1.7 1.7 0 0 0 4.6 15v-.58a1.7 1.7 0 0 0-.9-1.52l-.08-.04v-4l.08-.04a1.7 1.7 0 0 0 .9-1.52v-.58a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2-3.46.08.02a1.7 1.7 0 0 0 1.78-.26l.5-.29A1.7 1.7 0 0 0 10.56 1H14v.09a1.7 1.7 0 0 0 .88 1.58l.5.29a1.7 1.7 0 0 0 1.78.26l.08-.02 2 3.46-.06.06a1.7 1.7 0 0 0-.34 1.88v.58a1.7 1.7 0 0 0 .9 1.52l.08.04v4l-.08.04a1.7 1.7 0 0 0-.9 1.52V15Z",
  ],
  menu: ["M4 7h16", "M4 12h16", "M4 17h16"],
  close: ["m6 6 12 12", "M18 6 6 18"],
  refresh: [
    "M20 6v5h-5",
    "M4 18v-5h5",
    "M18.5 9A7 7 0 0 0 6 6.5L4 9",
    "M5.5 15A7 7 0 0 0 18 17.5l2-2.5",
  ],
};

function NavIcon({
  name,
  className = "h-5 w-5",
}: {
  name: NavIconName;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {ICON_PATHS[name].map((path, index) => (
        <path key={name + "-" + index} d={path} />
      ))}
    </svg>
  );
}

function isActiveRoute(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(href + "/");
}

function NavigationGroup({
  label,
  items,
  pathname,
  onNavigate,
}: {
  label: string;
  items: NavItem[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <div>
      <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600">
        {label}
      </p>

      <nav className="mt-2 space-y-1">
        {items.map((item) => {
          const active = isActiveRoute(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={
                "group relative flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm transition " +
                (active
                  ? "bg-white/[0.09] font-semibold text-white ring-1 ring-white/[0.07]"
                  : "font-medium text-slate-400 hover:bg-white/[0.045] hover:text-slate-100")
              }
            >
              <span
                className={
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition " +
                  (active
                    ? "border-indigo-400/25 bg-indigo-400/15 text-indigo-300"
                    : "border-white/[0.06] bg-white/[0.025] text-slate-500 group-hover:border-white/[0.1] group-hover:text-slate-300")
                }
              >
                <NavIcon name={item.icon} className="h-[17px] w-[17px]" />
              </span>

              <span className="truncate">{item.label}</span>

              {active ? (
                <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-indigo-400" />
              ) : null}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function getCurrentPage(pathname: string) {
  return (
    ALL_NAV_ITEMS.find((item) => isActiveRoute(pathname, item.href)) ?? {
      label: "Không gian làm việc",
      description: "Quản lý quy trình tài liệu AI",
    }
  );
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();

  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<StoredAuthUser | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const bootstrapSession = useCallback(async () => {
    try {
      const authUser = await ensureAuthSession();

      setUser(authUser);
      setAuthError(null);
    } catch (error) {
      setUser(null);
      setAuthError(
        error instanceof Error
          ? error.message
          : "Không thể bắt đầu phiên làm việc",
      );
    } finally {
      setMounted(true);
    }
  }, []);

  useEffect(() => {
    void bootstrapSession();
  }, [bootstrapSession]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileMenuOpen]);

  async function handleLogout() {
    setMounted(false);
    setUser(null);
    setAuthError(null);
    setMobileMenuOpen(false);

    await logout();
    await bootstrapSession();
  }

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080d1a] px-5">
        <div className="flex items-center gap-3 text-sm font-medium text-slate-400">
          <span className="h-2 w-2 animate-pulse rounded-full bg-indigo-400 shadow-[0_0_18px_rgba(129,140,248,0.8)]" />
          Đang khởi tạo không gian làm việc
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080d1a] px-5">
        <div className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-white/[0.045] p-7 text-center shadow-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-300">
            Không thể kết nối
          </p>
          <h1 className="mt-3 text-xl font-semibold tracking-[-0.025em] text-white">
            Phiên làm việc chưa sẵn sàng
          </h1>
          <p className="mt-3 text-sm leading-7 text-slate-400">{authError}</p>
          <button
            type="button"
            onClick={() => {
              setMounted(false);
              void bootstrapSession();
            }}
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-5 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const currentPage = getCurrentPage(pathname);
  const userDisplayName = getAuthUserDisplayName(user);
  const userIdentifier = getAuthUserIdentifier(user);
  const userInitial = getAuthUserInitial(user);
  const roleLabel = getAuthUserRoleLabel(user);
  const sessionActionLabel = user.isGuest ? "Bắt đầu phiên mới" : "Đăng xuất";

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-[276px] shrink-0 flex-col border-r border-white/[0.06] bg-[#0a1020] lg:sticky lg:top-0 lg:flex lg:h-screen">
          <div className="px-5 pb-5 pt-6">
            <Link href="/dashboard" className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[13px] font-bold text-slate-950 shadow-lg shadow-black/25">
                AI
              </span>

              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold tracking-[-0.02em] text-white">
                  Document Assistant
                </span>
                <span className="mt-0.5 block text-[11px] text-slate-500">
                  Không gian tri thức AI
                </span>
              </span>
            </Link>
          </div>

          <div className="h-px bg-white/[0.06]" />

          <div className="flex-1 space-y-7 overflow-y-auto px-3 py-6">
            <NavigationGroup
              label="Công việc"
              items={PRIMARY_NAV}
              pathname={pathname}
            />

            <NavigationGroup
              label="Hệ thống"
              items={SECONDARY_NAV}
              pathname={pathname}
            />
          </div>

          <div className="border-t border-white/[0.06] p-4">
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.035] p-3.5">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-400/15 text-xs font-semibold uppercase text-indigo-300 ring-1 ring-indigo-400/20">
                  {userInitial}
                </span>

                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-slate-100">
                    {userDisplayName}
                  </span>
                  <span className="mt-0.5 block truncate text-[11px] text-slate-500">
                    {userIdentifier}
                  </span>
                </span>
              </div>

              <button
                type="button"
                onClick={() => void handleLogout()}
                className="mt-3 flex min-h-9 w-full items-center justify-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 text-xs font-medium text-slate-400 transition hover:border-white/[0.12] hover:bg-white/[0.06] hover:text-white"
              >
                <NavIcon name="refresh" className="h-4 w-4" />
                {sessionActionLabel}
              </button>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
            <div className="mx-auto flex min-h-[78px] max-w-[1500px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 xl:px-10">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(true)}
                  aria-label="Mở menu điều hướng"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-950 lg:hidden"
                >
                  <NavIcon name="menu" className="h-5 w-5" />
                </button>

                <div className="min-w-0">
                  <p className="truncate text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-500">
                    {currentPage.description}
                  </p>
                  <h1 className="mt-1 truncate text-xl font-semibold tracking-[-0.035em] text-slate-950 sm:text-[23px]">
                    {currentPage.label}
                  </h1>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <div className="hidden text-right sm:block">
                  <p className="max-w-48 truncate text-sm font-medium text-slate-800">
                    {userDisplayName}
                  </p>
                  <p className="mt-0.5 text-[11px] font-medium text-slate-400">
                    {roleLabel}
                  </p>
                </div>

                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#10182d] text-xs font-semibold uppercase text-white shadow-lg shadow-slate-900/15">
                  {userInitial}
                </span>
              </div>
            </div>
          </header>

          <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 xl:px-10">
            {children}
          </main>
        </div>
      </div>

      {mobileMenuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Đóng menu"
            onClick={() => setMobileMenuOpen(false)}
            className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
          />

          <aside className="relative flex h-full w-[min(86vw,320px)] flex-col border-r border-white/[0.07] bg-[#0a1020] shadow-2xl">
            <div className="flex items-center justify-between px-5 py-5">
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-xs font-bold text-slate-950">
                  AI
                </span>
                <span className="text-sm font-semibold text-white">
                  Document Assistant
                </span>
              </Link>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Đóng menu"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] text-slate-400 transition hover:bg-white/[0.06] hover:text-white"
              >
                <NavIcon name="close" className="h-5 w-5" />
              </button>
            </div>

            <div className="h-px bg-white/[0.06]" />

            <div className="flex-1 space-y-7 overflow-y-auto px-3 py-6">
              <NavigationGroup
                label="Công việc"
                items={PRIMARY_NAV}
                pathname={pathname}
                onNavigate={() => setMobileMenuOpen(false)}
              />

              <NavigationGroup
                label="Hệ thống"
                items={SECONDARY_NAV}
                pathname={pathname}
                onNavigate={() => setMobileMenuOpen(false)}
              />
            </div>

            <div className="border-t border-white/[0.06] p-4">
              <div className="flex items-center gap-3 px-1">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-400/15 text-xs font-semibold text-indigo-300">
                  {userInitial}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-white">
                    {userDisplayName}
                  </span>
                  <span className="block truncate text-[11px] text-slate-500">
                    {userIdentifier}
                  </span>
                </span>
              </div>

              <button
                type="button"
                onClick={() => void handleLogout()}
                className="mt-4 flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.035] text-xs font-medium text-slate-300 transition hover:bg-white/[0.07] hover:text-white"
              >
                <NavIcon name="refresh" className="h-4 w-4" />
                {sessionActionLabel}
              </button>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
