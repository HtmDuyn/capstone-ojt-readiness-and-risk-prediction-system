import React from 'react';
import { CheckCircle2, Clock } from 'lucide-react';
import type { TaskItem } from '@/types/student/ojtProgressTypes';
import { getPriorityBadge } from './TaskDetailModal';

interface TaskKanbanColumnProps {
  title: string;
  count: number;
  tasks: TaskItem[];
  type: 'todo' | 'in_progress' | 'done';
  onTaskClick: (task: TaskItem) => void;
}

export const TaskKanbanColumn: React.FC<TaskKanbanColumnProps> = ({
  title,
  count,
  tasks,
  type,
  onTaskClick,
}) => {
  const getColumnConfig = () => {
    switch (type) {
      case 'todo':
        return {
          headerColor: 'text-slate-500',
          dotBg: 'bg-slate-400',
          containerBg: 'bg-slate-50/60 border-slate-100',
          emptyText: 'Không có nhiệm vụ nào',
        };
      case 'in_progress':
        return {
          headerColor: 'text-blue-600',
          dotBg: 'bg-blue-500 animate-pulse',
          containerBg: 'bg-blue-50/20 border-blue-100/60',
          emptyText: 'Không có nhiệm vụ đang làm',
        };
      case 'done':
        return {
          headerColor: 'text-emerald-600',
          dotBg: 'bg-emerald-500',
          containerBg: 'bg-emerald-50/20 border-emerald-100/60',
          emptyText: 'Chưa có nhiệm vụ hoàn thành',
        };
    }
  };

  const config = getColumnConfig();

  return (
    <div className="flex flex-col space-y-3">
      {/* Column Header */}
      <div className="flex items-center justify-between px-1">
        <h3 className={`text-xs font-bold ${config.headerColor} uppercase tracking-wider flex items-center gap-2`}>
          <span className={`w-2 h-2 rounded-full ${config.dotBg}`} />
          {title} ({count})
        </h3>
      </div>

      {/* Scrollable Container with Fixed Max Height for Uniformity */}
      <div className={`${config.containerBg} border rounded-2xl p-2.5 space-y-2.5 min-h-[320px] max-h-[520px] overflow-y-auto custom-scrollbar`}>
        {tasks.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 italic">
            {config.emptyText}
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              onClick={() => onTaskClick(task)}
              className={`p-3.5 rounded-xl border transition-all duration-200 group cursor-pointer hover:shadow-md ${
                type === 'done'
                  ? 'bg-white/90 border-slate-100 hover:border-emerald-200 opacity-85 hover:opacity-100 shadow-2xs'
                  : type === 'in_progress'
                  ? 'bg-white border-blue-100 hover:border-blue-400 ring-1 ring-blue-500/10 shadow-2xs'
                  : 'bg-white border-slate-100 hover:border-orange-300 shadow-2xs'
              }`}
            >
              {/* Card Header: Title & Priority */}
              <div className="flex items-start justify-between gap-2 mb-1">
                <h4
                  className={`font-bold text-xs sm:text-sm leading-snug transition-colors ${
                    type === 'done'
                      ? 'text-slate-600 line-through decoration-slate-300'
                      : type === 'in_progress'
                      ? 'text-slate-800 group-hover:text-blue-600'
                      : 'text-slate-800 group-hover:text-orange-600'
                  }`}
                >
                  {task.title}
                </h4>
                {type !== 'done' && getPriorityBadge(task.priority)}
              </div>

              {/* Description (Hide or compact for done tasks) */}
              {type !== 'done' && (
                <p className="text-[11px] sm:text-xs text-slate-500 mb-2.5 line-clamp-2 leading-relaxed">
                  {task.description}
                </p>
              )}

              {/* Card Footer: Clear & Single Date info */}
              <div className="flex items-center justify-between text-[11px] font-semibold pt-2 border-t border-slate-50">
                {type === 'done' ? (
                  <span className="flex items-center gap-1 text-emerald-600">
                    <CheckCircle2 size={13} />
                    Đã xác nhận
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-slate-500 bg-slate-100/80 px-2 py-0.5 rounded-md">
                    <Clock size={11} className="text-slate-400" />
                    Hạn: {task.dueDate}
                  </span>
                )}

                {type === 'in_progress' ? (
                  <span className="w-5 h-5 rounded-full bg-orange-600 text-white flex items-center justify-center text-[9px] font-bold border border-white shadow-2xs">
                    Men
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 font-medium">#{task.id}</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
