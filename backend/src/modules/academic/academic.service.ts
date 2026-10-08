import type { PoolClient } from 'pg';
import { academicError, dateInput, dateRange, inputObject, positiveId, requiredText, statusInput } from './academic.schema';
import { academicTransaction, asApi, audit, findRecord, resources, type AcademicRecord, type Resource } from './academic.repository';

function parseResource(resource: Resource, input: unknown, old?: AcademicRecord): AcademicRecord {
  const keys = [...Object.keys(resources[resource].fields), ...(resource === 'cohorts' ? ['groups'] : [])];
  const patch = inputObject(input, keys);
  const row = { ...old, ...patch };
  row.status = statusInput(row.status, resource === 'cohorts' ? 'ACTIVE' : 'PLANNED');
  const codeKey = Object.entries(resources[resource].fields).find(([,column]) => column === resources[resource].code)![0];
  row[codeKey] = requiredText(row[codeKey], codeKey, resource === 'academic-periods' ? 30 : 20).toUpperCase();
  if (resource !== 'academic-years') row.name = requiredText(row.name, 'name', 100);
  if (resource === 'cohorts') {
    if (typeof row.enrollmentYear !== 'number' || !Number.isInteger(row.enrollmentYear) || row.enrollmentYear < 1900 || row.enrollmentYear > 2200) throw academicError('enrollmentYear must be an integer between 1900 and 2200.');
    if (!old || patch.groups !== undefined) {
      if (!Array.isArray(patch.groups) || !patch.groups.length || patch.groups.length > 4 || (!old && patch.groups.length !== 4)) throw academicError('Create a cohort with all four groups A–D; PATCH may update 1–4 groups.');
      const seen = new Set<string>();
      row.groups = patch.groups.map(value => {
        const group = inputObject(value, ['groupCode','entryAcademicPeriodId']);
        if (typeof group.groupCode !== 'string' || !['A','B','C','D'].includes(group.groupCode) || seen.has(group.groupCode)) throw academicError('Provide distinct groupCode values A, B, C or D.');
        seen.add(group.groupCode);
        return { groupCode: group.groupCode, entryAcademicPeriodId: positiveId(group.entryAcademicPeriodId, 'entryAcademicPeriodId') };
      });
    }
    return row;
  }
  row.startDate = dateInput(row.startDate, 'startDate');
  row.endDate = dateInput(row.endDate, 'endDate');
  dateRange(row.startDate, row.endDate);
  if (resource !== 'academic-years') row.academicYearId = positiveId(row.academicYearId, 'academicYearId');
  if (resource === 'academic-periods') {
    if (!['SEMESTER','BLOCK3'].includes(row.kind)) throw academicError('kind must be SEMESTER or BLOCK3.');
    row.parentPeriodId = row.parentPeriodId ?? null;
    if (row.kind === 'BLOCK3') row.parentPeriodId = positiveId(row.parentPeriodId, 'parentPeriodId');
    else if (row.parentPeriodId !== null) throw academicError('SEMESTER cannot have parentPeriodId. Set it to null when changing kind.');
  }
  if (resource === 'ojt-semesters') {
    row.academicPeriodId = row.academicPeriodId == null ? null : positiveId(row.academicPeriodId, 'academicPeriodId');
    row.regStartDate = row.regStartDate ?? null; row.regEndDate = row.regEndDate ?? null;
    if ((row.regStartDate === null) !== (row.regEndDate === null)) throw academicError('Provide both registration dates or set both to null.');
    if (row.regStartDate !== null) {
      row.regStartDate = dateInput(row.regStartDate, 'regStartDate'); row.regEndDate = dateInput(row.regEndDate, 'regEndDate');
      dateRange(row.regStartDate, row.regEndDate, 'registration');
      if (row.regEndDate > row.startDate) throw academicError('Registration must end on or before the OJT start date.');
    }
  }
  return row;
}

async function assertNoRows(client: PoolClient, sql: string, message: string) {
  if ((await client.query(sql)).rowCount) throw academicError(message, 409, 'ACADEMIC_CALENDAR_CONFLICT');
}

async function validateCalendar(client: PoolClient) {
  await assertNoRows(client, `SELECT 1 FROM "AcademicPeriods" p JOIN "AcademicYears" y ON y."AcademicYearID"=p."AcademicYearID"
    LEFT JOIN "AcademicPeriods" parent ON parent."AcademicPeriodID"=p."ParentPeriodID"
    WHERE p."StartDate"<y."StartDate" OR p."EndDate">y."EndDate"
    OR (p."Kind"='BLOCK3' AND (parent."Kind"<>'SEMESTER' OR parent."AcademicYearID"<>p."AcademicYearID" OR p."StartDate"<=parent."EndDate")) LIMIT 1`, 'Periods must be within their academic year; Block 3 must follow a semester in the same year.');
  await assertNoRows(client, `SELECT 1 FROM "AcademicPeriods" a JOIN "AcademicPeriods" b ON a."AcademicPeriodID"<b."AcademicPeriodID"
    AND a."StartDate"<=b."EndDate" AND b."StartDate"<=a."EndDate" LIMIT 1`, 'Academic periods cannot overlap, including Block 3.');
  await assertNoRows(client, `SELECT 1 FROM "OJTSemesters" o JOIN "AcademicYears" y ON y."AcademicYearID"=o."AcademicYearID"
    LEFT JOIN "AcademicPeriods" p ON p."AcademicPeriodID"=o."AcademicPeriodID"
    WHERE o."StartDate"<y."StartDate" OR o."EndDate">y."EndDate"
    OR (o."AcademicPeriodID" IS NOT NULL AND (p."Kind"<>'SEMESTER' OR p."AcademicYearID"<>o."AcademicYearID" OR o."StartDate"<p."StartDate" OR o."EndDate">p."EndDate")) LIMIT 1`, 'OJT dates must be within their academic year and any linked semester.');
  await assertNoRows(client, `SELECT 1 FROM "CohortGroups" g JOIN "Cohorts" c ON c."CohortID"=g."CohortID"
    JOIN "AcademicPeriods" p ON p."AcademicPeriodID"=g."EntryAcademicPeriodID"
    WHERE p."Kind"<>'SEMESTER' OR EXTRACT(YEAR FROM p."StartDate")<c."EnrollmentYear" LIMIT 1`, 'Each group must start in a semester on or after its enrollment year.');
  await assertNoRows(client, `SELECT 1 FROM "StudentAcademicPlacements" s JOIN "Cohorts" c ON c."CohortID"=s."CohortID"
    JOIN "AcademicPeriods" entry ON entry."AcademicPeriodID"=s."EntryAcademicPeriodID"
    JOIN "AcademicPeriods" current ON current."AcademicPeriodID"=s."CurrentAcademicPeriodID"
    LEFT JOIN "AcademicPeriods" parent ON parent."AcademicPeriodID"=current."ParentPeriodID"
    WHERE entry."Kind"<>'SEMESTER' OR EXTRACT(YEAR FROM entry."StartDate")<c."EnrollmentYear"
    OR entry."StartDate">CASE WHEN current."Kind"='BLOCK3' THEN parent."StartDate" ELSE current."StartDate" END LIMIT 1`, 'A placement must start in a semester on or after enrollment, and cannot be later than the current specialized semester.');
}

async function syncStudentProgress(client: PoolClient) {
  // Count only regular semesters: Block 3 belongs to its parent and does not advance the number.
  await client.query(`UPDATE "Students" student SET "EnrollmentYear"=cohort."EnrollmentYear", "CurrentSemester"=(
    SELECT count(*)::int FROM "AcademicPeriods" p WHERE p."Kind"='SEMESTER' AND p."StartDate">=entry."StartDate"
      AND p."StartDate"<=CASE WHEN current."Kind"='BLOCK3' THEN parent."StartDate" ELSE current."StartDate" END
    ) FROM "StudentAcademicPlacements" placement JOIN "Cohorts" cohort ON cohort."CohortID"=placement."CohortID"
    JOIN "AcademicPeriods" entry ON entry."AcademicPeriodID"=placement."EntryAcademicPeriodID"
    JOIN "AcademicPeriods" current ON current."AcademicPeriodID"=placement."CurrentAcademicPeriodID"
    LEFT JOIN "AcademicPeriods" parent ON parent."AcademicPeriodID"=current."ParentPeriodID"
    WHERE student."StudentID"=placement."StudentID"`);
}

export async function saveResource(resource: Resource, input: unknown, actorId: number, id?: number) {
  return academicTransaction(async client => {
    const before = id === undefined ? undefined : await findRecord(client, resource, id);
    const row = parseResource(resource, input, before);
    const config = resources[resource], entries = Object.entries(config.fields);
    const values = entries.map(([key]) => row[key]);
    const result = id === undefined
      ? await client.query(`INSERT INTO "${config.table}" (${entries.map(([,column]) => `"${column}"`).join(',')}) VALUES (${values.map((_,i) => `$${i+1}`).join(',')}) RETURNING *`, values)
      : await client.query(`UPDATE "${config.table}" SET ${entries.map(([,column],i) => `"${column}"=$${i+1}`).join(',')} WHERE "${config.id}"=$${values.length+1} RETURNING *`, [...values,id]);
    const saved = asApi(resource, result.rows[0]);
    if (resource === 'cohorts') {
      for (const group of row.groups) await client.query(`INSERT INTO "CohortGroups" ("CohortID","GroupCode","EntryAcademicPeriodID") VALUES ($1,$2,$3)
        ON CONFLICT ("CohortID","GroupCode") DO UPDATE SET "EntryAcademicPeriodID"=EXCLUDED."EntryAcademicPeriodID"`, [saved.id, group.groupCode, group.entryAcademicPeriodId]);
      saved.groups = (await findRecord(client, resource, saved.id)).groups;
    }
    await validateCalendar(client);
    await syncStudentProgress(client);
    await audit(client, actorId, config.table, saved.id, id === undefined ? 'CREATE' : 'UPDATE', before ?? null, saved);
    return saved;
  });
}

