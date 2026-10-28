# Academic seed

`backend/DB` is the full reset script. It deletes existing application data;
apply it only to an empty/test database. These changes do not migrate a running
database automatically.

- Each year uses the backend calendar format `YYYY-YYYY` and contains exactly
  `SPRINGYYYY`, `SUMMERYYYY`, `FALLYYYY`, in order. Block 3 is a child period,
  not a fourth semester. The first and last seeded years are complete too.
- Curriculum stages are **0 through 9 inclusive (10 stages)**. The calendar and
  curriculum are separate: each cohort group A–D has an explicit mapping.
- The 20 fictional students have a published curriculum, placement at stage 5,
  and course history beginning at stage 0. OJT remains the upcoming stage 6.
- Student 07 failed `SWE201c` at stage 4. `SWP391`, `SWR302`, and `SWT301` are
  absent from that student's stage-5 transcript because enrollment is blocked.
  Absence is not a failed attempt. Students 09 and 18 retake stage-1 subjects at
  stage 5; their original failures are retained.
- Course eligibility uses the curriculum tag and explicit prerequisite groups.
  Every group must satisfy `MinimumPassed` with `PASSED`/`RECOGNIZED` results
  from an earlier curriculum stage. Unstructured prerequisite prose is not
  parsed or guessed. The demo curriculum declares its prerequisites explicitly;
  its rules are illustrative, not a replacement for an official curriculum.
- All seeded curricula and OJT rules are `PUBLISHED`; workflow windows use their
  supported `OPEN` state. Calendars use `PLANNED`/`ACTIVE`/`CLOSED`, as defined by
  the schema, rather than an unsupported `PUBLISHED` value.

The reset validates these invariants before commit. Deferred database triggers
also reject incomplete students and invalid transcript inserts, updates, and
deletes through the backend or direct SQL. Import a student's program, placement,
and full history in one transaction; transcript rows may be supplied in any
order. Correcting/deleting a passed prerequisite must leave dependent history
valid in the final transaction state.

