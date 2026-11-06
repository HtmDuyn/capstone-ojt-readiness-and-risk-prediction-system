import type { EligibilityStatus } from './eligibility.types';

export type Attempt = { courseId: number; status: string };
export type Requirement = { completed: boolean; credits: number | null; choices: number[]; kind?: string };
export type Profile = {
  academicProgress?: { credits?: { earned: number; completeConfiguration?: boolean }; requirements?: Requirement[] };
  courseResults?: { items: Attempt[]; page: number; limit: number; total: number };
};
export type LocalOjtResult = {
  studentId: number; status: EligibilityStatus; earnedCredits: number | null;
  unpassedCourseCount: number; reasons: string[]; academicIssues: string[]; checkedAt: string;
  savedAt?: string; isStale?: boolean;
};

