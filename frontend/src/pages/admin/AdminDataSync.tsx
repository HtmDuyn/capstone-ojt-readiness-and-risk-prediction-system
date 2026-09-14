import React from 'react';
import {
  CheckCircle2,
  Clock3,
  Database,
  RefreshCw,
  Users,
} from 'lucide-react';
import { PageBanner } from '@/components/common/PageBanner';

const syncData = [
  {
    name: 'Thông tin sinh viên',
    description: 'Thông tin tài khoản và hồ sơ sinh viên',
    records: '12,458',
    status: 'Đã đồng bộ',
  },
  {
    name: 'Bảng điểm',
    description: 'Điểm học tập và kết quả các môn học',
    records: '186,245',
    status: 'Đã đồng bộ',
  },
  {
    name: 'Tín chỉ',
    description: 'Tín chỉ tích lũy và tiến độ học tập',
    records: '98,632',
    status: 'Đã đồng bộ',
  },
  {
    name: 'Chương trình đào tạo',
    description: 'Khung chương trình và môn học',
    records: '1,284',
    status: 'Đã đồng bộ',
  },
];

const AdminDataSync: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageBanner
        title="Đồng bộ Dữ liệu FPT Edu"
        description="Tích hợp và đồng bộ bảng điểm, tín chỉ từ hệ thống đào tạo trung ương."
        badge="Sync Status: OK"
      />

      {/* Tổng quan đồng bộ */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="card-glass rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
              <Database size={21} />
            </div>

            <CheckCircle2 size={20} className="text-emerald-500" />
          </div>

          <p className="mt-4 text-sm text-slate-500">
            Trạng thái đồng bộ
          </p>

          <p className="mt-1 text-xl font-extrabold text-slate-900">
            Hoàn tất
          </p>
        </div>

        <div className="card-glass rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
            <Clock3 size={21} />
          </div>

          <p className="mt-4 text-sm text-slate-500">
            Lần đồng bộ gần nhất
          </p>

          <p className="mt-1 text-xl font-extrabold text-slate-900">
            Hôm nay
          </p>

          <p className="mt-1 text-xs text-slate-400">
            08:30
          </p>
        </div>

        <div className="card-glass rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
            <Users size={21} />
          </div>

          <p className="mt-4 text-sm text-slate-500">
            Sinh viên
          </p>

          <p className="mt-1 text-xl font-extrabold text-slate-900">
            12,458
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Bản ghi đã đồng bộ
          </p>
        </div>

        <div className="card-glass rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
            <RefreshCw size={21} />
          </div>

          <p className="mt-4 text-sm text-slate-500">
            Dữ liệu đã xử lý
          </p>

          <p className="mt-1 text-xl font-extrabold text-slate-900">
            298,619
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Tổng số bản ghi
          </p>
        </div>
      </section>

      {/* Thông tin đồng bộ */}
      <section className="card-glass rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Dữ liệu đồng bộ
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Theo dõi trạng thái các nhóm dữ liệu từ hệ thống đào tạo.
            </p>
          </div>

          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600"
          >
            <RefreshCw size={17} />
            Chạy đồng bộ ngay
          </button>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-left">
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                  Dữ liệu
                </th>

                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                  Mô tả
                </th>

                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                  Số bản ghi
                </th>

                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                  Trạng thái
                </th>
              </tr>
            </thead>

            <tbody>
              {syncData.map((item) => (
                <tr
                  key={item.name}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70"
                >
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                        <Database size={17} />
                      </div>

                      <span className="text-sm font-semibold text-slate-900">
                        {item.name}
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-4 text-sm text-slate-500">
                    {item.description}
                  </td>

                  <td className="px-4 py-4 text-sm font-semibold text-slate-700">
                    {item.records}
                  </td>

                  <td className="px-4 py-4">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      <CheckCircle2 size={14} />
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Nhật ký đồng bộ gần nhất */}
      <section className="card-glass rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Lần đồng bộ gần nhất
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Thông tin phiên đồng bộ dữ liệu gần nhất.
          </p>
        </div>

        <div className="mt-5 rounded-xl bg-slate-50 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Đồng bộ dữ liệu FPT Edu
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Hôm nay, 08:30
              </p>
            </div>

            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
              <CheckCircle2 size={14} />
              Hoàn tất
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-white p-4">
              <p className="text-xs text-slate-500">
                Bản ghi thành công
              </p>
              <p className="mt-1 text-lg font-bold text-slate-900">
                298,619
              </p>
            </div>

            <div className="rounded-lg bg-white p-4">
              <p className="text-xs text-slate-500">
                Bản ghi lỗi
              </p>
              <p className="mt-1 text-lg font-bold text-slate-900">
                0
              </p>
            </div>

            <div className="rounded-lg bg-white p-4">
              <p className="text-xs text-slate-500">
                Trạng thái
              </p>
              <p className="mt-1 text-lg font-bold text-emerald-600">
                OK
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminDataSync;