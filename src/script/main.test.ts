import { log } from 'console';
import {
  blockUselessRequests,
  donateToSavingAccount,
  goToGarage,
  goToWarehouse,
  rebuyTires,
  refuelAllCars,
  repairAllCars,
  upgradeEmployee,
} from '../utils/method';
import { clickIsVisible, getMyMoney, getRandomInt, smallTimeout } from './../utils/utils';
import { Locator, Page, expect, test } from '@playwright/test';
require('dotenv').config();
import { Api } from 'grammy';

let i: number = 0;
let page: Page;
let context;
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
export let season: string;
let actualHour: number;
let botapi;

// Авторизация + установка сезона
test.beforeAll(async ({ browser }, testInfo) => {
  page = await browser.newPage({ userAgent: 'AndroidApp-3.19' });
  botapi = new Api(process.env.BOT_TOKEN as string);

  await blockUselessRequests(page);
  await page.request.post('https://www.logitycoon.com/eu1/process_login.php', {
    form: { email: process.env.LOGIN as string, password: process.env.PASS as string },
    params: { lang: 'ru-RU' },
  });
  await page.goto('/eu1/');

  seasonBlockOnMain = page
    .locator('[class="number"]', { hasText: 'Текущее время года' })
    .locator('h3');

  actualHour = new Date().getUTCHours();
  if (testInfo.retry % 10 == 0 && actualHour < 19 && actualHour > 4) {
    await botapi.sendMessage(
      process.env.CHAT_ID as string,
      `Я запустился ${testInfo.retry} ретрай`,
    );
  }
});

// Локаторы
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
    .filter({ hasNotText: / 0 Доступно / })
    .filter({ hasNotText: / Спит/ })
    .getByText('Случайный');

  truckBlock = page.locator('[class="portlet purple-plum box"]');
  selectRandomTruck = truckBlock
    .filter({ hasText: /Доступно/ })
    .filter({ hasNotText: / 0 Доступно / })
    .filter({ hasNotText: / Спит/ })
    .getByText('Случайный');

  trailerBlock = page.locator('[class="portlet red-sunglo box"]');
  selectRandomTrailer = trailerBlock
    .filter({ hasText: /Доступно/ })
    .filter({ hasNotText: / 0 Доступно / })
    .getByText('Случайный');

  actionTitle = page.locator('[class="portlet-title"]').first();
  actionButton = actionTitle.locator('button').first();
});

