"use client";

import type { RefObject } from "react";

type ChatComposerProps = {
  input: string;
  isStreaming: boolean;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  onInputChange: (value: string) => void;
  onSend: () => void;
};

export default function ChatComposer({
  input,
  isStreaming,
  textareaRef,
  onInputChange,
  onSend,
}: ChatComposerProps) {
  const canSend = input.trim().length > 0 && !isStreaming;

  return (
    <div className="border-t border-slate-200 bg-white px-4 py-4 sm:px-6">
      <div className="mx-auto w-full max-w-4xl">
        <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50/80 p-3 shadow-sm transition focus-within:border-indigo-200 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-50">
          <div className="flex items-end gap-3">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(event) => onInputChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  onSend();
                }
              }}
              placeholder="Ask a question about this document..."
              rows={1}
              disabled={isStreaming}
              className="max-h-44 min-h-12 flex-1 resize-none bg-transparent px-3 py-3 text-sm leading-6 text-slate-900 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
            />

            <button
              type="button"
              onClick={onSend}
              disabled={!canSend}
              className="inline-flex h-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
            >
              {isStreaming ? "Sending" : "Send"}
            </button>
          </div>
        </div>

        <div className="mt-2 flex flex-col justify-between gap-1 px-1 text-xs text-slate-400 sm:flex-row sm:items-center">
          <span>Press Enter to send, Shift + Enter for a new line.</span>
          <span>{input.trim().length} characters</span>
        </div>
      </div>
    </div>
  );
}