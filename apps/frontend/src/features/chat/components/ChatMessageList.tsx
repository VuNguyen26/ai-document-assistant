"use client";

import type { RefObject } from "react";
import type { ChatMessage } from "../types/chat.types";
import MarkdownMessage from "./MarkdownMessage";

type ChatMessageListProps = {
  messages: ChatMessage[];
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
  messagesEndRef: RefObject<HTMLDivElement | null>;
};

export default function ChatMessageList({
  messages,
  isLoading,
  isStreaming,
  error,
  messagesEndRef,
}: ChatMessageListProps) {
  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-slate-50 px-6">
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm text-slate-500 shadow-sm">
          Đang tải hội thoại...
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center bg-slate-50 px-6 py-10">
        <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
            💬
          </div>

          <h3 className="text-xl font-semibold text-slate-900">
            Bắt đầu cuộc trò chuyện mới
          </h3>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            Hãy đặt câu hỏi về nội dung tài liệu. Hệ thống sẽ trả lời dựa trên
            dữ liệu đã được xử lý từ document hiện tại.
          </p>

          {error ? (
            <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 px-5 py-6">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
        {messages.map((message) => {
          const isUser = message.role === "USER";

          return (
            <div
              key={message.id}
              className={`flex ${isUser ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-3xl px-4 py-3 shadow-sm ${
                  isUser
                    ? "bg-slate-900 text-white"
                    : "border border-slate-200 bg-white text-slate-800"
                }`}
              >
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] opacity-60">
                  {isUser ? "User" : "Assistant"}
                </div>

                {isUser ? (
                  <p className="whitespace-pre-wrap break-words text-sm leading-7">
                    {message.content}
                  </p>
                ) : (
                  <MarkdownMessage content={message.content} />
                )}
              </div>
            </div>
          );
        })}

        {isStreaming ? (
          <div className="flex justify-start">
            <div className="rounded-3xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Assistant
              </div>
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
              </div>
            </div>
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}