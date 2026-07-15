"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { getChatSessions } from "@/features/chat/api/chat.api";
import type { ChatSessionsResponse } from "@/features/chat/types/chat.types";
import { getDocuments } from "@/features/documents/api/documents.api";
import type {
  DocumentItem,
  DocumentsListResponse,
} from "@/features/documents/types/documents.types";
import { getSummaries } from "@/features/summaries/api/summaries.api";
import type { SummariesListResponse } from "@/features/summaries/types/summaries.types";
import { getTranslations } from "@/features/translations/api/translations.api";
import type { TranslationsListResponse } from "@/features/translations/types/translations.types";
import { getWorkspaces } from "@/features/workspaces/api/workspaces.api";
import type { WorkspacesListResponse } from "@/features/workspaces/types/workspaces.types";

type OverviewSnapshot = {
  documents: DocumentsListResponse | null;
  workspaces: WorkspacesListResponse | null;
  chatSessions: ChatSessionsResponse | null;
  summaries: SummariesListResponse | null;
  translations: TranslationsListResponse | null;
  errors: string[];
};

const EMPTY_SNAPSHOT: OverviewSnapshot = {
  documents: null,
  workspaces: null,
  chatSessions: null,
  summaries: null,
  translations: null,
  errors: [],
};

const DASH = "\u2014";
const ARROW = "\u2192";
const DOT = "\u2022";

const QUICK_ACTIONS = [
  {
    href: "/documents",
    eyebrow: "T\xe0i li\u1ec7u",
    title: "T\u1ea3i l\xean v\xe0 x\u1eed l\xfd",
    description:
      "Th\xeam PDF, DOCX ho\u1eb7c TXT v\xe0o kh\xf4ng gian tri th\u1ee9c.",
  },
  {
    href: "/workspaces",
    eyebrow: "T\u1ed5 ch\u1ee9c",
    title: "T\u1ea1o kh\xf4ng gian l\xe0m vi\u1ec7c",
    description:
      "Nh\xf3m c\xe1c t\xe0i li\u1ec7u li\xean quan theo ch\u1ee7 \u0111\u1ec1 ho\u1eb7c d\u1ef1 \xe1n.",
  },
  {
    href: "/summaries",
    eyebrow: "T\u1ea1o n\u1ed9i dung",
    title: "T\xf3m t\u1eaft t\xe0i li\u1ec7u",
    description:
      "Chuy\u1ec3n n\u1ed9i dung d\xe0i th\xe0nh b\u1ea3n t\xf3m t\u1eaft d\u1ec5 s\u1eed d\u1ee5ng.",
  },
  {
    href: "/translations",
    eyebrow: "Ng\xf4n ng\u1eef",
    title: "D\u1ecbch n\u1ed9i dung",
    description:
      "T\u1ea1o b\u1ea3n d\u1ecbch t\u1eeb t\xe0i li\u1ec7u ho\u1eb7c b\u1ea3n t\xf3m t\u1eaft hi\u1ec7n c\xf3.",
  },
];

const DOCUMENT_STATUS: Record<
  string,
  {
    label: string;
    className: string;
  }
> = {
  UPLOADED: {
    label: "\u0110\xe3 t\u1ea3i l\xean",
    className: "bg-slate-100 text-slate-700",
  },
  PROCESSING: {
    label: "\u0110ang x\u1eed l\xfd",
    className: "bg-amber-50 text-amber-700",
  },
  EXTRACTED: {
    label: "\u0110\xe3 tr\xedch xu\u1ea5t",
    className: "bg-cyan-50 text-cyan-700",
  },
  CHUNKED: {
    label: "\u0110\xe3 chia \u0111o\u1ea1n",
    className: "bg-violet-50 text-violet-700",
  },
  READY: {
    label: "S\u1eb5n s\xe0ng",
    className: "bg-emerald-50 text-emerald-700",
  },
  FAILED: {
    label: "Th\u1ea5t b\u1ea1i",
    className: "bg-rose-50 text-rose-700",
  },
};

function getErrorMessage(reason: unknown): string {
  if (reason instanceof Error && reason.message.trim()) {
    return reason.message;
  }

  return "Kh\xf4ng th\u1ec3 t\u1ea3i d\u1eef li\u1ec7u.";
}

function formatDocumentDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Kh\xf4ng r\xf5 th\u1eddi gian";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatUpdatedTime(value: Date | null): string {
  if (!value) {
    return "Ch\u01b0a \u0111\u1ed3ng b\u1ed9";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

function DocumentStatusBadge({ status }: { status: string }) {
  const meta = DOCUMENT_STATUS[status] ?? {
    label: status,
    className: "bg-slate-100 text-slate-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${meta.className}`}
    >
      {meta.label}
    </span>
  );
}

function LoadingOverview() {
  return (
    <div
      className="space-y-7"
      aria-label="\u0110ang t\u1ea3i d\u1eef li\u1ec7u t\u1ed5ng quan"
    >
      <section className="animate-pulse rounded-[28px] border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
        <div className="grid gap-10 xl:grid-cols-[1.3fr_0.7fr]">
          <div>
            <div className="h-3 w-40 rounded bg-slate-200" />
            <div className="mt-6 h-11 max-w-2xl rounded bg-slate-200" />
            <div className="mt-4 h-5 max-w-xl rounded bg-slate-100" />

            <div className="mt-8 flex gap-3">
              <div className="h-11 w-36 rounded-xl bg-slate-200" />
              <div className="h-11 w-40 rounded-xl bg-slate-100" />
            </div>
          </div>

          <div className="rounded-2xl bg-slate-100 p-6">
            <div className="h-4 w-32 rounded bg-slate-200" />
            <div className="mt-6 h-20 rounded bg-slate-200" />
          </div>
        </div>
      </section>

      <section className="grid animate-pulse overflow-hidden rounded-[24px] border border-slate-200 bg-white sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="border-b border-slate-200 p-6 last:border-b-0 sm:[&:nth-child(odd)]:border-r xl:border-b-0 xl:border-r xl:last:border-r-0"
          >
            <div className="h-3 w-24 rounded bg-slate-100" />
            <div className="mt-4 h-9 w-16 rounded bg-slate-200" />
            <div className="mt-3 h-4 w-36 rounded bg-slate-100" />
          </div>
        ))}
      </section>
    </div>
  );
}

