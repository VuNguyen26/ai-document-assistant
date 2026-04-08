"use client";

import { useCallback, useRef, useState } from "react";
import {
  buildAuthorizedStreamRequestInit,
  getChatStreamUrl,
} from "../api/chat.api";
import type {
  AskChatPayload,
  StreamEvent,
  UseChatStreamOptions,
} from "../types/chat.types";

function parseSseChunk(buffer: string): {
  events: StreamEvent[];
  rest: string;
} {
  const rawEvents = buffer.split("\n\n");
  const completeEvents = rawEvents.slice(0, -1);
  const rest = rawEvents[rawEvents.length - 1] || "";

  const events: StreamEvent[] = [];

  for (const rawEvent of completeEvents) {
    const lines = rawEvent.split("\n");
    let eventName = "message";
    const dataLines: string[] = [];

    for (const line of lines) {
      if (line.startsWith("event:")) {
        eventName = line.replace("event:", "").trim();
      } else if (line.startsWith("data:")) {
        dataLines.push(line.replace("data:", "").trim());
      }
    }

    const joinedData = dataLines.join("\n");

    if (eventName === "delta") {
      events.push({ type: "delta", data: joinedData });
      continue;
    }

    if (eventName === "done") {
      events.push({ type: "done", data: joinedData });
      continue;
    }

    if (eventName === "meta") {
      try {
        const parsed = joinedData ? JSON.parse(joinedData) : {};
        events.push({ type: "meta", data: parsed });
      } catch {
        events.push({ type: "meta", data: {} });
      }
      continue;
    }

    if (eventName === "error") {
      events.push({ type: "error", data: joinedData || "Streaming failed" });
    }
  }

  return { events, rest };
}

export function useChatStream(options?: UseChatStreamOptions) {
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const stop = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsStreaming(false);
  }, []);

  const startStream = useCallback(
    async (payload: AskChatPayload) => {
      if (isStreaming) return;

      setIsStreaming(true);
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const requestInit = await buildAuthorizedStreamRequestInit(payload);

        const response = await fetch(getChatStreamUrl(), {
          ...requestInit,
          signal: controller.signal,
        });

        if (!response.ok) {
          let message = `Streaming failed with status ${response.status}`;
          try {
            const errorBody = await response.json();
            message = errorBody?.message || errorBody?.error || message;
          } catch {
            // ignore
          }
          throw new Error(message);
        }

        if (!response.body) {
          throw new Error("Response body is empty");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          const parsed = parseSseChunk(buffer);
          buffer = parsed.rest;

          for (const event of parsed.events) {
            if (event.type === "meta") {
              options?.onMeta?.(event.data);
            } else if (event.type === "delta") {
              options?.onDelta?.(event.data);
            } else if (event.type === "done") {
              options?.onDone?.();
            } else if (event.type === "error") {
              options?.onError?.(event.data);
            }
          }
        }

        if (buffer.trim()) {
          const parsed = parseSseChunk(`${buffer}\n\n`);
          for (const event of parsed.events) {
            if (event.type === "meta") {
              options?.onMeta?.(event.data);
            } else if (event.type === "delta") {
              options?.onDelta?.(event.data);
            } else if (event.type === "done") {
              options?.onDone?.();
            } else if (event.type === "error") {
              options?.onError?.(event.data);
            }
          }
        }
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          options?.onError?.((error as Error).message || "Streaming failed");
        }
      } finally {
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [isStreaming, options]
  );

  return {
    isStreaming,
    startStream,
    stop,
  };
}