import { useState, useRef, type FormEvent } from 'react';
import { useStudentPortal } from '@/contexts/StudentPortalContext';
import { uploadStudentCv, downloadStudentCv } from '@/services/student';
import { buttonClass, Card, dateText, Empty, inputClass } from './PortalUI';

export function StudentCvCard() {
  const { profile, refresh } = useStudentPortal();
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
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
    <Card title="CV ứng tuyển">
      {profile?.cv ? (
        <div className="text-sm space-y-2">
          <p className="font-bold">{profile.cv.fileName}</p>
          <p>
            {(profile.cv.size / 1024).toFixed(1)} KB ·{' '}
            {dateText(profile.cv.uploadedAt)}
          </p>
          <button
            disabled={busy}
            type="button"
            className={buttonClass}
            onClick={() =>
              void run(() => downloadStudentCv(profile.id, profile.cv!))
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
              await uploadStudentCv(file);
              refresh();
            });
        }}
      >
        <label className="block text-sm">
          Tải CV PDF (tối đa 10 MB)
          <input
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
