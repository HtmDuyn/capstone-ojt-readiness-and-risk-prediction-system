export type OjtRuleSetStatus = "DRAFT" | "PUBLISHED" | string;

export type OjtDebtBasis = "FAILED_ATTEMPTS" | string;

export interface OjtRuleSet {
  id: number;

  programId: number;

  ojtSemesterId: number | null;

  version: number;

  name: string;

  minCredits: number;

  maxUnpassedCourses: number;

  debtBasis: OjtDebtBasis;

  status: OjtRuleSetStatus;

  createdBy: number | null;

  createdAt: string;

  publishedBy: number | null;

  publishedAt: string | null;

  active?: boolean;
}

export interface CreateOjtRuleSetPayload {
  programId: number;

  ojtSemesterId: number | null;

  version: number;

  name: string;

  minCredits: number;

  maxUnpassedCourses: number;

  debtBasis: OjtDebtBasis;
}

export interface OjtRuleSetMutationResponse {
  success: boolean;

  data: OjtRuleSet;
}

export interface SearchOjtRuleSetsPayload {
  programId?: number;

  ojtSemesterId?: number;

  status?: string;

  page: number;

  limit: number;
}

export interface SearchOjtRuleSetsResponse {
  success: boolean;

  data: {
    items: OjtRuleSet[];

    total: number;

    page: number;

    limit: number;
  };
}

export interface UpdateOjtRuleSetPayload {
  programId: number;

  ojtSemesterId: number | null;

  version: number;

  name: string;

  minCredits: number;

  maxUnpassedCourses: number;

  debtBasis: OjtDebtBasis;

  ruleSetId: number;
}

export interface PublishOjtRuleSetPayload {
  ruleSetId: number;
}

export interface PublishOjtRuleSetResponse {
  success: boolean;

  data?: OjtRuleSet | unknown;
}

export type EligibilityStatus = 'ELIGIBLE' | 'NOT_ELIGIBLE' | 'REVIEW_REQUIRED';

export interface EligibilityEvaluation {
  studentId: number;
  ojtSemesterId: number;
  status: EligibilityStatus;
  rule: OjtRuleSet | null;
  earnedCredits: number;
  missingCredits: number | null;
  unpassedCourseCount: number;
  unpassedCourses: { courseId: number; courseCode: string }[];
  excessUnpassedCourses: number | null;
  reasons: string[];
  academicIssues: string[];
}

export interface EligibilityCheck extends EligibilityEvaluation {
  studentCode?: string;
  fullName?: string;
  checkId: number;
  checkedAt: string;
  isStale?: boolean;
  confirmedAt?: string | null;
  confirmation?: { confirmedAt: string; reason: string } | null;
}

export interface StudentEligibility {
  current: EligibilityEvaluation;
  latest: EligibilityCheck | null;
  official: EligibilityCheck | null;
}

export interface EligibilityBatch {
  runId: number;
  total: number;
  eligible: number;
  notEligible: number;
  reviewRequired: number;
  items: EligibilityCheck[];
  replayed: boolean;
}

export interface AssessmentWindow {
  BlockPeriodID: number;
  OpensAt: string;
  ClosesAt: string;
  Status: 'DRAFT' | 'OPEN' | 'CLOSED';
  ResultsFinalizedAt: string | null;
}

export type EligibilityFilter = 'ALL' | EligibilityStatus;
