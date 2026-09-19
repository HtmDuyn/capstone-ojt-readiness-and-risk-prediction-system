export interface StudentProfile {
  id: string;
  studentCode: string;
  fullName: string;
  email: string;
  avatar: string;
  semester: string;
  major: string;
  campus: string;
  gpa: number;
  gpaChange: number;
  earnedCredits: number;
  totalCredits: number;
  missingCredits: number;
  estimatedSemestersRemaining: number;
  ojtStatus: 'qualified' | 'not_qualified' | 'pending';
  ojtVerifiedBy: string;
}

export interface SemesterProgress {
  id: string;
  semesterName: string;
  credits: number;
  gpa: number;
  isCurrent?: boolean;
  isForecast?: boolean;
}

export interface RoadmapStep {
  id: number;
  title: string;
  status: 'completed' | 'current' | 'upcoming';
  description?: string;
  iconType: 'check' | 'register' | 'briefcase' | 'graduation';
}

export interface AIRiskScoreData {
  score: number;
  maxScore: number;
  level: 'low' | 'medium' | 'high';
  levelLabel: string;
  description: string;
  factors: {
    label: string;
    value: string;
    impact: 'positive' | 'neutral' | 'negative';
  }[];
}

export interface AIRecommendation {
  id: string;
  title: string;
  description: string;
  actionText?: string;
  category: string;
}

export interface DeadlineItem {
  id: string;
  month: string;
  day: string;
  badgeColor: 'orange' | 'blue' | 'slate';
  title: string;
  subtext: string;
  tag?: string;
}

export interface RecentActivity {
  id: string;
  dotColor: 'green' | 'blue' | 'orange' | 'purple';
  title: string;
  highlightText?: string;
  timeAgo: string;
}
