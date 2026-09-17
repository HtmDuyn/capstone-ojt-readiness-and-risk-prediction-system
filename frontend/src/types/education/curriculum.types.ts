export interface CurriculumSubject {
  id: string;
  code: string;
  name: string;
  semester: number;
  credits: number;
  prerequisite: string;
}

export interface Curriculum {
  code: string;
  name: string;
  totalSubjects: number;
  totalCredits: number;
  subjects: CurriculumSubject[];
}

export interface CurriculumSubjectForm {
  code: string;
  name: string;
  semester: number;
  credits: number;
  prerequisite: string;
}