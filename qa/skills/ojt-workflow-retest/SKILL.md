---
name: ojt-workflow-retest
description: Reconcile prior OJT UI checks and prepare data-dependent cross-role retests for applications, task submissions, evaluations and official academic results.
---

Read `qa/history-notes.json`, `qa/limitations.json` and the selected run's evidence before drawing conclusions. Commands are in `docs/TESTING.md`.

- Live tests use the five actual roles and a read-only database. For mutations, use an isolated writable test database with fixtures and assert rollback/cleanup. Do not execute the reset in `backend/DB` against the existing database merely to obtain fixtures.
- Application flow needs a published vacancy in the correct phase, eligible student, CV, enterprise acceptance/rejection and refreshed state on both roles. A rendered application page does not cover the flow.
- Task flow needs an assignment, enterprise task creation, student receipt/submission, a separate completion action, enterprise viewing the submission/feedback and persistence after reload. Keep withdrawn the prior claim that submission automatically completed the task.
- Evaluation flow needs an assigned student, valid scores, saved draft, publication/locking and official result visibility. Score utility tests cover calculation only.
- For the historical seven-hour discrepancy, compare raw API timestamps, PostgreSQL column types and rendered acceptance/submission times in Asia/Ho_Chi_Minh. Distinguish UTC instants from local timestamps before declaring a defect.
- Keep cases Blocked/Pending when fixtures, UI actions or external services are unavailable. Record the exact checkpoint reached and what remains. Separate old user-reported observations from tests executed now.
