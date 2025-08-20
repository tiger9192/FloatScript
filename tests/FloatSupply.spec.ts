import { test, expect, chromium, Browser, Page } from '@playwright/test';
import * as common from './Common';
import { Context } from 'vm';
// const Djed_info = require('./data-test/Djed-info.json');

let browser: Browser;
let defaultContext: Context;
let page: Page
//0: Djed; 1:Snek; 2:iUsd; 3: Ada
let tk = 0;

test.beforeAll(async () => {
  browser = await chromium.connectOverCDP('http://localhost:9222');
  defaultContext = browser.contexts()[0];
  page = await defaultContext.newPage();

});



test('Supply < min_tx', async () => {
  let amount_too_small = parseFloat(common.token_list[tk].min_tx) - 0.001;
  console.log('✅ Start withdraw ');
  await page.goto(common.domain + common.supply_list + common.token_list[tk].token_id);
  await page.getByTestId('supply-float').waitFor({ state: 'visible' });
  await page.getByTestId('supply-float').click();
  await page.getByRole('img', { name: 'down', exact: true }).locator('svg').click();
  // Số withdraw < min_tx
  await page.getByTestId(common.token_list[tk].token_name + '-input-amount').fill(amount_too_small.toString());
  let msg = common.minimumMsg(tk);
  await expect(page.locator(`text = ${msg}`)).toBeVisible();
  await common.getMarketInfo(page,common.token_list[tk].token_name )
  console.log(await page.getByText('Minimum Amount').locator(':scope + *').textContent());
  await expect(page.getByText('SupplyProtocolDanogo').getByRole('button',{name:'Supply'})).toBeDisabled();
  // Chụp màn hình trước khi ký ví
  await common.screenshort(page, "validate_supply");

});
test('Start Supply', async () => {
  test.setTimeout(50000)
  // supply min_tx
  await supply(page, common.token_list[tk].token_id, common.token_list[tk].token_name, common.token_list[tk].min_tx);
  // supply > min_txcommon.token_list[token_test].token_id, common.token_list[token_test].token_name, token_amount.toString());

});

async function supply(page: Page, token_id: string, token_name: string, amount: string) {
  console.log('✅ Start supply ');
  // Truy cập màn supply
  await page.goto(common.domain + common.supply_list + token_id);
  await page.getByTestId('supply-float').waitFor({ state: 'visible' });
  // Thực hiện supply và nhập supply amount
  await page.getByTestId('supply-float').click();
  await page.getByRole('img', { name: 'down', exact: true }).locator('svg').click();
  await page.getByTestId(token_name + '-input-amount').fill(amount);
  // Chụp màn hình trước khi ký ví
  await common.screenshort(page, "before_supply");
  // await page.pause();
  const regex = new RegExp(`Supply .* ${token_name}`);
  // await page.getByRole('button', { name: /Supply .* SNEK/ }).click();
  await page.getByRole('button', { name: regex }).click();
  // có thể lỗi hoặc ký ví thành công
  await common.checkResult(defaultContext, page, "supply_error", "after_supply");
}



