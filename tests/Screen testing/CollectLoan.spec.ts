import { test, expect, chromium, Browser, Page, request } from '@playwright/test';
import * as config from '../config';
import { Context } from 'vm';
import * as common from '../Common';

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

test('load Loan collect screen', async () => {
    test.setTimeout(18000000);
    await loadLoanLiquidation(page);
    for (let i = 0; i < 50; i++) {
        await page.getByRole('cell', { name: 'Collect' }).nth(5).click();
        // await loadLoanLiquidation(page);
        // await page.waitForTimeout(20000);
        // await page.pause();
        await common.checkResult(defaultContext, page, "CollectLoan_error", "after_collect_loan");
        await page.waitForTimeout(30000);
        await page.getByText('Loading...').waitFor({ state: 'detached', timeout: 120000 });
    };
    // await common.signLaceWallet(page);
    // await page.waitForTimeout(10000);
});

async function loadLoanLiquidation(page: Page): Promise<any> {
    console.log('✅ Open Loan load liquidation screen ')
    // Truy cập màn supply
    await page.goto(`${env.lendingUrl}liquidation`);
    await page.getByText('Loading...').waitFor({ state: 'detached', timeout: 120000 });
    // await expect(page.getByRole('heading', { name: 'Collect Loan' })).toBeVisible();

};