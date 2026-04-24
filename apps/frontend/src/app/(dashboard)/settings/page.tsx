"use client";

import Link from "next/link";

const SETTINGS_GROUPS = [
  {
    title: "Giao diện",
    description: "Tùy chọn hiển thị cho trải nghiệm trong bảng điều khiển.",
    items: [
      {
        label: "Chủ đề",
        value: "Sáng",
        note: "Chế độ tối có thể bổ sung sau.",
      },
      {
        label: "Màu nhấn",
        value: "Indigo",
        note: "Được dùng cho nút, nhãn trạng thái và hiệu ứng focus.",
      },
      {
        label: "Mật độ hiển thị",
        value: "Thoải mái",
        note: "Khoảng cách cân bằng cho các quy trình làm việc nhiều tài liệu.",
      },
    ],
  },
  {
    title: "Quy trình AI",
    description: "Hành vi mặc định khi xử lý tài liệu và tạo đầu ra bằng AI.",
    items: [
      {
        label: "Chế độ chat",
        value: "Có căn cứ",
        note: "Câu trả lời nên dựa trên các đoạn nội dung đã xử lý.",
      },
      {
        label: "Trích dẫn",
        value: "Đã bật",
        note: "Hiển thị nguồn khi tìm được các đoạn nội dung liên quan.",
      },
      {
        label: "Ngôn ngữ đầu ra",
        value: "Tự động",
        note: "Có thể tùy chỉnh riêng khi tạo tóm tắt hoặc bản dịch.",
      },
    ],
  },
  {
    title: "Tài khoản",
    description: "Tùy chọn liên quan đến phiên đăng nhập và quyền truy cập.",
    items: [
      {
        label: "Xác thực",
        value: "JWT",
        note: "Access token và refresh token được ứng dụng xử lý.",
      },
      {
        label: "Quyền truy cập",
        value: "Người dùng",
        note: "Các cài đặt riêng cho quản trị viên có thể bổ sung sau.",
      },
      {
        label: "Lưu trữ",
        value: "Phiên cục bộ",
        note: "Frontend hiện đang dùng bộ nhớ xác thực cục bộ.",
      },
    ],
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-8 p-6 sm:p-8 xl:grid-cols-[1.05fr_0.95fr] xl:p-10">
          <div>
            <Link
              href="/dashboard"
              className="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
            >
              ← Quay lại tổng quan
            </Link>

            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-indigo-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Tùy chọn hệ thống
            </div>

            <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              Cài đặt
            </h1>

            <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
              Xem lại các tùy chọn ứng dụng và cấu hình hiện tại đang được sử
              dụng trong không gian làm việc Document AI Assistant.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5 transition hover:border-indigo-100 hover:bg-white hover:shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-xs font-semibold tracking-wide text-indigo-700 ring-1 ring-indigo-100">
                  UI
                </div>
                <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
              </div>

              <p className="text-3xl font-semibold tracking-tight text-slate-950">
                Sáng
              </p>

              <h3 className="mt-2 text-sm font-semibold text-slate-900">
                Chủ đề hiện tại
              </h3>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                Giao diện bảng điều khiển gọn gàng
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5 transition hover:border-indigo-100 hover:bg-white hover:shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-xs font-semibold tracking-wide text-emerald-700 ring-1 ring-emerald-100">
                  RAG
                </div>
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </div>

              <p className="text-3xl font-semibold tracking-tight text-slate-950">
                Bật
              </p>

              <h3 className="mt-2 text-sm font-semibold text-slate-900">
                Câu trả lời có căn cứ
              </h3>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                Sử dụng trích dẫn khi có nguồn phù hợp
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[390px_minmax(0,1fr)]">
        <aside className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-500">
            Trạng thái
          </p>

          <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
            Trạng thái cấu hình
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Các cài đặt này hiện được hiển thị để xem lại. Phần lưu cấu hình vào
            backend có thể bổ sung khi tùy chọn người dùng trở thành phạm vi
            chính thức của sản phẩm.
          </p>

          <div className="mt-6 space-y-3">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
              <p className="text-sm font-semibold text-emerald-800">
                Giao diện đã đồng bộ
              </p>
              <p className="mt-1 text-sm leading-6 text-emerald-700">
                Dashboard, tài liệu, chat và không gian làm việc đang dùng cùng
                một hệ thống giao diện.
              </p>
            </div>

            <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3">
              <p className="text-sm font-semibold text-indigo-800">
                Sẵn sàng mở rộng cài đặt
              </p>
              <p className="mt-1 text-sm leading-6 text-indigo-700">
                Trang này có thể kết nối với settings API sau mà không cần đổi
                bố cục.
              </p>
            </div>
          </div>
        </aside>

        <section className="space-y-6">
          {SETTINGS_GROUPS.map((group) => (
            <article
              key={group.title}
              className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="mb-6">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-500">
                  {group.title}
                </p>

                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                  Cài đặt {group.title}
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  {group.description}
                </p>
              </div>

              <div className="divide-y divide-slate-200 rounded-3xl border border-slate-200 bg-slate-50/70">
                {group.items.map((item) => (
                  <div
                    key={`${group.title}-${item.label}`}
                    className="grid gap-3 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_180px]"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {item.label}
                      </p>

                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        {item.note}
                      </p>
                    </div>

                    <div className="flex sm:justify-end">
                      <span className="inline-flex h-fit rounded-full border border-indigo-100 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700">
                        {item.value}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </section>
      </section>
    </div>
  );
}