import { expect, test } from 'vitest';
import { assessProgram } from '../../src/modules/eligibility/ojt-policy-feasibility';
const register = require('../../../qa/register-case.cjs');
const tc = register(test, { group: 'OJT Eligibility', role: 'ACADEMIC', source: 'backend/src/modules/eligibility/ojt-policy-feasibility.ts' });
const program = {
  id: 1, code: 'SE26', name: 'SE', status: 'PUBLISHED',
  courses: [
    { courseId: 1, courseCode: 'C1', entryKind: 'COURSE', credits: 30, isRequired: true, semester: 1 },
    { courseId: 2, courseCode: 'C2', entryKind: 'COURSE', credits: 40, isRequired: true, semester: 2 },
    { courseId: 3, courseCode: 'C3', entryKind: 'COURSE', credits: 5, isRequired: false, semester: 3 },
    { courseId: 4, courseCode: 'OJT202', entryKind: 'COURSE', credits: 10, isRequired: true, semester: 6 },
  ],
};
for (const [threshold, status] of [[69, 'VALID'], [70, 'WARNING'], [71, 'INVALID']] as const) tc({ id: `FEASIBILITY-${threshold}`, type: 'B', title: `OJT policy threshold feasibility ${threshold}`, input: `Required preOJT credits70; optional5; proposed threshold${threshold}.`, expected: `${status}; minCredits70/maxCredits75; OJT semester6.` }, () => expect(assessProgram(program, threshold)).toMatchObject({ status, minCredits: 70, maxCredits: 75, ojtSemester: 6 }));
tc({ id: 'FEASIBILITY-NO-OJT', type: 'A', title: 'Policy feasibility refuses missing OJT curriculum course', input: 'Published program without OJT202.', expected: 'INSUFFICIENT_DATA; ojtSemester null.' }, () => expect(assessProgram({ ...program, courses: program.courses.slice(0, 3) }, 70)).toMatchObject({ status: 'INSUFFICIENT_DATA', ojtSemester: null }));
tc({ id: 'FEASIBILITY-DRAFT', type: 'A', title: 'Unpublished curriculum cannot validate OJT policy', input: 'Program status DRAFT.', expected: 'INSUFFICIENT_DATA; minCredits null.' }, () => expect(assessProgram({ ...program, status: 'DRAFT' }, 70)).toMatchObject({ status: 'INSUFFICIENT_DATA', minCredits: null }));
tc({ id: 'FEASIBILITY-PREREQUISITE', type: 'A', title: 'Prerequisite scheduled after its target invalidates feasibility', input: 'C1 semester1 requires C2 semester2.', expected: 'INSUFFICIENT_DATA with prerequisite reason.' }, () => expect(assessProgram({ ...program, prerequisites: [{ courseId: 1, prerequisiteCourseIds: [2], minimumPassed: 1 }] }, 70).status).toBe('INSUFFICIENT_DATA'));
