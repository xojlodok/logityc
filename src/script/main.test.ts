import {
  donateToSavingAccount,
  goToWarehouse,
  refuelAllCars,
  repairAllCars,
} from '../utils/method';
import { clickIsVisible, getMyMoney, getRandomInt } from './../utils/utils';
import { Locator, Page, expect, test } from '@playwright/test';
require('dotenv').config();
import { Api } from 'grammy';

let i: number = 0;
let page: Page;
let warehouse: Locator;
let avaliableCountLocator: Locator;
let trips: Locator;
let avaliableTrip: Locator;
let workers: Locator;
let garage: Locator;
let contracts: Locator;
let tableAvaliable: Locator;
let rowAvaliable: Locator;
let redAvaliable: Locator;
let orderNumber: Locator;
let actionTitle: Locator;
let actionButton: Locator;
let workersBlock: Locator;
let truckBlock: Locator;
let trailerBlock: Locator;
let selectRandomWorkers: Locator;
let selectRandomTruck: Locator;
let selectRandomTrailer: Locator;
let seasonBlockOnMain: Locator;
let season: string;
let tireChanged: number;
let botapi;

test.beforeAll(async ({ browser }, testInfo) => {
  page = await browser.newPage();
  botapi = new Api(process.env.BOT_TOKEN as string);

  await page.goto('?lang=ru-RU');
  await page.getByPlaceholder('E-mail').fill(process.env.LOGIN as string);
  await page.getByPlaceholder('Пароль').fill(process.env.PASS as string);
  await page.keyboard.press('Enter');
  await page.locator('h1', { hasText: 'Главная' }).waitFor();

  seasonBlockOnMain = page
    .locator('[class="number"]', { hasText: 'Текущее время года' })
    .locator('h3');

  if (testInfo.retry % 10 == 0) {
    await botapi.sendMessage(
      process.env.CHAT_ID as string,
      `Я запустился ${testInfo.retry} ретрай`,
    );
  }
});

test.beforeEach(async () => {
  warehouse = page.locator('[id="menuitem-warehouse"]');
  avaliableCountLocator = page.locator('[id="tripsavailableamount"]');
  trips = page.locator('[id="menuitem-trips"]');
  avaliableTrip = page
    .locator('[class="type1"]')
    .or(page.locator('[class="type2"]'))
    .or(page.locator('[class="type3"]'))
    .or(page.locator('[class="type4"]'))
    .or(page.locator('[class="type5"]'))
    .or(page.locator('[class="type6"]'))
    .or(page.locator('[class="type7"]'))
    .or(page.locator('[class="type8"]'))
    .or(page.locator('[class="type9"]'))
    .filter({ has: page.locator('[title="Грузовики - Доступно"]') })
    .filter({ has: page.locator('[title="Прицепы - Доступно"]') })
    .filter({ has: page.locator('[title="Сотрудники - Доступно"]') });
  redAvaliable = page
    .locator('tr')
    .filter({ has: page.locator('[title="Грузовики - Не доступно"]') })
    .filter({ has: page.locator('[title="Прицепы - Не доступно"]') })
    .filter({ has: page.locator('[title="Сотрудники - Не доступно"]') })
    .first();
  workers = page.locator('[id="menuitem-employees"]');
  garage = page.locator('[id="menuitem-garage"]');
  contracts = page.locator('[id="menuitem-contracts"]');
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
  tireChanged = 0;
});

