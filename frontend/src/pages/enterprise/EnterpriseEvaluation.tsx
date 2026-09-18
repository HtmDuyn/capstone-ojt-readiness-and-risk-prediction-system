import React, { useState } from 'react';
import { PageBanner } from '@/components/common/PageBanner';
import { ClipboardCheck, CheckCircle2, Award, Download, Save, Send } from 'lucide-react';
import { MOCK_INTERN_EVALUATIONS } from '@/data/enterprise/mockEnterpriseData';
import { InternEvaluation } from '@/types/enterprise/enterpriseTypes';

export const EnterpriseEvaluation: React.FC = () => {
  const [evaluations, setEvaluations] = useState<InternEvaluation[]>(MOCK_INTERN_EVALUATIONS);
  const [selectedEval, setSelectedEval] = useState<InternEvaluation | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [scores, setScores] = useState({
    technicalScore: 8.0,
    attitudeScore: 8.5,
    disciplineScore: 9.0,
    softSkillsScore: 8.0,
    feedback: '',
  });

  const handleOpenEvaluation = (evalItem: InternEvaluation) => {
    setSelectedEval(evalItem);
    setScores({
      technicalScore: evalItem.technicalScore,
      attitudeScore: evalItem.attitudeScore,
      disciplineScore: evalItem.disciplineScore,
      softSkillsScore: evalItem.softSkillsScore,
      feedback: evalItem.feedback || '',
    });
  };

  const calculateFinalGrade = (
    tech: number,
    att: number,
    disc: number,
    soft: number
  ) => {
    return Number((tech * 0.4 + att * 0.3 + disc * 0.2 + soft * 0.1).toFixed(2));
  };

  const handleSubmitEvaluation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEval) return;

    const finalGrade = calculateFinalGrade(
      scores.technicalScore,
      scores.attitudeScore,
      scores.disciplineScore,
      scores.softSkillsScore
    );

    const updated = evaluations.map((item) =>
      item.id === selectedEval.id
        ? {
            ...item,
            technicalScore: scores.technicalScore,
            attitudeScore: scores.attitudeScore,
            disciplineScore: scores.disciplineScore,
            softSkillsScore: scores.softSkillsScore,
            finalGrade,
            feedback: scores.feedback,
            evaluatedDate: new Date().toISOString().split('T')[0],
            status: 'SUBMITTED' as const,
          }
        : item
    );

    setEvaluations(updated);
    setSelectedEval(null);
    setToastMessage(`Đã gửi kết quả đánh giá OJT cho sinh viên ${selectedEval.fullName} thành công!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="space-y-6 pb-12">
      <PageBanner
        title="Đánh giá & Chấm điểm Kết quả Thực tập OJT"
        description="Đánh giá năng lực sinh viên theo 4 tiêu chí chuẩn FPT Edu: Chuyên môn (40%), Thái độ (30%), Kỷ luật (20%), Kỹ năng mềm (10%)."
        badge="Chấm điểm OJT"
      />

      {toastMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm font-medium flex items-center justify-between animate-fadeIn shadow-sm">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-500 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Evaluations Table List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Danh sách Phiếu Chấm điểm OJT</h3>
            <p className="text-xs text-slate-500 mt-0.5">Sinh viên kỳ thực tập OJT hiện tại</p>
          </div>

          <span className="text-xs font-semibold text-slate-500">
            Đã hoàn thành: {evaluations.filter((e) => e.status === 'SUBMITTED').length} / {evaluations.length} phiếu
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Sinh viên</th>
                <th className="px-5 py-3.5">Vị trí thực tập</th>
                <th className="px-5 py-3.5 text-center">Chuyên môn (40%)</th>
                <th className="px-5 py-3.5 text-center">Thái độ (30%)</th>
                <th className="px-5 py-3.5 text-center">Điểm tổng kết OJT</th>
                <th className="px-5 py-3.5 text-center">Trạng thái</th>
                <th className="px-5 py-3.5 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {evaluations.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-4">
                    <div>
                      <div className="font-bold text-slate-900">{item.fullName}</div>
                      <div className="text-[11px] text-slate-400">{item.studentCode}</div>
                    </div>
                  </td>

                  <td className="px-5 py-4 text-slate-700">{item.position}</td>

                  <td className="px-5 py-4 text-center font-semibold text-slate-800">
                    {item.technicalScore} / 10
                  </td>

                  <td className="px-5 py-4 text-center font-semibold text-slate-800">
                    {item.attitudeScore} / 10
                  </td>

                  <td className="px-5 py-4 text-center">
                    <span className="font-extrabold text-sm text-orange-600">
                      {item.finalGrade} / 10
                    </span>
                  </td>

                  <td className="px-5 py-4 text-center">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        item.status === 'SUBMITTED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.status === 'SUBMITTED' ? 'Đã nộp về Trường' : 'Bản nháp'}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-right space-x-2">
                    <button
                      onClick={() => handleOpenEvaluation(item)}
                      className="px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold transition-colors"
                    >
                      {item.status === 'SUBMITTED' ? 'Chỉnh sửa' : 'Chấm điểm'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Evaluation Grading Form Modal */}
      {selectedEval && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    Phiếu Chấm điểm Thực tập OJT
                  </h3>
                  <p className="text-xs text-slate-500">
                    Sinh viên: <strong className="text-slate-900">{selectedEval.fullName}</strong> ({selectedEval.studentCode})
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedEval(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitEvaluation} className="space-y-5 text-xs">
              {/* Score Sliders */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 space-y-2 border border-slate-200/60">
                  <div className="flex justify-between font-bold">
                    <span className="text-slate-700">1. Kỹ năng Chuyên môn (Tỉ trọng 40%)</span>
                    <span className="text-orange-600 text-sm">{scores.technicalScore} / 10</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.5"
                    className="w-full accent-orange-500 cursor-pointer"
                    value={scores.technicalScore}
                    onChange={(e) =>
                      setScores({ ...scores, technicalScore: parseFloat(e.target.value) })
                    }
                  />
                  <p className="text-[11px] text-slate-400">Khả năng nắm bắt công nghệ, chất lượng code/sản phẩm.</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 space-y-2 border border-slate-200/60">
                  <div className="flex justify-between font-bold">
                    <span className="text-slate-700">2. Thái độ Làm việc (Tỉ trọng 30%)</span>
                    <span className="text-orange-600 text-sm">{scores.attitudeScore} / 10</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.5"
                    className="w-full accent-orange-500 cursor-pointer"
                    value={scores.attitudeScore}
                    onChange={(e) =>
                      setScores({ ...scores, attitudeScore: parseFloat(e.target.value) })
                    }
                  />
                  <p className="text-[11px] text-slate-400">Tính chủ động, thần cầu tiến và tiếp thu góp ý.</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 space-y-2 border border-slate-200/60">
                  <div className="flex justify-between font-bold">
                    <span className="text-slate-700">3. Kỷ luật & Điểm danh (Tỉ trọng 20%)</span>
                    <span className="text-orange-600 text-sm">{scores.disciplineScore} / 10</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.5"
                    className="w-full accent-orange-500 cursor-pointer"
                    value={scores.disciplineScore}
                    onChange={(e) =>
                      setScores({ ...scores, disciplineScore: parseFloat(e.target.value) })
                    }
                  />
                  <p className="text-[11px] text-slate-400">Đúng giờ, tuân thủ quy định nội bộ và bảo mật thông tin.</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 space-y-2 border border-slate-200/60">
                  <div className="flex justify-between font-bold">
                    <span className="text-slate-700">4. Kỹ năng Mềm (Tỉ trọng 10%)</span>
                    <span className="text-orange-600 text-sm">{scores.softSkillsScore} / 10</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.5"
                    className="w-full accent-orange-500 cursor-pointer"
                    value={scores.softSkillsScore}
                    onChange={(e) =>
                      setScores({ ...scores, softSkillsScore: parseFloat(e.target.value) })
                    }
                  />
                  <p className="text-[11px] text-slate-400">Giao tiếp, làm việc nhóm và kỹ năng thuyết trình.</p>
                </div>
              </div>

              {/* Calculated Final Grade Preview */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 text-xs">Điểm tổng kết OJT dự kiến:</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Công thức: (Tech × 0.4) + (Attitude × 0.3) + (Discipline × 0.2) + (Soft × 0.1)
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-orange-600">
                    {calculateFinalGrade(
                      scores.technicalScore,
                      scores.attitudeScore,
                      scores.disciplineScore,
                      scores.softSkillsScore
                    )}
                  </span>
                  <span className="text-xs text-slate-400"> / 10.0</span>
                </div>
              </div>

              {/* Feedback Textarea */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nhận xét chi tiết của Doanh nghiệp & Mentor hướng dẫn
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Ghi rõ ưu điểm nổi bật và những điểm sinh viên cần phát triển thêm..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  value={scores.feedback}
                  onChange={(e) => setScores({ ...scores, feedback: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedEval(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors"
                >
                  <Send className="w-4 h-4" />
                  <span>Xác nhận Nộp điểm về Trường FPT</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnterpriseEvaluation;
