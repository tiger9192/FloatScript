import { test, expect, request } from '@playwright/test';
import * as XLSX from "xlsx";
import fs from 'fs';
import csv from 'csv-parser';
import * as common from '../Common';
import * as config from '../config';
import { callAPIPrice } from './HelperCommonAPI';
import { readResponse } from './HelperCommonAPI';
import * as APICommon from './HelperCommonAPI';


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

test('Check API reserve pool', async () => {
    test.setTimeout(9000000);
    let listSheets: common.SheetInput[] = [];
    let envLeverage = config.env('PREPROD_LEVERAGE');
    let envFloat = config.env('PREPROD_FLOAT');
    let listFloatMarketParams = await APICommon.callAPIMarketParams(envFloat);
    let listFloatPool = await APICommon.callAPILoadMainScreen(envFloat);
    let listFloatTotalSupply = await APICommon.callAPIResevePool(envFloat);
    // Ghép dữ liệu Market Params và Load main screen của Leverage
    let floatMergeTotalSupply = listFloatPool.map((market: any) => {
        const pool = listFloatTotalSupply.find((p: any) => p.poolId === market.poolId);
        return { ...market, ...pool };
    });

    // Ghép dữ liệu Market Params và Load main screen của Leverage
    let floatPools = floatMergeTotalSupply.map((market: any) => {
        const pool = listFloatMarketParams.find((p: any) => p.poolId === market.poolId);
        let calSupplyFloatAPY = market.borrowApr * market.utilization / 100 * (1 - pool.loanFeeRate)
        return { ...market, ...pool, calSupplyFloatAPY: calSupplyFloatAPY };
    });
    listSheets.push({ sheetName: 'ListFloatPool', data: listFloatPool });
    listSheets.push({ sheetName: 'ListFloatMarketParams', data: listFloatMarketParams });
    listSheets.push({ sheetName: 'FloatTotalSupply', data: listFloatTotalSupply });
    listSheets.push({ sheetName: 'floatMergeTotalSupply', data: floatMergeTotalSupply });
    listSheets.push({ sheetName: 'FloatData', data: floatPools });

    common.saveToExcelFileMultipleSheets(`test-results/Float_Pool_info_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.xlsx`, listSheets);
});

test('Check supply APY theo luồng Float supply Leverage ', async () => {
    test.setTimeout(9000000);
    let listSheets: common.SheetInput[] = [];

    let envFloat = config.env('MAIN_FLOAT');
    let envLeverage = config.env('MAIN_LEVERAGE');

    // Bước 1: Gọi API Market Parame, load main screen của Leverage để lấy thông tin pool leverage
    let listLeverageMarketParams = await APICommon.callAPIMarketParams(envLeverage);
    let listLeveragePool = await APICommon.callAPILoadMainScreen(envLeverage);
    let leveragePools = listLeveragePool.map((market: any) => {
        const pool = listLeverageMarketParams.find((p: any) => p.poolId === market.poolId);
        return { ...market, ...pool };
    });

    // listSheets.push({ sheetName: 'ListLeverageMarketParams', data: listLeverageMarketParams });
    // listSheets.push({ sheetName: 'ListLeveragePool', data: listLeveragePool });
    // listSheets.push({ sheetName: 'LeverageData', data: leveragePools });

    // Buớc 2: Gọi API Market Parame của float để lấy thông tin pool float
    let listFloatMarketParams = await APICommon.callAPIMarketParams(envFloat);
    let listFloatPool = await APICommon.callAPILoadMainScreen(envFloat);
    let listFloatTotalSupply = await APICommon.callAPIResevePool(envFloat);
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
        let calFloatVSLeverageSupplyAPY = market.calFloatSupplyAPY + a * (pool ? pool.supplApy : 0);
        let leverageSupplyAPY = pool ? pool.calSupplyAPY : 0;
        return { ...market, lTokenRate: lTokenRate, leverageSupplyAPY: leverageSupplyAPY, a: a, calFloatVSLeverageSupplyAPY: calFloatVSLeverageSupplyAPY };
    });

    // floatVSLeveragePools.forEach(async (pool: any) => {
    //     console.log(`Duyệt từng pool để lấy supply APY ở màn Supply screen $poolId: ${pool.poolId}`);
    //     let supplyScreenSupplyAPY = await APICommon.callAPILoadSupplyScreenGetSupplyAPY(pool.poolId, envFloat);
    //     floatVSLeveragePools.push({ ...pool, supplyScreenSupplyAPY: supplyScreenSupplyAPY });
    // });
    let supplyScreenSupplyAPY = await APICommon.callAPILoadSupplyScreenGetSupplyAPY(floatVSLeveragePools[0].poolId, envFloat);

    // save data ra file Excel
    listSheets.push({ sheetName: 'floatVSLeveragePools', data: floatVSLeveragePools });
    common.saveToExcelFileMultipleSheets(`test-results/AllData_PREPROD_FLOAT_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.xlsx`, listSheets);
});

