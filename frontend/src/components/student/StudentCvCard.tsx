import { useState, useRef, type FormEvent } from 'react';
import { useStudentPortal } from '@/contexts/StudentPortalContext';
import { uploadStudentCv, downloadStudentCv } from '@/services/studentService';
import { buttonClass, dateText } from './PortalUI';
import { FileText, CloudUpload, Download, LoaderCircle } from 'lucide-react';
import type { CV } from '@/types/student/portal';
import { CvExtractionCard } from './CvExtractionCard';

export function StudentCvCard({ cv: providedCv, onUploaded, embedded = false }: { cv?: CV | null; onUploaded?: (cv: CV) => void; embedded?: boolean } = {}) {
  const { profile, refresh } = useStudentPortal();
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const cv = providedCv === undefined ? profile?.cv : providedCv;
  const run = async (work: () => Promise<unknown>) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      await work();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không xử lý được CV.');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const cvContent = (
    <section aria-label="CV của tôi" className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <header className="flex items-start gap-3"><span className="rounded-xl bg-orange-50 p-2.5 text-orange-600"><FileText size={22}/></span><div><h2 className="text-lg font-semibold text-slate-800">CV của tôi</h2><p className="mt-1 text-sm text-slate-500">Quản lý CV sử dụng cho quá trình ứng tuyển thực tập.</p></div></header>
      <div className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-2">
      {cv ? (
        <div className="flex min-w-0 flex-col items-start gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm">
          <h3 className="flex items-center gap-2 text-base font-semibold text-slate-800"><FileText size={20} className="shrink-0 text-orange-500"/>CV hiện tại</h3>
          <div className="min-w-0 w-full"><p title={cv.fileName} className="break-words font-semibold text-slate-800 [overflow-wrap:anywhere]">{cv.fileName}</p>
          <p className="mt-1 text-xs text-slate-500">
            {(cv.size / 1024).toFixed(1)} KB ·{' '}
            {dateText(cv.uploadedAt)}
          </p></div>
          <button
            disabled={busy}
            type="button"
            className="mt-auto inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
            onClick={() =>
              profile && void run(() => downloadStudentCv(profile.id, cv))
            }
          >
            {busy?<LoaderCircle size={16} className="animate-spin"/>:<Download size={16}/>} Tải CV
          </button>
        </div>
      ) : (
        <div className="flex min-w-0 flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5"><h3 className="flex items-center gap-2 text-base font-semibold text-slate-800"><FileText size={20} className="text-orange-500"/>CV hiện tại</h3><p className="text-sm leading-relaxed text-slate-500">Bạn chưa tải CV lên hệ thống. Chọn một tệp PDF để bắt đầu.</p></div>
      )}
      <form
        className="flex min-w-0 flex-col gap-4 rounded-2xl border border-dashed border-slate-300 bg-white p-5"
        onSubmit={(event: FormEvent) => {
          event.preventDefault();
          if (file)
            void run(async () => {
              const uploaded = await uploadStudentCv(file);
              setFile(null);
              if (fileInput.current) fileInput.current.value = '';
              if (onUploaded) onUploaded(uploaded); else refresh();
            });
        }}
      >
        <div><h3 className="flex items-center gap-2 text-base font-semibold text-slate-800"><CloudUpload size={20} className="shrink-0 text-orange-500"/>Tải CV mới</h3><p className="mt-2 text-sm text-slate-500">PDF · Tối đa 10 MB</p></div>
        <label className="block text-sm text-slate-700"><span className="sr-only">Chọn tệp CV</span>
          <span className="relative flex min-w-0 flex-col items-start gap-3">
          <input
            ref={fileInput}
            disabled={busy}
            className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
            type="file"
            accept="application/pdf,.pdf"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
          <span className="shrink-0 rounded-lg border border-slate-300 bg-white px-4 py-2 font-medium text-slate-800 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-orange-500">Chọn tệp CV</span>
          <span title={file?.name} className="block w-full min-w-0 truncate text-slate-500">{file?.name ?? 'Chưa chọn tệp'}</span>
          </span>
        </label>
        <button type="submit" className={buttonClass+' mt-auto inline-flex w-full items-center justify-center gap-2'} disabled={busy || !file}>
          {busy && <LoaderCircle size={16} className="animate-spin"/>}{busy ? 'Đang xử lý...' : 'Lưu CV'}
        </button>
      </form>
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
    </section>
  );
  return <div className="min-w-0 space-y-5" data-embedded={embedded}>{cvContent}{cv&&<CvExtractionCard key={cv.id} cvFileId={cv.id}/>}</div>;
}
