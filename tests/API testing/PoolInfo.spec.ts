import { test, expect, request } from '@playwright/test';
import * as XLSX from "xlsx";
import fs from 'fs';
import csv from 'csv-parser';
import * as common from '../Common';
import * as config from '../config';
import { callAPIPrice } from './HelperCommonAPI';
import { readResponse } from './HelperCommonAPI';


test('Get pool info ', async () => {
    test.setTimeout(9000000);
    const inputFileName = './tests/datatest/ListFloatPools.xlsx';
    const inputSheetName = 'ListPools';
    const env1 = config.env('PREPROD_FLOAT');
    // await callAPIPoolInfo(inputFileName, inputSheetName, env1, 'PoolInfo_PREPROD_FLOAT');
});

test('Get lending pool ', async () => {
    test.setTimeout(9000000);
    const inputSheetName = 'ListPools';
    const env1 = config.env('PREPROD_FLOAT');
    let response = await callAPILendingPool(env1);
    let data = await response.json();
    let results: any[] = [];
    for (const item of data.data.pools) {
        results.push({
            poolId: item.poolId,
            token: item.token,
            liquidity: item.liquidity,
            liquidityInUsd: item.liquidityInUsd,
            totalBorrow: item.totalBorrow,
            utilization: item.utilization,
            supplyApy: item.supplyApy,
            borrowApr: item.borrowApr,
        }

        );
    }
    let timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    common.saveToExcelFile(`test-results/LendingPool_${timestamp}.xlsx`, 'Pool Info', results);
});

test('Get supply screen ', async () => {
    test.setTimeout(9000000);
    const inputFileName = './tests/datatest/ListFloatPools.xlsx';
    const inputSheetName = 'ListPools';
    const env1 = config.env('PREPROD_FLOAT');
    // await callAPILoadSupplyScreen(inputFileName, inputSheetName, env1, 'SupplyScreen_PREPROD_FLOAT');
});

test('Get borrow screen ', async () => {
    test.setTimeout(9000000);
    const inputFileName = './tests/datatest/ListFloatPools.xlsx';
    const inputSheetName = 'ListPools';
    const env1 = config.env('PREPROD_FLOAT');
    // await callAPILoadBorrowScreen(inputFileName, inputSheetName, env1, 'BorrowScreen_PREPROD_FLOAT');
});

test('Read pool config ', async () => {
    test.setTimeout(9000000);
    let listSheets: common.SheetInput[] = [];

    let marketParamsFloat = await callAPIMarketParams(config.env('PREPROD_FLOAT'));
    listSheets.push({ sheetName: 'MarketParams_Float', data: marketParamsFloat });

    let marketParamsLeverage = await callAPIMarketParams(config.env('PREPROD_LEVERAGE'));
    listSheets.push({ sheetName: 'MarketParams_Leverage', data: marketParamsLeverage });

    // save data ra file Excel
    common.saveToExcelFileMultipleSheets(`test-results/AllData_PREPROD_FLOAT_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.xlsx`, listSheets);
});

test('Read DB ', async () => {
    test.setTimeout(9000000);
    let listSheets: common.SheetInput[] = [];
    let env = config.env('PREPROD_FLOAT');
    let listTokenFloat = await readDBdata('./tests/datatest/DB_Float_Pools.xlsx', 'FloatListPools', env);
    listSheets.push({ sheetName: 'ListPools_Float', data: listTokenFloat });

    // save data ra file Excel
    common.saveToExcelFileMultipleSheets(`test-results/AllData_PREPROD_FLOAT_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.xlsx`, listSheets);
});

