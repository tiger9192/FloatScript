import { test, expect, request, APIRequestContext, APIResponse } from '@playwright/test';
import * as config from '../config';
test('Verify Borrow screen API ', async () => {
    const apiContext = await request.newContext();
    // const env = config.env('PREVIEW');
    // const env = config.env('PREPROD');
    const env = config.env('MAIN_NEW_UI');
    const response = await apiContext.post(`${env.yieldUrl}api/v1/load-main-screen`, {
        headers: {
            'Content-Type': 'application/json'
        },
    });
    expect(response.status()).toBe(200);
    // Verify body trả về là JSON
    const responseBody = await response.json();
    expect(responseBody).toBeTruthy();
    // đọc data từ API supply  trả về
    expect(responseBody).toHaveProperty('data');
    responseBody.data.pools.forEach((pools: any) => {
        console.log(`⚡token: ${pools.tokenTicker} total borrow: ${pools.totalBorrow} - supply APY: ${pools.supplyApy}`);
    });
});