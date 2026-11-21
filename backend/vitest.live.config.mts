import { defineConfig } from 'vitest/config';
import path from 'node:path';
const output = process.env.QA_RESULTS_DIR || path.resolve('../qa/results/manual');
export default defineConfig({
  test: {
    include: ['tests/live/**/*.test.ts'],
    setupFiles: ['tests/live/setup.ts'],
    fileParallelism: false, testTimeout: 45000, hookTimeout: 45000,
    reporters: ['default', 'json', 'junit'],
    outputFile: { json: path.join(output, 'live-api.json'), junit: path.join(output, 'live-api.xml') },
  },
});