test('Get all data merge float và leverage full', async () => {
    test.setTimeout(9000000);
    let listSheets: common.SheetInput[] = [];
    let env = config.env('PREPROD_FLOAT');
    console.log(` Bước 1 đọc db pool float trong file excel`);
    let listTokenFloat = await readDBdata('./tests/datatest/DB_Float_Pools.xlsx', 'FloatListPools', env);
    listTokenFloat.sort((a: any, b: any) => (a.pool_token > b.pool_token) ? 1 : -1);
    console.log(` Bước 2 đọc db pool leverage trong file excel`);
    let listTokenLeverage = await readDBdata('./tests/datatest/DB_Float_Pools.xlsx', 'LeverageListPools', env);
    console.log(` Bước 3: Gọi API Market Parame của float`)
    let marketParamsFloat = await callAPIMarketParams(config.env('PREPROD_FLOAT'));
    marketParamsFloat.sort((a: any, b: any) => (a.Pool_id > b.Pool_id) ? 1 : -1);
    listSheets.push({ sheetName: 'MarketParams_Float', data: marketParamsFloat });

    console.log(` Bước 4: Gọi API Market Parame của Leverage`);
    let marketParamsLeverage = await callAPIMarketParams(config.env('PREPROD_LEVERAGE'));
    listSheets.push({ sheetName: 'MarketParams_Leverage', data: marketParamsLeverage });

    // Ghép dữ liệu Leverage vào Float
    for (let i = 0; i < listTokenFloat.length; i++) {
        for (const itemLeverage of listTokenLeverage) {
            if (listTokenFloat[i].alter_name !== undefined) {
                const partA = listTokenFloat[i].alter_name.split('.')[1];
                const partB = itemLeverage.pool_token.split('.')[1];
                if (partA === partB) {
                    listTokenFloat[i].leverage_pool_token = itemLeverage.pool_token;
                    listTokenFloat[i].leverage_supply_token = itemLeverage.supply_token;
                    listTokenFloat[i].leverage_total_supply = itemLeverage.total_supply;
                    listTokenFloat[i].leverage_total_borrow = itemLeverage.total_borrow;
                    listTokenFloat[i].leverage_borrow_apr = itemLeverage.borrow_apy;
                }
            }
        }
        listTokenFloat[i].TokenName = marketParamsFloat[i].TokenName;
        listTokenFloat[i].FLoanFeeRate = marketParamsFloat[i].loanFeeRate;
        listTokenFloat[i].FutilizationCap = marketParamsFloat[i].utilizationCap;
        listTokenFloat[i].FsupplyLeverage = marketParamsFloat[i].supplyLeverage;
        for (const itemLeverageParam of marketParamsLeverage) {
            if (listTokenFloat[i].alter_name !== undefined) {
                const partA = listTokenFloat[i].alter_name.split('.')[1];
                const partB = itemLeverageParam.Pool_id.split('.')[1];
                if (partA === partB) {
                    listTokenFloat[i].FLoanFeeRate = itemLeverageParam.loanFeeRate;
                    listTokenFloat[i].FutilizationCap = itemLeverageParam.utilizationCap;
                }
            }
        }
    }
    listTokenFloat.sort((a: any, b: any) => (a.pool_token > b.pool_token) ? 1 : -1);
    listSheets.push({ sheetName: 'DataFromDB_Float', data: listTokenFloat });
    listTokenLeverage.sort((a: any, b: any) => (a.pool_token > b.pool_token) ? 1 : -1);
    listSheets.push({ sheetName: 'DataFromDB_Leverage', data: listTokenLeverage });

    console.log(` Bước 5: Gọi API Market Info`);
    env = config.env('PREPROD_FLOAT');
    let results = await callAPIPoolInfo(listTokenFloat, env, 'PoolInfo');
    results.sort((a: any, b: any) => (a.poolId > b.poolId) ? 1 : -1);
    listSheets.push({ sheetName: 'MarketInfo', data: results });

    console.log(` Bước 6: Gọi API lending pool`);
    let response = await callAPILendingPool(env);
    let data = await response.json();
    let lendingResults: any[] = [];
    for (const item of data.data.pools) {
        lendingResults.push({
            poolId: item.poolId,
            token: item.token,
            liquidity: item.liquidity,
            liquidityInUsd: item.liquidityInUsd,
            totalBorrow: item.totalBorrow,
            utilization: item.utilization,
            supplyApy: item.supplyApy,
            borrowApr: item.borrowApr,
        }
        );
    }
    lendingResults.sort((a: any, b: any) => (a.poolId > b.poolId) ? 1 : -1);
    listSheets.push({ sheetName: 'LendingPool', data: lendingResults });

    console.log(` Bước 7: Gọi API Supply Screen`);
    let supplyResults = await callAPILoadSupplyScreen(listTokenFloat, env, 'SupplyScreen');
    supplyResults.sort((a: any, b: any) => (a.pool_token > b.pool_token) ? 1 : -1);
    listSheets.push({ sheetName: 'SupplyScreen', data: supplyResults });
    console.log(` Bước 8: Gọi API Borrow Screen`);
    let borrowResults = await callAPILoadBorrowScreen(listTokenFloat, env, 'BorrowScreen');
    borrowResults.sort((a: any, b: any) => (a.poolId > b.poolId) ? 1 : -1);
    listSheets.push({ sheetName: 'BorrowScreen', data: borrowResults });



    // save data ra file Excel
    common.saveToExcelFileMultipleSheets(`test-results/AllData_PREPROD_FLOAT_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.xlsx`, listSheets);
});

