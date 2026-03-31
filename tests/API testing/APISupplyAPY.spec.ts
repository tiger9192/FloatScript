import { test, expect, request } from '@playwright/test';
import * as XLSX from "xlsx";
import fs from 'fs';
import csv from 'csv-parser';
import * as common from '../Common';
import * as config from '../config';
import { callAPIPrice } from './HelperCommonAPI';
import { readResponse } from './HelperCommonAPI';
import * as APICommon from './HelperCommonAPI';


test('Check supply APY theo luồng Float supply Leverage ', async () => {
    test.setTimeout(9000000);
    let listSheets: common.SheetInput[] = [];

    let envFloat = config.env('MAIN_FLOAT');
    let envLeverage = config.env('MAIN_LEVERAGE');

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
        let calFloatSupplyAPY = market.borrowApr * market.utilization / 100 * (1 - pool.loanFeeRate)
        return { ...market, ...pool, calFloatSupplyAPY: calFloatSupplyAPY };
    });
    // listSheets.push({ sheetName: 'ListFloatPool', data: listFloatPool });
    // listSheets.push({ sheetName: 'ListFloatMarketParams', data: listFloatMarketParams });
    // listSheets.push({ sheetName: 'floatMergeTotalSupply', data: floatMergeTotalSupply });
    // listSheets.push({ sheetName: 'FloatData', data: floatPools });

    // Bước 3 Ghép dữ liệu Float và Leverage pool để tính supply APY cuối cùng trên pool
    let floatVSLeveragePools = floatPools.map((market: any) => {
        const pool = leveragePools.find((p: any) => p.poolId === market.alterToken);
        let lTokenRate = pool ? pool.dtokenRate : 0;
        let a = pool ? (market.alterAmount * lTokenRate) / market.totalSupply : 0;
        let calFloatVSLeverageSupplyAPY = market.calFloatSupplyAPY + a * (pool ? pool.supplyApy : 0);
        let leverageSupplyAPY = pool ? pool.supplyApy : 0;
        return { ...market, lTokenRate: lTokenRate, leverageSupplyAPY: leverageSupplyAPY, a: a, calFloatVSLeverageSupplyAPY: calFloatVSLeverageSupplyAPY };
    });

    // Bước 4: Gọi API load supply screen để lấy supply APY của từng pool.
    let supplAPYFromSupplyScreen = await callAPILoadSupplyScreen(floatVSLeveragePools, envFloat);
    // Ghép dữ liệu load supply screen với dữ liệu đã merge ở bước 3
    let mergeSupplyAPYFromSupplyScreen = floatVSLeveragePools.map((market: any) => {
        const pool = supplAPYFromSupplyScreen.find((p: any) => p.poolId === market.poolId);
        return { ...market, ...pool };
    });

    // Bước 5: Gọi API loan monitor để lấy supply APY của từng pool.
    let supplyAPYFromMarketInfo = await callAPILoanMonitor(floatVSLeveragePools, envFloat);
    // Ghép dữ liệu load loan monitor với dữ liệu đã merge ở bước 4
    let SupplyAPYFromMarketInfo = mergeSupplyAPYFromSupplyScreen.map((market: any) => {
        const pool = supplyAPYFromMarketInfo.find((p: any) => p.poolId === market.poolId);
        return { ...market, ...pool };
    });

    let checkResult = true;
    SupplyAPYFromMarketInfo.forEach((item: any) => {
        if (Math.round(item.supplyApy * 100) / 100 === Math.round(item.supplyAPYfromSupplyScreen * 100) / 100 &&
            Math.round(item.totalSupplyFromMaketInfo * 100) / 100 === Math.round(item.calFloatVSLeverageSupplyAPY * 100) / 100 &&
            Math.round(item.supplyApy * 100) / 100 === Math.round(item.totalSupplyFromMaketInfo * 100) / 100
        ) {
            // ko lam gi ca
        }
        else {
            checkResult = false;
            console.log(`Pool ${item.poolId} - ${item.tokenName} has different supply APY. 
                Supply APY from main screen: ${item.supplyApy}, supply APY from market info: ${item.totalSupplyFromMaketInfo}, 
                supply APY from supply screen: ${item.supplyAPYfromSupplyScreen}, total supply calculated: ${item.calFloatVSLeverageSupplyAPY}`);
        }
    });


    // save data ra file Excel
    // listSheets.push({ sheetName: 'floatVSLeveragePools', data: floatVSLeveragePools });
    // listSheets.push({ sheetName: 'mergeSupplyAPYFromSupplyScreen', data: mergeSupplyAPYFromSupplyScreen });
    // Lưu toàn bộ dữ liệu đã ghép ra file excel
    listSheets.push({ sheetName: 'mergeSupplyAPYFromMarketInfo', data: SupplyAPYFromMarketInfo });
    common.saveToExcelFileMultipleSheets(`test-results/Supply_APY_${envFloat.resultName}_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.xlsx`, listSheets);
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
