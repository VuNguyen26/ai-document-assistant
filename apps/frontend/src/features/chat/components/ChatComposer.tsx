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
  return (
    <div className="border-t border-slate-200 bg-white p-4">
      <div className="mx-auto flex w-full max-w-4xl items-end gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-3">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          placeholder="Hỏi bất kỳ điều gì về tài liệu này..."
          rows={1}
          disabled={isStreaming}
          className="max-h-48 min-h-[48px] flex-1 resize-none bg-transparent px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
        />

        <button
          type="button"
          onClick={onSend}
          disabled={!input.trim() || isStreaming}
          className="inline-flex h-12 shrink-0 items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isStreaming ? "Đang gửi..." : "Gửi"}
        </button>
      </div>
    </div>
  );
}