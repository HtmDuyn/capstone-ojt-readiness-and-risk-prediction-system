import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, Check, CheckCircle2, Info, ShieldQuestion, Trash2, X } from 'lucide-react';

type Tone = 'warning' | 'success' | 'danger' | 'info';
interface FeedbackOptions {
  message: string;
  title?: string;
  tone?: Tone;
  confirmLabel?: string;
}

interface Props extends FeedbackOptions {
  confirmation?: boolean;
  onConfirm?: () => void;
  onClose: () => void;
}

export function RecruitmentNoticeDialog({ message, title = 'Thông báo tuyển dụng', tone = 'warning', confirmation = false, confirmLabel = 'Đã hiểu', onConfirm, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const id = useId();

  useEffect(() => {
    const element = dialog.current;
    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    element?.showModal();
    element?.querySelector<HTMLButtonElement>('[data-initial-focus]')?.focus();
    return () => { element?.close(); document.documentElement.style.overflow = previousOverflow; };
  }, []);

  const Icon = tone === 'success' ? CheckCircle2 : tone === 'danger' ? Trash2 : tone === 'info' ? Info : confirmation ? ShieldQuestion : AlertCircle;
  const iconColor = { warning: 'bg-amber-50 text-amber-600 ring-amber-100', success: 'bg-emerald-50 text-emerald-600 ring-emerald-100', danger: 'bg-rose-50 text-rose-600 ring-rose-100', info: 'bg-orange-50 text-orange-600 ring-orange-100' }[tone];
  const buttonColor = tone === 'danger' ? 'bg-rose-600 hover:bg-rose-700 focus-visible:outline-rose-600' : 'bg-orange-600 hover:bg-orange-700 focus-visible:outline-orange-600';

  return createPortal(<dialog ref={dialog} role="alertdialog" aria-modal="true" aria-labelledby={`${id}-title`} aria-describedby={`${id}-message`}
    className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-[420px] overflow-y-auto rounded-3xl border border-white/80 bg-white p-0 shadow-2xl backdrop:bg-slate-950/50 backdrop:backdrop-blur-sm"
    onKeyDown={event => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); }
    }}
    onKeyUp={event => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); onClose(); }
    }}
    onCancel={event => { event.preventDefault(); event.stopPropagation(); onClose(); }}>
    <div className="relative px-6 pb-6 pt-8 text-center sm:px-8">
      <button type="button" aria-label="Đóng thông báo" onClick={onClose} className="absolute right-3 top-3 rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"><X size={18} /></button>
      <span className={`mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl ring-8 ${iconColor}`}><Icon size={27} strokeWidth={1.8} aria-hidden="true" /></span>
      <h2 id={`${id}-title`} className="mt-6 text-xl font-semibold tracking-tight text-slate-900">{title}</h2>
      <p id={`${id}-message`} className="mt-3 whitespace-pre-line break-words text-sm leading-6 text-slate-500">{message}</p>
      <div className="mt-7 flex gap-3">
        {confirmation && <button type="button" data-feedback-cancel data-initial-focus onClick={onClose} className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400">Hủy</button>}
        <button type="button" data-feedback-confirm data-initial-focus={!confirmation || undefined} onClick={onConfirm ?? onClose} className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${buttonColor}`}>
          {!confirmation && <Check size={16} />}{confirmLabel}
        </button>
      </div>
    </div>
  </dialog>, document.body);
}

export function useRecruitmentFeedback() {
  const [feedback, setFeedback] = useState<(FeedbackOptions & { confirmation?: boolean }) | null>(null);
  const pending = useRef<((accepted: boolean) => void) | null>(null);
  useEffect(() => () => { pending.current?.(false); pending.current = null; }, []);

  const dismiss = useCallback(() => {
    const resolve = pending.current; pending.current = null;
    setFeedback(null); resolve?.(false);
  }, []);
  const accept = useCallback(() => {
    const resolve = pending.current; pending.current = null;
    setFeedback(null); resolve?.(true);
  }, []);
  const notify = useCallback((message: string, title = 'Thông báo tuyển dụng', tone: Tone = 'warning') => {
    pending.current?.(false); pending.current = null;
    setFeedback({ message, title, tone });
  }, []);
  const confirm = useCallback((options: FeedbackOptions) => {
    if (pending.current) return Promise.resolve(false);
    return new Promise<boolean>(resolve => {
      pending.current = resolve;
      setFeedback({ ...options, confirmation: true });
    });
  }, []);

  return { open: !!feedback, notify, confirm,
    dialog: feedback ? <RecruitmentNoticeDialog {...feedback} onClose={dismiss} onConfirm={accept} /> : null };
}
