import 'dotenv/config';
process.env.NODE_ENV = 'test';
// The QA process has read-only PostgreSQL sessions, including API handlers.
process.env.PGOPTIONS = '-c default_transaction_read_only=on -c statement_timeout=20000';
process.env.DB_CONNECTION_TIMEOUT_MS = '10000';
process.env.ENTERPRISE_RECRUITMENT_WORKER_ENABLED = 'false';
