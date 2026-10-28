export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}
export interface Result<T> {
  success: boolean;
  data: T;
}
export interface PageQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  ojtSemesterId?: number;
  companyId?: number;
  registrationId?: number;
}
export interface Registration {
  id: number;
  studentId: number;
  studentCode: string;
  fullName: string;
  status: string;
  ojtSemesterId: number;
  handoffStatus?: string;
  application?: { cv?: { id: number } | null };
}
export interface Application extends Registration {
  registrationId: number;
  positionId: number;
  companyId: number;
  cvFileId?: number | null;
  cv?: { id: number; fileName: string } | null;
  coverLetter?: string;
  company?: { name: string };
  position?: { title: string };
  handedOff?: boolean;
}
export interface RecruitmentPost {
  id: number;
  title: string;
  content?: string;
  status: string;
  windowId?: number;
  academicPeriodId?: number;
  companyId: number;
  deadlineAt?: string;
  positions: {
    id: number;
    title: string;
    capacity: number;
    remainingSlots: number;
  }[];
}
export interface RecruitmentWindow {
  id: number;
  name?: string;
  status?: string;
  academicPeriodId?: number;
  ojtSemesterId?: number;
  startsAt?: string;
  endsAt?: string;
}
export interface AssignmentInput {
  coordinationId: number;
  startDate: string;
  endDate: string;
  reason: string;
  enterpriseSupervisorName?: string;
}
export interface AssignmentUpdate {
  startDate?: string;
  endDate?: string;
  enterpriseSupervisorName?: string;
  status?: "ACTIVE" | "COMPLETED" | "CANCELLED";
  reason: string;
}
export type ReportType = "acceptance" | "internships" | "enterprise-feedback";
