import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { PageBanner } from '@/components/common/PageBanner';
import {
  CheckSquare,
  Square,
  Plus,
  Search,
  CheckCircle2,
  Clock,
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
} from 'lucide-react';
import {
  enterpriseService,
  type EnterpriseInternshipItem,
  type EnterpriseInternshipTask,
} from '@/services/enterpriseService';
import { EnterpriseIntern, InternTask } from '@/types/enterprise/enterpriseTypes';
import { Loader2, AlertCircle } from 'lucide-react';
import { useEnterprise } from '@/contexts/EnterpriseContext';

// Adapter: map API data to existing UI's expected format
const mapApiToIntern = (item: EnterpriseInternshipItem): EnterpriseIntern => ({
  id: String(item.id),
  studentCode: item.student?.studentCode || '',
  fullName: item.student?.fullName || '',
  major: item.student?.programName || item.student?.programCode || '',
  position: item.position?.title || '',
  mentorName: item.enterpriseSupervisorName || item.academicSupervisor ? (item.academicSupervisor as any)?.fullName || 'Chưa phân công' : 'Chưa phân công',
  mentorEmail: item.academicSupervisor ? (item.academicSupervisor as any)?.email || '' : '',
  startDate: item.startDate ? new Date(item.startDate).toLocaleDateString('vi-VN') : '',
  progressPercent: item.evaluation ? ((item.evaluation as any)?.overallScore || 0) : 0,
  completedTasks: 0,
  totalTasks: 0,
  attendanceDays: 0,
  assignmentStatus: item.status?.toUpperCase(),
  assignmentStartDate: item.startDate,
  assignmentEndDate: item.endDate,
  status: (['CANCELLED', 'CANCELED', 'FAILED'].includes(item.status?.toUpperCase() || '') ? 'RISK' : item.status?.toUpperCase() === 'COMPLETED' ? 'COMPLETED' : 'ONGOING') as 'ONGOING' | 'COMPLETED' | 'RISK',
});

