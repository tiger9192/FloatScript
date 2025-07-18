import { test, expect, chromium, Browser, Page } from '@playwright/test';
import * as common from './Common';
import { Context } from 'vm';

//0: Djed; 1:Snek; 2:MIN; 3: iUsd; 4:USDC
let tk = 1;
let browser: Browser;
let defaultContext: Context;
let page: Page

test.beforeAll(async () => {
  browser = await chromium.connectOverCDP('http://localhost:9222');
  defaultContext = browser.contexts()[0];
  page = await defaultContext.newPage();
});

test('Borrow', async () => {
  test.setTimeout(60000)
  // supply min_tx
  await borrow(page, common.token_list[tk].token_name, common.token_list[tk].collateral, common.token_list[tk].collateral_amount, common.token_list[tk].min_tx);

});


test('Repay All', async () => {
  test.setTimeout(60000)
  await page.goto(common.domain + common.borrow_list + common.token_list[tk].token_id);
  await page.pause();
  console.log('✅ Start repay all ');
  await page.getByTestId('loan-float-ModifyDanogoFloat').first().click();
  await page.getByTestId(`${common.token_list[tk].token_name}-input-amount`).fill('0');
  await page.getByRole('button', { name: /Repay All/ }).click()
  await common.checkResult(defaultContext, page, "repay_all_error", "after_repay_all");
});

test('Borrow more: increase loan amount', async () => {
  test.setTimeout(120000)
  // **** Tạo khỏa vay trước khi tăng khoản vay
  let amount = parseFloat(common.token_list[tk].collateral_amount) * 2;
  console.log('✅ Start Borrow ');
  await borrow(page, common.token_list[tk].token_name, common.token_list[tk].collateral, amount.toString(), common.token_list[tk].min_tx);

  // thực hiện tăng khoản vay
  await page.waitForTimeout(10000);
  await page.goto(common.domain + common.borrow_list + common.token_list[tk].token_id);
  console.log('✅ Start increase borrow ');
  await page.getByTestId('loan-float-ModifyDanogoFloat').first().click();
  amount = parseFloat(common.token_list[tk].min_tx);
  amount = amount * 2;
  await page.getByTestId(`${common.token_list[tk].token_name}-input-amount`).fill(amount.toString());
  await page.getByRole('button', { name: /Borrow More/ }).click()
  await common.checkResult(defaultContext, page, "Borrow_more_error", "after_Borrow_more");
});

test('Repay loan: descrease loan amount', async () => {
  test.setTimeout(120000)
  // **** Thực hiện tạo khoản vay trước khi giảm khoản vay ***********
  let amount = parseFloat(common.token_list[tk].collateral_amount);
  amount = amount * 2;
  let borrow_amount = parseFloat(common.token_list[tk].min_tx);
  borrow_amount = borrow_amount * 2
  console.log('✅ Start Borrow ');
  await borrow(page, common.token_list[tk].token_name, common.token_list[tk].collateral, amount.toString(), borrow_amount.toString());
  await page.waitForTimeout(10000);

  await page.goto(common.domain + common.borrow_list + common.token_list[tk].token_id);
  console.log('✅ Start descrease loan ');
  await page.getByTestId('loan-float-ModifyDanogoFloat').first().click();
  await page.getByTestId(`${common.token_list[tk].token_name}-input-amount`).fill(common.token_list[tk].min_tx);
  await page.getByRole('button', { name: /Repay Loan/ }).click()
  await common.checkResult(defaultContext, page, "Repay_loan_error", "after_Repay_loan");
});

test('Modify loan 1: descrease collateral amount', async () => {
  test.setTimeout(120000)
  // **** Tạo khỏa vay trước khi giảm vay ***********
  let amount = parseFloat(common.token_list[tk].collateral_amount) * 2;
  await borrow(page, common.token_list[tk].token_name, common.token_list[tk].collateral, amount.toString(), common.token_list[tk].min_tx);
  // await page.waitForTimeout(10000);

  await page.goto(common.domain + common.borrow_list + common.token_list[tk].token_id);
  console.log('✅ Start increase borrow ');
  await page.getByTestId('loan-float-ModifyDanogoFloat').first().click();
  await page.getByTestId(`d${common.token_list[tk].collateral}-input-amount`).fill(common.token_list[tk].collateral_amount);
  await page.getByRole('button', { name: /Modify Loan/ }).click()
  await common.checkResult(defaultContext, page, "Modify_loan_1_error", "after_Modify_loan_1");
});

