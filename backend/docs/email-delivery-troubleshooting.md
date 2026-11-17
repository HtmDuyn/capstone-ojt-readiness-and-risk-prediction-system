# Troubleshooting account email delivery

`EAUTH_535` means the SMTP provider rejected authentication. It is independent
of the recipient's role or address. For Gmail, set `SMTP_USER` to the complete
sending address and `SMTP_PASSWORD` to a valid Google app password for that
account (requires 2-Step Verification). Restart the backend after changing
`backend/.env`. Do not paste credentials into logs or support messages.

Gmail configuration: `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=465`,
`SMTP_SECURE=true`, and an authorized `SMTP_FROM` address.
Google instructions: https://support.google.com/mail/answer/185833

On authentication failure, the worker leaves the claimed email PENDING with
its encrypted payload intact, restores its delivery attempt, schedules a retry
in five minutes, and stops the current batch. Other recipients are not claimed
in that batch. Expired credentials are still cancelled by the normal cleanup.

Messages already FAILED before the fix require an ADMIN retry after SMTP is
repaired: `POST /api/imports/emails/resend` with `{"email":"recipient@example.com"}`,
or `POST /api/student-imports/:id/email-retries` for a committed student import.
Only unexpired failed account emails with valid temporary credentials can be
retried. Do not import the same students again to resend credentials: existing
student accounts are updated without generating another welcome email.

`55P03` in the results worker indicates lock contention. Result notifications
share the academic calendar lock with imports. The worker now tries that lock
without waiting; if busy, it rolls back and tries again on the next scheduled
tick. Database and schema errors other than lock contention still surface.

Current permissions: OJT_COORD (QHDN) imports ENTERPRISE accounts;
ADMIN and ACADEMIC import STUDENT accounts through `/api/student-imports`.
