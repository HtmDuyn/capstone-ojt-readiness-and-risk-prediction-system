import { useEffect, useState } from 'react';
import { Download, Eye, FileText, GraduationCap, LoaderCircle, RefreshCw, UserRound } from 'lucide-react';
import { getCvFile, getQhdnStudentDossier } from '@/services/qhdnService';
import type { QhdnStudentCv, QhdnStudentDossier } from '@/types/qhdn/qhdnTypes';
import { downloadFile } from '@/utils/downloadFile';
import { Notice, errorMessage } from './QhdnUi';
import { WorkflowModal, workflowSecondary } from './StudentWorkflowUi';

const display = (value: string | number | null | undefined) => value === null || value === undefined || value === '' ? 'Chưa cập nhật' : String(value);
const dateTime = (value: string | null | undefined) => value ? new Date(value).toLocaleString('vi-VN') : 'Chưa ghi nhận';
const studentStatuses: Record<string, string> = { ACTIVE: 'Đang học', INACTIVE: 'Không hoạt động', SUSPENDED: 'Tạm ngừng học', GRADUATED: 'Đã tốt nghiệp', DROPPED_OUT: 'Đã thôi học' };
const certificateUrl = (value: string) => {
  try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? url.href : null; }
  catch { return null; }
};

function ProfileFields({ fields }: { fields: [string, string | number | null | undefined][] }) {
  return <dl className="grid gap-3 text-sm sm:grid-cols-2">{fields.map(([label, value]) =>
    <div key={label} className="min-w-0 rounded-xl bg-slate-50 px-4 py-3"><dt className="text-xs text-slate-500">{label}</dt><dd className="mt-1 break-words font-medium text-slate-800">{display(value)}</dd></div>,
  )}</dl>;
}

