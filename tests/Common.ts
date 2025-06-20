import { Page, BrowserContext, expect } from '@playwright/test';

export const domain = 'https://preview.danogo.io/';
export const supply_list = 'supply-list?token=';
export const borrow_list = 'borrow-list?token=';


export async function signLaceWallet(page: Page) {
    console.log('Hiển thị màn ký vì');
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
    { token_id: '919d4c2c9455016289341b1a14dedf697687af31751170d56a31466e.74444a4544', token_name: 'DJED', min_tx: '10' },
    { token_id: '919d4c2c9455016289341b1a14dedf697687af31751170d56a31466e.74534e454b', token_name: 'SNEK', min_tx: '37323' },
    { token_id: '919d4c2c9455016289341b1a14dedf697687af31751170d56a31466e.744d494e', token_name: 'MIN', min_tx: '10' },
    { token_id: '919d4c2c9455016289341b1a14dedf697687af31751170d56a31466e.7449555344', token_name: 'iUSD', min_tx: '10' },
    { token_id: '919d4c2c9455016289341b1a14dedf697687af31751170d56a31466e.7455534443', token_name: 'USDC', min_tx: '10' },
]

export async function screenshort(page: Page, screenName: String) {
    console.log('Chụp màn hình');
    let timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    await page.screenshot({ path: `./Screenshort/${timestamp}_${screenName}.png` });
}

export function minimumMsg(token_test: number) {
    return  `Minimum value to supply is ${token_list[token_test].min_tx} ${token_list[token_test].token_name}`;
}
