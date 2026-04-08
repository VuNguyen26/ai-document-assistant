type ComingSoonPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  badge?: string;
};

export default function ComingSoonPage({
  eyebrow,
  title,
  description,
  badge = "Coming soon",
}: ComingSoonPageProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">{eyebrow}</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                {title}
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-slate-500">
                {description}
              </p>
            </div>

            <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700">
              {badge}
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl">
                ✨
              </div>
              <h2 className="text-lg font-semibold text-slate-900">
                Thiết kế sẵn sàng
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Màn hình này đã có layout đúng hệ thống và sẵn sàng để nối API.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl">
                🔌
              </div>
              <h2 className="text-lg font-semibold text-slate-900">
                Dễ mở rộng
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Có thể nối dữ liệu thật ngay khi backend cho feature này sẵn sàng.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl">
                🚀
              </div>
              <h2 className="text-lg font-semibold text-slate-900">
                Đồng bộ giao diện
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Giữ cùng visual language với Documents và Chat để sản phẩm trông hoàn chỉnh.
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl">
              🛠️
            </div>
            <h3 className="text-lg font-semibold text-slate-900">
              Module này sẽ được triển khai tiếp
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Tạm thời đây là màn hình placeholder đẹp để app không còn route rỗng.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}