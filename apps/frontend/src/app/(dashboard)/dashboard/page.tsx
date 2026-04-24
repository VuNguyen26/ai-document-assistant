import Link from "next/link";

const STATS = [
  {
    label: "Tài liệu",
    value: "0",
    description: "Tệp đã tải lên",
    code: "DOC",
    accent: "bg-indigo-50 text-indigo-700 ring-indigo-100",
    dot: "bg-indigo-500",
  },
  {
    label: "Sẵn sàng",
    value: "0",
    description: "Tệp đã xử lý",
    code: "RDY",
    accent: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    dot: "bg-emerald-500",
  },
  {
    label: "Cuộc trò chuyện",
    value: "0",
    description: "Phiên đã lưu",
    code: "CHT",
    accent: "bg-cyan-50 text-cyan-700 ring-cyan-100",
    dot: "bg-cyan-500",
  },
  {
    label: "Không gian",
    value: "0",
    description: "Nhóm tài liệu",
    code: "WSP",
    accent: "bg-violet-50 text-violet-700 ring-violet-100",
    dot: "bg-violet-500",
  },
];

const QUICK_ACTIONS = [
  {
    href: "/documents",
    title: "Tải tài liệu",
    description: "Thêm tệp PDF hoặc DOCX và bắt đầu xử lý.",
    primary: true,
  },
  {
    href: "/documents",
    title: "Mở danh sách tài liệu",
    description: "Xem các tệp đã tải lên và trạng thái xử lý.",
    primary: false,
  },
  {
    href: "/summaries",
    title: "Tạo bản tóm tắt",
    description: "Tạo phiên bản ngắn gọn hơn từ nội dung đã chọn.",
    primary: false,
  },
  {
    href: "/translations",
    title: "Dịch nội dung",
    description: "Tạo bản dịch cho nội dung trong tài liệu.",
    primary: false,
  },
];

const WORKFLOW_STEPS = [
  {
    step: "01",
    title: "Tải lên",
    description: "Thêm tài liệu vào không gian làm việc.",
  },
  {
    step: "02",
    title: "Xử lý",
    description: "Trích xuất văn bản, chia nhỏ nội dung và chuẩn bị dữ liệu tìm kiếm.",
  },
  {
    step: "03",
    title: "Hỏi đáp",
    description: "Bắt đầu cuộc trò chuyện dựa trên nội dung tài liệu.",
  },
  {
    step: "04",
    title: "Tái sử dụng",
    description: "Tóm tắt, dịch hoặc tạo audio từ kết quả.",
  },
];

const PRODUCT_MODULES = [
  {
    href: "/documents",
    title: "Tài liệu",
    description: "Tải lên, quản lý và theo dõi trạng thái xử lý.",
    bar: "bg-indigo-500",
  },
  {
    href: "/workspaces",
    title: "Không gian làm việc",
    description: "Nhóm các tài liệu liên quan vào từng khu vực làm việc.",
    bar: "bg-violet-500",
  },
  {
    href: "/summaries",
    title: "Tóm tắt",
    description: "Tạo bản tóm tắt ngắn gọn từ nội dung tài liệu.",
    bar: "bg-cyan-500",
  },
  {
    href: "/translations",
    title: "Dịch thuật",
    description: "Dịch nội dung đã trích xuất sang ngôn ngữ khác.",
    bar: "bg-emerald-500",
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-8 p-6 sm:p-8 xl:grid-cols-[1.05fr_0.95fr] xl:p-10">
          <div className="flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-indigo-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Tổng quan không gian làm việc
              </div>

              <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                Quản lý tài liệu trong một không gian làm việc
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                Tải tài liệu lên, theo dõi trạng thái xử lý và sử dụng tài liệu
                cho chat, tóm tắt và dịch thuật.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/documents"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-700"
              >
                <span>Tải tài liệu</span>
                <span aria-hidden="true">→</span>
              </Link>

              <Link
                href="/workspaces"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
              >
                Xem không gian làm việc
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {STATS.map((item) => (
              <div
                key={item.label}
                className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5 transition hover:border-indigo-100 hover:bg-white hover:shadow-sm"
              >
                <div className="mb-5 flex items-center justify-between">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-2xl text-xs font-semibold tracking-wide ring-1 ${item.accent}`}
                  >
                    {item.code}
                  </div>

                  <span className={`h-2.5 w-2.5 rounded-full ${item.dot}`} />
                </div>

                <p className="text-3xl font-semibold tracking-tight text-slate-950">
                  {item.value}
                </p>

                <h3 className="mt-2 text-sm font-semibold text-slate-900">
                  {item.label}
                </h3>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-500">
              Thao tác nhanh
            </p>

            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              Bắt đầu quy trình
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {QUICK_ACTIONS.map((item) => (
              <Link
                key={`${item.href}-${item.title}`}
                href={item.href}
                className={`group rounded-3xl border p-6 shadow-sm transition hover:shadow-md ${
                  item.primary
                    ? "border-indigo-600 bg-indigo-600 text-white shadow-indigo-600/15 hover:bg-indigo-700"
                    : "border-slate-200 bg-white text-slate-950 hover:border-indigo-200 hover:bg-indigo-50/50"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold tracking-tight">
                      {item.title}
                    </h3>

                    <p
                      className={`mt-2 text-sm leading-6 ${
                        item.primary ? "text-indigo-100" : "text-slate-500"
                      }`}
                    >
                      {item.description}
                    </p>
                  </div>

                  <span
                    aria-hidden="true"
                    className={`mt-1 text-sm transition group-hover:translate-x-0.5 ${
                      item.primary ? "text-white" : "text-indigo-500"
                    }`}
                  >
                    →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <aside className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-500">
                Quy trình
              </p>

              <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
                Luồng chính
              </h2>
            </div>

            <span className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
              4 bước
            </span>
          </div>

          <div className="mt-6 space-y-4">
            {WORKFLOW_STEPS.map((item, index) => (
              <div key={item.step} className="relative flex gap-4">
                {index !== WORKFLOW_STEPS.length - 1 ? (
                  <div className="absolute left-5 top-11 h-[calc(100%-1rem)] w-px bg-slate-200" />
                ) : null}

                <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-100">
                  {item.step}
                </div>

                <div className="pb-2">
                  <h3 className="text-sm font-semibold text-slate-950">
                    {item.title}
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section>
        <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-500">
              Chức năng
            </p>

            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              Công cụ làm việc
            </h2>
          </div>

          <Link
            href="/documents"
            className="text-sm font-semibold text-indigo-600 transition hover:text-indigo-700"
          >
            Đi tới tài liệu →
          </Link>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {PRODUCT_MODULES.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
            >
              <div
                className={`mb-5 h-1.5 w-10 rounded-full ${item.bar} transition group-hover:w-14`}
              />

              <h3 className="text-lg font-semibold tracking-tight text-slate-950">
                {item.title}
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                {item.description}
              </p>

              <div className="mt-5 text-sm font-semibold text-slate-400 transition group-hover:text-indigo-600">
                Mở chức năng →
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}