import { goToWarehouse, refuelAllCars, repairAllCars } from '../utils/method';
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
let selectRandomTrailer: Locator;
let seasonIcon: Locator;
let season: string;
let tireChanged: number;

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
  seasonIcon = page.locator('[class="page-bar"]').locator('[class="fa fa-sun font-red-sunglo"]');
  tireChanged = 0;
});

test('main script', async () => {
  await page.goto('?lang=ru-RU');
  await page.getByPlaceholder('E-mail').fill(process.env.LOGIN as string);
  await page.getByPlaceholder('Пароль').fill(process.env.PASS as string);
  await page.keyboard.press('Enter');
  await page.locator('h1', { hasText: 'Главная' }).waitFor();

  while (true) {
    (await seasonIcon.isVisible()) ? (season = 'Лето') : (season = 'Зима');

    // if (1 == 1) {
    //   await page.goto('https://www.logitycoon.com/eu1/index.php?a=company_tires', {
    //     waitUntil: 'commit',
    //   });
    //   await page.locator('h1', { hasText: 'Гараж' }).waitFor();

    //   let percentsArray: string[] = [];
    //   let tireRow: Locator = page.locator('tbody').locator('tr');
    //   for (const tireItem of await tireRow.all()) {
    //     percentsArray.push(await tireItem.locator('td').nth(2).innerText());
    //   }

    //   console.log(percentsArray);
    // }

    // Заправка
    await refuelAllCars(page);

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
          await page.getByText(' Погрузка... ').first().waitFor();
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
          let tirePercent = (
            await truckBlock
              .locator('div', { has: page.locator('[data-tooltip="Летние шины"]') })
              .or(truckBlock.locator('div', { has: page.locator('[data-tooltip="Зимние шины"]') }))
              .last()
              .innerText()
          ).replace(/[^0-9]/g, '');

          if (Number(tirePercent) < 15) {
            let url = page.url();
            await truckBlock.getByText('Информация').click();
            await page.locator('h1', { hasText: 'Грузовик - Информация' }).waitFor();
            await page
              .locator('[class="portlet light bordered"]', { hasText: 'Шины' })
              .getByText('Изменить')
              .click();
            await page.locator('tr', { hasText: season }).last().getByText('Выбрать').click();
            await page.locator('h1', { hasText: 'Грузовик - Информация' }).waitFor();
            tireChanged++;
            await page.goto(url, { waitUntil: 'commit' });
            await actionButton.waitFor();
          }

          await clickIsVisible(actionButton);
          await page.getByText(' В пути... ').first().waitFor();
          break;
        case 'Разгрузить':
          if (
            (await trailerBlock.getByText('Обслуживается').isHidden()) &&
            (await workersBlock.getByText('Болен').isHidden()) &&
            (await workersBlock.getByText('0 Доступно').isHidden())
          ) {
            await clickIsVisible(actionButton);
            await page.getByText(' Разгрузка... ').first().waitFor();
          }
          break;
        case 'Завершить':
          if (await workersBlock.getByText('0 Доступно').isHidden()) {
            await actionButton.click();
            await page.getByText(' Завершение... ').first().waitFor();
          }
          break;
        case 'Продолжитьдоставку':
          if (await truckBlock.getByText('Заправка').isHidden()) {
            await clickIsVisible(actionButton);
            await page.getByText(' В пути... ').first().waitFor();
          }
          break;
      }

      await page.waitForTimeout(2000);
      await warehouse.click();
      await avaliableCountLocator.waitFor();
    }

    await warehouse.click();
    await avaliableCountLocator.waitFor();

    let getNewTrip = await rowAvaliable.filter({ hasText: 'Принят' }).first().isHidden();

    // TODO goToTrips
    await trips.click();
    await page.locator('h1', { hasText: 'Путешествия - Доступно' }).waitFor();
    if (getNewTrip && (await avaliableTrip.first().isVisible())) {
      let countryNameArray = [];
      for (const trip of await avaliableTrip.all()) {
        countryNameArray.push(await trip.locator('td').nth(2).innerText());
      }
      let uniqueTripName = [...new Set(countryNameArray)];

      await page.waitForLoadState('networkidle');
      for (const uniqueName of uniqueTripName) {
        let trip = avaliableTrip.filter({ hasText: uniqueName });

        await trip.nth(getRandomInt((await trip.count()) - 1)).click();
        await page.locator('[id="submit-trips"]').click();
        await page.waitForTimeout(1000);
      }
    }

    await page.waitForTimeout(10 * 1000);
    console.log(i++);
  }
});
