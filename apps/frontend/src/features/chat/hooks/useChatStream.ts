"use client";

import { useCallback, useRef, useState } from "react";
import { streamChat } from "../api/chat.api";
import type { AskChatPayload, ChatCitation } from "../types/chat.types";

type StreamMetaEvent = {
  sessionId: string;
  question: string;
  documentId: string | null;
  workspaceId: string | null;
  documentIds: string[];
  topK: number;
  usedChunks: ChatCitation[];
};

type UseChatStreamOptions = {
  onMeta?: (meta: StreamMetaEvent) => void;
  onDelta?: (delta: string) => void;
  onDone?: (payload: { sessionId: string; answer: string }) => void;
  onError?: (message: string) => void;
};

export function useChatStream(options?: UseChatStreamOptions) {
  const [isStreaming, setIsStreaming] = useState(false);
  const isStoppedRef = useRef(false);

  const stop = useCallback(() => {
    isStoppedRef.current = true;
    setIsStreaming(false);
  }, []);

  const startStream = useCallback(
    async (payload: AskChatPayload) => {
      if (isStreaming) return;

      setIsStreaming(true);
      isStoppedRef.current = false;

      try {
        await streamChat(payload, {
          onMeta: (meta) => {
            if (isStoppedRef.current) return;
            options?.onMeta?.(meta);
          },
          onDelta: ({ content }) => {
            if (isStoppedRef.current) return;
            options?.onDelta?.(content);
          },
          onDone: (data) => {
            if (isStoppedRef.current) return;
            options?.onDone?.(data);
          },
          onError: ({ message }) => {
            if (isStoppedRef.current) return;
            options?.onError?.(message || "Streaming failed");
          },
        });
      } catch (error) {
        if (!isStoppedRef.current) {
          options?.onError?.(
            error instanceof Error ? error.message : "Streaming failed",
          );
        }
      } finally {
        setIsStreaming(false);
      }
    },
    [isStreaming, options],
  );

  return {
    isStreaming,
    startStream,
    stop,
  };
}