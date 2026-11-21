import { defineConfig } from 'vitest/config';
import path from 'node:path';
const output = process.env.QA_RESULTS_DIR || path.resolve('../qa/results/manual');
export default defineConfig({
  resolve: { alias: { '@': path.resolve(import.meta.dirname, 'src') } },
  test: {
    include: ['tests/unit/**/*.test.{ts,tsx}'], environment: 'jsdom',
    setupFiles: ['tests/unit/setup.ts'],
    reporters: ['default', 'json', 'junit'],
    outputFile: { json: path.join(output, 'frontend-unit.json'), junit: path.join(output, 'frontend-unit.xml') },
    coverage: {
      provider: 'v8', reportsDirectory: path.join(output, 'coverage/frontend'),
      reporter: ['text', 'json-summary', 'html'],
      include: [
        'src/routers/PrivateRouter.tsx', 'src/hooks/shared/useRoleRedirect.ts',
        'src/utils/shared/authSession.ts', 'src/utils/shared/taskTime.ts',
        'src/utils/education/localOjtEligibility.ts', 'src/utils/enterprise/enterpriseEvaluation.ts',
      ],
    },
  },
});
