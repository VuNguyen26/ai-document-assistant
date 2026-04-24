"use client";

import type { RefObject } from "react";
import toast from "react-hot-toast";
import type { ChatMessage } from "../types/chat.types";
import ChatCitations from "./ChatCitations";
import MarkdownMessage from "./MarkdownMessage";

type ChatMessageListProps = {
  messages: ChatMessage[];
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
  messagesEndRef: RefObject<HTMLDivElement | null>;
};

async function copyToClipboard(value: string, successMessage: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(successMessage);
  } catch {
    toast.error("Không thể sao chép vào clipboard.");
  }
}

function formatMessageTime(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function ChatMessageList({
  messages,
  isLoading,
  isStreaming,
  error,
  messagesEndRef,
}: ChatMessageListProps) {
  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-6 sm:px-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className={`flex ${
              index % 2 === 0 ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`h-24 animate-pulse rounded-3xl ${
                index % 2 === 0
                  ? "w-[70%] bg-indigo-100"
                  : "w-[82%] bg-white"
              }`}
            />
          </div>
        ))}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center overflow-y-auto px-4 py-10 sm:px-6">
        <div className="w-full max-w-xl rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-5 h-1.5 w-14 rounded-full bg-indigo-500" />

          <h3 className="text-2xl font-semibold tracking-tight text-slate-950">
            Bắt đầu cuộc trò chuyện mới
          </h3>

          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
            Hãy đặt câu hỏi về tài liệu này. Câu trả lời sẽ được tạo dựa trên
            nội dung tài liệu đã xử lý khi hệ thống tìm thấy các đoạn liên quan.
          </p>

          <div className="mt-6 grid gap-3 text-left sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-sm font-semibold text-slate-900">
                Hỏi để tóm tắt
              </p>
              <p className="mt-1 text-sm leading-5 text-slate-500">
                “Tóm tắt các ý chính.”
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-sm font-semibold text-slate-900">
                Hỏi chi tiết
              </p>
              <p className="mt-1 text-sm leading-5 text-slate-500">
                “Tài liệu nói gì về chính sách chính?”
              </p>
            </div>
          </div>

          {error ? (
            <div className="mt-6 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700">
              {error}
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto px-4 py-6 sm:px-6">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
        {messages.map((message) => {
          const isUser = message.role === "USER";
          const time = formatMessageTime(message.createdAt);

          return (
            <article
              key={message.id}
              className={`flex ${isUser ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[88%] rounded-[1.5rem] px-5 py-4 shadow-sm ${
                  isUser
                    ? "bg-indigo-600 text-white"
                    : "border border-slate-200 bg-white text-slate-900"
                }`}
              >
                <div className="mb-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        isUser ? "bg-indigo-200" : "bg-emerald-500"
                      }`}
                    />

                    <p
                      className={`text-xs font-semibold uppercase tracking-[0.16em] ${
                        isUser ? "text-indigo-100" : "text-slate-400"
                      }`}
                    >
                      {isUser ? "Bạn" : "Trợ lý"}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {time ? (
                      <span
                        className={`text-xs ${
                          isUser ? "text-indigo-100" : "text-slate-400"
                        }`}
                      >
                        {time}
                      </span>
                    ) : null}

                    <button
                      type="button"
                      onClick={() =>
                        void copyToClipboard(
                          message.content,
                          isUser
                            ? "Đã sao chép câu hỏi."
                            : "Đã sao chép câu trả lời.",
                        )
                      }
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold transition ${
                        isUser
                          ? "bg-white/10 text-white hover:bg-white/15"
                          : "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      Sao chép
                    </button>
                  </div>
                </div>

                {isUser ? (
                  <p className="whitespace-pre-wrap text-sm leading-7">
                    {message.content}
                  </p>
                ) : (
                  <div className="space-y-4">
                    <MarkdownMessage content={message.content} />

                    {message.citations?.length ? (
                      <ChatCitations citations={message.citations} />
                    ) : null}
                  </div>
                )}
              </div>
            </article>
          );
        })}

        {isStreaming ? (
          <article className="flex justify-start">
            <div className="rounded-[1.5rem] border border-slate-200 bg-white px-5 py-4 text-sm text-slate-500 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 animate-pulse rounded-full bg-indigo-500" />
                <span className="font-medium">Trợ lý đang trả lời...</span>
              </div>
            </div>
          </article>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700">
            {error}
          </div>
        ) : null}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}