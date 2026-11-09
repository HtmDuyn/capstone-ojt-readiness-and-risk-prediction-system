import { useState, useRef, type FormEvent } from 'react';
import { useStudentPortal } from '@/contexts/StudentPortalContext';
import { uploadStudentCv, downloadStudentCv } from '@/services/studentService';
import { buttonClass, Card, dateText, Empty } from './PortalUI';
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
  return (
    <Card title="CV của tôi" className={embedded ? '!rounded-none !border-0 !p-0 !shadow-none [&>h2]:!text-base [&>h2]:!font-semibold' : ''}>
      <p className="text-sm leading-relaxed text-slate-600">Tải CV lên để sử dụng khi ứng tuyển. Sau khi phân tích CV, bạn có thể xem, chỉnh sửa và xác nhận thông tin hồ sơ bên dưới.</p>
      {cv ? (
        <div className="text-sm space-y-2">
          <p className="font-bold break-all">{cv.fileName}</p>
          <p>
            {(cv.size / 1024).toFixed(1)} KB ·{' '}
            {dateText(cv.uploadedAt)}
          </p>
          <button
            disabled={busy}
            type="button"
            className={buttonClass}
            onClick={() =>
              profile && void run(() => downloadStudentCv(profile.id, cv))
            }
          >
            Tải CV hiện tại
          </button>
        </div>
      ) : (
        <Empty>Bạn chưa tải CV lên hệ thống.</Empty>
      )}
      <form
        className="space-y-3"
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
        <label className="block text-sm text-slate-700">
          Tải CV PDF (tối đa 10 MB)
          <span className="relative mt-2 flex min-w-0 items-center gap-3">
          <input
            ref={fileInput}
            disabled={busy}
            className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
            type="file"
            accept="application/pdf,.pdf"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
          <span className="shrink-0 rounded-lg border border-slate-300 bg-white px-4 py-2 font-medium text-slate-800 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-orange-500">Chọn tệp CV</span>
          <span className="min-w-0 truncate text-slate-600">{file?.name ?? 'Chưa chọn tệp'}</span>
          </span>
        </label>
        <button type="submit" className={buttonClass} disabled={busy || !file}>
          {busy ? 'Đang xử lý...' : 'Lưu CV'}
        </button>
      </form>
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      {cv&&<CvExtractionCard key={cv.id} cvFileId={cv.id}/>}
    </Card>
  );
}
