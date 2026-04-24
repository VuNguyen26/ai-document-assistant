"use client";

import Link from "next/link";
import { getAuthUser } from "@/lib/auth/token-storage";

function getInitial(email?: string) {
  return email?.charAt(0).toUpperCase() || "U";
}

export default function ProfilePage() {
  const user = getAuthUser();

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-8 p-6 sm:p-8 xl:grid-cols-[1.05fr_0.95fr] xl:p-10">
          <div>
            <Link
              href="/dashboard"
              className="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
            >
              ← Back to dashboard
            </Link>

            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-indigo-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Account
            </div>

            <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              Profile
            </h1>

            <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
              Review the signed-in account used for this document assistant
              workspace.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-indigo-600 text-2xl font-semibold uppercase text-white shadow-sm shadow-indigo-600/20">
                {getInitial(user?.email)}
              </div>

              <div className="min-w-0">
                <p className="truncate text-lg font-semibold tracking-tight text-slate-950">
                  {user?.email || "Unknown user"}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Signed in account
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                {user?.role || "USER"}
              </span>

              <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                Active session
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[390px_minmax(0,1fr)]">
        <aside className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-500">
            Summary
          </p>

          <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
            Account overview
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Basic account information stored in the current authenticated
            session.
          </p>

          <div className="mt-6 space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Email
              </p>
              <p className="mt-1 truncate text-sm font-semibold text-slate-900">
                {user?.email || "—"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Role
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {user?.role || "—"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Session source
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                Local auth storage
              </p>
            </div>
          </div>
        </aside>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-500">
                Workspace access
              </p>

              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                Available modules
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Use the account to manage documents, chat sessions and generated
                AI outputs.
              </p>
            </div>

            <Link
              href="/settings"
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
            >
              Open settings
            </Link>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {[
              {
                title: "Documents",
                description: "Upload and manage files for processing.",
                href: "/documents",
              },
              {
                title: "Chat",
                description: "Ask questions with grounded citations.",
                href: "/documents",
              },
              {
                title: "Summaries",
                description: "Create reusable summaries from documents.",
                href: "/summaries",
              },
              {
                title: "Translations",
                description: "Translate generated or extracted content.",
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
                  Open module →
                </p>
              </Link>
            ))}
          </div>
        </section>
      </section>
    </div>
  );
}