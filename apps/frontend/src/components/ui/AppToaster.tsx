"use client";

import { Toaster } from "react-hot-toast";

export default function AppToaster() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3500,
        style: {
          borderRadius: "18px",
          border: "1px solid #e2e8f0",
          background: "#ffffff",
          color: "#0f172a",
          boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
          padding: "14px 16px",
        },
        success: {
          iconTheme: {
            primary: "#059669",
            secondary: "#ffffff",
          },
        },
        error: {
          iconTheme: {
            primary: "#e11d48",
            secondary: "#ffffff",
          },
        },
      }}
    />
  );
}