const mapApiToTask = (item: EnterpriseInternshipTask): InternTask => {
  const status = item.status.toUpperCase();
  if (!['TODO', 'IN_PROGRESS', 'DONE', 'COMPLETED'].includes(status)) {
    throw new Error(`Trạng thái task không được hỗ trợ: ${item.status}`);
  }

  return {
    id: String(item.id),
    internId: String(item.assignmentId),
    internName: item.student?.fullName || item.fullName || 'Sinh viên',
    title: item.name,
    description: item.description || '',
    deadline: item.dueDate?.slice(0, 10) || '',
    status: status === 'COMPLETED' ? 'DONE' : status as InternTask['status'],
    assignedBy: 'Mentor Doanh Nghiệp',
    createdAt: item.assignedDate?.slice(0, 10),
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
  if (typeof error !== 'object' || error === null || !('response' in error)) return null;
  const response = error.response;
  if (typeof response !== 'object' || response === null || !('data' in response)) return null;
  const data = response.data;
  if (typeof data !== 'object' || data === null || !('message' in data)) return null;
  return typeof data.message === 'string' ? data.message : null;
};

export const EnterpriseInterns: React.FC = () => {
  const { loading: profileLoading, companyId } = useEnterprise();
  const [interns, setInterns] = useState<EnterpriseIntern[]>([]);
  const [tasks, setTasks] = useState<InternTask[]>([]);
  const [apiLoading, setApiLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const fetchInternships = useCallback(async () => {
    if (profileLoading) return;
    if (!companyId) {
      setApiLoading(false);
      setApiError('Không tìm thấy doanh nghiệp để tải danh sách task.');
      return;
    }

    setApiLoading(true);
    setApiError(null);
    try {
      const [internshipResponse, firstTaskResponse] = await Promise.all([
        enterpriseService.listInternships(),
        enterpriseService.listInternshipTasks(companyId, { page: 1, limit: 100 }),
      ]);
      if (!internshipResponse?.success || !internshipResponse.data) {
        throw new Error('Không thể tải danh sách thực tập sinh.');
      }
      if (!firstTaskResponse?.success || !firstTaskResponse.data) {
        throw new Error('Không thể tải danh sách task đã giao.');
      }

      const taskItems = [...firstTaskResponse.data.items];
      const totalPages = Math.ceil(firstTaskResponse.data.total / firstTaskResponse.data.limit);
      for (let page = 2; page <= totalPages; page += 1) {
        const taskResponse = await enterpriseService.listInternshipTasks(companyId, { page, limit: 100 });
        if (!taskResponse?.success || !taskResponse.data) {
          throw new Error(`Không thể tải danh sách task ở trang ${page}.`);
        }
        taskItems.push(...taskResponse.data.items);
      }

      const mappedTasks = taskItems.map(mapApiToTask);
      const taskCounts = new Map<string, { total: number; completed: number }>();
      for (const task of mappedTasks) {
        const counts = taskCounts.get(task.internId) || { total: 0, completed: 0 };
        counts.total += 1;
        if (task.status === 'DONE') counts.completed += 1;
        taskCounts.set(task.internId, counts);
      }

      const mappedInterns = internshipResponse.data.items.map(mapApiToIntern);
      setInterns(mappedInterns.map((intern) => {
        const counts = taskCounts.get(intern.id) || { total: 0, completed: 0 };
        return {
          ...intern,
          totalTasks: counts.total,
          completedTasks: counts.completed,
          progressPercent: counts.total ? Math.round((counts.completed / counts.total) * 100) : 0,
        };
      }));
      setTasks(mappedTasks);
    } catch (err: unknown) {
      const message = getApiErrorMessage(err) ||
        (err instanceof Error ? err.message : 'Không thể tải danh sách thực tập sinh');
      setApiError(message);
      console.error('Failed to load internships:', err);
    } finally {
      setApiLoading(false);
    }
  }, [companyId, profileLoading]);

  useEffect(() => {
    fetchInternships();
  }, [fetchInternships]);

  // Selected intern for task detail modal
  const [viewingIntern, setViewingIntern] = useState<EnterpriseIntern | null>(null);

  // Table selection checkboxes (bulk action on main table)
  const [tableSelectedIds, setTableSelectedIds] = useState<string[]>([]);

  // Modal State for task assignment
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [modalSelectedInternIds, setModalSelectedInternIds] = useState<string[]>([]);
  const [modalSearchTerm, setModalSearchTerm] = useState('');
  const [modalStatusFilter, setModalStatusFilter] = useState<'ALL' | 'ONGOING' | 'RISK'>('ALL');
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
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ONGOING' | 'RISK'>('ALL');
  const [positionFilter, setPositionFilter] = useState<string>('ALL');
  const [taskStatusFilter, setTaskStatusFilter] = useState<'ALL' | 'TODO' | 'IN_PROGRESS' | 'DONE'>('ALL');

  // Pagination for main table (optimized for 200+ students)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Toast Notification
  const [toast, setToast] = useState<{
    title: string;
    message: string;
    count: number;
  } | null>(null);

  // Extract unique positions for filter dropdown
  const uniquePositions = useMemo(() => {
    const set = new Set(interns.map((i) => i.position));
    return Array.from(set);
  }, [interns]);

  // Filtered interns list for main table
  const filteredInterns = useMemo(() => {
    return interns.filter((intern) => {
      const matchSearch =
        intern.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        intern.studentCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        intern.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
        intern.mentorName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || intern.status === statusFilter;
      const matchPos = positionFilter === 'ALL' || intern.position === positionFilter;
      return matchSearch && matchStatus && matchPos;
    });
  }, [interns, searchTerm, statusFilter, positionFilter]);

  // Paginated interns
  const totalPages = Math.ceil(filteredInterns.length / pageSize) || 1;
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
    setViewingIntern(null);
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
        : 'Không có sinh viên đang được phân công hoặc thực tập để nhận task.'
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

    const startDates = selectedTaskInterns.map((intern) => intern.assignmentStartDate?.slice(0, 10));
    const endDates = selectedTaskInterns.map((intern) => intern.assignmentEndDate?.slice(0, 10));
    if (startDates.some((date) => !date) || endDates.some((date) => !date)) {
      return { minDate: '', maxDate: '', valid: false };
    }

    const availableStartDates = startDates.filter((date): date is string => date !== undefined);
    const availableEndDates = endDates.filter((date): date is string => date !== undefined);
    const latestStartDate = availableStartDates.reduce((latest, date) => date > latest ? date : latest);
    const earliestEndDate = availableEndDates.reduce((earliest, date) => date < earliest ? date : earliest);
    const today = localDateString(new Date());
    const minDate = today > latestStartDate ? today : latestStartDate;

    return {
      minDate,
      maxDate: earliestEndDate,
      valid: minDate <= earliestEndDate,
    };
  }, [selectedTaskInterns]);

  const taskDeadlineInvalid = modalSelectedInternIds.length > 0 && (
    !taskDeadlineRange.valid ||
    !newTask.deadline ||
    newTask.deadline < taskDeadlineRange.minDate ||
    newTask.deadline > taskDeadlineRange.maxDate
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
      deadline,
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
      setTaskSubmitError('Chỉ có thể giao task cho sinh viên đang được phân công hoặc thực tập.');
      return;
    }

    const today = localDateString(new Date());
    if (newTask.deadline < today) {
      setTaskSubmitError('Hạn hoàn thành không được ở trong quá khứ.');
      return;
    }
    const invalidDeadlineStudents = assignedStudents.filter((student) => {
      const startDate = student.assignmentStartDate?.slice(0, 10);
      const endDate = student.assignmentEndDate?.slice(0, 10);
      return !startDate || !endDate || newTask.deadline < startDate || newTask.deadline > endDate;
    });
    if (invalidDeadlineStudents.length) {
      setTaskSubmitError(
        `Hạn hoàn thành phải nằm trong thời gian thực tập của tất cả sinh viên được chọn. Kiểm tra: ${invalidDeadlineStudents.map((student) => student.fullName).join(', ')}.`
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
        throw new Error('Backend trả về số task không khớp với số sinh viên đã chọn.');
      }
      createdTasks = response.data.tasks.map((task) => {
        const student = assignedStudents.find((item) => Number(item.id) === task.assignmentId);
        if (!student) {
          throw new Error('Backend trả về task không khớp với danh sách thực tập sinh đã chọn.');
        }
        return {
          id: String(task.id),
          internId: student.id,
          internName: student.fullName,
          title: newTask.title.trim(),
          description: newTask.description.trim(),
          deadline: newTask.deadline,
          status: 'TODO',
          assignedBy: newTask.assignedBy || 'Mentor Doanh Nghiệp',
          createdAt: new Date().toISOString().split('T')[0],
        };
      });
      taskRequestRef.current = null;
    } catch (err: unknown) {
      const message = getApiErrorMessage(err) ||
        (err instanceof Error ? err.message : 'Không thể giao task. Vui lòng thử lại.');
      setTaskSubmitError(message);
      console.error('Failed to assign enterprise tasks:', err);
      return;
    } finally {
      setTaskSubmitting(false);
    }

    // Update tasks state
    setTasks((prev) => [...createdTasks, ...prev]);

    // Update totalTasks count for the selected interns
    setInterns((prev) =>
      prev.map((intern) => {
        if (modalSelectedInternIds.includes(intern.id)) {
          const newTotal = intern.totalTasks + 1;
          return {
            ...intern,
            totalTasks: newTotal,
            progressPercent: Math.round((intern.completedTasks / newTotal) * 100),
          };
        }
        return intern;
      })
    );

    // Update viewingIntern if currently viewed
    if (viewingIntern && modalSelectedInternIds.includes(viewingIntern.id)) {
      setViewingIntern((prev) => {
        if (!prev) return null;
        const newTotal = prev.totalTasks + 1;
        return {
          ...prev,
          totalTasks: newTotal,
          progressPercent: Math.round((prev.completedTasks / newTotal) * 100),
        };
      });
    }

    // Show toast
    const studentNames = assignedStudents.map((s) => s.fullName).join(', ');
    setToast({
      title: 'Giao nhiệm vụ thành công!',
      message: `Đã giao nhiệm vụ "${newTask.title.trim()}" cho ${assignedStudents.length} sinh viên: ${studentNames}`,
      count: assignedStudents.length,
    });
    setTimeout(() => setToast(null), 5000);

    // Close and reset
    setShowAddTaskModal(false);
    setNewTask({
      title: '',
      description: '',
      deadline: '',
      assignedBy: 'Nguyễn Anh Tuấn (Tech Lead)',
    });
  };

  // Change task status (TODO -> IN_PROGRESS -> DONE)
  const handleUpdateTaskStatus = (taskId: string, newStatus: 'TODO' | 'IN_PROGRESS' | 'DONE') => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const oldStatus = task.status;
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));

    if (oldStatus !== 'DONE' && newStatus === 'DONE') {
      setInterns((prev) =>
        prev.map((i) => {
          if (i.id === task.internId) {
            const newCompleted = i.completedTasks + 1;
            return {
              ...i,
              completedTasks: newCompleted,
              progressPercent: Math.round((newCompleted / i.totalTasks) * 100),
            };
          }
          return i;
        })
      );
      if (viewingIntern && viewingIntern.id === task.internId) {
        setViewingIntern((prev) =>
          prev
            ? {
                ...prev,
                completedTasks: prev.completedTasks + 1,
                progressPercent: Math.round(((prev.completedTasks + 1) / prev.totalTasks) * 100),
              }
            : null
        );
      }
    } else if (oldStatus === 'DONE' && newStatus !== 'DONE') {
      setInterns((prev) =>
        prev.map((i) => {
          if (i.id === task.internId) {
            const newCompleted = Math.max(0, i.completedTasks - 1);
            return {
              ...i,
              completedTasks: newCompleted,
              progressPercent: Math.round((newCompleted / i.totalTasks) * 100),
            };
          }
          return i;
        })
      );
      if (viewingIntern && viewingIntern.id === task.internId) {
        setViewingIntern((prev) =>
          prev
            ? {
                ...prev,
                completedTasks: Math.max(0, prev.completedTasks - 1),
                progressPercent: Math.round((Math.max(0, prev.completedTasks - 1) / prev.totalTasks) * 100),
              }
            : null
        );
      }
    }
  };

  // Delete task
  const handleDeleteTask = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    if (window.confirm(`Bạn có chắc muốn xóa nhiệm vụ "${task.title}"?`)) {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      setInterns((prev) =>
        prev.map((i) => {
          if (i.id === task.internId) {
            const newTotal = Math.max(1, i.totalTasks - 1);
            const newCompleted =
              task.status === 'DONE' ? Math.max(0, i.completedTasks - 1) : i.completedTasks;
            return {
              ...i,
              totalTasks: newTotal,
              completedTasks: newCompleted,
              progressPercent: Math.round((newCompleted / newTotal) * 100),
            };
          }
          return i;
        })
      );
      if (viewingIntern && viewingIntern.id === task.internId) {
        setViewingIntern((prev) => {
          if (!prev) return null;
          const newTotal = Math.max(1, prev.totalTasks - 1);
          const newCompleted =
            task.status === 'DONE' ? Math.max(0, prev.completedTasks - 1) : prev.completedTasks;
          return {
            ...prev,
            totalTasks: newTotal,
            completedTasks: newCompleted,
            progressPercent: Math.round((newCompleted / newTotal) * 100),
          };
        });
      }
    }
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
        title="Quản lý & Giao Nhiệm vụ Thực tập OJT"
        description="Theo dõi danh sách sinh viên thực tập, phân công công việc tuần, theo dõi tỷ lệ hoàn thành task và điểm danh làm việc."
        badge="Doanh nghiệp tiếp nhận OJT"
      />

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
            onClick={fetchInternships}
            className="mt-3 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl transition-colors"
          >
            Thử lại
          </button>
        </div>
      )}

      {!apiLoading && !apiError && (
      <>

      {/* 2. Main Action Toolbar (Buttons moved down from banner + Dropdown filters) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 space-y-3">
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
                  setStatusFilter(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="ALL">Tất cả trạng thái ({interns.length})</option>
                <option value="ONGOING">Tiến độ tốt ({interns.filter((i) => i.status !== 'RISK').length})</option>
                <option value="RISK">Cần hỗ trợ / Chậm ({interns.filter((i) => i.status === 'RISK').length})</option>
              </select>
            </div>

            {/* Dropdown filter: Vị trí thực tập */}
            <select
              value={positionFilter}
              onChange={(e) => {
                setPositionFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500 max-w-[200px] truncate"
            >
              <option value="ALL">Tất cả vị trí thực tập</option>
              {uniquePositions.map((pos) => (
                <option key={pos} value={pos}>
                  {pos}
                </option>
              ))}
            </select>
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
                  const studentTasks = tasks.filter((t) => t.internId === intern.id);
                  const doneTasks = studentTasks.filter((t) => t.status === 'DONE').length;
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
                              intern.status === 'RISK' ? 'text-rose-600 font-bold' : 'text-slate-800 font-bold'
                            }
                          >
                            {intern.progressPercent}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full transition-all ${
                              intern.status === 'RISK' ? 'bg-rose-500' : 'bg-orange-500'
                            }`}
                            style={{ width: `${intern.progressPercent}%` }}
                          />
                        </div>
                      </td>

                      {/* Tasks count */}
                      <td className="py-3 px-4 text-center">
                        <span className="font-bold text-slate-800 text-xs">
                          {doneTasks} / {studentTasks.length}
                        </span>
                        <div className="text-[10px] text-slate-400">tasks</div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            intern.status === 'RISK'
                              ? 'bg-rose-100 text-rose-700 border border-rose-200'
                              : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {intern.status === 'RISK' ? 'Chậm tiến độ' : 'Bình thường'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center">
                          <button
                            onClick={() => setViewingIntern(intern)}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-[11px] inline-flex items-center space-x-1 transition-colors"
                            title="Xem chi tiết & quản lý nhiệm vụ"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                            <span>Tasks</span>
                          </button>
                        </div>
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
      {showAddTaskModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-8 max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-orange-50/50 via-white to-amber-50/40">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-xs">
                  <CheckSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
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
            <form onSubmit={handleCreateTask} className="flex-1 overflow-y-auto p-6 space-y-5">
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
                      Hạn hoàn thành (Deadline) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      min={taskDeadlineRange.valid ? taskDeadlineRange.minDate : undefined}
                      max={taskDeadlineRange.valid ? taskDeadlineRange.maxDate : undefined}
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
                        Hạn hoàn thành phải nằm trong khoảng ngày thực tập áp dụng cho tất cả sinh viên đã chọn.
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
                  Danh sách này chỉ gồm sinh viên đã có phân công thực tập. Sau khi doanh nghiệp chấp nhận hồ sơ,
                  QHDN/Admin cần tạo phân công thực tập; hồ sơ chưa được phân công sẽ chưa xuất hiện ở đây.
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
                    onChange={(e) => setModalStatusFilter(e.target.value as any)}
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

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
        </div>
      )}

      {/* 5. MODAL: XEM CHI TIẾT TIẾN ĐỘ & QUẢN LÝ NHIỆM VỤ CỦA SINH VIÊN */}
      {viewingIntern && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-8 max-h-[90vh]">
            {/* Header */}
            <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between bg-gradient-to-r from-slate-50 via-white to-orange-50/30">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-extrabold text-slate-900 text-base">
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
                <p className="text-xs text-slate-500 mt-1 leading-relaxed break-words">
                  {viewingIntern.position} • Chuyên ngành: {viewingIntern.major} • Mentor:{' '}
                  <strong>{viewingIntern.mentorName}</strong>
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 self-end sm:self-auto flex-shrink-0">
                <button
                  onClick={() => {
                    handleOpenAssignModal([viewingIntern.id]);
                  }}
                  className="px-3 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Giao task</span>
                </button>
                <button
                  onClick={() => setViewingIntern(null)}
                  aria-label="Đóng chi tiết sinh viên"
                  className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors flex-shrink-0"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Stats Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-2">
                  <div className="flex items-center space-x-2">
                    <ListTodo className="w-4 h-4 text-orange-600" />
                    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                      Danh sách nhiệm vụ ({viewedInternTasks.length})
                    </h4>
                  </div>

                  {/* Dropdown filter for tasks */}
                  <select
                    value={taskStatusFilter}
                    onChange={(e) => setTaskStatusFilter(e.target.value as any)}
                    className="w-full sm:w-auto px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none"
                  >
                    <option value="ALL">Tất cả nhiệm vụ</option>
                    <option value="TODO">Cần làm</option>
                    <option value="IN_PROGRESS">Đang làm</option>
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
                        className="p-3 sm:p-3.5 rounded-xl border border-slate-200/90 bg-white hover:border-slate-300 transition-all shadow-xs space-y-2 text-xs"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-bold text-slate-900 text-xs break-words">
                                {task.title}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  task.status === 'DONE'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : task.status === 'IN_PROGRESS'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-amber-100 text-amber-700'
                                }`}
                              >
                                {task.status === 'DONE'
                                  ? 'Đã xong'
                                  : task.status === 'IN_PROGRESS'
                                  ? 'Đang làm'
                                  : 'Chưa làm'}
                              </span>
                            </div>
                            <p className="text-slate-600 mt-1 leading-relaxed text-[11px]">
                              {task.description || 'Không có mô tả chi tiết.'}
                            </p>
                          </div>

                          {/* Quick Actions */}
                          <div className="flex items-center justify-end gap-1.5 flex-shrink-0">
                            {task.status !== 'DONE' ? (
                              <button
                                onClick={() => handleUpdateTaskStatus(task.id, 'DONE')}
                                className="px-2 py-0.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-semibold flex items-center space-x-1 border border-emerald-200"
                              >
                                <Check className="w-3 h-3" />
                                <span>Xong</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUpdateTaskStatus(task.id, 'IN_PROGRESS')}
                                className="px-2 py-0.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 text-[11px] font-semibold flex items-center space-x-1 border border-amber-200"
                              >
                                <Clock className="w-3 h-3" />
                                <span>Làm lại</span>
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                              title="Xóa nhiệm vụ"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            <span className="whitespace-nowrap">
                              Hạn chót: <strong className="text-slate-700">{task.deadline}</strong>
                            </span>
                            <span className="whitespace-nowrap">
                              Giao bởi: <strong className="text-slate-700">{task.assignedBy}</strong>
                            </span>
                          </div>
                          {task.createdAt && <span className="sm:text-right">Ngày tạo: {task.createdAt}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-end bg-slate-50/50">
              <button
                onClick={() => setViewingIntern(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
};

export default EnterpriseInterns;
