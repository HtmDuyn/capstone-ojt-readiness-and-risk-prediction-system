import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PageBanner } from '@/components/common/PageBanner';
import { Users, Search, CheckCircle2, XCircle, Eye, Check, X, Filter, Loader2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { enterpriseService, type EnterpriseCandidateItem, type EnterpriseCandidatePeriod, type EnterpriseAcceptancePreview } from '@/services/enterpriseService';
import { useEnterprise } from '@/contexts/EnterpriseContext';
import { WorkflowModal,workflowInput,workflowPrimary,workflowSecondary } from '@/components/qhdn/StudentWorkflowUi';

export const EnterpriseCandidates: React.FC = () => {
  const { loading: profileLoading, error: profileError } = useEnterprise();
  const [candidates, setCandidates] = useState<EnterpriseCandidateItem[]>([]);
  const [candidatePeriods, setCandidatePeriods] = useState<EnterpriseCandidatePeriod[]>([]);
  const [periodsLoading, setPeriodsLoading] = useState(true);
  const [periodsError, setPeriodsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<EnterpriseCandidateItem | null>(null);
  const [selectedYearId, setSelectedYearId] = useState('');
  const [selectedOjtSemesterId, setSelectedOjtSemesterId] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const limit = 10;
  const [selectedIds,setSelectedIds]=useState<Set<number>>(new Set());
  const [acceptance,setAcceptance]=useState<EnterpriseAcceptancePreview|null>(null);
  const [bulkLoading,setBulkLoading]=useState(false),[allowOverCapacity,setAllowOverCapacity]=useState(false);
  const [acceptanceReason,setAcceptanceReason]=useState('Doanh nghiệp đồng ý tiếp nhận sinh viên thực tập.');
  const [acceptanceError,setAcceptanceError]=useState('');
  const eligible=(candidate:EnterpriseCandidateItem)=>candidate.decision==='PENDING'&&candidate.isLatestCoordination&&candidate.canRespond!==false;
  useEffect(()=>{setSelectedIds(new Set());setPage(1);},[selectedYearId,selectedOjtSemesterId,filterStatus,searchTerm]);
  useEffect(()=>{setSelectedIds(previous=>new Set([...previous].filter(id=>candidates.some(candidate=>candidate.id===id&&eligible(candidate)))));},[candidates]);
  const previewAcceptance=async(ids:number[])=>{
    if(bulkLoading||actionLoading!==null||!ids.length)return;
    setBulkLoading(true);setAcceptanceError('');setAllowOverCapacity(false);
    try{setAcceptance(await enterpriseService.previewAcceptance(ids));setSelectedCandidate(null);}
    catch(err:any){setToastMessage('Lỗi: '+(err?.response?.data?.message||err.message||'Không kiểm tra được chỉ tiêu.'));}
    finally{setBulkLoading(false);}
  };
  const confirmAcceptance=async()=>{
    if(!acceptance||bulkLoading||!acceptanceReason.trim()||(acceptance.overCapacity&&!allowOverCapacity))return;
    setBulkLoading(true);setAcceptanceError('');
    try{
      await enterpriseService.acceptCandidates(acceptance,allowOverCapacity,acceptanceReason.trim());
      setToastMessage(`Đã tiếp nhận ${acceptance.totalSelected} sinh viên. Số thực nhận và chênh lệch chỉ tiêu đã được cập nhật.`);
      setSelectedIds(new Set());setAcceptance(null);await fetchCandidates();
    }catch(err:any){
      setAcceptanceError(err?.response?.data?.message||err.message||'Không nhận được sinh viên.');
      if(err?.response?.data?.errorCode==='BULK_ACCEPTANCE_CHANGED'){
        try{setAcceptance(await enterpriseService.previewAcceptance(acceptance.candidateIds));setAllowOverCapacity(false);}
        catch(refreshError:any){setAcceptanceError(refreshError?.response?.data?.message||'Hãy đóng hộp thoại và tải lại danh sách.');}
      }
    }finally{setBulkLoading(false);}
  };

  const years = useMemo(() => {
    const uniqueYears = new Map<number, string>();
    for (const period of candidatePeriods) {
      uniqueYears.set(period.academicYearId, period.academicYearCode);
    }
    return [...uniqueYears].map(([id, code]) => ({ id, code }));
  }, [candidatePeriods]);

  const availablePeriods = useMemo(
    () => candidatePeriods.filter((period) =>
      !selectedYearId || String(period.academicYearId) === selectedYearId
    ),
    [candidatePeriods, selectedYearId]
  );

  useEffect(() => {
    if (profileLoading) return;
    let active = true;
    setPeriodsLoading(true);
    setPeriodsError(null);
    enterpriseService.listCandidatePeriods()
      .then((response) => {
        if (active) setCandidatePeriods(response.data.items);
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Không thể tải danh sách năm học và kỳ OJT';
        if (active) setPeriodsError(message);
        console.error('Failed to load enterprise candidate periods:', err);
      })
      .finally(() => {
        if (active) setPeriodsLoading(false);
      });
    return () => { active = false; };
  }, [profileLoading]);

  const fetchCandidates = useCallback(async () => {
    if (profileLoading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await enterpriseService.listCandidates({
        ...(selectedYearId ? { academicYearId: Number(selectedYearId) } : {}),
        ...(selectedOjtSemesterId ? { ojtSemesterId: Number(selectedOjtSemesterId) } : {}),
      });
      if (res?.success && res.data) {
        setCandidates(res.data.items || []);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Không thể tải danh sách ứng viên';
      setError(message);
      console.error('Failed to load candidates:', err);
    } finally {
      setLoading(false);
    }
  }, [profileLoading, selectedYearId, selectedOjtSemesterId]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  const filteredCandidates = useMemo(() => {
    const query = searchTerm.trim().toLocaleLowerCase();
    return candidates.filter((candidate) => {
      const matchesStatus = filterStatus === 'ALL' || candidate.decision === filterStatus;
      const matchesSearch = !query ||
        candidate.student.fullName.toLocaleLowerCase().includes(query) ||
        candidate.student.studentCode.toLocaleLowerCase().includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [candidates, filterStatus, searchTerm]);
  const totalPages = Math.max(1, Math.ceil(filteredCandidates.length / limit));
  const visibleCandidates = useMemo(
    () => filteredCandidates.slice((page - 1) * limit, page * limit),
    [filteredCandidates, page]
  );
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);
  const selectable=filteredCandidates.filter(eligible);
  const selected=selectable.filter(candidate=>selectedIds.has(candidate.id));

  const handleDecision = async (candidateId: number, decision: 'ACCEPTED' | 'REJECTED') => {
    if(decision==='ACCEPTED'){await previewAcceptance([candidateId]);return;}
    if(actionLoading!==null||bulkLoading)return;
    setActionLoading(candidateId);
    try {
      await enterpriseService.decideCandidate(
        candidateId,
        decision,
        'Từ chối sinh viên'
      );
      const statusText = 'từ chối';
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
    const labels: Record<string, string> = { PENDING: 'Chờ duyệt', ACCEPTED: 'Đồng ý nhận', SUPERSEDED: 'Đã chuyển điều phối', REJECTED: 'Đã từ chối' };
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

  return (
    <div className="space-y-6 pb-12">
      <PageBanner
        title="Hồ sơ sinh viên ứng tuyển"
        description="Chọn hồ sơ để tiếp nhận hàng loạt. Kiểm tra số thực nhận và xác nhận rõ khi nhận vượt chỉ tiêu doanh nghiệp."
        badge="Ứng tuyển OJT"
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

      <section aria-label="Danh sách hồ sơ ứng tuyển" className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      {selectable.length>0&&<div className="flex flex-wrap items-center justify-between gap-3 border-b border-orange-100 bg-orange-50/70 px-4 py-3">
        <p className="text-sm text-slate-600">Đã chọn <strong>{selected.length}</strong> / {selectable.length} hồ sơ có thể tiếp nhận</p>
        <button type="button" className={workflowPrimary} disabled={!selected.length||bulkLoading||actionLoading!==null||loading} onClick={()=>previewAcceptance(selected.map(candidate=>candidate.id))}><CheckCircle2 size={16}/>{bulkLoading?'Đang kiểm tra…':`Nhận sinh viên đã chọn (${selected.length})`}</button>
      </div>}
      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-4">
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

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <label className="sr-only" htmlFor="candidate-academic-year">Năm học</label>
          <select
            id="candidate-academic-year"
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
            value={selectedYearId}
            disabled={periodsLoading}
            onChange={(e) => {
              setSelectedYearId(e.target.value);
              setSelectedOjtSemesterId('');
              setPage(1);
            }}
          >
            <option value="">{periodsLoading ? 'Đang tải năm học...' : 'Tất cả năm học'}</option>
            {years.map((year) => (
              <option key={year.id} value={year.id}>{year.code}</option>
            ))}
          </select>

          <label className="sr-only" htmlFor="candidate-ojt-semester">Kỳ OJT</label>
          <select
            id="candidate-ojt-semester"
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
            value={selectedOjtSemesterId}
            disabled={periodsLoading}
            onChange={(e) => {
              setSelectedOjtSemesterId(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Tất cả kỳ OJT</option>
            {availablePeriods.map((period) => (
              <option key={period.ojtSemesterId} value={period.ojtSemesterId}>
                {period.semesterCode || period.semesterName}
              </option>
            ))}
          </select>

          <Filter className="w-4 h-4 text-slate-400" />
          <select
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="PENDING">Chờ xét duyệt</option>
            <option value="ACCEPTED">Đồng ý nhận</option>
            <option value="REJECTED">Đã từ chối</option>
          </select>
          <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
            Tổng: <strong>{filteredCandidates.length}</strong>
          </span>
        </div>
      </div>
      {periodsError && (
        <p role="alert" className="px-4 py-3 text-xs text-rose-700">{periodsError}</p>
      )}

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
        <div className="p-6 bg-rose-50 text-center">
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
      {!loading && !error && filteredCandidates.length === 0 && (
        <div className="p-12 text-center">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-500">
            {searchTerm || filterStatus !== 'ALL' ? 'Không tìm thấy ứng viên phù hợp.' : 'Chưa có hồ sơ ứng tuyển trực tiếp nào.'}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Hồ sơ sinh viên gửi đến doanh nghiệp sẽ hiển thị tại đây.
          </p>
        </div>
      )}

      {/* Candidates Table List */}
      {!loading && !error && filteredCandidates.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] table-fixed text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="w-10 px-2 py-3.5 text-center"><input type="checkbox" aria-label="Chọn tất cả hồ sơ có thể tiếp nhận" disabled={!selectable.length||bulkLoading||actionLoading!==null} checked={selectable.length>0&&selected.length===selectable.length} ref={node=>{if(node)node.indeterminate=selected.length>0&&selected.length<selectable.length;}} onChange={event=>setSelectedIds(new Set(event.target.checked?selectable.map(candidate=>candidate.id):[]))}/></th>
                  <th className="w-16 px-3 py-3.5 text-center">STT</th>
                  <th className="w-[25%] px-4 py-3.5">Sinh viên</th>
                  <th className="w-[22%] px-4 py-3.5">Vị trí</th>
                  <th className="w-[16%] px-4 py-3.5 text-center">Ngày nhận hồ sơ</th>
                  <th className="w-[14%] px-4 py-3.5 text-center">Trạng thái</th>
                  <th className="w-[190px] px-3 py-3.5 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {visibleCandidates.map((c, index) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-2 py-4 text-center"><input type="checkbox" aria-label={'Chọn tiếp nhận '+c.student.fullName} disabled={!eligible(c)||bulkLoading||actionLoading!==null} checked={selectedIds.has(c.id)} onChange={event=>{const checked=event.target.checked;setSelectedIds(previous=>{const next=new Set(previous);if(checked)next.add(c.id);else next.delete(c.id);return next;});}}/></td>
                    <td className="px-3 py-4 text-center text-slate-400">
                      {(page - 1) * limit + index + 1}
                    </td>

                    <td className="px-4 py-4">
                      <div className="min-w-0">
                        <div className="truncate font-bold text-slate-900">{c.student.fullName}</div>
                        <div className="mt-1 truncate text-[11px] text-slate-400">
                          {c.student.studentCode} · {c.student.programName || c.student.programCode || ''}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="truncate text-slate-700">{c.position.title}</div>
                      <div className="mt-1 truncate text-[11px] text-slate-400">{c.position.code}</div>
                    </td>

                    <td className="px-4 py-4 text-center text-slate-600">
                      {c.introducedAt ? new Date(c.introducedAt).toLocaleDateString('vi-VN') : '—'}
                    </td>

                    <td className="px-4 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${decisionColor(c.decision)}`}>
                        {c.receivedAt?'Đã thực nhận':decisionLabel(c.decision)}
                      </span>
                      {c.source?.startsWith('QHDN_')&&<p className="mt-1 text-[11px] text-slate-500">{c.source==='QHDN_APPLICATION'?'QHDN bổ sung ứng tuyển':'QHDN điều phối'}</p>}
                    </td>

                    <td className="px-3 py-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedCandidate(c)}
                          aria-label={`Xem hồ sơ ${c.student.fullName}`}
                          title="Xem hồ sơ"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-100"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {c.decision === 'PENDING' && c.isLatestCoordination && c.canRespond !== false && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleDecision(c.id, 'ACCEPTED')}
                              disabled={actionLoading !== null || bulkLoading}
                              aria-label={`Tiếp nhận ${c.student.fullName}`}
                              title="Tiếp nhận"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {actionLoading === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDecision(c.id, 'REJECTED')}
                              disabled={actionLoading !== null || bulkLoading}
                              aria-label={`Từ chối ${c.student.fullName}`}
                              title="Từ chối"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600 transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
      )}

      {/* Pagination */}
      {filteredCandidates.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 p-4">
          <span className="text-xs font-medium text-slate-500">
            Hiển thị {(page - 1) * limit + 1}–{Math.min(page * limit, filteredCandidates.length)} trong {filteredCandidates.length} hồ sơ
          </span>
          <div className="flex items-center justify-center space-x-3">
          <button
            type="button"
            aria-label="Trang trước"
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
            type="button"
            aria-label="Trang sau"
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          </div>
        </div>
      )}
      </section>

      {acceptance&&<WorkflowModal wide title={`Xác nhận tiếp nhận ${acceptance.totalSelected} sinh viên`} busy={bulkLoading} onClose={()=>setAcceptance(null)}>
        <form className="space-y-4" onSubmit={event=>{event.preventDefault();void confirmAcceptance();}}>
          <p className="text-sm text-slate-600">Chỉ tiêu ban đầu được giữ nguyên. Sinh viên được duyệt nhận sẽ được tính vào số thực nhận của doanh nghiệp.</p>
          <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm"><thead className="bg-slate-50 text-slate-500"><tr>{['Kỳ OJT','Chỉ tiêu','Đã nhận','Đang chọn','Sau khi nhận','Vượt chỉ tiêu'].map(label=><th key={label} className="p-2.5">{label}</th>)}</tr></thead><tbody>{acceptance.semesters.map(semester=><tr key={semester.ojtSemesterId} className="border-t border-slate-100"><td className="p-2.5 font-medium">{semester.name}</td><td className="p-2.5 tabular-nums">{semester.capacity}</td><td className="p-2.5 tabular-nums">{semester.currentCount}</td><td className="p-2.5 tabular-nums">{semester.selectedCount}</td><td className="p-2.5 font-semibold tabular-nums">{semester.afterCount}</td><td className={'p-2.5 font-semibold tabular-nums '+(semester.excessCount?'text-orange-700':'text-slate-500')}>{semester.excessCount} sinh viên</td></tr>)}</tbody></table></div>
          {acceptance.overCapacity&&<label className="flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-900"><input type="checkbox" className="mt-0.5" checked={allowOverCapacity} disabled={bulkLoading} onChange={event=>setAllowOverCapacity(event.target.checked)}/><span>Tôi đồng ý nhận vượt chỉ tiêu theo số lượng chênh lệch hiển thị ở trên.</span></label>}
          <label className="block text-sm font-medium text-slate-700">Lý do / ghi chú tiếp nhận<textarea className={workflowInput+' mt-1'} required maxLength={2000} value={acceptanceReason} disabled={bulkLoading} onChange={event=>setAcceptanceReason(event.target.value)}/></label>
          {acceptanceError&&<p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{acceptanceError}</p>}
          <div className="flex justify-end gap-2"><button type="button" className={workflowSecondary} disabled={bulkLoading} onClick={()=>setAcceptance(null)}>Hủy</button><button type="submit" className={workflowPrimary} disabled={bulkLoading||!acceptanceReason.trim()||(acceptance.overCapacity&&!allowOverCapacity)}>{bulkLoading?'Đang tiếp nhận…':acceptance.overCapacity?'Đồng ý nhận vượt chỉ tiêu':'Xác nhận tiếp nhận'}</button></div>
        </form>
      </WorkflowModal>}
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
                  {selectedCandidate.receivedAt?'Đã thực nhận':decisionLabel(selectedCandidate.decision)}
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-slate-400">Email</span>
                <p className="font-bold text-slate-900">{selectedCandidate.student.email}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-slate-400">Ngày ứng tuyển</span>
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
            {selectedCandidate.decision === 'PENDING' && selectedCandidate.canRespond === false && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Hiện ngoài hạn xét tuyển, phản hồi của đợt. Bạn vẫn có thể xem hồ sơ; quyết định nhận hoặc từ chối chỉ được cập nhật trong hạn phản hồi.</p>}
            {selectedCandidate.decision === 'PENDING' && selectedCandidate.isLatestCoordination && selectedCandidate.canRespond !== false && (
              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  onClick={() => handleDecision(selectedCandidate.id, 'REJECTED')}
                  disabled={actionLoading !== null || bulkLoading}
                  className="px-4 py-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-semibold flex items-center space-x-1.5 transition-colors disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Từ chối</span>
                </button>
                <button
                  onClick={() => handleDecision(selectedCandidate.id, 'ACCEPTED')}
                  disabled={actionLoading !== null || bulkLoading}
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
