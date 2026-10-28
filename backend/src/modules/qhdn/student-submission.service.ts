import { academicTransaction } from '../academic/academic.repository';
import { submit } from '../ojt-registration/registration.service';
import { applyToPosition } from '../students/job-application.service';
import { inputObject, positiveId, invalid } from '../students/student.validation';
import type { Actor } from '../ojt-registration/window.service';

// Student's single submit is atomic; Admin retains the original on-behalf API.
export async function submitStudentDossier(body: unknown, actor: Actor) {
  if (actor.roleCode === 'ADMIN') return submit(body, actor);
  if (actor.roleCode !== 'STUDENT') throw invalid('Student role required.', 403, 'FORBIDDEN');
  const b = inputObject(body, ['windowId', 'studentId', 'application', 'postId', 'positionId', 'coverLetter']);
  const postId = positiveId(b.postId, 'postId'), positionId = positiveId(b.positionId, 'positionId');
  return academicTransaction(async client => {
    const registration = await submit({ windowId: b.windowId, studentId: b.studentId, application: b.application }, actor, client);
    // Do not turn a retry with another selection into a second application.
    if (registration.replayed && (await client.query(`SELECT 1 FROM "JobApplications" WHERE "RegistrationID"=$1
      AND ("PostID"<>$2 OR "PositionID"<>$3) AND "Status" NOT IN ('REJECTED','WITHDRAWN')`, [registration.id, postId, positionId])).rowCount) {
      throw invalid('Hồ sơ đã nộp với lựa chọn doanh nghiệp/vị trí khác.', 409, 'OJT_SUBMISSION_CONFLICT');
    }
    const jobApplication = await applyToPosition({ registrationId: registration.id, postId, positionId, coverLetter: b.coverLetter }, actor, client, true);
    return { ...registration, jobApplication, replayed: registration.replayed && jobApplication.replayed };
  });
}
