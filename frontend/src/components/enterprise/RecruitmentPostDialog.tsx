import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { CalendarDays, Check, Eye, Loader2, LockKeyhole, Plus, Save, Trash2, X } from 'lucide-react';
import { enterpriseService, type EnterpriseRecruitmentPostInput, type RecruitmentPost, type RecruitmentWindow } from '@/services/enterpriseService';
import { canEditRecruitmentPost, canPublishRecruitmentPost, formatRecruitmentDate, postEditLockReason, postPublishLockReason, recruitmentError, windowAcceptsPosts, windowAllowsPostCreation } from '@/utils/enterprise/recruitment';
import { useRecruitmentFeedback } from './RecruitmentNoticeDialog';

interface PositionDraft {
  key: string; id?: number; title: string; description: string; requirements: string;
  capacity: string; minimum: number; location: string; workMode: string;
}
type PositionField = 'title' | 'capacity' | 'description' | 'requirements';
interface FormValidationErrors {
  title?: string;
  content?: string;
  positions: Record<string, Partial<Record<PositionField, string>>>;
  positiveCapacity?: string;
}
const newPosition = (): PositionDraft => ({ key: crypto.randomUUID(), title: 'Thực tập sinh Backend', description: 'Tham gia phát triển API, tối ưu cơ sở dữ liệu và phối hợp với nhóm frontend để hoàn thiện sản phẩm.', requirements: 'Sinh viên ngành Công nghệ thông tin; biết cơ bản về Node.js, SQL và Git; chủ động học hỏi, làm việc nhóm tốt.', capacity: '1', minimum: 0, location: 'TP. Hồ Chí Minh', workMode: '' });
const fieldClass = (invalid = false) => `w-full rounded-xl border ${invalid ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-100' : 'border-slate-200 focus:border-orange-500 focus:ring-orange-100'} bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 disabled:bg-slate-50`;
const errorClass = 'mt-1 text-xs text-rose-600';

