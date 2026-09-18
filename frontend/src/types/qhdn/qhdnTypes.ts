export type SemesterOption = 'Summer 2026' | 'Spring 2026' | 'Fall 2025' | 'Summer 2025';

export interface EnterprisePartner {
  id: string;
  name: string;
  code: string;
  logoUrl?: string;
  industry: string;
  tier: 'Tier-1 Gold' | 'Tier-2 Silver' | 'Tier-3 Standard';
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  mouStatus: 'Active' | 'Pending Renewal' | 'Draft';
  mouSignedDate: string;
  mouExpiryDate: string;
  totalQuota: number;
  acceptedCount: number;
  availableQuota: number;
}

export interface InternshipPosition {
  id: string;
  enterpriseId: string;
  enterpriseName: string;
  title: string;
  department: string;
  location: string;
  workType: 'Onsite' | 'Hybrid' | 'Remote';
  stipend: string;
  totalSlots: number;
  filledSlots: number;
  requiredSkills: string[];
  description: string;
  requirements: string;
  status: 'Open' | 'Closed' | 'Draft';
}

export interface EligibleStudent {
  id: string;
  studentCode: string;
  fullName: string;
  avatarUrl?: string;
  major: string;
  gpa: number;
  completedCredits: number;
  englishLevel: string;
  readinessScore: number; // 0 - 100
  topSkills: string[];
  ojtEligibilityStatus: 'Qualified' | 'Pending Review';
  assignedEnterpriseId?: string;
  assignedEnterpriseName?: string;
  assignedPositionId?: string;
  assignedPositionTitle?: string;
  coordinationStatus: 'Unassigned' | 'Pending Response' | 'Accepted' | 'Rejected' | 'Interviewing';
  rejectionReason?: string;
  assignedDate?: string;
}

export interface EnterpriseEvaluation {
  id: string;
  studentCode: string;
  studentName: string;
  major: string;
  enterpriseName: string;
  positionTitle: string;
  evaluatorName: string;
  evaluatorRole: string;
  evaluationDate: string;
  technicalScore: number; // Max 10
  softSkillScore: number; // Max 10
  attitudeScore: number; // Max 10
  overallScore: number; // Max 10
  grade: 'Excellent' | 'Good' | 'Satisfactory' | 'Unsatisfactory';
  recommendForHire: boolean;
  comments: string;
}

export interface SemesterStats {
  semester: SemesterOption;
  totalEligibleStudents: number;
  placedStudents: number;
  pendingStudents: number;
  rejectedStudents: number;
  reassignedStudents: number;
  acceptanceRate: number; // percentage
  enterpriseResponseRate: number; // percentage
  totalPartnerEnterprises: number;
  totalQuotaAvailable: number;
}
