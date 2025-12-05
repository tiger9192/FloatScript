import { Page, BrowserContext, expect } from '@playwright/test';
import { Context } from 'vm';
import * as XLSX from "xlsx";

export const domain = 'https://danogo.landing.dev.teko.vn/';
// export const domain = 'https://preview.landing.dev.teko.vn/';
// export const domain = 'https://yield-aggregator-beta.tekoapis.com/';
// export const domain = 'https://yield-aggregator.tekoapis.com'; // Live
export const supply_list = 'supply-list?token=';
export const borrow_list = 'borrow-list?token=';

/* trước khi chạy scrip cần mở browser bằng lệnh 
C:\Program Files (x86)\Google\Chrome\Application>start chrome.exe --remote-debugging-port=9222 --user-data-dir="C:\Users\Dung.NTM\AppData\Local\Google\Chrome\User Data\Profile 5"
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
    { token_id: '919d4c2c9455016289341b1a14dedf697687af31751170d56a31466e.74444a4544', token_name: 'DJED', min_tx: '40', collateral: 'iUSD', collateral_amount: '2500' },
    { token_id: '919d4c2c9455016289341b1a14dedf697687af31751170d56a31466e.74534e454b', token_name: 'SNEK', min_tx: '37218', collateral: 'ADA', collateral_amount: '55' },
    { token_id: '919d4c2c9455016289341b1a14dedf697687af31751170d56a31466e.7449555344', token_name: 'iUSD', min_tx: '1994', collateral: 'DJED', collateral_amount: '40' },
    { token_id: '', token_name: 'ADA', min_tx: '100', collateral: 'DJED', collateral_amount: '40' },
    { token_id: '919d4c2c9455016289341b1a14dedf697687af31751170d56a31466e.744d494e', token_name: 'MIN', min_tx: '10', collateral: 'ADA', collateral_amount: '40' },
    { token_id: '919d4c2c9455016289341b1a14dedf697687af31751170d56a31466e.7455534443', token_name: 'USDC', min_tx: '10', collateral: 'ADA', collateral_amount: '40' },
]

// LIVE-------------------------------------------------------

export const USDM =
    { token_id: 'c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad.0014df105553444d', name: 'USDM', min_tx: '35', loanFeeRate: 0.1 };

export const token_list_live = [
    { token_id: 'c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad.0014df105553444d', name: 'USDM', min_tx: '35', loanFeeRate: 0.1, token_in_pool: 0, isSupply: true },
    { token_id: '25c5de5f5b286073c593edfd77b48abc7a48e5a4f3d4cd9d428ff935.425443', name: 'BTC', min_tx: '35', loanFeeRate: 0.1, token_in_pool: 0, isSupply: false },
    { token_id: '8db269c3ec630e06ae29f74bc39edd1f87c819f1056206e879a1cd61.446a65644d6963726f555344', name: 'DJED', min_tx: '35', loanFeeRate: 0.1, token_in_pool: 1096.244817, isSupply: true },
    { token_id: 'fe7c786ab321f41c654ef6c1af7b3250a613c24e4213e0425a7ae456.55534441', name: 'USDA', min_tx: '35', loanFeeRate: 0.1, token_in_pool: 0.000001, isSupply: true },
    { token_id: '25c5de5f5b286073c593edfd77b48abc7a48e5a4f3d4cd9d428ff935.55534443', name: 'USDC', min_tx: '35', loanFeeRate: 0.1, token_in_pool: 0, isSupply: true },
    { token_id: '25c5de5f5b286073c593edfd77b48abc7a48e5a4f3d4cd9d428ff935.55534454', name: 'USDT', min_tx: '35', loanFeeRate: 0.1, token_in_pool: 0, isSupply: true },

    { token_id: '279c909f348e533da5808898f87f9a14bb2c3dfbbacccd631d927a3f.534e454b', name: 'Snek', loanFeeRate: 0.1, token_in_pool: 0, isSupply: false },
    { token_id: 'f13ac4d66b3ee19a6aa0f2a22298737bd907cc95121662fc971b5275.535452494b45', name: 'STRIKE', loanFeeRate: 0.1, token_in_pool: 0, isSupply: false },
    { token_id: '5d16cc1a177b5d9ba9cfa9793b07e60f1fb70fea1f8aef064415d114.494147', name: 'IAGON', loanFeeRate: 0.1, token_in_pool: 0, isSupply: false },
    { token_id: '2d9db8a89f074aa045eab177f23a3395f62ced8b53499a9e4ad46c80.464c4f57', name: 'FLOW', loanFeeRate: 0.1, token_in_pool: 0, isSupply: false },
    { token_id: '5deab590a137066fef0e56f06ef1b830f21bc5d544661ba570bdd2ae.424f44454741', name: 'BODEGA', loanFeeRate: 0.1, token_in_pool: 0, isSupply: false },
    { token_id: '29d222ce763455e3d7a09a665ce554f00ac89d2e99a1a83d267170c6.4d494e', name: 'Minswap', loanFeeRate: 0.1, token_in_pool: 4600.616216, isSupply: false },
    { token_id: 'da8c30857834c6ae7203935b89278c532b3995245295456f993e1d24.4c51', name: 'Liqwid DAO Token', loanFeeRate: 0.1, token_in_pool: 0, isSupply: false },
    { token_id: '533bb94a8850ee3ccbe483106489399112b74c905342cb1792a797a0.494e4459', name: 'Indigo DAO Token', loanFeeRate: 0.1, token_in_pool: 0, isSupply: false },
    { token_id: '577f0b1342f8f8f4aed3388b80a8535812950c7a892495c0ecdf0f1e.0014df10464c4454', name: 'FLDT', loanFeeRate: 0.1, token_in_pool: 0, isSupply: false },
    { token_id: '95a427e384527065f2f8946f5e86320d0117839a5e98ea2c0b55fb00.48554e54', name: 'HUNT', loanFeeRate: 0.1, token_in_pool: 0, isSupply: false },
    { token_id: '2852268cf6e2db42e20f2fd3125f541e5d6c5a3d70b4dda17c2daa82', name: 'The O Token', loanFeeRate: 0.1, token_in_pool: 0, isSupply: false },
    { token_id: 'ececc92aeaaac1f5b665f567b01baec8bc2771804b4c21716a87a4e3.53504c415348', name: 'SPLASH', loanFeeRate: 0.1, token_in_pool: 0, isSupply: false },
    { token_id: 'f6099832f9563e4cf59602b3351c3c5a8a7dda2d44575ef69b82cf8d', name: 'OADA', loanFeeRate: 0.1, token_in_pool: 0, isSupply: false },

]
// End LIVE -----------------------------------------------------

export function cut2Decimals(num: number): number {
    const str = num.toString();
    if (str.includes(".")) {
        const [intPart, decPart] = str.split(".");
        return Number(intPart + "." + decPart.substring(0, 2));
    }
    return num;
}
export async function screenshort(page: Page, screenName: String) {
    console.log('Chụp màn hình');
    let timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    await page.screenshot({ path: `./Screenshort/${timestamp}_${screenName}.png` });
}

export function minimumMsg(token_test: number) {
    let formatted = token_list[token_test].min_tx.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return `Minimum value to supply is ${formatted} ${token_list[token_test].token_name}`;
}

export async function checkResult(defaultContext: Context, page: Page, imgNameErr: String, imgNameSuc: String) {
    const errorMsg = page.getByRole('alert').locator('text =/Get support here/');
    const result = await Promise.race([
        // Trường hợp mở trang mới
        defaultContext.waitForEvent('page').then((newPage: any) => ({ type: 'new-page', newPage })),

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
        // await page.pause();
        // Trở về màn supply
        await page.getByText('SUCCESS', { exact: true }).waitFor({ state: 'visible', timeout: 90000 });
        console.log('✅ Thao tác thành công');
        // await page.getByRole('alert').getByRole('link').isVisible({ timeout: 30000 });
        // const txurl = await page.getByRole('alert').getByRole('link').getAttribute('href');
        await screenshort(page, imgNameSuc);
        await page.getByRole('dialog', { name: 'SUCCESS' }).getByRole('button').click();
        // console.log('Tx hash: ' + txurl);
    }
}

export async function getMarketInfo(page: Page, token_name: String) {
    let min_tx_amount = await page.getByText('Minimum Amount').locator(':scope + *').textContent();
    let vailable_liquidity = await page.getByText('Available Liquidity').locator(':scope + *').textContent();
    let utilization_cappacity = await page.getByText('Utilization Capacity').locator(':scope + *').textContent();
    let current_utilization = await page.getByText('Current Utilization').locator(':scope + *').textContent();
    let total_supply = await page.getByText(`Total ${token_name} Supplies`).locator(':scope + *').textContent();
    let total_borrow = await page.getByText(`Total ${token_name} Borrows`).locator(':scope + *').textContent();
    if (total_supply != null) {
        let total_supply_num = parseFormattedNumber(total_supply);
        console.log(`${total_supply_num}`);
    }
    console.log(`${min_tx_amount} - ${vailable_liquidity} - ${utilization_cappacity} - ${current_utilization} - ${total_supply} - ${total_borrow}`);
}

function parseFormattedNumber(text: string): number {
    const match = text.match(/[\d,\.]+/); // Lấy phần chuỗi có số, dấu ',' và '.'
    if (!match) return 0;
    const raw = match[0];
    // Bước 1: Xóa dấu phẩy ngăn hàng nghìn
    // Bước 2: Giữ nguyên dấu chấm thập phân
    const normalized = raw.replace(/,/g, '');
    return Number(normalized);
}

export function saveToExcelFile(filePath: string, sheetName: string, rows: any[]) {
    // Chuyển sang sheet
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Xuất file Excel
    XLSX.writeFile(workbook, filePath);

    console.log(`✅ Đã ghi dữ liệu ra file ${filePath}.xlsx`);
}

export function saveToExcelFile2sheet(filePath: string, sheetNameError: string, sheetNameSuccess: string, rowsError: any[], rowsSuccess: any[]) {
    // Chuyển sang sheet
    const workbook = XLSX.utils.book_new();

    const errorSheet = XLSX.utils.json_to_sheet(rowsError);

    const successSheet = XLSX.utils.json_to_sheet(rowsSuccess);
    XLSX.utils.book_append_sheet(workbook, successSheet,sheetNameSuccess);
    XLSX.utils.book_append_sheet(workbook, errorSheet, sheetNameError);

    // Xuất file Excel
    XLSX.writeFile(workbook, filePath);

    console.log(`✅ Đã ghi dữ liệu ra file ${filePath}.xlsx`);
}

export function readFromExcelFile(filePath: string, sheetName: string): any[] {
    const workbook = XLSX.readFile(filePath);

    // Lấy sheet đầu tiên
    if (!workbook.SheetNames.includes(sheetName)) {
        throw new Error(`Sheet "${sheetName}" không tồn tại trong file Excel`);
    }
    const worksheet = workbook.Sheets[sheetName];

    // Chuyển thành JSON
    const rows: any[] = XLSX.utils.sheet_to_json(worksheet);
    return rows;

}

export function searchTokenName(data: any, token: string): string {
    let tokenName = 'NA'
    // console.log(`   Token ${token}`);
    for (const row of data) {
        // console.log(`token ${token} -------- row.Token ${row.Token}`);
        if (token === null || token === '') {
            tokenName = 'ADA';
            break;
        }
        else {
            if (token === row.collateralToken) {
                tokenName = row.collateralTokenName;
                // console.log(`   Search token collateralToken ${row.collateralToken} collateralTokenName ${row.collateralTokenName}`);
                break;
            };
        };
    };
    return tokenName;
}

export function searchAssetToken(data: any, tokenName: string): string {
    let token = 'NA'
    for (const row of data) {
        // console.log(`token ${token} -------- row.Token ${row.Token}`);
        if (tokenName === null || tokenName === '') {
            token = '';
            break;
        }
        else {
            if (tokenName === row.collateralTokenName) {
                token = row.collateralToken;
                break;
            };
        };
    };
    return token;
}