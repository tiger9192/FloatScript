import { Page, BrowserContext, expect } from '@playwright/test';
import { Context } from 'vm';
import * as XLSX from "xlsx";

// export const domain = 'https://danogo.landing.dev.teko.vn/';
export const domain = 'https://preview.landing.dev.teko.vn/';
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
    { token_id: 'c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad.0014df105553444d', name: 'USDM', min_tx: '35', loanFeeRate: 0.1, token_in_pool: 0 },
    { token_id: '25c5de5f5b286073c593edfd77b48abc7a48e5a4f3d4cd9d428ff935.425443', name: 'BTC', min_tx: '35', loanFeeRate: 0.1, token_in_pool: 0 },
    { token_id: '8db269c3ec630e06ae29f74bc39edd1f87c819f1056206e879a1cd61.446a65644d6963726f555344', name: 'DJED', min_tx: '35', loanFeeRate: 0.1, token_in_pool: 0.000001 },
    { token_id: 'fe7c786ab321f41c654ef6c1af7b3250a613c24e4213e0425a7ae456.55534441', name: 'USDA', min_tx: '35', loanFeeRate: 0.1, token_in_pool: 0.000001 },
    { token_id: '25c5de5f5b286073c593edfd77b48abc7a48e5a4f3d4cd9d428ff935.55534443', name: 'USDC', min_tx: '35', loanFeeRate: 0.1, token_in_pool: 0 },
    { token_id: '25c5de5f5b286073c593edfd77b48abc7a48e5a4f3d4cd9d428ff935.55534454', name: 'USDT', min_tx: '35', loanFeeRate: 0.1, token_in_pool: 285.73299144 },

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

export function saveToExcelFile(filePath: string, rows: any[]) {
    // Chuyển sang sheet
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Markets");

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
    for (const row of data) {
        // console.log(`token ${token} -------- row.Token ${row.Token}`);
        if (token === null || token === '') {
            tokenName = 'ADA';
            break;
        }
        else {
            if (token === row.Token) {
                tokenName = row.TokenName;
                break;
            };
        };
    };
    return tokenName;
}