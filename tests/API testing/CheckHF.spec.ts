import { test, expect, request } from '@playwright/test';
import * as config from '../config';
import {callAPIPriceDenomatior} from './HelperCommonAPI';




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

    // const price = await callAPIGetPrice(apiContext, baseToken, quoteToken, env.url, env.oracleScriptHash);
    // const priceOfADA = await callAPIGetPrice(apiContext, '', quoteToken, env.url, env.oracleScriptHash);
    // const threshold = await getHFOfToken(poolToken, baseToken, env.urlMarket);
    // const thresholdOfADA = await getHFOfToken(poolToken, '', env.urlMarket);
    // console.log(`price = ${price} threshold = ${threshold}`);
    // const HF = ((collateralAmount_1 / collateralDecimal_1) * price * threshold + minADAAmount / 1000000 * priceOfADA * thresholdOfADA) / (borrowAmount / borrowDecimal);
    // console.log(`HF = ${HF}`);


});

test('get HF', async () => {
    const env = config.env('PREPROD');
    const apiContext = await request.newContext();
    const item = {
        baseToken: '',
        quoteToken: '834a15101873b4e1ddfaa830df46792913995d8738dcde34eda27905.665553444d',
        denominator: 100000000,

    };
    const result = await callAPIPriceDenomatior(env,item);
    console.log(`Price ${result.note} - ${result.exchangeRateNum}  -  ${result.exchangeRateDen}`);
});



