import { Locator } from '@playwright/test';

export const clickIsVisible = async (locator: Locator) => {
  if (await locator.isVisible()) {
    await locator.click();
  }
};
