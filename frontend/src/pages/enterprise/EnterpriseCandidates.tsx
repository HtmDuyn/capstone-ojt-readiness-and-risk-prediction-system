import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { PageBanner } from '@/components/common/PageBanner';
import { CandidateDetailModal } from '@/components/enterprise/CandidateDetailModal';
import { Users, Search, CheckCircle2, XCircle, Eye, Check, X, Loader2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { enterpriseService, type EnterpriseCandidateItem, type EnterpriseCandidatePeriod, type EnterpriseAcceptancePreview } from '@/services/enterpriseService';
import { describeApiError } from '@/services/apiService';
import { useEnterprise } from '@/contexts/EnterpriseContext';
import { WorkflowModal,workflowPrimary,workflowSecondary } from '@/components/qhdn/StudentWorkflowUi';
import { enterprisePeriodLabels, formatRecruitmentDateTime } from '@/utils/enterprise/recruitment';
import { friendlyErrorMessage } from '@/utils/shared/friendlyError';

const candidateFilterInput = 'h-10 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100 disabled:bg-slate-50 disabled:text-slate-400';
const candidateFilterLabel = 'mb-1.5 block text-xs font-semibold text-slate-600';

export const EnterpriseCandidates: React.FC = () => {
  const { error: profileError } = useEnterprise();
  const [candidates, setCandidates] = useState<EnterpriseCandidateItem[]>([]);
  const [candidateTotal,setCandidateTotal]=useState(0);
  const [candidateRounds,setCandidateRounds]=useState<Array<[string,string]>>([]);
  const [candidatePeriods, setCandidatePeriods] = useState<EnterpriseCandidatePeriod[]>([]);
  const [periodsLoading, setPeriodsLoading] = useState(true);
  const [periodsError, setPeriodsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<EnterpriseCandidateItem | null>(null);
  const [selectedYearId, setSelectedYearId] = useState('');
  const [selectedPeriodStatus, setSelectedPeriodStatus] = useState<'' | 'ACTIVE' | 'CLOSED'>('ACTIVE');
  const [selectedRoundId, setSelectedRoundId] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm,setDebouncedSearchTerm]=useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const limit = 10;
  const [selectedIds,setSelectedIds]=useState<Set<number>>(new Set());
  const [acceptance,setAcceptance]=useState<EnterpriseAcceptancePreview|null>(null);
  const [acceptanceMode,setAcceptanceMode]=useState<'single'|'bulk'>('bulk');
  const [bulkLoading,setBulkLoading]=useState(false),[allowOverCapacity,setAllowOverCapacity]=useState(false);
  const [singleLoadingId,setSingleLoadingId]=useState<number|null>(null);
  const [acceptanceBusy,setAcceptanceBusy]=useState(false);
  const [acceptanceError,setAcceptanceError]=useState('');
  const eligible=(candidate:EnterpriseCandidateItem)=>candidate.decision==='PENDING'&&candidate.isLatestCoordination&&candidate.canRespond!==false;
  useEffect(()=>{setSelectedIds(new Set());setPage(1);},[selectedYearId,selectedPeriodStatus,selectedRoundId,filterStatus]);
  useEffect(()=>{const timer=window.setTimeout(()=>{setDebouncedSearchTerm(searchTerm);setPage(1);},250);return()=>window.clearTimeout(timer);},[searchTerm]);
  const previewAcceptance=async(ids:number[],mode:'single'|'bulk'='bulk')=>{
    if(bulkLoading||singleLoadingId!==null||acceptanceBusy||actionLoading!==null||!ids.length)return;
    if(mode==='bulk')setBulkLoading(true);else setSingleLoadingId(ids[0]);
    setAcceptanceError('');setAllowOverCapacity(false);
    setAcceptanceMode(mode);
    try{setAcceptance(await enterpriseService.previewAcceptance(ids));setSelectedCandidate(null);}
    catch(err:any){setToastMessage(friendlyErrorMessage(err, 'Không kiểm tra được chỉ tiêu lúc này. Vui lòng thử lại.'));}
    finally{if(mode==='bulk')setBulkLoading(false);else setSingleLoadingId(null);}
  };
  const confirmAcceptance=async()=>{
    if(!acceptance||(acceptanceMode==='bulk'?bulkLoading:acceptanceBusy)||(acceptance.overCapacity&&!allowOverCapacity))return;
    if(acceptanceMode==='bulk')setBulkLoading(true);else setAcceptanceBusy(true);
    setAcceptanceError('');
    try{
      await enterpriseService.acceptCandidates(acceptance,allowOverCapacity,'Doanh nghiệp đồng ý tiếp nhận sinh viên thực tập.');
      setToastMessage(`Đã tiếp nhận ${acceptance.totalSelected} sinh viên. Số thực nhận và chênh lệch chỉ tiêu đã được cập nhật.`);
      setSelectedIds(new Set());setAcceptance(null);await fetchCandidates();
    }catch(err:any){
      setAcceptanceError(friendlyErrorMessage(err, 'Chưa thể xác nhận tiếp nhận sinh viên. Vui lòng thử lại.'));
      if(err?.response?.data?.errorCode==='BULK_ACCEPTANCE_CHANGED'){
        try{setAcceptance(await enterpriseService.previewAcceptance(acceptance.candidateIds));setAllowOverCapacity(false);}
        catch(refreshError:any){setAcceptanceError(friendlyErrorMessage(refreshError, 'Hãy đóng hộp thoại và tải lại danh sách.'));}
      }
    }finally{if(acceptanceMode==='bulk')setBulkLoading(false);else setAcceptanceBusy(false);}
  };

  const years = useMemo(() => {
    const uniqueYears = new Map<number, string>();
    for (const period of candidatePeriods) {
      if (selectedPeriodStatus && period.periodStatus !== selectedPeriodStatus) continue;
      uniqueYears.set(period.academicYearId, period.academicYearCode);
    }
    return [...uniqueYears].map(([id, code]) => ({ id, code })).sort((first, second) => second.code.localeCompare(first.code));
  }, [candidatePeriods, selectedPeriodStatus]);

  const availablePeriods = useMemo(
    () => candidatePeriods.filter((period) =>
      (!selectedYearId || String(period.academicYearId) === selectedYearId)
      && (!selectedPeriodStatus || period.periodStatus === selectedPeriodStatus)
    ),
    [candidatePeriods, selectedYearId, selectedPeriodStatus]
  );
  const candidatePeriodStatuses = useMemo(
    () => new Map(candidatePeriods.map(period => [period.ojtSemesterId, period.periodStatus])),
    [candidatePeriods]
  );
  const availableRounds = candidateRounds;

  useEffect(() => {
    const controller = new AbortController();
    setPeriodsLoading(true);
    setPeriodsError(null);
    Promise.resolve().then(() => {
      controller.signal.throwIfAborted();
      return enterpriseService.listCandidatePeriods(controller.signal);
    })
      .then((response) => {
        if (!controller.signal.aborted) setCandidatePeriods(response.data.items);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        const message = describeApiError(err, 'Không thể tải danh sách năm học và đợt OJT');
        setPeriodsError(message);
        console.error('Failed to load enterprise candidate periods:', err);
      })
      .finally(() => {
        if (!controller.signal.aborted) setPeriodsLoading(false);
      });
    return () => controller.abort();
  }, []);

  const candidatesRequest = useRef<AbortController | null>(null);
  const fetchCandidates = useCallback(async () => {
    if(periodsLoading)return;
    candidatesRequest.current?.abort();
    if(!availablePeriods.length){setCandidates([]);setCandidateTotal(0);setCandidateRounds([]);setLoading(false);return;}
    const controller = new AbortController();
    candidatesRequest.current = controller;
    setLoading(true);
    setError(null);
    try {
      const res = await enterpriseService.listCandidates({
        page,limit,
        ...(selectedYearId ? { academicYearId: Number(selectedYearId) } : {}),
        ...(filterStatus!=='ALL'?{decision:filterStatus}:{}),
        ...(debouncedSearchTerm.trim()?{search:debouncedSearchTerm.trim()}:{}),
        ...(selectedRoundId?{roundId:selectedRoundId}:{}),
        ojtSemesterIds:availablePeriods.map(period=>period.ojtSemesterId).join(','),
      }, controller.signal);
      if (!controller.signal.aborted && res?.success && res.data) {
        setCandidates(res.data.items || []);
        setCandidateTotal(res.data.total||0);
        setCandidateRounds((res.data.rounds||[]).map(round=>[round.id,round.name] as [string,string]));
      }
    } catch (err: unknown) {
      if (controller.signal.aborted) return;
      const message = describeApiError(err, 'Không thể tải danh sách ứng viên');
      setError(message);
      console.error('Failed to load candidates:', err);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [periodsLoading,availablePeriods,page,selectedYearId,filterStatus,debouncedSearchTerm,selectedRoundId]);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => { if (active) void fetchCandidates(); });
    return () => { active = false; candidatesRequest.current?.abort(); };
  }, [fetchCandidates]);

  const filteredCandidates = candidates;
  const reviewSchedules = useMemo(() => {
    const schedules = new Map<number, NonNullable<EnterpriseCandidateItem['recruitmentRound']>>();
    for (const candidate of filteredCandidates) {
      if (candidatePeriodStatuses.get(candidate.ojtSemesterId) === 'ACTIVE' && candidate.recruitmentRound) {
        schedules.set(candidate.recruitmentRound.id, candidate.recruitmentRound);
      }
    }
    return [...schedules.values()];
  }, [filteredCandidates, candidatePeriodStatuses]);
  const totalPages = Math.max(1, Math.ceil(candidateTotal / limit));
  const visibleCandidates = filteredCandidates;
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);
  const selectable=filteredCandidates.filter(eligible);
  const selected=selectable.filter(candidate=>selectedIds.has(candidate.id));

  const handleDecision = async (candidateId: number, decision: 'ACCEPTED' | 'REJECTED') => {
    if(decision==='ACCEPTED'){await previewAcceptance([candidateId],'single');return;}
    if(actionLoading!==null||bulkLoading||singleLoadingId!==null||acceptanceBusy)return;
    setActionLoading(candidateId);
    try {
      await enterpriseService.decideCandidate(
        candidateId,
        decision,
        'Từ chối sinh viên'
      );
      setCandidates(previous => previous.map(candidate => candidate.id === candidateId
        ? { ...candidate, decision: 'REJECTED' }
        : candidate));
      const statusText = 'từ chối';
      setToastMessage(`Đã ${statusText} ứng viên thành công!`);
      setTimeout(() => setToastMessage(null), 4000);
      if (selectedCandidate?.id === candidateId) {
        setSelectedCandidate(null);
      }
      // Refresh in the background; the completed decision is already visible locally.
      void fetchCandidates();
    } catch (err: any) {
      const errorCode = err?.response?.data?.errorCode;
      let displayMessage = friendlyErrorMessage(err, 'Không thể cập nhật quyết định. Vui lòng thử lại.');
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
    const labels: Record<string, string> = { PENDING: 'Chờ duyệt', ACCEPTED: 'Đã nhận', SUPERSEDED: 'Đã chuyển điều phối', REJECTED: 'Đã từ chối' };
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
  const acceptanceCandidate = acceptance?.candidateIds.length === 1
    ? candidates.find(candidate => candidate.id === acceptance.candidateIds[0])
    : undefined;

  return (
    <div className="space-y-6 pb-12">
      <PageBanner
        variant="enterprise"
        title="Hồ sơ sinh viên ứng tuyển"
        description="Xem xét hồ sơ, tiếp nhận từng sinh viên hoặc xử lý nhiều hồ sơ cùng lúc. Kiểm tra chỉ tiêu trước khi xác nhận."
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
      {(selectable.length>0||selectedIds.size>0)&&<div className="flex flex-wrap items-center justify-between gap-3 border-b border-orange-100 bg-orange-50/70 px-4 py-3">
        <p className="text-sm text-slate-600">Đã chọn <strong>{selectedIds.size}</strong> hồ sơ có thể tiếp nhận</p>
        <button type="button" className={workflowPrimary} disabled={!selectedIds.size||bulkLoading||singleLoadingId!==null||acceptanceBusy||actionLoading!==null||loading} onClick={()=>previewAcceptance([...selectedIds])}><CheckCircle2 size={16}/>{bulkLoading?'Đang kiểm tra…':`Nhận sinh viên đã chọn (${selectedIds.size})`}</button>
      </div>}
      {/* Filter and Search Bar */}
      <div role="search" aria-label="Bộ lọc hồ sơ ứng tuyển" className="grid min-w-0 grid-cols-1 gap-3 border-b border-slate-100 bg-slate-50/60 p-4 sm:grid-cols-2 xl:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,1.2fr)]">
        <div className="min-w-0 sm:col-span-2 xl:col-span-1">
          <label className={candidateFilterLabel} htmlFor="candidate-search">Tìm sinh viên</label>
          <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="candidate-search"
            type="search"
            placeholder="Họ tên hoặc MSSV..."
            className={candidateFilterInput + ' pl-10'}
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
          />
          </div>
        </div>

        <div className="min-w-0">
          <label className={candidateFilterLabel} htmlFor="candidate-academic-year">Năm học</label>
          <select
            id="candidate-academic-year"
            className={candidateFilterInput}
            value={selectedYearId}
            disabled={periodsLoading}
            onChange={(e) => {
              setSelectedYearId(e.target.value);
              setSelectedRoundId('');
              setPage(1);
            }}
          >
            <option value="">{periodsLoading ? 'Đang tải năm học...' : 'Tất cả năm học'}</option>
            {years.map((year) => (
              <option key={year.id} value={year.id}>{year.code}</option>
            ))}
          </select>
        </div>

        <div className="min-w-0">
          <label className={candidateFilterLabel} htmlFor="candidate-period-status">Trạng thái kỳ</label>
          <select
            id="candidate-period-status"
            className={candidateFilterInput}
            value={selectedPeriodStatus}
            disabled={periodsLoading}
            onChange={e => {
              const value = e.target.value;
              const nextStatus = value === 'ACTIVE' || value === 'CLOSED' ? value : '';
              setSelectedPeriodStatus(nextStatus);
              if (selectedYearId && !candidatePeriods.some(period =>
                String(period.academicYearId) === selectedYearId && (!nextStatus || period.periodStatus === nextStatus))) {
                setSelectedYearId('');
              }
              setSelectedRoundId('');
              setPage(1);
            }}
          >
            <option value="">Tất cả trạng thái kỳ</option>
            <option value="ACTIVE">{enterprisePeriodLabels.ACTIVE}</option>
            <option value="CLOSED">{enterprisePeriodLabels.CLOSED}</option>
          </select>
        </div>

        <div className="min-w-0">
          <label className={candidateFilterLabel} htmlFor="candidate-ojt-round">Đợt OJT</label>
          <select
            id="candidate-ojt-round"
            className={candidateFilterInput}
            value={selectedRoundId}
            disabled={periodsLoading || loading}
            onChange={(e) => {
              setSelectedRoundId(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Tất cả đợt OJT</option>
            {availableRounds.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-0">
          <label className={candidateFilterLabel} htmlFor="candidate-decision-status">Trạng thái hồ sơ</label>
          <select
            id="candidate-decision-status"
            className={candidateFilterInput}
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="PENDING">Chờ xét duyệt</option>
            <option value="ACCEPTED">Đã nhận</option>
            <option value="REJECTED">Đã từ chối</option>
          </select>
        </div>
      </div>
      {!loading && reviewSchedules.length > 0 && <div aria-label="Thời hạn duyệt hồ sơ" className="space-y-3 border-b border-slate-100 px-4 py-3">
        {reviewSchedules.map(schedule => <div key={schedule.id} className="min-w-0 space-y-1.5">
          <p className="text-sm font-semibold text-slate-800">{schedule.name}</p>
          <div className="flex flex-col gap-2 text-sm lg:flex-row lg:flex-wrap lg:gap-x-6">
            <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="font-medium text-slate-600">Hạn bắt đầu duyệt:</span>
              <time dateTime={schedule.resultsStartsAt ?? undefined} className="font-bold tabular-nums text-blue-700">{formatRecruitmentDateTime(schedule.resultsStartsAt)}</time>
            </p>
            <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="font-semibold text-slate-800">Hạn kết thúc duyệt:</span>
              <time dateTime={schedule.resultsEndsAt ?? undefined} className="font-bold tabular-nums text-orange-700">{formatRecruitmentDateTime(schedule.resultsEndsAt)}</time>
            </p>
          </div>
        </div>)}
      </div>}
      {periodsError && (
        <p role="alert" className="px-4 py-3 text-xs text-rose-700">{periodsError}</p>
      )}

      {/* Keep previously loaded rows visible while refreshing or recovering from an API error. */}
      {loading && candidates.length === 0 && (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            <p className="text-xs text-slate-500 font-medium">
              Đang tải danh sách ứng viên...
            </p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-6 bg-rose-50 text-center">
          <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
          <p className="text-sm text-rose-700 font-medium">{error}</p>
          {candidates.length > 0 && <p className="mt-1 text-xs text-rose-700">Đang giữ danh sách đã tải trước đó để bạn tiếp tục xem.</p>}
          <button
            onClick={fetchCandidates}
            disabled={loading}
            className="mt-3 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl transition-colors"
          >
            {loading ? 'Đang tải lại…' : 'Thử lại'}
          </button>
        </div>
      )}

      {loading && candidates.length > 0 && (
        <p role="status" className="border-b border-slate-100 bg-orange-50/70 px-4 py-2 text-xs text-orange-800">
          Đang cập nhật danh sách; dữ liệu đã tải vẫn được giữ trên màn hình.
        </p>
      )}

      {/* Empty State */}
      {!loading && !error && candidateTotal === 0 && (
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
      {filteredCandidates.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] table-fixed text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="w-10 px-2 py-3.5 text-center"><input type="checkbox" aria-label="Chọn tất cả hồ sơ có thể tiếp nhận" disabled={!selectable.length||bulkLoading||singleLoadingId!==null||acceptanceBusy||actionLoading!==null} checked={selectable.length>0&&selected.length===selectable.length} ref={node=>{if(node)node.indeterminate=selected.length>0&&selected.length<selectable.length;}} onChange={event=>setSelectedIds(previous=>{const next=new Set(previous);for(const candidate of selectable){if(event.target.checked)next.add(candidate.id);else next.delete(candidate.id);}return next;})}/></th>
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
                    <td className="px-2 py-4 text-center"><input type="checkbox" aria-label={'Chọn tiếp nhận '+c.student.fullName} disabled={!eligible(c)||bulkLoading||singleLoadingId!==null||acceptanceBusy||actionLoading!==null} checked={selectedIds.has(c.id)} onChange={event=>{const checked=event.target.checked;setSelectedIds(previous=>{const next=new Set(previous);if(checked)next.add(c.id);else next.delete(c.id);return next;});}}/></td>
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
                      <div className="break-words text-slate-700">{c.position.title}</div>
                    </td>

                    <td className="px-4 py-4 text-center text-slate-600">
                      {c.introducedAt ? new Date(c.introducedAt).toLocaleDateString('vi-VN') : '—'}
                    </td>

                    <td className="px-4 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${decisionColor(c.decision)}`}>
                        {decisionLabel(c.decision)}
                      </span>
                      {c.source?.startsWith('QHDN_')&&<p className="mt-1 text-[11px] text-slate-500">{c.source==='QHDN_APPLICATION'?'QHDN bổ sung ứng tuyển':'QHDN điều phối'}</p>}
                    </td>

                    <td className="px-3 py-4">
                      <div className="grid grid-cols-[32px_32px_32px] items-center justify-center gap-1.5">
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
                              disabled={actionLoading !== null || bulkLoading || singleLoadingId !== null || acceptanceBusy}
                              aria-label={`Tiếp nhận ${c.student.fullName}`}
                              title="Tiếp nhận"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {actionLoading === c.id || singleLoadingId === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDecision(c.id, 'REJECTED')}
                              disabled={actionLoading !== null || bulkLoading || singleLoadingId !== null || acceptanceBusy}
                              aria-label={`Từ chối ${c.student.fullName}`}
                              title="Từ chối"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600 transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {actionLoading === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
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
      {candidateTotal > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 p-4">
          <span className="text-xs font-medium text-slate-500">
            Hiển thị {(page - 1) * limit + 1}–{Math.min(page * limit, candidateTotal)} trong {candidateTotal} hồ sơ
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

      {acceptance&&acceptanceMode==='single'&&<WorkflowModal title="Xác nhận tiếp nhận sinh viên" subtitle="Kiểm tra thông tin sinh viên và chỉ tiêu trước khi xác nhận." busy={acceptanceBusy} onClose={()=>setAcceptance(null)}>
        <form className="space-y-5" onSubmit={event=>{event.preventDefault();void confirmAcceptance();}}>
          <section className="rounded-2xl border border-slate-200 p-4 sm:p-5" aria-label="Thông tin tiếp nhận sinh viên">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate font-bold text-slate-900">{acceptanceCandidate?.student.fullName ?? 'Sinh viên'}</h3>
                <p className="mt-1 text-sm text-slate-500">{acceptanceCandidate?.student.studentCode ?? '—'}</p>
              </div>
              <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">Chờ duyệt</span>
            </div>
            <dl className="mt-4 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2">
              <div><dt className="text-xs text-slate-500">Vị trí ứng tuyển</dt><dd className="mt-1 text-sm font-medium text-slate-800">{acceptanceCandidate?.position.title ?? '—'}</dd></div>
              <div><dt className="text-xs text-slate-500">Đợt OJT</dt><dd className="mt-1 text-sm font-medium text-slate-800">{acceptance.semesters.map(semester=>semester.name).join(', ') || '—'}</dd></div>
            </dl>
            {acceptance.semesters.map(semester=><div key={semester.ojtSemesterId} className="mt-4 border-t border-slate-100 pt-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-sm font-semibold text-slate-800">Chỉ tiêu · {semester.name}</h4>
                <span className={`text-xs font-semibold ${semester.excessCount ? 'text-orange-700' : 'text-emerald-700'}`}>
                  {semester.excessCount ? `Vượt ${semester.excessCount} sinh viên` : 'Trong chỉ tiêu'}
                </span>
              </div>
              <dl className="mt-3 grid grid-cols-2 divide-x divide-y divide-slate-100 rounded-lg border border-slate-100 sm:grid-cols-4 sm:divide-y-0">
                {[
                  { label: 'Chỉ tiêu', value: semester.capacity },
                  { label: 'Đã nhận', value: semester.currentCount },
                  { label: 'Sau khi duyệt', value: semester.afterCount },
                  { label: 'Vượt', value: semester.excessCount },
                ].map(item=><div key={item.label} className="px-3 py-2.5">
                  <dt className="text-xs text-slate-500">{item.label}</dt>
                  <dd className={`mt-1 font-semibold tabular-nums ${item.label==='Vượt'&&item.value?'text-orange-700':'text-slate-900'}`}>{item.value}</dd>
                </div>)}
              </dl>
            </div>)}
          </section>
          {acceptance.overCapacity&&<label className="flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50 p-3 text-sm text-orange-900"><input type="checkbox" className="mt-0.5" checked={allowOverCapacity} disabled={acceptanceBusy} onChange={event=>setAllowOverCapacity(event.target.checked)}/><span>Tôi đồng ý tiếp nhận sinh viên này vượt chỉ tiêu doanh nghiệp.</span></label>}
          {acceptanceError&&<p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{acceptanceError}</p>}
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button type="button" className={workflowSecondary} disabled={acceptanceBusy} onClick={()=>setAcceptance(null)}>Hủy</button>
            <button type="submit" className={workflowPrimary} disabled={acceptanceBusy||(acceptance.overCapacity&&!allowOverCapacity)}>{acceptanceBusy?'Đang tiếp nhận…':acceptance.overCapacity?'Xác nhận nhận vượt chỉ tiêu':'Xác nhận tiếp nhận'}</button>
          </div>
        </form>
      </WorkflowModal>}
      {acceptance&&acceptanceMode==='bulk'&&<WorkflowModal wide scrollable title={`Xác nhận tiếp nhận ${acceptance.totalSelected} sinh viên`} busy={bulkLoading} onClose={()=>setAcceptance(null)}>
        <form className="space-y-4" onSubmit={event=>{event.preventDefault();void confirmAcceptance();}}>
          <p className="text-sm text-slate-600">Chỉ tiêu ban đầu được giữ nguyên. Sinh viên được duyệt nhận sẽ được tính vào số thực nhận của doanh nghiệp.</p>
          <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm"><thead className="bg-slate-50 text-slate-500"><tr>{['Đợt OJT','Chỉ tiêu','Đã nhận','Đang chọn','Sau khi nhận','Vượt chỉ tiêu'].map(label=><th key={label} className="p-2.5">{label}</th>)}</tr></thead><tbody>{acceptance.semesters.map(semester=><tr key={semester.ojtSemesterId} className="border-t border-slate-100"><td className="p-2.5 font-medium">{semester.name}</td><td className="p-2.5 tabular-nums">{semester.capacity}</td><td className="p-2.5 tabular-nums">{semester.currentCount}</td><td className="p-2.5 tabular-nums">{semester.selectedCount}</td><td className="p-2.5 font-semibold tabular-nums">{semester.afterCount}</td><td className={'p-2.5 font-semibold tabular-nums '+(semester.excessCount?'text-orange-700':'text-slate-500')}>{semester.excessCount} sinh viên</td></tr>)}</tbody></table></div>
          {acceptance.overCapacity&&<label className="flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-900"><input type="checkbox" className="mt-0.5" checked={allowOverCapacity} disabled={bulkLoading} onChange={event=>setAllowOverCapacity(event.target.checked)}/><span>Tôi đồng ý nhận vượt chỉ tiêu theo số lượng chênh lệch hiển thị ở trên.</span></label>}
          {acceptanceError&&<p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{acceptanceError}</p>}
          <div className="flex justify-end gap-2"><button type="button" className={workflowSecondary} disabled={bulkLoading} onClick={()=>setAcceptance(null)}>Hủy</button><button type="submit" className={workflowPrimary} disabled={bulkLoading||(acceptance.overCapacity&&!allowOverCapacity)}>{bulkLoading?'Đang tiếp nhận…':acceptance.overCapacity?'Đồng ý nhận vượt chỉ tiêu':'Xác nhận tiếp nhận'}</button></div>
        </form>
      </WorkflowModal>}
      {selectedCandidate && <CandidateDetailModal
        key={selectedCandidate.id}
        candidate={selectedCandidate}
        busy={actionLoading !== null || bulkLoading || singleLoadingId !== null || acceptanceBusy}
        decisionLabel={decisionLabel(selectedCandidate.decision)}
        onClose={() => setSelectedCandidate(null)}
        onDecision={decision => handleDecision(selectedCandidate.id, decision)}
      />}
    </div>
  );
};

export default EnterpriseCandidates;
