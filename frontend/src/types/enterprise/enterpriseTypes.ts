export interface EnterpriseIntern {
  id: string;
  studentCode: string;
  fullName: string;
  major: string;
  position: string;
  mentorName: string;
  mentorEmail: string;
  startDate: string;
  progressPercent: number;
  completedTasks: number;
  totalTasks: number;
  attendanceDays: number;
  status: 'ONGOING' | 'COMPLETED' | 'RISK';
  assignmentStatus?: string;
  assignmentStartDate?: string | null;
  assignmentEndDate?: string | null;
}

export interface InternTask {
  id: string;
  ojtSemesterId?: number;
  ojtSemesterName?: string;
  ojtPeriodStatus?: 'ACTIVE' | 'CLOSED';
  internId: string;
  internName: string;
  internStudentCode?: string;
  positionTitle?: string;
  title: string;
  description: string;
  deadline: string;
  status: 'TODO' | 'OVERDUE' | 'DONE';
  canDelete: boolean;
  assignedBy: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  createdAt?: string;
}

export interface EnterpriseProfileSummary {
  scope: string;
  publishedPosts: number;
  pendingPosts: number;
  pendingCandidates: number;
  /** Unique accepted interns, including those without assignments; ended/graded internships are excluded. */
  activeInterns: number;
  /** Same count as activeInterns; acceptance counts immediately without requiring an assignment. */
  acceptedInterns: number;
  /** Unique students with a submitted enterprise evaluation and an overall score. */
  completedInterns: number;
  pendingEvaluations: number;
}

export interface EnterpriseProfileData {
  /** Internal database key for API requests and relations; not a display identifier. */
  id: number;
  /** Unique enterprise identifier displayed in profiles and company lists. */
  code: string;
  name: string;
  address: string | null;
  industry: string;
  contactPersonName: string;
  contactPhone: string | null;
  contactEmail: string;
  status: string;
  createdAt: string;
  summary: EnterpriseProfileSummary;
  representative?: {
    id: number;
    userId: number;
    username: string;
    fullName: string;
    email: string;
    phone: string | null;
    positionTitle: string | null;
  };
}

export interface EnterpriseProfileResponse {
  success: boolean;
  data: EnterpriseProfileData;
  message?: string;
}
