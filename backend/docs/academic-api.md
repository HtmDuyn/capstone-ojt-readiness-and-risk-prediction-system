# Academic calendar and student placement APIs

All 13 endpoints require a bearer token for `ACADEMIC` or `ADMIN`. Accounts with a temporary password must change it first. Requests and responses use JSON.

| Resource | List | Create | Update |
|---|---|---|---|
| Academic years | `GET /api/academic-years` | `POST /api/academic-years` | `PATCH /api/academic-years/:id` |
| Specialized semesters / Block 3 | `GET /api/academic-periods` | `POST /api/academic-periods` | `PATCH /api/academic-periods/:id` |
| OJT semesters | `GET /api/ojt-semesters` | `POST /api/ojt-semesters` | `PATCH /api/ojt-semesters/:id` |
| Cohorts / groups A–D | `GET /api/cohorts` | `POST /api/cohorts` | `PATCH /api/cohorts/:id` |

The final endpoint is `PATCH /api/students/:id/academic-placement`. `:id` is a `StudentID`, not a `UserID`.

## Database and startup

All database schema definitions are maintained in the single `backend/DB` file, including academic periods, cohorts, groups and actual student placements. The API does not create tables or insert fixed academic records at startup. Years, periods and cohorts are created from request data through the POST APIs.

The current database already contains these tables. For a fresh installation, initialize the database from `backend/DB` using the SQL editor before starting the backend. This file resets the application's tables and data; do not run the whole file against a database whose existing data must be retained.

```powershell
npm run build
npm start
```

## Common behavior

- GET accepts `page` (default 1), `limit` (default 20, maximum 100), `search` and `status`. Period and OJT lists also accept `academicYearId`; period lists accept `kind=SEMESTER|BLOCK3`.
- GET response: `{ "success": true, "items": [], "page": 1, "limit": 20, "total": 0 }`.
- POST returns 201 with `{ "success": true, "data": { "id": 1, "...": "..." } }`.
- PATCH merges supplied fields with the existing record, validates the final state and returns 200 with `data`. An empty body, unknown field or invalid identifier is rejected.
- Status values are `PLANNED`, `ACTIVE`, `CLOSED`, `ARCHIVED`. New years/periods/OJT default to `PLANNED`; new cohorts default to `ACTIVE`.
- Codes are trimmed and normalized to uppercase. Case-insensitive uniqueness is enforced by database indexes.
- Dates use `YYYY-MM-DD` and inclusive start/end boundaries. Invalid calendar dates and reversed ranges are rejected.
- 400: invalid input. 401: missing/invalid token. 403: wrong actor or password change required. 404: missing target record. 409: duplicate, missing reference, or conflicting calendar/history.
- Writes, recalculations and audit entries commit together. Invalid changes roll back. No DELETE endpoint is provided; use status updates to retain history.

## 1. Academic year

`POST /api/academic-years`

```json
{
  "yearCode": "2026-2027",
  "startDate": "2026-09-01",
  "endDate": "2027-08-31",
  "status": "PLANNED"
}
```

`PATCH /api/academic-years/1` can update any of these fields. The year cannot be shortened so that an existing academic period or OJT semester falls outside it.

## 2. Academic period

Create a regular semester first:

```json
{
  "academicYearId": 1,
  "periodCode": "FALL2026",
  "name": "Kỳ chuyên ngành Fall 2026",
  "kind": "SEMESTER",
  "startDate": "2026-09-01",
  "endDate": "2026-12-10"
}
```

Then create its Block 3, using the returned semester ID:

```json
{
  "academicYearId": 1,
  "periodCode": "FALL2026-B3",
  "name": "Block 3 Fall 2026",
  "kind": "BLOCK3",
  "parentPeriodId": 1,
  "startDate": "2026-12-11",
  "endDate": "2026-12-31"
}
```

