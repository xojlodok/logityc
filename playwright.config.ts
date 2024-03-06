import { PlaywrightTestConfig, devices } from '@playwright/test';

const config: PlaywrightTestConfig = {
  timeout: 1000 * 60 * 10,
  testDir: 'src',
  outputDir: 'test-results/',
  retries: 999999 * 99999,
  workers: 2,
  use: {
    baseURL: 'https://www.logitycoon.com/',
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
