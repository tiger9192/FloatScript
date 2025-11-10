import { test, expect, request, APIRequestContext, APIResponse } from '@playwright/test';
import * as config from '../config';




test('verify HF', async () => {

    const baseToken = '919d4c2c9455016289341b1a14dedf697687af31751170d56a31466e.74444a4544';
    const quoteToken = '';
    const poolToken = '5bc56ab821b1efbce5be150bd97613c577f32167611211ef742c71f0.32c41815d270a4cc8be4bc9d3d171546b44d36cb57aa7b8b05618558';
    const collateralAmount_1 = 500000000; // ko chia decimal
    const collateralDecimal_1 = 1000000;
    const minADAAmount = 0; // ko chia decimal
    const borrowAmount = 518024197; // ko chia decimal
    const borrowDecimal = 1000000;

    const env = config.env('PREVIEW');

    const apiContext = await request.newContext();

    const price = await callAPIGetPrice(apiContext, baseToken, quoteToken, env.url, env.oracleScriptHash);
    const priceOfADA = await callAPIGetPrice(apiContext, '', quoteToken, env.url, env.oracleScriptHash);
    const threshold = await getHFOfToken(poolToken, baseToken, env.urlMarket);
    const thresholdOfADA = await getHFOfToken(poolToken, '', env.urlMarket);
    console.log(`price = ${price} threshold = ${threshold}`);
    const HF = ((collateralAmount_1 / collateralDecimal_1) * price * threshold + minADAAmount / 1000000 * priceOfADA * thresholdOfADA) / (borrowAmount / borrowDecimal);
    console.log(`HF = ${HF}`);


});

test('get HF', async () => {
    const baseToken = '919d4c2c9455016289341b1a14dedf697687af31751170d56a31466e.74444a4544';
    const poolToken = '5bc56ab821b1efbce5be150bd97613c577f32167611211ef742c71f0.32c41815d270a4cc8be4bc9d3d171546b44d36cb57aa7b8b05618558';
    const env = config.env('PREVIEW');
    const apiContext = await request.newContext();

    const threshold = await getHFOfToken(poolToken, baseToken, env.urlMarket);
    console.log(`HF = ${threshold}`);
})


async function callAPIGetPrice(apiContext: APIRequestContext, baseToken: string, quoteToken: string, url: string, scriptHash: string): Promise<number> {
    // console.log(`baseToken = ${baseToken} -- quoteToken = ${quoteToken} -- url= ${url} -- scriptHash= ${scriptHash}`);
    const requestParam = JSON.stringify({
        tokenPairs: [{
            baseToken: baseToken,
            quoteToken: quoteToken,
            oracleScriptHash: scriptHash
        }
        ]
    });
    const response = await apiContext.post(url, {
        headers: {
            'Content-Type': 'application/json'
        },
        data: requestParam

    });
    const responseBody = await response.json();
    if (responseBody.data.priceInfos.length > 0) {
        let exchangeRateNum = parseFloat(responseBody.data.priceInfos[0].exchangeRateNum);
        let exchangeRateDen = parseFloat(responseBody.data.priceInfos[0].exchangeRateDen);
        console.log(`exchangeRateNum = ${exchangeRateNum} -- exchangeRateDen = ${exchangeRateDen} }`);
        return exchangeRateNum / exchangeRateDen;
    } else {
        return 0;
    }
}

async function callAPIGetMarketParam(apiContext: APIRequestContext, url: string): Promise<APIResponse> {
    const response = await apiContext.get(url, {
        headers: {
            'Content-Type': 'application/json'
        },
    });
    return response;
}

async function getHFOfToken(pollToken: string, baseToken: string, urlMarket: string): Promise<number> {
    const apiContext = await request.newContext();
    let response = await callAPIGetMarketParam(apiContext, urlMarket);
    const responseMarketInfo = await response.json();
    const rows: any[] = [];
    let hf = 0
    responseMarketInfo.data.markets.forEach((market: any) => {
        if (market.poolId === pollToken) {
            // console.log(`pollToken = ${market.poolId}}`);
            const collaterals = market.supportedCollaterals.forEach((collateral: any) => {
                if (collateral.token === baseToken) {
                    console.log(`threshold = ${collateral.liquidationThreshold}`);
                    hf = parseFloat(collateral.liquidationThreshold);
                }
            });
        }
    });
    return hf;

}