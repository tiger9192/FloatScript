import { test, expect, request } from '@playwright/test';
import * as XLSX from "xlsx";
import * as common from '../Common';
import * as config from '../config';
import * as APICommon from './HelperCommonAPI';
import { it } from 'node:test';

const envLeverage = config.env('PREPROD_LEVERAGE');
// const envLeverage = config.env('MAIN_LEVERAGE');

test('Call API get all Liquidity Pools', async () => {
    let listSheets: common.SheetInput[] = [];
    let marketPriceList = await callAPILiquidityPool(envLeverage);
    listSheets.push({ sheetName: 'listLiquidityPools', data: marketPriceList });
    common.saveToExcelFileMultipleSheets(`test-results/listMarketPrices_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.xlsx`, listSheets);
})

async function callAPILiquidityPool(env: any): Promise<any> {
    // console.log(`Calling API Get  ${env.urlMonitor}/api/v1/load-market-info?poolId=${poolId}`);
    const listPools: any[] = [];
    let listLiquidityPool = await APICommon.callAPIListLiquidityPool(env);

    for (const item of listLiquidityPool.data.liquidityPools) {
        let availableA = item.tokenAReserve - item.platformFeeA;
        let availableB = item.tokenBReserve - item.platformFeeB;
        if (item.tokenA === '') {
            availableA = availableA - item.swapFee;
        }
        if (item.tokenB === '') {
            availableB = availableB - item.swapFee;
        }
        listPools.push({
            // poolNft: item.poolId,
            lpToken: item.lpToken,
            outRef: item.outRef,
            tokenA: item.tokenA,
            tokenB: item.tokenB,
            tokenAReserve: parseFloat(item.tokenAReserve),
            tokenBReserve: parseFloat(item.tokenBReserve),
            platformFeeA: parseFloat(item.platformFeeA),
            platformFeeB: parseFloat(item.platformFeeB),
            totalSwapFee: parseFloat(item.totalSwapFee),
            // availableA: availableA,
            // availableB: availableB,
            priceLowerNum: item.priceLowerNum,
            priceLowerDen: item.priceLowerDen,
            priceUpperNum: item.priceUpperNum,
            priceUpperDen: item.priceUpperDen,
            lX: parseFloat(item.lX),
            lY: parseFloat(item.lY),
            price_YX: parseFloat(item.lY) / parseFloat(item.lX),
            price_XY: parseFloat(item.lX) / parseFloat(item.lY),
        })
    }
    return listPools;
}