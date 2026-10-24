import type { RequestHandler } from 'express';
import { getCurrentUser } from '../auth/auth.controller';
import { changePassword } from '../auth/auth.service';
import { updateMyProfile } from '../accounts/account.controller';
import { summary, supplementary, curriculum, notifications, readNotification, currentAssignment, publishedResults } from './academic.service';
import { roadmap } from './cv.service';
import { studentWindows } from '../students/registration-options.service';
import { studentProfile } from '../students/student-profile.service';
import { assertStudentAccess, results } from '../students/student.service';
import { eligibility, history } from '../eligibility/eligibility.service';
import { submitChoice, studentComboHistory } from '../combo-registration/selection.service';
import { submit, listRegistrations } from '../ojt-registration/registration.service';
import { semesterStudents } from '../ojt-registration/handoff.service';
import { applyToPosition, listApplications, studentOpportunities } from '../students/job-application.service';
import { listTasks } from '../qhdn/task.service';
import { readCV } from '../students/cv.service';
import { positiveId } from '../students/student.validation';
import type { Actor } from './shared';

export type StudentInput = { query: Record<string, string>; params: Record<string, string>; body: Record<string, any>; actor: Actor };
const handle = (work: (c: StudentInput) => Promise<unknown>, status = 200): RequestHandler => async (_req, res, next) => {
  try { res.status(status).json({ success: true, data: await work(res.locals.studentInput) }); } catch (error) { next(error); }
};
const id = (c: StudentInput) => positiveId(c.params.id);
const owned = (work: (studentId: number, c: StudentInput) => Promise<unknown>) => handle(async c => { const studentId = id(c); await assertStudentAccess(studentId, c.actor); return work(studentId, c); });

// Internal handler keys match contract sources, but do not register those URLs.
export const studentJsonHandlers: Record<string, RequestHandler> = {
  'GET /api/auth/me': getCurrentUser,
  'PATCH /api/accounts/me/profile': updateMyProfile,
  'POST /api/auth/change-password': async (req, res, next) => { try { await changePassword(req.user!.userId, req.body.currentPassword, req.body.newPassword); res.json({ success: true, message: 'Password changed. Please login again.' }); } catch (error) { next(error); } },
  'GET /api/students/{id}': handle(c => studentProfile(id(c), c.query, c.actor)),
  'GET /api/students/{id}/course-results': owned((studentId, c) => results(studentId, c.query)),
  'GET /api/students/{id}/eligibility': owned((studentId, c) => eligibility(studentId, c.query)),
  'GET /api/students/{id}/eligibility-checks': owned((studentId, c) => history(studentId, c.query)),
  'GET /api/students/{id}/combo-selections': handle(c => studentComboHistory(id(c), c.query, c.actor)),
  'GET /api/combo-registration-windows': handle(c => studentWindows('combo', c.query, c.actor)),
  'GET /api/ojt-registration-windows': handle(c => studentWindows('ojt', c.query, c.actor)),
  'POST /api/combo-registration-windows/{id}/preview': handle(c => submitChoice(id(c), c.body, c.actor, true)),
  'POST /api/combo-registration-windows/{id}/selections': handle(c => submitChoice(id(c), c.body, c.actor), 201),
  'POST /api/ojt-registrations': handle(c => submit(c.body, c.actor), 201),
  'GET /api/ojt-registrations': handle(c => listRegistrations(c.query, c.actor)),
  'GET /api/ojt-semesters/{id}/students': handle(c => semesterStudents(id(c), c.query, c.actor)),
  'GET /api/students/me/academic-summary': handle(c => summary(c.query, c.actor)),
  'GET /api/students/me/supplementary-course-options': handle(c => supplementary(c.query, c.actor)),
  'GET /api/students/me/curriculum': handle(c => curriculum(c.actor)),
  'GET /api/students/me/roadmap-recommendations': handle(c => roadmap(positiveId(c.query.ojtSemesterId, 'ojtSemesterId'), c.actor)),
  'GET /api/students/me/notifications': handle(c => notifications(c.query, c.actor)),
  'PATCH /api/students/me/notifications/{id}': handle(c => readNotification(id(c), c.actor, c.body.isRead)),
  'GET /api/students/me/assignments/current': handle(c => currentAssignment(c.query, c.actor)),
  'GET /api/students/me/ojt-results': handle(c => publishedResults(c.query, c.actor)),
  'GET /api/students/me/ojt-results/{id}': handle(c => publishedResults(c.query, c.actor, id(c))),
  'GET /api/students/me/dashboard': handle(async c => ({ academic: await summary(c.query, c.actor), registrationWindows: await studentWindows('ojt', { ojtSemesterId: c.query.ojtSemesterId }, c.actor), assignment: await currentAssignment(c.query, c.actor), notifications: await notifications({ limit: '5' }, c.actor) })),
  'POST /api/job-applications': handle(c => applyToPosition(c.body, c.actor), 201),
  'GET /api/job-applications': handle(c => listApplications(c.query, c.actor)),
  'GET /api/students/me/opportunities': handle(c => studentOpportunities(c.query, c.actor)),
  'GET /api/internship-tasks': handle(c => listTasks(c.query, c.actor)),
  'GET /api/students/{id}/cv': async (_req, res, next) => { try {
    const c: StudentInput = res.locals.studentInput;
    const file = await readCV(id(c), c.actor, c.query.cvFileId === undefined ? undefined : positiveId(c.query.cvFileId, 'cvFileId'));
    res.setHeader('Content-Type', file.MimeType);
    res.setHeader('Content-Disposition', 'attachment; filename="cv.pdf"; filename*=UTF-8\'\'' + encodeURIComponent(file.FileName).replace(/'/g, '%27'));
    res.setHeader('Cache-Control', 'private, no-store'); res.setHeader('X-Content-Type-Options', 'nosniff'); res.send(file.Content);
  } catch (error) { next(error); } },
};
