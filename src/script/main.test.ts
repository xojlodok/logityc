import { refuelAllCars } from '../utils/method';
import { clickIsVisible, getRandomInt } from './../utils/utils';
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
let workersBlock: Locator;
let truckBlock: Locator;
let trailerBlock: Locator;
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

  workersBlock = page.locator('[class="portlet blue-hoki box"]');
  selectRandomWorkers = workersBlock.filter({ hasText: /Доступно/ }).getByText('Случайный');

  truckBlock = page.locator('[class="portlet purple-plum box"]');
  selectRandomTruck = truckBlock.filter({ hasText: /Доступно/ }).getByText('Случайный');

  trailerBlock = page.locator('[class="portlet red-sunglo box"]');
  selectRandonTrailer = trailerBlock.filter({ hasText: /Доступно/ }).getByText('Случайный');

  actionTitle = page.locator('[class="portlet-title"]').first();
  actionButton = actionTitle.locator('button').first();

  workerToSleep = page
    .locator('tr', { hasText: 'Ничего' })
    .and(page.locator('tr', { hasNotText: '100%' }))
    .first();
  activeRepairButton = page
    .locator('[class="mt-action-row"]', { hasText: /Действие: Ничего/ })
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
    let SRWORKER = 0;
    let SRTRACK = 0;
    let SRTRAILER = 0;
    let actionButtonClickCount = 0;
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
      await page.locator('tr').locator('[class="hidden-xs"]', { hasText: orderNumber }).click();
      await page.waitForTimeout(2000);

      while ((await selectRandomWorkers.isVisible()) && SRWORKER < 3) {
        await selectRandomWorkers.click();
        await page.waitForTimeout(5000);
        SRWORKER++;
      }
      while ((await selectRandomTruck.isVisible()) && SRTRACK < 3) {
        await selectRandomTruck.click();
        await page.waitForTimeout(5000);
        SRTRACK++;
      }
      while ((await selectRandonTrailer.isVisible()) && SRTRAILER < 3) {
        await selectRandonTrailer.click();
        await page.waitForTimeout(5000);
        SRTRAILER++;
      }

      console.log((await actionButton.textContent())?.replace(/\s+/g, ''));

      await clickIsVisible(actionButton);
      await page.waitForTimeout(1000);
      while (
        (await page.getByText('Готов к следующему действию: Сейчас!').isVisible()) &&
        actionButtonClickCount < 3
      ) {
        await clickIsVisible(actionButton);
        await page.waitForTimeout(5000);
        actionButtonClickCount++;
      }

      await warehouse.click();
      await avaliableCountLocator.waitFor();
    }

    await warehouse.click();
    await avaliableCountLocator.waitFor();

    let availableCount = Number(await avaliableCountLocator.textContent());

    if (availableCount == 0) {
      // TODO goToTrips
      await trips.click();
      if (await avaliableTrip.first().isVisible()) {
        await page.waitForTimeout(3000);

        let tripCount = (await avaliableTrip.count()) - 1;

        await avaliableTrip.nth(getRandomInt(tripCount)).click();

        await page.waitForTimeout(2000);
        await page.locator('[id="submit-trips"]').scrollIntoViewIfNeeded();
        await page.locator('[id="submit-trips"]').click();
        await page.pause();
        await page.waitForTimeout(2000);
        // await page.waitForLoadState('domcontentloaded');
      }
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
    // await page.waitForTimeout(10 * 1000);
    console.log(i++);
  }
});
