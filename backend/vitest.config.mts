import { defineConfig } from 'vitest/config';
import path from 'node:path';
const output = process.env.QA_RESULTS_DIR || path.resolve('../qa/results/manual');
export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
    setupFiles: ['tests/unit/setup.ts'],
    environment: 'node',
    reporters: ['default', 'json', 'junit'],
    outputFile: { json: path.join(output, 'backend-unit.json'), junit: path.join(output, 'backend-unit.xml') },
    coverage: {
      provider: 'v8', reportsDirectory: path.join(output, 'coverage/backend'),
      reporter: ['text', 'json-summary', 'html'],
      include: [
        'src/modules/auth/auth.service.ts', 'src/middleware/authenticate.ts', 'src/middleware/authorize.ts',
        'src/modules/curriculum/curriculum.validation.ts', 'src/modules/imports/import.validation.ts',
        'src/modules/students/academic-progress.ts', 'src/modules/student-portal/early-warning.ts',
        'src/modules/recruitment/round-policy.ts', 'src/modules/recruitment/schedule-policy.ts',
        'src/modules/qhdn/placement.policy.ts', 'src/modules/academic-reporting/report-format.ts',
      ],
    },
  },
});
