import { vi } from 'vitest';
process.env.JWT_SECRET = 'ojt-unit-test-only-secret-not-for-deployment';
process.env.NODE_ENV = 'test';
// Mock before importing any application module. Unit tests must not load backend/.env.
vi.mock('../../src/config/env', () => ({}));
vi.mock('dotenv/config', () => ({}));
vi.mock('../../src/config/database', () => ({
  pool: null, query: vi.fn(), testDatabaseConnection: vi.fn(), closeDatabaseConnection: vi.fn(),
}));
