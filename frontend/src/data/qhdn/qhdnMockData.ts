import type {
  EnterprisePartner,
  InternshipPosition,
  EligibleStudent,
  EnterpriseEvaluation,
  SemesterStats,
  SemesterOption,
} from '@/types/qhdn/qhdnTypes';

export const SEMESTER_OPTIONS: SemesterOption[] = [
  'Summer 2026',
  'Spring 2026',
  'Fall 2025',
  'Summer 2025',
];

export const MOCK_SEMESTER_STATS: Record<SemesterOption, SemesterStats> = {
  'Summer 2026': {
    semester: 'Summer 2026',
    totalEligibleStudents: 0,
    placedStudents: 0,
    pendingStudents: 0,
    rejectedStudents: 0,
    reassignedStudents: 0,
    acceptanceRate: 0,
    enterpriseResponseRate: 0,
    totalPartnerEnterprises: 0,
    totalQuotaAvailable: 0,
  },
  'Spring 2026': {
    semester: 'Spring 2026',
    totalEligibleStudents: 0,
    placedStudents: 0,
    pendingStudents: 0,
    rejectedStudents: 0,
    reassignedStudents: 0,
    acceptanceRate: 0,
    enterpriseResponseRate: 0,
    totalPartnerEnterprises: 0,
    totalQuotaAvailable: 0,
  },
  'Fall 2025': {
    semester: 'Fall 2025',
    totalEligibleStudents: 0,
    placedStudents: 0,
    pendingStudents: 0,
    rejectedStudents: 0,
    reassignedStudents: 0,
    acceptanceRate: 0,
    enterpriseResponseRate: 0,
    totalPartnerEnterprises: 0,
    totalQuotaAvailable: 0,
  },
  'Summer 2025': {
    semester: 'Summer 2025',
    totalEligibleStudents: 0,
    placedStudents: 0,
    pendingStudents: 0,
    rejectedStudents: 0,
    reassignedStudents: 0,
    acceptanceRate: 0,
    enterpriseResponseRate: 0,
    totalPartnerEnterprises: 0,
    totalQuotaAvailable: 0,
  },
};

export const MOCK_ENTERPRISE_PARTNERS: EnterprisePartner[] = [];
export const MOCK_INTERNSHIP_POSITIONS: InternshipPosition[] = [];
export const MOCK_ELIGIBLE_STUDENTS: EligibleStudent[] = [];
export const MOCK_ENTERPRISE_EVALUATIONS: EnterpriseEvaluation[] = [];