test('Lấy all data ghep float và Leverage', async () => {
    test.setTimeout(9000000);
    let listSheets: common.SheetInput[] = [];
    // Bước 1: đọc dữ liệu từ DB    
    let env = config.env('PREPROD_FLOAT');
    let listTokenFloat = await readDBdata('./tests/datatest/DB_Float_Pools.xlsx', 'FloatListPools', env);
    let listTokenLeverage = await readDBdata('./tests/datatest/DB_Float_Pools.xlsx', 'LeverageListPools', env);

    // Ghép dữ liệu Leverage vào Float
    for (const itemFloat of listTokenFloat) {
        for (const itemLeverage of listTokenLeverage) {
            if (itemFloat.alter_name !== undefined) {
                const partA = itemFloat.alter_name.split('.')[1];
                const partB = itemLeverage.pool_token.split('.')[1];
                if (partA === partB) {
                    itemFloat.leverage_pool_token = itemLeverage.pool_token;
                    itemFloat.leverage_supply_token = itemLeverage.supply_token;
                    itemFloat.leverage_total_supply = itemLeverage.total_supply;
                    itemFloat.leverage_total_borrow = itemLeverage.total_borrow;
                    itemFloat.leverage_borrow_apr = itemLeverage.borrow_apy;
                }
            }
        }

    }
    listTokenFloat.sort((a: any, b: any) => (a.pool_token > b.pool_token) ? 1 : -1);
    listSheets.push({ sheetName: 'DataFromDB_Float', data: listTokenFloat });
    listTokenLeverage.sort((a: any, b: any) => (a.pool_token > b.pool_token) ? 1 : -1);
    listSheets.push({ sheetName: 'DataFromDB_Leverage', data: listTokenLeverage });

    // Bước 2: Gọi API Market Info
    env = config.env('PREPROD_FLOAT');
    let results = await callAPIPoolInfo(listTokenFloat, env, 'PoolInfo');
    results.sort((a: any, b: any) => (a.poolId > b.poolId) ? 1 : -1);
    listSheets.push({ sheetName: 'MarketInfo', data: results });

    // Bước 3: Gọi API lending pool
    let response = await callAPILendingPool(env);
    let data = await response.json();
    let lendingResults: any[] = [];
    for (const item of data.data.pools) {
        lendingResults.push({
            poolId: item.poolId,
            token: item.token,
            liquidity: item.liquidity,
            liquidityInUsd: item.liquidityInUsd,
            totalBorrow: item.totalBorrow,
            utilization: item.utilization,
            supplyApy: item.supplyApy,
            borrowApr: item.borrowApr,
        }
        );
    }
    lendingResults.sort((a: any, b: any) => (a.poolId > b.poolId) ? 1 : -1);
    listSheets.push({ sheetName: 'LendingPool', data: lendingResults });

    // Bước 4: Gọi API Supply Screen
    let supplyResults = await callAPILoadSupplyScreen(listTokenFloat, env, 'SupplyScreen');
    supplyResults.sort((a: any, b: any) => (a.pool_token > b.pool_token) ? 1 : -1);
    listSheets.push({ sheetName: 'SupplyScreen', data: supplyResults });
    // Bước 5: Gọi API Borrow Screen
    let borrowResults = await callAPILoadBorrowScreen(listTokenFloat, env, 'BorrowScreen');
    borrowResults.sort((a: any, b: any) => (a.poolId > b.poolId) ? 1 : -1);
    listSheets.push({ sheetName: 'BorrowScreen', data: borrowResults });

    // Bước 6: Gọi API Market Parame của float
    let marketParamsFloat = await callAPIMarketParams(config.env('PREPROD_FLOAT'));


    marketParamsFloat = marketParamsFloat.filter((col: any) =>
        listTokenFloat.some((t: any) => t.pool_token === col.Pool_id)
    );
    marketParamsFloat.sort((a: any, b: any) => (a.Pool_id > b.Pool_id) ? 1 : -1);
    listSheets.push({ sheetName: 'MarketParams_Float', data: marketParamsFloat });

    // Bước 7: Gọi API Market Parame của Leverage
    let marketParamsLeverage = await callAPIMarketParams(config.env('PREPROD_LEVERAGE'));
    listSheets.push({ sheetName: 'MarketParams_Leverage', data: marketParamsLeverage });

    // save data ra file Excel
    common.saveToExcelFileMultipleSheets(`test-results/AllData_PREPROD_FLOAT_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.xlsx`, listSheets);
});

async function callAPIMarketParams(env: any): Promise<any> {
    const apiContext = await request.newContext();
    const response = await apiContext.get(env.urlMarket, {
        headers: {
            'Content-Type': 'application/json'
        },
    });
    expect(response.status()).toBe(200);
    const responseMarketInfo = await response.json();
    const rows: any[] = [];

    responseMarketInfo.data.markets.forEach((market: any) => {
        let altTokens = market.alternativeSupplyTokens || [];
        let supplyLeverage = false;
        altTokens.forEach((altToken: any) => {
            if (altToken.protocolName === 'Leverage' && altToken.isEnable === true) {
                supplyLeverage = true;
            }
        });
        rows.push({
            Pool_id: market.poolId,
            Token: market.token,
            TokenName: market.tokenName,
            loanFeeRate: market.loanFeeRate,
            utilizationCap: market.utilizationCap,
            supplyLeverage: supplyLeverage
        });
    });
    return rows;
}

