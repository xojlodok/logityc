import { Page, Locator } from '@playwright/test';

export const clickIsVisible = async (locator: Locator) => {
  if (await locator.isVisible()) {
    await locator.click();
  }
};

export function getRandomInt(max: number) {
  return Math.floor(Math.random() * max);
}

export async function getMyMoney(page: Page): Promise<number> {
  return Number((await page.locator('[class="balance"]').innerText()).replace(/[^0-9]/g, ''));
}

export const smallTimeout = async (page: Page) => {
  await page.waitForTimeout(Number(process.env.SMALLTIMEOUT) || 1);
};
