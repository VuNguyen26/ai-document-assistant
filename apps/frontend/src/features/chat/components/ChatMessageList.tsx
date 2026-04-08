"use client";

import type { ChatMessage } from "../types/chat.types";
import MarkdownMessage from "./MarkdownMessage";

type ChatMessageListProps = {
  messages: ChatMessage[];
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
};

function formatTime(value: string) {
  try {
    return new Date(value).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export default function ChatMessageList({
  messages,
  isLoading,
  isStreaming,
  error,
  messagesEndRef,
}: ChatMessageListProps) {
  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-b from-white to-slate-50 px-4 py-5 md:px-6">
      {error ? (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-24 animate-pulse rounded-3xl bg-slate-200"
            />
          ))}
        </div>
      ) : messages.length === 0 ? (
        <div className="flex h-full items-center justify-center">
          <div className="max-w-xl rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-lg font-bold text-white">
              AI
            </div>
            <h2 className="text-xl font-semibold text-slate-900">
              Bắt đầu cuộc trò chuyện mới
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Đặt câu hỏi về tài liệu này. Hệ thống sẽ semantic search, lấy context
              phù hợp rồi stream câu trả lời về theo thời gian thực.
            </p>
          </div>
        </div>
      ) : (
        <div className="mx-auto flex max-w-4xl flex-col gap-4">
          {messages.map((message) => {
            const isUser = message.role === "USER";

            return (
              <div
                key={message.id}
                className={`flex ${isUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-3xl px-4 py-3 shadow-sm md:max-w-[75%] ${
                    isUser
                      ? "bg-slate-900 text-white"
                      : "border border-slate-200 bg-white text-slate-800"
                  }`}
                >
                  <div className="mb-1 text-xs font-semibold uppercase tracking-wide opacity-70">
                    {isUser ? "You" : "Assistant"}
                  </div>

                  <div className="break-words text-sm leading-7">
                    {isUser ? (
                      <div className="whitespace-pre-wrap">{message.content}</div>
                    ) : (
                      <MarkdownMessage
                        content={message.content || (isStreaming ? "Đang trả lời..." : "")}
                      />
                    )}
                  </div>

                  <div className="mt-2 text-[11px] opacity-60">
                    {formatTime(message.createdAt)}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      )}
    </div>
  );
}