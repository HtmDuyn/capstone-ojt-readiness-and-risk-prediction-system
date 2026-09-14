import React from 'react';
import {
  Activity,
  Bot,
  CheckCircle2,
  Database,
  Server,
} from 'lucide-react';
import { PageBanner } from '@/components/common/PageBanner';

const systemStatus = [
  {
    name: 'Server',
    description: 'Máy chủ ứng dụng',
    status: 'Hoạt động',
    value: '99.9%',
    icon: Server,
  },
  {
    name: 'Database',
    description: 'Cơ sở dữ liệu',
    status: 'Hoạt động',
    value: '99.8%',
    icon: Database,
  },
  {
    name: 'AI Engine',
    description: 'Mô hình dự báo rủi ro',
    status: 'Hoạt động',
    value: '98.7%',
    icon: Bot,
  },
  {
    name: 'Data Sync',
    description: 'Đồng bộ dữ liệu',
    status: 'Hoạt động',
    value: '100%',
    icon: Activity,
  },
];

const apiMetrics = [
  {
    name: 'API Response Time',
    value: '142 ms',
    description: 'Thời gian phản hồi trung bình',
  },
  {
    name: 'AI Prediction',
    value: '286 ms',
    description: 'Thời gian dự báo AI trung bình',
  },
  {
    name: 'System Requests',
    value: '1,248',
    description: 'Số request trong phiên',
  },
];

const AdminSystemMetrics: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageBanner
        title="Chỉ số tải & Hoạt động AI Engine"
        description="Theo dõi tài nguyên server, thời gian phản hồi API và các tác vụ dự báo nền."
        badge="Realtime Monitor"
      />

      {/* Trạng thái hệ thống */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {systemStatus.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.name}
              className="card-glass rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  <Icon size={21} />
                </div>

                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 size={14} />
                  {item.status}
                </span>
              </div>

              <div className="mt-4">
                <h2 className="text-base font-bold text-slate-900">
                  {item.name}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {item.description}
                </p>

                <p className="mt-4 text-2xl font-extrabold text-slate-900">
                  {item.value}
                </p>
              </div>
            </div>
          );
        })}
      </section>

      {/* Chỉ số hoạt động */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card-glass rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Chỉ số hệ thống
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Các chỉ số hoạt động hiện tại của hệ thống.
            </p>
          </div>

          <div className="mt-6 space-y-5">
            {apiMetrics.map((item) => (
              <div key={item.name}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {item.name}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {item.description}
                    </p>
                  </div>

                  <span className="text-base font-bold text-slate-900">
                    {item.value}
                  </span>
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full w-3/4 rounded-full bg-orange-400" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Engine */}
        <div className="card-glass rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
              <Bot size={21} />
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900">
                AI Engine
              </h2>
              <p className="text-sm text-slate-500">
                Hoạt động dự báo nền
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-xl bg-slate-50 p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600">
                Trạng thái
              </span>

              <span className="font-semibold text-emerald-600">
                Đang hoạt động
              </span>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600">
                Phiên bản mô hình
              </span>

              <span className="font-semibold text-slate-900">
                Risk Model v2.4
              </span>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600">
                Tác vụ dự báo
              </span>

              <span className="font-semibold text-slate-900">
                Đang xử lý bình thường
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminSystemMetrics;