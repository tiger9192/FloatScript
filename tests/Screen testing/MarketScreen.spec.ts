import { test, expect, chromium, Browser, Page, request } from '@playwright/test';
import * as config from '../config';
import { Context } from 'vm';
import * as common from '../Common';
import { promises } from 'dns';

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

test('check your supplies number on Market screen and Supply screen', async () => {
    test.setTimeout(50000)
    const marketMySupply = await marketScreenGetSupplyData(page);
    const supplyMySupply = await supplyScreenGetSupplyData(page);
    expect(marketMySupply.totalSupply).toEqual(supplyMySupply.totalSupply);
    expect(marketMySupply.lockAsCollateral).toEqual(supplyMySupply.lockAsCollateral);

});

test('check your supplies number on Supply screen', async () => {
    test.setTimeout(80000)
    const mySupply = await supplyScreenGetSupplyData(page);
    await getTokenAsset(mySupply);
    await checkConvertUSD(mySupply);


});
async function marketScreenGetSupplyData(page: Page): Promise<any> {
    console.log('✅ Open maket screen ');
    let mySupply = {
        totalSupply: '',
        lockAsCollateral: ''
    };
    // Truy cập màn supply
    await page.goto(`${env.lendingUrl}market`);
    await page.waitForTimeout(8000);
    // await page.getByRole('button', { name: 'View Supplies' }).waitFor({ state: 'visible' });
    // await page.pause();
    // lấy số total supply ở màn market
    mySupply.totalSupply = await page
        .getByText('Total Supplied')
        .locator('xpath=following-sibling::span//span')
        .innerText();
    console.log('Total Supplied: ', mySupply.totalSupply);
    // await getUserData(page);
    // lấy số lock as collateral ở màn market
    mySupply.lockAsCollateral = (await page
        .getByText('Total locked as Collateral')
        .locator('..')
        .locator('..')
        .locator('span')
        .textContent()) ?? '';
    console.log('Total locked as Collateral: ', mySupply.lockAsCollateral);
    return mySupply;
}

async function checkConvertUSD(mySupply: any) {
    const rowCount = mySupply.tokenNameList.length;
    let totalSupply = 0;
    let lockAsCollateral = 0;
    for (let i = 0; i < rowCount; i++) {
        const walletBalance = getNumberToken(mySupply.walletBalanceToken[i]);
        // check lại về giá USDM lấy ntn
        const price = await getTokenPriceUSD(mySupply.tokenAssetList[i], env.usdm, walletBalance.toString());
        const walletBalanceDolla = parseFloat(walletBalance) * price;
        console.log(`👉 Token ${mySupply.tokenNameList[i]} Price ${price}`);
        const supplied = getNumberToken(mySupply.totalSuppliedValuesToken[i]);
        const suppliedDolla = parseFloat(supplied) * price;

        const collateral = getNumberToken(mySupply.totalLockAsCollateralToken[i]);
        const collateralDolla = parseFloat(collateral) * price;
        console.log(`   Wallet Balance ${walletBalance} - Wallet balance in USD ${walletBalanceDolla} - trên UI đang hiển thị ${mySupply.walletBalance$[i]}`);
        console.log(`   Total supply ${supplied} - Total supply in USD ${suppliedDolla} - trên UI đang hiển thị ${mySupply.totalSuppliedValues$[i]}`);
        console.log(`   Lock as collateral ${collateral} - Lock as collateral ${collateralDolla} - trên UI đang hiển thị ${mySupply.totalLockAsCollateral$[i]}`);
        totalSupply = totalSupply + parseFloat(getNumberToken(mySupply.totalSuppliedValues$[i]));
        lockAsCollateral = lockAsCollateral + parseFloat(getNumberToken(mySupply.totalLockAsCollateral$[i]));
    }
    console.log(`  Total suppl ${totalSupply} - lock as collateral ${lockAsCollateral}`);
    console.log(`  Số trên UI Total suppl ${mySupply.totalSupply} - lock as collateral ${mySupply.lockAsCollateral}`);
    expect(totalSupply.toString(), 'So sánh total supply').toEqual(getNumberToken(mySupply.totalSupply));
    expect(lockAsCollateral.toString(),'So sánh total locked as collateral').toEqual(getNumberToken(mySupply.lockAsCollateral));
    expect(totalSupply,'Total supply < collateral').toBeGreaterThan(lockAsCollateral);
}

