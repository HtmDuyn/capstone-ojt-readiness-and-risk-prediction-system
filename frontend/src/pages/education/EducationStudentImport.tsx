import { PageBanner } from "@/components/common/PageBanner";
import { ImportedStudents } from '@/components/education/ImportedStudents';
import { loadAcademicCatalogs } from '@/services/educationCatalog.service';
import { importService } from '@/services/import.service';
import type { AcademicCatalogs, ImportCommitResponse, ImportPreviewResponse, StudentImportRow } from '@/types/education/import.types';
import { downloadStudentImportTemplate, parseStudentImportWorkbook, STUDENT_STATUS_LABELS } from '@/utils/studentImportWorkbook';
import React from "react";
import { Link } from 'react-router-dom';
import { FileSpreadsheet, Download, RefreshCw, CheckCircle2, AlertCircle, UploadCloud } from 'lucide-react';
const EducationStudentImport: React.FC = () => {
  const [savedRevision, setSavedRevision] = React.useState(0);
  const [catalogs, setCatalogs] = React.useState<AcademicCatalogs | null>(null),
    [rows, setRows] = React.useState<StudentImportRow[]>([]);
  const [preview, setPreview] = React.useState<ImportPreviewResponse | null>(
      null,
    ),
    [result, setResult] = React.useState<ImportCommitResponse | null>(null);
  const [busy, setBusy] = React.useState(""),
    [error, setError] = React.useState(""),
    [fileName, setFileName] = React.useState(""),
    [search, setSearch] = React.useState(""),
    [selected, setSelected] = React.useState<StudentImportRow | null>(null);
  const [skipped, setSkipped] = React.useState<Set<string>>(new Set());
  const [reviewFilter, setReviewFilter] = React.useState<'all' | 'valid' | 'error' | 'skipped'>('all');
  const [reviewErrors, setReviewErrors] = React.useState<Record<string, string[]>>({});
  const [previewSignature, setPreviewSignature] = React.useState('');
  const [catalogRefresh, setCatalogRefresh] = React.useState(0);
  React.useEffect(() => {
    let active = true;
    setCatalogs(null);
    setError("");
    loadAcademicCatalogs()
      .then((data) => {
        if (active) setCatalogs(data);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [catalogRefresh]);
  const keptRows = rows.filter(row => !skipped.has(row.code));
  const rowErrors = (row: StudentImportRow) => reviewErrors[row.code] ?? [];
  const gradeCount = keptRows.reduce(
    (n, row) => n + row.academic.courseResults.length,
    0,
  );
  const canCommit =
    preview?.preview === true && !!preview.importId &&
    previewSignature === keptRows.map(row => row.code).join('|') &&
    keptRows.length > 0 &&
    preview.total === keptRows.length &&
    preview.created + preview.updated === keptRows.length &&
    !preview.rows?.some((row) => row.errors?.length) &&
    !keptRows.some(row => rowErrors(row).length) &&
    !result;
  async function readFile(file: File) {
    if (!catalogs) return;
    setBusy("read");
    setRows([]);
    setPreview(null);
    setResult(null);
    setSelected(null);
    setError("");
    setFileName("");
    setSkipped(new Set());
    setReviewFilter('all');
    setReviewErrors({});
    setPreviewSignature('');
    try {
      if (!/\.(xlsx|xls)$/i.test(file.name))
        throw new Error("Chọn tệp Excel .xlsx hoặc .xls theo mẫu hai sheet.");
      if (file.size > 8 * 1024 * 1024)
        throw new Error("Tệp Excel không được vượt quá 8 MB.");
      const parsed = await parseStudentImportWorkbook(file, catalogs);
      setRows(parsed);
      setSearch('');
      setFileName(file.name);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không đọc được tệp.");
    } finally {
      setBusy("");
    }
  }
  async function check() {
    if (!keptRows.length) return;
    setBusy("commit");
    setError("");
    setPreview(null);
    setPreviewSignature('');
    try {
      const response = await importService.previewStudentImport({
        kind: 'STUDENT',
        idempotencyKey: crypto.randomUUID(),
        rows: keptRows,
      });
      setPreview(response);
      setReviewErrors(Object.fromEntries(keptRows.map((row, index) => [row.code, response.rows?.[index]?.errors ?? []])));
      if (
        response.preview !== true ||
        !response.importId ||
        response.total !== keptRows.length ||
        response.created + response.updated !== keptRows.length ||
        response.rows?.some((row) => row.errors?.length)
      )
        throw new Error(
          "Kết quả kiểm tra chưa hợp lệ; chưa thể xác nhận import.",
        );
      setPreviewSignature(keptRows.map(row => row.code).join('|'));
      return response.importId;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Không kiểm tra được dữ liệu.";
      const match = message.match(/(?:Row|Dòng)\s+(\d+)\s*:/i);
      const row = match ? keptRows[Number(match[1]) - 1] : undefined;
      if (row) setReviewErrors(previous => ({ ...previous, [row.code]: [message] }));
      setError(message);
    }
  }
  async function commit() {
    if (!keptRows.length || result || busy) return;
    if (
      !window.confirm(
        `Nhập ${keptRows.length} sinh viên và ${gradeCount} kết quả học tập vào hệ thống?`,
      )
    )
      return;
    setBusy("commit");
    setError("");
    try {
      const importId = canCommit ? preview!.importId! : await check();
      if (!importId) return;
      setBusy("commit");
      const imported=await importService.commitStudentImport(importId);
      setResult(imported);
      setPreview(null);
      setRows([]); setSelected(null); setSearch(''); setSkipped(new Set()); setReviewErrors({}); setPreviewSignature('');
      setSavedRevision(value => value + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không lưu được dữ liệu.");
    } finally {
      setBusy("");
    }
  }
  const visible = rows.filter((row) =>
    (row.code + " " + row.fullName + " " + row.email)
      .toLowerCase()
      .includes(search.toLowerCase()),
  ).filter(row => reviewFilter === 'all' || (reviewFilter === 'skipped' ? skipped.has(row.code) : reviewFilter === 'error' ? !skipped.has(row.code) && !!rowErrors(row).length : !skipped.has(row.code) && !!previewSignature && !rowErrors(row).length));
  const errorRows = rows.filter(row => rowErrors(row).length > 0);
  const errorCount = errorRows.length;
  const validCount = previewSignature ? keptRows.filter(row => !rowErrors(row).length).length : 0;
  const selectedErrorCount = keptRows.filter(row => !!rowErrors(row).length).length;
  const toggleSkip = (code: string) => {
    setSkipped(previous => { const next = new Set(previous); if (next.has(code)) next.delete(code); else next.add(code); return next; });
    setPreview(null);
    setPreviewSignature('');
    setError('');
  };
  return (
    <div className="space-y-6 pb-8">
      <PageBanner
        title="Import sinh viên và bảng điểm"
        description="Tải file sinh viên và bảng điểm lên, xem lại thông tin rồi xác nhận import."
        badge="Phòng Đào tạo"
      />
      <section className="space-y-6 rounded-2xl border border-slate-300 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-orange-50 p-3 text-orange-600"><FileSpreadsheet size={24} /></div>
          <div><h2 className="text-xl font-bold text-slate-900">Nhập dữ liệu từ Excel</h2><p className="mt-1 text-sm text-slate-600">Tạo mới hoặc cập nhật theo email; tài khoản đã có giữ nguyên mật khẩu. Bảng điểm có thể chứa lịch sử các học kỳ trước.</p></div>
        </div>
        <p className="text-sm text-slate-600">Mẫu Excel trống gồm hai sheet: Danh sách sinh viên và Kết quả học tập. Nhập đủ chương trình, khóa, nhóm và học kỳ hiện tại; mỗi dòng điểm dùng đúng học kỳ đã học. Để trống điểm cho môn đang học.</p>
        <div className="flex flex-col gap-4 rounded-2xl border border-dashed border-orange-400 bg-orange-50/40 p-5 sm:p-6">
          <div className="flex items-start gap-3"><UploadCloud className="mt-0.5 shrink-0 text-orange-600" size={22} /><div><p className="font-semibold text-slate-900">Chọn tệp Excel để bắt đầu</p><p className="mt-1 text-sm text-slate-500">Định dạng .xlsx hoặc .xls, tối đa 8 MB. Dữ liệu sẽ được kiểm tra trước khi lưu.</p></div></div>
          <div className="flex flex-wrap items-center gap-3">
          <label className={`inline-flex cursor-pointer items-center gap-2 rounded-xl bg-orange-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700 focus-within:ring-4 focus-within:ring-orange-200 ${!!busy || !catalogs ? 'cursor-not-allowed opacity-50' : ''}`}>
            <FileSpreadsheet size={18} /> Chọn tệp Excel
            <input
              aria-label="Tệp sinh viên và bảng điểm"
              className="sr-only"
              type="file"
              accept=".xlsx,.xls"
              disabled={!!busy || !catalogs}
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) void readFile(file);
              }}
            />
          </label>
          <span className="min-w-0 break-all text-sm text-slate-600" aria-live="polite">{fileName || 'Chưa chọn tệp'}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-5">
          <button
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-orange-300 hover:text-orange-700 disabled:opacity-50"
            disabled={!!busy}
            onClick={() => {
              try { downloadStudentImportTemplate(); }
              catch(e) { setError(e instanceof Error?e.message:'Không tải được mẫu Excel.'); }
            }}
          >
            <Download size={16} /> Tải mẫu Excel trống
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-orange-300 hover:text-orange-700 disabled:opacity-50"
            disabled={!!busy}
            onClick={() => setCatalogRefresh((v) => v + 1)}
          >
            <RefreshCw size={16} /> Tải lại danh mục
          </button>
        </div>
        {catalogs && <details className="rounded-xl border border-slate-200 p-4 text-sm">
          <summary className="cursor-pointer font-semibold text-slate-800">Tra cứu mã chương trình, khóa/nhóm và học kỳ để điền file</summary>
          <p className="mt-3 text-sm text-slate-600">Chọn khung chương trình áp dụng cho mã khóa của sinh viên. Ví dụ K21 có thể dùng khung K21A, K21B, K21C hoặc K21D; nhóm nhập học A/B/C/D được chọn riêng theo lộ trình đã cấu hình, không phải khớp chữ cái trong mã khung.</p>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <div><h3 className="font-semibold">Chương trình đào tạo</h3><ul className="mt-2 max-h-64 space-y-2 overflow-auto text-slate-600">{catalogs.programs.map(item=><li key={item.id} className="break-words">{item.id} — {item.aliases.join(' / ')}</li>)}</ul></div>
            <div><h3 className="font-semibold">Khóa / nhóm</h3><ul className="mt-2 max-h-64 space-y-3 overflow-auto text-slate-600">{catalogs.cohorts.map(item=><li key={item.id}><p>{item.id} — {item.aliases.join(' / ')}</p><p className="mt-1 text-xs">{item.groups?.length?item.groups.map(group=>`Nhóm ${group.groupCode}: bắt đầu ${catalogs.periods.find(period=>period.id===group.entryAcademicPeriodId)?.label??group.entryAcademicPeriodId}`).join('; '):'Chưa cấu hình nhóm nhập học.'}</p></li>)}</ul></div>
            <div><h3 className="font-semibold">Học kỳ</h3><ul className="mt-2 max-h-64 space-y-2 overflow-auto text-slate-600">{catalogs.periods.map(item=><li key={item.id}>{item.id} — {item.aliases.join(' / ')}</li>)}</ul></div>
          </div>
        </details>}
        {!catalogs && <p className="text-sm text-slate-500">Bạn có thể tải mẫu trống ngay. Cần tải danh mục chương trình, khóa và học kỳ để kiểm tra file khi import.</p>}
        {busy === 'read' && (
          <p role="status" className="rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-800">
            Đang đọc và ghép dữ liệu...
          </p>
        )}
        {error && (
          <p role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle size={18} className="shrink-0" /> {error}
          </p>
        )}
        {rows.length > 0 && (
          <section aria-label="Dữ liệu sinh viên trong tệp" className="space-y-5 rounded-2xl border border-slate-200 p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-3">
              <button
                className="rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
                disabled={!!busy || !!result || !keptRows.length}
                onClick={() => void commit()}
              >
                Xác nhận Import {keptRows.length} sinh viên
              </button>
              <button className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50" disabled={!!busy} onClick={() => { setRows([]); setPreview(null); setPreviewSignature(''); setSkipped(new Set()); setReviewErrors({}); setFileName(''); setError(''); setSelected(null); }}>Quay lại chọn file</button>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Xem trước dữ liệu Import</h2>
              <p className="mt-1 text-sm text-slate-500">Kiểm tra danh sách từ {fileName}. Sinh viên bị bỏ qua cùng toàn bộ kết quả học tập của họ sẽ không được gửi để lưu.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {[
                ['Tổng sinh viên', rows.length],
                ['Hợp lệ', validCount],
                ['Có lỗi', errorCount],
                ['Được chọn Import', keptRows.length],
                ['Bị bỏ qua', skipped.size],
              ].map(([label, value]) => <div key={label} className="rounded-xl border border-slate-300 bg-slate-50 p-4"><p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold text-slate-900">{value}</p></div>)}
            </div>
            <div className="flex flex-wrap items-center gap-3">
            <input
              aria-label="Tìm sinh viên trong tệp"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 sm:max-w-sm"
              value={search}
              placeholder="MSSV, tên hoặc email"
              onChange={(e) => setSearch(e.target.value)}
            />
            <select aria-label="Lọc dữ liệu xem trước" value={reviewFilter} onChange={e => setReviewFilter(e.target.value as typeof reviewFilter)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm">
              <option value="all">Tất cả</option><option value="valid">Hợp lệ</option><option value="error">Có lỗi</option><option value="skipped">Bị bỏ qua</option>
            </select>
            <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" className="accent-orange-600" checked={errorCount > 0 && errorRows.every(row => skipped.has(row.code))} disabled={!errorCount || !!busy} onChange={e => { const next = new Set(skipped); errorRows.forEach(row => e.target.checked ? next.add(row.code) : next.delete(row.code)); setSkipped(next); setPreview(null); setPreviewSignature(''); setError(''); }} />Bỏ qua tất cả dòng lỗi</label>
            </div>
            <p className="text-sm text-slate-500">Hiển thị {visible.length}/{rows.length} sinh viên trong tệp. Cuộn ngang để xem đầy đủ thông tin; mở bảng điểm ngay tại từng sinh viên.</p>
            <div className="max-h-[70vh] overflow-auto rounded-xl border border-slate-200" tabIndex={0} aria-label="Bảng xem trước sinh viên và bảng điểm">
              <table className="w-full min-w-[2200px] text-left text-sm">
                <thead className="sticky top-0 z-10 border-b border-[#CBD5E1] bg-[#EFF6FF] text-[#334155]">
                  <tr>
                    {[
                      "STT",
                      "Mã sinh viên",
                      "Họ tên",
                      "Email",
                      "Số điện thoại",
                      "Lớp",
                      "Chương trình",
                      "Trạng thái học vụ",
                      "Khóa",
                      "Nhóm",
                      "Kỳ bắt đầu chuyên ngành",
                      "Học kỳ hiện tại",
                      "Kết quả học tập",
                      "Trạng thái kiểm tra",
                      "Chi tiết lỗi",
                      "Bỏ qua",
                      "Bảng điểm",
                    ].map((h) => (
                      <th key={h} className="whitespace-nowrap px-4 py-3 font-semibold">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visible.map((row) => (
                    <React.Fragment key={row.code}>
                    <tr key={row.code} className={`border-t border-[#E2E8F0] transition-colors duration-150 ${rowErrors(row).length ? 'bg-red-50/70' : 'bg-white hover:bg-[#EAF2FF]'} ${skipped.has(row.code) ? 'opacity-60' : ''}`}>
                      <td className="px-4 py-3 text-slate-500">{rows.indexOf(row) + 1}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{row.code}</td>
                      <td className="px-4 py-3">{row.fullName}</td>
                      <td className="px-4 py-3">{row.email}</td>
                      <td className="whitespace-nowrap px-4 py-3">{row.academic.phone ?? '—'}</td>
                      <td className="whitespace-nowrap px-4 py-3">{row.academic.className ?? '—'}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{catalogs?.programs.find(p => p.id === row.academic.programId)?.aliases.find(alias => !alias.includes(' ') && /[A-Za-z]/.test(alias)) ?? `ID ${row.academic.programId}`}</p>
                        {catalogs?.programs.find(
                          (p) => p.id === row.academic.programId,
                        )?.label ?? row.academic.programId}
                      </td>
                      <td className="px-4 py-3">{row.academic.status ? STUDENT_STATUS_LABELS[row.academic.status] : 'Mặc định khi tạo mới; giữ nguyên khi cập nhật'}</td>
                      <td className="px-4 py-3">
                        {catalogs?.cohorts.find(
                          (c) => c.id === row.academic.placement.cohortId,
                        )?.label ?? row.academic.placement.cohortId}
                      </td>
                      <td className="px-4 py-3">{row.academic.placement.groupCode}</td>
                      <td className="px-4 py-3">{row.academic.placement.entryAcademicPeriodId
                        ? catalogs?.periods.find(p => p.id === row.academic.placement.entryAcademicPeriodId)?.label ?? row.academic.placement.entryAcademicPeriodId
                        : 'Theo nhóm khi tạo mới/đổi nhóm; giữ nguyên khi cập nhật'}</td>
                      <td className="whitespace-nowrap px-4 py-3">{catalogs?.periods.find(p => p.id === row.academic.placement.currentAcademicPeriodId)?.label ?? row.academic.placement.currentAcademicPeriodId}</td>
                      <td className="px-4 py-3">{row.academic.courseResults.length} kết quả</td>
                      <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${rowErrors(row).length ? 'bg-red-100 text-red-700' : previewSignature ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-800'}`}>{rowErrors(row).length ? 'Có lỗi' : previewSignature ? 'Hợp lệ' : 'Chờ kiểm tra'}</span></td>
                      <td className="max-w-64 px-4 py-3 text-red-700">{rowErrors(row).join('; ') || '—'}</td>
                      <td className="px-4 py-3"><input type="checkbox" aria-label={`Bỏ qua ${row.code}`} className="h-4 w-4 accent-orange-600" checked={skipped.has(row.code)} disabled={!!busy} onChange={() => toggleSkip(row.code)} /></td>
                      <td className="px-4 py-3">
                        <button
                          className="font-medium text-orange-700 hover:underline"
                          aria-expanded={selected?.code === row.code}
                          onClick={() => setSelected(selected?.code === row.code ? null : row)}
                        >
                          {selected?.code === row.code ? 'Ẩn bảng điểm' : 'Xem bảng điểm'}
                        </button>
                      </td>
                    </tr>
                    {selected?.code === row.code && <tr className="border-t border-orange-100 bg-orange-50/30"><td colSpan={17} className="p-4"><StudentImportCourseResults student={row} catalogs={catalogs} /></td></tr>}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
            {selectedErrorCount > 0 && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">Còn {selectedErrorCount} sinh viên có lỗi được chọn. Hãy sửa file hoặc bỏ qua các dòng lỗi rồi bấm Xác nhận Import.</p>}
          </section>
        )}
        {preview && !busy && (
          <p role="status" className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            Kiểm tra: {preview.total} sinh viên, tạo mới {preview.created}, hồ
            sơ hiện có {preview.updated}. Dữ liệu chưa được lưu.
          </p>
        )}
        {result && (
          <div className="space-y-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            <p role="status" className="flex items-start gap-2">
              <CheckCircle2 size={18} className="shrink-0" />
              <span>Đã nhập {result.total} sinh viên cùng bảng điểm tương ứng. Mã đợt:{" "}
                {result.academicImportId ?? result.batchId ?? "—"}
                {result.replayed ? " (yêu cầu đã được xử lý trước đó)" : ""}.</span>
            </p>
            <p>Để xét điều kiện OJT từ dữ liệu vừa nhập, chuyển đến trang Xét điều kiện đi OJT, chọn phạm vi và bấm xét điều kiện.</p>
            <Link to="/education/ojt-conditions" className="inline-flex rounded-lg bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700">
              Chuyển đến Xét điều kiện đi OJT
            </Link>
          </div>
        )}
      </section>
      <ImportedStudents revision={savedRevision} catalogs={catalogs} />
    </div>
  );
};
function StudentImportCourseResults({ student, catalogs }: { student: StudentImportRow; catalogs: AcademicCatalogs | null }) {
  return <div className="space-y-3">
    <h3 className="font-semibold text-slate-900">Bảng điểm trong tệp: {student.code} — {student.fullName}</h3>
    {!student.academic.courseResults.length ? <p className="text-slate-500">Chưa có kết quả học tập trong tệp.</p> : <table className="w-full max-w-6xl text-left text-sm">
      <thead className="border-b border-[#CBD5E1] bg-[#EFF6FF] text-[#334155]"><tr>{['Mã môn', 'Học kỳ ghi nhận', 'Lần học', 'Trạng thái', 'Điểm số', 'Điểm hệ 4', 'Điểm chữ', 'Nguồn dữ liệu'].map(label => <th key={label} className="px-3 py-2 font-semibold">{label}</th>)}</tr></thead>
      <tbody>{student.academic.courseResults.map((result, index) => <tr key={index} className="border-t border-[#E2E8F0] bg-white transition-colors duration-150 hover:bg-[#EAF2FF]">
        <td className="px-3 py-2 font-medium">{result.courseCode}</td>
        <td className="px-3 py-2">{catalogs?.periods.find(p => p.id === result.academicPeriodId)?.label ?? result.academicPeriodId}</td>
        <td className="px-3 py-2">{result.attemptNumber ?? 1}</td>
        <td className="px-3 py-2">{result.status}</td>
        <td className="px-3 py-2">{result.score ?? '—'}</td>
        <td className="px-3 py-2">{result.gradePoints ?? '—'}</td>
        <td className="px-3 py-2">{result.grade ?? '—'}</td>
        <td className="px-3 py-2">{result.sourceReference ?? '—'}</td>
      </tr>)}</tbody>
    </table>}
  </div>;
}

export default EducationStudentImport;
