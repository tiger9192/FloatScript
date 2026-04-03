import { test, expect, request } from '@playwright/test';
import * as XLSX from "xlsx";
import fs from 'fs';
import csv from 'csv-parser';
import * as common from '../Common';

test('Parse list pool', async () => {
    const rowData = common.readExcelFileToTable('./tests/datatest/listPools.xlsx', 'Pools');
    const listpool: any[] = [];
    let listPoolInverse: any[] = [];
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
    listPoolInverse = getPoolInverse(listpool);
    let timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    // common.saveToExcelFile(`./test-results/listPools_parsed_${timestamp}.xlsx`, 'PoolsInfo', listpool);
    common.saveToExcelFile2sheet(`./test-results/listPools_parsed_${timestamp}.xlsx`, 'PoolsInfo', 'PoolsInfo_Inverse', listpool, listPoolInverse);
})

test('Call API indexer get concentrated pool', async () => {
    let listSheets: common.SheetInput[] = [];
    const rowData = common.readFromExcelFile('./tests/datatest/listConcentratedPools.xlsx', 'Pools');
    let marketPriceList = await callAPIIndexerGetConcenPool(rowData);
    // let marketPriceList = marketPrice(listpool.data.liquidityPools);
    listSheets.push({ sheetName: 'marketPriceList', data: marketPriceList });
    common.saveToExcelFileMultipleSheets(`test-results/listMarketPrices_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.xlsx`, listSheets);
})

async function callAPIIndexerGetConcenPool(listPool: any[]): Promise<any> {
    // console.log(`Calling API Get  ${env.urlMonitor}/api/v1/load-market-info?poolId=${poolId}`);
    const listMarketPrice: any[] = [];
    console.log(listPool[0].poolId);
    for (const item of listPool) {
        let url = 'https://dapp-indexers-preprod.dev.tekoapis.net/api/v1/concentrated/pools?limit=10&poolNfts=' + item.poolId;
        console.log(`Calling API Get  ${url}`);
        const apiContext = await request.newContext();
        const response = await apiContext.get(url, {
            headers: {
                'Content-Type': 'application/json'
            },
        });
        expect(response.status()).toBe(200);
        const responsePoolInfo = await response.json();
        console.log(`Pool ${responsePoolInfo.data.liquidityPools[0].lpToken} - ${responsePoolInfo.data.liquidityPools[0].lX}/${responsePoolInfo.data.liquidityPools[0].lY} `);
        listMarketPrice.push({
            poolNft:item.poolId,
            lpToken: responsePoolInfo.data.liquidityPools[0].lpToken,
            tokenA: responsePoolInfo.data.liquidityPools[0].tokenA,
            tokenB: responsePoolInfo.data.liquidityPools[0].tokenB,
            lX: responsePoolInfo.data.liquidityPools[0].lX,
            lY: responsePoolInfo.data.liquidityPools[0].lY,
            price_YX: responsePoolInfo.data.liquidityPools[0].lY / responsePoolInfo.data.liquidityPools[0].lX,
            price_XY: responsePoolInfo.data.liquidityPools[0].lX / responsePoolInfo.data.liquidityPools[0].lY,
        })
    }
    return listMarketPrice;
}

function marketPrice(listPool: any[]): any[] {
    const listMarketPrice: any[] = [];
    for (const item of listPool) {
        console.log(`Pool ${item.poolId} - ${item.tokenA}/${item.tokenB} - Liquidity ${item.liquidity}`);
        listMarketPrice.push({
            lpToken: item.lpToken,
            price_YX: item.lY / item.lX,
            price_XY: item.lX / item.lY,
        })
    }
    return listMarketPrice;
}

type PoolInfo = {


    tokenA: string;
    tokenB: string;
    outref: string;
    validityNft: string;
    x: number;
    y: number;
    lpFee: number;
    lowerPrice: number;
    upperPrice: number;
    minX: number;
    minY: number;
    feeX: number;
    feeY: number;
    assetX: number;
    assetY: number;
    sqrtLowerPrice: number;
    sqrtUpperPrice: number;
};