function CvDocument({ studentId, cv, label }: { studentId: number; cv: QhdnStudentCv; label: string }) {
  const [preview, setPreview] = useState(false), [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false), [downloading, setDownloading] = useState(false), [error, setError] = useState('');
  useEffect(() => {
    setUrl('');
    if (!preview) return;
    const controller = new AbortController();
    let objectUrl = '';
    setLoading(true); setError('');
    getCvFile(studentId, cv.id, controller.signal).then(blob => {
      if (controller.signal.aborted) return;
      objectUrl = URL.createObjectURL(blob); setUrl(objectUrl);
    }).catch(async error => {
      if (controller.signal.aborted) return;
      const data = error.response?.data;
      const message = data instanceof Blob ? await data.text().then(text => { try { return JSON.parse(text).message; } catch { return null; } }) : null;
      if (!controller.signal.aborted) setError(message || errorMessage(error));
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => { controller.abort(); if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [studentId, cv.id, preview]);
  const download = async () => {
    setDownloading(true); setError('');
    try { await downloadFile(() => getCvFile(studentId, cv.id), cv.fileName || 'cv.pdf'); }
    catch (error) { setError(errorMessage(error)); }
    finally { setDownloading(false); }
  };
  return <article className="space-y-3 rounded-xl border border-slate-200 p-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3"><FileText size={20} className="mt-1 shrink-0 text-orange-600" /><div className="min-w-0">
        <p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-1 break-all text-sm font-semibold text-slate-800">{cv.fileName}</p>
        <p className="mt-1 text-xs text-slate-500">{(cv.size / 1024).toLocaleString('vi-VN', { maximumFractionDigits: 0 })} KB · Cập nhật {dateTime(cv.uploadedAt)}</p>
      </div></div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={workflowSecondary + ' !rounded-lg !px-3 !py-2 !text-xs'} aria-expanded={preview} onClick={() => setPreview(value => !value)}><Eye size={14} />{preview ? 'Ẩn CV' : 'Xem CV'}</button>
        <button type="button" className={workflowSecondary + ' !rounded-lg !px-3 !py-2 !text-xs'} disabled={downloading} onClick={download}>{downloading ? <LoaderCircle size={14} className="animate-spin" /> : <Download size={14} />}Tải CV</button>
      </div>
    </div>
    {error && <Notice>{error}</Notice>}
    {preview && loading && <p role="status" className="flex items-center gap-2 py-4 text-sm text-slate-500"><LoaderCircle size={16} className="animate-spin" />Đang tải CV…</p>}
    {preview && url && <><iframe title={label + ' của sinh viên'} src={url} className="h-[60vh] min-h-80 w-full rounded-lg border border-slate-200" /><p className="text-xs text-slate-500">Nếu trình duyệt không hiển thị PDF, chọn “Tải CV” để mở file.</p></>}
  </article>;
}

export function StudentProfileModal({ studentId, ojtSemesterId, fullName, onClose }: { studentId: number; ojtSemesterId: number; fullName: string; onClose: () => void }) {
  const [profile, setProfile] = useState<QhdnStudentDossier | null>(null), [loading, setLoading] = useState(true);
  const [error, setError] = useState(''), [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setProfile(null); setLoading(true); setError('');
    getQhdnStudentDossier(studentId, ojtSemesterId, controller.signal)
      .then(profile => { if (!controller.signal.aborted) setProfile(profile); })
      .catch(error => { if (!controller.signal.aborted) setError(errorMessage(error)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [studentId, ojtSemesterId, revision]);
  return <WorkflowModal wide title="Chi tiết hồ sơ sinh viên" subtitle={fullName} onClose={onClose}>
    {loading && <p role="status" className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500"><LoaderCircle size={18} className="animate-spin" />Đang tải hồ sơ sinh viên…</p>}
    {error && <div className="space-y-3"><Notice>{error}</Notice><button className={workflowSecondary} onClick={() => setRevision(value => value + 1)}><RefreshCw size={15} />Thử lại</button></div>}
    {profile && <div className="space-y-6">
      <section className="space-y-3"><h3 className="flex items-center gap-2 font-semibold text-slate-800"><UserRound size={18} className="text-orange-600" />Thông tin sinh viên</h3>
        <ProfileFields fields={[
          ['Họ và tên', profile.fullName], ['Mã sinh viên', profile.studentCode], ['Email', profile.email], ['Số điện thoại', profile.phone],
          ['Lớp', profile.className], ['Trạng thái học vụ', studentStatuses[profile.status] || profile.status],
        ]} />
      </section>
      <section className="space-y-3"><h3 className="flex items-center gap-2 font-semibold text-slate-800"><GraduationCap size={18} className="text-orange-600" />Ngành học và chương trình đào tạo</h3>
        <ProfileFields fields={[
          ['Ngành / chuyên ngành', profile.majorName], ['Mã ngành', profile.majorCode], ['Chương trình đào tạo', profile.programName], ['Mã chương trình', profile.programCode],
          ['Khóa', profile.cohortName], ['Nhóm', profile.groupCode], ['Năm nhập học', profile.enrollmentYear], ['Kỳ chuyên ngành thứ', profile.currentSemester],
          ['Học kỳ hiện tại', profile.currentPeriodName], ['Kỳ OJT đang xem', profile.semesterName],
        ]} />
      </section>
      <section className="space-y-3"><h3 className="flex items-center gap-2 font-semibold text-slate-800"><FileText size={18} className="text-orange-600" />Hồ sơ ứng tuyển</h3>
        {profile.registeredAt || profile.companyName ? <>
          <ProfileFields fields={[
            ['Doanh nghiệp', profile.companyName], ['Vị trí', profile.positionTitle], ['Email liên hệ trong hồ sơ', profile.applicationEmail],
            ['Số điện thoại trong hồ sơ', profile.applicationPhone], ['Thời gian nộp hồ sơ', dateTime(profile.registeredAt)],
          ]} />
          {profile.coverLetter && <div className="rounded-xl bg-slate-50 p-4 text-sm"><p className="font-medium text-slate-800">Thư ứng tuyển</p><p className="mt-2 whitespace-pre-wrap break-words leading-relaxed text-slate-600">{profile.coverLetter}</p></div>}
          {profile.rejectReason && <Notice>Lý do doanh nghiệp từ chối: {profile.rejectReason}</Notice>}
          {!!profile.certificates?.length && <div className="space-y-2 text-sm"><p className="font-medium text-slate-700">Chứng chỉ đính kèm</p>{profile.certificates.map((certificate, index) => {
            const href = certificateUrl(certificate.url);
            return <div key={index} className="break-words">{href ? <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">{certificate.name}</a> : <span className="text-slate-500">{certificate.name} · Liên kết không hợp lệ</span>}</div>;
          })}</div>}
        </> : <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">Sinh viên chưa gửi hồ sơ ứng tuyển trong học kỳ này.</p>}
      </section>
      <section className="space-y-3"><h3 className="font-semibold text-slate-800">CV của sinh viên</h3>
        {profile.submittedCv && <CvDocument key={'submitted-' + profile.submittedCv.id} studentId={studentId} cv={profile.submittedCv} label={profile.cv?.id === profile.submittedCv.id ? 'CV hiện tại · Đã gửi khi ứng tuyển' : 'CV đã gửi khi ứng tuyển'} />}
        {profile.cv && profile.cv.id !== profile.submittedCv?.id && <CvDocument key={profile.cv.id} studentId={studentId} cv={profile.cv} label="CV hiện tại" />}
        {!profile.cv && !profile.submittedCv && <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">Sinh viên chưa tải CV lên hệ thống.</p>}
      </section>
    </div>}
  </WorkflowModal>;
}
