import { test, expect, request } from '@playwright/test';
import * as XLSX from "xlsx";
import fs from 'fs';
import csv from 'csv-parser';
import * as common from '../Common';
import * as config from '../config';


test('Compare Price Main V1 Vs Beta V3.0 ', async () => {
    test.setTimeout(9000000);
    const inputFileName = './tests/datatest/ListFloatPools.xlsx';
    const inputSheetName = 'ListPools';
    const env1 = config.env('PREPROD_FLOAT');
    await callAPIPoolInfo(inputFileName, inputSheetName, env1, 'PoolInfo_PREPROD_FLOAT');
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
    await callAPILoadSupplyScreen(inputFileName, inputSheetName, env1, 'SupplyScreen_PREPROD_FLOAT');
});

test('Get borrow screen ', async () => {
    test.setTimeout(9000000);
    const inputFileName = './tests/datatest/ListFloatPools.xlsx';
    const inputSheetName = 'ListPools';
    const env1 = config.env('PREPROD_FLOAT');
    await callAPILoadBorrowScreen(inputFileName, inputSheetName, env1, 'BorrowScreen_PREPROD_FLOAT');
});


async function callAPIPoolInfo(inputFileName: string, inputSheetName: string, env: any, outputFileName: string) {
    const listTokenPairs = common.readFromExcelFile(inputFileName, inputSheetName);
    let index = 0;
    const results: any[] = [];
    for (const item of listTokenPairs) {

        let response = await callAPIGetPoolInfo(item.pool_token, env);
        // const responseV3NoDen = await callAPIPrice(item.collateralToken ?? '', item.Token ?? '',  '', v3SKH, env.urlPrice);
        let data = await response.json();
        console.log(`Processed ${data.poolID}`);
        results.push(data);

    }
    // ✅ Sau vòng lặp mới ghi file Excel
    let timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    common.saveToExcelFile(`test-results/${outputFileName}_${timestamp}.xlsx`, 'Pool Info', results);
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


async function callAPILoadSupplyScreen(inputFileName: string, inputSheetName: string, env: any, outputFileName: string) {
    const listTokenPairs = common.readFromExcelFile(inputFileName, inputSheetName);
    let index = 0;
    const results: any[] = [];
    for (const item of listTokenPairs) {

        let response = await callAPILoadSupplySceen(item.pool_token, env);
        // const responseV3NoDen = await callAPIPrice(item.collateralToken ?? '', item.Token ?? '',  '', v3SKH, env.urlPrice);
        let data = await response.json();
        results.push(data.data);

    }
    // ✅ Sau vòng lặp mới ghi file Excel
    let timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    common.saveToExcelFile(`test-results/${outputFileName}_${timestamp}.xlsx`, 'SupplyScreen', results);
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

async function callAPILoadBorrowScreen(inputFileName: string, inputSheetName: string, env: any, outputFileName: string) {
    const listTokenPairs = common.readFromExcelFile(inputFileName, inputSheetName);
    let index = 0;
    const results: any[] = [];
    for (const item of listTokenPairs) {

        let response = await callAPILoadBorrowSceen(item.pool_token, env);
        let data = await response.json();
        results.push(data.data);

    }
    // ✅ Sau vòng lặp mới ghi file Excel
    let timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    common.saveToExcelFile(`test-results/${outputFileName}_${timestamp}.xlsx`, 'BorrowScreen', results);
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