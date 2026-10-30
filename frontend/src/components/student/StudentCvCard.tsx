import { useState, useRef, type FormEvent } from 'react';
import { useStudentPortal } from '@/contexts/StudentPortalContext';
import { uploadStudentCv, downloadStudentCv } from '@/services/studentService';
import { buttonClass, Card, dateText, Empty, inputClass } from './PortalUI';
import type { CV } from '@/types/student/portal';

export function StudentCvCard({ cv: providedCv, onUploaded }: { cv?: CV | null; onUploaded?: (cv: CV) => void } = {}) {
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
    <Card title="CV của tôi">
      <p className="text-sm text-slate-500">Lưu CV để sử dụng khi ứng tuyển. Hồ sơ này sẽ được dùng để gợi ý doanh nghiệp phù hợp khi tính năng AI được tích hợp.</p>
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
        <label className="block text-sm">
          Tải CV PDF (tối đa 10 MB)
          <input
            ref={fileInput}
            disabled={busy}
            className={inputClass + ' mt-2'}
            type="file"
            accept="application/pdf,.pdf"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
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
    </Card>
  );
}