test('@main script', async ({}, testInfo) => {
  actualHour = new Date().getUTCHours();
  if (
    (await page.locator('[class="portlet-body captcha_portlet"]').isVisible()) &&
    testInfo.retry % 7 == 0
  ) {
    if (actualHour < 19 && actualHour > 4) {
      await botapi.sendMessage(
        process.env.CHAT_ID as string,
        `ВИЖУ КАПЧУ, ПРОЙДИ ${testInfo.retry}`,
      );
    }
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

    // Ремонт
    await repairAllCars(page);

    // Работаем с колесами
    if (i % 5 == 0) {
      await rebuyTires(page);
    }

    // Работа с заказами
    await goToWarehouse(page);
    await page.waitForLoadState('networkidle');

    let pathArray = [];
    for (const row of await rowAvaliable.all()) {
      let path = (await row.getAttribute('onclick')) as string;
      let pathSlice = path.slice(21, -2);
      pathArray.push(pathSlice);
    }

    for (const path of pathArray) {
      await page.goto('eu1/' + path);
      await page.locator('h1', { hasText: 'Груз' }).waitFor();

      let textButton = ((await actionButton.textContent()) as string).replace(/\s+/g, '');
      if (
        ((await workersBlock.filter({ hasText: / 0 Доступно / }).isVisible()) ||
          (await truckBlock.filter({ hasText: / 0 Доступно / }).isVisible()) ||
          (await trailerBlock.filter({ hasText: / 0 Доступно / }).isVisible())) &&
        (await actionButton.filter({ hasText: 'Завершить' }).isHidden())
      ) {
        await page.getByText('Отменить').click();
        await page.getByText('Да, я хочу отменить эту доставку.').click();
        await smallTimeout(page);
        continue;
      }

      switch (textButton) {
        case 'Погрузить':
          if (
            (await workersBlock.filter({ hasText: 'Заболел' }).isHidden()) &&
            (await workersBlock.filter({ hasText: / 0 Доступно / }).isHidden()) &&
            (await workersBlock.filter({ hasText: / Спит / }).isHidden()) &&
            (await trailerBlock.filter({ hasText: / 0 Доступно / }).isHidden())
          ) {
            if (await selectRandomWorkers.isVisible()) {
              await selectRandomWorkers.click();
              await selectRandomWorkers.waitFor({ state: 'hidden' });
              await page.locator('h1', { hasText: 'Груз' }).waitFor();
              await smallTimeout(page);
            }
            if (await selectRandomTruck.isVisible()) {
              await selectRandomTruck.click();
              await selectRandomTruck.waitFor({ state: 'hidden' });
              await page.locator('h1', { hasText: 'Груз' }).waitFor();
              await smallTimeout(page);
            }
            if (await selectRandomTrailer.isVisible()) {
              await selectRandomTrailer.click();
              await selectRandomTrailer.waitFor({ state: 'hidden' });
              await page.locator('h1', { hasText: 'Груз' }).waitFor();
              await smallTimeout(page);
            }
            await actionButton.click();
            await page.getByText('Погрузка...').first().waitFor();
            await smallTimeout(page);
          }
          break;
        case 'Впуть':
          if (
            (await selectRandomWorkers.isVisible()) ||
            (await selectRandomTruck.isVisible()) ||
            (await selectRandomTrailer.isVisible()) ||
            ((await truckBlock.filter({ hasText: 'Заправка' }).isHidden()) &&
              (await truckBlock.filter({ hasText: 'Обслуживается' }).isHidden()) &&
              (await workersBlock.filter({ hasText: 'Заболел' }).isHidden()) &&
              (await workersBlock.filter({ hasText: 'Спит' }).isHidden()))
          ) {
            await clickIsVisible(selectRandomWorkers);
            await clickIsVisible(selectRandomTruck);
            await clickIsVisible(selectRandomTrailer);
            await selectRandomWorkers.waitFor({ state: 'hidden' });
            await selectRandomTruck.waitFor({ state: 'hidden' });
            await selectRandomTrailer.waitFor({ state: 'hidden' });
            await smallTimeout(page);

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
              await page.goto(url, { waitUntil: 'networkidle' });
              await actionButton.waitFor();
              await page.waitForTimeout(1000);
            }

            await page.waitForLoadState('networkidle');
            await actionButton.click();
            await page.getByText(' В пути... ').first().waitFor({ timeout: 20000 });
            await smallTimeout(page);
          }

          break;
        case 'Разгрузить':
          if (
            (await workersBlock.filter({ hasText: /Болен/ }).isHidden()) &&
            (await workersBlock.filter({ hasText: / 0 Доступно / }).isHidden()) &&
            (await trailerBlock.filter({ hasText: /Обслуживается/ }).isHidden()) &&
            (await workersBlock.filter({ hasText: 'Заболел' }).isHidden())
          ) {
            await page.waitForLoadState('networkidle');
            await actionButton.click();
            await page.getByText(' Разгрузка... ').first().waitFor();
            await smallTimeout(page);
          }
          break;
        case 'Завершить':
          if (await workersBlock.getByText(/ 0 Доступно /).isHidden()) {
            await page.waitForLoadState('networkidle');
            await actionButton.click();
            await page.getByText(' Завершение... ').first().waitFor();
            await smallTimeout(page);
          }
          break;
        case 'Продолжитьдоставку':
          if (await truckBlock.getByText('Заправка').isHidden()) {
            await page.waitForLoadState('networkidle');
            await actionButton.click();
            await page.getByText(' В пути... ').first().waitFor();
            await smallTimeout(page);
          }

          break;
      }
    }

    await page.waitForLoadState('networkidle');

    // Заправка
    if (i % 3 == 0) {
      await refuelAllCars(page);
      await page.waitForTimeout(1000);
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
        let uniqueTrip = page
          .locator('[class="portlet light bordered"]', { hasText: 'Рекомендуемые поездки' })
          .locator('tr', {
            has: page.locator('td').nth(2).filter({ hasText: uniqueName }),
          });

        let tripID = await uniqueTrip
          .nth(getRandomInt(await uniqueTrip.count()) - 2)
          .locator('input')
          .getAttribute('value');
        await page.request.post('https://www.logitycoon.com/eu1/ajax/trip_accept.php/', {
          form: { 'freight[]': tripID as string },
        });
      }
    }

    console.log(i++);
  }
});

