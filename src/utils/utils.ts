import { Locator } from '@playwright/test';

export const clickIsVisible = async (locator: Locator) => {
  if (await locator.isVisible()) {
    await locator.click();
  }
};

export function getRandomInt(max: number) {
  return Math.floor(Math.random() * max);
}
