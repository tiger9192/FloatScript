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
const envFloat = config.env('MAIN_FLOAT');
const envLeverage = config.env('MAIN_LEVERAGE');

test.beforeAll(async () => {
    console.log('Chạy 1 lần trước tất cả test');

    test.setTimeout(9000000);
    let listSheets: common.SheetInput[] = [];

    // Bước 1: Gọi API Market Parame, load main screen của Leverage để lấy thông tin pool leverage
    let leveragePoolsMainScreen = await APICommon.callAPILoadMainScreen(envLeverage);
    let listLeveragePool = readPoolInfoFromAPIListPool(leveragePoolsMainScreen.data.pools);
    let leverageMarketParams = await APICommon.callAPIMarketParams(envLeverage);
    let listLeverageMarketParams = readMarketParamPool(leverageMarketParams.data.markets);

    // merge dữ liệu load main screen và market param của leverage
    let leveragePools = listLeveragePool.map((market: any) => {
        const pool = listLeverageMarketParams.find((p: any) => p.poolId === market.poolId);
        return { ...market, ...pool };
    });

    // listSheets.push({ sheetName: 'ListLeverageMarketParams', data: listLeverageMarketParams });
    // listSheets.push({ sheetName: 'ListLeveragePool', data: listLeveragePool });
    // listSheets.push({ sheetName: 'leveragePools', data: leveragePools });

    // Buớc 2: Gọi API Market Parame của float để lấy thông tin pool float
    let floatPoolsMainScreen = await APICommon.callAPILoadMainScreen(envFloat);
    let listFloatPool = readPoolInfoFromAPIListPool(floatPoolsMainScreen.data.pools);
    let loatMarketParams = await APICommon.callAPIMarketParams(envFloat);
    let listFloatMarketParams = readMarketParamPool(loatMarketParams.data.markets);
    let listFloatTotalSupply = await callAPILoadBorrowScreenToGetTotalSupply(listFloatPool, envFloat);
    // Ghép dữ liệu Load main screen và total supply của float
    let floatMergeTotalSupply = listFloatPool.map((market: any) => {
        const pool = listFloatTotalSupply.find((p: any) => p.poolId === market.poolId);
        return { ...market, ...pool };
    });

    // Ghép dữ liệu và Load main screen và Market param của Float
    let floatPools = floatMergeTotalSupply.map((market: any) => {
        const pool = listFloatMarketParams.find((p: any) => p.poolId === market.poolId);
        return { ...market, ...pool };
    });
    // listSheets.push({ sheetName: 'ListFloatPool', data: listFloatPool });
    // listSheets.push({ sheetName: 'ListFloatMarketParams', data: listFloatMarketParams });
    // listSheets.push({ sheetName: 'floatMergeTotalSupply', data: floatMergeTotalSupply });
    // listSheets.push({ sheetName: 'FloatData', data: floatPools });

    // Bước 3 Ghép dữ liệu pool Float supply vào pool Leverage
    let floatVSLeveragePools = floatPools.map((market: any) => {
        const pool = leveragePools.find((p: any) => p.poolId === market.alterToken);
        let lTokenRate = pool ? pool.dtokenRate : 0;
        let a = pool ? (market.alterAmount * lTokenRate) / market.totalSupply : 0;
        // let calFloatVSLeverageSupplyAPY = market.calFloatSupplyAPY + a * (pool ? pool.supplyApy : 0);
        let leverageSupplyAPY = pool ? pool.supplyApy : 0;
        let leverageTotalBorrow = pool ? pool.totalBorrow : 0;
        return { ...market, lTokenRate: lTokenRate, leverageSupplyAPY: leverageSupplyAPY, a: a, leverageTotalBorrow: leverageTotalBorrow };
    });

    // Lưu toàn bộ dữ liệu đã ghép ra file excel
    listSheets.push({ sheetName: 'floatPools', data: floatVSLeveragePools });
    common.saveToExcelFileMultipleSheets(`test-results/Supply_APY_${envFloat.resultName}_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.xlsx`, listSheets);
});


test('Check total active loan ', async () => {
    console.log('Bắt đầu test: Check total active loan');
    test.setTimeout(9000000);
    let testResults = true;
    for (const item of floatPools) {
        let responseMarketInfo = await APICommon.callAPIGetMarketInfo(item.poolId, envFloat);
        let responseCollateralData = await APICommon.callAPIGetCollateraData(item.poolId, envFloat);
        let msg = checkTotalActiveLoan(responseMarketInfo, responseCollateralData);
        if (msg !== "") {
            console.log(msg);
            testResults = false;
        }
    }
    expect(testResults).toBeTruthy();
});

test('Check total borrow value', async () => {
    console.log('Bắt đầu test: Check total borrow');
    test.setTimeout(9000000);
    let testResults = true;
    for (const item of floatPools) {
        let responseMarketInfo = await APICommon.callAPIGetMarketInfo(item.poolId, envFloat);
        let responseCollateralData = await APICommon.callAPIGetCollateraData(item.poolId, envFloat);
        let msg = checkTotalBorrowValue(responseMarketInfo, responseCollateralData);
        if (msg !== "") {
            console.log(msg);
            testResults = false;
        }
    }
    expect(testResults).toBeTruthy();
});

function checkTotalActiveLoan(pool: any, responseCollateralData: any): string {
    let totalActiveLoan = 0;
    for (const item of responseCollateralData.loanDistribution) {
        totalActiveLoan = totalActiveLoan + item.numberOfLoans;
    }
    if (totalActiveLoan === pool.totalActiveLoans) {
        return ""
    }
    else {
        return `Pool ${pool.poolId} - ${pool.tokenSymbol} không khớp total active loan, API load market info trả về ${pool.totalActiveLoans}, API collateral trả về ${totalActiveLoan}`
    }

}

function checkTotalBorrowValue(pool: any, responseCollateralData: any): string {
    let totalBorrowValue = 0;
    for (const item of responseCollateralData.loanDistribution) {
        totalBorrowValue = totalBorrowValue + parseFloat(item.totalLoanValue);
    }
    if (totalBorrowValue === parseFloat(pool.totalBorrowValue)) {
        return ""
    }
    else {
        return `Pool ${pool.poolId} - ${pool.tokenSymbol} không khớp total borrow value, API load market info trả về ${pool.totalBorrowValue}, API collateral trả về ${totalBorrowValue}`
    }

}

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
