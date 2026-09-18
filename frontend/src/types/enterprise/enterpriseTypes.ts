export type CandidateStatus = 'PENDING' | 'INTERVIEWING' | 'ACCEPTED' | 'REJECTED';

export interface OjtJobPosting {
  id: string;
  title: string;
  department: string;
  slotsTotal: number;
  slotsFilled: number;
  techStack: string[];
  location: string;
  salaryAllowance: string;
  status: 'OPEN' | 'CLOSED';
  createdDate: string;
}

export interface EnterpriseCandidate {
  id: string;
  studentCode: string;
  fullName: string;
  major: string;
  gpa: number;
  aiMatchScore: number;
  appliedRole: string;
  appliedDate: string;
  cvUrl: string;
  status: CandidateStatus;
  notes?: string;
}

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
}

export interface InternEvaluation {
  id: string;
  internId: string;
  studentCode: string;
  fullName: string;
  position: string;
  technicalScore: number; // 40%
  attitudeScore: number;  // 30%
  disciplineScore: number;// 20%
  softSkillsScore: number; // 10%
  finalGrade: number;
  feedback: string;
  evaluatedDate?: string;
  status: 'DRAFT' | 'SUBMITTED';
}
