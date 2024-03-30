import { Page } from '@playwright/test';

export const refuelAllCars = async (page: Page) => {
  let fuelStation = page.locator('[id="menuitem-fuelstation"]');
  let refuelButton = page.locator('button', { hasText: 'Корпорация' });
  // .or(page.locator('button', { hasText: 'Обычная заправка' }));

  await fuelStation.click();
  await page.locator('h1', { hasText: 'Заправка' }).waitFor();

  let tabLocator = page.locator('[class="nav nav-tabs nav-tabs-lg"]').locator('li');

  for (const tab of (await tabLocator.all()).reverse()) {
    await tab.click();
    await page.waitForTimeout(1000);
    for (const button of (await refuelButton.all()).reverse()) {
      await button.waitFor();
      await button.click();
      await page.waitForLoadState('networkidle');
    }
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
  let readyBlock = page.locator('[class="mt-action"]', { has: activeRepairButton });

  await garage.click();
  await page.locator('h1', { hasText: 'Гараж' }).waitFor();
  for (const iterator of (await readyBlock.all()).reverse()) {
    let persent = Number(
      (await iterator.locator('b', { hasText: '%' }).innerText()).replace(/[^0-9]/g, ''),
    );

    if (persent < 80) {
      iterator
        .locator('[class="btn btn-outline blue btn-sm"]', {
          hasText: 'Ремонт',
        })
        .first()
        .click();
    }
  }
  // while (await activeRepairButton.first().isVisible()) {
  // await activeRepairButton.first().click();
  // await page.waitForTimeout(300);
  // }
};

export const goToWarehouse = async (page: Page) => {
  let warehouse = page.locator('[id="menuitem-warehouse"]');

  await warehouse.click();
  await page.locator('h1', { hasText: 'Склад' }).waitFor();
};

export const donateToSavingAccount = async (page: Page) => {
  let donateButton = page.locator('[type="submit"]', { hasText: 'Сберегательный счет' });
  let noteWarning = page.locator('[class="note note-warning"]');

  await page.goto('/eu1/index.php?a=companybank', { waitUntil: 'commit' });
  await page.locator('h1', { hasText: 'Банковский счёт' }).waitFor();

  if (await noteWarning.isHidden()) {
    await page.waitForLoadState('networkidle');

    await donateButton.waitFor();
    await page.locator('[id="money"]').fill('1000000');
    await donateButton.click();
  }
};