test('@refuel corporation', async () => {
  await page.goto('/eu1/index.php?a=concernbuildings&t=concernoilrefineries');

  // // Улучшаем заправки
  // await page.goto('eu1/index.php?a=concernbuildings&t=concernfuelstations');
  // for (const upgradeButton of (
  //   await page.locator('[class="tab-content"]').getByText('Улучшить').all()
  // ).reverse()) {
  //   await page.request.post('eu1/ajax/concernfuelstations_upgrade.php', {
  //     form: { upgrade: (await upgradeButton.getAttribute('onclick')).replace(/[^0-9]/g, '') },
  //   });
  // }

  // Улучшаем Нефтеперерабатывающие заводы
  // await page.goto('/eu1/index.php?a=concernoilrefineries_upgrade');
  // for (const upgradeButton of (
  //   await page.locator('[class="tab-pane active"] [name="upgrade"]').all()
  // ).reverse()) {
  //   await upgradeButton.click();
  //   await page.waitForLoadState('load');
  // }
  // await page.getByText('Топливо').first().click();
  // for (const upgradeButton of (await page.locator('[name="upgrade"]').all()).reverse()) {
  //   await page.request.post(
  //     'eu1/index.php?a=concernbuildings&t=concernoilrefineries_upgradecapfuel',
  //     {
  //       form: { upgrade: await upgradeButton.getAttribute('value') },
  //     },
  //   );
  // }

  do {
    // Заправляем всё Сырой нефтью
    const refuelOiltr = page
      .locator('.portlet', { hasText: 'Заправить (Сырая нефть)' })
      .locator('tbody')
      .locator('tr');

    for (const refuelRow of await refuelOiltr.all()) {
      let fuelPrice = ((await refuelRow.locator('td').nth(2).textContent()) as string).slice(
        3,
        -10,
      );
      let fuelCount = (
        (await refuelRow.locator('[class="rangeslider-output"]').textContent()) as string
      ).replace(/\D/g, '');
      let countryName = await refuelRow.locator('td').first().innerText();

      if (
        (Number(fuelPrice) <= 50 || Number(fuelCount) <= 200) &&
        (await refuelRow.locator('[title="Полный"]').isHidden())
      ) {
        if (Number(fuelPrice) >= 50) {
          await botapi.sendMessage(
            process.env.CHAT_ID as string,
            `Купил бенз за оверпрайс ${fuelPrice} из ${countryName}`,
          );
        }
        await page.request.post('eu1/index.php?a=concernbuildings&t=concernoilrefineries_refill', {
          form: { refill: await refuelRow.locator('[name="refill"]').getAttribute('value') },
        });
      }
    }
    // Отправляем топливо на заправки, если оно больше minBenzinCount значeния
    for (const iterator of (
      await page.locator('tr', { hasText: /литров \/ час/ }).all()
    ).reverse()) {
      let benzinCount = Number(
        await iterator.locator('td').nth(3).locator('input').getAttribute('value'),
      );
      let minBenzinCount = Number(process.env.MINBENZINCOUNT) || 1000;

      if (benzinCount > minBenzinCount) {
        await iterator.getByText('Транспортировать').click();
        await page.getByText('Нефтеперерабатывающие заводы').waitFor();
        await page.waitForLoadState('networkidle');
        // Отправляем бензин, если заправка не переполнена
        if (await page.locator('[id="country1"]', { hasText: 'Полный' }).isHidden()) {
          await page.getByText('Быстрая доставка').click();
          await page.locator('[name="accept"]').click();
          await page.locator('h1', { hasText: 'Здания' }).first().waitFor();
          await page.waitForLoadState('networkidle');
        } else {
          await page.goto('/eu1/index.php?a=concernbuildings&t=concernoilrefineries');
          continue;
        }
      }
    }

    await page.waitForTimeout(60 * 1000);
  } while (true);
});

