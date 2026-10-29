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
  internId: string;
  internName: string;
  title: string;
  description: string;
  deadline: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  assignedBy: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  createdAt?: string;
}

export interface EnterpriseProfileSummary {
  scope: string;
  publishedPosts: number;
  pendingPosts: number;
  pendingCandidates: number;
  activeInterns: number;
  pendingEvaluations: number;
}

export interface EnterpriseProfileData {
  id: number;
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
