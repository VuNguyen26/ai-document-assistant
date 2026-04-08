import { ReactNode } from "react";

type PublicLayoutProps = {
  children: ReactNode;
};

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(148,163,184,0.16),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.14),_transparent_28%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom_right,rgba(255,255,255,0.03),transparent_35%,rgba(255,255,255,0.02))]" />

      <div className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-6 py-10 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="hidden lg:block">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 backdrop-blur">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-bold text-slate-900">
                AI
              </span>
              <span>AI Document Assistant</span>
            </div>

            <h1 className="mt-8 text-5xl font-bold leading-tight tracking-tight text-white">
              Upload, process, and chat with documents beautifully.
            </h1>

            <p className="mt-5 max-w-xl text-base leading-8 text-slate-300">
              Một workspace hiện đại để upload tài liệu, xử lý pipeline AI,
              semantic search và chat grounded theo nội dung document.
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl">
                  📄
                </div>
                <h3 className="text-base font-semibold text-white">Documents</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Upload và quản lý tài liệu với UI rõ ràng, sạch và nhanh.
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl">
                  🧠
                </div>
                <h3 className="text-base font-semibold text-white">Pipeline AI</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Extract, chunk, embed và chuẩn bị dữ liệu cho retrieval.
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl">
                  💬
                </div>
                <h3 className="text-base font-semibold text-white">Grounded Chat</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Hỏi đáp theo tài liệu với trải nghiệm hội thoại hiện đại.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center">{children}</section>
      </div>
    </div>
  );
}