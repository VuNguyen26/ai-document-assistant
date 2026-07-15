import Link from "next/link";

const FEATURES = [
  {
    index: "01",
    eyebrow: "Tài liệu",
    title: "Một nơi cho toàn bộ tài liệu",
    description:
      "Tải lên PDF, DOCX và TXT, theo dõi trạng thái xử lý và sắp xếp theo từng không gian làm việc.",
    accent: "bg-indigo-400",
    span: "md:col-span-2 xl:col-span-6",
  },
  {
    index: "02",
    eyebrow: "RAG",
    title: "Hỏi đáp có căn cứ",
    description:
      "Mỗi câu trả lời được xây dựng từ nội dung tài liệu và đi kèm trích dẫn.",
    accent: "bg-cyan-400",
    span: "xl:col-span-3",
  },
  {
    index: "03",
    eyebrow: "Tái sử dụng",
    title: "Tóm tắt và dịch",
    description:
      "Chuyển nội dung dài thành bản tóm tắt, bản dịch hoặc audio dễ sử dụng.",
    accent: "bg-violet-400",
    span: "xl:col-span-3",
  },
  {
    index: "04",
    eyebrow: "Riêng tư theo phiên",
    title: "Bắt đầu ngay mà không cần tạo tài khoản",
    description:
      "Mỗi trình duyệt có một phiên khách riêng. Tài liệu, cuộc trò chuyện và kết quả AI được tách biệt với những người dùng khác.",
    accent: "bg-emerald-400",
    span: "md:col-span-2 xl:col-span-12",
  },
];

const WORKFLOW = [
  {
    step: "01",
    title: "Tải lên",
    description: "Thêm tài liệu vào không gian làm việc riêng của bạn.",
  },
  {
    step: "02",
    title: "Xử lý",
    description:
      "Hệ thống trích xuất văn bản, chia đoạn và chuẩn bị dữ liệu tìm kiếm.",
  },
  {
    step: "03",
    title: "Khai thác",
    description: "Chat, tóm tắt, dịch hoặc tạo audio từ nội dung đã xử lý.",
  },
];

