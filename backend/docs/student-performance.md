# Student transport and loading

Changes are limited to Student loading and Student-only request orchestration. The shared `services/api.ts`, education/enterprise/QHDN services, database schema, risk/roadmap calculation rules, and CV/matching implementations are unchanged.

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
- Opt-in UI snapshots hold at most 24 completed resources for five minutes in memory and tab-local session storage. Navigating back can display them immediately, but every mount/retry still calls the server. They are scoped to the login token, discarded on successful Student writes, 401 responses, session changes or leaving the Student portal. Late responses begun before invalidation cannot refill snapshots. The HTTP request coordinator still only deduplicates in-flight reads; it does not cache completed HTTP responses.
- Risk UI can reuse the assessment just displayed on the dashboard while requesting a fresh assessment. Endpoint, consent, cancellation, timeout, model inputs, scores, prompts and roadmap computation are unchanged. A failed refresh retains the previous result with the existing error message.
- Recruitment opportunities render each page as it arrives. Application actions wait for validation to finish. Application history and the CV panel load when their tab is first opened; history requests only the current 20-row server page. Visiting the hidden tab no longer competes with the initial opportunity load.

`npm run test:student` covers transport, identity guards, progressive transcript reads, cache expiry/bounds, mutation invalidation and session isolation. `npm run test:student:ui` uses installed Chrome/Chromium (or `STUDENT_TEST_CHROME`) with isolated mock Axios responses and the actual React screens. Its twelve checks cover cached rendering, asynchronous restore, revalidation, partial-page rendering, refresh failure, account switching, mutation invalidation, dashboard rendering before aggregate/AI responses, independent academic loads, lazy server-paginated application history, early assessment loading and a full browser reload with verified-owner data. Browser profiles are disposable files under the ignored `frontend/.tmp` folder. No live accounts or production data are used.

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

## Assessment query reuse

Risk assessment now creates an `AssessmentReadContext` inside its existing authorized read-only transaction. Academic summary and the course plan share the same academic source (grades, curriculum, selections, equivalences and grading policy) and prerequisite groups. The context is a local variable discarded when the request finishes; it never caches results across students, transactions or later requests.

The internal assessment projection omits supplementary-course picker reads and profile/list display enrichment that `buildRiskAndRoadmap` does not consume. Ordinary `studentProfile`, `summaryWithClient` and standalone course-plan callers retain their default behavior. Ownership checks, semester resolution, monitoring gates, grading rules, warning calculation, scenario calculation and course ranking/explanations are unchanged. No provider configuration, AI prompt, model or frontend transport changes are involved.

For the same student/fixture used in the dashboard audit, the real authenticated risk HTTP request drops from **46 SQL statements to 30** (about 35% fewer); its response remains 2,521 bytes. Direct calls inside one fixture transaction, which exclude authentication and transaction setup, drop from 43–45 to 27–28 statements across the 20 seeded students. These counts do not imply the same percentage reduction in production latency.

`tests/student-risk-performance.integration.cjs` resets only the explicitly named disposable `127.0.0.1:55439/student_risk_performance_test`. It compares the optimized assessment with the previous orchestration (default full profile plus a separately loaded course plan). The test clock is fixed so the **entire response, including computedAt**, can be compared exactly. It covers all 20 seeded students plus MEDIUM risk, expired deadlines, unreviewed prerequisites, missing grading configuration, no earned credits, immediate grade changes and rejecting a source belonging to another student. It also asserts one academic-source read and at most one prerequisite-group read per assessment.

```text
backend: STUDENT_RISK_TEST_DATABASE_URL=... node --test tests/student-risk-performance.integration.cjs
backend: STUDENT_PERFORMANCE_TEST_DATABASE_URL=... node --test tests/student-performance.integration.cjs
```

## Faster reopening and first-load overlap

Student UI snapshots now survive F5 within the same tab for at most five minutes. Session-storage keys contain a SHA-256 digest of the token, not the raw bearer token. Cache entries retain their original expiry when restored; restore cannot overwrite a newer response. Unsupported/private/full storage falls back to memory without preventing API reads. Logout, account changes and successful Student mutations erase persisted entries, and late restores/responses cannot refill a newer session's cache.

`getOwnStudentIdentity` still checks `/auth/me`, role, password-change requirements and the expected account. Only after that server verification may a matching cached profile open the portal while the real profile request continues. Cached semester/catalog data and page snapshots then display without waiting for the remaining profile/summary requests. Every resource revalidates; editable account fields and application submission wait for current profile/permission data.

Dashboard and risk-page assessment hooks now start when the page mounts, alongside profile verification. The assessment resource is passed into its panel so mounting the panel does not start another request. Endpoint, owner resolution, AbortSignal, timeout, output, calculation rules and AI/provider behavior are unchanged. First-ever access still needs real server responses; this reduces the sequential wait and provides quick reopening, not a guaranteed production response time.

The real-browser test performs `Page.reload` and holds profile/dashboard responses pending. It verifies that cached credits/profile appear only after server owner verification, that the assessment starts before verification finishes, and that account changes immediately hide and erase restored data. Transport tests additionally check hashed keys, denied cache-owner mismatches, mutation clearing, storage failures and original expiry.

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
