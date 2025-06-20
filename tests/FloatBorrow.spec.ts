import { test, expect, chromium, Browser, Page } from '@playwright/test';
import * as common from './Common';
import { Context } from 'vm';

//0: Djed; 1:Snek; 2:MIN; 3: iUsd; 4:USDC
let token_test = 3;
let browser: Browser;
let defaultContext: Context;
let page: Page

test.beforeAll(async () => {
    browser = await chromium.connectOverCDP('http://localhost:9222');
    defaultContext = browser.contexts()[0];
    page = await defaultContext.newPage();
    await page.goto(common.domain + common.borrow_list + common.token_list[token_test].token_id);
});

test('Start Borrow', async () => {
  let token_amount = '10';
  const page = await defaultContext.newPage();
  console.log('✅ Start supply ');
  // Truy cập màn supply
  await page.goto(common.domain + common.supply_list + common.token_list[token_test].token_id);
  await page.getByTestId('supply-float').waitFor({ state: 'visible' });
  // Thực hiện supply và nhập supply amount
  await page.getByTestId('supply-float').click();
  await page.getByRole('img', { name: 'down', exact: true }).locator('svg').click();
  await page.getByTestId(common.token_list[token_test].token_name + '-input-amount').fill(common.token_list[token_test].min_tx);
  // Chụp màn hình trước khi ký ví
  await common.screenshort(page, "before_supply");
  await page.getByRole('button', { name: /Supply/ }).nth(1).click()
  const [newPage] = await Promise.all([
    defaultContext.waitForEvent('page')
  ])
  // Load màn ký ví và thực hiện ký ví
  await common.signLaceWallet(newPage);
  // Trở về màn supply
  page.waitForLoadState('load', { timeout: 30000 });
  // page.pause();
  const txurl = await page.getByRole('alert').getByRole('link').getAttribute('href');
  console.log('Tx hash: ' + txurl);
});