import type { StudentAcademicStatus } from '@/types/education/import.types';

export const STUDENT_STATUS_LABELS: Record<StudentAcademicStatus, string> = {
  ACTIVE: 'Đang học',
  INACTIVE: 'Không hoạt động',
  SUSPENDED: 'Bảo lưu',
  GRADUATED: 'Đã tốt nghiệp',
  DROPPED_OUT: 'Thôi học',
};
