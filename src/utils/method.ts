import { Page } from '@playwright/test';
import { clickIsVisible } from './utils';

export const refuelAllCars = async (page: Page) => {
  let fuelStation = page.locator('[id="menuitem-fuelstation"]');
  let refuelButton = page.getByText('Обычная заправка');

  await fuelStation.click();
  for (const tab of await page.locator('[class="nav nav-tabs nav-tabs-lg"]').locator('li').all()) {
    await tab.click();
    await page.waitForTimeout(2000);
    for (const refuel of await refuelButton.all()) {
      await Promise.all([await clickIsVisible(refuel), page.waitForResponse(/fuelstation_refuel/)]);
    }
  }
};
