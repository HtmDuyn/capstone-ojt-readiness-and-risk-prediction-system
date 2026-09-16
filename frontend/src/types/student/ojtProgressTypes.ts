export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  assignedBy: string;
  tags?: string[];
  confirmedByMentor?: boolean;
  details?: string;
  createdAt?: string;
}

export type WeeklyReportStatus = 'open' | 'submitted' | 'late' | 'locked';

export interface WeeklyReportItem {
  id: string;
  weekNumber: number;
  weekLabel: string;
  dateRange: string;
  status: WeeklyReportStatus;
  submittedAt?: string;
  taskTitle?: string;
  summary?: string;
  achievements?: string;
  challenges?: string;
  fileUrl?: string;
  fileName?: string;
  mentorFeedback?: string;
}

export interface OJTProgressOverview {
  assignedTasksCount: number;
  completedTasksCount: number;
  remainingTasksCount: number;
  completionRate: number;
  recentWeeklyIncrease: number;
  urgentTaskCount: number;
  monthLabel: string;
}