function validateForm(title: string, content: string, positions: PositionDraft[]): FormValidationErrors {
  const errors: FormValidationErrors = { positions: {} };
  if (!title.trim()) errors.title = 'Vui lòng nhập tiêu đề tin tuyển dụng.';
  if (!content.trim()) errors.content = 'Vui lòng nhập nội dung tuyển dụng.';

  for (const position of positions) {
    const positionErrors: Partial<Record<PositionField, string>> = {};
    if (!position.title.trim()) positionErrors.title = 'Vui lòng nhập tên vị trí.';
    if (!position.description.trim()) positionErrors.description = 'Vui lòng nhập mô tả công việc.';
    if (!position.requirements.trim()) positionErrors.requirements = 'Vui lòng nhập yêu cầu ứng viên.';
    const capacity = Number(position.capacity);
    if (!position.capacity.trim()) positionErrors.capacity = 'Vui lòng nhập chỉ tiêu.';
    else if (!Number.isInteger(capacity) || capacity < position.minimum || capacity > 2147483647) {
      positionErrors.capacity = `Chỉ tiêu phải là số nguyên từ ${position.minimum} đến 2147483647.`;
    }
    if (Object.keys(positionErrors).length) errors.positions[position.key] = positionErrors;
  }

  const capacitiesValid = positions.every(position => {
    const capacity = Number(position.capacity);
    return position.capacity.trim() !== '' && Number.isInteger(capacity) &&
      capacity >= position.minimum && capacity <= 2147483647;
  });
  if (capacitiesValid && !positions.some(position => Number(position.capacity) > 0)) {
    errors.positiveCapacity = 'Cần ít nhất một vị trí có chỉ tiêu lớn hơn 0.';
  }
  return errors;
}

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
  const [validationAttempted, setValidationAttempted] = useState(false);
  const feedback = useRecruitmentFeedback();
  const previousFocus = useRef<HTMLElement | null>(null);
  const [windowId, setWindowId] = useState(post?.windowId ?? initialWindowId ?? windows.find(w => windowAcceptsPosts(w, now))?.id ?? windows[0]?.id ?? 0);
  const [title, setTitle] = useState(post?.title ?? 'Tuyển thực tập sinh Backend');
  const [content, setContent] = useState(post?.content ?? 'Chúng tôi đang tìm kiếm thực tập sinh Backend tham gia phát triển và duy trì các dịch vụ web. Bạn sẽ được hướng dẫn bởi đội ngũ kỹ sư, tham gia dự án thực tế và rèn luyện quy trình làm việc chuyên nghiệp.');
  const [benefits, setBenefits] = useState(post?.benefits ?? 'Được mentor hướng dẫn; hỗ trợ xác nhận thực tập; cơ hội trở thành nhân viên chính thức.');
  const [instructions, setInstructions] = useState(post?.applicationInstructions ?? 'Gửi CV kèm liên kết GitHub hoặc sản phẩm đã thực hiện. Ứng viên phù hợp sẽ được mời phỏng vấn trực tuyến.');
  const [positions, setPositions] = useState<PositionDraft[]>(post?.positions?.length
    ? post.positions.map(p => ({ key: String(p.id), id: p.id, title: p.title, description: p.description ?? '', requirements: p.requirements ?? '',
      capacity: String(p.capacity), minimum: Math.max(0, p.capacity - p.remainingSlots), location: p.location ?? '', workMode: p.workMode ?? '' }))
    : [newPosition()]);
  const selectedWindow = windows.find(w => w.id === windowId);
  const accepts = windowAcceptsPosts(selectedWindow, now);
  const lockReason = post ? postEditLockReason(post, windows, now) : '';
  const canSave = post ? !lockReason : windowAllowsPostCreation(selectedWindow);
  const inputId = (suffix: string) => `recruitment-${suffix}`;
  const validationErrors: FormValidationErrors = validationAttempted ? validateForm(title, content, positions) : { positions: {} };

  useLayoutEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (feedback.open) {
      if (element.contains(document.activeElement)) previousFocus.current = document.activeElement as HTMLElement;
      element.close();
    } else if (!element.open) {
      element.showModal();
      previousFocus.current?.focus({ preventScroll: true });
    }
  }, [feedback.open]);
  useEffect(() => {
    const element = dialog.current;
    return () => element?.close();
  }, []);

  const showError = (message: string) => feedback.notify(message, 'Kiểm tra thông tin');
  const updatePosition = (key: string, changes: Partial<PositionDraft>) => setPositions(current => current.map(p => p.key === key ? { ...p, ...changes } : p));

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting.current) return;
    const status = ((event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null)?.value === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT';
    if (!post && !windowAllowsPostCreation(selectedWindow)) {
      showError('Chỉ tạo tin tuyển dụng trong học kỳ đang diễn ra.'); return;
    }
    if (!post && status === 'PUBLISHED' && !windowAcceptsPosts(selectedWindow)) {
      const message = 'Đợt này chưa cho phép công bố. Bạn vẫn có thể lưu bản nháp.';
      feedback.notify(message, 'Không thể công bố tin');
      return;
    }
    if (post && !canEditRecruitmentPost(post, windows)) { showError(postEditLockReason(post, windows)); return; }
    if (status === 'PUBLISHED' && post && !canPublishRecruitmentPost(post, windows)) {
      feedback.notify(postPublishLockReason(post, windows), 'Không thể công bố tin'); return;
    }
    setValidationAttempted(true);
    const errors = validateForm(title, content, positions);
    if (errors.title || errors.content || errors.positiveCapacity || Object.keys(errors.positions).length) return;
    const nullable = (value: string) => value.trim() || null;
    const payload: EnterpriseRecruitmentPostInput = {
      status,
      title: title.trim(), content: content.trim(), benefits: nullable(benefits), applicationInstructions: nullable(instructions),
      positions: positions.map(p => ({ ...(p.id ? { id: p.id } : {}), title: p.title.trim(), description: p.description.trim(), requirements: p.requirements.trim(),
        capacity: Number(p.capacity), location: nullable(p.location), workMode: (p.workMode || null) as EnterpriseRecruitmentPostInput['positions'][number]['workMode'] })),
    };
    submitting.current = true;
    try {
      if (status === 'PUBLISHED' && !await feedback.confirm({ title: 'Công bố tin tuyển dụng?', message: 'Sinh viên sẽ thấy tin sau khi công bố. Sau đó, bạn không thể xóa tin.', confirmLabel: 'Công bố tin', tone: 'info' })) return;
      setSaving(true);
      const response = post ? await enterpriseService.updateRecruitmentPost(post.id, payload)
        : await enterpriseService.createRecruitmentPost({ ...payload, windowId, idempotencyKey });
      if (!response.success || !response.data) throw new Error('Chưa lưu được tin tuyển dụng. Vui lòng thử lại.');
      onSaved(response.data);
    } catch (err) {
      feedback.notify(recruitmentError(err), status === 'PUBLISHED' ? 'Không thể công bố tin' : 'Chưa lưu được bản nháp');
    }
    finally { submitting.current = false; setSaving(false); }
  };

  return createPortal(<><dialog ref={dialog} aria-labelledby="recruitment-dialog-title" className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-1rem)] max-w-4xl overflow-hidden rounded-2xl border-0 p-0 shadow-2xl backdrop:bg-slate-950/50 backdrop:backdrop-blur-sm sm:w-[calc(100%-3rem)]"
    onCancel={event => { event.preventDefault(); if (!submitting.current) onClose(); }}>
    <form onSubmit={save} noValidate className="flex max-h-[min(92dvh,calc(100dvh-2rem))] flex-col">
      <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-7">
        <div><p className="mb-1 text-xs font-semibold uppercase tracking-wider text-orange-600">Tuyển dụng thực tập</p>
          <h2 id="recruitment-dialog-title" className="text-xl font-bold text-slate-900">{post ? 'Chỉnh sửa tin tuyển dụng' : 'Tạo tin tuyển dụng'}</h2>
          <p className="mt-1 text-sm text-slate-500">Lưu nháp để tiếp tục chỉnh sửa hoặc công bố cho sinh viên xem ngay trong Hạn 1.</p></div>
        <button type="button" disabled={saving} onClick={onClose} aria-label="Đóng biểu mẫu" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-40"><X size={20} /></button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
      <fieldset disabled={saving || !canSave} className="min-w-0 space-y-7 px-5 py-5 sm:px-7">
        <section className="space-y-3 border-b border-slate-100 pb-5">
          <label htmlFor={inputId('window')} className="flex items-center gap-2 text-sm font-semibold text-slate-800"><CalendarDays size={17} className="text-orange-600" />Đợt đăng tin <span className="text-rose-600">*</span></label>
          {post ? <p className="text-sm font-medium text-slate-800">{selectedWindow?.name ?? 'Đợt đăng tin không còn khả dụng'}</p>
            : <select id={inputId('window')} className={fieldClass()} value={windowId} required onChange={e => setWindowId(Number(e.target.value))}>
              <option value="0" disabled>Chọn đợt đăng tin</option>
              {windows.map(w => <option key={w.id} value={w.id}>{w.name} · {w.periodCode} {!windowAcceptsPosts(w, now) ? '— Chỉ lưu nháp' : ''}</option>)}
            </select>}
          {selectedWindow && <div className="grid gap-2 text-xs text-slate-600 sm:grid-cols-2"><p>Mở đăng tin: <strong>{formatRecruitmentDate(selectedWindow.postingStartsAt ?? selectedWindow.startsAt)}</strong></p>
            <p>Hạn công bố tin: <strong className="text-orange-800">{formatRecruitmentDate(selectedWindow.postingDeadlineAt ?? selectedWindow.endsAt)}</strong></p>
            {selectedWindow.applicationStartsAt && <p>Sinh viên bắt đầu ứng tuyển: <strong>{formatRecruitmentDate(selectedWindow.applicationStartsAt)}</strong></p>}
            {selectedWindow.resultsEndsAt && <p>Hạn hoàn tất phản hồi: <strong>{formatRecruitmentDate(selectedWindow.resultsEndsAt)}</strong></p>}
          </div>}
          {lockReason && <p role="status" className="flex items-start gap-2 text-sm text-amber-800"><LockKeyhole size={16} className="shrink-0" />{lockReason}</p>}
          {!post && !canSave && <p role="status" className="text-sm text-amber-800">Chỉ tạo tin tuyển dụng trong học kỳ đang diễn ra.</p>}
          {canSave && !accepts && <p role="status" className="text-sm text-amber-800">Bạn có thể lưu bản nháp. Công bố tin trong Hạn 1 của học kỳ đang diễn ra.</p>}
        </section>
        <section className="space-y-4">
          <h3 className="font-semibold text-slate-900">1. Thông tin chung</h3>
          <div><label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor={inputId('title')}>Tiêu đề tin <span className="text-rose-600">*</span></label>
            <input id={inputId('title')} className={fieldClass(!!validationErrors.title)} aria-invalid={!!validationErrors.title} aria-describedby={validationErrors.title ? inputId('title-error') : undefined} value={title} onChange={e => setTitle(e.target.value)} required maxLength={500} placeholder="Tiêu đề tin tuyển dụng" autoFocus />
            {validationErrors.title && <p id={inputId('title-error')} role="alert" className={errorClass}>{validationErrors.title}</p>}</div>
          <div><label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor={inputId('content')}>Nội dung tuyển dụng <span className="text-rose-600">*</span></label>
            <textarea id={inputId('content')} className={fieldClass(!!validationErrors.content)} aria-invalid={!!validationErrors.content} aria-describedby={validationErrors.content ? inputId('content-error') : undefined} rows={4} value={content} onChange={e => setContent(e.target.value)} required maxLength={30000} placeholder="Giới thiệu công việc, môi trường thực tập và thông tin dành cho ứng viên..." />
            {validationErrors.content && <p id={inputId('content-error')} role="alert" className={errorClass}>{validationErrors.content}</p>}</div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor={inputId('benefits')}>Quyền lợi</label>
              <textarea id={inputId('benefits')} className={fieldClass()} rows={3} value={benefits} onChange={e => setBenefits(e.target.value)} maxLength={10000} placeholder="Mentor, hỗ trợ thực tập, cơ hội việc làm..." /></div>
            <div><label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor={inputId('instructions')}>Hướng dẫn ứng tuyển</label>
              <textarea id={inputId('instructions')} className={fieldClass()} rows={3} value={instructions} onChange={e => setInstructions(e.target.value)} maxLength={10000} placeholder="Thông tin cần có trong CV, hình thức phỏng vấn..." /></div>
          </div>
          <div className="border-l-2 border-slate-200 pl-3">
            <p className="text-sm font-medium text-slate-700">Hạn sinh viên ứng tuyển</p>
            <p id={inputId('deadline')} className="mt-1 text-sm text-slate-600">{post?.deadlineAt || selectedWindow?.applicationEndsAt ? formatRecruitmentDate(post?.deadlineAt ?? selectedWindow?.applicationEndsAt) : 'Hệ thống áp dụng thời hạn do QHDN thiết lập khi đăng tin.'}</p>
            <p className="mt-1 text-xs text-slate-500">Thời hạn do Phòng Quan hệ doanh nghiệp quản lý. Doanh nghiệp không được chỉnh sửa.</p>
          </div>
        </section>
        <section className="space-y-4">
          <div><h3 className="font-semibold text-slate-900">2. Vị trí tuyển dụng <span className="text-orange-600">({positions.length})</span></h3><p className="mt-1 text-xs text-slate-500">Mô tả công việc và yêu cầu riêng cho từng vị trí.</p></div>
          {validationErrors.positiveCapacity && <p role="alert" className="text-sm text-rose-600">{validationErrors.positiveCapacity}</p>}
          {positions.map((p, index) => <section key={p.key} aria-label={`Vị trí ${index + 1}`} className="space-y-4 border-t border-slate-200 pt-5">
            <div className="flex items-center justify-between"><h4 className="flex items-center gap-2 text-sm font-semibold text-slate-700"><span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-orange-50 text-xs text-orange-700">{index + 1}</span>{p.title || `Vị trí ${index + 1}`}{p.id && <span className="text-xs font-normal text-slate-400">Đã lưu</span>}</h4>
              {!p.id && positions.length > 1 && <button type="button" onClick={() => setPositions(current => current.filter(item => item.key !== p.key))} aria-label={`Xóa vị trí ${index + 1}`} className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50"><Trash2 size={16} /></button>}</div>
            <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
              <div><label htmlFor={inputId(`position-${index}-title`)} className="mb-1.5 block text-sm font-medium text-slate-700">Tên vị trí *</label><input id={inputId(`position-${index}-title`)} className={fieldClass(!!validationErrors.positions[p.key]?.title)} aria-invalid={!!validationErrors.positions[p.key]?.title} aria-describedby={validationErrors.positions[p.key]?.title ? inputId(`position-${index}-title-error`) : undefined} required maxLength={150} value={p.title} onChange={e => updatePosition(p.key, { title: e.target.value })} placeholder="VD: Backend Intern" />
                {validationErrors.positions[p.key]?.title && <p id={inputId(`position-${index}-title-error`)} role="alert" className={errorClass}>{validationErrors.positions[p.key].title}</p>}</div>
              <div><label htmlFor={inputId(`position-${index}-capacity`)} className="mb-1.5 block text-sm font-medium text-slate-700">Chỉ tiêu *</label><input id={inputId(`position-${index}-capacity`)} className={fieldClass(!!validationErrors.positions[p.key]?.capacity)} aria-invalid={!!validationErrors.positions[p.key]?.capacity} aria-describedby={validationErrors.positions[p.key]?.capacity ? inputId(`position-${index}-capacity-error`) : undefined} type="number" required min={p.minimum} max={2147483647} step={1} value={p.capacity} onChange={e => updatePosition(p.key, { capacity: e.target.value })} />
                {validationErrors.positions[p.key]?.capacity && <p id={inputId(`position-${index}-capacity-error`)} role="alert" className={errorClass}>{validationErrors.positions[p.key].capacity}</p>}
                {p.minimum > 0 && <p className="mt-1 text-xs text-amber-700">Đã nhận {p.minimum} sinh viên</p>}</div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label htmlFor={inputId(`position-${index}-description`)} className="mb-1.5 block text-sm font-medium text-slate-700">Mô tả công việc *</label><textarea id={inputId(`position-${index}-description`)} className={fieldClass(!!validationErrors.positions[p.key]?.description)} aria-invalid={!!validationErrors.positions[p.key]?.description} aria-describedby={validationErrors.positions[p.key]?.description ? inputId(`position-${index}-description-error`) : undefined} rows={3} required maxLength={20000} value={p.description} onChange={e => updatePosition(p.key, { description: e.target.value })} />
                {validationErrors.positions[p.key]?.description && <p id={inputId(`position-${index}-description-error`)} role="alert" className={errorClass}>{validationErrors.positions[p.key].description}</p>}</div>
              <div><label htmlFor={inputId(`position-${index}-requirements`)} className="mb-1.5 block text-sm font-medium text-slate-700">Yêu cầu ứng viên *</label><textarea id={inputId(`position-${index}-requirements`)} className={fieldClass(!!validationErrors.positions[p.key]?.requirements)} aria-invalid={!!validationErrors.positions[p.key]?.requirements} aria-describedby={validationErrors.positions[p.key]?.requirements ? inputId(`position-${index}-requirements-error`) : undefined} rows={3} required maxLength={20000} value={p.requirements} onChange={e => updatePosition(p.key, { requirements: e.target.value })} />
                {validationErrors.positions[p.key]?.requirements && <p id={inputId(`position-${index}-requirements-error`)} role="alert" className={errorClass}>{validationErrors.positions[p.key].requirements}</p>}</div>
              <div><label htmlFor={inputId(`position-${index}-location`)} className="mb-1.5 block text-sm font-medium text-slate-700">Địa điểm</label><input id={inputId(`position-${index}-location`)} className={fieldClass()} maxLength={1000} value={p.location} onChange={e => updatePosition(p.key, { location: e.target.value })} placeholder="VD: TP.HCM" /></div>
              <div><label htmlFor={inputId(`position-${index}-mode`)} className="mb-1.5 block text-sm font-medium text-slate-700">Hình thức làm việc</label><select id={inputId(`position-${index}-mode`)} className={fieldClass()} value={p.workMode} onChange={e => updatePosition(p.key, { workMode: e.target.value })}>
                <option value="">Chưa chọn</option><option value="ONSITE">Tại văn phòng</option><option value="REMOTE">Từ xa</option><option value="HYBRID">Kết hợp</option></select></div>
            </div>
            {p.id && <p className="text-xs text-slate-500">Vị trí đã lưu được giữ lại cùng lịch sử ứng tuyển. Có thể đặt chỉ tiêu bằng 0 nếu chưa nhận sinh viên.</p>}
          </section>)}
          <button type="button" disabled={positions.length >= 50} onClick={() => setPositions(current => [...current, newPosition()])} className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-orange-300 px-4 py-3 text-sm font-semibold text-orange-700 hover:bg-orange-50 disabled:opacity-40"><Plus size={17} />Thêm vị trí tuyển dụng</button>
        </section>
      </fieldset>
      </div>
      <footer className="shrink-0 space-y-3 border-t border-slate-100 bg-white px-5 py-4 sm:px-7">
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="flex items-center gap-1.5 text-xs text-slate-500"><Eye size={14} />Sinh viên chỉ thấy tin đã công bố.</p>
          <div className="flex justify-end gap-3"><button type="button" disabled={saving} onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 disabled:opacity-40">Hủy</button>
            <button type="submit" name="status" value="DRAFT" disabled={saving || !canSave} className="flex items-center gap-2 rounded-xl border border-orange-200 px-4 py-2.5 text-sm font-semibold text-orange-700 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50">
              {saving ? <Loader2 size={17} className="animate-spin" /> : <Save size={17} />}Lưu nháp</button>
            <button type="submit" name="status" value="PUBLISHED" disabled={saving || !canSave || !accepts} className="flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50">
              {saving ? <Loader2 size={17} className="animate-spin" /> : <Check size={17} />}Công bố</button></div></div>
      </footer>
    </form>
  </dialog>
    {feedback.dialog}
  </>, document.body);
}
