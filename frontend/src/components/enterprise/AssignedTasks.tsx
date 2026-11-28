import { displayTaskTime } from '@/utils/shared/taskTime';
import { useMemo } from 'react';
import { CheckCircle2, ChevronDown, ClipboardList, Eye, Trash2, Users } from 'lucide-react';
import type { InternTask } from '@/types/enterprise/enterpriseTypes';

export const taskStatusLabels = { TODO: 'Chưa làm', DONE: 'Đã xong', OVERDUE: 'Quá hạn' };

const tones = {
  TODO: 'bg-amber-100 text-amber-800',
  DONE: 'bg-emerald-100 text-emerald-700',
  OVERDUE: 'bg-rose-100 text-rose-700',
};
const chip = 'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium';

function TaskCard({items,onDelete,onSubmissions}:{items:InternTask[];onDelete:(task:InternTask)=>void;onSubmissions:(task:InternTask)=>void}) {
  const task = items[0];
  const completed = items.filter(item => item.status === 'DONE').length;
  const overdue = items.filter(item => item.status === 'OVERDUE').length;
  const percent = Math.round(completed * 100 / items.length);
  const students = new Set(items.map(item => item.internId)).size;
  return <details className="group rounded-2xl border border-slate-200 bg-white">
    <summary className="cursor-pointer list-none rounded-2xl p-4 focus-visible:outline-2 focus-visible:outline-orange-500 sm:p-5 [&::-webkit-details-marker]:hidden">
      <span className="flex items-center justify-between gap-3">
        <strong className="break-words text-base sm:text-lg">{task.title}</strong>
        <ChevronDown size={17} className="shrink-0 text-slate-500 transition-transform group-open:rotate-180" />
      </span>
      <span className="mt-1 block text-sm text-slate-500">Giao: {displayTaskTime(task.createdAt)} · Hạn nộp: {displayTaskTime(task.deadline)}</span>
      {task.ojtSemesterName && <span className="mt-1 block text-sm text-slate-600">Đợt OJT: <span className="font-medium">{task.ojtSemesterName}</span></span>}
      <span className="mt-3 flex flex-wrap gap-2">
        <span className={chip+' bg-slate-100 text-slate-700'}><Users size={14}/>{students} sinh viên</span>
        <span className={chip+' '+tones.DONE}>{completed} hoàn thành</span>
        {overdue > 0 && <span className={chip+' '+tones.OVERDUE}>{overdue} quá hạn</span>}
      </span>
      <span className="mt-3 flex items-center gap-3">
        <span role="progressbar" aria-label={'Tiến độ '+task.title} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}
          className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100"><span className="block h-full rounded-full bg-emerald-500" style={{width:percent+'%'}}/></span>
        <span className="text-xs font-semibold tabular-nums">{percent}%</span>
      </span>
    </summary>
    <div className="mx-4 border-t border-slate-100 py-4 sm:mx-5">
      <div className="mb-3 flex flex-wrap justify-between gap-2 text-sm"><h3 className="font-semibold">Tiến độ từng sinh viên</h3><span className="text-slate-500">{students} người được giao</span></div>
      <table className="w-full text-left text-sm"><thead className="text-slate-500"><tr><th className="py-2">Sinh viên</th><th>Trạng thái</th><th><span className="sr-only">Thao tác</span></th></tr></thead>
        <tbody>{items.map(item => <tr key={item.id} className="border-t border-slate-100">
          <td className="py-2 pr-2">{item.internName}</td>
          <td><span className={chip+' whitespace-nowrap '+tones[item.status]}>{taskStatusLabels[item.status]}</span></td>
          <td className="text-right"><button aria-label={`Xem bài nộp của ${item.internName}`} title="Xem chi tiết bài làm và file đính kèm" onClick={()=>onSubmissions(item)} className="inline-flex items-center gap-1 rounded p-2 font-medium text-orange-600 hover:bg-orange-50"><Eye size={15}/><span>Xem bài làm</span></button>{item.canDelete && <button aria-label={`Xóa nhiệm vụ của ${item.internName}`} title="Xóa nhiệm vụ" onClick={()=>onDelete(item)} className="rounded p-2 text-slate-500 hover:text-rose-700"><Trash2 size={15}/></button>}</td>
        </tr>)}</tbody>
      </table>
    </div>
  </details>;
}

export function useAssignedTasks(tasks:InternTask[]) {
  const groups = useMemo(() => {
    const result = new Map<string,InternTask[]>();
    for (const t of tasks) {
      const key = JSON.stringify([t.ojtSemesterId,t.title,t.description,t.createdAt,t.deadline]);
      const group = result.get(key);
      if (group) group.push(t); else result.set(key,[t]);
    }
    return [...result.entries()];
  },[tasks]);
  return {groups};
}

export function TaskSummary({groups,ready}:{groups:ReturnType<typeof useAssignedTasks>['groups'];ready:boolean}) {
  const metrics = [
    {label:'Tổng nhiệm vụ',value:groups.length,icon:ClipboardList,tone:'bg-orange-50 text-orange-700'},
    {label:'Lượt giao',value:groups.reduce((sum,[,items])=>sum+items.length,0),icon:Users,tone:'bg-blue-50 text-blue-700'},
    {label:'Đã hoàn thành',value:groups.reduce((sum,[,items])=>sum+items.filter(t=>t.status==='DONE').length,0),icon:CheckCircle2,tone:'bg-emerald-50 text-emerald-700'},
  ];
  return <dl aria-label="Tổng quan nhiệm vụ" className="grid grid-cols-3 gap-2 sm:gap-4">{metrics.map(({label,value,icon:Icon,tone})=>
    <div key={label} className="relative rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-5">
      <dt className="text-xs font-medium text-slate-600 sm:text-sm">{label}<span className={'absolute right-4 top-4 hidden rounded-xl p-2.5 sm:block '+tone}><Icon size={18} aria-hidden="true"/></span></dt>
      <dd className="mt-2 text-2xl font-semibold tabular-nums text-slate-900">{ready?value:'—'}</dd>
    </div>)}</dl>;
}

export function AssignedTasks({view,onDelete,onSubmissions}:{view:ReturnType<typeof useAssignedTasks>;onDelete:(task:InternTask)=>void;onSubmissions:(task:InternTask)=>void}) {
  const {groups}=view;
  return <section aria-label="Nhiệm vụ đã giao" className="space-y-4 p-3 text-slate-900 sm:p-5">
    <div className="space-y-2.5">{groups.map(([key,items])=><TaskCard key={key} items={items} onDelete={onDelete} onSubmissions={onSubmissions}/>)}</div>
    {!groups.length && <p className="py-8 text-center text-sm text-slate-500">Không tìm thấy nhiệm vụ phù hợp.</p>}
  </section>;
}