async function readDBdata(inputFileName: string, inputSheetName: string, env: any): Promise<any> {
    const listTokenPairs = common.readFromExcelFile(inputFileName, inputSheetName);
    console.log(`Total records from DB: ${listTokenPairs.length}`);

    for (const item of listTokenPairs) {
        let multiAsset = JSON.parse(item.multi_assets);
        console.log(`Processing Pool ID: ${item.pool_token}`);
        for (const asset of multiAsset) {
            let token_id = '';
            if (asset.asset_name === '') {
                token_id = asset.policy_id;
            }
            else {
                token_id = asset.policy_id + '.' + asset.asset_name;

            }
            console.log(`Supply token ${item.supply_token}`);
            // kiểm tra asset có trùng với supply token ko, nếu trùng thì ghi nhận amount vào token gốc
            if (token_id === item.supply_token) {
                item.token = token_id;
                item.token_amount = asset.amount;
            }
            // nếu supply token = empty thì token_amount = coin

            else if (item.supply_token === undefined) {
                item.token = '';
                item.token_amount = item.coin;
            }
            else if (asset.amount > 1) {

                item.alter_name = token_id;
                item.alter_amount = asset.amount;
                let response = await callAPIPrice(token_id, item.supply_token ?? '', '', env.oracleScriptHash, env.urlPrice);
                let price = await readResponse(response);
                if (price != null && price.exchangeRateNum > 0) {
                    item.alter_price_num = price.exchangeRateNum
                    item.alter_price_dem = price.exchangeRateDen;
                }
            }
        }
    }
    return listTokenPairs;
}

async function callAPIPoolInfo(listTokenPairs: any[], env: any, outputFileName: string): Promise<any> {
    let index = 0;
    const results: any[] = [];
    for (const item of listTokenPairs) {

        let response = await callAPIGetPoolInfo(item.pool_token, env);
        // const responseV3NoDen = await callAPIPrice(item.collateralToken ?? '', item.Token ?? '',  '', v3SKH, env.urlPrice);
        let data = await response.json();
        console.log(`Processed ${data.poolID}`);
        results.push(data);

    }
    return results;
}

async function callAPIGetPoolInfo(poolId: string, env: any): Promise<any> {
    console.log(`Calling API get pool info for Pool ID: ${poolId}`);
    const apiContext = await request.newContext();
    let requestParam = JSON.stringify({});

    const response = await apiContext.get(`${env.poolUrl}?poolId=${poolId}`, {
        headers: {
            'Content-Type': 'application/json'
        },
        data: requestParam

    });
    return response;
}

async function callAPILendingPool(env: any): Promise<any> {
    console.log(`Calling API lending pool`);
    const apiContext = await request.newContext();
    let requestParam = JSON.stringify({});

    const response = await apiContext.post(`${env.lendingUrl}load-main-screen`, {
        headers: {
            'Content-Type': 'application/json'
        },
        data: requestParam

    });
    return response;
}


async function callAPILoadSupplyScreen(listTokenPairs: any[], env: any, outputFileName: string): Promise<any> {
    let index = 0;
    const results: any[] = [];
    for (const item of listTokenPairs) {

        let response = await callAPILoadSupplySceen(item.pool_token, env);
        // const responseV3NoDen = await callAPIPrice(item.collateralToken ?? '', item.Token ?? '',  '', v3SKH, env.urlPrice);
        let data = await response.json();
        results.push({ ...data.data, pool_token: item.pool_token });

    }
    return results;
}
async function callAPILoadSupplySceen(poolId: string, env: any): Promise<any> {
    console.log(`Calling API Load Supply Sceen`);
    const apiContext = await request.newContext();
    let requestParam = JSON.stringify({});

    const response = await apiContext.post(`${env.lendingUrl}load-supply-screen`, {
        headers: {
            'Content-Type': 'application/json'
        },
        data: JSON.stringify({
            poolId: poolId
        })

    });
    return response;
}

async function callAPILoadBorrowScreen(listTokenPairs: any[], env: any, outputFileName: string): Promise<any> {
    let index = 0;
    const results: any[] = [];
    for (const item of listTokenPairs) {

        let response = await callAPILoadBorrowSceen(item.pool_token, env);
        let data = await response.json();
        results.push(data.data);

    }
    return results;
}

async function callAPILoadBorrowSceen(poolId: string, env: any): Promise<any> {
    console.log(`Calling API Load borrow Sceen`);
    const apiContext = await request.newContext();

    const response = await apiContext.get(`${env.lendingUrl}load-borrow-screen?poolId=${poolId}`, {
        headers: {
            'Content-Type': 'application/json'
        }
    });
    return response;
}