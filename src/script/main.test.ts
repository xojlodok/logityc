import { refuelAllCars } from '../utils/method';
import { clickIsVisible } from './../utils/utils';
import { Locator, Page, test } from '@playwright/test';
require('dotenv').config();

let i: number = 0;
let page: Page;
let warehouse: Locator;
let avaliableCountLocator: Locator;
let trips: Locator;
let avaliableTrip: Locator;
let workers: Locator;
let garage: Locator;
let tableAvaliable: Locator;
let rowAvaliable: Locator;
let orderNumber: Locator;
let actionTitle: Locator;
let actionButton: Locator;
let selectRandomWorkers: Locator;
let selectRandomTruck: Locator;
let selectRandonTrailer: Locator;
let workerToSleep: Locator;
let activeRepairButton: Locator;

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage();
  warehouse = page.locator('[id="menuitem-warehouse"]');
  avaliableCountLocator = page.locator('[id="tripsavailableamount"]');
  trips = page.locator('[id="menuitem-trips"]');
  avaliableTrip = page
    .locator('[class="type1"]')
    .filter({ has: page.locator('[title="Грузовики - Доступно"]') })
    .filter({ has: page.locator('[title="Прицепы - Доступно"]') })
    .filter({ has: page.locator('[title="Сотрудники - Доступно"]') });
  workers = page.locator('[id="menuitem-employees"]');
  garage = page.locator('[id="menuitem-garage"]');
  tableAvaliable = page.locator('[id="tbody-available"]');
  rowAvaliable = tableAvaliable.locator('tr');
  orderNumber = rowAvaliable.locator('td').nth(4);
  actionTitle = page.locator('[class="portlet-wtitle"]').first();

  selectRandomWorkers = page
    .locator('[class="portlet blue-hoki box"]', { hasText: /Доступно/ })
    .getByText('Случайный');

  selectRandomTruck = page
    .locator('[class="portlet purple-plum box"]', { hasText: /Доступно/ })
    .getByText('Случайный');

  selectRandonTrailer = page
    .locator('[class="portlet red-sunglo box"]', { hasText: /Доступно/ })
    .getByText('Случайный');

  actionButton = actionTitle.locator('button').first();
  workerToSleep = page
    .locator('tr', { hasText: 'Ничего' })
    .and(page.locator('tr', { hasNotText: '100%' }))
    .first();
  activeRepairButton = page
    .locator('[class="mt-action-row"]', { hasText: /Ничего/ })
    .locator('[class="btn btn-outline blue btn-sm"]', {
      hasText: 'Ремонт',
    });
});

test('main script', async () => {
  await page.goto('?lang=ru-RU');
  await page.getByPlaceholder('E-mail').fill(process.env.LOGIN as string);
  await page.getByPlaceholder('Пароль').fill(process.env.PASS as string);
  await page.keyboard.press('Enter');

  while (true) {
    // Заправка
    await refuelAllCars(page);
    await page.waitForTimeout(1000);

    // Ремонт
    // TODO gotogarage
    await garage.click();
    await page.waitForTimeout(700);

    for (const repair of await activeRepairButton.all()) {
      await clickIsVisible(repair);
    }

    // TODO gotoWarehouse(page)
    await warehouse.click();

    let orderNumberArray = [];
    for (const row of await rowAvaliable.all()) {
      orderNumberArray.push(await row.locator('td').nth(4).textContent());
    }

    for (const orderNumber of orderNumberArray) {
      await page.locator('td', { hasText: orderNumber }).nth(1).click();
      // await page.waitForLoadState('domcontentloaded');
      await clickIsVisible(selectRandomWorkers);
      await selectRandomWorkers.waitFor({ state: 'hidden' });
      await clickIsVisible(selectRandomTruck);
      await selectRandomTruck.waitFor({ state: 'hidden' });
      await clickIsVisible(selectRandonTrailer);
      await selectRandonTrailer.waitFor({ state: 'hidden' });
      await page.waitForLoadState('domcontentloaded');
      await clickIsVisible(actionButton);
      await page.waitForLoadState('domcontentloaded');
    }

    await warehouse.click();
    await avaliableCountLocator.waitFor();

    let availableCount = Number(await avaliableCountLocator.textContent());

    // TODO goToTrips
    await trips.click();
    if (availableCount == 0 && (await avaliableTrip.first().isVisible())) {
      await page.waitForLoadState('domcontentloaded');
      await avaliableTrip.first().click();
      await page.locator('[id="submit-trips"]').click();
      await page.waitForLoadState('domcontentloaded');
    }

    // TODO  gotoWorkers
    await workers.click();
    await page.waitForTimeout(700);

    if (await workerToSleep.isVisible()) {
      await clickIsVisible(workerToSleep.first());
      await page.getByText('Сон').click();
    }

    // await clickIsVisible(activeRepairButton.first());
    await warehouse.click();
    await page.waitForTimeout(10 * 1000);
    console.log(i++);
  }
});
