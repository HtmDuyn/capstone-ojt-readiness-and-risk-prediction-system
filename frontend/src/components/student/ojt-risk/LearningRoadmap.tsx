import { useId, useState } from 'react';
import { CheckCircle2, ChevronDown, ChevronUp, Info, LockKeyhole, Route, Sparkles } from 'lucide-react';
import type { RiskAssessment } from '@/services/studentService';
import { focusClass } from './risk-ui';

export function LearningRoadmap({ roadmap, embedded = false, timeline = false }: {
  roadmap: RiskAssessment['roadmap'];
  embedded?: boolean;
  timeline?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const listId = useId();
  const ordered = timeline ? [...roadmap.items].sort((a, b) => a.priority - b.priority) : roadmap.items;
  const visible = expanded ? ordered : ordered.slice(0, 4);

  return <section aria-label="Lộ trình học tập đề xuất" className="min-w-0">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-2.5">
        {timeline ? <Route size={18} className="mt-0.5 shrink-0 text-blue-600" aria-hidden="true" /> : <Sparkles size={18} className="mt-0.5 shrink-0 text-indigo-500" aria-hidden="true" />}
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-slate-900">Lộ trình học tập đề xuất</h3>
          <p className="mt-1 text-sm leading-relaxed text-slate-500">{roadmap.status === 'READY' ? roadmap.objective : roadmap.message}</p>
        </div>
      </div>
      <span className={timeline ? 'rounded-md border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700' : 'text-xs font-medium leading-6 text-slate-400'}>Đến hết kỳ {roadmap.targetSemester}{timeline && ' · Không gồm OJT202'}</span>
    </div>

    {roadmap.status !== 'READY' ? <div className="mt-4 flex items-start gap-2.5 text-sm leading-relaxed text-slate-500">
      <Info size={17} className="mt-0.5 shrink-0 text-slate-400" aria-hidden="true" />
      <div><p className="font-medium text-slate-700">{roadmap.status === 'NOT_AVAILABLE' ? 'Lộ trình chưa sẵn sàng' : 'Cần đối soát chương trình đào tạo'}</p>
        <p className="mt-1">Chưa đủ dữ liệu hợp lệ để đề xuất môn học. Bạn có thể xem các hướng xử lý bên dưới.</p></div>
    </div> : roadmap.items.length === 0 ? <div className="mt-4 flex items-start gap-2.5 text-sm leading-relaxed text-slate-500">
      <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-emerald-600" aria-hidden="true" />
      <p>Chưa có môn cần bổ sung. Tiếp tục hoàn thành các môn đang học và theo dõi kết quả xét OJT.</p>
    </div> : <div className={timeline ? 'mt-4' : 'mt-4 sm:pl-7'}>
      <p className="text-sm leading-relaxed text-slate-600">Bạn nên hoàn thành các môn sau theo thứ tự ưu tiên:</p>
      <ol id={listId} className={timeline ? 'mt-4 space-y-3' : 'mt-3 list-decimal space-y-3.5 pl-5 marker:font-semibold marker:text-slate-400'}>
        {visible.map((course, index) => {
          const missing = course.prerequisites.filter(group => !group.satisfied);
          return <li key={course.courseId} value={course.priority} className={timeline ? 'relative min-w-0 pl-10 sm:pl-12' : 'min-w-0 pl-1'}>
            {timeline && <><span aria-hidden="true" className="absolute left-0 top-4 grid size-7 place-items-center rounded-full border border-blue-200 bg-blue-50 text-xs font-semibold tabular-nums text-blue-700">{index + 1}</span>{index < visible.length - 1 && <span aria-hidden="true" className="absolute bottom-[-28px] left-[13px] top-11 w-px bg-slate-200" />}</>}
            <div className={timeline ? 'rounded-xl border border-slate-200 bg-white px-4 py-3' : ''}>
            <div className={timeline ? 'flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4' : ''}>
            <div className="min-w-0 flex-1">
            <p className="break-words text-sm leading-7 text-slate-600">
              <strong className="font-semibold text-slate-900">{course.action === 'RETAKE' ? 'Học lại' : 'Học mới'} {course.courseCode ?? course.name ?? 'môn trong chương trình'}</strong>
              {course.courseCode && course.name && <> — {course.name}</>}
            </p>
            {timeline && <p className="mt-1 text-sm leading-6 text-slate-600">{course.explanation}</p>}
            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs leading-6">
              <span className={`inline-flex items-center gap-1.5 ${course.canPlan ? 'text-emerald-700' : 'text-amber-700'}`}>
                {course.canPlan ? <CheckCircle2 size={12} aria-hidden="true" /> : <LockKeyhole size={12} aria-hidden="true" />}
                {course.canPlan ? 'Có thể ưu tiên' : 'Hoàn thành tiên quyết trước khi lên kế hoạch'}
              </span>
              {!!course.dependentCourses?.length && <span className="text-slate-500">Liên quan tiên quyết của {course.dependentCourses.map(c => c.courseCode ?? c.name ?? 'môn trong chương trình').join(', ')}.</span>}
            </div>
            {missing.map((group, index) => <p key={index} className="mt-1 text-xs leading-6 text-amber-800">
              Cần đạt thêm <strong className="font-semibold">{group.remainingRequired} môn</strong> trong nhóm: {group.courses.filter(c => !c.passed).map(c => c.courseCode ?? 'Môn chưa có mã').join(', ')}.
            </p>)}
            {course.isAlternative && <p className="mt-1 text-xs leading-6 text-slate-500">Đây là một phương án trong nhóm lựa chọn, không cần học tất cả phương án.</p>}
            </div>
            {timeline && <span className="shrink-0 self-start rounded-md border border-blue-100 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">Ưu tiên {course.priority}</span>}
            </div></div>
          </li>;
        })}
      </ol>
      {roadmap.items.length > 4 && <button type="button" aria-expanded={expanded} aria-controls={listId} onClick={() => setExpanded(value => !value)} className={`mt-4 inline-flex items-center gap-1.5 rounded py-1 text-sm font-medium ${timeline ? 'text-blue-600 hover:text-blue-800' : 'text-indigo-600 hover:text-indigo-800'} ${focusClass}`}>
        {expanded ? 'Thu gọn lộ trình' : `Xem thêm ${roadmap.items.length - 4} môn`}
        <ChevronDown size={15} className={expanded ? 'rotate-180' : ''} aria-hidden="true" />
      </button>}
      <p className="mt-4 text-xs leading-relaxed text-slate-400">Chỉ gồm môn đến hết kỳ {roadmap.targetSemester}, không bao gồm OJT202. {timeline ? 'Thứ tự ưu tiên không mặc định là quan hệ tiên quyết hoặc thứ tự đăng ký bắt buộc; cần kiểm tra điều kiện từng môn và lịch mở lớp trước khi đăng ký.' : 'Thứ tự ưu tiên không phải lịch đăng ký môn; cần kiểm tra lịch mở lớp trước khi đăng ký.'}</p>
    </div>}
    {!embedded && <RoadmapNotes roadmap={roadmap} />}
  </section>;
}

export function RoadmapNotes({roadmap,accordion=false}:{roadmap:RiskAssessment['roadmap'];accordion?:boolean}){
  return <details className={accordion ? 'group mt-5 rounded-xl border border-slate-200 bg-white px-4 py-2' : 'group mt-4 border-t border-slate-200/80 pt-3'} onToggle={event => event.currentTarget.querySelector('summary')?.setAttribute('aria-expanded', String(event.currentTarget.open))}>
    <summary aria-expanded={false} className={`flex cursor-pointer list-none items-center justify-between gap-3 rounded py-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 [&::-webkit-details-marker]:hidden ${focusClass}`}>
      <span>Giải thích &amp; lưu ý về lộ trình</span>
      <span className="flex shrink-0 items-center gap-2 text-xs font-medium">
        <span className="group-open:hidden">Xem chi tiết</span><span className="hidden group-open:inline">Thu gọn</span>
        <ChevronDown size={16} className="group-open:hidden" aria-hidden="true"/><ChevronUp size={16} className="hidden group-open:block" aria-hidden="true"/>
      </span>
    </summary>
    <div className="pt-3 text-sm leading-relaxed text-slate-600">
      <p>{roadmap.message}</p>
      {roadmap.status === 'READY' && roadmap.items.some(course => course.explanation) && <ul className="mt-3 list-disc space-y-2 pl-4">{roadmap.items.filter(course => course.explanation).map(course => <li key={course.courseId}><strong className="font-medium text-slate-800">{course.courseCode ?? course.name ?? 'Môn học'}</strong>: {course.explanation}</li>)}</ul>}
      <ul className="mt-3 list-disc space-y-2 pl-4">{roadmap.limitations.map((limitation, index) => <li key={index}>{limitation}</li>)}</ul>
    </div>
  </details>;
}
