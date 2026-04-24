import Link from "next/link";

const STATS = [
  {
    label: "Documents",
    value: "0",
    description: "Uploaded files",
    code: "DOC",
    accent: "bg-indigo-50 text-indigo-700 ring-indigo-100",
    dot: "bg-indigo-500",
  },
  {
    label: "Ready",
    value: "0",
    description: "Processed files",
    code: "RDY",
    accent: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    dot: "bg-emerald-500",
  },
  {
    label: "Chats",
    value: "0",
    description: "Saved sessions",
    code: "CHT",
    accent: "bg-cyan-50 text-cyan-700 ring-cyan-100",
    dot: "bg-cyan-500",
  },
  {
    label: "Workspaces",
    value: "0",
    description: "Document groups",
    code: "WSP",
    accent: "bg-violet-50 text-violet-700 ring-violet-100",
    dot: "bg-violet-500",
  },
];

const QUICK_ACTIONS = [
  {
    href: "/documents",
    title: "Upload document",
    description: "Add a PDF or DOCX file and start processing.",
    primary: true,
  },
  {
    href: "/documents",
    title: "Open documents",
    description: "View uploaded files and processing status.",
    primary: false,
  },
  {
    href: "/summaries",
    title: "Create summary",
    description: "Generate a shorter version of selected content.",
    primary: false,
  },
  {
    href: "/translations",
    title: "Translate content",
    description: "Create translated versions for documents.",
    primary: false,
  },
];

const WORKFLOW_STEPS = [
  {
    step: "01",
    title: "Upload",
    description: "Add a document to your workspace.",
  },
  {
    step: "02",
    title: "Process",
    description: "Extract text, split content and prepare search data.",
  },
  {
    step: "03",
    title: "Ask",
    description: "Start a conversation grounded in document content.",
  },
  {
    step: "04",
    title: "Reuse",
    description: "Summarize, translate or create audio from the result.",
  },
];

const PRODUCT_MODULES = [
  {
    href: "/documents",
    title: "Documents",
    description: "Upload, manage and review processing status.",
    bar: "bg-indigo-500",
  },
  {
    href: "/workspaces",
    title: "Workspaces",
    description: "Group related documents into focused work areas.",
    bar: "bg-violet-500",
  },
  {
    href: "/summaries",
    title: "Summaries",
    description: "Create concise summaries from document content.",
    bar: "bg-cyan-500",
  },
  {
    href: "/translations",
    title: "Translations",
    description: "Translate extracted content into another language.",
    bar: "bg-emerald-500",
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-8 p-6 sm:p-8 xl:grid-cols-[1.05fr_0.95fr] xl:p-10">
          <div className="flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-indigo-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Workspace overview
              </div>

              <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                Manage documents from one workspace
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                Upload documents, track their processing status, and use them
                for chat, summaries and translations.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/documents"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-700"
              >
                <span>Upload document</span>
                <span aria-hidden="true">→</span>
              </Link>

              <Link
                href="/workspaces"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
              >
                View workspaces
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {STATS.map((item) => (
              <div
                key={item.label}
                className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5 transition hover:border-indigo-100 hover:bg-white hover:shadow-sm"
              >
                <div className="mb-5 flex items-center justify-between">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-2xl text-xs font-semibold tracking-wide ring-1 ${item.accent}`}
                  >
                    {item.code}
                  </div>

                  <span className={`h-2.5 w-2.5 rounded-full ${item.dot}`} />
                </div>

                <p className="text-3xl font-semibold tracking-tight text-slate-950">
                  {item.value}
                </p>

                <h3 className="mt-2 text-sm font-semibold text-slate-900">
                  {item.label}
                </h3>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-500">
              Quick actions
            </p>

            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              Start a workflow
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {QUICK_ACTIONS.map((item) => (
              <Link
                key={`${item.href}-${item.title}`}
                href={item.href}
                className={`group rounded-3xl border p-6 shadow-sm transition hover:shadow-md ${
                  item.primary
                    ? "border-indigo-600 bg-indigo-600 text-white shadow-indigo-600/15 hover:bg-indigo-700"
                    : "border-slate-200 bg-white text-slate-950 hover:border-indigo-200 hover:bg-indigo-50/50"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold tracking-tight">
                      {item.title}
                    </h3>

                    <p
                      className={`mt-2 text-sm leading-6 ${
                        item.primary ? "text-indigo-100" : "text-slate-500"
                      }`}
                    >
                      {item.description}
                    </p>
                  </div>

                  <span
                    aria-hidden="true"
                    className={`mt-1 text-sm transition group-hover:translate-x-0.5 ${
                      item.primary ? "text-white" : "text-indigo-500"
                    }`}
                  >
                    →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <aside className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-500">
                Pipeline
              </p>

              <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
                Main flow
              </h2>
            </div>

            <span className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
              4 steps
            </span>
          </div>

          <div className="mt-6 space-y-4">
            {WORKFLOW_STEPS.map((item, index) => (
              <div key={item.step} className="relative flex gap-4">
                {index !== WORKFLOW_STEPS.length - 1 ? (
                  <div className="absolute left-5 top-11 h-[calc(100%-1rem)] w-px bg-slate-200" />
                ) : null}

                <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-100">
                  {item.step}
                </div>

                <div className="pb-2">
                  <h3 className="text-sm font-semibold text-slate-950">
                    {item.title}
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section>
        <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-500">
              Modules
            </p>

            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              Workspace tools
            </h2>
          </div>

          <Link
            href="/documents"
            className="text-sm font-semibold text-indigo-600 transition hover:text-indigo-700"
          >
            Go to documents →
          </Link>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {PRODUCT_MODULES.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
            >
              <div
                className={`mb-5 h-1.5 w-10 rounded-full ${item.bar} transition group-hover:w-14`}
              />

              <h3 className="text-lg font-semibold tracking-tight text-slate-950">
                {item.title}
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                {item.description}
              </p>

              <div className="mt-5 text-sm font-semibold text-slate-400 transition group-hover:text-indigo-600">
                Open module →
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}