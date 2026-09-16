export interface EvaluationCriterion {
  id: string;
  name: string;
  weight: number; // percentage (e.g. 20)
  score: number; // out of 10
  maxScore: number;
  comment?: string;
}

export interface EvaluationCategory {
  id: string;
  title: string;
  weight: number; // percentage
  score: number;
  criteria: EvaluationCriterion[];
}

export interface SkillRating {
  skillName: string;
  rating: number; // 1 - 10
  category: string;
}

export interface SupervisorFeedback {
  supervisorName: string;
  role: 'enterprise' | 'academic';
  title: string;
  organization: string;
  avatar: string;
  overallRating: number; // e.g. 9.2
  comments: string;
  strengths: string[];
  improvements: string[];
  recommendation: string;
  evaluatedAt: string;
}

export interface OJTEvaluationData {
  studentId: string;
  studentName: string;
  studentCode: string;
  companyName: string;
  position: string;
  internshipPeriod: string;
  academicSemester: string;
  finalScore: number; // out of 10
  maxScore: number;
  gradeLabel: string; // e.g., 'Xuất sắc (Pass with Distinction)'
  status: 'passed' | 'failed' | 'pending';
  passedCredits: number;
  totalCredits: number;
  enterpriseScore: number;
  academicScore: number;
  certificateCode: string;
  issuedDate: string;
  categories: EvaluationCategory[];
  skills: SkillRating[];
  feedbacks: SupervisorFeedback[];
}
