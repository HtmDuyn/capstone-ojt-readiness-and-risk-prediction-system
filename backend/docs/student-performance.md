# Student transport and loading

Changes are limited to the Student frontend, its request coordinator, and Student-only API responses. The shared `services/api.ts`, education/enterprise/QHDN services, database schema, and backend AI/risk/CV/matching implementations are unchanged.

## Findings

- `StudentPortalProvider` waited for every page of registration windows and registrations plus notification contents before opening any Student page.
- The bootstrap already requested `ojtRegistrations` in the profile, then downloaded the same registrations again.
- Task and result screens called the full internship aggregate, which read and enriched assignment, tasks, task progress, and evaluations even when only one section was displayed. Result details also loaded an unnecessary result list.
- The dashboard fetched combo windows, job applications, task submissions, result lists, and supplementary courses that its current UI does not display.
- The risk service imported `apiRequest` from the shared service that uses `fetch`. Other Student services already used their own Axios client.
- Academic profile loaded the curriculum even before its tab was opened.

## Changes

- Student data uses its existing Axios XHR client. The risk call now uses that client too, with the same endpoint, AbortSignal and unlimited timeout as its previous fetch call. CV analysis/job matching retain their consent payloads and 90-second timeouts. No AI output, rules, providers or prompts change.
- The portal opens after profile loading. Catalogs and unread counts load in the background and update independently. A complete registration section from the profile is reused; extra pages are fetched only if necessary. Unread-count bootstrap fetches one notification instead of twenty.
- `studentGet` shares concurrent identical GET requests within the same login session. Each consumer can cancel independently; the underlying request aborts when its last consumer leaves. Switching sessions aborts old requests. Completed responses are never cached, and successful writes prevent subsequent readers from joining a request started before the write. No tokens or responses are persisted by this coordinator.
- `GET /students/me/internships?include=identity|assignment|tasks|results` reads only the requested sections. `include=all` remains the default and preserves the existing aggregate response. Result details retain student ownership/publication checks.
- `GET /students/me/tasks` uses the tasks-only branch and retains task submission metadata, progress across every page, and existing permissions.
- `GET /students/me/dashboard?view=overview` returns the academic/admission data, registration windows, assignment, and latest notification displayed by the dashboard. The default `view=full` preserves the existing response. Full academic and admission computations are unchanged, so the risk/roadmap logic is unaffected.
- The curriculum tab loads on first opening. Subsequent tab switches keep the current component data; refresh still requests the server.

## Verification and measurements

`tests/student-performance.integration.cjs` resets only the explicitly named disposable database `127.0.0.1:55439/student_performance_test`. It counts actual PostgreSQL statements including authentication, compares full/partial response values, verifies ownership and invalid inputs, and compares risk/roadmap responses before and after ordinary Student reads.

One local seeded-database run:

| Request | SQL statements | JSON response bytes |
| --- | ---: | ---: |
| Full internship aggregate | 16 | 10,799 |
| Tasks only | 12 | 6,035 |
| Results only | 9 | 2,557 |
| Result detail only | 9 | 2,500 |
| Identity only | 4 | 60 |
| Full dashboard | 62 | 50,707 |
| Dashboard overview | 41 | 27,923 |

These are local fixture measurements, not production timings or guaranteed latency. Network, hosting wake-up time, database load, and the independently loaded risk request still affect total page time. The full requests remain available to older callers.

Checks:

```text
frontend: npm run test:student
frontend: npm run build
backend: npm run build
backend: node --test tests/swagger-startup.test.cjs
backend: STUDENT_PERFORMANCE_TEST_DATABASE_URL=... node --test tests/student-performance.integration.cjs
backend: STUDENT_TEST_DATABASE_URL=... node scripts/test-student-flow.cjs --tasks
```

Student transport tests exercise the real Axios interceptors with an isolated test adapter and make `fetch` fail if invoked. They verify task/results/dashboard request scopes, unchanged AI consent and timeout settings, cancellation, retry and session isolation. The task integration uses its separate disposable `student_flow_test` database.
