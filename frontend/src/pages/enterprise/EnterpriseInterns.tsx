import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { displayTaskTime, vietnamTaskMinute } from '@/utils/shared/taskTime';
import { createPortal } from 'react-dom';
import { AssignedTasks, TaskSummary, taskStatusLabels, useAssignedTasks } from '@/components/enterprise/AssignedTasks';
import { PageBanner } from '@/components/common/PageBanner';
import {
  CheckSquare,
  Square,
  Search,
  CheckCircle2,
  AlertTriangle,
  Users,
  Filter,
  Trash2,
  Check,
  Briefcase,
  ListTodo,
  Eye,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import {
  enterpriseService,
  type EnterpriseInternshipItem,
  type EnterpriseInternshipTask,
} from '@/services/enterpriseService';
import { EnterpriseIntern, InternTask } from '@/types/enterprise/enterpriseTypes';
import { loadAllPages } from '@/utils/enterprise/recruitment';
import { friendlyErrorMessage } from '@/utils/shared/friendlyError';
import { useEnterprise } from '@/contexts/EnterpriseContext';
import { TaskSubmissionsDialog } from '@/components/student/TaskSubmissionsDialog';
import { getEnterpriseTaskSubmissions } from '@/services/taskSubmissionService';
import { EnterpriseTaskSubmissionDetails } from '@/components/enterprise/EnterpriseTaskSubmissionDetails';

// Adapter: map API data to existing UI's expected format
const mapApiToIntern = (item: EnterpriseInternshipItem, total: number, completed: number): EnterpriseIntern => ({
  id: String(item.id),
  studentCode: item.student?.studentCode || '',
  fullName: item.student?.fullName || '',
  major: item.student?.programName || item.student?.programCode || '',
  position: item.position?.title || '',
  mentorName: item.enterpriseSupervisorName || item.academicSupervisor?.fullName || 'Chưa có người hướng dẫn',
  mentorEmail: item.academicSupervisor?.email || '',
  startDate: item.startDate ? new Date(item.startDate).toLocaleDateString('vi-VN') : '',
  progressPercent: total ? Math.round((completed / total) * 100) : 0,
  completedTasks: completed,
  totalTasks: total,
  attendanceDays: 0,
  assignmentStatus: item.status?.toUpperCase(),
  assignmentStartDate: item.startDate,
  assignmentEndDate: item.endDate,
  status: (['CANCELLED', 'CANCELED', 'FAILED'].includes(item.status?.toUpperCase() || '') ? 'RISK' : item.status?.toUpperCase() === 'COMPLETED' ? 'COMPLETED' : 'ONGOING') as 'ONGOING' | 'COMPLETED' | 'RISK',
});

const mapApiToTask = (item: EnterpriseInternshipTask): InternTask => {
  return {
    id: String(item.id),
    internId: String(item.assignmentId),
    internName: item.student?.fullName || item.fullName || 'Sinh viên',
    title: item.name,
    description: item.description || '',
    deadline: item.dueAt || item.dueDate?.slice(0, 10) || '',
    status: item.enterpriseStatus,
    canDelete: item.canDelete,
    assignedBy: 'Mentor Doanh Nghiệp',
    createdAt: item.assignedAt || item.assignedDate?.slice(0, 10),
  };
};

const isTaskAssignable = (intern: EnterpriseIntern) =>
  ['ASSIGNED', 'ACTIVE', 'IN_PROGRESS'].includes(intern.assignmentStatus || '');

const localDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getApiErrorMessage = (error: unknown): string | null => {
  return friendlyErrorMessage(error, 'Không thể hoàn thành yêu cầu lúc này. Vui lòng thử lại.');
};

type InternStatusFilter = 'ALL' | 'ONGOING' | 'RISK';
type TaskStatusFilter = 'ALL' | InternTask['status'];

const isInternStatusFilter = (value: string): value is InternStatusFilter =>
  value === 'ALL' || value === 'ONGOING' || value === 'RISK';

const isTaskStatusFilter = (value: string): value is TaskStatusFilter =>
  value === 'ALL' || value === 'TODO' || value === 'OVERDUE' || value === 'DONE';

export const EnterpriseInterns: React.FC = () => {
  const { loading: profileLoading, companyId } = useEnterprise();
  const [roster, setRoster] = useState<EnterpriseInternshipItem[]>([]);
  const [tasks, setTasks] = useState<InternTask[]>([]);
  const [apiLoading, setApiLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const interns = useMemo(() => {
    const counts = new Map<string, {total: number; completed: number; overdue: number}>();
    for (const task of tasks) {
      const entry = counts.get(task.internId) ?? {total: 0, completed: 0, overdue: 0};
      entry.total++;
      if (task.status === 'DONE') entry.completed++;
      if (task.status === 'OVERDUE') entry.overdue++;
      counts.set(task.internId, entry);
    }
    return roster.map(item => {
      const count = counts.get(String(item.id));
      const taskStatus: InternTask['status'] = count?.overdue ? 'OVERDUE'
        : count?.total && count.completed === count.total ? 'DONE' : 'TODO';
      return { ...mapApiToIntern(item, count?.total ?? 0, count?.completed ?? 0), taskStatus };
    });
  }, [roster, tasks]);

  const activeRequest = useRef<AbortController | null>(null);
  const fetchInternships = useCallback(async (silent = false) => {
    if (profileLoading || (silent && activeRequest.current)) return;
    activeRequest.current?.abort();
    if (!companyId) {
      setApiLoading(false);
      setApiError('Không tìm thấy doanh nghiệp để tải danh sách task.');
      return;
    }

    const controller = new AbortController();
    activeRequest.current = controller;
    if (!silent) setApiLoading(true);
    setApiError(null);
    try {
      const [internshipResponse, taskItems] = await Promise.all([
        enterpriseService.listInternships({}, controller.signal),
        loadAllPages(page => enterpriseService.listInternshipTasks(companyId, {page, limit: 100}, controller.signal),
          controller.signal, 'nhiệm vụ'),
      ]);
      if (controller.signal.aborted) return;
      if (!internshipResponse?.success || !internshipResponse.data) {
        throw new Error('Không thể tải danh sách thực tập sinh.');
      }
      const taskRoster = internshipResponse.data.items.filter(item =>
        item.evaluation?.status !== 'SUBMITTED' && item.evaluationLocked !== true);
      const rosterIds = new Set(taskRoster.map(item => String(item.id)));
      setRoster(taskRoster);
      setTableSelectedIds(previous => previous.filter(id => rosterIds.has(id)));
      setModalSelectedInternIds(previous => previous.filter(id => rosterIds.has(id)));
      setTasks(taskItems.map(mapApiToTask));
    } catch (err: unknown) {
      if (controller.signal.aborted) return;
      const message = getApiErrorMessage(err) ||
        (err instanceof Error ? err.message : 'Không thể tải danh sách thực tập sinh');
      setApiError(message);
    } finally {
      if (activeRequest.current === controller) {
        activeRequest.current = null;
        setApiLoading(false);
      }
    }
  }, [companyId, profileLoading]);

  useEffect(() => {
    let mounted = true;
    queueMicrotask(() => { if (mounted) void fetchInternships(); });
    return () => {
      mounted = false;
      activeRequest.current?.abort();
      activeRequest.current = null;
    };
  }, [fetchInternships]);

  useEffect(() => () => {
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }
  }, []);

  // Selected intern for task detail modal
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [submissionTask, setSubmissionTask] = useState<InternTask | null>(null);
  const viewingIntern = interns.find(intern => intern.id === viewingId);
  const [taskTab,setTaskTab] = useState<'students'|'assigned'>('students');
  const taskView = useAssignedTasks(tasks,taskTab === 'assigned');

  // Table selection checkboxes (bulk action on main table)
  const [tableSelectedIds, setTableSelectedIds] = useState<string[]>([]);

  // Modal State for task assignment
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [modalSelectedInternIds, setModalSelectedInternIds] = useState<string[]>([]);
  const [modalSearchTerm, setModalSearchTerm] = useState('');
  const [modalStatusFilter, setModalStatusFilter] = useState<InternStatusFilter>('ALL');
  const [taskSubmitting, setTaskSubmitting] = useState(false);
  const [taskSubmitError, setTaskSubmitError] = useState<string | null>(null);
  const taskRequestRef = useRef<{ signature: string; idempotencyKey: string } | null>(null);

  // Form State (No priority field as requested)
  const [newTask, setNewTask] = useState<{
    title: string;
    description: string;
    deadline: string;
    assignedBy: string;
  }>({
    title: '',
    description: '',
    deadline: '',
    assignedBy: 'Nguyễn Anh Tuấn (Tech Lead)',
  });

  // Filter & Search states for the main table (Using dropdowns instead of tabs)
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatusFilter>('ALL');
  const [taskStatusFilter, setTaskStatusFilter] = useState<TaskStatusFilter>('ALL');

  // Pagination for main table (optimized for 200+ students)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Toast Notification
  const [toast, setToast] = useState<{
    title: string;
    message: string;
  } | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  // Filtered interns list for main table
  const filteredInterns = useMemo(() => {
    return interns.filter((intern) => {
      const matchSearch =
        intern.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        intern.studentCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        intern.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
        intern.mentorName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || intern.taskStatus === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [interns, searchTerm, statusFilter]);

  // Paginated interns
  const totalPages = Math.ceil(filteredInterns.length / pageSize) || 1;
  useEffect(() => {
    setCurrentPage(previous => Math.min(previous, totalPages));
  }, [totalPages]);
  const paginatedInterns = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredInterns.slice(start, start + pageSize);
  }, [filteredInterns, currentPage, pageSize]);

  // Main table select all toggle
  const isAllCurrentPageSelected =
    paginatedInterns.length > 0 &&
    paginatedInterns.every((i) => tableSelectedIds.includes(i.id));

  const handleToggleSelectAllPage = () => {
    if (isAllCurrentPageSelected) {
      const pageIds = new Set(paginatedInterns.map((i) => i.id));
      setTableSelectedIds((prev) => prev.filter((id) => !pageIds.has(id)));
    } else {
      const newIds = new Set([...tableSelectedIds, ...paginatedInterns.map((i) => i.id)]);
      setTableSelectedIds(Array.from(newIds));
    }
  };

  const handleToggleSelectRow = (id: string) => {
    setTableSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Open task assignment modal
  const handleOpenAssignModal = (initialIds?: string[]) => {
    const assignableInterns = interns.filter(isTaskAssignable);
    const assignableIds = new Set(assignableInterns.map((intern) => intern.id));
    const requestedIds = initialIds?.length
      ? initialIds
      : tableSelectedIds.length
        ? tableSelectedIds
        : assignableInterns.map((intern) => intern.id);
    const selectedIds = requestedIds.filter((id) => assignableIds.has(id));
    setModalSelectedInternIds(selectedIds);
    setTaskSubmitError(
      selectedIds.length
        ? null
        : 'Chưa có thực tập sinh có thể nhận nhiệm vụ.'
    );
    setModalSearchTerm('');
    setModalStatusFilter('ALL');
    setShowAddTaskModal(true);
  };

  const selectedTaskInterns = useMemo(
    () => interns.filter((intern) => modalSelectedInternIds.includes(intern.id)),
    [interns, modalSelectedInternIds]
  );

  const taskDeadlineRange = useMemo(() => {
    if (!selectedTaskInterns.length) {
      return { minDate: '', maxDate: '', valid: false };
    }

    const endDates = selectedTaskInterns.map((intern) => intern.assignmentEndDate?.slice(0, 10));
    if (endDates.some((date) => !date)) {
      return { minDate: '', maxDate: '', valid: false };
    }

    const availableEndDates = endDates.filter((date): date is string => date !== undefined);
    const earliestEndDate = availableEndDates.reduce((earliest, date) => date < earliest ? date : earliest);
    const minDate = vietnamTaskMinute().slice(0,10);

    return {
      minDate,
      maxDate: earliestEndDate,
      valid: minDate <= earliestEndDate,
    };
  }, [selectedTaskInterns]);

  const taskDeadlineInvalid = modalSelectedInternIds.length > 0 && (
    !taskDeadlineRange.valid ||
    !newTask.deadline ||
    newTask.deadline <= vietnamTaskMinute() || newTask.deadline.slice(0,10) < taskDeadlineRange.minDate ||
    newTask.deadline.slice(0,10) > taskDeadlineRange.maxDate
  );

  // Quick deadline helper
  const setQuickDeadline = (daysAhead: number) => {
    if (!taskDeadlineRange.valid) return;

    const targetDate = new Date(`${taskDeadlineRange.minDate}T00:00:00`);
    targetDate.setDate(targetDate.getDate() + daysAhead);
    let deadline = localDateString(targetDate);
    if (deadline > taskDeadlineRange.maxDate) deadline = taskDeadlineRange.maxDate;
    setNewTask((prev) => ({
      ...prev,
      deadline: deadline+'T23:59',
    }));
    setTaskSubmitError(null);
  };

  // Filtered interns for modal checkbox list
  const filteredModalInterns = useMemo(() => {
    return interns.filter((intern) => {
      if (!isTaskAssignable(intern)) return false;
      const matchSearch =
        intern.fullName.toLowerCase().includes(modalSearchTerm.toLowerCase()) ||
        intern.studentCode.toLowerCase().includes(modalSearchTerm.toLowerCase()) ||
        intern.position.toLowerCase().includes(modalSearchTerm.toLowerCase());
      const matchStatus = modalStatusFilter === 'ALL' || intern.status === modalStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [interns, modalSearchTerm, modalStatusFilter]);

  const allFilteredModalSelected =
    filteredModalInterns.length > 0 &&
    filteredModalInterns.every((i) => modalSelectedInternIds.includes(i.id));

  const handleToggleSelectAllModal = () => {
    if (allFilteredModalSelected) {
      const filteredIds = new Set(filteredModalInterns.map((i) => i.id));
      setModalSelectedInternIds((prev) => prev.filter((id) => !filteredIds.has(id)));
    } else {
      const newIds = new Set([
        ...modalSelectedInternIds,
        ...filteredModalInterns.map((i) => i.id),
      ]);
      setModalSelectedInternIds(Array.from(newIds));
    }
  };

  const handleToggleModalSelectIntern = (id: string) => {
    setModalSelectedInternIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Handle task submission (bulk or single)
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      modalSelectedInternIds.length === 0 ||
      !newTask.title.trim() ||
      !newTask.deadline
    ) {
      return;
    }

    const assignedStudents = interns.filter((i) => modalSelectedInternIds.includes(i.id));
    const assignmentIds = assignedStudents.map((student) => Number(student.id));
    if (assignedStudents.length !== modalSelectedInternIds.length || assignmentIds.some((id) => !Number.isSafeInteger(id) || id <= 0)) {
      setTaskSubmitError('Danh sách thực tập sinh không hợp lệ. Vui lòng tải lại trang và thử lại.');
      return;
    }
    if (assignmentIds.length > 500) {
      setTaskSubmitError('Mỗi lần chỉ có thể giao task cho tối đa 500 sinh viên.');
      return;
    }
    if (assignedStudents.some((student) => !isTaskAssignable(student))) {
      setTaskSubmitError('Chỉ có thể giao nhiệm vụ cho thực tập sinh đang hoạt động.');
      return;
    }

    if (newTask.deadline <= vietnamTaskMinute()) {
      setTaskSubmitError('Hạn nộp phải sau thời điểm giao nhiệm vụ.');
      return;
    }
    const invalidDeadlineStudents = assignedStudents.filter((student) => {
      const endDate = student.assignmentEndDate?.slice(0, 10);
      return !endDate || newTask.deadline.slice(0,10) > endDate;
    });
    if (invalidDeadlineStudents.length) {
      setTaskSubmitError(
        `Hạn nộp không được vượt ngày kết thúc thực tập của sinh viên: ${invalidDeadlineStudents.map((student) => student.fullName).join(', ')}.`
      );
      return;
    }

    setTaskSubmitting(true);
    setTaskSubmitError(null);
    let createdTasks: InternTask[];
    try {
      const tasksPayload = [{
        name: newTask.title.trim(),
        description: newTask.description.trim() || undefined,
        dueDate: newTask.deadline,
      }];
      const signature = JSON.stringify({ assignmentIds, tasks: tasksPayload });
      if (taskRequestRef.current?.signature !== signature) {
        taskRequestRef.current = {
          signature,
          idempotencyKey: `enterprise-task-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
        };
      }
      const response = await enterpriseService.assignTasksBulk(
        assignmentIds,
        tasksPayload,
        taskRequestRef.current.idempotencyKey
      );
      if (!response.success || !response.data || response.data.created !== assignmentIds.length || response.data.tasks.length !== assignmentIds.length) {
        throw new Error('Chưa thể xác nhận đã giao đủ nhiệm vụ cho sinh viên được chọn. Vui lòng tải lại danh sách để kiểm tra.');
      }
      createdTasks = response.data.tasks.map((task) => {
        const student = assignedStudents.find((item) => Number(item.id) === task.assignmentId);
        if (!student) {
          throw new Error('Kết quả giao nhiệm vụ chưa khớp với danh sách đã chọn. Vui lòng tải lại danh sách để kiểm tra.');
        }
        return {
          id: String(task.id),
          internId: student.id,
          internName: student.fullName,
          title: newTask.title.trim(),
          description: newTask.description.trim(),
          deadline: newTask.deadline,
          status: 'TODO',
          canDelete: true,
          assignedBy: newTask.assignedBy || 'Mentor Doanh Nghiệp',
          createdAt: task.assignedAt ?? vietnamTaskMinute(),
        };
      });
      taskRequestRef.current = null;
    } catch (err: unknown) {
      const message = getApiErrorMessage(err) ||
        (err instanceof Error ? err.message : 'Không thể giao task. Vui lòng thử lại.');
      setTaskSubmitError(message);
      return;
    } finally {
      setTaskSubmitting(false);
    }

    // Update tasks state
    setTasks((prev) => [...createdTasks, ...prev]);

    // Show toast
    const studentNames = assignedStudents.map((s) => s.fullName).join(', ');
    setToast({
      title: 'Giao nhiệm vụ thành công!',
      message: `Đã giao nhiệm vụ "${newTask.title.trim()}" cho ${assignedStudents.length} sinh viên: ${studentNames}`,
    });
    if (toastTimerRef.current !== null) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 5000);

    // Close and reset
    setShowAddTaskModal(false);
    setNewTask({
      title: '',
      description: '',
      deadline: '',
      assignedBy: 'Nguyễn Anh Tuấn (Tech Lead)',
    });
  };

  const handleDeleteTask = async (task: InternTask) => {
    if (!task.canDelete || !window.confirm(`Xóa nhiệm vụ “${task.title}”?`)) return;
    try {
      await enterpriseService.deleteUnusedTask(task.id);
    } catch (error) {
      window.alert(getApiErrorMessage(error) || 'Không thể xóa nhiệm vụ.');
      return;
    }
    await fetchInternships();
  };

  // Tasks of viewed intern
  const viewedInternTasks = useMemo(() => {
    if (!viewingIntern) return [];
    return tasks
      .filter((t) => t.internId === viewingIntern.id)
      .filter((t) => taskStatusFilter === 'ALL' || t.status === taskStatusFilter);
  }, [tasks, viewingIntern, taskStatusFilter]);

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Page Banner without buttons (as requested) */}
      <PageBanner
        variant="enterprise"
        title="Quản lý & Giao Nhiệm vụ Thực tập OJT"
        description="Giao nhiệm vụ và theo dõi tiến độ của sinh viên đã được doanh nghiệp tiếp nhận."
        badge="Doanh nghiệp tiếp nhận OJT"
      />

      <TaskSummary groups={taskView.groups} ready={!apiLoading && !apiError}/>
      <section className="min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm">
      <nav aria-label="Quản lý nhiệm vụ" className="flex gap-6 border-b border-slate-200 px-5">
        {(['students','assigned'] as const).map(tab => <button type="button" key={tab} aria-current={taskTab===tab?'page':undefined}
          onClick={()=>setTaskTab(tab)} className={`border-b-2 py-3 text-sm font-semibold ${taskTab===tab?'border-orange-600 text-orange-700':'border-transparent text-slate-600'}`}>
          {tab==='students'?'Thực tập sinh':'Nhiệm vụ đã giao'}
        </button>)}
      </nav>
      {/* Toast Alert */}
      {toast && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-sm font-medium flex items-start justify-between animate-fadeIn shadow-sm">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="font-bold text-emerald-800 text-sm">{toast.title}</p>
              <p className="text-xs text-emerald-700 mt-0.5 leading-relaxed">{toast.message}</p>
            </div>
          </div>
          <button
            onClick={() => setToast(null)}
            className="text-emerald-500 hover:text-emerald-700 p-1 font-bold text-base"
          >
            ✕
          </button>
        </div>
      )}

      {/* API Loading State */}
      {apiLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            <p className="text-xs text-slate-500 font-medium">Đang tải danh sách thực tập sinh...</p>
          </div>
        </div>
      )}

      {/* API Error State */}
      {apiError && !apiLoading && (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center">
          <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
          <p className="text-sm text-rose-700 font-medium">{apiError}</p>
          <button
            onClick={() => void fetchInternships()}
            className="mt-3 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl transition-colors"
          >
            Thử lại
          </button>
        </div>
      )}

      {!apiLoading && !apiError && (
      <>

      {taskTab === 'assigned' ? <AssignedTasks view={taskView} onDelete={handleDeleteTask} onSubmissions={setSubmissionTask}/> : <>
      {/* 2. Main Action Toolbar (Buttons moved down from banner + Dropdown filters) */}
      <div className="border-b border-slate-100 p-4 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Left filters: Search + Select Dropdowns (No tabs) */}
          <div className="flex flex-wrap items-center gap-2.5 flex-1">
            {/* Search */}
            <div className="relative min-w-[260px] flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Tìm tên sinh viên, MSSV, vị trí, mentor..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all font-medium"
              />
            </div>

            {/* Dropdown filter: Trạng thái tiến độ */}
            <div className="flex items-center space-x-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  const value = e.target.value;
                  if (isTaskStatusFilter(value)) setStatusFilter(value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="ALL">Tất cả trạng thái ({interns.length})</option>
                {Object.entries(taskStatusLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label} ({interns.filter(i => i.taskStatus === value).length})</option>
                ))}
              </select>
            </div>

          </div>

          {/* Right: 2 Action Buttons moved down from banner */}
          <div className="flex items-center space-x-2.5 flex-shrink-0">
            {tableSelectedIds.length > 0 && (
              <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2.5 py-1.5 rounded-xl border border-orange-200">
                Đã chọn: <strong>{tableSelectedIds.length}</strong> sinh viên
              </span>
            )}

            <button
              onClick={() => handleOpenAssignModal()}
              className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center space-x-2 shadow-sm transition-all"
            >
              <Users className="w-4 h-4" />
              <span>
                {tableSelectedIds.length > 0
                  ? `Giao task cho ${tableSelectedIds.length} SV đã chọn`
                  : '+ Giao task hàng loạt cho SV'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Main Student List: Clean, high-density Table View (No circular avatars, easily manages 200+ students) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={isAllCurrentPageSelected}
                    onChange={handleToggleSelectAllPage}
                    className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-slate-300 cursor-pointer"
                    title="Chọn tất cả sinh viên trang này"
                  />
                </th>
                <th className="py-3 px-3 w-12 text-center">STT</th>
                <th className="py-3 px-4 min-w-[180px]">Sinh viên</th>
                <th className="py-3 px-4 min-w-[160px]">Vị trí OJT & Ngành</th>
                <th className="py-3 px-4 min-w-[150px]">Mentor phụ trách</th>
                <th className="py-3 px-4 w-44">Tiến độ OJT</th>
                <th className="py-3 px-4 w-28 text-center">Nhiệm vụ</th>
                <th className="py-3 px-4 w-32 text-center">Trạng thái</th>
                <th className="py-3 px-4 w-36 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedInterns.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                    Không tìm thấy sinh viên nào phù hợp với điều kiện tìm kiếm.
                  </td>
                </tr>
              ) : (
                paginatedInterns.map((intern, index) => {
                  const isChecked = tableSelectedIds.includes(intern.id);
                  const rowNumber = (currentPage - 1) * pageSize + index + 1;

                  return (
                    <tr
                      key={intern.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isChecked ? 'bg-orange-50/40' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelectRow(intern.id)}
                          className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-slate-300 cursor-pointer"
                        />
                      </td>

                      {/* STT */}
                      <td className="py-3 px-3 text-center text-slate-400 font-semibold">
                        {rowNumber}
                      </td>

                      {/* Student info (No circular avatar) */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-xs">
                          {intern.fullName}
                        </div>
                        <div className="text-[11px] font-semibold text-slate-500">
                          MSSV: {intern.studentCode}
                        </div>
                      </td>

                      {/* Position & Major */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800 text-xs">
                          {intern.position}
                        </div>
                        <div className="text-[11px] text-slate-400">{intern.major}</div>
                      </td>

                      {/* Mentor */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800 text-xs">
                          {intern.mentorName}
                        </div>
                        <div className="text-[10px] text-slate-400">{intern.mentorEmail}</div>
                      </td>

                      {/* Progress */}
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-between text-[11px] mb-1 font-semibold">
                          <span className="text-slate-500">Hoàn thành</span>
                          <span
                            className={
                              intern.taskStatus === 'OVERDUE' ? 'text-rose-600 font-bold' : 'text-slate-800 font-bold'
                            }
                          >
                            {intern.progressPercent}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full transition-all ${
                              intern.taskStatus === 'OVERDUE' ? 'bg-rose-500' : 'bg-orange-500'
                            }`}
                            style={{ width: `${intern.progressPercent}%` }}
                          />
                        </div>
                      </td>

                      {/* Tasks count */}
                      <td className="py-3 px-4 text-center">
                        <span className="font-bold text-slate-800 text-xs">
                          {intern.completedTasks} / {intern.totalTasks}
                        </span>
                        <div className="text-[10px] text-slate-400">tasks</div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            intern.taskStatus === 'OVERDUE'
                              ? 'bg-rose-100 text-rose-700 border border-rose-200'
                              : intern.taskStatus === 'DONE'
                                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {taskStatusLabels[intern.taskStatus]}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => setViewingId(intern.id)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-[11px] inline-flex items-center space-x-1 transition-colors"
                          title="Xem chi tiết & quản lý nhiệm vụ"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          <span>Tasks</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination & Total Count Footer */}
        <div className="px-4 py-3 bg-slate-50/60 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center space-x-2">
            <span>
              Hiển thị <strong>{filteredInterns.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}</strong> -{' '}
              <strong>{Math.min(currentPage * pageSize, filteredInterns.length)}</strong> trên tổng số{' '}
              <strong>{filteredInterns.length}</strong> sinh viên
            </span>
            <span className="text-slate-300">|</span>
            <div className="flex items-center space-x-1">
              <span>Hiển thị mỗi trang:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-0.5 bg-white border border-slate-200 rounded-md text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 self-end sm:self-auto">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-semibold">
              Trang {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. MODAL: GIAO NHIỆM VỤ HÀNG LOẠT (BULK TASK MODAL) */}
      {/* (No priority, No circular avatars, Clean List format) */}
      </>}
      {showAddTaskModal && createPortal(
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div role="dialog" aria-modal="true" aria-labelledby="bulk-task-modal-title" className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[calc(100vh-2rem)]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-orange-50/50 via-white to-amber-50/40">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-xs">
                  <CheckSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="bulk-task-modal-title" className="font-extrabold text-slate-900 text-base">
                    Giao Nhiệm vụ Thực tập OJT
                  </h3>
                  <p className="text-xs text-slate-500">
                    Điền thông tin task, đặt hạn giao và tích chọn sinh viên nhận nhiệm vụ
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddTaskModal(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateTask} className="flex min-h-0 flex-1 flex-col">
             <div className="min-h-0 flex-1 overflow-y-auto p-6 space-y-5">
              {taskSubmitError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700">
                  {taskSubmitError}
                </div>
              )}
              {/* PHẦN 1: THÔNG TIN NHIỆM VỤ & HẠN GIAO (BỎ MỨC ĐỘ ƯU TIÊN THEO YÊU CẦU) */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 pb-1 border-b border-slate-100">
                  <Briefcase className="w-4 h-4 text-orange-600" />
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                    1. Thông tin Nhiệm vụ & Hạn giao
                  </h4>
                </div>

                {/* Tiêu đề */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tiêu đề nhiệm vụ / Task <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Xây dựng Module Xử lý Thanh toán VNPAY / Viết Unit Test Auth Context"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all placeholder:text-slate-400"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  />
                </div>

                {/* Mô tả */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mô tả chi tiết yêu cầu công việc
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Mô tả các yêu cầu kỹ thuật, tài liệu tham khảo, tiêu chuẩn nghiệm thu và kết quả đầu ra..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all placeholder:text-slate-400"
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  />
                </div>

                {/* Hạn hoàn thành & Người giao */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Hạn hoàn thành */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Hạn nộp (giờ Việt Nam) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      required
                      min={vietnamTaskMinute(new Date(Date.now()+60000))}
                      max={taskDeadlineRange.valid ? taskDeadlineRange.maxDate+'T23:59' : undefined}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all"
                      value={newTask.deadline}
                      onChange={(e) => {
                        setNewTask({ ...newTask, deadline: e.target.value });
                        setTaskSubmitError(null);
                      }}
                    />
                    {/* Quick shortcuts */}
                    <div className="flex items-center space-x-1.5 mt-2">
                      <span className="text-[10px] text-slate-400">Chọn nhanh:</span>
                      <button
                        type="button"
                        disabled={!taskDeadlineRange.valid}
                        onClick={() => setQuickDeadline(3)}
                        className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-orange-100 hover:text-orange-700 disabled:opacity-40 disabled:cursor-not-allowed text-[10px] font-medium text-slate-600 transition-colors"
                      >
                        +3 ngày
                      </button>
                      <button
                        type="button"
                        disabled={!taskDeadlineRange.valid}
                        onClick={() => setQuickDeadline(7)}
                        className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-orange-100 hover:text-orange-700 disabled:opacity-40 disabled:cursor-not-allowed text-[10px] font-medium text-slate-600 transition-colors"
                      >
                        +1 tuần
                      </button>
                      <button
                        type="button"
                        disabled={!taskDeadlineRange.valid}
                        onClick={() => setQuickDeadline(14)}
                        className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-orange-100 hover:text-orange-700 disabled:opacity-40 disabled:cursor-not-allowed text-[10px] font-medium text-slate-600 transition-colors"
                      >
                        +2 tuần
                      </button>
                    </div>
                    {modalSelectedInternIds.length > 0 && (
                      <p className={`mt-1 text-[10px] ${taskDeadlineRange.valid ? 'text-slate-500' : 'text-rose-600'}`}>
                        {taskDeadlineRange.valid
                          ? `Hạn task hợp lệ cho tất cả sinh viên: ${taskDeadlineRange.minDate} đến ${taskDeadlineRange.maxDate}.`
                          : 'Các sinh viên đã chọn không có khoảng thời gian thực tập hợp lệ chung để giao task.'}
                      </p>
                    )}
                    {taskDeadlineRange.valid && newTask.deadline && taskDeadlineInvalid && (
                      <p className="mt-1 text-[10px] text-rose-600">
                        Chọn giờ nộp sau thời điểm hiện tại và không vượt ngày kết thúc thực tập.
                      </p>
                    )}
                  </div>

                  {/* Người giao nhiệm vụ */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Mentor / Người giao nhiệm vụ
                    </label>
                    <input
                      type="text"
                      value={newTask.assignedBy}
                      onChange={(e) => setNewTask({ ...newTask, assignedBy: e.target.value })}
                      placeholder="Nguyễn Anh Tuấn (Tech Lead)"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </div>

              {/* PHẦN 2: DANH SÁCH SINH VIÊN BẤM CHECKBOX (DẠNG LIST, KHÔNG CÓ AVATAR TRÒN) */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-orange-600" />
                    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                      2. Danh sách sinh viên nhận nhiệm vụ
                    </h4>
                    <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs font-bold">
                      Đã chọn: {modalSelectedInternIds.length} / {interns.length}
                    </span>
                  </div>

                  {/* Action: Select all / Deselect all */}
                  <button
                    type="button"
                    onClick={handleToggleSelectAllModal}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors flex items-center space-x-1"
                  >
                    {allFilteredModalSelected ? (
                      <>
                        <Square className="w-3.5 h-3.5 text-slate-500" />
                        <span>Bỏ chọn tất cả</span>
                      </>
                    ) : (
                      <>
                        <CheckSquare className="w-3.5 h-3.5 text-orange-600" />
                        <span>Chọn tất cả ({filteredModalInterns.length})</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-[11px] text-sky-800">
                  Sinh viên xuất hiện ở đây khi doanh nghiệp xác nhận tiếp nhận. Chọn một hoặc nhiều thực tập sinh để giao nhiệm vụ.
                </p>

                {/* Search & dropdown filter (No tabs) */}
                <div className="flex items-center space-x-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Lọc sinh viên theo tên, MSSV, vị trí..."
                      value={modalSearchTerm}
                      onChange={(e) => setModalSearchTerm(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all font-medium"
                    />
                  </div>
                  <select
                    value={modalStatusFilter}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (isInternStatusFilter(value)) setModalStatusFilter(value);
                    }}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="ALL">Tất cả trạng thái</option>
                    <option value="ONGOING">Tiến độ tốt</option>
                    <option value="RISK">Cần hỗ trợ / Chậm</option>
                  </select>
                </div>

                {/* Compact List of students (No circular avatar, high density) */}
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 border border-slate-200 rounded-2xl p-2 bg-slate-50/50">
                  {filteredModalInterns.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-xs">
                      Không tìm thấy sinh viên nào khớp với bộ lọc.
                    </div>
                  ) : (
                    filteredModalInterns.map((intern, idx) => {
                      const isChecked = modalSelectedInternIds.includes(intern.id);
                      return (
                        <div
                          key={intern.id}
                          onClick={() => handleToggleModalSelectIntern(intern.id)}
                          className={`px-3 py-2 rounded-xl border cursor-pointer transition-all flex items-center justify-between text-xs ${
                            isChecked
                              ? 'bg-orange-50/90 border-orange-400 ring-1 ring-orange-400/50 shadow-xs'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            {/* Checkbox */}
                            <div className="flex-shrink-0">
                              {isChecked ? (
                                <div className="w-4 h-4 rounded bg-orange-500 text-white flex items-center justify-center">
                                  <Check className="w-3 h-3 stroke-[3]" />
                                </div>
                              ) : (
                                <div className="w-4 h-4 rounded border-2 border-slate-300 bg-white" />
                              )}
                            </div>

                            {/* STT */}
                            <span className="text-[11px] font-bold text-slate-400 w-5">
                              #{idx + 1}
                            </span>

                            {/* Details (No circular avatar) */}
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-bold text-slate-900">{intern.fullName}</span>
                                <span className="text-[11px] font-semibold text-slate-500">
                                  ({intern.studentCode})
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {intern.position} • Mentor: {intern.mentorName.split(' ')[0]}
                              </div>
                            </div>
                          </div>

                          {/* Stats */}
                          <div className="flex items-center space-x-2 text-right">
                            <span className="text-[11px] text-slate-500">
                              {intern.completedTasks}/{intern.totalTasks} tasks
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                intern.status === 'RISK'
                                  ? 'bg-rose-100 text-rose-700'
                                  : 'bg-emerald-100 text-emerald-700'
                              }`}
                            >
                              {intern.progressPercent}%
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {modalSelectedInternIds.length === 0 && (
                  <p className="text-rose-600 text-xs font-medium flex items-center space-x-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Vui lòng tích chọn ít nhất 1 sinh viên để giao nhiệm vụ.</span>
                  </p>
                )}
              </div>

             </div>
              {/* Modal Footer */}
              <div className="shrink-0 px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs text-slate-500 font-medium">
                  {modalSelectedInternIds.length > 0 ? (
                    <span className="text-slate-700">
                      Sẽ giao nhiệm vụ tới{' '}
                      <strong className="text-orange-600 font-bold">
                        {modalSelectedInternIds.length} sinh viên
                      </strong>{' '}
                      được chọn.
                    </span>
                  ) : (
                    <span className="text-slate-400">Chưa chọn sinh viên nào</span>
                  )}
                </div>

                <div className="flex items-center space-x-2.5">
                  <button
                    type="button"
                    onClick={() => setShowAddTaskModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={
                      taskSubmitting ||
                      modalSelectedInternIds.length === 0 ||
                      !newTask.title.trim() ||
                      !newTask.deadline ||
                      taskDeadlineInvalid
                    }
                    className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all"
                  >
                    {taskSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Đang giao task...</span>
                      </>
                    ) : (
                      <>
                        <CheckSquare className="w-4 h-4" />
                        <span>Xác nhận giao Task ({modalSelectedInternIds.length} SV)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* 5. MODAL: XEM CHI TIẾT TIẾN ĐỘ & QUẢN LÝ NHIỆM VỤ CỦA SINH VIÊN */}
      {viewingIntern && createPortal(
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div role="dialog" aria-modal="true" aria-labelledby="intern-progress-title" className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[calc(100dvh-2rem)]">
            {/* Header */}
            <div className="shrink-0 px-4 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-2 bg-gradient-to-r from-slate-50 via-white to-orange-50/30">
              <div className="min-w-0 break-words">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 id="intern-progress-title" className="font-extrabold text-slate-900 text-base">
                    {viewingIntern.fullName}
                  </h3>
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-bold">
                    MSSV: {viewingIntern.studentCode}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      viewingIntern.status === 'RISK'
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {viewingIntern.status === 'RISK' ? 'Chậm tiến độ' : 'Đúng tiến độ'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {viewingIntern.position} • Chuyên ngành: {viewingIntern.major} • Mentor:{' '}
                  <strong>{viewingIntern.mentorName}</strong>
                </p>
              </div>

              <button
                onClick={() => setViewingId(null)}
                aria-label="Đóng chi tiết sinh viên"
                className="shrink-0 w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-5">
              {/* Stats Bar */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-center">
                  <span className="text-[11px] text-slate-400 font-semibold block uppercase">
                    Tiến độ hoàn thành
                  </span>
                  <span className="text-lg font-extrabold text-slate-900 mt-0.5 block">
                    {viewingIntern.progressPercent}%
                  </span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-center">
                  <span className="text-[11px] text-slate-400 font-semibold block uppercase">
                    Nhiệm vụ xong
                  </span>
                  <span className="text-lg font-extrabold text-emerald-600 mt-0.5 block">
                    {viewingIntern.completedTasks} / {viewingIntern.totalTasks}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-center">
                  <span className="text-[11px] text-slate-400 font-semibold block uppercase">
                    Điểm danh làm việc
                  </span>
                  <span className="text-lg font-extrabold text-blue-600 mt-0.5 block">
                    {viewingIntern.attendanceDays} ngày
                  </span>
                </div>
              </div>

              {/* Tasks List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center space-x-2">
                    <ListTodo className="w-4 h-4 text-orange-600" />
                    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                      Danh sách nhiệm vụ ({viewedInternTasks.length})
                    </h4>
                  </div>

                  {/* Dropdown filter for tasks */}
                  <select
                    value={taskStatusFilter}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (isTaskStatusFilter(value)) setTaskStatusFilter(value);
                    }}
                    className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none"
                  >
                    <option value="ALL">Tất cả nhiệm vụ</option>
                    <option value="TODO">Chưa làm</option>
                    <option value="OVERDUE">Quá hạn</option>
                    <option value="DONE">Đã xong</option>
                  </select>
                </div>

                {viewedInternTasks.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400">
                    Chưa có nhiệm vụ nào trong danh mục này.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {viewedInternTasks.map((task) => (
                      <div
                        key={task.id}
                        className="p-3.5 rounded-xl border border-slate-200/90 bg-white hover:border-slate-300 transition-all shadow-xs space-y-2 text-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-slate-900 text-xs">
                                {task.title}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  task.status === 'DONE'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : task.status === 'OVERDUE'
                                    ? 'bg-rose-100 text-rose-700'
                                    : 'bg-amber-100 text-amber-700'
                                }`}
                              >
                                {taskStatusLabels[task.status]}
                              </span>
                            </div>
                            <p className="text-slate-600 mt-1 leading-relaxed text-[11px]">
                              {task.description || 'Không có mô tả chi tiết.'}
                            </p>
                          </div>

                          {/* Quick Actions */}
                          <div className="flex items-center space-x-1.5 flex-shrink-0">
                            <button type="button" onClick={() => setSubmissionTask(task)} title="Xem chi tiết bài làm và file đính kèm" aria-label={`Xem bài nộp nhiệm vụ ${task.title}`} className="inline-flex items-center gap-1 rounded-lg p-1 text-orange-600 hover:bg-orange-50"><Eye className="w-3.5 h-3.5" /><span>Xem bài làm</span></button>
                            <button disabled={!task.canDelete}
                              onClick={() => void handleDeleteTask(task)}
                              className="p-1 rounded-lg text-slate-400 enabled:hover:text-rose-600 disabled:opacity-30"
                              title={task.canDelete ? "Xóa nhiệm vụ" : "Đã có hoạt động, không thể xóa"}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                          <div className="flex items-center space-x-3">
                            <span>
                              Hạn chót: <strong className="text-slate-700">{displayTaskTime(task.deadline)}</strong>
                            </span>
                            <span>
                              Giao bởi: <strong className="text-slate-700">{task.assignedBy}</strong>
                            </span>
                          </div>
                          {task.createdAt && <span>Ngày giao: {displayTaskTime(task.createdAt)}</span>}
                        </div>
                        <EnterpriseTaskSubmissionDetails taskId={Number(task.id)} initiallyOpen={task.id === viewedInternTasks.find(item => item.status === 'DONE')?.id} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="shrink-0 px-6 py-3 border-t border-slate-100 flex items-center justify-end bg-slate-50/50">
              <button
                onClick={() => setViewingId(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
      </>
      )}
      </section>
      {submissionTask && <TaskSubmissionsDialog key={submissionTask.id} taskId={Number(submissionTask.id)}
        name={`${submissionTask.title} · ${submissionTask.internName}`}
        load={(page, signal) => getEnterpriseTaskSubmissions(Number(submissionTask.id), page, signal)}
        onClose={() => setSubmissionTask(null)} />}
    </div>
  );
};

export default EnterpriseInterns;