Rules: both are within the academic year; a Block 3 starts after its parent semester ends, belongs to the same year and has a `SEMESTER` parent. Each semester has at most one Block 3. Periods cannot overlap, including periods from different academic years. Regular semesters have no parent. PATCH checks child blocks, linked OJT semesters and existing student placements before committing.

Configure the full school calendar, including past regular semesters needed to calculate student progression. The API counts declared semesters, not an assumed number of months or semesters per year.

## 3. OJT semester

`POST /api/ojt-semesters`

```json
{
  "academicYearId": 1,
  "semesterCode": "OJT-FALL2026",
  "name": "Kỳ OJT Fall 2026",
  "academicPeriodId": 1,
  "startDate": "2026-09-01",
  "endDate": "2026-12-10",
  "regStartDate": "2026-08-01",
  "regEndDate": "2026-08-25",
  "status": "PLANNED"
}
```

`academicPeriodId` is optional and may be null. When provided it must be a regular semester in the same year, and OJT dates must fall within it. Registration dates are optional as a pair: provide both or set both to null. Registration ends on or before the OJT start date. Registration may begin before the academic year starts.

Existing enterprise import/retention logic continues to use `OJTSemesters`; this API does not import recruitment or create registrations.

## 4. Cohort and groups

`POST /api/cohorts`

```json
{
  "cohortCode": "K22",
  "name": "Khóa 22",
  "enrollmentYear": 2026,
  "status": "ACTIVE",
  "groups": [
    { "groupCode": "A", "entryAcademicPeriodId": 1 },
    { "groupCode": "B", "entryAcademicPeriodId": 3 },
    { "groupCode": "C", "entryAcademicPeriodId": 5 },
    { "groupCode": "D", "entryAcademicPeriodId": 7 }
  ]
}
```

Replace all IDs with existing `SEMESTER` periods. Create requires all four distinct groups A–D. Their entry periods cannot predate the cohort's enrollment year.

PATCH may update 1–4 group defaults:

```json
{
  "groups": [
    { "groupCode": "B", "entryAcademicPeriodId": 5 }
  ]
}
```

Other group defaults are retained. Changing a group default does not silently overwrite a student's saved actual entry period. Changing a cohort enrollment year validates all affected placements and synchronizes `Students.EnrollmentYear`.

## 5. Actual student placement

`PATCH /api/students/123/academic-placement`

```json
{
  "cohortId": 1,
  "groupCode": "B",
  "entryAcademicPeriodId": 3,
  "currentAcademicPeriodId": 5,
  "programId": 2,
  "reason": "Gán lộ trình theo thời điểm vào chuyên ngành thực tế"
}
```

- First placement requires `cohortId`, `groupCode`, `currentAcademicPeriodId` and `reason`.
- Omit `entryAcademicPeriodId` to use the selected group's default entry semester. Supply it when the student's actual entry differs.
- Subsequent PATCH can send only changed fields plus `reason`. Actual entry is preserved unless cohort/group changes or an explicit entry override is sent. When changing cohort/group without an override, the new group's default is used.
- Entry must be a regular semester on/after enrollment. Current period can be a semester or its Block 3 and cannot precede actual entry.
- `programId` is optional; omitted means retain the student's program. References and existing program/combo history are enforced by database constraints.
- Archived cohorts cannot be assigned. The student's actual placement is saved separately and the legacy `Students.EnrollmentYear` / `CurrentSemester` fields are synchronized.

The relative specialized semester is the count of declared `SEMESTER` periods from actual entry through the current regular semester, inclusive. For a current Block 3, use its parent semester. Example: group A starts in Fall, group B starts in Spring; during Spring A is in semester 2 and B is in semester 1. Block 3 does not add a semester. The current period is explicitly managed through this endpoint, not advanced automatically by the clock.

Calendar edits recalculate students with placements; students without a placement retain their existing legacy values. All mutations record actor and before/after data in `AuditLogs`; placement updates also record the required reason.
