import { Page } from '@playwright/test';
import { season } from '../script/main.test';
import { smallTimeout } from './utils';

export const refuelAllCars = async (page: Page) => {
  let fuelStation = page.locator('[id="menuitem-fuelstation"]');
  let refuelButton = page
    .locator('button', { hasText: 'Корпорация' })
    .or(page.locator('button', { hasText: 'Обычная заправка' }));

  await fuelStation.click();
  await page.locator('h1', { hasText: 'Заправка' }).waitFor();

  let tabLocator = page.locator('[class="nav nav-tabs nav-tabs-lg"]').locator('li');

  for (const tab of (await tabLocator.all()).reverse()) {
    await tab.click();
    await page.waitForLoadState('domcontentloaded');
    await smallTimeout(page);
    for (const button of (await refuelButton.all()).reverse()) {
      let refId = await button.getAttribute('onclick');
      let id = refId?.replace(/[^0-9]/g, '');

      await page.request.get(`https://www.logitycoon.com/eu1/ajax/fuelstation_refuelc.php`, {
        params: { x: id, p: 1, returnfr: 0 },
      });

      await page.request.get(`https://www.logitycoon.com/eu1/ajax/fuelstation_refuel.php`, {
        params: { x: id, p: 1, returnfr: 0 },
      });
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
      await iterator
        .locator('[class="btn btn-outline blue btn-sm"]', {
          hasText: 'Ремонт',
        })
        .first()
        .click();
      await smallTimeout(page);
    }
  }
};

export const goToWarehouse = async (page: Page) => {
  let warehouse = page.locator('[id="menuitem-warehouse"]');

  await warehouse.click();
  await page.locator('h1', { hasText: 'Склад' }).waitFor();
  await smallTimeout(page);
};

export const goToGarage = async (page: Page) => {
  await page.goto('eu1/index.php?a=garage');
  await page.locator('h1', { hasText: 'Гараж' }).waitFor();
};

export const donateToSavingAccount = async (page: Page) => {
  let donateButton = page.locator('[type="submit"]', { hasText: 'Сберегательный счет' });
  let noteWarning = page.locator('[class="note note-warning"]');

  await page.goto('/eu1/index.php?a=companybank', { waitUntil: 'commit' });
  await page.locator('h1', { hasText: 'Банковский счёт' }).waitFor();
  await smallTimeout(page);

  if (await noteWarning.isHidden()) {
    await page.waitForLoadState('networkidle');

    await donateButton.waitFor();
    await page.locator('[id="money"]').fill('1000000');
    await donateButton.click();
    await smallTimeout(page);
  }
};

export const rebuyTires = async (page: Page) => {
  await page.goto('eu1/index.php?a=company_tires');
  await page.locator('h1', { hasText: 'Гараж' }).waitFor();

  let tireRow = page.locator('tbody tr', { hasText: season });

  for (const tire of (await tireRow.all()).reverse()) {
    //  Продаем старые колеса
    if (Number((await tire.locator('td').nth(2).innerText()).replace(/[^0-9]/g, '')) <= 17) {
      await tire.getByText('Продать').click();
      await page.waitForTimeout(1000);
    }
  }

  let tireCount = await page.locator('tbody tr', { hasText: season }).count();

  // Покупаем новые колеса если осталось 2 шт
  if (tireCount <= 2) {
    await page.goto('eu1/index.php?a=shopcompany&p=tires');
    for (let q = 0; q < 10; q++) {
      await page
        .locator('[class="mt-action"]', { hasText: season.slice(0, -1) })
        .getByText('Купить')
        .click();
      await page.waitForTimeout(1000);
    }
  }
};

export async function blockUselessRequests(page: Page) {
  await page.route(/googlesyndication/, route => route.abort());
  await page.route(/responsive.css/, route => route.abort());
  await page.route(/extra.css/, route => route.abort());
  await page.route(/simple-line-icons.css/, route => route.abort());
  await page.route(/logo.png/, route => route.abort());
  await page.route(/FontAwesome.min.css/, route => route.abort());
  await page.route(/content_style.css/, route => route.abort());
  await page.route(/content.css/, route => route.abort());
  await page.route(/fonts.googleapis.com/, route => route.abort());
}

export async function upgradeEmployee(page: Page) {
  let employeesUrl = '/eu1/index.php?a=employees';
  let trDriver = page.locator('.portlet', { hasText: 'Водители' }).locator('tr');
  let trLowDriver = trDriver.filter({ hasNotText: 'Тяжелый' }).filter({ hasText: 'Ничего' });

  await page.goto(employeesUrl);
  await page.locator('h1', { hasText: 'Ваши сотрудники' }).waitFor();
  for (const lowDriver of (await trLowDriver.all()).reverse()) {
    await lowDriver.click();
    await page.locator('h1', { hasText: 'Сотрудники - Информация' }).waitFor();
    await page.getByText('Улучшить').click();
    await page.locator('h1', { hasText: ' Сотрудники - Водительские права' }).waitFor();
    while (await page.getByText('Экзамен').isVisible()) {
      await page.getByText('Экзамен').click();
      await page.waitForLoadState('networkidle');
    }
    await page.goto(employeesUrl);
    await page.locator('h1', { hasText: 'Ваши сотрудники' }).waitFor();
  }
}