export async function assignPlacement(studentId: number, input: unknown, actorId: number) {
  const patch = inputObject(input, ['cohortId','groupCode','entryAcademicPeriodId','currentAcademicPeriodId','programId','reason']);
  const reason = requiredText(patch.reason, 'reason', 1000);
  return academicTransaction(async client => {
    const student = (await client.query('SELECT * FROM "Students" WHERE "StudentID"=$1 FOR UPDATE', [studentId])).rows[0];
    if (!student) throw academicError('Student not found.', 404, 'STUDENT_NOT_FOUND');
    const previous = (await client.query('SELECT * FROM "StudentAcademicPlacements" WHERE "StudentID"=$1 FOR UPDATE', [studentId])).rows[0];
    const cohortId = positiveId(patch.cohortId ?? previous?.CohortID, 'cohortId');
    const groupCode = patch.groupCode ?? previous?.GroupCode;
    if (typeof groupCode !== 'string' || !['A','B','C','D'].includes(groupCode)) throw academicError('groupCode must be A, B, C or D.');
    const group = (await client.query('SELECT g.*,c."Status" FROM "CohortGroups" g JOIN "Cohorts" c ON c."CohortID"=g."CohortID" WHERE g."CohortID"=$1 AND g."GroupCode"=$2', [cohortId, groupCode])).rows[0];
    if (!group) throw academicError('Cohort/group is not configured.', 404, 'COHORT_GROUP_NOT_FOUND');
    if (group.Status === 'ARCHIVED') throw academicError('Cannot assign an archived cohort.', 409, 'COHORT_ARCHIVED');
    const changedGroup = !previous || previous.CohortID !== cohortId || previous.GroupCode !== groupCode;
    const entryId = positiveId(patch.entryAcademicPeriodId ?? (changedGroup ? group.EntryAcademicPeriodID : previous.EntryAcademicPeriodID), 'entryAcademicPeriodId');
    const currentId = positiveId(patch.currentAcademicPeriodId ?? previous?.CurrentAcademicPeriodID, 'currentAcademicPeriodId');
    if (patch.programId !== undefined) {
      const programId = positiveId(patch.programId, 'programId');
      const program = await client.query('SELECT 1 FROM "TrainingPrograms" WHERE "ProgramID"=$1', [programId]);
      if (!program.rowCount) throw academicError('Training program not found.', 404, 'PROGRAM_NOT_FOUND');
      await client.query('UPDATE "Students" SET "ProgramID"=$2 WHERE "StudentID"=$1', [studentId,programId]);
    }
    await client.query(`INSERT INTO "StudentAcademicPlacements" ("StudentID","CohortID","GroupCode","EntryAcademicPeriodID","CurrentAcademicPeriodID","UpdatedBy") VALUES ($1,$2,$3,$4,$5,$6)
      ON CONFLICT ("StudentID") DO UPDATE SET "CohortID"=EXCLUDED."CohortID","GroupCode"=EXCLUDED."GroupCode","EntryAcademicPeriodID"=EXCLUDED."EntryAcademicPeriodID","CurrentAcademicPeriodID"=EXCLUDED."CurrentAcademicPeriodID","UpdatedBy"=EXCLUDED."UpdatedBy","UpdatedAt"=now()`, [studentId,cohortId,groupCode,entryId,currentId,actorId]);
    await validateCalendar(client);
    await syncStudentProgress(client);
    const result = (await client.query(`SELECT p."StudentID" AS "studentId",p."CohortID" AS "cohortId",p."GroupCode" AS "groupCode",
      p."EntryAcademicPeriodID" AS "entryAcademicPeriodId",p."CurrentAcademicPeriodID" AS "currentAcademicPeriodId",
      s."CurrentSemester" AS "currentSemester",s."EnrollmentYear" AS "enrollmentYear",s."ProgramID" AS "programId",p."UpdatedAt" AS "updatedAt"
      FROM "StudentAcademicPlacements" p JOIN "Students" s ON s."StudentID"=p."StudentID" WHERE p."StudentID"=$1`, [studentId])).rows[0];
    await audit(client, actorId, 'StudentAcademicPlacements', studentId, 'UPDATE_ACADEMIC_PLACEMENT', { placement: previous ?? null, programId: student.ProgramID, currentSemester: student.CurrentSemester }, result, reason);
    return result;
  });
}
