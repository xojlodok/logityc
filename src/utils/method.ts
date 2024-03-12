import { Page } from '@playwright/test';
import { clickIsVisible } from './utils';

export const refuelAllCars = async (page: Page) => {
  let fuelStation = page.locator('[id="menuitem-fuelstation"]');
  let refuelButton = page.getByText('Обычная заправка');

  await fuelStation.click();
  await page.locator('h1', { hasText: 'Заправка' }).waitFor();
  await page.waitForTimeout(4000);

  let tabLocator = page.locator('[class="nav nav-tabs nav-tabs-lg"]').locator('li');

  for (const tab of await tabLocator.all()) {
    await clickIsVisible(tab);
    await page.waitForTimeout(3000);

    await clickIsVisible(refuelButton.first());
    await refuelButton.first().waitFor({ state: 'hidden' });
  }
};

export const repairAllCars = async (page: Page) => {
  let garage = page.locator('[id="menuitem-garage"]');
  let activeRepairButton = page
    .locator('[class="mt-action-row"]', { hasText: /Действие: Ничего/ })
    .locator('[class="mt-action-buttons hidden-xs hidden-xsm"]')
    .locator('[class="btn btn-outline blue btn-sm"]', {
      hasText: 'Ремонт',
    });

  await garage.click();
  await page.locator('h1', { hasText: 'Гараж' }).waitFor();
  while (await activeRepairButton.first().isVisible()) {
    await activeRepairButton.first().click();
    await page.waitForTimeout(300);
  }
};

export const goToWarehouse = async (page: Page) => {
  let warehouse = page.locator('[id="menuitem-warehouse"]');

  await warehouse.click();
  await page.locator('h1', { hasText: 'Склад' }).waitFor();
};
