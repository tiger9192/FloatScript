import { Page, BrowserContext, expect } from '@playwright/test';
import { Context } from 'vm';

export const domain = 'https://danogo.landing.dev.teko.vn/';
export const supply_list = 'supply-list?token=';
export const borrow_list = 'borrow-list?token=';

/* trước khi chạy scrip cần mở browser bằng lệnh 
C:\Program Files (x86)\Google\Chrome\Application>start chrome.exe --remote-debugging-port=9222 --user-data-dir="C:\Users\Teko\AppData\Local\Google\Chrome\User Data\Profile 47"
Trong đó profile 47 đã cài đặt trước extention ví.
*/

export async function signLaceWallet(page: Page) {
    console.log('Hiển thị màn ký ví');
    // await page.waitForTimeout(10000);
    // await page.pause();
    await page.getByTestId('dapp-transaction-confirm').waitFor();
    await page.getByTestId('dapp-transaction-confirm').click();
    console.log('Click confirm');
    await page.keyboard.type('BigTige123@!');
    console.log('Nhập passwork');
    await page.getByTestId('sign-transaction-confirm').click();
    console.log('Ký ví thành công');
    await page.getByTestId('dapp-sign-tx-success-close-button').click();
}

export const token_list = [
    { token_id: '919d4c2c9455016289341b1a14dedf697687af31751170d56a31466e.74444a4544', token_name: 'DJED', min_tx: '101', collateral: 'iUSD', collateral_amount: '2500' },
    { token_id: '919d4c2c9455016289341b1a14dedf697687af31751170d56a31466e.74534e454b', token_name: 'SNEK', min_tx: '37218', collateral: 'ADA', collateral_amount: '55' },
    { token_id: '919d4c2c9455016289341b1a14dedf697687af31751170d56a31466e.7449555344', token_name: 'iUSD', min_tx: '1994', collateral: 'DJED', collateral_amount: '40' },
    { token_id: '', token_name: 'ADA', min_tx: '100', collateral: 'DJED', collateral_amount: '40' },
    { token_id: '919d4c2c9455016289341b1a14dedf697687af31751170d56a31466e.744d494e', token_name: 'MIN', min_tx: '10', collateral: 'ADA', collateral_amount: '40' },
    { token_id: '919d4c2c9455016289341b1a14dedf697687af31751170d56a31466e.7455534443', token_name: 'USDC', min_tx: '10', collateral: 'ADA', collateral_amount: '40' },
]

export async function screenshort(page: Page, screenName: String) {
    console.log('Chụp màn hình');
    let timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    await page.screenshot({ path: `./Screenshort/${timestamp}_${screenName}.png` });
}

export function minimumMsg(token_test: number) {
    return `Minimum value to supply is ${token_list[token_test].min_tx} ${token_list[token_test].token_name}`;
}

export async function checkResult(defaultContext: Context, page: Page, imgNameErr: String, imgNameSuc: String) {
    const errorMsg = page.getByRole('alert').locator('text =/Get support here/');
    const result = await Promise.race([
        // Trường hợp mở trang mới
        defaultContext.waitForEvent('page').then((newPage) => ({ type: 'new-page', newPage })),

        // Trường hợp hiện lỗi
        errorMsg.waitFor({ state: 'visible', timeout: 10000 }).then(() => ({ type: 'error' })),
    ]);
    if (result.type === 'error') {
        console.log('📌 Có lỗi xảy ra');
        await page.waitForTimeout(1000);
        await screenshort(page, imgNameErr);
    } else if (result.type === 'new-page') {

        const newPage = result.newPage;
        await signLaceWallet(newPage);
        // Trở về màn supply
        await page.getByRole('alert').getByRole('link').isVisible({ timeout: 30000 });
        const txurl = await page.getByRole('alert').getByRole('link').getAttribute('href');
        await screenshort(page, imgNameSuc);
        console.log('Tx hash: ' + txurl);
    }
}