function getPoolInverse(poolInfo: any[]): any[] {
    let listPoolInverse: any[] = [];
    let poolInverse: PoolInfo;
    for (const key of poolInfo) {
        poolInverse = {
            tokenA: key.tokenB,
            tokenB: key.tokenA,
            validityNft: key.validityNft,
            outref: key.outref,
            x: key.y,
            y: key.x,
            lpFee: key.lpFee, // đây là số % rồi
            lowerPrice: key.upperPrice ? 1 / key.upperPrice : 0,
            upperPrice: key.lowerPrice ? 1 / key.lowerPrice : 0,
            minX: key.minY,
            minY: key.minX,
            feeX: key.feeY,
            feeY: key.feeX,
            assetX: key.assetY,
            assetY: key.assetX,
            sqrtLowerPrice: key.sqrtUpperPrice ? 1 / key.sqrtUpperPrice : 0,
            sqrtUpperPrice: key.sqrtLowerPrice ? 1 / key.sqrtLowerPrice : 0,
        };
        listPoolInverse.push(poolInverse)
    }
    return listPoolInverse;
}

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
    else {
        for (const asset of jsonData.result.pool.multiAssets) {
            let assetName = asset.policyId + '.' + asset.assets[0].name;
            if (assetName === tokenB) {
                tokenBAmount = Number(asset.assets[0].value);
            }
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
        tokenA: tokenA,
        tokenB: tokenB,
        validityNft: jsonData.result.pool.validityNft,
        outref: jsonData.result.pool.outRef,
        x: tokenAAmount - treasuryA - royaltyA,
        y: tokenBAmount - treasuryB - royaltyB,
        lpFee: ((100000 - (poolFee - treasuryFee - royaltyFee)) / 100000), // đây là số % rồi
        lowerPrice: 0,
        upperPrice: 0,
        minX: 0,
        minY: 0,
        feeX: 0,
        feeY: 0,
        assetX: tokenAAmount,
        assetY: tokenBAmount,
        sqrtLowerPrice: 0,
        sqrtUpperPrice: 0,
    };

    // console.log(`Splash Pool Info ${JSON.stringify(poolInfo)}`);
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
        tokenAAmount = jsonData.result.pool.coin - jsonData.result.pool.totalSwapFee;
        for (const asset of jsonData.result.pool.multiAssets) {
            let assetName = asset.policyId + '.' + asset.assets[0].name;
            if (assetName === tokenB) {
                tokenBAmount = Number(asset.assets[0].value);
            }
        }
    }
    else if (tokenB === '') {
        tokenBAmount = jsonData.result.pool.coin - 3000000 - jsonData.result.pool.totalSwapFee;
        for (const asset of jsonData.result.pool.multiAssets) {
            let assetName = asset.policyId + '.' + asset.assets[0].name;
            // console.log('Asset name '+assetName);
            if (assetName === tokenA) {
                tokenAAmount = Number(asset.assets[0].value);
            }
        }
    }
    else {
        for (const asset of jsonData.result.pool.multiAssets) {
            let assetName = asset.policyId + '.' + asset.assets[0].name;
            if (assetName === tokenB) {
                tokenBAmount = Number(asset.assets[0].value);
            }
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
        tokenA: tokenA,
        tokenB: tokenB,
        validityNft: jsonData.result.pool.validityNft,
        outref: jsonData.result.pool.outRef,
        x: tokenAAmount - platformFeeA,
        y: tokenBAmount - platformFeeB,
        lpFee: poolFeeRate / 10000, // đây là số % rồi
        lowerPrice: (sqrtPriceLowerNum / sqrtPriceLowerDen) ** 2,
        upperPrice: (sqrtPriceUpperNum / sqrtPriceUpperDen) ** 2,
        minX: minTxAmountA,
        minY: minTxAmountB,
        feeX: platformFeeA,
        feeY: platformFeeB,
        assetX: tokenAAmount,
        assetY: tokenBAmount,
        sqrtLowerPrice: (sqrtPriceLowerNum / sqrtPriceLowerDen),
        sqrtUpperPrice: (sqrtPriceUpperNum / sqrtPriceUpperDen),
    }

    return poolInfo;
}