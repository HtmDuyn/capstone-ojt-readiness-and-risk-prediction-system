import type { AcademicPeriod, OjtSemester } from './academic.types';
import type { Page } from './api.types';

export interface Cohort { id: number; cohortCode: string; name: string }

export interface ReportScope { academicPeriodId?: number; ojtSemesterId?: number; cohortId?: number }

export interface CourseDemand {
  ojtSemesterId: number; academicPeriodId: number; courseId: number; courseCode: string; courseName: string; periodCode: string;
  studentCount: number; retakeCount: number; inProgressCount: number;
}

export interface DemandReport extends Page<CourseDemand> {
  studentsWithDataIssues: { studentId: number }[];
  unresolvedAlternatives: { studentId: number }[];
  computedAt: string;
}

export type ReportPeriod = AcademicPeriod & { ojt?: OjtSemester | null };

export interface RetakeClassProposal {
  courseId:number;courseCode:string;courseName:string;failedStudentCount:number;
  status:'PREPARE_CLASSES'|'MONITORING';proposedClassCount:number;fullCapacityClassCount:number;
  additionalClassStudentCount:number;studentsInProposedClasses:number;waitingStudentCount:number;
  studentsNeededForNextProposal:number;isEarlyPreparation:boolean;
}
export interface RetakeClassReport extends Page<RetakeClassProposal> {
  block:{id:number|null;source:'CALCULATED'|'CONFIGURED';periodCode:string;name:string;startDate:string;endDate:string;status:string};
  calendarPreview?:{source:string;mainSemester:{startDate:string;endDate:string};break:{startDate:string;endDate:string};storedSemesterEndDate:string;requiresCalendarReview:boolean}|null;
  policy:{minimumToPrepare:number;preparationRangeEnd:number;classCapacity:number};
  summary:{courseCount:number;proposedClassCount:number;waitingStudentCourseCount:number};
  excludedStudentCount:number;unresolvedAlternativeStudentCount:number;limitations:string[];computedAt:string;
}
