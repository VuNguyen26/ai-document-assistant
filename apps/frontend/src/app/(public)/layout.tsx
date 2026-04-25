import { ReactNode } from "react";

type PublicLayoutProps = {
  children: ReactNode;
};

const highlights = [
  {
    step: "01",
    label: "Tải tài liệu",
    description: "Quản lý PDF, DOCX và TXT trong một không gian làm việc rõ ràng.",
  },
  {
    step: "02",
    label: "Quy trình AI",
    description:
      "Trích xuất, chia đoạn, tạo embedding và chuẩn bị dữ liệu cho tìm kiếm ngữ nghĩa.",
  },
  {
    step: "03",
    label: "Chat có căn cứ",
    description: "Hỏi đáp theo nội dung tài liệu, có căn cứ và ngữ cảnh rõ ràng.",
  },
];

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#e7f0ff] text-slate-950">
      <style>
        {`
          @keyframes authBlobOne {
            0%, 100% {
              transform: translate3d(0, 0, 0) scale(1);
            }
            33% {
              transform: translate3d(70px, 40px, 0) scale(1.12);
            }
            66% {
              transform: translate3d(24px, 88px, 0) scale(0.96);
            }
          }

          @keyframes authBlobTwo {
            0%, 100% {
              transform: translate3d(0, 0, 0) scale(1);
            }
            33% {
              transform: translate3d(-72px, -44px, 0) scale(1.1);
            }
            66% {
              transform: translate3d(-28px, -96px, 0) scale(0.98);
            }
          }

          @keyframes authGridDrift {
            0% {
              background-position: 0px 0px;
            }
            100% {
              background-position: 72px 72px;
            }
          }

          @keyframes authBeam {
            0% {
              transform: translateX(-55%) rotate(-10deg);
              opacity: 0;
            }
            18% {
              opacity: 0.48;
            }
            55% {
              opacity: 0.28;
            }
            100% {
              transform: translateX(55%) rotate(-10deg);
              opacity: 0;
            }
          }

          @keyframes authFloatCard {
            0%, 100% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-8px);
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .auth-blob-one,
            .auth-blob-two,
            .auth-grid,
            .auth-beam,
            .auth-flow-card {
              animation: none !important;
            }
          }
        `}
      </style>

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_18%,rgba(99,102,241,0.24),transparent_30%),radial-gradient(circle_at_82%_70%,rgba(34,211,238,0.30),transparent_34%),radial-gradient(circle_at_55%_12%,rgba(255,255,255,0.85),transparent_28%),linear-gradient(135deg,#f8fbff_0%,#e6f0ff_42%,#cfe8ff_100%)]" />

        <div
          className="auth-blob-one absolute left-[-150px] top-[-150px] h-[480px] w-[480px] rounded-full bg-indigo-300/45 blur-3xl"
          style={{ animation: "authBlobOne 10s ease-in-out infinite" }}
        />

        <div
          className="auth-blob-two absolute bottom-[-220px] right-[-130px] h-[580px] w-[580px] rounded-full bg-cyan-300/48 blur-3xl"
          style={{ animation: "authBlobTwo 12s ease-in-out infinite" }}
        />

        <div
          className="auth-grid absolute inset-0 bg-[linear-gradient(to_right,rgba(30,64,175,0.055)_1px,transparent_1px),linear-gradient(to_bottom,rgba(30,64,175,0.045)_1px,transparent_1px)] bg-[size:72px_72px] opacity-[0.12]"
          style={{ animation: "authGridDrift 16s linear infinite" }}
        />

        <div
          className="auth-beam absolute left-0 top-1/4 h-64 w-[150%] bg-gradient-to-r from-transparent via-white/55 to-transparent blur-2xl"
          style={{ animation: "authBeam 8s ease-in-out infinite" }}
        />

        <div className="absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-white/80 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-cyan-100/80 to-transparent" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl items-center px-5 py-10 sm:px-8 lg:px-10">
        <div className="grid w-full items-center gap-10 lg:grid-cols-[minmax(0,1fr)_430px] xl:gap-16">
          <section className="hidden min-w-0 lg:block">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/80 bg-white/70 px-4 py-2 shadow-sm backdrop-blur-xl">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-white">
                AI
              </span>
              <span className="text-sm font-semibold text-slate-700">
                AI Document Assistant
              </span>
            </div>

            <div className="mt-10 max-w-3xl">
              <p className="mb-5 text-xs font-semibold uppercase tracking-[0.28em] text-indigo-600">
                Không gian tài liệu
              </p>

              <h1 className="text-5xl font-semibold leading-[1.06] tracking-[-0.045em] text-slate-950 xl:text-6xl">
                 Turn documents into usable AI knowledge.
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 xl:text-lg">
                Tải tài liệu, xử lý quy trình AI, tìm kiếm ngữ nghĩa và hỏi đáp
                theo nội dung thật của tài liệu trong một giao diện hiện đại.
              </p>
            </div>

            <div
              className="auth-flow-card mt-12 max-w-2xl rounded-[30px] border border-white/60 bg-white/52 p-4 shadow-[0_28px_90px_rgba(15,23,42,0.14)] backdrop-blur-2xl"
              style={{ animation: "authFloatCard 7s ease-in-out infinite" }}
            >
              <div className="mb-4 border-b border-slate-200/80 px-2 pb-4">
                <p className="text-sm font-semibold text-slate-950">
                  Luồng xử lý AI
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Từ tệp thô đến câu trả lời có căn cứ
                </p>
              </div>

              <div className="grid gap-3">
                {highlights.map((item) => (
                  <div
                    key={item.step}
                    className="group flex gap-4 rounded-2xl border border-white/70 bg-white/72 p-4 shadow-sm transition hover:border-indigo-200 hover:bg-white/90"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white shadow-sm">
                      {item.step}
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-slate-950">
                        {item.label}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 flex items-center gap-6 text-xs font-medium text-slate-500">
              <span>Railway backend</span>
              <span className="h-1 w-1 rounded-full bg-slate-300" />
              <span>Vercel frontend</span>
              <span className="h-1 w-1 rounded-full bg-slate-300" />
              <span>PostgreSQL + pgvector</span>
            </div>
          </section>

          <section className="flex min-h-[calc(100vh-5rem)] items-center justify-center lg:min-h-0">
            {children}
          </section>
        </div>
      </div>
    </main>
  );
}