function getNumberToken(stringToken: string): any {

    if (stringToken.startsWith("$")) {
        stringToken = stringToken.slice(1); // cắt ký tự đầu tiên
    }
    const number = stringToken.split(" ")[0];
    const number2 = number.match(/^([\d.,]+)([A-Za-z]*)$/);
    if (number2) {
        const numberPart = number2[1];
        const unitPart = number2[2];
        if (unitPart === 'K')
            return parseFloat(numberPart) * 1000;
        if (unitPart === 'M')
            return parseFloat(numberPart) * 1000000;
        return numberPart;
    }
    return 0;

}
async function getTokenPriceUSD(baseToken: string, quoteToken: string, denominator: string): Promise<any> {
    const apiContext = await request.newContext();
    const requestParam = JSON.stringify({
        tokenPairs: [{
            baseToken: baseToken,
            quoteToken: quoteToken,
            denominator: denominator,
            oracleScriptHash: env.oracleScriptHash
        }
        ]
    });
    const response = await apiContext.post(env.urlPrice, {
        headers: {
            'Content-Type': 'application/json'
        },
        data: requestParam

    });
    if (response.status() === 200) {
        const responseBody = await response.json();
        const exchangeRateNum = parseFloat(responseBody.data.priceInfos[0].exchangeRateNum);
        const exchangeRateDen = parseFloat(responseBody.data.priceInfos[0].exchangeRateDen);
        return exchangeRateNum / exchangeRateDen;
    }
    else return 0;
}


async function getTokenAsset(mySupply: any) {
    const fileName = `test-results/market_${env.resultName}.xlsx`;
    const listTokenPairs = common.readFromExcelFile(fileName, 'Markets');
    const rowCount = mySupply.tokenNameList.length;
    for (let i = 0; i < rowCount; i++) {
        const tokenAsset = common.searchAssetToken(listTokenPairs, mySupply.tokenNameList[i]);
        mySupply.tokenAssetList.push(tokenAsset);
    }
    console.log(`asset name : ${mySupply.tokenAssetList}`);
}

async function supplyScreenGetSupplyData(page: Page): Promise<any> {
    console.log('✅ Open supply screen ');
    let mySupply = {
        totalSupply: '',
        lockAsCollateral: '',
        tokenNameList: [] as string[],
        tokenAssetList: [] as string[],
        totalSuppliedValues$: [] as string[],
        totalLockAsCollateral$: [] as string[],
        walletBalance$: [] as string[],
        totalSuppliedValuesToken: [] as string[],
        totalLockAsCollateralToken: [] as string[],
        walletBalanceToken: [] as string[],
    };
    await page.goto(`${env.lendingUrl}supply`);
    await page.waitForTimeout(8000);
    // lấy total supply ở màn supply
    mySupply.totalSupply = await page
        .getByText('Total Supplied')
        .locator('xpath=following-sibling::span//span')
        .innerText();
    console.log('Total Supplied: ', mySupply.totalSupply);
    // lấy số lock as collateral ở màn supply
    mySupply.lockAsCollateral = (await page
        .getByText('Total locked as Collateral')
        .locator('..') // lên div.flex-row
        .locator('..') // lên div.flex-col
        .locator('span').first() // chọn span trong đó
        .textContent()) ?? '';
    console.log('Total locked as Collateral: ', mySupply.lockAsCollateral);
    // lấy giá trị trong bảng
    const rows = page.locator("table._table_vpwq7_1 tbody tr");
    const rowCount = await rows.count();
    for (let i = 0; i < rowCount; i++) {
        // đọc data của bảng
        const token = await rows.nth(i).locator("td").nth(0).locator("span.text-white.text-sm.font-semibold").innerText();
        const balance$ = await rows.nth(i).locator("td").nth(1).locator("span.text-white.text-sm.font-medium").innerText();
        const balanceToken = await rows.nth(i).locator("td").nth(1).locator("span.text-white.text-sm.font-medium + span").innerText();
        const totalSupply$ = await rows.nth(i).locator("td").nth(2).locator("span.text-white.text-sm.font-medium").innerText();
        const totalSupplyToken = await rows.nth(i).locator("td").nth(2).locator("span.text-white.text-sm.font-medium + span").innerText();
        const lockAsCollateral$ = await rows.nth(i).locator("td").nth(3).locator("span.text-white.text-sm.font-medium").innerText();
        const lockAsCollateralToken = await rows.nth(i).locator("td").nth(3).locator("span.text-white.text-sm.font-medium + span").innerText();
        mySupply.tokenNameList.push(token);
        mySupply.walletBalance$.push(balance$);
        mySupply.totalSuppliedValues$.push(totalSupply$);
        mySupply.totalLockAsCollateral$.push(lockAsCollateral$);
        mySupply.walletBalanceToken.push(balanceToken);
        mySupply.totalSuppliedValuesToken.push(totalSupplyToken);
        mySupply.totalLockAsCollateralToken.push(lockAsCollateralToken);
    }
    console.log(`token list: ${mySupply.tokenNameList}`);
    console.log(`wallet balance: ${mySupply.walletBalance$}`);
    console.log(`Total supply value: ${mySupply.totalSuppliedValues$}`);
    console.log(`lock as collateral : ${mySupply.totalLockAsCollateral$}`);
    console.log(`wallet balance: ${mySupply.walletBalanceToken}`);
    console.log(`Total supply value: ${mySupply.totalSuppliedValuesToken}`);
    console.log(`lock as collateral : ${mySupply.totalLockAsCollateralToken}`);
    return mySupply;
}

