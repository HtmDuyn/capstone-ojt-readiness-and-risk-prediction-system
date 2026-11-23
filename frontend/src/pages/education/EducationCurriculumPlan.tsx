import { PageBanner } from "@/components/common/PageBanner";
import { CurriculumImportActions } from "@/components/education/CurriculumImportActions";
import { curriculumService } from '@/services/educationService';
import { getAllItems } from "@/services/educationService";
import type { CurriculumDetail, CurriculumSummary, Major } from '@/types/education/curriculum.types';
import React from "react";
const PAGE_SIZE = 10;
type SortKey = 'code' | 'name' | 'majorName' | 'totalCredits' | 'status';
const statusLabel = (status: string) => ({ DRAFT: 'Bản nháp', PUBLISHED: 'Đã công bố' })[status] ?? status ?? '—';
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
  const [search, setSearch] = React.useState('');
  const [sortKey, setSortKey] = React.useState<SortKey | null>(null);
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc' | null>(null);
  const [page, setPage] = React.useState(1);
  React.useEffect(() => {
    const c = new AbortController();
    setError("");
    setLoading(true);
    Promise.all([
      getAllItems<Major>("/majors", {}, c.signal),
      getAllItems<CurriculumSummary>("/curricula", {}, c.signal),
    ])
      .then(([m, p]) => {
        setMajors(m);
        setPrograms(p);
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
  const programsForMajor = programs.filter(p => !majorId || String(p.majorId) === majorId);
  const filteredPrograms = programsForMajor.filter(p => {
    const term = search.trim().toLocaleLowerCase('vi');
    return !term || [p.code, p.name].some(value => value.toLocaleLowerCase('vi').includes(term));
  });
  const sortedPrograms = [...filteredPrograms];
  if (sortKey && sortDirection) sortedPrograms.sort((a, b) => {
    const left = a[sortKey] ?? '';
    const right = b[sortKey] ?? '';
    const comparison = typeof left === 'number' && typeof right === 'number'
      ? left - right : String(left).localeCompare(String(right), 'vi', { numeric: true });
    return sortDirection === 'asc' ? comparison : -comparison;
  });
  const totalPages = Math.max(1, Math.ceil(sortedPrograms.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visiblePrograms = sortedPrograms.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const changeSort = (key: SortKey) => {
    if (sortKey !== key) { setSortKey(key); setSortDirection('asc'); }
    else if (sortDirection === 'asc') setSortDirection('desc');
    else { setSortKey(null); setSortDirection(null); }
    setPage(1);
  };
  const comboNamesForCourse = (courseId: number) => detail?.combos
    .filter(combo => combo.courses.some(course => course.slotCourseIds.includes(courseId)))
    .map(combo => combo.name).join(', ') || '—';
  return (
    <div className="space-y-6">
      <PageBanner
        title="Khung chương trình đào tạo"
        description="Nhập và tra cứu khung chương trình, môn học và combo. Không sửa, xóa hoặc thay thế dữ liệu đã nhập."
        badge="Phòng Đào tạo"
      />
      <section className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex flex-wrap gap-3">
          <select
            aria-label="Chuyên ngành"
            className="min-w-44 flex-1 rounded border p-2"
            value={majorId}
            onChange={(e) => {
              setMajorId(e.target.value);
              setProgramId("");
              setPage(1);
            }}
          >
            <option value="">Tất cả chuyên ngành</option>
            {majors.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <select
            aria-label="Khung chương trình"
            className="min-w-60 flex-[2] rounded border p-2"
            value={programId}
            onChange={(e) => setProgramId(e.target.value)}
          >
            <option value="">Chọn khung chương trình</option>
            {programsForMajor
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.name}
                </option>
              ))}
          </select>
          <CurriculumImportActions
            majors={majors}
            selectedMajorCode={selectedMajor?.code ?? null}
            curriculumDetail={detail}
            onCommitted={() => setRefresh((v) => v + 1)}
          />
        </div>
        {loading && <p role="status">Đang tải dữ liệu...</p>}
        {error && (
          <p role="alert" className="text-red-700">
            {error}
          </p>
        )}
        {!programId && !loading && !error && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Danh sách khung chương trình</h2>
              <input aria-label="Tìm chương trình theo mã hoặc tên" placeholder="Tìm theo mã hoặc tên chương trình" className="w-full rounded border p-2 text-sm sm:w-72" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <div className="overflow-auto"><table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-[#EFF6FF] text-[#334155]"><tr className="border-b border-[#D6E4F0]">
                <th className="p-2">STT</th>
                {([['code', 'Mã khung chương trình'], ['name', 'Tên khung chương trình'], ['majorName', 'Chuyên ngành'], ['totalCredits', 'Tổng số tín chỉ'], ['status', 'Trạng thái']] as const).map(([key, label]) => <th key={key} className="p-2"><button type="button" className="font-semibold hover:text-orange-700" onClick={() => changeSort(key)} aria-label={`Sắp xếp theo ${label}`}>{label} {sortKey === key ? sortDirection === 'asc' ? '↑' : '↓' : '↕'}</button></th>)}
                <th className="p-2">Thao tác</th>
              </tr></thead>
              <tbody>{visiblePrograms.map((program, index) => <tr key={program.id} className="border-t border-[#E2E8F0] hover:bg-[#EAF2FF]">
                <td className="p-2">{(currentPage - 1) * PAGE_SIZE + index + 1}</td>
                <td className="p-2">{program.code}</td><td className="p-2">{program.name}</td><td className="p-2">{program.majorName || '—'}</td><td className="p-2">{program.totalCredits ?? '—'}</td><td className="p-2">{statusLabel(program.status)}</td>
                <td className="p-2"><button type="button" className="font-medium text-orange-700 hover:underline" onClick={() => setProgramId(String(program.id))}>Xem chi tiết</button></td>
              </tr>)}</tbody>
            </table></div>
            {!sortedPrograms.length && <p role="status">Không có chương trình đào tạo phù hợp.</p>}
            {!!sortedPrograms.length && <div className="flex items-center justify-between gap-3 text-sm"><span>Hiển thị {visiblePrograms.length} / {sortedPrograms.length} chương trình</span><div className="flex items-center gap-3"><button type="button" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)} className="disabled:opacity-40">Trang trước</button><span>Trang {currentPage} / {totalPages}</span><button type="button" disabled={currentPage >= totalPages} onClick={() => setPage(currentPage + 1)} className="disabled:opacity-40">Trang sau</button></div></div>}
          </div>
        )}
        {detail && (
          <>
            <div className="space-y-4 border-b border-slate-200 pb-5">
              <h2 className="text-lg font-semibold text-slate-900">Thông tin khung chương trình</h2>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500">Mã khung chương trình</p>
                <p className="mt-1 break-words text-sm font-semibold text-orange-700">{detail.code}</p>
                <p className="mt-3 text-xs font-medium text-slate-500">Tên khung chương trình</p>
                <p className="mt-1 break-words text-base font-semibold text-slate-900">{detail.name}</p>
              </div>
              <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  ['Chuyên ngành', detail.majorName],
                  ['Tổng số tín chỉ', detail.totalCredits],
                  ['Tổng số môn học', detail.courses.length],
                  ['Phiên bản', detail.version ?? '—'],
                  ['Năm áp dụng', detail.effectiveYear ?? '—'],
                ].map(([label, value]) => (
                  <div key={label} className="min-w-0 rounded-lg bg-slate-50 px-4 py-3">
                    <dt className="text-xs font-medium text-slate-500">{label}</dt>
                    <dd className="mt-1 break-words text-sm font-semibold text-slate-800">{value}</dd>
                  </div>
                ))}
              </dl>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-slate-800">Mô tả khung chương trình</h3>
                <p className={`mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700 ${hasLongDescription && !descriptionExpanded ? 'line-clamp-3' : ''}`}>
                  {description || 'Chưa có mô tả'}
                </p>
                {hasLongDescription && <button type="button" onClick={() => setDescriptionExpanded(value => !value)} aria-expanded={descriptionExpanded} className="mt-2 text-sm font-medium text-orange-700 hover:underline focus-visible:rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-500">{descriptionExpanded ? 'Thu gọn' : 'Xem thêm'}</button>}
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold">Lộ trình học tập</h3>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 9 }, (_, index) => index + 1).map(semester => {
                  const courses = detail.courses.filter(course => course.semester === semester);
                  const options = detail.combos.flatMap(combo => combo.courses.filter(course => course.semester === semester).map(course => ({ combo, course })));
                  return <section key={semester} className="rounded border p-3">
                    <h4 className="font-semibold">Kỳ {semester}</h4>
                    {!courses.length && !options.length && <p className="mt-2 text-sm text-slate-500">Chưa có môn học.</p>}
                    <ul className="mt-2 space-y-1 text-sm">
                      {courses.map(course => <li key={course.id}>{course.courseCode} — {course.name} ({course.credits} tín chỉ)</li>)}
                      {options.map(({ combo, course }) => <li key={`${combo.id}-${course.id}`} className="text-slate-600">{course.courseCode} — {course.name} ({course.credits ?? '—'} tín chỉ) · Lựa chọn {combo.name}</li>)}
                    </ul>
                  </section>;
                })}
              </div>
            </div>
            <h3 className="font-semibold">Môn học trong khung</h3>
            <div className="overflow-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#EFF6FF] text-[#334155]">
                  <tr className="border-b border-[#D6E4F0]">
                    {[
                      "STT",
                      "Mã môn",
                      "Tên môn",
                      "Kỳ khuyến nghị",
                      "Tín chỉ",
                      "Combo",
                      "Loại",
                      "Tiên quyết",
                    ].map((h) => (
                      <th key={h} className="p-2 font-semibold">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {detail.courses.map((c, index) => (
                    <tr key={c.id} className="border-t border-[#E2E8F0] bg-white transition-colors duration-150 hover:bg-[#EAF2FF]">
                      <td className="p-2">{index + 1}</td>
                      <td className="p-2">{c.courseCode}</td>
                      <td>{c.name}</td>
                      <td>{c.semester}</td>
                      <td>{c.credits ?? "—"}</td>
                      <td>{comboNamesForCourse(c.courseId)}</td>
                      <td>{({ COURSE: 'Môn học', COMBO_SLOT: 'Vị trí combo', ELECTIVE_SLOT: 'Vị trí tự chọn' } as Record<string, string>)[c.entryKind] ?? c.entryKind}</td>
                      <td>{c.prerequisiteText || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!detail.courses.length && <p>Khung này chưa có môn học.</p>}
            <h3 className="font-semibold">Combo</h3>
            {!detail.combos.length && <p>Khung này chưa có combo.</p>}
            {detail.combos.map((combo) => (
              <section key={combo.id} className="space-y-2 rounded border p-4">
                <h4 className="font-semibold">
                  {combo.code} — {combo.name}
                </h4>
                <p>{combo.note}</p>
                <div className="overflow-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#EFF6FF] text-[#334155]">
                      <tr className="border-b border-[#D6E4F0]">
                        {[
                          "Mã môn",
                          "Tên môn",
                          "Kỳ",
                          "Tín chỉ",
                          "Tiên quyết",
                        ].map((h) => (
                          <th className="p-2 font-semibold" key={h}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {combo.courses.map((c) => (
                        <tr className="border-t border-[#E2E8F0] bg-white transition-colors duration-150 hover:bg-[#EAF2FF]" key={c.id}>
                          <td className="p-2">{c.courseCode}</td>
                          <td>{c.name}</td>
                          <td>{c.semester}</td>
                          <td>{c.credits ?? "—"}</td>
                          <td>{c.prerequisiteText || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ))}
          </>
        )}
      </section>
    </div>
  );
};
export default EducationCurriculumPlan;