test('Check API price', async () => {
    let envFloat = config.env('MAIN_FLOAT');
    let supplyScreenSupplyAPY = await APICommon.callAPILoadSupplyScreenGetSupplyAPY('814de8a99452972a9fa9fe2c0f59f49697f208005c001ecac1ddfd57.f04403181fbd051edd971af67b85f6c6fe1d9d98949a80b9f3803a14', envFloat);
});

test('Get all data merge float và leverage full', async () => {
    test.setTimeout(9000000);
    let listSheets: common.SheetInput[] = [];
    let envFloat = config.env('PREPROD_FLOAT');
    let envLeverage = config.env('PREPROD_LEVERAGE');

    console.log(` Bước 1 đọc db pool float trong file excel`);
    let listTokenFloat = await readDBdata('./tests/datatest/DB_Float_Pools.xlsx', 'FloatListPools', envFloat);
    listTokenFloat.sort((a: any, b: any) => (a.pool_token > b.pool_token) ? 1 : -1);

    console.log(` Bước 2 đọc db pool leverage trong file excel`);
    let listTokenLeverage = await readDBdata('./tests/datatest/DB_Float_Pools.xlsx', 'LeverageListPools', envLeverage);

    console.log(` Bước 3: Gọi API Market Parame của float`)
    let marketParamsFloat = await callAPIMarketParams(envFloat);
    marketParamsFloat.sort((a: any, b: any) => (a.Pool_id > b.Pool_id) ? 1 : -1);
    listSheets.push({ sheetName: 'MarketParams_Float', data: marketParamsFloat });

    console.log(` Bước 4: Gọi API Market Parame của Leverage`);
    let marketParamsLeverage = await callAPIMarketParams(envLeverage);
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
                console.log(`So sánh partA: ${partA} với partB: ${partB}`);
                if (partA === partB) {
                    console.log(`Tìm thấy match LoanFeeRate và utilizationCap cho pool ${itemLeverageParam.loanFeeRate}`);
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
    // env = config.env('PREPROD_FLOAT');
    let results = await callAPIPoolInfo(listTokenFloat, envFloat, 'PoolInfo');
    results.sort((a: any, b: any) => (a.poolId > b.poolId) ? 1 : -1);
    listSheets.push({ sheetName: 'MarketInfo', data: results });

    console.log(` Bước 6: Gọi API lending pool`);
    let response = await callAPILendingPool(envFloat);
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
    let supplyResults = await callAPILoadSupplyScreen(listTokenFloat, envFloat, 'SupplyScreen');
    supplyResults.sort((a: any, b: any) => (a.pool_token > b.pool_token) ? 1 : -1);
    listSheets.push({ sheetName: 'SupplyScreen', data: supplyResults });
    console.log(` Bước 8: Gọi API Borrow Screen`);
    let borrowResults = await callAPILoadBorrowScreen(listTokenFloat, envFloat, 'BorrowScreen');
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
    console.log(`Calling API Market Info ${env.urlMarket}`);
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
            Pool_id: market.poolId,
            Token: market.token,
            TokenName: market.tokenName,
            LoanFeeRate: market.loanFeeRate,
            UtilizationCap: market.utilizationCap,
            SupplyLeverage: supplyLeverage,
            AlterToken: alterToken,
            AlterAmount: alterAmount,
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