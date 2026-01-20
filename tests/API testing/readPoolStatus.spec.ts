import { test, expect, request } from '@playwright/test';
import * as XLSX from "xlsx";
import fs from 'fs';
import csv from 'csv-parser';
import * as common from '../Common';

test('Parse list pool', async () => {
    const rowData = common.readExcelFileToTable('./tests/datatest/listPools.xlsx', 'Pools');
    const listpool: any[] = [];
    for (const item of rowData) {
        // console.log('----- ' + item);
        let jsonData: any;
        try {
            jsonData = JSON.parse(item);
            // console.log(jsonData.messageType);
            if (jsonData.messageType === 'SplashG3Pool') {
                listpool.push(await splashPool(jsonData));
                let length = listpool.length;
                // console.log(`SplashG3Pool ${listpool[length - 1].x} - ${listpool[length - 1].y}`);
            }
            else if (jsonData.messageType === 'ConcentratedPool') {
                listpool.push(await concentratedPool(jsonData));
                let length = listpool.length;
                console.log(`Concentrated pool ${listpool[length - 1].x} - ${listpool[length - 1].y}`);
            }
        } catch (e) {
            throw new Error('Không parse được JSON: ' + e);
        }

    }
    console.log(listpool.length);
     let timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    common.saveToExcelFile(`./test-results/listPools_parsed_${timestamp}.xlsx`, 'PoolsInfo', listpool);
})

type PoolInfo = {
    
    outref: string;
    tokenA: string;
    tokenB: string;
    validityNft: string;
    x: number;
    y: number;
    lpFee: number;
    lowerPrice: number;
    upperPrice: number;
    minX: number;
    minY: number;
};

async function splashPool(jsonData: any): Promise<PoolInfo> {

    let poolInfo: PoolInfo;
    console.log(jsonData.messageType);
    let tokenA = jsonData.result.pool.tokenA;
    let tokenB = jsonData.result.pool.tokenB;
    console.log(`Splash Token A  ${tokenA} - ${tokenB}`);
    // console.log(`Token B  ${tokenB}`);
    let tokenAAmount = 0;
    let tokenBAmount = 0;
    if (tokenA === '') {
        tokenAAmount = jsonData.result.pool.coin;
        for (const asset of jsonData.result.pool.multiAssets) {
            let assetName = asset.policyId + '.' + asset.assets[0].name;
            if (assetName === tokenB) {
                tokenBAmount = Number(asset.assets[0].value);
            }
        }
    }
    else if (tokenB === '') {
        
        tokenBAmount = jsonData.result.pool.coin;
        for (const asset of jsonData.result.pool.multiAssets) {
            let assetName = asset.policyId + '.' + asset.assets[0].name;
            // console.log('Asset name '+assetName);
            if (assetName === tokenA) {
                tokenAAmount = Number(asset.assets[0].value);
            }
        }
    }
    let treasuryA = jsonData.result.pool.treasuryA;
    let treasuryB = jsonData.result.pool.treasuryB;
    let royaltyA = jsonData.result.pool.royaltyA;
    let royaltyB = jsonData.result.pool.royaltyB;
    let poolFee = jsonData.result.pool.poolFee;
    let treasuryFee = jsonData.result.pool.treasuryFee;
    let royaltyFee = jsonData.result.pool.royaltyFee;

    poolInfo = {
        validityNft: jsonData.result.pool.validityNft,
        outref: jsonData.result.pool.outRef,
        tokenA: tokenA,
        tokenB: tokenB,
        x: tokenAAmount - treasuryA - royaltyA,
        y: tokenBAmount - treasuryB - royaltyB,
        lpFee: ((100000 - (poolFee - treasuryFee - royaltyFee)) / 100000), // đây là số % rồi
        lowerPrice: 0,
        upperPrice: 0,
        minX: 0,
        minY: 0
    };
    console.log(`Splash Pool Info ${JSON.stringify(poolInfo)}`);
    return poolInfo;
}



async function concentratedPool(jsonData: any): Promise<PoolInfo> {

    let poolInfo: PoolInfo;
    console.log(jsonData.messageType);
    let tokenA = jsonData.result.pool.tokenA;
    let tokenB = jsonData.result.pool.tokenB;
    // console.log(`Token A  ${tokenA}`);
    // console.log(`Token B  ${tokenB}`);
    let tokenAAmount = 0;
    let tokenBAmount = 0;
    if (tokenA === '') {
        tokenAAmount = jsonData.result.pool.coin - 3000000;
        for (const asset of jsonData.result.pool.multiAssets) {
            let assetName = asset.policyId + '.' + asset.assets[0].name;
            if (assetName === tokenB) {
                tokenBAmount = Number(asset.assets[0].value);
            }
        }
    }
    else if (tokenB === '') {
        tokenBAmount = jsonData.result.pool.coin - 3000000;
        for (const asset of jsonData.result.pool.multiAssets) {
            let assetName = asset.policyId + '.' + asset.assets[0].name;
            // console.log('Asset name '+assetName);
            if (assetName === tokenA) {
                tokenAAmount = Number(asset.assets[0].value);
            }
        }
    }
    let platformFeeA = jsonData.result.pool.platformFeeA;
    let platformFeeB = jsonData.result.pool.platformFeeB;
    let minTxAmountA = jsonData.result.pool.minTxAmountA;
    let minTxAmountB = jsonData.result.pool.minTxAmountB;
    let poolFeeRate = jsonData.result.pool.poolFeeRate;
    let sqrtPriceLowerNum = jsonData.result.pool.sqrtPriceLowerNum;
    let sqrtPriceLowerDen = jsonData.result.pool.sqrtPriceLowerDen;
    let sqrtPriceUpperNum = jsonData.result.pool.sqrtPriceUpperNum;
    let sqrtPriceUpperDen = jsonData.result.pool.sqrtPriceUpperDen;
    poolInfo = {
        validityNft: jsonData.result.pool.validityNft,
        outref: jsonData.result.pool.outRef,
        tokenA: tokenA,
        tokenB: tokenB,
        x: tokenAAmount - platformFeeA,
        y: tokenBAmount - platformFeeB,
        lpFee: poolFeeRate / 10000, // đây là số % rồi
        lowerPrice: (sqrtPriceLowerNum / sqrtPriceLowerDen) ** 2,
        upperPrice: (sqrtPriceUpperNum / sqrtPriceUpperDen) ** 2,
        minX: minTxAmountA,
        minY: minTxAmountB,
    }

    return poolInfo;
}