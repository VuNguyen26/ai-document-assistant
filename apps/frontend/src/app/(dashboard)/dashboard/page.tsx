import Link from "next/link";

const QUICK_LINKS = [
  {
    href: "/documents",
    title: "Documents",
    description: "Upload, quản lý tài liệu và mở document detail.",
    icon: "📄",
  },
  {
    href: "/workspaces",
    title: "Workspaces",
    description: "Không gian làm việc cho nhiều tài liệu.",
    icon: "🗂️",
  },
  {
    href: "/profile",
    title: "Profile",
    description: "Thông tin tài khoản và dữ liệu người dùng.",
    icon: "👤",
  },
  {
    href: "/settings",
    title: "Settings",
    description: "Tuỳ chỉnh trải nghiệm và preferences.",
    icon: "⚙️",
  },
];

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-8 p-8 lg:grid-cols-[1.1fr_0.9fr] lg:p-10">
            <div>
              <p className="text-sm font-medium text-slate-500">
                AI Document Assistant
              </p>
              <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-950">
                Control center for document intelligence
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-500">
                Quản lý tài liệu, điều khiển pipeline AI và mở grounded chat theo
                từng document trong một giao diện sạch, nhanh và production-oriented.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/documents"
                  className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Mở Documents
                </Link>
                <Link
                  href="/workspaces"
                  className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Xem Workspaces
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl">
                  🔍
                </div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Retrieval-ready
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Documents được chuẩn bị để hỗ trợ search và chat grounded.
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl">
                  ⚡
                </div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Fast workflow
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Từ upload đến extract, chunk, embed và chat trong một flow rõ ràng.
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl">
                  💬
                </div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Grounded chat
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Hội thoại gắn trực tiếp với tài liệu thay vì chat AI rời rạc.
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl">
                  🎯
                </div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Production-minded
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  UI và flow đã được dựng theo hướng có thể mở rộng tiếp.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-5">
            <p className="text-sm font-medium text-slate-500">Quick navigation</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
              Explore the product
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {QUICK_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
                  {item.icon}
                </div>
                <h3 className="text-lg font-semibold text-slate-900">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {item.description}
                </p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}