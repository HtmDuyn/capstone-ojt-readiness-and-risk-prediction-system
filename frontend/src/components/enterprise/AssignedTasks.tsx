import { displayTaskTime } from '@/utils/shared/taskTime';
import { useMemo, useState } from 'react';
import { CheckCircle2, ChevronDown, ClipboardList, Eye, Search, Trash2, Users } from 'lucide-react';
import type { InternTask } from '@/types/enterprise/enterpriseTypes';

export const taskStatusLabels = { TODO: 'Chưa làm', DONE: 'Đã xong', OVERDUE: 'Quá hạn' };
const dateKey = (date: Date) => date.toISOString().slice(0,10);
const today = () => new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Ho_Chi_Minh'}).format(new Date());

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

export function useAssignedTasks(tasks:InternTask[], filterByDate:boolean) {
  const [period,setPeriod] = useState('all');
  const [anchor,setAnchor] = useState(today);
  const [from,setFrom] = useState(today);
  const [to,setTo] = useState(today);
  let start = '', end = '';
  if (period==='custom') { start=from; end=to; }
  if (anchor && (period==='week' || period==='month')) {
    const first=new Date(anchor+'T00:00:00Z');
    if(period==='week') first.setUTCDate(first.getUTCDate()-(first.getUTCDay()+6)%7);
    else first.setUTCDate(1);
    const last=new Date(first);
    if(period==='week') last.setUTCDate(first.getUTCDate()+6);
    else last.setUTCMonth(last.getUTCMonth()+1,0);
    start=dateKey(first); end=dateKey(last);
  }
  const groups = useMemo(() => {
    const result = new Map<string,InternTask[]>();
    for (const t of tasks) {
      const day = t.createdAt?.slice(0,10);
      if (filterByDate && period !== 'all' && !(day && start && end && day >= start && day <= end)) continue;
      const key = JSON.stringify([t.title,t.description,t.createdAt,t.deadline]);
      const group = result.get(key);
      if (group) group.push(t); else result.set(key,[t]);
    }
    return [...result.entries()];
  },[tasks,period,start,end,filterByDate]);
  return {groups,period,setPeriod,anchor,setAnchor,from,setFrom,to,setTo,start,end};
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
  const {groups,period,setPeriod,anchor,setAnchor,from,setFrom,to,setTo,start,end}=view;
  const [query,setQuery] = useState('');
  const [status,setStatus] = useState('');
  const term = query.trim().toLocaleLowerCase('vi');
  const visible = groups.filter(([,items]) => items[0].title.toLocaleLowerCase('vi').includes(term) && (!status || items.some(t => t.status === status)));
  const input='h-9 min-w-0 rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-700 focus-visible:outline-orange-500';
  return <section aria-label="Nhiệm vụ đã giao" className="space-y-4 p-3 text-slate-900 sm:p-5">
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-[minmax(12rem,1fr)_auto_auto]">
      <div className="relative col-span-2 sm:col-span-1"><Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
        <input type="search" aria-label="Tìm kiếm nhiệm vụ" placeholder="Tìm theo tên nhiệm vụ…" value={query} onChange={e=>setQuery(e.target.value)} className={input+' w-full !pl-9'}/></div>
      <select aria-label="Lọc trạng thái nhiệm vụ" className={input} value={status} onChange={e=>setStatus(e.target.value)}>
        <option value="">Tất cả trạng thái</option>{Object.entries(taskStatusLabels).map(([key,label])=><option key={key} value={key}>{label}</option>)}
      </select>
      <select aria-label="Lọc theo ngày giao" className={input} value={period} onChange={e=>setPeriod(e.target.value)}>
        <option value="all">Mọi ngày giao</option><option value="week">Theo tuần</option><option value="month">Theo tháng</option><option value="custom">Tùy chỉnh</option>
      </select>
    </div>
    {period!=='all' && <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium text-slate-600">
      {(period==='week'||period==='month') && <label>Ngày trong {period==='week'?'tuần':'tháng'} <input className={input} type="date" value={anchor} onChange={e=>setAnchor(e.target.value)}/></label>}
      {period==='custom' && <><label>Từ ngày <input className={input} type="date" value={from} max={to} onChange={e=>setFrom(e.target.value)}/></label>
        <label>Đến ngày <input className={input} type="date" value={to} min={from} onChange={e=>setTo(e.target.value)}/></label></>}
    </div>}
    <div className="space-y-2.5">{visible.map(([key,items])=><TaskCard key={key} items={items} onDelete={onDelete} onSubmissions={onSubmissions}/>)}</div>
    {!visible.length && <p className="py-8 text-center text-sm text-slate-500">{start>end && end ? 'Ngày kết thúc phải từ ngày bắt đầu trở đi.' : 'Không tìm thấy nhiệm vụ phù hợp.'}</p>}
  </section>;
}