const DOCUMENTS = [
  {
    type: "PDF",
    name: "Bao-cao-nghien-cuu.pdf",
    meta: "24 trang",
    active: true,
  },
  {
    type: "DOC",
    name: "Bien-ban-cuoc-hop.docx",
    meta: "12 trang",
    active: false,
  },
  {
    type: "TXT",
    name: "Ghi-chu-du-an.txt",
    meta: "8 KB",
    active: false,
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#070b16] text-white">
      <div className="relative isolate">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10"
        >
          <div className="absolute left-[-18rem] top-[-20rem] h-[44rem] w-[44rem] rounded-full bg-indigo-600/20 blur-[120px]" />
          <div className="absolute right-[-16rem] top-[5rem] h-[38rem] w-[38rem] rounded-full bg-cyan-500/15 blur-[120px]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.045)_1px,transparent_1px)] bg-[size:72px_72px]" />
          <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-indigo-950/35 to-transparent" />
        </div>

        <header className="relative border-b border-white/[0.07]">
          <div className="mx-auto flex max-w-[1280px] items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
            <Link
              href="/"
              aria-label="AI Document Assistant"
              className="flex items-center gap-3"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white text-[13px] font-bold tracking-[-0.03em] text-slate-950 shadow-lg shadow-black/20">
                AI
              </span>

              <span>
                <span className="block text-[14px] font-semibold tracking-[-0.02em] text-white">
                  Document Assistant
                </span>
                <span className="mt-0.5 block text-[11px] font-medium text-slate-500">
                  Không gian tri thức AI
                </span>
              </span>
            </Link>

            <nav className="flex items-center gap-6">
              <div className="hidden items-center gap-6 md:flex">
                <a
                  href="#features"
                  className="text-sm font-medium text-slate-400 transition hover:text-white"
                >
                  Tính năng
                </a>
                <a
                  href="#workflow"
                  className="text-sm font-medium text-slate-400 transition hover:text-white"
                >
                  Quy trình
                </a>
              </div>

              <Link
                href="/dashboard"
                className="inline-flex min-h-10 items-center justify-center rounded-xl bg-white px-4 text-sm font-semibold text-slate-950 shadow-lg shadow-black/15 transition hover:bg-slate-200"
              >
                Bắt đầu ngay
              </Link>
            </nav>
          </div>
        </header>

        <section className="mx-auto grid min-h-[calc(100vh-81px)] max-w-[1280px] items-center gap-16 px-5 py-16 sm:px-8 lg:grid-cols-[0.98fr_1.02fr] lg:px-10 lg:py-24">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.8)]" />
              Workspace AI cho tài liệu
            </div>

            <h1 className="mt-7 text-balance text-[clamp(3.25rem,6vw,5.55rem)] font-semibold leading-[0.98] tracking-[-0.058em] text-white">
              Từ tài liệu thô đến kiến thức có thể hành động.
            </h1>

            <p className="mt-7 max-w-xl text-pretty text-base leading-8 text-slate-400 sm:text-[17px]">
              Tải tài liệu, đặt câu hỏi có trích dẫn, tóm tắt, dịch và tạo audio
              trong một không gian làm việc riêng tư cho trình duyệt của bạn.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/dashboard"
                className="inline-flex min-h-13 items-center justify-center gap-2 rounded-xl bg-indigo-500 px-6 text-sm font-semibold text-white shadow-[0_16px_45px_rgba(99,102,241,0.28)] transition hover:bg-indigo-400"
              >
                <span>Bắt đầu miễn phí</span>
                <span aria-hidden="true">→</span>
              </Link>

              <a
                href="#workflow"
                className="inline-flex min-h-13 items-center justify-center rounded-xl border border-white/12 bg-white/[0.045] px-6 text-sm font-semibold text-slate-200 transition hover:border-white/20 hover:bg-white/[0.08]"
              >
                Xem quy trình
              </a>
            </div>

            <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-white/[0.07] pt-6 text-xs font-medium text-slate-500">
              <span>Không cần tài khoản</span>
              <span className="hidden h-1 w-1 rounded-full bg-slate-700 sm:block" />
              <span>Dữ liệu tách biệt theo phiên</span>
              <span className="hidden h-1 w-1 rounded-full bg-slate-700 sm:block" />
              <span>Sử dụng ngay</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[620px] lg:justify-self-end">
            <div
              aria-hidden="true"
              className="absolute inset-12 rounded-full bg-indigo-500/25 blur-[90px]"
            />

            <div className="relative rounded-[28px] border border-white/[0.11] bg-white/[0.055] p-2.5 shadow-[0_45px_140px_rgba(0,0,0,0.52)] backdrop-blur-xl">
              <div className="overflow-hidden rounded-[22px] border border-white/[0.08] bg-[#0b1220]">
                <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500 text-[11px] font-bold text-white">
                      AI
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-white">
                        Không gian nghiên cứu
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        3 tài liệu đã xử lý
                      </p>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/[0.08] px-2.5 py-1 text-[10px] font-semibold text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Sẵn sàng
                  </span>
                </div>

                <div className="grid sm:grid-cols-[0.8fr_1.2fr]">
                  <div className="border-b border-white/[0.07] p-4 sm:border-b-0 sm:border-r">
                    <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                      Tài liệu
                    </p>

                    <div className="mt-3 space-y-2">
                      {DOCUMENTS.map((document) => (
                        <div
                          key={document.name}
                          className={
                            document.active
                              ? "rounded-xl border border-indigo-400/20 bg-indigo-400/[0.09] p-3"
                              : "rounded-xl border border-transparent p-3"
                          }
                        >
                          <div className="flex items-start gap-3">
                            <span
                              className={
                                document.active
                                  ? "flex h-8 min-w-8 items-center justify-center rounded-lg bg-indigo-400/15 px-1.5 text-[9px] font-bold text-indigo-300"
                                  : "flex h-8 min-w-8 items-center justify-center rounded-lg bg-white/[0.055] px-1.5 text-[9px] font-bold text-slate-500"
                              }
                            >
                              {document.type}
                            </span>

                            <div className="min-w-0">
                              <p
                                className={
                                  document.active
                                    ? "truncate text-[11px] font-medium text-white"
                                    : "truncate text-[11px] font-medium text-slate-400"
                                }
                              >
                                {document.name}
                              </p>
                              <p className="mt-1 text-[10px] text-slate-600">
                                {document.meta}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-indigo-300">
                        Câu trả lời có căn cứ
                      </p>
                      <span className="text-[10px] text-slate-600">
                        3 nguồn
                      </span>
                    </div>

                    <h2 className="mt-4 text-[15px] font-semibold leading-6 text-white">
                      Những kết luận chính của báo cáo là gì?
                    </h2>

                    <div className="mt-4 rounded-xl border border-white/[0.075] bg-white/[0.035] p-4">
                      <p className="text-[12px] leading-6 text-slate-300">
                        Báo cáo xác định ba nhóm cơ hội chính: tự động hóa quy
                        trình, cải thiện chất lượng dữ liệu và rút ngắn thời
                        gian ra quyết định.
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {["Trang 6", "Trang 11", "Trang 18"].map((source) => (
                          <span
                            key={source}
                            className="rounded-md border border-white/[0.08] bg-white/[0.04] px-2 py-1 text-[9px] font-medium text-slate-500"
                          >
                            {source}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-2 rounded-xl border border-indigo-400/15 bg-indigo-400/[0.07] px-3 py-3">
                      <span className="h-2 w-2 rounded-full bg-indigo-400" />
                      <p className="text-[10px] font-medium text-indigo-200">
                        Phân tích dựa trên nội dung đã xử lý
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <section
        id="features"
        className="border-y border-white/[0.07] bg-[#0a1020] py-24 sm:py-28"
      >
        <div className="mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-300">
                Tính năng
              </p>
              <h2 className="mt-4 text-balance text-3xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
                Tập trung vào nội dung, không phải công cụ.
              </h2>
            </div>

            <p className="max-w-2xl text-base leading-8 text-slate-400 lg:justify-self-end">
              Một quy trình liền mạch từ lúc tải tệp đến khi nhận được câu trả
              lời, bản tóm tắt hoặc bản dịch có thể sử dụng ngay.
            </p>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-12">
            {FEATURES.map((feature) => (
              <article
                key={feature.index}
                className={`${feature.span} group rounded-[24px] border border-white/[0.075] bg-white/[0.035] p-6 transition duration-300 hover:-translate-y-1 hover:border-white/[0.14] hover:bg-white/[0.055] sm:p-7`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-600">
                    {feature.index}
                  </span>
                  <span className={`h-2 w-2 rounded-full ${feature.accent}`} />
                </div>

                <p className="mt-10 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {feature.eyebrow}
                </p>
                <h3 className="mt-3 max-w-xl text-xl font-semibold tracking-[-0.025em] text-white sm:text-2xl">
                  {feature.title}
                </h3>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="workflow" className="bg-[#070b16] py-24 sm:py-32">
        <div className="mx-auto grid max-w-[1280px] gap-14 px-5 sm:px-8 lg:grid-cols-[0.82fr_1.18fr] lg:px-10">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
              Quy trình
            </p>
            <h2 className="mt-4 max-w-lg text-balance text-3xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
              Ba bước từ tệp thô đến kết quả AI.
            </h2>
            <p className="mt-6 max-w-lg text-base leading-8 text-slate-400">
              Không cần thiết lập phức tạp. Phiên làm việc được tự động khởi tạo
              khi bạn bắt đầu.
            </p>
          </div>

          <div className="border-t border-white/[0.08]">
            {WORKFLOW.map((item) => (
              <article
                key={item.step}
                className="grid gap-5 border-b border-white/[0.08] py-8 sm:grid-cols-[72px_1fr] sm:py-10"
              >
                <span className="font-mono text-sm text-cyan-300">
                  {item.step}
                </span>
                <div>
                  <h3 className="text-2xl font-semibold tracking-[-0.025em] text-white">
                    {item.title}
                  </h3>
                  <p className="mt-3 max-w-xl text-sm leading-7 text-slate-400 sm:text-base">
                    {item.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#070b16] px-5 pb-24 sm:px-8 sm:pb-32 lg:px-10">
        <div className="mx-auto max-w-[1280px] overflow-hidden rounded-[32px] border border-white/[0.1] bg-[linear-gradient(135deg,#eef2ff_0%,#c7d2fe_48%,#67e8f9_120%)] p-8 text-slate-950 shadow-[0_40px_120px_rgba(79,70,229,0.18)] sm:p-12 lg:flex lg:items-end lg:justify-between lg:gap-16">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-700">
              Bắt đầu ngay
            </p>
            <h2 className="mt-4 text-balance text-3xl font-semibold tracking-[-0.045em] sm:text-5xl">
              Dành ít thời gian hơn để tìm kiếm. Dành nhiều thời gian hơn để
              hiểu.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-700">
              Bắt đầu bằng một phiên khách riêng tư. Không cần tạo tài khoản.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="mt-8 inline-flex min-h-14 shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-950 px-7 text-sm font-semibold text-white shadow-xl transition hover:bg-slate-800 lg:mt-0"
          >
            <span>Vào không gian làm việc</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/[0.07] bg-[#070b16]">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-3 px-5 py-8 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
          <p>AI Document Assistant</p>
          <p>Next.js · NestJS · PostgreSQL · pgvector</p>
        </div>
      </footer>
    </main>
  );
}
