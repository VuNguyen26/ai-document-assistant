"use client";

import Link from "next/link";

const SETTINGS_GROUPS = [
  {
    title: "Interface",
    description: "Display preferences for the dashboard experience.",
    items: [
      {
        label: "Theme",
        value: "Light",
        note: "Dark mode can be added later.",
      },
      {
        label: "Accent color",
        value: "Indigo",
        note: "Used across buttons, badges and focus states.",
      },
      {
        label: "Density",
        value: "Comfortable",
        note: "Balanced spacing for document-heavy workflows.",
      },
    ],
  },
  {
    title: "AI workflow",
    description: "Default behavior for document processing and generated output.",
    items: [
      {
        label: "Chat mode",
        value: "Grounded",
        note: "Answers should use processed document chunks.",
      },
      {
        label: "Citations",
        value: "Enabled",
        note: "Show sources when relevant chunks are available.",
      },
      {
        label: "Output language",
        value: "Auto",
        note: "Can be customized per summary or translation request.",
      },
    ],
  },
  {
    title: "Account",
    description: "Session and access related preferences.",
    items: [
      {
        label: "Authentication",
        value: "JWT",
        note: "Access token and refresh token are handled by the app.",
      },
      {
        label: "Role access",
        value: "User",
        note: "Admin-specific settings can be added later.",
      },
      {
        label: "Storage",
        value: "Local session",
        note: "Current frontend uses local auth storage.",
      },
    ],
  },
];

export default function SettingsPage() {
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
              Preferences
            </div>

            <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              Settings
            </h1>

            <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
              Review application preferences and the current configuration used
              across the document assistant workspace.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5 transition hover:border-indigo-100 hover:bg-white hover:shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-xs font-semibold tracking-wide text-indigo-700 ring-1 ring-indigo-100">
                  UI
                </div>
                <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
              </div>

              <p className="text-3xl font-semibold tracking-tight text-slate-950">
                Light
              </p>

              <h3 className="mt-2 text-sm font-semibold text-slate-900">
                Current theme
              </h3>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                Clean dashboard interface
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5 transition hover:border-indigo-100 hover:bg-white hover:shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-xs font-semibold tracking-wide text-emerald-700 ring-1 ring-emerald-100">
                  RAG
                </div>
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </div>

              <p className="text-3xl font-semibold tracking-tight text-slate-950">
                On
              </p>

              <h3 className="mt-2 text-sm font-semibold text-slate-900">
                Grounded answers
              </h3>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                Uses citations when available
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[390px_minmax(0,1fr)]">
        <aside className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-500">
            Status
          </p>

          <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
            Configuration state
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            These settings are currently displayed for review. Backend
            persistence can be added when user preferences become part of the
            product scope.
          </p>

          <div className="mt-6 space-y-3">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
              <p className="text-sm font-semibold text-emerald-800">
                Interface polished
              </p>
              <p className="mt-1 text-sm leading-6 text-emerald-700">
                Dashboard, documents, chat and workspaces share the same visual
                system.
              </p>
            </div>

            <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3">
              <p className="text-sm font-semibold text-indigo-800">
                Ready for future preferences
              </p>
              <p className="mt-1 text-sm leading-6 text-indigo-700">
                This page can later connect to a settings API without changing
                the layout.
              </p>
            </div>
          </div>
        </aside>

        <section className="space-y-6">
          {SETTINGS_GROUPS.map((group) => (
            <article
              key={group.title}
              className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="mb-6">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-500">
                  {group.title}
                </p>

                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                  {group.title} settings
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  {group.description}
                </p>
              </div>

              <div className="divide-y divide-slate-200 rounded-3xl border border-slate-200 bg-slate-50/70">
                {group.items.map((item) => (
                  <div
                    key={`${group.title}-${item.label}`}
                    className="grid gap-3 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_180px]"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {item.label}
                      </p>

                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        {item.note}
                      </p>
                    </div>

                    <div className="flex sm:justify-end">
                      <span className="inline-flex h-fit rounded-full border border-indigo-100 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700">
                        {item.value}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </section>
      </section>
    </div>
  );
}