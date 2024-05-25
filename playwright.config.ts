import { PlaywrightTestConfig, devices } from '@playwright/test';

const config: PlaywrightTestConfig = {
  timeout: 1000 * 60 * 9999,
  testDir: 'src',
  retries: 999999 * 99999,
  workers: 2,
  reporter: 'null',
  use: {
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
