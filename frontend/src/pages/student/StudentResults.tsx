import { useState } from 'react';
import { Award, Download, Eye, FileCheck2, GraduationCap, Star } from 'lucide-react';
import { downloadOjtCertificate, getStudentOjtCertificates, type OjtCertificate } from '@/services/ojtCertificateService';
import { OjtCertificatePreviewDialog } from '@/components/common/OjtCertificatePreviewDialog';
import { PublishedOjtEvaluation } from '@/components/student/PublishedOjtEvaluation';
import { friendlyErrorMessage } from '@/utils/shared/friendlyError';
import { useStudentPortal } from '@/contexts/StudentPortalContext';
import { useStudentResource } from '@/hooks/student/useStudentResource';
import { getOjtResults } from '@/services/studentService';
import {
  buttonClass,
  dateText,
  Empty,
  Pagination,
  ResourceState,
  StudentPage,
} from '@/components/student/PortalUI';
function ResultsContent() {
  const { profile, semesterId, revision } = useStudentPortal();
  const [page, setPage] = useState(1);
  const [downloadingCertificate, setDownloadingCertificate] = useState<number|null>(null);
  const [viewingCertificate, setViewingCertificate] = useState<OjtCertificate|null>(null);
  const [certificateDownloadError, setCertificateDownloadError] = useState('');
  const key = profile!.id + ':' + semesterId + ':' + revision;
  const list = useStudentResource(semesterId ? 'ojt-results:' + key + ':' + page : null, (signal) =>
    getOjtResults(semesterId!, page, signal),
  );
  const items = list.data?.items ?? [];
  const certificates = useStudentResource(semesterId ? 'ojt-certificates:' + key : null,
    signal => getStudentOjtCertificates(semesterId!, signal));
  const scoredItems = items.filter(item => item.overallScore != null && Number.isFinite(Number(item.overallScore)));
  const averageScore = scoredItems.length
    ? scoredItems.reduce((sum, item) => sum + Number(item.overallScore), 0) / scoredItems.length
    : null;
  return (
    <>
      <div className="w-full min-w-0 space-y-5">
      <section className="grid gap-3 sm:grid-cols-3" aria-label="Tổng quan kết quả OJT">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700"><GraduationCap size={22}/></span><span><span className="block text-xs font-medium text-slate-500">Kết quả đã công bố</span><strong className="mt-0.5 block text-xl text-slate-900">{list.loading ? '—' : list.data?.total ?? 0}</strong></span></div>
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-600"><Star size={21}/></span><span><span className="block text-xs font-medium text-slate-500">Điểm trung bình OJT</span><strong className="mt-0.5 block text-xl tabular-nums text-slate-900">{averageScore === null || !Number.isFinite(averageScore) ? '—' : averageScore.toFixed(2)}<span className="ml-1 text-xs font-medium text-slate-400">/ 10</span></strong></span></div>
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><Award size={21}/></span><span><span className="block text-xs font-medium text-slate-500">Chứng chỉ OJT</span><strong className="mt-0.5 block text-xl text-slate-900">{certificates.loading ? '—' : certificates.data?.length ?? 0}</strong></span></div>
      </section>
      <section aria-labelledby="published-results-heading" className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-orange-50/50 px-5 py-5 sm:px-6">
          <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-orange-700">Hồ sơ thực tập</p><h2 id="published-results-heading" className="mt-1 text-lg font-bold text-slate-900">Kết quả OJT đã công bố</h2><p className="mt-1 text-sm text-slate-500">Điểm số, tiêu chí và nhận xét từ doanh nghiệp.</p></div>
          {list.data && <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">{list.data.total} kết quả</span>}
        </div>
        <div className="space-y-4 p-5 sm:p-6">
        <ResourceState
          loading={list.loading}
          error={list.error}
          retry={list.reload}
        />
        <>
            {items.map(result => <PublishedOjtEvaluation key={result.id} result={result}/>)}
            {!list.loading && !list.error && !items.length && (
              <Empty>{semesterId ? 'Chưa có kết quả OJT được công bố trong đợt này.' : 'Chưa có điểm và nhận xét. Kết quả sẽ được cập nhật sau khi bạn tham gia OJT và được công bố đánh giá.'}</Empty>
            )}
            {(list.data?.total ?? 0) > 20 && <Pagination
              page={page}
              total={list.data?.total ?? 0}
              onChange={(value) => {
                setPage(value);
              }}
              disabled={list.loading || !semesterId}
            />}
          </>
        </div>
      </section>
      <section aria-labelledby="ojt-certificates-heading" className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-gradient-to-r from-blue-50/70 to-white px-5 py-4 sm:px-6"><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-blue-700">Minh chứng hoàn thành</p><h2 id="ojt-certificates-heading" className="mt-1 flex items-center gap-2 text-base font-bold text-slate-900"><FileCheck2 size={19} className="text-blue-600" aria-hidden="true" />Chứng chỉ hoàn thành OJT</h2></div>{!certificates.loading && !certificates.error && <span className={'rounded-full px-3 py-1.5 text-xs font-semibold ' + (certificates.data?.length ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500')}>{certificates.data?.length ? `${certificates.data.length} chứng chỉ` : 'Chưa có chứng chỉ'}</span>}</div>
        <div className="space-y-3 p-5 sm:p-6">
        <ResourceState loading={certificates.loading} error={certificates.error} retry={certificates.reload}/>
        {certificateDownloadError&&<p role="alert" className="text-sm text-rose-700">{certificateDownloadError}</p>}
        {!!certificates.data?.length&&<ul className="divide-y divide-slate-100">{certificates.data.map(certificate=><li key={certificate.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 px-4 py-4 first:mt-0">
          <div className="flex min-w-0 items-start gap-3"><FileCheck2 size={20} className="mt-0.5 shrink-0 text-emerald-600" aria-hidden="true"/><div className="min-w-0"><p className="break-all text-sm font-semibold text-slate-900">{certificate.fileName}</p><p className="mt-1 text-xs text-slate-500">{certificate.enterpriseName} · {certificate.semesterCode} · {dateText(certificate.uploadedAt)}</p></div></div>
          <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700" onClick={()=>setViewingCertificate(certificate)}><Eye size={15}/>Xem chứng chỉ</button>
          <button type="button" disabled={downloadingCertificate!==null} className={buttonClass+' inline-flex items-center gap-2'} onClick={async()=>{
            if(downloadingCertificate!==null)return;
            setDownloadingCertificate(certificate.id);setCertificateDownloadError('');
            try{await downloadOjtCertificate(certificate,true);}catch(e){setCertificateDownloadError(friendlyErrorMessage(e,'Không tải được chứng chỉ.'));}
            finally{setDownloadingCertificate(null);}
          }}><Download size={15}/>{downloadingCertificate===certificate.id?'Đang tải…':'Tải về'}</button>
          </div>
        </li>)}</ul>}
        {!certificates.loading&&!certificates.error&&!certificates.data?.length&&<Empty>Chưa có chứng chỉ được công bố{semesterId ? ' cho kỳ OJT này' : ''}.</Empty>}
        </div>
      </section>
      </div>
      {viewingCertificate&&<OjtCertificatePreviewDialog key={viewingCertificate.id} certificate={viewingCertificate} student onClose={()=>setViewingCertificate(null)}/>}
    </>
  );
}
export const StudentEvaluationResults = () => {
  const { profile, semesterId, loading } = useStudentPortal();
  return (
    <StudentPage
      title="Kết quả đánh giá thực tập OJT"
      description="Điểm và nhận xét từ doanh nghiệp được Phòng Quan hệ doanh nghiệp công bố cho sinh viên."
      needsSemester={false}
    >
      {!loading && profile && (
        <ResultsContent key={profile.id + ':' + semesterId} />
      )}
    </StudentPage>
  );
};
export default StudentEvaluationResults;
