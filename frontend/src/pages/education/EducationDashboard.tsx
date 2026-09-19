import React from 'react';
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  Clock3,
  ArrowRight,
} from 'lucide-react';
import { PageBanner } from '@/components/common/PageBanner';

export const EducationDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Banner */}
      <PageBanner
        title="Cổng Quản lý Học vụ & Điều kiện OJT"
        description="Giám sát tiến độ học tập toàn khóa, xét duyệt điều kiện tín chỉ và cảnh báo học vụ."
        badge="Phòng Đào tạo (PĐT)"
      />

      {/* Tổng quan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="card-glass p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Tổng sinh viên
              </p>
              <p className="mt-2 text-2xl font-extrabold text-slate-900">
                1,248
              </p>
            </div>

            <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <Users size={22} />
            </div>
          </div>
        </div>

        <div className="card-glass p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Đủ điều kiện OJT
              </p>
              <p className="mt-2 text-2xl font-extrabold text-slate-900">
                986
              </p>
            </div>

            <div className="w-11 h-11 rounded-xl bg-green-100 text-green-600 flex items-center justify-center">
              <CheckCircle2 size={22} />
            </div>
          </div>
        </div>

        <div className="card-glass p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Có rủi ro học vụ
              </p>
              <p className="mt-2 text-2xl font-extrabold text-slate-900">
                87
              </p>
            </div>

            <div className="w-11 h-11 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
              <AlertTriangle size={22} />
            </div>
          </div>
        </div>

        <div className="card-glass p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Chờ xét duyệt
              </p>
              <p className="mt-2 text-2xl font-extrabold text-slate-900">
                175
              </p>
            </div>

            <div className="w-11 h-11 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
              <Clock3 size={22} />
            </div>
          </div>
        </div>
      </div>

      {/* Tình trạng OJT và cảnh báo */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Điều kiện OJT */}
        <div className="card-glass p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Tình trạng điều kiện OJT
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Tổng hợp tình trạng điều kiện của sinh viên.
              </p>
            </div>

            <CheckCircle2 className="text-green-500" size={22} />
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="font-medium text-slate-700">
                  Đủ điều kiện
                </span>
                <span className="font-bold text-slate-900">
                  986
                </span>
              </div>

              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-green-500"
                  style={{ width: '79%' }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="font-medium text-slate-700">
                  Thiếu điều kiện
                </span>
                <span className="font-bold text-slate-900">
                  175
                </span>
              </div>

              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-orange-500"
                  style={{ width: '14%' }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="font-medium text-slate-700">
                  Đang cần kiểm tra
                </span>
                <span className="font-bold text-slate-900">
                  87
                </span>
              </div>

              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-red-500"
                  style={{ width: '7%' }}
                />
              </div>
            </div>
          </div>

          <button
            type="button"
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-orange-600 hover:text-orange-700"
          >
            Xem danh sách xét điều kiện
            <ArrowRight size={16} />
          </button>
        </div>

        {/* Cảnh báo học vụ */}
        <div className="card-glass p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Cảnh báo rủi ro học vụ
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Sinh viên có nguy cơ trễ tiến độ hoặc thiếu môn tiên quyết.
              </p>
            </div>

            <AlertTriangle className="text-red-500" size={22} />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 rounded-xl bg-red-50 border border-red-100">
              <div>
                <p className="font-semibold text-slate-800">
                  Nguy cơ cao
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Cần được kiểm tra và xử lý sớm
                </p>
              </div>

              <span className="text-lg font-extrabold text-red-600">
                24
              </span>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-orange-50 border border-orange-100">
              <div>
                <p className="font-semibold text-slate-800">
                  Nguy cơ trung bình
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Cần theo dõi tiến độ học tập
                </p>
              </div>

              <span className="text-lg font-extrabold text-orange-600">
                38
              </span>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-yellow-50 border border-yellow-100">
              <div>
                <p className="font-semibold text-slate-800">
                  Cần theo dõi
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Có dấu hiệu ảnh hưởng tiến độ
                </p>
              </div>

              <span className="text-lg font-extrabold text-yellow-600">
                25
              </span>
            </div>
          </div>

          <button
            type="button"
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-orange-600 hover:text-orange-700"
          >
            Xem cảnh báo học vụ
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default EducationDashboard;