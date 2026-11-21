import { defineConfig } from '@playwright/test';
import path from 'node:path';
const output = process.env.QA_RESULTS_DIR || path.resolve('../qa/results/manual');
export default defineConfig({
  testDir: './tests/e2e', timeout: 120000, expect: { timeout: 20000 },
  fullyParallel: false, workers: 1, retries: 0,
  reporter: [['list'], ['json', { outputFile: path.join(output, 'browser.json') }], ['html', { outputFolder: path.join(output, 'browser-html'), open: 'never' }]],
  outputDir: path.join(output, 'browser-artifacts'),
  use: {
    baseURL: 'http://127.0.0.1:5175', browserName: 'chromium', channel: 'chromium', headless: true,
    viewport: { width: 1440, height: 1000 },
    // Traces contain login form values and network tokens; keep screenshots only.
    trace: 'off', video: 'off', screenshot: 'only-on-failure',
  },
  webServer: [
    { command: 'npm.cmd --prefix ../backend run qa:server', url: 'http://127.0.0.1:3300/', timeout: 60000, reuseExistingServer: false },
    { command: 'npm.cmd run dev -- --host 127.0.0.1 --port 5175 --strictPort', url: 'http://127.0.0.1:5175/login', timeout: 60000, reuseExistingServer: false, env: { API_PROXY_TARGET: 'http://127.0.0.1:3300' } },
  ],
});
