"use client";

type ChatComposerProps = {
  input: string;
  isStreaming: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
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
    <div className="border-t border-slate-200 bg-white p-4 md:p-5">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder="Nhập câu hỏi về tài liệu..."
            disabled={isStreaming}
            className="max-h-48 min-h-[56px] w-full resize-none bg-transparent px-2 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
          />

          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              Enter để gửi · Shift + Enter để xuống dòng
            </p>

            <button
              onClick={onSend}
              disabled={!input.trim() || isStreaming}
              className="rounded-2xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isStreaming ? "Đang gửi..." : "Gửi"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}