export default function DashboardOverview() {
  const [snapshot, setSnapshot] = useState<OverviewSnapshot>(EMPTY_SNAPSHOT);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadOverview = useCallback(async () => {
    const results = await Promise.allSettled([
      getDocuments({
        page: 1,
        limit: 5,
        sortBy: "createdAt",
        sortOrder: "desc",
      }),
      getWorkspaces({
        page: 1,
        limit: 4,
      }),
      getChatSessions({
        page: 1,
        limit: 5,
      }),
      getSummaries({
        page: 1,
        limit: 4,
      }),
      getTranslations({
        page: 1,
        limit: 4,
      }),
    ]);

    const [
      documentsResult,
      workspacesResult,
      chatSessionsResult,
      summariesResult,
      translationsResult,
    ] = results;

    const errors: string[] = [];

    if (documentsResult.status === "rejected") {
      errors.push(
        `T\xe0i li\u1ec7u: ${getErrorMessage(documentsResult.reason)}`,
      );
    }

    if (workspacesResult.status === "rejected") {
      errors.push(`Kh\xf4ng gian: ${getErrorMessage(workspacesResult.reason)}`);
    }

    if (chatSessionsResult.status === "rejected") {
      errors.push(
        `Cu\u1ed9c tr\xf2 chuy\u1ec7n: ${getErrorMessage(
          chatSessionsResult.reason,
        )}`,
      );
    }

    if (summariesResult.status === "rejected") {
      errors.push(
        `T\xf3m t\u1eaft: ${getErrorMessage(summariesResult.reason)}`,
      );
    }

    if (translationsResult.status === "rejected") {
      errors.push(
        `B\u1ea3n d\u1ecbch: ${getErrorMessage(translationsResult.reason)}`,
      );
    }

    setSnapshot({
      documents:
        documentsResult.status === "fulfilled" ? documentsResult.value : null,
      workspaces:
        workspacesResult.status === "fulfilled" ? workspacesResult.value : null,
      chatSessions:
        chatSessionsResult.status === "fulfilled"
          ? chatSessionsResult.value
          : null,
      summaries:
        summariesResult.status === "fulfilled" ? summariesResult.value : null,
      translations:
        translationsResult.status === "fulfilled"
          ? translationsResult.value
          : null,
      errors,
    });

    setLastUpdated(new Date());
    setLoading(false);
    setRefreshing(false);
  }, []);

  const refreshOverview = useCallback(async () => {
    setRefreshing(true);
    await loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadOverview();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadOverview]);

  if (loading) {
    return <LoadingOverview />;
  }

  const documentTotal = snapshot.documents?.summary.total ?? null;
  const readyDocuments = snapshot.documents?.summary.ready ?? null;
  const failedDocuments = snapshot.documents?.summary.failed ?? null;
  const workspaceTotal = snapshot.workspaces?.pagination.total ?? null;
  const chatTotal = snapshot.chatSessions?.meta.total ?? null;
  const summaryTotal = snapshot.summaries?.pagination.total ?? null;
  const translationTotal = snapshot.translations?.pagination.total ?? null;

  const aiOutputTotal =
    summaryTotal !== null && translationTotal !== null
      ? summaryTotal + translationTotal
      : null;

  const readinessPercentage =
    documentTotal !== null && readyDocuments !== null && documentTotal > 0
      ? Math.round((readyDocuments / documentTotal) * 100)
      : 0;

  const recentDocuments = snapshot.documents?.items ?? [];

  const metrics = [
    {
      label: "T\u1ed5ng t\xe0i li\u1ec7u",
      value: documentTotal,
      description: `${documentTotal ?? 0} t\xe0i li\u1ec7u trong th\u01b0 vi\u1ec7n`,
      tone: "text-indigo-600",
    },
    {
      label: "\u0110\xe3 s\u1eb5n s\xe0ng",
      value: readyDocuments,
      description:
        documentTotal !== null && readyDocuments !== null && documentTotal > 0
          ? `${readinessPercentage}% t\xe0i li\u1ec7u \u0111\xe3 x\u1eed l\xfd`
          : "Ch\u01b0a c\xf3 t\xe0i li\u1ec7u c\u1ea7n x\u1eed l\xfd",
      tone: "text-emerald-600",
    },
    {
      label: "Kh\xf4ng gian",
      value: workspaceTotal,
      description: `${workspaceTotal ?? 0} nh\xf3m t\xe0i li\u1ec7u \u0111ang ho\u1ea1t \u0111\u1ed9ng`,
      tone: "text-violet-600",
    },
    {
      label: "K\u1ebft qu\u1ea3 AI",
      value: aiOutputTotal,
      description: `${aiOutputTotal ?? 0} b\u1ea3n t\xf3m t\u1eaft v\xe0 b\u1ea3n d\u1ecbch`,
      tone: "text-cyan-600",
    },
  ];

  return (
    <div className="space-y-7">
      <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-10 p-7 sm:p-9 xl:grid-cols-[1.3fr_0.7fr] xl:p-10">
          <div className="flex flex-col justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-500">
                {"Kh\xf4ng gian h\xf4m nay"}
              </p>

              <h1 className="mt-4 max-w-3xl text-3xl font-semibold tracking-[-0.035em] text-slate-950 sm:text-4xl xl:text-[2.75rem] xl:leading-[1.08]">
                {
                  "Bi\u1ebfn t\xe0i li\u1ec7u th\xe0nh tri th\u1ee9c c\xf3 th\u1ec3 s\u1eed d\u1ee5ng ngay"
                }
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                {
                  "Theo d\xf5i ti\u1ebfn \u0111\u1ed9 x\u1eed l\xfd, m\u1edf l\u1ea1i t\xe0i li\u1ec7u g\u1ea7n \u0111\xe2y v\xe0 ti\u1ebfp t\u1ee5c c\xe1c quy tr\xecnh t\xf3m t\u1eaft, d\u1ecbch thu\u1eadt ho\u1eb7c h\u1ecfi \u0111\xe1p t\u1eeb m\u1ed9t n\u01a1i duy nh\u1ea5t."
                }
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/documents"
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
              >
                {"T\u1ea3i t\xe0i li\u1ec7u"}
              </Link>

              <Link
                href="/workspaces"
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
              >
                {"T\u1ea1o kh\xf4ng gian"}
              </Link>
            </div>
          </div>

          <aside className="rounded-2xl border border-slate-200 bg-slate-50/80 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {"M\u1ee9c \u0111\u1ed9 s\u1eb5n s\xe0ng"}
                </p>

                <p className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
                  {documentTotal === null ? DASH : `${readinessPercentage}%`}
                </p>
              </div>

              <span className="inline-flex rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                {(failedDocuments ?? 0) > 0
                  ? `${failedDocuments} c\u1ea7n ki\u1ec3m tra`
                  : "H\u1ec7 th\u1ed1ng \u1ed5n \u0111\u1ecbnh"}
              </span>
            </div>

            <div
              className="mt-6 h-2 overflow-hidden rounded-full bg-slate-200"
              aria-label={`${readinessPercentage}% t\xe0i li\u1ec7u \u0111\xe3 s\u1eb5n s\xe0ng`}
            >
              <div
                className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                style={{ width: `${readinessPercentage}%` }}
              />
            </div>

            <div className="mt-5 flex items-center justify-between gap-4 text-sm">
              <span className="text-slate-500">
                {readyDocuments ?? DASH} {"s\u1eb5n s\xe0ng /"}{" "}
                {documentTotal ?? DASH} {"t\u1ed5ng"}
              </span>

              <button
                type="button"
                onClick={() => void refreshOverview()}
                disabled={refreshing}
                className="font-semibold text-indigo-600 transition hover:text-indigo-700 disabled:cursor-wait disabled:text-slate-400"
              >
                {refreshing
                  ? "\u0110ang c\u1eadp nh\u1eadt..."
                  : "C\u1eadp nh\u1eadt"}
              </button>
            </div>

            <p className="mt-4 border-t border-slate-200 pt-4 text-xs text-slate-400">
              {"\u0110\u1ed3ng b\u1ed9 l\xfac"} {formatUpdatedTime(lastUpdated)}
            </p>
          </aside>
        </div>
      </section>

      {snapshot.errors.length > 0 ? (
        <section
          className="flex flex-col justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 sm:flex-row sm:items-center"
          aria-live="polite"
        >
          <div>
            <p className="text-sm font-semibold text-amber-900">
              {
                "M\u1ed9t s\u1ed1 d\u1eef li\u1ec7u ch\u01b0a \u0111\u01b0\u1ee3c \u0111\u1ed3ng b\u1ed9"
              }
            </p>

            <p className="mt-1 text-sm text-amber-700">
              {
                "C\xe1c khu v\u1ef1c c\xf2n l\u1ea1i v\u1eabn c\xf3 th\u1ec3 s\u1eed d\u1ee5ng b\xecnh th\u01b0\u1eddng."
              }
            </p>
          </div>

          <button
            type="button"
            onClick={() => void refreshOverview()}
            disabled={refreshing}
            className="shrink-0 text-sm font-semibold text-amber-900 transition hover:text-amber-950 disabled:cursor-wait disabled:opacity-60"
          >
            {refreshing
              ? "\u0110ang th\u1eed l\u1ea1i..."
              : "Th\u1eed t\u1ea3i l\u1ea1i"}
          </button>
        </section>
      ) : null}

      <section className="grid overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="border-b border-slate-200 p-6 last:border-b-0 sm:[&:nth-child(odd)]:border-r xl:border-b-0 xl:border-r xl:last:border-r-0"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              {metric.label}
            </p>

            <p
              className={`mt-3 text-3xl font-semibold tracking-tight ${metric.tone}`}
            >
              {metric.value ?? DASH}
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {metric.value === null
                ? "Ch\u01b0a th\u1ec3 t\u1ea3i s\u1ed1 li\u1ec7u"
                : metric.description}
            </p>
          </div>
        ))}
      </section>

      <section className="grid items-start gap-7 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-500">
                {"G\u1ea7n \u0111\xe2y"}
              </p>

              <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
                {"T\xe0i li\u1ec7u m\u1edbi nh\u1ea5t"}
              </h2>
            </div>

            <Link
              href="/documents"
              className="text-sm font-semibold text-indigo-600 transition hover:text-indigo-700"
            >
              {"Xem t\u1ea5t c\u1ea3"} {ARROW}
            </Link>
          </div>

          {snapshot.documents === null ? (
            <div className="px-6 py-14 text-center">
              <p className="text-sm font-semibold text-slate-900">
                {"Ch\u01b0a th\u1ec3 t\u1ea3i danh s\xe1ch t\xe0i li\u1ec7u"}
              </p>

              <p className="mt-2 text-sm text-slate-500">
                {
                  "H\xe3y c\u1eadp nh\u1eadt l\u1ea1i sau khi k\u1ebft n\u1ed1i \u1ed5n \u0111\u1ecbnh."
                }
              </p>
            </div>
          ) : recentDocuments.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <p className="text-lg font-semibold text-slate-950">
                {"Kh\xf4ng gian c\u1ee7a b\u1ea1n \u0111ang tr\u1ed1ng"}
              </p>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                {
                  "T\u1ea3i t\xe0i li\u1ec7u \u0111\u1ea7u ti\xean \u0111\u1ec3 b\u1eaft \u0111\u1ea7u tr\xedch xu\u1ea5t n\u1ed9i dung, t\xf3m t\u1eaft, d\u1ecbch thu\u1eadt v\xe0 h\u1ecfi \u0111\xe1p c\xf3 c\u0103n c\u1ee9."
                }
              </p>

              <Link
                href="/documents"
                className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white transition hover:bg-indigo-700"
              >
                {"Th\xeam t\xe0i li\u1ec7u \u0111\u1ea7u ti\xean"}
              </Link>
            </div>
          ) : (
            <div>
              {recentDocuments.map((document: DocumentItem) => (
                <Link
                  key={document.id}
                  href={`/documents/${document.id}`}
                  className="group grid gap-4 border-b border-slate-100 px-6 py-5 transition last:border-b-0 hover:bg-slate-50 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                >
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-slate-950 transition group-hover:text-indigo-700">
                      {document.title || document.originalFilename}
                    </h3>

                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                      <span className="max-w-xs truncate">
                        {document.originalFilename}
                      </span>
                      <span aria-hidden="true">{DOT}</span>
                      <span>{formatDocumentDate(document.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 sm:justify-end">
                    <DocumentStatusBadge status={document.status} />

                    <span
                      aria-hidden="true"
                      className="text-sm font-semibold text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-indigo-500"
                    >
                      {ARROW}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <aside className="space-y-7">
          <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-500">
              {"Ti\u1ebfp t\u1ee5c c\xf4ng vi\u1ec7c"}
            </p>

            <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
              {"Thao t\xe1c nhanh"}
            </h2>

            <div className="mt-5 divide-y divide-slate-100">
              {QUICK_ACTIONS.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="group flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0"
                >
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                      {action.eyebrow}
                    </p>

                    <h3 className="mt-1 text-sm font-semibold text-slate-950 transition group-hover:text-indigo-700">
                      {action.title}
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      {action.description}
                    </p>
                  </div>

                  <span
                    aria-hidden="true"
                    className="mt-5 shrink-0 text-sm font-semibold text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-indigo-500"
                  >
                    {ARROW}
                  </span>
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-[24px] border border-slate-200 bg-slate-950 p-6 text-white shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-300">
              {"Ho\u1ea1t \u0111\u1ed9ng AI"}
            </p>

            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
                <span className="text-sm text-slate-300">
                  {"Cu\u1ed9c tr\xf2 chuy\u1ec7n"}
                </span>
                <strong className="text-xl font-semibold">
                  {chatTotal ?? DASH}
                </strong>
              </div>

              <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
                <span className="text-sm text-slate-300">
                  {"B\u1ea3n t\xf3m t\u1eaft"}
                </span>
                <strong className="text-xl font-semibold">
                  {summaryTotal ?? DASH}
                </strong>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-slate-300">
                  {"B\u1ea3n d\u1ecbch"}
                </span>
                <strong className="text-xl font-semibold">
                  {translationTotal ?? DASH}
                </strong>
              </div>
            </div>

            <p className="mt-6 text-sm leading-6 text-slate-400">
              {
                "C\xe1c k\u1ebft qu\u1ea3 \u0111\u01b0\u1ee3c t\u1ea1o t\u1eeb n\u1ed9i dung thu\u1ed9c phi\xean l\xe0m vi\u1ec7c hi\u1ec7n t\u1ea1i."
              }
            </p>
          </section>
        </aside>
      </section>
    </div>
  );
}