test('main script', async ({ viewport }, testInfo) => {
  if (
    (await page.locator('[class="portlet-body captcha_portlet"]').isVisible()) &&
    testInfo.retry % 7 == 0
  ) {
    await botapi.sendMessage(process.env.CHAT_ID as string, `ВИЖУ КАПЧУ, ПРОЙДИ ${testInfo.retry}`);
    await page.waitForTimeout(20000);
    expect(1).toBe(2);
  }
  switch (await seasonBlockOnMain.first().innerText()) {
    case 'Весна':
    case 'Лето':
      season = 'Лето';
      break;
    case 'Осень':
    case 'Зима':
      season = 'Зима';
      break;
  }

  while (true) {
    if ((await getMyMoney(page)) > 5000000) {
      await donateToSavingAccount(page);
    }

    // Проверка контракта на починку

    // await contracts.click();
    // await page.locator('h1', { hasText: 'Контракты' }).waitFor();
    // await page.locator('.portlet', { hasText: 'Принятые контракты' }).locator();
    // TODO ТУТ Я ДЕЛАЮ ПРОВЕРКУ НА КОНТРАКТЫ И ПУЛЧЕНИЕ

    // Заправка
    await refuelAllCars(page);
    await page.waitForTimeout(1000);

    // Ремонт
    await repairAllCars(page);
    await page.waitForTimeout(1000);

    await goToWarehouse(page);

    if (await redAvaliable.isVisible()) {
      await redAvaliable.click();
      await page.getByText('Отменить').click();
      await page.getByText('Да, я хочу отменить эту доставку.').click();
    }

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
            await clickIsVisible(actionButton);
            await page.getByText(' Погрузка... ').first().waitFor();
          }
          if (await actionButton.filter({ hasText: 'Погрузить' }).isVisible()) {
            await actionButton.filter({ hasText: 'Погрузить' }).click();
            await page.getByText(' Погрузка... ').first().waitFor();
          }
          break;
        case 'Впуть':
          if (
            (await selectRandomWorkers.isVisible()) ||
            (await selectRandomTruck.isVisible()) ||
            (await selectRandomTrailer.isVisible()) ||
            ((await truckBlock.filter({ hasText: ' Заправка ' }).isHidden()) &&
              (await truckBlock.filter({ hasText: ' Обслуживается ' }).isHidden()))
          ) {
            await clickIsVisible(selectRandomWorkers);
            await clickIsVisible(selectRandomTruck);
            await clickIsVisible(selectRandomTrailer);
            await selectRandomWorkers.waitFor({ state: 'hidden' });
            await selectRandomTruck.waitFor({ state: 'hidden' });
            await selectRandomTrailer.waitFor({ state: 'hidden' });
            let tirePercent = (
              await truckBlock
                .locator('div', {
                  has: page.locator('[data-tooltip="Летние шины"]'),
                })
                .or(
                  truckBlock.locator('div', {
                    has: page.locator('[data-tooltip="Зимние шины"]'),
                  }),
                )
                .last()
                .innerText()
            ).replace(/[^0-9]/g, '');

            if (Number(tirePercent) <= 17) {
              let url = page.url();
              await truckBlock.getByText('Информация').click();
              await page.locator('h1', { hasText: 'Грузовик - Информация' }).waitFor();
              await page
                .locator('[class="portlet light bordered"]', {
                  hasText: 'Шины',
                })
                .getByText('Изменить')
                .click();
              await page.locator('tr', { hasText: season }).last().getByText('Выбрать').click();
              await page.locator('h1', { hasText: 'Грузовик - Информация' }).waitFor();
              tireChanged++;
              await page.goto(url, { waitUntil: 'commit' });
              await actionButton.waitFor();
              await page.waitForTimeout(2000);
            }

            await clickIsVisible(actionButton);
            await page.getByText(' В пути... ').first().waitFor({ timeout: 20000 });
          }

          break;
        case 'Разгрузить':
          if (
            (await workersBlock.filter({ hasText: /Болен/ }).isHidden()) &&
            (await workersBlock.filter({ hasText: /0 Доступно/ }).isHidden()) &&
            (await trailerBlock.filter({ hasText: /Обслуживается/ }).isHidden())
          ) {
            await clickIsVisible(actionButton);
            await page.getByText(' Разгрузка... ').first().waitFor();
          }
          break;
        case 'Завершить':
          if (
            (await workersBlock.getByText('0 Доступно').isHidden()) ||
            (await workersBlock.getByText('10 Доступно').isVisible())
          ) {
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

      // await page.waitForTimeout(2000);
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

        // Выбор заказа
        await trip.first().click();
        await page.locator('[id="submit-trips"]').click();
        await page.waitForTimeout(1000);
      }
    }

    await page.waitForTimeout(30 * 1000);
    console.log(i++);
  }
});
