import { test, expect, request, APIRequestContext, APIResponse } from '@playwright/test';
import * as common from './Common';

test('verify supply APY của ADA', async () => {
    const apiContext = await request.newContext();


    const response = await callAPIGetSupply(apiContext, '');

    expect(response.status()).toBe(200);
    // Verify body trả về là JSON
    const responseBody = await response.json();
    expect(responseBody).toBeTruthy();
    // đọc data từ API supply  trả về
    expect(responseBody).toHaveProperty('data');
    let totalSupply = parseFloat(responseBody.data.totalSupply);
    let totalBorrow = parseFloat(responseBody.data.totalBorrow);
    let supplyApy = parseFloat(responseBody.data.supplyApy);
    let liqwidSupplyAPY = await getLiqwidSupplyAPY(apiContext, '');
    console.log(`Token ADA ---------------------`);
    console.log(`  totalSupply:  ${totalSupply} - totalBorrow: ${totalBorrow} - liqwidSupplyAPY: ${liqwidSupplyAPY}
         - floatSupplyApy: ${supplyApy} - LiqwidSupplyApy: ${liqwidSupplyAPY}`);
    if (supplyApy < liqwidSupplyAPY) {
        console.log(`⚡Tính sai supply APY:  supply APY của Float < Liqwid: float  = ${supplyApy} - Liqwid: ${liqwidSupplyAPY}`);
    }
});


test('Verify supply APY', async () => {

    const apiContext = await request.newContext();

    for (const item of common.token_list_live) {

        const response = await callAPIGetSupply(apiContext, item.token_id);
        expect(response.status()).toBe(200);
        // Verify body trả về là JSON
        const responseBody = await response.json();
        expect(responseBody).toBeTruthy();
        // đọc data từ API supply  trả về
        expect(responseBody).toHaveProperty('data');
        let totalSupply = parseFloat(responseBody.data.totalSupply);
        let totalBorrow = parseFloat(responseBody.data.totalBorrow);
        let supplyApy = parseFloat(responseBody.data.supplyApy);
        let liqwidSupplyAPY = await getLiqwidSupplyAPY(apiContext, item.token_id);
        console.log(`Token ${item.name} ---------------------`);
        // call API để lấy borrow APR
        const resBorrowAPR = await callAPIGetBorrowAPR(apiContext, item.token_id);
        expect(resBorrowAPR.status()).toBe(200);
        const responseBorrowAPR = await resBorrowAPR.json();
        let borrowAPR = parseFloat(responseBorrowAPR.data.borrowApr);
        console.log(`  totalSupply:  ${totalSupply} - totalBorrow: ${totalBorrow} - liqwidSupplyAPY: ${liqwidSupplyAPY} - borrowAPR: ${borrowAPR} - supplyApy: ${supplyApy}`);
        // Tạm tính supply APY
        let calSupplyAPY = 0;
        if (item.isSupply === false) {
            calSupplyAPY = (totalBorrow * borrowAPR / 100 * (1 - item.loanFeeRate)) / totalSupply * 100
        }
        else {
            calSupplyAPY = (totalBorrow * borrowAPR / 100 * (1 - item.loanFeeRate) + (totalSupply - totalBorrow - item.token_in_pool) * liqwidSupplyAPY / 100) / totalSupply * 100
        }
        console.log(`  Supply APY tạm tính:  ${calSupplyAPY}`);
        if (compareNumber(calSupplyAPY, supplyApy)) {
            console.log(`👍 khớp số`);
        }
        else {
            console.log(`⚡Tính sai supply APY:  tạm tính = ${calSupplyAPY} số trên UI: ${supplyApy}`);
        }
    }
});

function compareNumber(number1: number, number2: number): boolean {
    let a = common.cut2Decimals(number1);
    let b = common.cut2Decimals(number2);
    return a === b;
}


async function callAPILiqwidSupplyAPY(apiContext: APIRequestContext, tokenId: string): Promise<APIResponse> {
    // Gọi GET API, truyền query params
    return await apiContext.get(`${common.domain}/api/v1/load-supply-list-screen`, {
        headers: {
            'Content-Type': 'application/json'
        },
        params: {
            page: 1,
            pageSize: 10,
            token: tokenId
        }
    });

}

async function callAPIGetBorrowAPR(apiContext: APIRequestContext, tokenId: string): Promise<APIResponse> {
    // Gọi GET API, truyền query params
    return await apiContext.get(`${common.domain}/api/v1/float/load-borrow-screen`, {
        headers: {
            'Content-Type': 'application/json'
        },
        params: {
            token: tokenId
        }
    });

}

async function callAPIGetSupply(apiContext: APIRequestContext, tokenId: string): Promise<APIResponse> {
    const requestParam = JSON.stringify({
        token: tokenId,
    });
    return await apiContext.post(`${common.domain}/api/v1/float/load-supply-screen`, {
        headers: {
            'Content-Type': 'application/json'
        },
        data: requestParam
    });
}

async function getLiqwidSupplyAPY(apiContext: APIRequestContext, tokenId: string): Promise<number> {
    const resLiqwidSupplyAPY = await callAPILiqwidSupplyAPY(apiContext, tokenId);
    const responseSupplyAPY = await resLiqwidSupplyAPY.json();
    let liqwidSupplyAPY = 0;
    for (const item of responseSupplyAPY.data.supplyingPositions) {
        if (item.protocolCode === 'liqwid') {
            liqwidSupplyAPY = parseFloat(item.protocolSupplyApy);
        }
    };
    return liqwidSupplyAPY;
}




