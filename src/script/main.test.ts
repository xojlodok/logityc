import { goToWarehouse, refuelAllCars, repairAllCars } from '../utils/method';
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
let workersBlock: Locator;
let truckBlock: Locator;
let trailerBlock: Locator;
let selectRandomWorkers: Locator;
let selectRandomTruck: Locator;
let selectRandomTrailer: Locator;

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage();
  warehouse = page.locator('[id="menuitem-warehouse"]');
  avaliableCountLocator = page.locator('[id="tripsavailableamount"]');
  trips = page.locator('[id="menuitem-trips"]');
  avaliableTrip = page
    .locator('[class="type1"]')
    .or(page.locator('[class="type2"]'))
    .or(page.locator('[class="type3"]'))
    .or(page.locator('[class="type4"]'))
    .filter({ has: page.locator('[title="Грузовики - Доступно"]') })
    .filter({ has: page.locator('[title="Прицепы - Доступно"]') })
    .filter({ has: page.locator('[title="Сотрудники - Доступно"]') });
  workers = page.locator('[id="menuitem-employees"]');
  garage = page.locator('[id="menuitem-garage"]');
  tableAvaliable = page.locator('[id="tbody-available"]');
  rowAvaliable = tableAvaliable.locator('tr');
  orderNumber = rowAvaliable.locator('td').nth(4);

  workersBlock = page.locator('[class="portlet blue-hoki box"]');
  selectRandomWorkers = workersBlock
    .filter({ hasText: /Доступно/ })
    .filter({ hasNotText: '0 Доступно' })
    .getByText('Случайный');

  truckBlock = page.locator('[class="portlet purple-plum box"]');
  selectRandomTruck = truckBlock
    .filter({ hasText: /Доступно/ })
    .filter({ hasNotText: '0 Доступно' })
    .getByText('Случайный');

  trailerBlock = page.locator('[class="portlet red-sunglo box"]');
  selectRandomTrailer = trailerBlock
    .filter({ hasText: /Доступно/ })
    .filter({ hasNotText: '0 Доступно' })
    .getByText('Случайный');

  actionTitle = page.locator('[class="portlet-title"]').first();
  actionButton = actionTitle.locator('button').first();
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
    await repairAllCars(page);
    await page.waitForTimeout(1000);

    await goToWarehouse(page);

    let orderNumberArray = [];
    for (const row of await rowAvaliable.all()) {
      orderNumberArray.push(await row.locator('td').nth(4).textContent());
    }

    for (const orderNumber of orderNumberArray) {
      await page
        .locator('tr')
        .locator('[class="hidden-xs"]', { hasText: orderNumber })
        .first()
        .click();
      await page.locator('h1', { hasText: 'Груз' }).waitFor();

      let textButton = ((await actionButton.textContent()) as string).replace(/\s+/g, '');

      switch (textButton) {
        case 'Погрузить':
          if (
            (await selectRandomWorkers.isVisible()) ||
            (await selectRandomTruck.isVisible()) ||
            (await selectRandomTrailer.isVisible())
          ) {
            await clickIsVisible(selectRandomWorkers);
            await clickIsVisible(selectRandomTruck);
            await clickIsVisible(selectRandomTrailer);
            await selectRandomWorkers.waitFor({ state: 'hidden' });
            await selectRandomTruck.waitFor({ state: 'hidden' });
            await selectRandomTrailer.waitFor({ state: 'hidden' });
          }
          await clickIsVisible(actionButton);
          await page.getByText('Погрузка...').waitFor({ state: 'hidden' });
          break;
        case 'Впуть':
          if (
            (await selectRandomWorkers.isVisible()) ||
            (await selectRandomTruck.isVisible()) ||
            (await selectRandomTrailer.isVisible())
          ) {
            await clickIsVisible(selectRandomWorkers);
            await clickIsVisible(selectRandomTruck);
            await clickIsVisible(selectRandomTrailer);
            await selectRandomWorkers.waitFor({ state: 'hidden' });
            await selectRandomTruck.waitFor({ state: 'hidden' });
            await selectRandomTrailer.waitFor({ state: 'hidden' });
          }
          await clickIsVisible(actionButton);
          await page.getByText('В пути...').waitFor({ state: 'hidden' });
          break;
        case 'Разгрузить':
          await clickIsVisible(actionButton);
          await page.getByText('Разгрузка...').waitFor({ state: 'hidden' });
          break;
        case 'Завершить':
          await actionButton.click();
          await page.getByText(' Завершение... ').waitFor({ state: 'hidden' });
          break;
      }

      await warehouse.click();
      await avaliableCountLocator.waitFor();
    }

    await warehouse.click();
    await avaliableCountLocator.waitFor();

    let getNewTrip = await rowAvaliable.filter({ hasText: 'Принят' }).first().isHidden();

    if (getNewTrip) {
      let countryNameArray = [];
      // TODO goToTrips
      await trips.click();
      await page.locator('h1', { hasText: 'Путешествия - Доступно' }).waitFor();
      for (const trip of await avaliableTrip.all()) {
        countryNameArray.push(await trip.locator('td').nth(2).innerText());
      }
      let uniqueTripName = [...new Set(countryNameArray)];

      await page.waitForLoadState('networkidle');

      for (const uniqueName of uniqueTripName) {
        await avaliableTrip.filter({ hasText: uniqueName }).first().click();
        await page.locator('[id="submit-trips"]').click();
        await page.waitForTimeout(1000);
      }
    }

    await page.waitForTimeout(5000);
    console.log(i++);
  }
});
