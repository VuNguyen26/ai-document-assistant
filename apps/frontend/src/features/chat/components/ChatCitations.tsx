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
    toast.error("Không thể copy vào clipboard.");
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
    <details className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <summary className="cursor-pointer list-none text-sm font-semibold text-slate-800">
        Nguồn tham chiếu ({citations.length})
      </summary>

      <div className="mt-4 space-y-3">
        {citations.map((citation) => (
          <div
            key={citation.chunkId}
            className="rounded-2xl border border-slate-200 bg-white p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  {citation.documentName}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  Chunk #{citation.chunkIndex}
                </span>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                  Score {formatScore(citation.score)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    void copyToClipboard(
                      truncateText(citation.content, 10000),
                      "Đã copy nội dung chunk.",
                    )
                  }
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Copy chunk
                </button>

                <button
                  type="button"
                  onClick={() =>
                    void copyToClipboard(
                      buildCitationText(citation),
                      "Đã copy citation.",
                    )
                  }
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Copy citation
                </button>
              </div>
            </div>

            <p className="mt-3 text-sm leading-6 text-slate-700">
              {truncateText(citation.content)}
            </p>

            <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
              <span>start: {citation.startOffset ?? "-"}</span>
              <span>end: {citation.endOffset ?? "-"}</span>
              <span>{citation.charCount} ký tự</span>
            </div>
          </div>
        ))}
      </div>
    </details>
  );
}