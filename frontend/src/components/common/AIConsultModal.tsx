import { useEffect, useRef, useState } from 'react';
import { BotSparkleIcon, CloseIcon } from './icons/AppIcons';
import { useOptionalStudentPortal } from '@/contexts/StudentPortalContext';
import { getRoadmap } from '@/services/student';
import type { Roadmap } from '@/types/student/portal';
import { buttonClass } from '@/components/student/PortalUI';

interface AIConsultModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: { fullName: string };
  initialQuery?: string;
}
export const AIConsultModal = ({
  isOpen,
  onClose,
  student,
}: AIConsultModalProps) => {
  const portal = useOptionalStudentPortal();
  const [data, setData] = useState<Roadmap | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const controller = useRef<AbortController | null>(null);
  const locked = useRef(false);
  const semester = portal?.semesterId;
  useEffect(() => {
    controller.current?.abort();
    locked.current = false;
    setData(null);
    setError('');
    setBusy(false);
    return () => {
      controller.current?.abort();
    };
  }, [isOpen, semester, portal?.profile?.id]);
  const request = async () => {
    if (!semester || locked.current || portal?.loading) return;
    const requestController = new AbortController();
    controller.current = requestController;
    locked.current = true;
    setBusy(true);
    setError('');
    setData(null);
    try {
      const result = await getRoadmap(semester, requestController.signal);
      if (!requestController.signal.aborted) setData(result);
    } catch (err) {
      if (!requestController.signal.aborted)
        setError(
          err instanceof Error ? err.message : 'Dịch vụ tư vấn chưa khả dụng.',
        );
    } finally {
      if (!requestController.signal.aborted) {
        locked.current = false;
        setBusy(false);
      }
    }
  };
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
      <section
        role="dialog"
        aria-modal="true"
        aria-label="AI tư vấn lộ trình OJT"
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
      >
        <header className="flex justify-between items-center px-6 py-4 bg-gradient-to-r from-orange-500 via-amber-500 to-purple-600 text-white">
          <h2 className="flex items-center gap-3 font-bold">
            <BotSparkleIcon size={22} />
            AI tư vấn lộ trình OJT
          </h2>
          <button type="button" onClick={onClose} aria-label="Đóng tư vấn">
            <CloseIcon size={20} />
          </button>
        </header>
        <div className="p-6 overflow-y-auto space-y-4">
          <p className="text-sm">
            Xin chào {student.fullName}! Bạn có thể lấy tư vấn lộ trình dựa trên
            hồ sơ học tập và đợt OJT đã chọn.
          </p>
          {!semester && (
            <p className="text-sm text-amber-800">
              Chọn đợt OJT trước khi yêu cầu tư vấn.
            </p>
          )}
          {busy && (
            <p role="status" className="text-sm">
              Đang lấy tư vấn từ dịch vụ AI...
            </p>
          )}
          {error && (
            <p
              role="alert"
              className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800"
            >
              {error}
            </p>
          )}
          {data && (
            <>
              <p className="text-xs text-slate-500">
                Mô hình: {data.modelVersion}
              </p>
              {data.recommendations.map((recommendation, index) => (
                <p
                  key={index}
                  className="rounded-2xl bg-orange-50 p-4 text-sm whitespace-pre-wrap"
                >
                  {recommendation}
                </p>
              ))}
              {!data.recommendations.length && (
                <p className="text-sm">Chưa có khuyến nghị.</p>
              )}
            </>
          )}
        </div>
        <footer className="border-t p-4">
          <button
            type="button"
            className={buttonClass}
            disabled={busy || !semester || portal?.loading}
            onClick={() => void request()}
          >
            {busy ? 'Đang xử lý...' : 'Lấy tư vấn lộ trình'}
          </button>
        </footer>
      </section>
    </div>
  );
};
