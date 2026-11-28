import { PageBanner } from "@/components/common/PageBanner";
import { CurriculumImportActions } from "@/components/education/CurriculumImportActions";
import { curriculumService } from '@/services/educationService';
import { getAllItems } from "@/services/educationService";
import type { CurriculumDetail, CurriculumSummary, Major } from '@/types/education/curriculum.types';
import { BookOpen, GraduationCap, Layers3, LibraryBig, ListChecks } from 'lucide-react';
import React from "react";
const EducationCurriculumPlan: React.FC = () => {
  const [majors, setMajors] = React.useState<Major[]>([]),
    [programs, setPrograms] = React.useState<CurriculumSummary[]>([]),
    [majorId, setMajorId] = React.useState(""),
    [programId, setProgramId] = React.useState("");
  const [detail, setDetail] = React.useState<CurriculumDetail | null>(null),
    [error, setError] = React.useState(""),
    [loading, setLoading] = React.useState(false),
    [refresh, setRefresh] = React.useState(0);
  const [descriptionExpanded, setDescriptionExpanded] = React.useState(false);
  const defaultsApplied = React.useRef(false);
  React.useEffect(() => {
    const c = new AbortController();
    setError("");
    setLoading(true);
    Promise.all([
      getAllItems<Major>("/majors", {}, c.signal),
      getAllItems<CurriculumSummary>("/curricula", {}, c.signal),
    ])
      .then(([m, p]) => {
        if (c.signal.aborted) return;
        setMajors(m);
        setPrograms(p);
        if (!defaultsApplied.current) {
          defaultsApplied.current = true;
          const defaultMajor = m.find(major => {
            const name = major.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
            return name === 'he thong thong tin' || name === 'information systems';
          }) ?? m.find(major => major.code.toUpperCase() === 'IS');
          if (defaultMajor) {
            const defaultProgram = p.filter(program => program.majorId === defaultMajor.id)
              .sort((a, b) => (b.effectiveYear ?? 0) - (a.effectiveYear ?? 0) || b.id - a.id)[0];
            setMajorId(String(defaultMajor.id));
            setProgramId(defaultProgram ? String(defaultProgram.id) : '');
          }
        }
      })
      .catch((e) => {
        if (!c.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!c.signal.aborted) setLoading(false);
      });
    return () => c.abort();
  }, [refresh]);
  React.useEffect(() => {
    let active = true;
    setDetail(null);
    setDescriptionExpanded(false);
    if (!programId) return;
    setError("");
    setLoading(true);
    curriculumService
      .getCurriculumDetail(Number(programId))
      .then((r) => {
        if (active) setDetail(r.data);
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [programId, refresh]);
  const selectedMajor = majors.find((m) => String(m.id) === majorId);
  const description = detail?.description?.trim() ?? "";
  const hasLongDescription = description.length > 240;
  return (
    <div className="space-y-6">
      <PageBanner
        variant="education"
        title="Khung chương trình đào tạo"
        description="Nhập và tra cứu khung chương trình, môn học và combo. Không sửa, xóa hoặc thay thế dữ liệu đã nhập."
        badge="Phòng Đào tạo"
      />
      <section className="min-w-0 space-y-5">
        <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-gradient-to-r from-blue-50/80 via-white to-orange-50/40 px-5 py-5 sm:px-6">
          <div className="mb-4 flex items-start gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-blue-100 text-blue-700"><LibraryBig size={22}/></span><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">Tra cứu học vụ</p><h2 className="mt-1 text-lg font-bold text-slate-900">Chọn khung chương trình</h2><p className="mt-1 text-sm text-slate-500">Lọc theo chuyên ngành để xem môn học, tín chỉ và các combo.</p></div></div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="min-w-0 flex-1 space-y-1.5 text-xs font-semibold text-slate-600 sm:min-w-44"><span>Chuyên ngành</span>
          <select
            aria-label="Chuyên ngành"
            className="h-11 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            value={majorId}
            onChange={(e) => {
              defaultsApplied.current = true;
              setMajorId(e.target.value);
              setProgramId("");
            }}
          >
            <option value="">Tất cả chuyên ngành</option>
            {majors.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          </label>
          <label className="min-w-0 flex-[1.5] space-y-1.5 text-xs font-semibold text-slate-600 sm:min-w-60"><span>Khung chương trình</span>
          <select
            aria-label="Khung chương trình"
            className="h-11 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            value={programId}
            onChange={(e) => { defaultsApplied.current = true; setProgramId(e.target.value); }}
          >
            <option value="">Chọn khung chương trình</option>
            {programs
              .filter((p) => !majorId || String(p.majorId) === majorId)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.name}
                </option>
              ))}
          </select>
          </label>
          <CurriculumImportActions
            majors={majors}
            selectedMajorCode={selectedMajor?.code ?? null}
            curriculumDetail={detail}
            onCommitted={() => setRefresh((v) => v + 1)}
          />
        </div>
        </div>
        </div>
        {loading && <p role="status">Đang tải dữ liệu...</p>}
        {error && (
          <p role="alert" className="text-red-700">
            {error}
          </p>
        )}
        {!programId && (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center text-sm text-slate-600">
            Chọn khung đã nhập để xem; sử dụng chức năng import để thêm khung
            mới.
          </p>
        )}
        {detail && (
          <>
            <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-gradient-to-br from-slate-50 via-white to-blue-50/50 p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0"><p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">{detail.code}</p><h2 className="mt-1 break-words text-xl font-bold leading-snug text-slate-900 sm:text-2xl">{detail.name}</h2><p className="mt-1 text-sm text-slate-500">{detail.majorName}</p></div>
                <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-blue-100 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700"><GraduationCap size={15}/>Khung chương trình</span>
              </div>
              <dl className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {([
                  ['Tổng tín chỉ', detail.totalCredits, BookOpen],
                  ['Môn học', detail.courses.length, ListChecks],
                  ['Combo', detail.combos.length, Layers3],
                ] as const).map(([label, value, Icon]) => (
                  <div key={String(label)} className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-100 bg-white/90 px-4 py-3 shadow-sm">
                    <Icon size={18} className="shrink-0 text-blue-600"/>
                    <span className="min-w-0"><dt className="text-xs font-medium text-slate-500">{label}</dt><dd className="mt-0.5 break-words text-sm font-bold text-slate-900">{value}</dd></span>
                  </div>
                ))}
              </dl>
            </div>
            <div className="space-y-5 p-5 sm:p-6">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-slate-800">Mô tả khung chương trình</h3>
                <p className={`mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700 ${hasLongDescription && !descriptionExpanded ? 'line-clamp-3' : ''}`}>
                  {description || 'Chưa có mô tả'}
                </p>
                {hasLongDescription && <button type="button" onClick={() => setDescriptionExpanded(value => !value)} aria-expanded={descriptionExpanded} className="mt-2 text-sm font-medium text-orange-700 hover:underline focus-visible:rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-500">{descriptionExpanded ? 'Thu gọn' : 'Xem thêm'}</button>}
              </div>
            <div className="flex items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-blue-700">Chi tiết đào tạo</p><h3 className="mt-1 flex items-center gap-2 text-base font-bold text-slate-900"><BookOpen size={18} className="text-blue-700"/>Môn học trong khung</h3></div><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{detail.courses.length} môn</span></div>
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full min-w-[1040px] table-fixed text-left text-sm">
                <caption className="sr-only">Danh sách môn học trong khung chương trình</caption>
                <colgroup><col className="w-[12%]" /><col className="w-[34%]" /><col className="w-[11%]" /><col className="w-[8%]" /><col className="w-[13%]" /><col className="w-[22%]" /></colgroup>
                <thead className="bg-slate-50 text-slate-600">
                  <tr className="border-b border-slate-200">
                    {[
                      "Mã môn",
                      "Tên môn",
                      "Kỳ khuyến nghị",
                      "Tín chỉ",
                      "Loại",
                      "Tiên quyết",
                    ].map((h) => (
                      <th key={h} scope="col" className={`px-4 py-3 align-middle font-semibold leading-5 ${h === 'Kỳ khuyến nghị' || h === 'Tín chỉ' ? 'text-center' : 'text-left'}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {detail.courses.map((c) => (
                    <tr key={c.id} className="border-t border-slate-100 bg-white transition-colors hover:bg-blue-50/50">
                      <td className="break-words px-4 py-3 align-top font-medium leading-6 text-slate-800">{c.courseCode}</td>
                      <td className="break-words px-4 py-3 align-top leading-6 text-slate-700">{c.name}</td>
                      <td className="px-4 py-3 text-center align-top leading-6 tabular-nums text-slate-700">{c.semester}</td>
                      <td className="px-4 py-3 text-center align-top leading-6 tabular-nums text-slate-700">{c.credits ?? "—"}</td>
                      <td className="break-words px-4 py-3 align-top text-xs leading-6 text-slate-600">{c.entryKind}</td>
                      <td className="whitespace-pre-line break-words px-4 py-3 align-top leading-6 text-slate-600">{c.prerequisiteText || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-violet-700">Lựa chọn chuyên sâu</p><h3 className="mt-1 flex items-center gap-2 text-base font-bold text-slate-900"><Layers3 size={18} className="text-violet-700"/>Combo môn học</h3></div><span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">{detail.combos.length} combo</span></div>
            {!detail.combos.length && <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-500">Khung này chưa có combo.</p>}
            {detail.combos.map((combo) => (
              <section key={combo.id} className="min-w-0 space-y-3 rounded-2xl border border-violet-100 bg-violet-50/20 p-4 sm:p-5">
                <h4 className="break-words text-sm font-semibold leading-6 text-slate-900">
                  {combo.code} — {combo.name}
                </h4>
                <p className="whitespace-pre-line break-words text-sm leading-6 text-slate-600">{combo.note}</p>
                <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                  <table className="w-full min-w-[1040px] table-fixed text-left text-sm">
                    <caption className="sr-only">Danh sách môn học của combo {combo.code}</caption>
                    <colgroup><col className="w-[12%]" /><col className="w-[34%]" /><col className="w-[11%]" /><col className="w-[8%]" /><col className="w-[35%]" /></colgroup>
                    <thead className="bg-slate-50 text-slate-600">
                      <tr className="border-b border-slate-200">
                        {[
                          "Mã môn",
                          "Tên môn",
                          "Kỳ",
                          "Tín chỉ",
                          "Tiên quyết",
                        ].map((h) => (
                          <th scope="col" className={`px-4 py-3 align-middle font-semibold leading-5 ${h === 'Kỳ' || h === 'Tín chỉ' ? 'text-center' : 'text-left'}`} key={h}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {combo.courses.map((c) => (
                        <tr className="border-t border-slate-100 bg-white transition-colors hover:bg-violet-50/40" key={c.id}>
                          <td className="break-words px-4 py-3 align-top font-medium leading-6 text-slate-800">{c.courseCode}</td>
                          <td className="break-words px-4 py-3 align-top leading-6 text-slate-700">{c.name}</td>
                          <td className="px-4 py-3 text-center align-top leading-6 tabular-nums text-slate-700">{c.semester}</td>
                          <td className="px-4 py-3 text-center align-top leading-6 tabular-nums text-slate-700">{c.credits ?? "—"}</td>
                          <td className="whitespace-pre-line break-words px-4 py-3 align-top leading-6 text-slate-600">{c.prerequisiteText || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ))}
            </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
};
export default EducationCurriculumPlan;
