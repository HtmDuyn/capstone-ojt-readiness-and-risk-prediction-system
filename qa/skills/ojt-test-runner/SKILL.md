---
name: ojt-test-runner
description: Configure and run this repository's OJT unit, React component, role API and browser tests; inspect current execution evidence for the five system roles.
---

Use the repository root as the working directory. Read `docs/TESTING.md` for commands and evidence locations.

- Backend is Express/TypeScript with PostgreSQL, not SQL Server. `backend/DB` contains destructive reset statements; reading it does not authorize executing a reset against the configured database.
- `npm.cmd test` runs builds and isolated Vitest suites. `npm.cmd run test:all` adds actual account/API checks and Chromium navigation, using `qa/accounts.local.json` and `backend/.env`. Use `npm` on non-Windows hosts.
- The API roles map to frontend roles: ADMIN/admin, ACADEMIC/education, OJT_COORD/qhdn, STUDENT/student, ENTERPRISE/enterprise. Check permitted and denied access. ADMIN does not automatically inherit student/enterprise self-service access.
- Unit fixtures mock repository/network boundaries. Live sessions are initialized by `backend/scripts/qa-readonly.ts`. Verify `DB-READONLY`; do not remove the guard to make a test pass. Calendar locking limitations are in `qa/limitations.json`.
- Read `qa/results/latest.json`, the chosen run's `run.json`, JSON/JUnit results and case catalog. Keep results from one run together. A skipped dependency is Blocked, never Passed. Separate test harness errors from confirmed product defects.
- Add metadata using `qa/register-case.cjs`: stable unique ID, module group, title, input, expected result, source, level and precondition. Assert observable behavior, authorization, calculated values or meaningful side effects.
- Credentials belong in ignored local configuration. Do not put passwords/JWTs in metadata, screenshots, traces or reports. Browser traces are disabled because they capture login traffic.

For Excel generation and template reconciliation, read `qa/skills/ojt-excel-report/SKILL.md`.