test('Modify loan 2: increase collateral amount', async () => {
  test.setTimeout(120000)
  // **** Chạy code này nếu trước đó chưa có khoản vay phù hợp ***********
  await borrow(page, common.token_list[tk].token_name, common.token_list[tk].collateral, common.token_list[tk].collateral_amount, common.token_list[tk].min_tx);
  // await page.waitForTimeout(10000);

  await page.goto(common.domain + common.borrow_list + common.token_list[tk].token_id);
  console.log('✅ Start increase borrow ');
  let collateral_amount = parseFloat(common.token_list[tk].collateral_amount) * 2;
  await page.getByTestId('loan-float-ModifyDanogoFloat').first().click();
  await page.getByTestId(`d${common.token_list[tk].collateral}-input-amount`).fill(collateral_amount.toString());
  await page.getByRole('button', { name: /Modify Loan/ }).click()
  await common.checkResult(defaultContext, page, "Modify_loan_2_error", "after_Modify_loan_2");
});

test('Borrow more 2: increase loan and collateral', async () => {
  test.setTimeout(120000)
  // **** Chạy code này nếu trước đó chưa có khoản vay phù hợp ***********
  await borrow(page, common.token_list[tk].token_name, common.token_list[tk].collateral, common.token_list[tk].collateral_amount, common.token_list[tk].min_tx);
  // await page.waitForTimeout(10000);

  await page.goto(common.domain + common.borrow_list + common.token_list[tk].token_id);
  console.log('✅ Start increase borrow  and collateral');
  // nhập collateral mới
  let collateral_amount = parseFloat(common.token_list[tk].collateral_amount) * 2;
  await page.getByTestId('loan-float-ModifyDanogoFloat').first().click();
  await page.getByTestId(`${common.token_list[tk].collateral}-input-amount`).fill(collateral_amount.toString());
  // nhập borrow amount mới
  let amount = parseFloat(common.token_list[tk].min_tx) * 2;
  await page.getByTestId(`${common.token_list[tk].token_name}-input-amount`).fill(amount.toString());
  await page.getByRole('button', { name: /Modify Loan/ }).click()
  await common.checkResult(defaultContext, page, "Borrow_more_2_error", "after_Borrow_more_2");
});

test('Repay loan 2: descrease loan and collateral', async () => {
  test.setTimeout(120000)
  // **** Tạo khoản vay ***********
  let collateral_amount = parseFloat(common.token_list[tk].collateral_amount) * 2;
  let amount = parseFloat(common.token_list[tk].min_tx) * 2;
  await borrow(page, common.token_list[tk].token_name, common.token_list[tk].collateral, collateral_amount.toString(), amount.toString());
  // await page.waitForTimeout(10000);

  await page.goto(common.domain + common.borrow_list + common.token_list[tk].token_id);
  console.log('✅ Start increase borrow  and collateral');
  // nhập collateral mới
  await page.getByTestId('loan-float-ModifyDanogoFloat').first().click();
  await page.getByTestId(`${common.token_list[tk].collateral}-input-amount`).fill(common.token_list[tk].collateral_amount);
  // nhập borrow amount mới
  await page.getByTestId(`${common.token_list[tk].token_name}-input-amount`).fill(common.token_list[tk].min_tx);
  await page.getByRole('button', { name: /Repay Loan/ }).click()
  await common.checkResult(defaultContext, page, "Repay_loan_2_error", "after_Repay_loan_2");
});

async function borrow(page: Page, tokenName: string, collateral: string, collateralAmount: string, borrowAmount: string) {
  await page.goto(common.domain + common.borrow_list + common.token_list[tk].token_id);

  console.log('✅ Start Borrow ');
  // Truy cập màn supply
  await page.getByTestId('borrow-float').waitFor({ state: 'visible' });
  // Thực hiện supply và nhập supply amount
  await page.getByTestId('borrow-float').click();
  await page.getByRole('img', { name: 'down', exact: true }).locator('svg').click();
  // Chọn collateral
  await page.locator('span').filter({ hasText: 'Select or Type Supplied' }).first().click();
  await page.getByTestId(`collateral-option-${collateral}`).click();
  await page.getByTestId(`${collateral}-input-amount`).fill(collateralAmount)

  // borrow amount
  await page.getByTestId(`${tokenName}-input-amount`).fill(borrowAmount);
  // Chụp màn hình trước khi ký ví
  
  await common.screenshort(page, "before_borrow");
  const regex = new RegExp(`Borrow .* ${tokenName}`);
  await page.getByRole('button', { name: regex }).click()
  await common.checkResult(defaultContext, page, "borrow_error", "after_borrow");
}
