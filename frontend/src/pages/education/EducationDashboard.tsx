import React from 'react';
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  Clock3,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  UserCheck,
  BookOpen,
  Bell,
  ArrowRight,
  Upload,
  School,
  Bot,
} from 'lucide-react';

export const EducationDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* ==================== HEADER ==================== */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-orange-600">
            Trang chủ → Tổng quan
          </p>

          <h1 className="mt-1 text-2xl font-extrabold text-slate-900">
            Tổng quan Phòng Đào tạo
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Theo dõi tiến độ học tập, điều kiện OJT và rủi ro của sinh viên.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Xuất báo cáo
          </button>

          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-orange-600"
          >
            <Clock3 size={16} />
            Khởi tạo kỳ OJT
          </button>
        </div>
      </div>

      {/* ==================== TỔNG QUAN ==================== */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Tổng sinh viên */}
        <div className="card-glass p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Tổng sinh viên
              </p>

              <p className="mt-2 text-2xl font-extrabold text-slate-900">
                5,240
              </p>

              <div className="mt-2 flex items-center gap-1 text-xs font-medium text-green-600">
                <TrendingUp size={14} />
                <span>5.2% so với kỳ trước</span>
              </div>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <Users size={21} />
            </div>
          </div>
        </div>

        {/* Đủ điều kiện */}
        <div className="card-glass p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Đủ điều kiện OJT
              </p>

              <p className="mt-2 text-2xl font-extrabold text-slate-900">
                3,850
              </p>

              <p className="mt-2 text-xs font-medium text-green-600">
                73.5% tổng sinh viên
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100 text-green-600">
              <CheckCircle2 size={21} />
            </div>
          </div>
        </div>

        {/* Chưa đủ điều kiện */}
        <div className="card-glass p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Chưa đủ điều kiện
              </p>

              <p className="mt-2 text-2xl font-extrabold text-red-600">
                1,390
              </p>

              <p className="mt-2 text-xs font-medium text-red-500">
                Cần theo dõi điều kiện OJT
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-100 text-red-600">
              <AlertTriangle size={21} />
            </div>
          </div>
        </div>

        {/* Hồ sơ chờ duyệt */}
        <div className="card-glass p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Hồ sơ chờ duyệt
              </p>

              <p className="mt-2 text-2xl font-extrabold text-slate-900">
                175
              </p>

              <p className="mt-2 text-xs font-medium text-orange-600">
                Đang chờ Phòng Đào tạo xử lý
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
              <Clock3 size={21} />
            </div>
          </div>
        </div>
      </div>

      {/* ==================== RISK SUMMARY ==================== */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* Risk cao */}
        <div className="card-glass border-l-4 border-red-500 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">
                Risk cao
              </p>
              <p className="mt-1 text-xl font-extrabold text-slate-900">
                150
              </p>
            </div>

            <ShieldAlert className="text-red-500" size={22} />
          </div>
        </div>

        {/* Risk trung bình */}
        <div className="card-glass border-l-4 border-orange-400 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">
                Risk trung bình
              </p>
              <p className="mt-1 text-xl font-extrabold text-slate-900">
                420
              </p>
            </div>

            <AlertTriangle className="text-orange-500" size={22} />
          </div>
        </div>

        {/* Risk thấp */}
        <div className="card-glass border-l-4 border-green-500 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">
                Risk thấp
              </p>
              <p className="mt-1 text-xl font-extrabold text-slate-900">
                4,670
              </p>
            </div>

            <CheckCircle2 className="text-green-500" size={22} />
          </div>
        </div>

        {/* Lớp hỗ trợ */}
        <div className="card-glass border-l-4 border-blue-500 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">
                Lớp hỗ trợ
              </p>
              <p className="mt-1 text-xl font-extrabold text-slate-900">
                12
              </p>
            </div>

            <School className="text-blue-500" size={22} />
          </div>
        </div>
      </div>

      {/* ==================== BIỂU ĐỒ ==================== */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Xu hướng Risk */}
        <div className="card-glass p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Xu hướng Risk theo kỳ
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Số lượng sinh viên có mức Risk cao theo từng kỳ.
              </p>
            </div>

            <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600">
              3 năm gần đây
            </span>
          </div>

          <div className="mt-6 flex h-48 items-end gap-3 border-b border-slate-200 px-2">
            {[
              { label: 'Spr 23', value: 42 },
              { label: 'Sum 23', value: 51 },
              { label: 'Fall 23', value: 47 },
              { label: 'Spr 24', value: 68 },
              { label: 'Sum 24', value: 61 },
              { label: 'Fall 24', value: 82 },
              { label: 'Spr 25', value: 74 },
            ].map((item) => (
              <div
                key={item.label}
                className="flex h-full flex-1 flex-col items-center justify-end gap-2"
              >
                <span className="text-[10px] font-semibold text-slate-500">
                  {item.value}
                </span>

                <div
                  className="w-full max-w-8 rounded-t-md bg-orange-400 transition-all"
                  style={{
                    height: `${Math.max(item.value, 20)}%`,
                  }}
                />

                <span className="text-[9px] text-slate-400">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Phân bố Risk */}
        <div className="card-glass p-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Phân bố Risk Score
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Phân loại sinh viên theo kết quả dự báo Risk.
            </p>
          </div>

          <div className="mt-5 flex flex-col items-center justify-center sm:flex-row sm:gap-10">
            {/* Donut */}
            <div
              className="relative flex h-44 w-44 items-center justify-center rounded-full"
              style={{
                background:
                  'conic-gradient(#22c55e 0deg 321deg, #f97316 321deg 350deg, #dc2626 350deg 360deg)',
              }}
            >
              <div className="flex h-32 w-32 flex-col items-center justify-center rounded-full bg-white">
                <span className="text-2xl font-extrabold text-slate-900">
                  5.2k
                </span>

                <span className="text-xs text-slate-500">
                  Tổng cộng
                </span>
              </div>
            </div>

            <div className="mt-5 w-full space-y-3 sm:mt-0 sm:w-auto">
              <div className="flex items-center justify-between gap-8 text-xs">
                <span className="flex items-center gap-2 text-slate-600">
                  <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                  Risk thấp
                </span>
                <span className="font-bold text-slate-900">
                  89.1%
                </span>
              </div>

              <div className="flex items-center justify-between gap-8 text-xs">
                <span className="flex items-center gap-2 text-slate-600">
                  <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
                  Risk trung bình
                </span>
                <span className="font-bold text-slate-900">
                  8.0%
                </span>
              </div>

              <div className="flex items-center justify-between gap-8 text-xs">
                <span className="flex items-center gap-2 text-slate-600">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-600" />
                  Risk cao
                </span>
                <span className="font-bold text-slate-900">
                  2.9%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== TIẾN ĐỘ + ĐIỀU KIỆN ==================== */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Tiến độ học tập */}
        <div className="card-glass p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Tiến độ học tập theo khóa
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Theo dõi mức độ hoàn thành chương trình của sinh viên.
              </p>
            </div>

            <BookOpen className="text-blue-500" size={21} />
          </div>

          <div className="mt-6 space-y-5">
            {[
              { label: 'Khóa 18 (K18)', value: 98 },
              { label: 'Khóa 17 (K17)', value: 75 },
              { label: 'Khóa 18 (K18)', value: 42 },
            ].map((item) => (
              <div key={item.label}>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700">
                    {item.label}
                  </span>

                  <span className="text-xs font-semibold text-slate-500">
                    {item.value}% hoàn thành
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-blue-500"
                    style={{ width: `${item.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Điều kiện OJT */}
        <div className="card-glass p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Thống kê điều kiện OJT
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Tỷ lệ sinh viên đủ và chưa đủ điều kiện OJT.
              </p>
            </div>

            <UserCheck className="text-green-500" size={21} />
          </div>

          <div className="mt-6 space-y-5">
            <div>
              <div className="mb-2 flex justify-between text-xs">
                <span className="font-semibold text-slate-700">
                  Đủ điều kiện
                </span>

                <span className="font-bold text-green-600">
                  3,850
                </span>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-green-500"
                  style={{ width: '73.5%' }}
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex justify-between text-xs">
                <span className="font-semibold text-slate-700">
                  Chưa đủ điều kiện
                </span>

                <span className="font-bold text-red-600">
                  1,390
                </span>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-red-500"
                  style={{ width: '26.5%' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== SINH VIÊN CẦN HỖ TRỢ ==================== */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.8fr)]">
        {/* Danh sách */}
        <div className="card-glass overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 p-5">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Sinh viên cần ưu tiên hỗ trợ
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Sinh viên có Risk cao hoặc vấn đề ảnh hưởng đến tiến độ OJT.
              </p>
            </div>

            <button
              type="button"
              className="text-xs font-semibold text-orange-600 hover:text-orange-700"
            >
              Xem tất cả
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-left">
                  <th className="px-5 py-3 text-[10px] font-bold uppercase text-slate-500">
                    Sinh viên
                  </th>

                  <th className="px-4 py-3 text-[10px] font-bold uppercase text-slate-500">
                    MSSV
                  </th>

                  <th className="px-4 py-3 text-[10px] font-bold uppercase text-slate-500">
                    Risk Score
                  </th>

                  <th className="px-4 py-3 text-[10px] font-bold uppercase text-slate-500">
                    Vấn đề chính
                  </th>

                  <th className="px-4 py-3 text-[10px] font-bold uppercase text-slate-500">
                    Thao tác
                  </th>
                </tr>
              </thead>

              <tbody>
                {[
                  {
                    name: 'Nguyễn Thành Phương',
                    id: 'SE161234',
                    risk: '92/100',
                    issue: 'Thiếu chứng chỉ OJT',
                    action: 'Gửi mail',
                  },
                  {
                    name: 'Phan Lan Anh',
                    id: 'SE161458',
                    risk: '78/100',
                    issue: 'GPA chuyển ngành thấp',
                    action: 'Tư vấn',
                  },
                  {
                    name: 'Trần Hùng Dũng',
                    id: 'SE161789',
                    risk: '80/100',
                    issue: 'Nợ môn tiên quyết',
                    action: 'Đăng ký lớp',
                  },
                ].map((student) => (
                  <tr
                    key={student.id}
                    className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">
                          {student.name.charAt(0)}
                        </div>

                        <span className="text-xs font-semibold text-slate-800">
                          {student.name}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-xs text-slate-500">
                      {student.id}
                    </td>

                    <td className="px-4 py-4">
                      <span className="rounded-full bg-red-50 px-2 py-1 text-[10px] font-bold text-red-600">
                        {student.risk}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-xs text-slate-600">
                      {student.issue}
                    </td>

                    <td className="px-4 py-4">
                      <button
                        type="button"
                        className="text-xs font-semibold text-orange-600 hover:text-orange-700"
                      >
                        {student.action}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cảnh báo + AI */}
        <div className="space-y-6">
          {/* AI cảnh báo */}
          <div className="card-glass p-5">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                <Bot size={19} />
              </div>

              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  AI cảnh báo mới
                </h2>

                <p className="text-[11px] text-slate-500">
                  Các cảnh báo cần Phòng Đào tạo theo dõi.
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-red-100 bg-red-50 p-3">
                <p className="text-xs font-bold text-red-700">
                  Rủi ro hệ thống
                </p>

                <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                  Phát hiện 42 sinh viên có Risk cao và chưa đủ điều kiện OJT.
                </p>
              </div>

              <div className="rounded-xl border border-orange-100 bg-orange-50 p-3">
                <p className="text-xs font-bold text-orange-700">
                  Đề xuất hỗ trợ
                </p>

                <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                  AI đề xuất mở lớp hỗ trợ cho nhóm sinh viên có cùng vấn đề.
                </p>
              </div>
            </div>

            <button
              type="button"
              className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-orange-600"
            >
              Xem cảnh báo
              <ArrowRight size={14} />
            </button>
          </div>

          {/* Đề xuất lớp */}
          <div className="card-glass p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Đề xuất mở lớp từ AI
                </h2>

                <p className="mt-1 text-[11px] text-slate-500">
                  Lớp được đề xuất dựa trên nhu cầu hỗ trợ.
                </p>
              </div>

              <Bot className="text-orange-500" size={19} />
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
                <div>
                  <p className="text-xs font-bold text-slate-700">
                    SW302 - Software Design
                  </p>

                  <p className="mt-1 text-[10px] text-slate-500">
                    Dự kiến: 120 sinh viên
                  </p>
                </div>

                <ArrowRight size={15} className="text-slate-400" />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
                <div>
                  <p className="text-xs font-bold text-slate-700">
                    PRN231 - .NET Application
                  </p>

                  <p className="mt-1 text-[10px] text-slate-500">
                    Dự kiến: 85 sinh viên
                  </p>
                </div>

                <ArrowRight size={15} className="text-slate-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== HOẠT ĐỘNG + ACTION ==================== */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(240px,0.8fr)]">
        {/* Hoạt động */}
        <div className="card-glass p-5">
          <div className="flex items-center gap-2">
            <Bell className="text-orange-500" size={19} />

            <h2 className="text-base font-bold text-slate-900">
              Hoạt động gần đây
            </h2>
          </div>

          <div className="mt-5 space-y-4">
            <div className="flex gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                <Upload size={15} />
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-800">
                  Import dữ liệu sinh viên thành công
                </p>

                <p className="mt-1 text-[10px] text-slate-500">
                  Đã cập nhật dữ liệu sinh viên cho kỳ OJT hiện tại.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <CheckCircle2 size={15} />
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-800">
                  Hoàn tất kiểm tra điều kiện OJT
                </p>

                <p className="mt-1 text-[10px] text-slate-500">
                  Danh sách sinh viên đủ điều kiện đã được cập nhật.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action */}
        <div className="flex flex-col gap-3">
          <button
            type="button"
            className="flex items-center justify-center gap-2 rounded-xl border border-blue-500 bg-white px-4 py-3 text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
          >
            <Upload size={17} />
            Import sinh viên
          </button>

          <button
            type="button"
            className="flex items-center justify-center gap-2 rounded-xl border border-blue-500 bg-white px-4 py-3 text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
          >
            <School size={17} />
            Tạo lớp hỗ trợ
          </button>
        </div>
      </div>
    </div>
  );
};

export default EducationDashboard;