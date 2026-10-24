import { PageBanner } from '@/components/common/PageBanner';
import { EligibilityAssessment } from '@/components/education/EligibilityAssessment';
import { useEducationCatalogs } from '@/hooks/useEducationCatalogs';
import { CalendarDays, CheckCircle2, GraduationCap, ShieldCheck } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

const EducationOjtConditions: React.FC = () => {

  const [yearId, setYearId] = React.useState('');
  const [periodId, setPeriodId] = React.useState('');
  const [programId, setProgramId] = React.useState('');

  const [busy, setBusy] = React.useState(false);

  const [refresh, setRefresh] = React.useState(0);

  const { years, periods, programs, loading, error } = useEducationCatalogs(refresh);
  const selectedPeriod = periods.find(p => String(p.id) === periodId && String(p.academicYearId) === yearId);
  const semesterId = selectedPeriod?.ojt?.id ?? null;
  const selectedProgram = programs.find(p => String(p.id) === programId);
  const disabled = loading || busy;
  return <div className="space-y-6">
    <PageBanner title="Xét điều kiện đi OJT" description="Chọn học kỳ, xét theo quy tắc chung và tra cứu danh sách sinh viên đủ hoặc chưa đủ điều kiện." badge="Phòng Đào tạo" />
    <section className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 font-semibold text-slate-900"><ShieldCheck size={20} className="text-orange-600" />Quy tắc xét OJT chung cho toàn hệ thống</div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="flex items-center gap-3 rounded-xl bg-orange-50 p-4"><GraduationCap className="text-orange-600" /><div><p className="text-xl font-bold text-orange-900">Từ 70 tín chỉ</p><p className="text-sm text-slate-600">Tín chỉ tích lũy được công nhận</p></div></div>
        <div className="flex items-center gap-3 rounded-xl bg-green-50 p-4"><CheckCircle2 className="text-green-600" /><div><p className="text-xl font-bold text-green-900">Tối đa 2 môn còn rớt</p><p className="text-sm text-slate-600">Không tính môn đã học lại đạt hoặc được công nhận</p></div></div>
      </div>
      <p className="mt-3 text-sm text-slate-500">Áp dụng đồng thời hai điều kiện. Quy tắc cố định, không tạo thêm bộ điều kiện theo chương trình hoặc học kỳ. Kết quả được hệ thống tính từ hồ sơ học tập.</p>
    </section>
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="flex items-center gap-2 font-semibold"><CalendarDays size={18} />Phạm vi xét</h2>
      <div className="grid gap-4 md:grid-cols-3">
        <label className="text-sm font-medium">Năm học<select aria-label="Năm học xét OJT" className="mt-2 w-full rounded-lg border p-3" value={yearId} disabled={disabled} onChange={e => { setYearId(e.target.value); setPeriodId(''); }}><option value="">Chọn năm học</option>{years.map(y => <option key={y.id} value={y.id}>{y.yearCode}</option>)}</select></label>
        <label className="text-sm font-medium">Học kỳ<select aria-label="Học kỳ xét OJT" className="mt-2 w-full rounded-lg border p-3" value={periodId} disabled={disabled || !yearId} onChange={e => setPeriodId(e.target.value)}><option value="">Chọn học kỳ trong năm</option>{periods.filter(p => p.kind === 'SEMESTER' && String(p.academicYearId) === yearId).map(p => <option key={p.id} value={p.id}>{p.name} ({p.periodCode})</option>)}</select></label>
        <label className="text-sm font-medium">Chương trình đào tạo<select aria-label="Chương trình xét OJT" className="mt-2 w-full rounded-lg border p-3" value={programId} disabled={disabled} onChange={e => setProgramId(e.target.value)}><option value="">Chọn chương trình</option>{programs.map(p => <option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}</select></label>
      </div>
      {loading && <p role="status">Đang tải năm học, học kỳ và chương trình...</p>}
      {error && <p role="alert" className="text-red-700">{error}</p>}
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <p className="text-slate-500">Phòng Đào tạo quản lý <Link className="text-orange-700 underline" to="/education/academic-year">năm học và học kỳ</Link>. Phòng QHDN mở đợt đăng ký OJT trong các học kỳ và tiếp nhận danh sách đủ điều kiện.</p>
        <button disabled={disabled} className="rounded border px-3 py-2 disabled:opacity-50" onClick={() => setRefresh(v => v + 1)}>Tải lại danh mục</button>
      </div>
      {!loading && !error && !years.length && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Chưa có năm học. Hãy khởi tạo năm học và các học kỳ trước khi xét.</p>}
      {selectedPeriod && !semesterId && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Học kỳ này chưa có dữ liệu liên kết để xét OJT. Hãy kiểm tra lại học kỳ trước khi thực hiện.</p>}
    </section>
    {selectedProgram && semesterId ? <EligibilityAssessment
      key={`${selectedProgram.id}:${semesterId}`}
      programId={selectedProgram.id}
      semesterId={semesterId}
      onBusyChange={setBusy}
      scopeLabel={`${years.find(y => String(y.id) === yearId)?.yearCode} / ${selectedPeriod?.name} / ${selectedProgram.code}`}
    /> : <section className="rounded-2xl border border-dashed bg-white p-8 text-center text-slate-500">Chọn năm học, học kỳ và chương trình đào tạo để xét và xem danh sách kết quả.</section>}
  </div>;
};
export default EducationOjtConditions;