test('@upgradeEmployee', async () => {
  await upgradeEmployee(page);
});

test('@updateTruck', async () => {
  // Получаем город головного офиса
  await page.goto('https://www.logitycoon.com/eu1/index.php?a=companyoverviewprivate');
  let headCountry = (await page.locator('[class="profile-usertitle-job"]').innerText()).replace(
    /Удалить компанию/,
    '',
  );
  let newTruckBlock = page
    .locator('[class="portlet light "]', { hasText: 'Грузовики' })
    .locator('[class="mt-action"]');
  let freeTruck = newTruckBlock.filter({ hasText: 'Ничего' });
  let newTruckReady = newTruckBlock
    .filter({ hasNotText: 'Будет доставлено' })
    .filter({ hasText: headCountry })
    .filter({ hasText: '1 дней назад' });
  let newTruckDelivery = newTruckBlock
    .filter({ hasText: 'Будет доставлено' })
    .filter({ hasText: headCountry })
    .filter({ hasText: '1 дней назад' });
  let navInstallButton = page.locator('[id="navinstall"]', { hasText: 'Собрать' });
  let ftlockinstall = page.locator('[id="ftlockinstall"]', { hasText: 'Собрать' });

  async function buyNewtruck(page: Page, truckId: number) {
    await page.request.post('https://www.logitycoon.com/eu1/index.php?a=truckstore', {
      form: { buytruck: truckId },
    });
  }

  await goToGarage(page);

  for (const truck of await newTruckBlock.all()) {
    let daysAgo: number = String(await truck.getByText(/дней назад/).textContent()).replace(
      /[^0-9]/g,
      '',
    );

    if (daysAgo >= 15) {
      await truck.getByText('Информация').first().click();
      await page.locator('h1', { hasText: 'Грузовик - Информация' }).waitFor();

      let actualCountry = await page
        .locator('[class="row static-info"]', { has: page.locator('img') })
        .locator('div')
        .nth(1)
        .innerText();
      let truckId = (
        (await page.locator('.portlet').locator('img').first().getAttribute('src')) as string
      ).replace(/[^0-9]/g, '');

      await page.getByText('Продать автосалону').click();
      await page.waitForTimeout(500);
      await page.getByText('Продать автосалону??').waitFor();
      await page.waitForTimeout(500);
      await page.getByText('Да', { exact: true }).click();
      await botapi.sendMessage(
        process.env.CHAT_ID as string,
        `Продал truck ${truckId} из ${actualCountry}`,
      );
      await page.waitForTimeout(500);
      await page.locator('h1', { hasText: 'Гараж' }).waitFor();

      if (await newTruckReady.first().isVisible()) {
        await newTruckReady.first().getByText('Информация').first().click();
        await page.locator('h1', { hasText: 'Грузовик - Информация' }).waitFor();
      } else if (await newTruckDelivery.first().isVisible()) {
        await newTruckDelivery.first().getByText('Информация').first().click();
        await page.locator('h1', { hasText: 'Грузовик - Информация' }).waitFor();
        await page.locator('[id="ready1"]').waitFor({ state: 'hidden', timeout: 3 * 65 * 1000 });
        await page.waitForTimeout(2000);
      } else {
        await buyNewtruck(page, Number(truckId));
        await page.reload();
        await newTruckDelivery.first().getByText('Информация').first().click();
        await page.locator('h1', { hasText: 'Грузовик - Информация' }).waitFor();
        await page.locator('[id="ready1"]').waitFor({ state: 'hidden', timeout: 3 * 65 * 1000 });
        await page.waitForTimeout(2000);
      }

      // Устанавливам навигатор
      if (await navInstallButton.isVisible()) {
        await navInstallButton.click();
        await navInstallButton.waitFor({ state: 'hidden' });
      }
      // Устанавливам замок топливного бака
      if (await ftlockinstall.isVisible()) {
        await ftlockinstall.click();
        await ftlockinstall.waitFor({ state: 'hidden' });
      }

      await page.getByText('Перемещение').click();
      await page.getByText('Transferio').waitFor();

      let optionValue = await page
        .locator('option', { hasText: actualCountry })
        .getAttribute('value');
      await page
        .locator('select', { hasText: 'Пожалуйста, выберите город..' })
        .selectOption(optionValue);
      await page.getByText('Начать перемещение').click();
      await botapi.sendMessage(
        process.env.CHAT_ID as string,
        `Отправил truck ${truckId} в ${actualCountry}`,
      );

      break;
    }
  }
});

