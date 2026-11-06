import { useEffect, useRef, useState, type FormEvent } from 'react';
import { CalendarDays, Check, Eye, Loader2, LockKeyhole, Plus, Trash2, X } from 'lucide-react';
import { enterpriseService, type EnterpriseRecruitmentPostInput, type RecruitmentPost, type RecruitmentWindow } from '@/services/enterpriseService';
import { canEditRecruitmentPost, formatRecruitmentDate, postEditLockReason, recruitmentError, windowAcceptsPosts } from './recruitment';

interface PositionDraft {
  key: string; id?: number; title: string; description: string; requirements: string;
  capacity: string; minimum: number; location: string; workMode: string;
}
const newPosition = (): PositionDraft => ({ key: crypto.randomUUID(), title: '', description: '', requirements: '', capacity: '1', minimum: 0, location: '', workMode: '' });
const fieldClass = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:bg-slate-50';

interface Props {
  windows: RecruitmentWindow[];
  initialWindowId?: number;
  post: RecruitmentPost | null;
  now: number;
  onClose: () => void;
  onSaved: (post: RecruitmentPost) => void;
}

export function RecruitmentPostDialog({ windows, initialWindowId, post, now, onClose, onSaved }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const submitting = useRef(false);
  const [idempotencyKey] = useState(() => post ? '' : crypto.randomUUID());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [windowId, setWindowId] = useState(post?.windowId ?? initialWindowId ?? windows.find(w => windowAcceptsPosts(w, now))?.id ?? 0);
  const [title, setTitle] = useState(post?.title ?? '');
  const [content, setContent] = useState(post?.content ?? '');
  const [benefits, setBenefits] = useState(post?.benefits ?? '');
  const [instructions, setInstructions] = useState(post?.applicationInstructions ?? '');
  const [positions, setPositions] = useState<PositionDraft[]>(post?.positions?.length
    ? post.positions.map(p => ({ key: String(p.id), id: p.id, title: p.title, description: p.description ?? '', requirements: p.requirements ?? '',
      capacity: String(p.capacity), minimum: Math.max(0, p.capacity - p.remainingSlots), location: p.location ?? '', workMode: p.workMode ?? '' }))
    : [newPosition()]);
  const selectedWindow = windows.find(w => w.id === windowId);
  const accepts = windowAcceptsPosts(selectedWindow, now);
  const lockReason = post ? postEditLockReason(post, windows, now) : '';
  const canSave = accepts && !lockReason;
  const inputId = (suffix: string) => `recruitment-${suffix}`;

  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);

  const updatePosition = (key: string, changes: Partial<PositionDraft>) => setPositions(current => current.map(p => p.key === key ? { ...p, ...changes } : p));

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting.current) return;
    setError('');
    if (!windowAcceptsPosts(selectedWindow)) { setError('Đợt đăng tin không còn trong thời gian cho phép. Bạn chưa thể gửi tin này.'); return; }
    if (post && !canEditRecruitmentPost(post, windows)) { setError(postEditLockReason(post, windows)); return; }
    if (!title.trim() || !content.trim() || positions.some(p => !p.title.trim() || !p.description.trim() || !p.requirements.trim())) {
      setError('Vui lòng điền tiêu đề, nội dung, mô tả và yêu cầu cho từng vị trí.'); return;
    }
    if (positions.some(p => !p.capacity.trim() || !Number.isInteger(Number(p.capacity)) || Number(p.capacity) < p.minimum || Number(p.capacity) > 2147483647)) {
      setError('Chỉ tiêu phải là số nguyên không âm và không thấp hơn số sinh viên đã nhận.'); return;
    }
    if (!positions.some(p => Number(p.capacity) > 0)) { setError('Cần ít nhất một vị trí có chỉ tiêu lớn hơn 0.'); return; }
    const nullable = (value: string) => value.trim() || null;
    const payload: EnterpriseRecruitmentPostInput = {
      title: title.trim(), content: content.trim(), benefits: nullable(benefits), applicationInstructions: nullable(instructions),
      positions: positions.map(p => ({ ...(p.id ? { id: p.id } : {}), title: p.title.trim(), description: p.description.trim(), requirements: p.requirements.trim(),
        capacity: Number(p.capacity), location: nullable(p.location), workMode: (p.workMode || null) as EnterpriseRecruitmentPostInput['positions'][number]['workMode'] })),
    };
    submitting.current = true;
    setSaving(true);
    try {
      const response = post ? await enterpriseService.updateRecruitmentPost(post.id, payload)
        : await enterpriseService.createRecruitmentPost({ ...payload, windowId, idempotencyKey });
      if (!response.success || !response.data) throw new Error('Máy chủ chưa xác nhận lưu tin thành công. Vui lòng thử lại.');
      onSaved(response.data);
    } catch (err) { setError(recruitmentError(err)); }
    finally { submitting.current = false; setSaving(false); }
  };

  return <dialog ref={dialog} aria-labelledby="recruitment-dialog-title" className="m-auto max-h-none w-[calc(100%-1rem)] max-w-4xl overflow-hidden rounded-2xl border-0 p-0 shadow-2xl backdrop:bg-slate-900/50 sm:w-[calc(100%-3rem)]"
    onCancel={event => { event.preventDefault(); if (!submitting.current) onClose(); }}>
    <form onSubmit={save} className="flex max-h-[92dvh] flex-col">
      <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-7">
        <div><p className="mb-1 text-xs font-semibold uppercase tracking-wider text-orange-600">Tuyển dụng thực tập</p>
          <h2 id="recruitment-dialog-title" className="text-xl font-bold text-slate-900">{post ? 'Chỉnh sửa tin tuyển dụng' : 'Tạo tin tuyển dụng'}</h2>
          <p className="mt-1 text-sm text-slate-500">{post ? 'Nội dung cập nhật hiển thị ngay với sinh viên sau khi lưu.' : 'Một tin có thể tuyển nhiều vị trí. Đăng xong, sinh viên có thể xem ngay.'}</p></div>
        <button type="button" disabled={saving} onClick={onClose} aria-label="Đóng biểu mẫu" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-40"><X size={20} /></button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
      <fieldset disabled={saving} className="min-w-0 space-y-7 px-5 py-5 sm:px-7">
        <section className="space-y-3 border-b border-slate-100 pb-5">
          <label htmlFor={inputId('window')} className="flex items-center gap-2 text-sm font-semibold text-slate-800"><CalendarDays size={17} className="text-orange-600" />Đợt đăng tin <span className="text-rose-600">*</span></label>
          {post ? <p className="text-sm font-medium text-slate-800">{selectedWindow?.name ?? 'Đợt đăng tin không còn khả dụng'}</p>
            : <select id={inputId('window')} className={fieldClass} value={windowId} required onChange={e => setWindowId(Number(e.target.value))}>
              <option value="0" disabled>Chọn đợt đang mở</option>
              {windows.map(w => <option key={w.id} value={w.id} disabled={!windowAcceptsPosts(w, now)}>{w.name} · {w.periodCode} {!windowAcceptsPosts(w, now) ? '— Không nhận tin' : ''}</option>)}
            </select>}
          {selectedWindow && <div className="grid gap-2 text-xs text-slate-600 sm:grid-cols-2"><p>Mở đăng tin: <strong>{formatRecruitmentDate(selectedWindow.startsAt)}</strong></p>
            <p>Hạn đăng / sửa tin: <strong className="text-orange-800">{formatRecruitmentDate(selectedWindow.endsAt)}</strong></p></div>}
          {!accepts && <p role="status" className="text-sm text-rose-700">Đợt này hiện không nhận tin. Không thể gửi hoặc lưu thay đổi.</p>}
          {lockReason && accepts && <p role="status" className="flex items-start gap-2 text-sm text-amber-800"><LockKeyhole size={16} className="shrink-0" />{lockReason}</p>}
        </section>
        <section className="space-y-4">
          <h3 className="font-semibold text-slate-900">1. Thông tin chung</h3>
          <div><label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor={inputId('title')}>Tiêu đề tin <span className="text-rose-600">*</span></label>
            <input id={inputId('title')} className={fieldClass} value={title} onChange={e => setTitle(e.target.value)} required maxLength={500} placeholder="VD: Tuyển thực tập sinh Backend và Frontend" autoFocus /></div>
          <div><label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor={inputId('content')}>Nội dung tuyển dụng <span className="text-rose-600">*</span></label>
            <textarea id={inputId('content')} className={fieldClass} rows={4} value={content} onChange={e => setContent(e.target.value)} required maxLength={30000} placeholder="Giới thiệu công việc, môi trường thực tập và thông tin dành cho ứng viên..." /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor={inputId('benefits')}>Quyền lợi</label>
              <textarea id={inputId('benefits')} className={fieldClass} rows={3} value={benefits} onChange={e => setBenefits(e.target.value)} maxLength={10000} placeholder="Mentor, hỗ trợ thực tập, cơ hội việc làm..." /></div>
            <div><label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor={inputId('instructions')}>Hướng dẫn ứng tuyển</label>
              <textarea id={inputId('instructions')} className={fieldClass} rows={3} value={instructions} onChange={e => setInstructions(e.target.value)} maxLength={10000} placeholder="Thông tin cần có trong CV, hình thức phỏng vấn..." /></div>
          </div>
          <div className="border-l-2 border-slate-200 pl-3">
            <p className="text-sm font-medium text-slate-700">Hạn sinh viên ứng tuyển</p>
            <p id={inputId('deadline')} className="mt-1 text-sm text-slate-600">{post?.deadlineAt ? formatRecruitmentDate(post.deadlineAt) : 'Hệ thống áp dụng thời hạn do QHDN thiết lập khi đăng tin.'}</p>
            <p className="mt-1 text-xs text-slate-500">Thời hạn do Phòng Quan hệ doanh nghiệp quản lý. Doanh nghiệp không được chỉnh sửa.</p>
          </div>
        </section>
        <section className="space-y-4">
          <div><h3 className="font-semibold text-slate-900">2. Vị trí tuyển dụng <span className="text-orange-600">({positions.length})</span></h3><p className="mt-1 text-xs text-slate-500">Mô tả công việc và yêu cầu riêng cho từng vị trí.</p></div>
          {positions.map((p, index) => <section key={p.key} aria-label={`Vị trí ${index + 1}`} className="space-y-4 border-t border-slate-200 pt-5">
            <div className="flex items-center justify-between"><h4 className="flex items-center gap-2 text-sm font-semibold text-slate-700"><span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-orange-50 text-xs text-orange-700">{index + 1}</span>{p.title || `Vị trí ${index + 1}`}{p.id && <span className="text-xs font-normal text-slate-400">Đã lưu</span>}</h4>
              {!p.id && positions.length > 1 && <button type="button" onClick={() => setPositions(current => current.filter(item => item.key !== p.key))} aria-label={`Xóa vị trí ${index + 1}`} className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50"><Trash2 size={16} /></button>}</div>
            <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
              <div><label htmlFor={inputId(`position-${index}-title`)} className="mb-1.5 block text-sm font-medium text-slate-700">Tên vị trí *</label><input id={inputId(`position-${index}-title`)} className={fieldClass} required maxLength={150} value={p.title} onChange={e => updatePosition(p.key, { title: e.target.value })} placeholder="VD: Backend Intern" /></div>
              <div><label htmlFor={inputId(`position-${index}-capacity`)} className="mb-1.5 block text-sm font-medium text-slate-700">Chỉ tiêu *</label><input id={inputId(`position-${index}-capacity`)} className={fieldClass} type="number" required min={p.minimum} max={2147483647} step={1} value={p.capacity} onChange={e => updatePosition(p.key, { capacity: e.target.value })} />
                {p.minimum > 0 && <p className="mt-1 text-xs text-amber-700">Đã nhận {p.minimum} sinh viên</p>}</div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label htmlFor={inputId(`position-${index}-description`)} className="mb-1.5 block text-sm font-medium text-slate-700">Mô tả công việc *</label><textarea id={inputId(`position-${index}-description`)} className={fieldClass} rows={3} required maxLength={20000} value={p.description} onChange={e => updatePosition(p.key, { description: e.target.value })} /></div>
              <div><label htmlFor={inputId(`position-${index}-requirements`)} className="mb-1.5 block text-sm font-medium text-slate-700">Yêu cầu ứng viên *</label><textarea id={inputId(`position-${index}-requirements`)} className={fieldClass} rows={3} required maxLength={20000} value={p.requirements} onChange={e => updatePosition(p.key, { requirements: e.target.value })} /></div>
              <div><label htmlFor={inputId(`position-${index}-location`)} className="mb-1.5 block text-sm font-medium text-slate-700">Địa điểm</label><input id={inputId(`position-${index}-location`)} className={fieldClass} maxLength={1000} value={p.location} onChange={e => updatePosition(p.key, { location: e.target.value })} placeholder="VD: TP.HCM" /></div>
              <div><label htmlFor={inputId(`position-${index}-mode`)} className="mb-1.5 block text-sm font-medium text-slate-700">Hình thức làm việc</label><select id={inputId(`position-${index}-mode`)} className={fieldClass} value={p.workMode} onChange={e => updatePosition(p.key, { workMode: e.target.value })}>
                <option value="">Chưa chọn</option><option value="ONSITE">Tại văn phòng</option><option value="REMOTE">Từ xa</option><option value="HYBRID">Kết hợp</option></select></div>
            </div>
            {p.id && <p className="text-xs text-slate-500">Vị trí đã lưu được giữ lại cùng lịch sử ứng tuyển. Có thể đặt chỉ tiêu bằng 0 nếu chưa nhận sinh viên.</p>}
          </section>)}
          <button type="button" disabled={positions.length >= 50} onClick={() => setPositions(current => [...current, newPosition()])} className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-orange-300 px-4 py-3 text-sm font-semibold text-orange-700 hover:bg-orange-50 disabled:opacity-40"><Plus size={17} />Thêm vị trí tuyển dụng</button>
        </section>
      </fieldset>
      </div>
      <footer className="shrink-0 space-y-3 border-t border-slate-100 bg-white px-5 py-4 sm:px-7">
        {error && <p role="alert" className="rounded-xl border border-rose-100 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="flex items-center gap-1.5 text-xs text-slate-500"><Eye size={14} />Hiển thị ngay với sinh viên sau khi lưu.</p>
          <div className="flex justify-end gap-3"><button type="button" disabled={saving} onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 disabled:opacity-40">Hủy</button>
            <button type="submit" disabled={saving || !canSave} className="flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50">
              {saving ? <Loader2 size={17} className="animate-spin" /> : <Check size={17} />}{saving ? 'Đang lưu...' : post ? 'Lưu thay đổi' : 'Đăng tin tuyển dụng'}</button></div></div>
      </footer>
    </form>
  </dialog>;
}
