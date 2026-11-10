import { readTransaction } from './read.repository';
import { staff } from './catalog.service';
import { currentCVSql, cvMetadataSql } from '../students/cv.service';
import { invalid, positiveId } from '../students/student.validation';
import type { Actor, Row } from '../ojt-registration/window.service';

export async function studentDossier(studentId: number, params: Row, actor: Actor) {
  staff(actor);
  const id = positiveId(studentId, 'studentId');
  for (const key of Object.keys(params)) {
    if (key !== 'ojtSemesterId') throw invalid('Unknown profile parameter: ' + key);
  }
  const semesterId = positiveId(params.ojtSemesterId, 'ojtSemesterId');
  return readTransaction(async client => {
    const student = (await client.query(`SELECT s."StudentID" AS id,s."StudentCode" AS "studentCode",
      u."FullName" AS "fullName",u."Email" AS email,u."Phone" AS phone,s."ClassName" AS "className",
      s."Status" AS status,s."EnrollmentYear" AS "enrollmentYear",s."CurrentSemester" AS "currentSemester",
      program."ProgramCode" AS "programCode",program."ProgramName" AS "programName",
      major."SpecializationCode" AS "majorCode",major."SpecializationName" AS "majorName",
      cohort."Name" AS "cohortName",placement."GroupCode" AS "groupCode",period."Name" AS "currentPeriodName",
      term."OJTSemesterID" AS "ojtSemesterId",term."Name" AS "semesterName",
      ${currentCVSql('s."StudentID"')} AS cv,
      CASE WHEN submitted_cv."CVFileID" IS NULL THEN NULL ELSE ${cvMetadataSql('submitted_cv')} END AS "submittedCv",
      registration."RegisteredAt" AS "registeredAt",
      registration."Application"->>'contactEmail' AS "applicationEmail",registration."Application"->>'contactPhone' AS "applicationPhone",
      company."Name" AS "companyName",position."Title" AS "positionTitle",coordination."Decision" AS decision,
      coordination."RejectReason" AS "rejectReason",application."CoverLetter" AS "coverLetter",
      application."CertificateLinks" AS certificates
      FROM "Students" s JOIN "Users" u ON u."UserID"=s."UserID"
      JOIN "OJTSemesters" term ON term."OJTSemesterID"=$2
      LEFT JOIN "TrainingPrograms" program ON program."ProgramID"=s."ProgramID"
      LEFT JOIN "Specializations" major ON major."SpecializationID"=program."SpecializationID"
      LEFT JOIN "StudentAcademicPlacements" placement ON placement."StudentID"=s."StudentID"
      LEFT JOIN "Cohorts" cohort ON cohort."CohortID"=placement."CohortID"
      LEFT JOIN "AcademicPeriods" period ON period."AcademicPeriodID"=placement."CurrentAcademicPeriodID"
      LEFT JOIN "OJTRegistrations" registration ON registration."StudentID"=s."StudentID" AND registration."OJTSemesterID"=$2
      LEFT JOIN LATERAL (SELECT * FROM "StudentEnterpriseCoordination" latest
        WHERE latest."RegistrationID"=registration."RegistrationID" AND latest."OJTSemesterID"=$2
        ORDER BY latest."CoordinationID" DESC LIMIT 1) coordination ON true
      LEFT JOIN "Enterprises" company ON company."EnterpriseID"=coordination."EnterpriseID"
      LEFT JOIN "InternshipPositions" position ON position."PositionID"=coordination."PositionID"
      LEFT JOIN "JobApplications" application ON application."ApplicationID"=coordination."ApplicationID" AND application."StudentID"=s."StudentID" AND application."OJTSemesterID"=$2
      LEFT JOIN "StudentCVFiles" submitted_cv ON submitted_cv."CVFileID"=application."CVFileID" AND submitted_cv."StudentID"=s."StudentID"
      WHERE s."StudentID"=$1 AND s."DeletedAt" IS NULL
        AND EXISTS (SELECT 1 FROM "EligibleStudentHandoffItems" handoff
          WHERE handoff."StudentID"=s."StudentID" AND handoff."OJTSemesterID"=$2)`, [id, semesterId])).rows[0];
    if (!student) throw invalid('Không tìm thấy sinh viên trong danh sách bàn giao của học kỳ này.', 404, 'STUDENT_NOT_FOUND');
    return student;
  });
}
