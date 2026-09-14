import React from 'react';
import {
  Activity,
  Database,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { PageBanner } from '@/components/common/PageBanner';

const AdminDashboard: React.FC = () => {
  return (
    <div className="space-y-6">

      <PageBanner
        title="Trung tâm Quản trị Hệ thống"
        description="Giám sát hoạt động toàn hệ thống OJT, quản lý người dùng và cấu hình AI Engine."
        badge="Quản trị viên cấp cao"
      />

      {/* Tổng quan hệ thống */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Người dùng hệ thống
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                5
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50">
              <Users size={24} className="text-indigo-500" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Trạng thái hệ thống
              </p>
              <p className="mt-2 text-2xl font-bold text-emerald-600">
                Hoạt động
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
              <Activity size={24} className="text-emerald-500" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Đồng bộ dữ liệu
              </p>
              <p className="mt-2 text-2xl font-bold text-emerald-600">
                OK
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
              <Database size={24} className="text-emerald-500" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Bảo mật
              </p>
              <p className="mt-2 text-2xl font-bold text-emerald-600">
                An toàn
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
              <ShieldCheck size={24} className="text-emerald-500" />
            </div>
          </div>
        </div>

      </section>

      {/* Trạng thái quản trị */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">
            Trạng thái hệ thống
          </h2>

          <div className="mt-5 space-y-4">

            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <span className="text-sm text-slate-600">
                Server
              </span>

              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                Hoạt động
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <span className="text-sm text-slate-600">
                Database
              </span>

              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                Hoạt động
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <span className="text-sm text-slate-600">
                AI Engine
              </span>

              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                Hoạt động
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">
                Đồng bộ dữ liệu
              </span>

              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                OK
              </span>
            </div>

          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">
            Các nhóm quản trị
          </h2>

          <div className="mt-5 space-y-3">

            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
              <span className="text-sm font-medium text-slate-700">
                Sinh viên
              </span>
              <span className="text-xs text-slate-500">
                Student
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
              <span className="text-sm font-medium text-slate-700">
                Phòng Đào tạo
              </span>
              <span className="text-xs text-slate-500">
                Education
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
              <span className="text-sm font-medium text-slate-700">
                Quan hệ doanh nghiệp
              </span>
              <span className="text-xs text-slate-500">
                QHDN
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
              <span className="text-sm font-medium text-slate-700">
                Doanh nghiệp
              </span>
              <span className="text-xs text-slate-500">
                Enterprise
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
              <span className="text-sm font-medium text-slate-700">
                Quản trị viên
              </span>
              <span className="text-xs text-slate-500">
                Admin
              </span>
            </div>

          </div>
        </div>

      </section>

    </div>
  );
};

export default AdminDashboard;