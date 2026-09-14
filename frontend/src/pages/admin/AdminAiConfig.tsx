import React, { useState } from 'react';
import {
  Brain,
  CheckCircle2,
  Settings2,
  SlidersHorizontal,
} from 'lucide-react';
import { PageBanner } from '@/components/common/PageBanner';

const AdminAiConfig: React.FC = () => {
  const [lowRisk, setLowRisk] = useState(30);
  const [mediumRisk, setMediumRisk] = useState(60);
  const [modelVersion, setModelVersion] = useState('Risk Model v2.4');

  return (
    <div className="space-y-6">
      <PageBanner
        title="Cấu hình Ngưỡng Rủi ro & Mô hình AI"
        description="Điều chỉnh trọng số đánh giá rủi ro trượt môn và tiêu chí phân bổ OJT."
        badge="Risk Model v2.4"
      />

      {/* Thông tin AI Engine */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="card-glass rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
            <Brain size={21} />
          </div>

          <p className="mt-4 text-sm text-slate-500">
            Mô hình hiện tại
          </p>

          <p className="mt-1 text-xl font-extrabold text-slate-900">
            Risk Model v2.4
          </p>
        </div>

        <div className="card-glass rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
            <CheckCircle2 size={21} />
          </div>

          <p className="mt-4 text-sm text-slate-500">
            Trạng thái
          </p>

          <p className="mt-1 text-xl font-extrabold text-emerald-600">
            Đang hoạt động
          </p>
        </div>

        <div className="card-glass rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
            <Settings2 size={21} />
          </div>

          <p className="mt-4 text-sm text-slate-500">
            Chế độ
          </p>

          <p className="mt-1 text-xl font-extrabold text-slate-900">
            Risk Prediction
          </p>
        </div>
      </section>

      {/* Cấu hình mô hình */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card-glass rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
              <Brain size={21} />
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Mô hình AI
              </h2>

              <p className="text-sm text-slate-500">
                Cấu hình mô hình dự báo rủi ro.
              </p>
            </div>
          </div>

          <div className="mt-6">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Phiên bản mô hình
            </label>

            <select
              value={modelVersion}
              onChange={(e) => setModelVersion(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            >
              <option value="Risk Model v2.4">
                Risk Model v2.4
              </option>
              <option value="Risk Model v2.3">
                Risk Model v2.3
              </option>
            </select>
          </div>

          <div className="mt-5 rounded-xl bg-slate-50 p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600">
                Trạng thái mô hình
              </span>

              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600">
                <CheckCircle2 size={16} />
                Đang hoạt động
              </span>
            </div>
          </div>
        </div>

        {/* Ngưỡng rủi ro */}
        <div className="card-glass rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <SlidersHorizontal size={21} />
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Ngưỡng rủi ro
              </h2>

              <p className="text-sm text-slate-500">
                Thiết lập mức điểm để phân loại rủi ro.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-6">
            <div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-700">
                  Mức rủi ro thấp
                </label>

                <span className="text-sm font-bold text-slate-900">
                  0 – {lowRisk}
                </span>
              </div>

              <input
                type="range"
                min="10"
                max="50"
                value={lowRisk}
                onChange={(e) => setLowRisk(Number(e.target.value))}
                className="mt-3 w-full accent-orange-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-700">
                  Mức rủi ro trung bình
                </label>

                <span className="text-sm font-bold text-slate-900">
                  {lowRisk + 1} – {mediumRisk}
                </span>
              </div>

              <input
                type="range"
                min="40"
                max="80"
                value={mediumRisk}
                onChange={(e) => setMediumRisk(Number(e.target.value))}
                className="mt-3 w-full accent-orange-500"
              />
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-700">
                Mức rủi ro cao
              </p>

              <p className="mt-1 text-sm text-slate-500">
                {mediumRisk + 1} – 100
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trọng số đánh giá */}
      <section className="card-glass rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
            <Settings2 size={21} />
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Tiêu chí đánh giá rủi ro
            </h2>

            <p className="text-sm text-slate-500">
              Các yếu tố được sử dụng trong quá trình đánh giá.
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-800">
              GPA
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Kết quả học tập của sinh viên
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-800">
              Tín chỉ
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Tiến độ tích lũy tín chỉ
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-800">
              Môn tiên quyết
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Tình trạng hoàn thành các môn bắt buộc
            </p>
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600"
        >
          <CheckCircle2 size={17} />
          Lưu cấu hình
        </button>
      </div>
    </div>
  );
};

export default AdminAiConfig;