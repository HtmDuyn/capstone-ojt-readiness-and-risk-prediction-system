import React, { useState, useEffect, useCallback } from 'react';
import { PageBanner } from '@/components/common/PageBanner';
import { Users, Search, CheckCircle2, XCircle, FileText, Calendar, Filter, Loader2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { enterpriseService, type EnterpriseCandidateItem } from '@/services/enterpriseService';
import { useEnterprise } from '@/contexts/EnterpriseContext';

export const EnterpriseCandidates: React.FC = () => {
  // Lấy companyId từ EnterpriseContext (đã được load sẵn khi đăng nhập)
  const { companyId, loading: profileLoading, error: profileError } = useEnterprise();
  const [candidates, setCandidates] = useState<EnterpriseCandidateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<EnterpriseCandidateItem | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const limit = 20;

  const fetchCandidates = useCallback(async () => {
    // Chờ companyId được load từ profile trước khi gọi API
    if (!companyId) return;
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = { page, limit };
      if (filterStatus !== 'ALL') params.decision = filterStatus;
      if (searchTerm.trim()) params.search = searchTerm.trim();
      // Truyền companyId vào API — bắt buộc để backend xác định phạm vi doanh nghiệp
      const res = await enterpriseService.listCandidates(companyId, params);
      if (res?.success && res.data) {
        setCandidates(res.data.items || []);
        setTotal(res.data.total || 0);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Không thể tải danh sách ứng viên';
      setError(message);
      console.error('Failed to load candidates:', err);
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus, searchTerm, companyId]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  const handleDecision = async (candidateId: number, decision: 'ACCEPTED' | 'REJECTED') => {
    setActionLoading(candidateId);
    try {
      await enterpriseService.decideCandidate(
        candidateId,
        decision,
        decision === 'ACCEPTED' ? 'Tiếp nhận sinh viên thực tập' : 'Từ chối sinh viên'
      );
      const statusText = decision === 'ACCEPTED' ? 'tiếp nhận' : 'từ chối';
      setToastMessage(`Đã ${statusText} ứng viên thành công!`);
      setTimeout(() => setToastMessage(null), 4000);
      // Refresh the list
      await fetchCandidates();
      if (selectedCandidate?.id === candidateId) {
        setSelectedCandidate(null);
      }
    } catch (err: any) {
      const serverMessage = err?.response?.data?.message;
      const errorCode = err?.response?.data?.errorCode;
      let displayMessage = serverMessage || err?.message || 'Không thể cập nhật quyết định';
      if (errorCode === 'INVALID_TOKEN' || errorCode === 'TOKEN_EXPIRED') {
        displayMessage = 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại!';
      }
      setToastMessage(`Lỗi: ${displayMessage}`);
      setTimeout(() => setToastMessage(null), 5000);
      console.error('Failed to update candidate decision:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const decisionLabel = (decision: string): string => {
    const labels: Record<string, string> = { PENDING: 'Chờ duyệt', ACCEPTED: 'Đã tiếp nhận', REJECTED: 'Đã từ chối' };
    return labels[decision] || decision;
  };

  const decisionColor = (decision: string): string => {
    const colors: Record<string, string> = {
      PENDING: 'bg-amber-100 text-amber-800',
      ACCEPTED: 'bg-emerald-100 text-emerald-800',
      REJECTED: 'bg-rose-100 text-rose-800',
    };
    return colors[decision] || 'bg-slate-100 text-slate-600';
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6 pb-12">
      <PageBanner
        title="Nhận & Duyệt Danh sách Sinh viên Thực tập"
        description="Xem hồ sơ sinh viên được giới thiệu bởi phòng QHDN, xác nhận hoặc từ chối tiếp nhận thực tập."
        badge="Duyệt Hồ sơ OJT"
      />

      {/* Hiển thị lỗi load profile nếu có */}
      {profileError && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm">
          Lỗi tải hồ sơ doanh nghiệp: {profileError}
        </div>
      )}

      {toastMessage && (
        <div className={`p-4 ${toastMessage.startsWith('Lỗi') ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'} border rounded-xl text-sm font-medium flex items-center justify-between animate-fadeIn shadow-sm`}>
          <div className="flex items-center space-x-2">
            {toastMessage.startsWith('Lỗi') ? (
              <AlertCircle className="w-5 h-5 text-rose-600" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            )}
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-current font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo MSSV hoặc tên sinh viên..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="PENDING">Chờ xét duyệt</option>
            <option value="ACCEPTED">Đã tiếp nhận</option>
            <option value="REJECTED">Đã từ chối</option>
          </select>
          <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
            Tổng: <strong>{total}</strong>
          </span>
        </div>
      </div>

      {/* Loading State — hiển thị khi đang tải profile hoặc dữ liệu ứng viên */}
      {(loading || profileLoading) && (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            <p className="text-xs text-slate-500 font-medium">
              {profileLoading ? 'Đang xác thực doanh nghiệp...' : 'Đang tải danh sách ứng viên...'}
            </p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center">
          <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
          <p className="text-sm text-rose-700 font-medium">{error}</p>
          <button
            onClick={fetchCandidates}
            className="mt-3 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl transition-colors"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && candidates.length === 0 && (
        <div className="p-12 bg-white rounded-2xl border border-slate-200/80 text-center">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-500">
            {searchTerm || filterStatus !== 'ALL' ? 'Không tìm thấy ứng viên phù hợp.' : 'Chưa có ứng viên nào được giới thiệu.'}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Sinh viên được phòng QHDN giới thiệu sẽ hiển thị tại đây.
          </p>
        </div>
      )}

      {/* Candidates Table List */}
      {!loading && !error && candidates.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Sinh viên</th>
                  <th className="px-5 py-3.5">Vị trí</th>
                  <th className="px-5 py-3.5">Ngày giới thiệu</th>
                  <th className="px-5 py-3.5">Trạng thái</th>
                  <th className="px-5 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {candidates.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700">
                          {c.student.fullName?.charAt(0) || '?'}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{c.student.fullName}</div>
                          <div className="text-[11px] text-slate-400">
                            {c.student.studentCode} • {c.student.programName || c.student.programCode || ''}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="text-slate-700">{c.position.title}</div>
                      <div className="text-[11px] text-slate-400">{c.position.code}</div>
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {c.introducedAt ? new Date(c.introducedAt).toLocaleDateString('vi-VN') : '—'}
                    </td>

                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${decisionColor(c.decision)}`}>
                        {decisionLabel(c.decision)}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right space-x-2">
                      <button
                        onClick={() => setSelectedCandidate(c)}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors"
                      >
                        Xem hồ sơ
                      </button>
                      {c.decision === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleDecision(c.id, 'ACCEPTED')}
                            disabled={actionLoading === c.id}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-colors disabled:opacity-50"
                          >
                            {actionLoading === c.id ? '...' : 'Tiếp nhận'}
                          </button>
                          <button
                            onClick={() => handleDecision(c.id, 'REJECTED')}
                            disabled={actionLoading === c.id}
                            className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold transition-colors disabled:opacity-50"
                          >
                            Từ chối
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-3 pt-4">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-medium text-slate-600">
            Trang <strong>{page}</strong> / <strong>{totalPages}</strong>
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Candidate Detail Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 font-extrabold flex items-center justify-center text-lg">
                  {selectedCandidate.student.fullName?.charAt(0) || '?'}
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg">
                    {selectedCandidate.student.fullName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    MSSV: {selectedCandidate.student.studentCode} • {selectedCandidate.student.programName || selectedCandidate.student.programCode}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedCandidate(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-slate-400">Vị trí ứng tuyển</span>
                <p className="font-bold text-slate-900">{selectedCandidate.position.title}</p>
                <p className="text-[11px] text-slate-500">{selectedCandidate.position.code}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-slate-400">Trạng thái</span>
                <p className={`font-bold ${selectedCandidate.decision === 'ACCEPTED' ? 'text-emerald-600' : selectedCandidate.decision === 'REJECTED' ? 'text-rose-600' : 'text-amber-600'}`}>
                  {decisionLabel(selectedCandidate.decision)}
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-slate-400">Email</span>
                <p className="font-bold text-slate-900">{selectedCandidate.student.email}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-slate-400">Ngày giới thiệu</span>
                <p className="font-bold text-slate-900">
                  {selectedCandidate.introducedAt ? new Date(selectedCandidate.introducedAt).toLocaleDateString('vi-VN') : '—'}
                </p>
              </div>
            </div>

            {/* Position Details */}
            <div className="p-4 bg-slate-50 rounded-xl space-y-2">
              <h4 className="text-xs font-bold text-slate-700">Mô tả vị trí</h4>
              <p className="text-xs text-slate-600 leading-relaxed">{selectedCandidate.position.description}</p>
              {selectedCandidate.position.requirements && (
                <>
                  <h4 className="text-xs font-bold text-slate-700 pt-2">Yêu cầu</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{selectedCandidate.position.requirements}</p>
                </>
              )}
            </div>

            {/* Actions */}
            {selectedCandidate.decision === 'PENDING' && (
              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  onClick={() => handleDecision(selectedCandidate.id, 'REJECTED')}
                  disabled={actionLoading === selectedCandidate.id}
                  className="px-4 py-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-semibold flex items-center space-x-1.5 transition-colors disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Từ chối</span>
                </button>
                <button
                  onClick={() => handleDecision(selectedCandidate.id, 'ACCEPTED')}
                  disabled={actionLoading === selectedCandidate.id}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Tiếp nhận thực tập OJT</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnterpriseCandidates;
