import type { OjtAppliedCondition } from './eligibility.types';

export type OjtFinalResult = {
  id: number;
  studentCode: string;
  fullName: string;
  enterpriseName: string;
  semesterCode: string;
  academicPeriodCode?: string | null;
  academicPeriodName?: string | null;
  academicYearCode?: string | null;
  status: string;
  officialScore: number | null;
  completionScore: number | null;
  attitudeScore: number | null;
  skillScore: number | null;
  comments: string | null;
  outcome: string | null;
  confirmedAt: string | null;
};