test('@updateTrailer', async () => {
  // Получаем город головного офиса
  await page.goto('https://www.logitycoon.com/eu1/index.php?a=companyoverviewprivate');
  let headCountry = (await page.locator('[class="profile-usertitle-job"]').innerText()).replace(
    /Удалить компанию/,
    '',
  );
  let newTrailerBlock = page
    .locator('[class="portlet light "]', { hasText: 'Прицепы' })
    .locator('[class="mt-action"]');
  let freeTrailer = newTrailerBlock.filter({ hasText: 'Ничего' });
  let newTrailerReady = newTrailerBlock
    .filter({ hasNotText: 'Будет доставлено' })
    .filter({ hasText: headCountry })
    .filter({ hasText: '1 дней назад' });

  let newTrailerDelivery = newTrailerBlock
    .filter({ hasText: 'Будет доставлено' })
    .filter({ hasText: headCountry })
    .filter({ hasText: '1 дней назад' });

  async function buyNewtruck(page: Page, trailerId: number) {
    await page.request.post('https://www.logitycoon.com/eu1/index.php?a=trailerstore', {
      form: { buytrailer: trailerId },
    });
  }
  await goToGarage(page);

  for (const trailer of await newTrailerBlock.all()) {
    let daysAgo: number = String(await trailer.getByText(/дней назад/).textContent()).replace(
      /[^0-9]/g,
      '',
    );

    if (daysAgo >= 15) {
      await trailer.getByText('Информация').first().click();
      await page.locator('h1', { hasText: 'Прицеп - Информация' }).waitFor();

      let actualCountry = await page
        .locator('[class="row static-info"]', { has: page.locator('img') })
        .locator('div')
        .nth(1)
        .innerText();
      let trailerId = (
        (await page.locator('.portlet').locator('img').first().getAttribute('src')) as string
      ).replace(/[^0-9]/g, '');

      await page.getByText('Продать автосалону').click();
      await page.waitForTimeout(1000);
      await page.getByText('Продать автосалону??', { exact: true }).waitFor();
      await page.waitForTimeout(1000);
      await page.getByText('Да', { exact: true }).click();
      await botapi.sendMessage(
        process.env.CHAT_ID as string,
        `Продал trailer ${trailerId} из ${actualCountry}`,
      );
      await page.waitForTimeout(500);
      await page.locator('h1', { hasText: 'Гараж' }).waitFor();

      if (await newTrailerReady.first().isVisible()) {
        await newTrailerReady.first().getByText('Информация').first().click();
        await page.locator('h1', { hasText: 'Прицеп - Информация' }).waitFor();
      } else if (await newTrailerDelivery.first().isVisible()) {
        await newTrailerDelivery.first().getByText('Информация').first().click();
        await page.locator('h1', { hasText: 'Прицеп - Информация' }).waitFor();
        await page.locator('[id="ready1"]').waitFor({ state: 'hidden', timeout: 3 * 65 * 1000 });
        await page.waitForTimeout(2000);
      } else {
        await buyNewtruck(page, Number(trailerId));
        await page.reload();
        await newTrailerDelivery.first().getByText('Информация').first().click();
        await page.locator('h1', { hasText: 'Прицеп - Информация' }).waitFor();
        await page.locator('[id="ready1"]').waitFor({ state: 'hidden', timeout: 3 * 65 * 1000 });
        await page.waitForTimeout(2000);
      }

      await page.getByText('Перемещение').click();
      await page.getByText('Transferio').waitFor();

      let optionValue = await page
        .locator('option', { hasText: actualCountry })
        .getAttribute('value');
      await page
        .locator('select', { hasText: 'Пожалуйста, выберите город..' })
        .selectOption(optionValue);
      await page.getByText('Начать перемещение').click();
      await botapi.sendMessage(
        process.env.CHAT_ID as string,
        `Отправил trailer ${trailerId} в ${actualCountry}`,
      );

      break;
    }
  }
});
