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

## Student UI follow-up

The follow-up changes only Student frontend files and tests; it does not change backend APIs or AI computation.

- Portal bootstrap now requests `include=ojtRegistrations`, retaining the existing `/auth/me`, role, password-change, and profile-owner checks. Academic progress no longer blocks the shell or the risk/recruitment screens.
- The dashboard renders its sections before the aggregate or assessment finishes. Its credit chart uses `academic.academicProgress`, already present in the dashboard response, avoiding a second progress computation during bootstrap.
- Academic profile loads metrics and transcript independently. Transcript pages render progressively, and later pages still participate in semester/search filters. Curriculum remains lazy.
- Opt-in UI snapshots hold at most 24 completed resources for 60 seconds in memory. Navigating back can display them immediately, but every mount/retry still calls the server. They are scoped to the login token, discarded on successful Student writes, 401 responses, session changes or leaving the Student portal. Late responses begun before invalidation cannot refill snapshots. The HTTP request coordinator still only deduplicates in-flight reads; it does not cache completed HTTP responses.
- Risk UI can reuse the assessment just displayed on the dashboard while requesting a fresh assessment. Endpoint, consent, cancellation, timeout, model inputs, scores, prompts and roadmap computation are unchanged. A failed refresh retains the previous result with the existing error message.
- Recruitment opportunities render each page as it arrives. Application actions wait for validation to finish. Application history and the CV panel load when their tab is first opened; history requests only the current 20-row server page. Visiting the hidden tab no longer competes with the initial opportunity load.

`npm run test:student` covers transport, identity guards, progressive transcript reads, cache expiry/bounds, mutation invalidation and session isolation. `npm run test:student:ui` uses installed Chrome/Chromium (or `STUDENT_TEST_CHROME`) with isolated mock Axios responses and the actual React screens. Its eight checks cover immediate cached rendering with revalidation, partial-page rendering, refresh failure, account switching, mutation invalidation, dashboard rendering before aggregate/AI responses, independent academic loads and lazy server-paginated application history. Browser profiles are disposable files under the ignored `frontend/.tmp` folder. No live accounts or production data are used.

These checks establish UI behavior under deliberately delayed responses. They do not establish production response time; hosting, network and database latency still need measurement in the deployed environment.

## Dashboard request and ownership audit

The subsequent audit found redundant work still present in the overview screen:

- Portal bootstrap fetched notification counts that only the notifications page consumed; that page fetched its own count again. Dashboard also received the same latest notification/count in its aggregate. Bootstrap no longer makes that request. Dashboard loads its one-row notification resource independently, so notification failure cannot delay credits or eligibility.
- Bootstrap fetched fully validated OJT application windows just to populate a semester selector. Dashboard separately fetched five fully validated windows. Bootstrap now uses `GET /ojt-registration-windows?view=catalog`, and dashboard reuses that same scoped catalog for the five timeline entries. Catalog projection uses exactly the same student handoff/scope/status filters as the default projection, omitting registration contents and admission/action computation. The recruitment page still requests the default full projection before permitting an application. Staff handlers and combo projections are unchanged.
- Dashboard used the full academic summary, including scenarios, prerequisites and enriched outstanding/failed courses also computed by the independent risk route. `GET /students/me/dashboard?view=summary` now calculates only displayed credits, GPA, current/official/admission eligibility, deadline and assignment. It calls the existing progress/eligibility implementations without changing their rules. The older `full` and `overview` responses remain available. Risk/roadmap computation is unchanged.
- Profile state is associated with the verified token as well as the linked user ID. Switching accounts hides the previous profile immediately, before effect cleanup or the next network response.

Measured on the disposable seeded database (including authentication/transaction SQL):

| Request | SQL statements | JSON response bytes |
| --- | ---: | ---: |
| Previous dashboard overview | 41 | approximately 27,923 |
| Current dashboard summary | 28 | 14,298 |
| Full OJT windows | 9 | 1,512 |
| OJT window catalog | 6 | 488 |
| Independent risk assessment (unchanged) | 46 | 2,521 |

The summary figures describe the main overview request, not the sum of every request on the page. The independent risk endpoint still performs substantial academic reads. A remote database adds round-trip time to sequential queries, so UI changes alone do not guarantee a particular production duration. No hosted timing measurement was made.

Integration tests use two distinct valid student JWTs and real authentication middleware. They verify owner-scoped dashboard/risk/registration/application responses, reject cross-student profile/academic/transcript/curriculum/CV/task-submission reads, prevent foreign notification updates and reject ID/filter injection. Missing, forged, expired and revoked tokens fail with 401; staff tokens fail on Student-only dashboard routes. These tests cover personal Student data; shared curricula, visible recruitment information and company catalogs intentionally remain available according to their existing access rules.

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
