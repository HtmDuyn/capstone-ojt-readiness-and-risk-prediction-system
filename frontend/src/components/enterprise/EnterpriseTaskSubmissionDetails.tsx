import { useState } from 'react';
import { ChevronDown, FileText } from 'lucide-react';
import { TaskSubmissionHistory } from '@/components/shared/TaskSubmissionHistory';
import { getEnterpriseTaskSubmissions } from '@/services/taskSubmissionService';

export function EnterpriseTaskSubmissionDetails({ taskId, initiallyOpen = false }: { taskId: number; initiallyOpen?: boolean }) {
  const [open, setOpen] = useState(initiallyOpen);
  return <details open={open} onToggle={event => setOpen(event.currentTarget.open)} className="group/submission min-w-0 rounded-xl border border-orange-100 bg-orange-50/30">
    <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-xl p-3 text-sm font-semibold text-orange-800 focus-visible:outline-orange-500 [&::-webkit-details-marker]:hidden">
      <span className="flex items-center gap-2"><FileText size={17} className="shrink-0" />Bài làm và file đính kèm</span>
      <ChevronDown size={16} className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
    </summary>
    {open && <div className="min-w-0 border-t border-orange-100 p-3 sm:p-4"><TaskSubmissionHistory taskId={taskId} load={(page, signal) => getEnterpriseTaskSubmissions(taskId, page, signal)} /></div>}
  </details>;
}
