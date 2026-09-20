import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  UserCheck,
  BookOpen,
  ArrowRight,
  School,
  Bot,
  ShieldAlert,
} from "lucide-react";

export const EducationDashboard: React.FC = () => {
  const navigate = useNavigate();

  const totalStudents = 5240;
  const eligibleStudents = 3850;
  const ineligibleStudents = 1390;

  const lowRiskStudents = 4670;
  const mediumRiskStudents = 420;
  const highRiskStudents = 150;

  const lowRiskPercent = 89.1;
  const mediumRiskPercent = 8.0;
  const highRiskPercent = 2.9;

  return (
    <div className="space-y-6">
      {/* =====================================================
          HEADER
          ===================================================== */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-orange-600">
            Trang chủ → Tổng quan Phòng Đào tạo
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Theo dõi tiến độ học tập, điều kiện OJT và mức nguy cơ trễ OJT của
            sinh viên.
          </p>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          Xuất báo cáo
        </button>
      </div>

      {/* =====================================================
          TỔNG QUAN
          ===================================================== */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Tổng sinh viên */}

        <div className="card-glass p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Tổng sinh viên
              </p>

              <p className="mt-2 text-2xl font-extrabold text-slate-900">
                {totalStudents.toLocaleString("en-US")}
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

        {/* Đủ điều kiện OJT */}

        <div className="card-glass p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Đủ điều kiện OJT
              </p>

              <p className="mt-2 text-2xl font-extrabold text-slate-900">
                {eligibleStudents.toLocaleString("en-US")}
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
                Chưa đủ điều kiện OJT
              </p>

              <p className="mt-2 text-2xl font-extrabold text-red-600">
                {ineligibleStudents.toLocaleString("en-US")}
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

        {/* Lớp hỗ trợ */}

        <div className="card-glass p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Lớp hỗ trợ</p>

              <p className="mt-2 text-2xl font-extrabold text-slate-900">12</p>

              <p className="mt-2 text-xs font-medium text-blue-600">
                Lớp hỗ trợ đang được quản lý
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <School size={21} />
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          PHÂN BỐ MỨC NGUY CƠ
          ===================================================== */}

      <div className="card-glass p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          {/* Tiêu đề */}

          <div className="lg:w-[260px]">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                <ShieldAlert size={21} />
              </div>

              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Phân bố mức nguy cơ
                </h2>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Nguy cơ sinh viên bị trễ so với lộ trình OJT dự kiến.
                </p>
              </div>
            </div>
          </div>

          {/* Ba mức nguy cơ */}

          <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-3">
            {/* Thấp */}

            <div className="rounded-2xl border border-green-100 bg-green-50/70 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-green-700">
                    Nguy cơ thấp
                  </p>

                  <p className="mt-1 text-xl font-extrabold text-slate-900">
                    {lowRiskStudents.toLocaleString("en-US")}
                  </p>
                </div>

                <CheckCircle2 size={21} className="text-green-500" />
              </div>

              <p className="mt-2 text-xs font-semibold text-green-600">
                {lowRiskPercent}% tổng sinh viên
              </p>
            </div>

            {/* Trung bình */}

            <div className="rounded-2xl border border-orange-100 bg-orange-50/70 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-orange-700">
                    Nguy cơ trung bình
                  </p>

                  <p className="mt-1 text-xl font-extrabold text-slate-900">
                    {mediumRiskStudents.toLocaleString("en-US")}
                  </p>
                </div>

                <AlertTriangle size={21} className="text-orange-500" />
              </div>

              <p className="mt-2 text-xs font-semibold text-orange-600">
                {mediumRiskPercent}% tổng sinh viên
              </p>
            </div>

            {/* Cao */}

            <div className="rounded-2xl border border-red-100 bg-red-50/70 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-red-700">
                    Nguy cơ cao
                  </p>

                  <p className="mt-1 text-xl font-extrabold text-slate-900">
                    {highRiskStudents.toLocaleString("en-US")}
                  </p>
                </div>

                <ShieldAlert size={21} className="text-red-500" />
              </div>

              <p className="mt-2 text-xs font-semibold text-red-600">
                {highRiskPercent}% tổng sinh viên
              </p>
            </div>
          </div>
        </div>

        {/* Thanh phân bố */}

        <div className="mt-5">
          <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full bg-green-500"
              style={{ width: `${lowRiskPercent}%` }}
            />

            <div
              className="h-full bg-orange-500"
              style={{ width: `${mediumRiskPercent}%` }}
            />

            <div
              className="h-full bg-red-500"
              style={{ width: `${highRiskPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* =====================================================
          BIỂU ĐỒ
          ===================================================== */}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Xu hướng nguy cơ */}

        <div className="card-glass p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Xu hướng nguy cơ theo kỳ
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Số lượng sinh viên có mức nguy cơ cao theo từng kỳ.
              </p>
            </div>

            <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600">
              3 năm gần đây
            </span>
          </div>

          <div className="mt-6 flex h-48 items-end gap-3 border-b border-slate-200 px-2">
            {[
              { label: "Spring 23", value: 42 },
              { label: "Summer 23", value: 51 },
              { label: "Fall 23", value: 47 },
              { label: "Spring 24", value: 68 },
              { label: "Summer 24", value: 61 },
              { label: "Fall 24", value: 82 },
              { label: "Spring 25", value: 74 },
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

                <span className="whitespace-nowrap text-[9px] text-slate-400">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Phân bố điểm nguy cơ */}

        <div className="card-glass p-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Phân bố điểm nguy cơ
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Phân loại sinh viên theo kết quả dự báo nguy cơ trễ OJT.
            </p>
          </div>

          <div className="mt-5 flex flex-col items-center justify-center sm:flex-row sm:gap-10">
            {/* Donut */}

            <div
              className="relative flex h-44 w-44 shrink-0 items-center justify-center rounded-full"
              style={{
                background:
                  "conic-gradient(#22c55e 0deg 321deg, #f97316 321deg 350deg, #dc2626 350deg 360deg)",
              }}
            >
              <div className="flex h-32 w-32 flex-col items-center justify-center rounded-full bg-white">
                <span className="text-2xl font-extrabold text-slate-900">
                  5.2k
                </span>

                <span className="text-xs text-slate-500">Tổng sinh viên</span>
              </div>
            </div>

            {/* Chú thích */}

            <div className="mt-5 w-full space-y-3 sm:mt-0 sm:w-auto">
              <div className="flex items-center justify-between gap-8 text-xs">
                <span className="flex items-center gap-2 text-slate-600">
                  <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                  Nguy cơ thấp
                </span>

                <span className="font-bold text-slate-900">
                  {lowRiskPercent}%
                </span>
              </div>

              <div className="flex items-center justify-between gap-8 text-xs">
                <span className="flex items-center gap-2 text-slate-600">
                  <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
                  Nguy cơ trung bình
                </span>

                <span className="font-bold text-slate-900">
                  {mediumRiskPercent}%
                </span>
              </div>

              <div className="flex items-center justify-between gap-8 text-xs">
                <span className="flex items-center gap-2 text-slate-600">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-600" />
                  Nguy cơ cao
                </span>

                <span className="font-bold text-slate-900">
                  {highRiskPercent}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          TIẾN ĐỘ + ĐIỀU KIỆN
          ===================================================== */}

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
              { label: "Khóa 16 (K16)", value: 98 },
              { label: "Khóa 17 (K17)", value: 75 },
              { label: "Khóa 18 (K18)", value: 42 },
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
                    style={{
                      width: `${item.value}%`,
                    }}
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
                  {eligibleStudents.toLocaleString("en-US")}
                </span>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-green-500"
                  style={{ width: "73.5%" }}
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex justify-between text-xs">
                <span className="font-semibold text-slate-700">
                  Chưa đủ điều kiện
                </span>

                <span className="font-bold text-red-600">
                  {ineligibleStudents.toLocaleString("en-US")}
                </span>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-red-500"
                  style={{ width: "26.5%" }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          SINH VIÊN CẦN ƯU TIÊN HỖ TRỢ
          ===================================================== */}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.8fr)]">
        {/* Danh sách */}

        <div className="card-glass overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 p-5">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Sinh viên cần ưu tiên hỗ trợ
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Sinh viên có mức nguy cơ cao hoặc có vấn đề ảnh hưởng đến tiến
                độ OJT.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/education/risk-students")}
              className="whitespace-nowrap text-xs font-semibold text-orange-600 transition hover:text-orange-700"
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
                    Điểm nguy cơ
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
                    name: "Nguyễn Thành Phương",
                    id: "SE161234",
                    risk: "92/100",
                    issue: "Thiếu điều kiện cần thiết cho OJT",
                    action: "Xem",
                  },
                  {
                    name: "Phan Lan Anh",
                    id: "SE161458",
                    risk: "78/100",
                    issue: "Tiến độ học tập cần theo dõi",
                    action: "Xem",
                  },
                  {
                    name: "Trần Hùng Dũng",
                    id: "SE161789",
                    risk: "80/100",
                    issue: "Chưa hoàn thành môn tiên quyết",
                    action: "Xem",
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

                        <span className="whitespace-nowrap text-xs font-semibold text-slate-800">
                          {student.name}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-xs text-slate-500">
                      {student.id}
                    </td>

                    <td className="px-4 py-4">
                      <span className="whitespace-nowrap rounded-full bg-red-50 px-2 py-1 text-[10px] font-bold text-red-600">
                        {student.risk}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-xs text-slate-600">
                      {student.issue}
                    </td>

                    <td className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() => navigate("/education/risk-students")}
                        className="text-xs font-semibold text-orange-600 transition hover:text-orange-700"
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

        {/* =================================================
            CẢNH BÁO + ĐỀ XUẤT AI
            ================================================= */}

        <div className="space-y-6">
          {/* Cảnh báo AI */}

          <div className="card-glass p-5">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                <Bot size={19} />
              </div>

              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Cảnh báo mới từ AI
                </h2>

                <p className="text-[11px] text-slate-500">
                  Các cảnh báo cần Phòng Đào tạo theo dõi.
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-red-100 bg-red-50 p-3">
                <p className="text-xs font-bold text-red-700">
                  Cảnh báo nguy cơ cao
                </p>

                <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                  Phát hiện 42 sinh viên có mức nguy cơ cao và chưa đủ điều kiện
                  OJT.
                </p>
              </div>

              <div className="rounded-xl border border-orange-100 bg-orange-50 p-3">
                <p className="text-xs font-bold text-orange-700">
                  Đề xuất hỗ trợ
                </p>

                <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                  AI đề xuất mở lớp hỗ trợ cho nhóm sinh viên có cùng vấn đề học
                  tập.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate("/education/risk-alerts")}
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

                <button
                  type="button"
                  onClick={() => navigate("/education/ai-class-proposals")}
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-50 hover:text-orange-500"
                >
                  <ArrowRight size={15} />
                </button>
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

                <button
                  type="button"
                  onClick={() => navigate("/education/ai-class-proposals")}
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-50 hover:text-orange-500"
                >
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EducationDashboard;
