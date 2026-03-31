import { test, expect, request } from '@playwright/test';
import * as XLSX from "xlsx";
import fs from 'fs';
import csv from 'csv-parser';
import * as common from '../Common';
import * as config from '../config';
import { callAPIPrice } from './HelperCommonAPI';
import { readResponse } from './HelperCommonAPI';
import * as APICommon from './HelperCommonAPI';

let floatPools: any[] = [];

test.beforeAll(async () => {
  console.log('Chạy 1 lần trước tất cả test');

    test.setTimeout(9000000);
    let listSheets: common.SheetInput[] = [];

    let envFloat = config.env('MAIN_FLOAT');
    let envLeverage = config.env('MAIN_LEVERAGE');

    // Buớc 1: Gọi API main screen của float để lấy thông tin pool float
    let floatPoolsMainScreen = await APICommon.callAPILoadMainScreen(envFloat);
    let listFloatPool = readPoolInfoFromAPIListPool(floatPoolsMainScreen.data.pools);

    // Bước 2: gọi API market param của float pool
    let loatMarketParams = await APICommon.callAPIMarketParams(envFloat);
    let listFloatMarketParams = readMarketParamPool(loatMarketParams.data.markets);

    // Bước 3: gọi API load borrow screen để lấy total supply của float pool
    let listFloatTotalSupply = await callAPILoadBorrowScreenToGetTotalSupply(listFloatPool, envFloat);
    // Ghép dữ liệu Load main screen và total supply của float
    let floatMergeTotalSupply = listFloatPool.map((market: any) => {
        const pool = listFloatTotalSupply.find((p: any) => p.poolId === market.poolId);
        return { ...market, ...pool };
    });

    // Ghép dữ liệu và Load main screen và Market param của Float
    floatPools = floatMergeTotalSupply.map((market: any) => {
        const pool = listFloatMarketParams.find((p: any) => p.poolId === market.poolId);
        let calFloatSupplyAPY = market.borrowApr * market.utilization / 100 * (1 - pool.loanFeeRate)
        return { ...market, ...pool, calFloatSupplyAPY: calFloatSupplyAPY };
    });
   
    // Lưu toàn bộ dữ liệu đã ghép ra file excel
    listSheets.push({ sheetName: 'floatPools', data: floatPools });
    common.saveToExcelFileMultipleSheets(`test-results/Supply_APY_${envFloat.resultName}_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.xlsx`, listSheets);
});


test('Check supply APY theo luồng Float supply Leverage ', async () => {
    console.log('Bắt đầu test: Check supply APY theo luồng Float supply Leverage');
});

/** Đọc list market params của từng pool
 * trả về list gồm poolId, token, tokenName, loanFeeRate, alterToken, alterAmount (số lượng token leverage đã supply vào pool)
 */
function readMarketParamPool(listPool: any[]): any[] {
    const rows: any[] = [];
    listPool.forEach((market: any) => {
        let altTokens = market.alternativeSupplyTokens || [];
        let supplyLeverage = false;
        let alterAmount = 0;
        let alterToken = '';
        altTokens.forEach((altToken: any) => {
            if (altToken.protocolName === 'Leverage' && altToken.isEnable === true) {
                supplyLeverage = true;
                alterAmount = altToken.tokenAmount;
                alterToken = altToken.poolId;
            }
        });
        rows.push({
            poolId: market.poolId,
            token: market.token,
            tokenName: market.tokenName,
            loanFeeRate: market.loanFeeRate,
            alterToken: alterToken,
            alterAmount: alterAmount,
        });
    });
    return rows;
}

/** Đọc pool info từ API load main screen, trả về list gồm poolId, token, tokenName, totalBorrow, utilization, borrowApr, supplyApy, dTokenRate
 */
function readPoolInfoFromAPIListPool(listPool: any[]): any[] {
    const rows: any[] = [];
    listPool.forEach((pool: any) => {
        rows.push({
            poolId: pool.poolId,
            token: pool.token,
            tokenName: pool.tokenName,
            totalBorrow: pool.totalBorrow,
            utilization: pool.utilization,
            liquidity: pool.liquidity,
            borrowApr: pool.borrowApr,
            supplyApy: pool.supplyApy,
            dtokenRate: pool.dTokenRate,
        });
    });
    return rows;
}

// Call API load supply screen để lấy supply APY của từng pool. Trả về list của tất cả pool
async function callAPILoadSupplyScreen(listTokenPairs: any[], env: any): Promise<any> {
    const results: any[] = [];
    for (const item of listTokenPairs) {

        let response = await APICommon.callAPILoadSupplyScreen(item.poolId, env);
        results.push({ poolId: item.poolId, supplyAPYfromSupplyScreen: response.data.supplyApy });
    }
    return results;
}

// call API load borrow screen để lấy total supply của từng pool. Trả về list của tất cả pool
async function callAPILoadBorrowScreenToGetTotalSupply(listTokenPairs: any[], env: any): Promise<any> {
    const results: any[] = [];
    for (const item of listTokenPairs) {

        let response = await APICommon.callAPILoadBorrowScreen(item.poolId, env);
        results.push({ poolId: item.poolId, totalSupply: response.data.totalSupply });
    }
    return results;
}

// call API loan monitor để lấy supply APY của từng pool. Trả về list của tất cả pool
async function callAPILoanMonitor(listTokenPairs: any[], env: any): Promise<any> {
    const results: any[] = [];
    for (const item of listTokenPairs) {

        let response = await APICommon.callAPIGetMarketInfo(item.poolId, env);
        results.push({ poolId: item.poolId, totalSupplyFromMaketInfo: response.supplyApy });
    }
    return results;
}
