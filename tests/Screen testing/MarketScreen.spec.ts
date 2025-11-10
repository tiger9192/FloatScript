import { test, expect, chromium, Browser, Page } from '@playwright/test';
import * as config from '../config';
import { Context } from 'vm';

let browser: Browser;
let defaultContext: Context;
let page: Page
//0: Djed; 1:Snek; 2:iUsd; 3: Ada
// const env = config.env('PREVIEW');
const env = config.env('PREPROD');
// const env = config.env('MAIN_OLD_POOL');
// const env = config.env('MAIN_NEW_UI');


test.beforeAll(async () => {
    browser = await chromium.connectOverCDP('http://localhost:9222');
    defaultContext = browser.contexts()[0];
    page = await defaultContext.newPage();

});

test('load market screen', async () => {
    test.setTimeout(50000)
    console.log('✅ Open maket screen ');
    // Truy cập màn supply
    await page.goto(`${env.lendingUrl}market`);
    await page.getByRole('button', { name: 'View Supplies' }).waitFor({ state: 'visible' });
    await page.pause();

    getUserData(page);

    // getByText('Total locked as Collateral')
    // getByText('Total Debt')
    // getByText('Total Collateral')
});

async function getUserData(page: Page) {
    const totalValue = await page
        .getByText('Total Supplied')
        .locator('xpath=following-sibling::span//span')
        .innerText();

    const collateralValue = await page.getByText('Total locked as Collateral').locator('xpath=ancestor::div[contains(@class, "flex-col")]//span').innerText();
    console.log('Total Supplied:', totalValue);
}
