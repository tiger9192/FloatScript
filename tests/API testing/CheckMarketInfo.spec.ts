import { test, expect, request } from '@playwright/test';
import * as common from '../Common';
import * as config from '../config';

// 1. Call API get markets của admin lấy danh sách pool
// 2. Call API load-main-screen của lending lấy danh sách pool hiện có trên app
// 3. Call API get market info của từng token
// 4. Kiểm tra kết quả trả về của 3 API


const env = config.env('MAIN_OLD_POOL');
let listMarkets: any[] = [];
let listLendingPools: any[] = [];   

test.beforeAll(async () => {
  console.log('Chạy 1 lần duy nhất trước tất cả test');
    listMarkets = await getMarketList(env.urlMarket);
    listMarkets = removeInvalidPools(listMarkets);
    listLendingPools = await getLendingPoolList(env.lendingUrl);
});

test('Verify số lượng pool trên màn hình main ', async () => {
    expect(listMarkets.length).toEqual(listLendingPools.length);
});




function removeInvalidPools(markets: any[]): any[] {
    const newList = markets.filter(item => item.isClosable == false);
    return newList;
}
async function getMarketList(urlMarket: string): Promise<any[]> {
    const apiContext = await request.newContext();
    const response = await apiContext.get(urlMarket, {
        headers: {
            'Content-Type': 'application/json'
        },
    });
    expect(response.status()).toBe(200);
    const responseMarketInfo = await response.json();
    return responseMarketInfo.data.markets;
}

async function getLendingPoolList(urlLending: string): Promise<any[]> {
    const apiContext = await request.newContext();
    const response = await apiContext.post(urlLending, {
        headers: {
            'Content-Type': 'application/json'
        },
    });
    expect(response.status()).toBe(200);
    const responseLendingInfo = await response.json();
    return responseLendingInfo.data.pools;
}

async function getMarketInfo(urlMarket: string, poolId: string): Promise<any> {
    const apiContext = await request.newContext();
    const response = await apiContext.get(`${urlMarket}?poolId=${poolId}`, {
        headers: {
            'Content-Type': 'application/json'
        },
    });
    expect(response.status()).toBe(200);
    const responseMarketInfo = await response.json();
    return responseMarketInfo;
}
