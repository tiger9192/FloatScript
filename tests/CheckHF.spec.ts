import { test, expect, request, APIRequestContext, APIResponse } from '@playwright/test';
// import * as common from './Common';




test('verify HF', async () => {

    const baseToken = '919d4c2c9455016289341b1a14dedf697687af31751170d56a31466e.74444a4544';
    const quoteToken = '';
    const poolToken =  '5bc56ab821b1efbce5be150bd97613c577f32167611211ef742c71f0.32c41815d270a4cc8be4bc9d3d171546b44d36cb57aa7b8b05618558';
    const collateralAmount_1 = 500000000; // ko chia decimal
    const collateralDecimal_1 = 1000000;
    const minADAAmount = 0; // ko chia decimal
    const borrowAmount = 518024197; // ko chia decimal
    const borrowDecimal = 1000000;
    let env = 'DEV';

    let urlMarket = '';
    let oracleScriptHash = '';
    let url = '';
    if (env === 'DEV') {
        oracleScriptHash = 'a2fa8564c279ca144d69bbbd37057f5d3d42e59555bc3bfb874919f6';
        url = 'https://onchain-price-aggregator.dev.tekoapis.net/api/v1/prices';
        urlMarket = 'https://crypto-admin-bff.dev.tekoapis.net/api/v1/float-lending/markets';
    }
    else if (env === 'Preprod') {

        oracleScriptHash = '79d908a5964f87c44d867ced2ca620751edfa844e0f21685180048bd';
        url = 'https://onchain-price-preprod.dev.tekoapis.net/api/v1/prices';
        urlMarket = 'https://crypto-admin-bff.dev.tekoapis.net/api/v1/float-lending/markets';
    }
    const apiContext = await request.newContext();

    const price = await callAPIGetPrice(apiContext, baseToken, quoteToken, url, oracleScriptHash);
    const priceOfADA = await callAPIGetPrice(apiContext, '', quoteToken, url, oracleScriptHash);
    const threshold = await getHFOfToken(poolToken, baseToken, urlMarket);
    const thresholdOfADA = await getHFOfToken(poolToken, '', urlMarket);
    console.log(`price = ${price} threshold = ${threshold}`);
    const HF = ((collateralAmount_1 / collateralDecimal_1) * price * threshold + minADAAmount / 1000000 * priceOfADA * thresholdOfADA) / (borrowAmount / borrowDecimal);
    console.log(`HF = ${HF}`);


});

test ('get HF', async () => {
    const baseToken = '919d4c2c9455016289341b1a14dedf697687af31751170d56a31466e.74444a4544';
    const poolToken = '5bc56ab821b1efbce5be150bd97613c577f32167611211ef742c71f0.32c41815d270a4cc8be4bc9d3d171546b44d36cb57aa7b8b05618558';
    let env = 'DEV';
    let urlMarket = '';
    if (env === 'DEV') {
        urlMarket = 'https://crypto-admin-bff.dev.tekoapis.net/api/v1/float-lending/markets';
    }
    else if (env === 'Preprod') {

        urlMarket = 'https://crypto-admin-bff.dev.tekoapis.net/api/v1/float-lending/markets';
    }
    const apiContext = await request.newContext();

    const threshold = await getHFOfToken(poolToken, baseToken, urlMarket);
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
    } else
    {
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