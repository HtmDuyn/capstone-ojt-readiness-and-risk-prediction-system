import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  ClipboardCheck,
  Eye,
  Search,
  X,
} from 'lucide-react';

import { PageBanner } from '@/components/common/PageBanner';

type FinalResult = 'Đạt' | 'Không đạt';
type ConfirmationStatus = 'Chờ xác nhận' | 'Đã xác nhận';

interface OjtResult {
  id: string;
  studentCode: string;
  fullName: string;
  studentClass: string;
  company: string;
  ojtTerm: string;

  enterpriseScore: number;
  enterpriseEvaluation: string;

  finalResult: FinalResult | null;
  confirmationStatus: ConfirmationStatus;
}

const INITIAL_RESULTS: OjtResult[] = [
  {
    id: 'ojt-result-001',
    studentCode: 'SE181666',
    fullName: 'Nguyễn Khánh Ly',
    studentClass: 'K18D-19A',
    company: 'FPT Software',
    ojtTerm: 'Fall 2026',
    enterpriseScore: 8.6,
    enterpriseEvaluation:
      'Hoàn thành tốt các nhiệm vụ được giao, có tinh thần học hỏi và phối hợp tốt với nhóm.',
    finalResult: null,
    confirmationStatus: 'Chờ xác nhận',
  },
  {
    id: 'ojt-result-002',
    studentCode: 'SE181402',
    fullName: 'Đặng Hoàng Nam',
    studentClass: 'K18D-19B',
    company: 'TGL Solutions',
    ojtTerm: 'Fall 2026',
    enterpriseScore: 9.0,
    enterpriseEvaluation:
      'Thực hiện tốt công việc, chủ động trao đổi và đáp ứng yêu cầu của doanh nghiệp.',
    finalResult: 'Đạt',
    confirmationStatus: 'Đã xác nhận',
  },
  {
    id: 'ojt-result-003',
    studentCode: 'SE181934',
    fullName: 'Phan Minh Hoàng',
    studentClass: 'K18D-19A',
    company: 'NashTech Vietnam',
    ojtTerm: 'Fall 2026',
    enterpriseScore: 6.4,
    enterpriseEvaluation:
      'Hoàn thành phần lớn nhiệm vụ nhưng cần cải thiện khả năng chủ động và quản lý thời gian.',
    finalResult: null,
    confirmationStatus: 'Chờ xác nhận',
  },
];

