import { PlaywrightTestConfig, devices } from '@playwright/test';

const config: PlaywrightTestConfig = {
  timeout: 1000 * 60 * 9999,
  testDir: 'src',
  retries: 999999 * 99999,
  workers: 2,
  use: {
    userAgent: 'AndroidApp/2.1.0 (Android; Mobile; 12; MZB0DKLRU Build/SKQ1.211202.001)',
    baseURL: 'https://www.logitycoon.com/',
    actionTimeout: 30000,
    navigationTimeout: 40000,
    extraHTTPHeaders: {
      eu1_extracheck: '0',
    },
  },
  projects: [
    {
      name: 'main',
      testMatch: 'src/script/main.test.ts',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
};

export default config;
