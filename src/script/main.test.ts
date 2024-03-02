import { clickIsVisible } from './../utils/utils';
import { Locator, Page, selectors, test } from '@playwright/test';
require('dotenv').config();

let page: Page;
let fuelStation: Locator;
let refuelButton: Locator;
let warehouse: Locator;
let avaliableCountLocator: Locator;
let trips: Locator;
let avaliableTrip: Locator;
let workers: Locator;
let garage: Locator;
let tableAvaliable: Locator;
let rowAvaliable: Locator;
let actionTitle: Locator;
let actionButton: Locator;
let selectRandomItem: Locator;
let workerToSleep: Locator;
let activeRepairButton: Locator;

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage();
  fuelStation = page.locator('[id="menuitem-fuelstation"]');
  refuelButton = page.getByText('Обычная заправка').first();
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
  rowAvaliable = tableAvaliable.locator('tr').first();
  actionTitle = page.locator('[class="portlet-title"]').first();
  selectRandomItem = page.locator('.portlet', { hasText: /Доступно/ }).getByText('Случайный');
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
    // TODO gotoFuelStation(page)
    await fuelStation.click();
    await clickIsVisible(refuelButton);

    // TODO gotoWarehouse(page)
    await warehouse.click();
    await page.waitForTimeout(700);

    await clickIsVisible(rowAvaliable);
    for (const item of await selectRandomItem.all()) {
      await item.click();
    }
    // await clickIsVisible(selectRandomItem);
    await clickIsVisible(actionButton);

    await page.waitForTimeout(500);
    await warehouse.click();
    await page.waitForTimeout(500);
    await warehouse.click();

    let availableCount = Number(await avaliableCountLocator.textContent());

    // TODO goToTrips
    await trips.click();
    if (availableCount == 0 && (await avaliableTrip.first().isVisible())) {
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(200);
      await avaliableTrip.first().click();
      await page.waitForTimeout(200);
      await page.locator('[id="submit-trips"]').click();
      await page.waitForTimeout(200);
    }

    // TODO  gotoWorkers
    await workers.click();
    await page.waitForTimeout(700);

    if (await workerToSleep.isVisible()) {
      await clickIsVisible(workerToSleep.first());
      await page.getByText('Сон').click();
    }

    // TODO gotogarage
    await garage.click();
    await page.waitForTimeout(700);

    // for (const repairButtonInArray of await activeRepairButton.all()) {
    //   await repairButtonInArray.click();
    // }
    await clickIsVisible(activeRepairButton.first());
    // await page.pause();
  }
});
