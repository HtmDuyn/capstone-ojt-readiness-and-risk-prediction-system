import { useRef, useState, type FormEvent } from 'react';
import { FileText, Send, Upload } from 'lucide-react';
import { studentPost, uploadStudentCv } from '@/services/studentService';
import type { CV, Profile } from '@/types/student/portal';
import { StudentDialog } from './StudentDialog';
import { buttonClass, inputClass } from './PortalUI';
import { explainOjtBlockers, ojtError, type Opportunity, type PartnerCompany } from './ojt';

export function OjtApplicationDialog({ profile, windowId, companies, opportunities, initialPosition, cv, onUploaded, onSubmitted, onClose }: {
  profile: Profile; windowId: number; companies: PartnerCompany[]; opportunities: Opportunity[];
  initialPosition?: Opportunity; cv: CV | null; onUploaded: (cv: CV) => void;
  onSubmitted: () => void; onClose: () => void;
}) {
  const [companyId, setCompanyId] = useState(String(initialPosition?.company.id ?? ''));
  const [positionKey, setPositionKey] = useState(initialPosition ? `${initialPosition.postId}:${initialPosition.id}` : '');
  const [phone, setPhone] = useState(profile.phone ?? '');
  const [email, setEmail] = useState(profile.email);
  const [letter, setLetter] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  const positions = opportunities.filter((item) => String(item.company.id) === companyId);
  const selected = positions.find((item) => `${item.postId}:${item.id}` === positionKey);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (lock.current || !selected?.canApply) return;
    if (!file && !cv) { setError('Vui lòng tải CV PDF hoặc lưu CV ở mục CV của tôi trước khi nộp đơn.'); return; }
    lock.current = true; setBusy(true); setError('');
    try {
      if (file) { onUploaded(await uploadStudentCv(file)); setFile(null); }
      await studentPost('/job-applications', {
        windowId, postId: selected.postId, positionId: selected.id,
        coverLetter: letter.trim() || null,
        application: { contactPhone: phone.trim(), contactEmail: email.trim() },
      });
      onSubmitted();
    } catch (err) { setError(ojtError(err)); }
    finally { lock.current = false; setBusy(false); }
  }
  return (
    <StudentDialog title="Nộp đơn đăng ký OJT" onClose={onClose} busy={busy}>
      <form onSubmit={submit} className="space-y-5">
        <p className="text-sm text-slate-500">{profile.fullName} · {profile.studentCode}. Đơn được gửi đến doanh nghiệp bạn chọn.</p>
        <fieldset disabled={busy} className="space-y-4 disabled:opacity-60">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-medium">Doanh nghiệp <span className="text-orange-600">*</span>
              <select required value={companyId} onChange={(event) => { setCompanyId(event.target.value); setPositionKey(''); }} className={inputClass}>
                <option value="">Chọn doanh nghiệp</option>
                {companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
              </select>
            </label>
            <label className="space-y-2 text-sm font-medium">Vị trí ứng tuyển <span className="text-orange-600">*</span>
              <select required value={positionKey} disabled={!companyId} onChange={(event) => setPositionKey(event.target.value)} className={inputClass}>
                <option value="">Chọn vị trí</option>
                {positions.map((item) => <option key={`${item.postId}:${item.id}`} value={`${item.postId}:${item.id}`}>{item.title} · {item.remainingSlots} chỗ</option>)}
              </select>
            </label>
          </div>
          {selected && !selected.canApply && <p role="status" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">{explainOjtBlockers(selected.blockers)}</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-medium">Email liên hệ <span className="text-orange-600">*</span><input type="email" required maxLength={100} value={email} onChange={(event) => setEmail(event.target.value)} className={inputClass} /></label>
            <label className="space-y-2 text-sm font-medium">Số điện thoại <span className="text-orange-600">*</span><input type="tel" required maxLength={20} value={phone} onChange={(event) => setPhone(event.target.value)} className={inputClass} /></label>
          </div>
          <div className="space-y-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold"><FileText size={17} />CV ứng tuyển <span className="text-orange-600">*</span></p>
            {cv && <p className="break-all text-sm text-slate-600">CV đã lưu: <strong>{cv.fileName}</strong>. File này sẽ được đính kèm nếu bạn không chọn CV mới.</p>}
            <label className="block space-y-2 text-sm text-slate-600"><span className="flex items-center gap-2"><Upload size={15} />{cv ? 'Thay bằng CV mới (PDF, tối đa 10 MB)' : 'Tải CV PDF (tối đa 10 MB)'}</span>
              <input type="file" accept="application/pdf,.pdf" required={!cv} onChange={(event) => setFile(event.target.files?.[0] ?? null)} className={inputClass} />
            </label>
            <p className="text-xs text-slate-500">CV mới cũng được lưu vào hồ sơ cá nhân. CV đã gửi trong đơn trước được giữ nguyên.</p>
          </div>
          <label className="block space-y-2 text-sm font-medium">Giới thiệu bản thân<textarea rows={3} maxLength={5000} value={letter} onChange={(event) => setLetter(event.target.value)} placeholder="Kỹ năng, kinh nghiệm và mong muốn thực tập của bạn..." className={inputClass} /></label>
        </fieldset>
        {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
          <button type="button" disabled={busy} onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold">Hủy</button>
          <button type="submit" disabled={busy || !selected?.canApply} className={buttonClass + ' inline-flex items-center gap-2'}><Send size={16} />{busy ? 'Đang gửi hồ sơ...' : 'Gửi đơn đăng ký'}</button>
        </div>
      </form>
    </StudentDialog>
  );
}
