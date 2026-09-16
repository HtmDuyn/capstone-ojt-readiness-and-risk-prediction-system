import React from 'react';
import { X, Calendar, User, Tag } from 'lucide-react';
import type { TaskItem, TaskPriority, TaskStatus } from '@/types/student/ojtProgressTypes';

interface TaskDetailModalProps {
  task: TaskItem | null;
  onClose: () => void;
  onUpdateStatus: (taskId: string, newStatus: TaskStatus) => void;
}

export const getPriorityBadge = (priority: TaskPriority) => {
  switch (priority) {
    case 'urgent':
      return <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded-md font-bold text-[10px]">Gấp</span>;
    case 'high':
      return <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-md font-bold text-[10px]">Ưu tiên cao</span>;
    case 'medium':
      return <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md font-semibold text-[10px]">Trung bình</span>;
    default:
      return <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium text-[10px]">Thường</span>;
  }
};

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  onClose,
  onUpdateStatus,
}) => {
  if (!task) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-white space-y-5 animate-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            {getPriorityBadge(task.priority)}
            <span className="text-xs font-semibold text-slate-400">ID: #{task.id}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-bold text-slate-900">{task.title}</h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{task.description}</p>

          {task.details && (
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-700 space-y-1">
              <span className="font-bold text-slate-800 block">📌 Chi tiết hướng dẫn:</span>
              <p>{task.details}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 text-xs pt-2">
            <div className="flex items-center gap-1.5 text-slate-600">
              <Calendar size={14} className="text-orange-500" />
              <span>Hạn chót: <strong>{task.dueDate}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600">
              <User size={14} className="text-orange-500" />
              <span className="truncate">Giao bởi: <strong>{task.assignedBy.split('(')[0]}</strong></span>
            </div>
          </div>

          {task.tags && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {task.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-orange-50 text-orange-700 border border-orange-200/60"
                >
                  <Tag size={10} /> {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Action Bar */}
        <div className="pt-4 border-t border-slate-100 space-y-2">
          <span className="text-xs font-bold text-slate-500 block mb-1">Cập nhật trạng thái:</span>
          <div className="flex flex-wrap gap-2">
            {[
              { status: 'todo' as TaskStatus, label: 'Cần làm', activeClass: 'bg-slate-800 text-white', defaultClass: 'bg-slate-100 text-slate-700 hover:bg-slate-200' },
              { status: 'in_progress' as TaskStatus, label: 'Đang làm', activeClass: 'bg-blue-600 text-white', defaultClass: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
              { status: 'done' as TaskStatus, label: 'Đã hoàn thành', activeClass: 'bg-emerald-600 text-white', defaultClass: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' },
            ].map((btn) => (
              <button
                key={btn.status}
                type="button"
                onClick={() => onUpdateStatus(task.id, btn.status)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  task.status === btn.status ? btn.activeClass : btn.defaultClass
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