const EducationOjtFinalResults: React.FC = () => {
  const [results, setResults] = useState<OjtResult[]>(INITIAL_RESULTS);

  const [searchKeyword, setSearchKeyword] = useState('');

  const [selectedResult, setSelectedResult] =
    useState<OjtResult | null>(null);

  const [selectedFinalResult, setSelectedFinalResult] =
    useState<FinalResult>('Đạt');

  const filteredResults = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();

    if (!keyword) {
      return results;
    }

    return results.filter((result) => {
      return (
        result.studentCode.toLowerCase().includes(keyword) ||
        result.fullName.toLowerCase().includes(keyword) ||
        result.company.toLowerCase().includes(keyword)
      );
    });
  }, [results, searchKeyword]);

  const pendingCount = results.filter(
    (result) => result.confirmationStatus === 'Chờ xác nhận',
  ).length;

  const confirmedCount = results.filter(
    (result) => result.confirmationStatus === 'Đã xác nhận',
  ).length;

  const handleOpenDetail = (result: OjtResult) => {
    setSelectedResult(result);

    setSelectedFinalResult(result.finalResult ?? 'Đạt');
  };

  const handleCloseDetail = () => {
    setSelectedResult(null);
  };

  const handleConfirmResult = () => {
    if (!selectedResult) return;

    const confirmed = window.confirm(
      `Xác nhận kết quả OJT "${selectedFinalResult}" cho sinh viên ${selectedResult.fullName}?`,
    );

    if (!confirmed) return;

    setResults((current) =>
      current.map((result) =>
        result.id === selectedResult.id
          ? {
              ...result,
              finalResult: selectedFinalResult,
              confirmationStatus: 'Đã xác nhận',
            }
          : result,
      ),
    );

    setSelectedResult((current) =>
      current
        ? {
            ...current,
            finalResult: selectedFinalResult,
            confirmationStatus: 'Đã xác nhận',
          }
        : null,
    );
  };

  return (
    <div className="space-y-6">
      <PageBanner
        title="Cập nhật Kết quả OJT Cuối kỳ"
        description="Xem kết quả OJT do Phòng Quan hệ Doanh nghiệp chuyển sang và xác nhận kết quả chính thức của sinh viên."
        badge="Quản lý OJT"
      />

      {/* =========================
          OVERVIEW
          ========================= */}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-sm font-semibold text-amber-700">
            Chờ xác nhận
          </p>

          <p className="mt-2 text-3xl font-black text-slate-900">
            {pendingCount}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Kết quả đang chờ Phòng Đào tạo xác nhận.
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-sm font-semibold text-emerald-700">
            Đã xác nhận
          </p>

          <p className="mt-2 text-3xl font-black text-slate-900">
            {confirmedCount}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Kết quả OJT đã được xác nhận chính thức.
          </p>
        </div>
      </section>

      {/* =========================
          SEARCH
          ========================= */}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="relative max-w-md">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="text"
            value={searchKeyword}
            onChange={(event) =>
              setSearchKeyword(event.target.value)
            }
            placeholder="Tìm theo MSSV, tên sinh viên hoặc doanh nghiệp..."
            className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
          />
        </div>
      </section>

      {/* =========================
          TABLE
          ========================= */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1150px] text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-4 font-semibold text-slate-600">
                  Sinh viên
                </th>

                <th className="px-5 py-4 font-semibold text-slate-600">
                  Lớp
                </th>

                <th className="px-5 py-4 font-semibold text-slate-600">
                  Doanh nghiệp
                </th>

                <th className="px-5 py-4 font-semibold text-slate-600">
                  Kỳ OJT
                </th>

                <th className="px-5 py-4 font-semibold text-slate-600">
                  Điểm DN
                </th>

                <th className="px-5 py-4 font-semibold text-slate-600">
                  Kết quả chính thức
                </th>

                <th className="px-5 py-4 font-semibold text-slate-600">
                  Trạng thái
                </th>

                <th className="px-5 py-4 text-right font-semibold text-slate-600">
                  Thao tác
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredResults.map((result) => (
                <tr
                  key={result.id}
                  className="transition hover:bg-slate-50/70"
                >
                  <td className="px-5 py-4">
                    <div>
                      <p className="font-semibold text-slate-800">
                        {result.fullName}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {result.studentCode}
                      </p>
                    </div>
                  </td>

                  <td className="px-5 py-4 text-slate-600">
                    {result.studentClass}
                  </td>

                  <td className="px-5 py-4 text-slate-700">
                    {result.company}
                  </td>

                  <td className="px-5 py-4 text-slate-600">
                    {result.ojtTerm}
                  </td>

                  <td className="px-5 py-4">
                    <span className="font-bold text-slate-800">
                      {result.enterpriseScore.toFixed(1)}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    {result.finalResult ? (
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                          result.finalResult === 'Đạt'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border-red-200 bg-red-50 text-red-600'
                        }`}
                      >
                        {result.finalResult}
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-slate-400">
                        Chưa xác nhận
                      </span>
                    )}
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                        result.confirmationStatus === 'Đã xác nhận'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-amber-200 bg-amber-50 text-amber-700'
                      }`}
                    >
                      {result.confirmationStatus}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleOpenDetail(result)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600"
                      >
                        <Eye size={15} />
                        Xem
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredResults.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-12 text-center text-sm text-slate-500"
                  >
                    Không tìm thấy sinh viên phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* =========================
          DETAIL MODAL
          ========================= */}

      {selectedResult && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-[2px]"
          onClick={handleCloseDetail}
        >
          <div
            className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            {/* HEADER */}

            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                  <ClipboardCheck size={22} />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Kết quả OJT cuối kỳ
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {selectedResult.fullName} -{' '}
                    {selectedResult.studentCode}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseDetail}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={19} />
              </button>
            </div>

            {/* BODY */}

            <div className="space-y-5 px-6 py-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-medium text-slate-500">
                    Lớp
                  </p>

                  <p className="mt-1 font-semibold text-slate-800">
                    {selectedResult.studentClass}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-medium text-slate-500">
                    Kỳ OJT
                  </p>

                  <p className="mt-1 font-semibold text-slate-800">
                    {selectedResult.ojtTerm}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-medium text-slate-500">
                    Doanh nghiệp
                  </p>

                  <p className="mt-1 font-semibold text-slate-800">
                    {selectedResult.company}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-medium text-slate-500">
                    Điểm doanh nghiệp
                  </p>

                  <p className="mt-1 text-xl font-bold text-slate-900">
                    {selectedResult.enterpriseScore.toFixed(1)}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-700">
                  Đánh giá từ doanh nghiệp
                </p>

                <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                  {selectedResult.enterpriseEvaluation}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Kết quả OJT chính thức
                </label>

                <select
                  value={selectedFinalResult}
                  onChange={(event) =>
                    setSelectedFinalResult(
                      event.target.value as FinalResult,
                    )
                  }
                  disabled={
                    selectedResult.confirmationStatus ===
                    'Đã xác nhận'
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                >
                  <option value="Đạt">Đạt</option>
                  <option value="Không đạt">Không đạt</option>
                </select>
              </div>

              {selectedResult.confirmationStatus ===
                'Đã xác nhận' && (
                <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
                  <CheckCircle2 size={19} />

                  Kết quả OJT của sinh viên đã được Phòng Đào tạo xác nhận.
                </div>
              )}
            </div>

            {/* FOOTER */}

            <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
              <button
                type="button"
                onClick={handleCloseDetail}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
              >
                Đóng
              </button>

              {selectedResult.confirmationStatus ===
                'Chờ xác nhận' && (
                <button
                  type="button"
                  onClick={handleConfirmResult}
                  className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600"
                >
                  <CheckCircle2 size={17} />

                  Xác nhận kết quả
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EducationOjtFinalResults;