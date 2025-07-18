import { test, expect, chromium, Browser, Page } from '@playwright/test';
import * as common from './Common';
import { Context } from 'vm';

//0: Djed; 1:Snek; 2:MIN; 3: iUsd; 4:USDC
let tk = 3;
let browser: Browser;
let defaultContext: Context;
let page: Page

test.beforeAll(async () => {
    browser = await chromium.connectOverCDP('http://localhost:9222');
    defaultContext = browser.contexts()[0];
    page = await defaultContext.newPage();
});

test('Withdraw: withdraw = min_tx', async () => {
    test.setTimeout(50000)
    const page = await defaultContext.newPage();
    // supply min_tx
    await doWithdraw(page, common.token_list[tk].token_id, common.token_list[tk].token_name, common.token_list[tk].min_tx);
});

test('validate Withdraw: withdraw lượng < min_tx', async () => {

    await page.goto(common.domain + common.supply_list + common.token_list[tk].token_id);
    console.log('✅ Start withdraw ');
    await page.getByTestId('supply-float').waitFor({ state: 'visible' });
    await page.getByTestId('withdraw-float').click();
    await page.getByRole('img', { name: 'down', exact: true }).locator('svg').click();
    // tính số withdraw cần điền
    let amount_too_small = parseFloat(common.token_list[tk].min_tx) - 0.001;
    await page.getByTestId(common.token_list[tk].token_name + '-input-amount').fill(amount_too_small.toString());
    let msg = common.minimumMsg(tk);
    await common.screenshort(page, "validate_withdraw_minimum");
    await expect(page.locator(`text = ${msg}`)).toBeVisible();
    await expect(page.getByRole('button', { name: /Withdraw/ }).nth(1)).toBeDisabled();
    // Chụp màn hình trước khi ký ví
    await common.screenshort(page, "validate_withdraw");
    // await page.pause();
});

test('validate Withdraw: phần còn lại  < min_tx', async () => {
    await page.goto(common.domain + common.supply_list + common.token_list[tk].token_id);
    console.log('✅ Start withdraw ');
    await page.getByTestId('supply-float').waitFor({ state: 'visible' });
    await page.getByTestId('withdraw-float').click();
    let maxWithdrawStr = await extractMaxWithdraw(page);
    let withdrawAmount = 0
    // tính số withdraw cần điền
    if (maxWithdrawStr != null) {
        withdrawAmount = parseFloat(maxWithdrawStr) - 0.001;
    }
    await page.getByRole('img', { name: 'down', exact: true }).locator('svg').click();
    // Số withdraw < min_tx
    await page.getByTestId(common.token_list[tk].token_name + '-input-amount').fill(withdrawAmount.toString());
    let msg = common.minimumMsg(tk);
    await expect(page.locator('span', { hasText: /If you want to withdraw these assets, you will need to supply more./ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Withdraw/ }).nth(1)).toBeDisabled();
    // Chụp màn hình trước khi ký ví
    await common.screenshort(page, "validate_withdraw");
    // await page.pause();
});

async function extractMaxWithdraw(page: Page): Promise<string | null> {
    const maxTextLocator = page.locator('span', { hasText: /Max:/ }).last();
    await maxTextLocator.waitFor({ state: 'visible' });
    await page.waitForTimeout(2000);
    const rawText = await maxTextLocator.textContent();
    if (rawText != null && rawText != undefined)
        return rawText.match(/Max:\s*([\d.]+)/)?.[1] ?? null;
    else
        return null;

}

async function doWithdraw(page: Page, token_id: string, token_name: string, amount: string) {
    console.log('✅ Start withdraw ');
    await page.goto(common.domain + common.supply_list + token_id);
    await page.getByTestId('supply-float').waitFor({ state: 'visible' });
    // thực hiện withdraw
    await page.getByTestId('withdraw-float').click();
    await page.getByRole('img', { name: 'down', exact: true }).locator('svg').click();
    await page.getByTestId(common.token_list[tk].token_name + '-input-amount').fill(common.token_list[tk].min_tx);
    // Chụp màn hình trước khi ký ví
    await common.screenshort(page, "before_withdraw");
    await page.getByRole('button', { name: /Withdraw/ }).nth(1).click()
    await common.checkResult(defaultContext, page, "withdraw_error", "after_withdraw");
}
