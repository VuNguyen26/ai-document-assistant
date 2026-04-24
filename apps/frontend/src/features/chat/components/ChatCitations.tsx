"use client";

import toast from "react-hot-toast";
import type { ChatCitation } from "../types/chat.types";

type ChatCitationsProps = {
  citations: ChatCitation[];
};

function truncateText(value: string, maxLength = 220) {
  const clean = value.replace(/\s+/g, " ").trim();

  if (clean.length <= maxLength) {
    return clean;
  }

  return `${clean.slice(0, maxLength)}...`;
}

function formatScore(score: number) {
  if (Number.isNaN(score)) return "-";
  return score.toFixed(3);
}

async function copyToClipboard(value: string, successMessage: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(successMessage);
  } catch {
    toast.error("Cannot copy to clipboard.");
  }
}

function buildCitationText(citation: ChatCitation) {
  return [
    `Document: ${citation.documentName}`,
    `Document ID: ${citation.documentId}`,
    `Chunk ID: ${citation.chunkId}`,
    `Chunk Index: ${citation.chunkIndex}`,
    `Score: ${formatScore(citation.score)}`,
    `Distance: ${citation.distance}`,
    `Start Offset: ${citation.startOffset ?? "-"}`,
    `End Offset: ${citation.endOffset ?? "-"}`,
    `Char Count: ${citation.charCount}`,
    "",
    citation.content,
  ].join("\n");
}

export default function ChatCitations({ citations }: ChatCitationsProps) {
  if (!citations.length) return null;

  return (
    <details className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            Sources used
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {citations.length} relevant chunk{citations.length > 1 ? "s" : ""}
          </p>
        </div>

        <span className="rounded-full border border-indigo-100 bg-white px-3 py-1 text-xs font-semibold text-indigo-700">
          View
        </span>
      </summary>

      <div className="mt-4 space-y-3">
        {citations.map((citation, index) => (
          <div
            key={`${citation.chunkId}-${index}`}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-950">
                  {citation.documentName}
                </p>

                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
                    Chunk {citation.chunkIndex}
                  </span>

                  <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                    Score {formatScore(citation.score)}
                  </span>

                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
                    {citation.charCount} chars
                  </span>
                </div>
              </div>

              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    void copyToClipboard(
                      truncateText(citation.content, 10000),
                      "Chunk copied.",
                    )
                  }
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                >
                  Copy chunk
                </button>

                <button
                  type="button"
                  onClick={() =>
                    void copyToClipboard(
                      buildCitationText(citation),
                      "Citation copied.",
                    )
                  }
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                >
                  Copy ref
                </button>
              </div>
            </div>

            <p className="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
              {truncateText(citation.content)}
            </p>

            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
              <span>start {citation.startOffset ?? "-"}</span>
              <span>end {citation.endOffset ?? "-"}</span>
              <span>distance {citation.distance}</span>
            </div>
          </div>
        ))}
      </div>
    </details>
  );
}