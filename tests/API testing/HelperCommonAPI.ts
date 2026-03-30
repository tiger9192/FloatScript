import { test, expect, request } from '@playwright/test';
import * as XLSX from "xlsx";
import fs from 'fs';
import csv from 'csv-parser';
import * as common from '../Common';
import * as config from '../config';


/** Call API Load suppy screen và lấy supply APY */
export async function callAPILoadSupplyScreen(poolId: string, env: any): Promise<any> {
    // console.log(`Calling API Load supply screen to get supply APY ${env.urlBff}/api/v1/load-supply-screen`);
    const apiContext = await request.newContext();
    let requestParam = JSON.stringify({
        poolId: poolId
    });
    const response = await apiContext.post(`${env.urlBff}/api/v1/load-supply-screen`, {
        headers: {
            'Content-Type': 'application/json'
        },
        data: requestParam
    });
    expect(response.status()).toBe(200);
    const responseSupply = await response.json();
    return responseSupply;
}

/** Call API Load borrow screen và lấy borrow APR */
export async function callAPILoadBorrowScreen(poolId: string, env: any): Promise<any> {
    // console.log(`Calling API Load borrow screen ${env.urlBff}/api/v1/load-borrow-screen`);
    const apiContext = await request.newContext();
    const response = await apiContext.get(`${env.urlBff}/api/v1/load-borrow-screen?poolId=${poolId}`, {
        headers: {
            'Content-Type': 'application/json'
        },
    });
    expect(response.status()).toBe(200);
    const responseBorrow = await response.json();
    return responseBorrow;
}

/** call API get market info */
export async function callAPIGetMarketInfo(poolId: string, env: any): Promise<any> {
    // console.log(`Calling API Get  ${env.urlMonitor}`);
    const apiContext = await request.newContext();
    const response = await apiContext.get(`${env.urlMonitor}?poolId=${poolId}`, {
        headers: {
            'Content-Type': 'application/json'
        },
    });
    expect(response.status()).toBe(200);
    const responsePoolInfo = await response.json();
    return responsePoolInfo;
}

/** Hàm gọi API Load main screen và trả về dữ liệu đã được xử lý
 * Dữ liệu trả về sẽ bao gồm các trường:
 * poolId,  
 * tokenName,
 * token,
 * totalBorrow,
 * utilization,
 * borrowApr,            
 * supplyApy, 
 * dTokenRate   
 */
export async function callAPILoadMainScreen(env: any): Promise<any> {
    const apiContext = await request.newContext();
    console.log(`Calling API Load main screen ${env.urlBff}/api/v1/load-main-screen`);
    const response = await apiContext.post(`${env.urlBff}/api/v1/load-main-screen`, {
        headers: {
            'Content-Type': 'application/json'
        },
    });
    expect(response.status()).toBe(200);
    const responseListPool = await response.json();
    const rows: any[] = [];

    responseListPool.data.pools.forEach((pool: any) => {
        rows.push({
            poolId: pool.poolId,
            token: pool.token,
            tokenName: pool.tokenName,
            totalBorrow: pool.totalBorrow,
            utilization: pool.utilization,
            borrowApr: pool.borrowApr,
            supplApy: pool.supplyApy,
            dtokenRate: pool.dTokenRate,
        });
    });
    return rows;
}

/** Hàm gọi API reserve pool lấy total supply
 * Dữ liệu trả về sẽ bao gồm các trường:
 * poolId,
 * totalSupply,
 */

export async function callAPIResevePool(env: any): Promise<any> {
    const apiContext = await request.newContext();
    console.log(`Calling API ReservePool ${env.urlMarket}/api/v1/reserve-pool-screen?page=1&pageSize=100`);
    const response = await apiContext.get(`${env.urlMarket}/api/v1/reserve-pool-screen?page=1&pageSize=100`, {
        headers: {
            'Content-Type': 'application/json'
        },
    });
    expect(response.status()).toBe(200);
    const responseMarketParams = await response.json();
    const rows: any[] = [];

    responseMarketParams.data.pools.forEach((pool: any) => {

        rows.push({
            poolId: pool.poolId,
            totalSupply: pool.totalSupply,
        });
    });
    return rows;
}

/** Hàm gọi API Market Params và trả về dữ liệu đã được xử lý 
 * Dữ liệu trả về sẽ bao gồm các trường:
 * poolId,
 * token,
 * tokenName,
 * loanFeeRate,
 * alterToken,
 * alterAmount,
 */

export async function callAPIMarketParams(env: any): Promise<any> {
    const apiContext = await request.newContext();
    console.log(`Calling API Market Info ${env.urlMarket}/api/v1/float-lending/markets`);
    const response = await apiContext.get(`${env.urlMarket}/api/v1/float-lending/markets`, {
        headers: {
            'Content-Type': 'application/json'
        },
    });
    expect(response.status()).toBe(200);
    const responseMarketParams = await response.json();
    return responseMarketParams;
}

export async function callAPIPrice(baseToken: string, quoteToken: string, denominatior: string, skh: string, url: string): Promise<any> {
    const apiContext = await request.newContext();
    let requestParam = JSON.stringify({});
    console.log(`Gọi API Price với baseToken: ${baseToken}, quoteToken: ${quoteToken}`);
    if (denominatior === '') {
        requestParam = JSON.stringify({
            tokenPairs: [{
                baseToken: baseToken ?? '',
                quoteToken: quoteToken ?? '',
                oracleScriptHash: skh ?? ''
            }
            ]
        });
    }
    else {
        requestParam = JSON.stringify({
            tokenPairs: [{
                baseToken: baseToken ?? '',
                quoteToken: quoteToken ?? '',
                denominator: denominatior.toString() ?? '',
                oracleScriptHash: skh ?? ''
            }
            ]
        });
    }
    const response = await apiContext.post(url, {
        headers: {
            'Content-Type': 'application/json'
        },
        data: requestParam

    });
    return response;
}

export async function readResponse(response: any) {
    let result = {
        exchangeRateNum: 0,
        exchangeRateDen: 0,
        note: '',
    };
    if (response.status() !== 200) {
        console.log(`API V1 trả về ${response.status()}`);
        result.note = `API V1 trả về ${response.status()}`;
    }
    else {
        // Verify body trả về là JSON
        const responseBody = await response.json();
        // console.log(JSON.stringify(responseBody));
        if (responseBody.data.priceInfos.length === 0) {
            console.log(`Cặp token ko có giá `)
            result.note = 'Cặp token ko có giá';
        }
        else {
            const isActive: boolean = Boolean(responseBody.data.priceInfos[0].isActive);
            if (isActive === false) {
                result.note = 'Giá bị inactive';
                console.log(`Giá bị inactive `)
                result.exchangeRateNum = parseFloat(responseBody.data.priceInfos[0].exchangeRateNum ?? '0');
                result.exchangeRateDen = parseFloat(responseBody.data.priceInfos[0].exchangeRateDen ?? '0');
            }
            else {
                result.note = '';
                result.exchangeRateNum = parseFloat(responseBody.data.priceInfos[0].exchangeRateNum ?? '0');
                result.exchangeRateDen = parseFloat(responseBody.data.priceInfos[0].exchangeRateDen ?? '0');
            }
        }
        return result;
    }

}


export async function callAPIPriceDenomatior(env: any, item: any): Promise<any> {
    const apiContext = await request.newContext();
    let result = {
        baseToken: '',
        quoteToken: '',
        baseTokenName: '',
        quoteTokenName: '',
        denominator: '',
        exchangeRateNum: 0,
        exchangeRateDen: 0,
        note: '',
    }
    const requestParam = JSON.stringify({
        tokenPairs: [{
            baseToken: item.baseToken ?? '',
            quoteToken: item.quoteToken ?? '',
            denominator: (item.denominator).toString() ?? '',
            oracleScriptHash: env.oracleScriptHash
        }
        ]
    });
    const response = await apiContext.post(env.urlPrice, {
        headers: {
            'Content-Type': 'application/json'
        },
        data: requestParam

    });
    let wrightError = false;
    console.log(`Cặp giá: ${item.collateralToken} - ${item.Token} - denomination ${item.denominator}`);
    let note = '';
    if (response.status() !== 200) {
        console.log(`API trả về ${response.status()}`);
        wrightError = true;
        note = `API trả về ${response.status()}`;
    }
    else {
        // Verify body trả về là JSON
        const responseBody = await response.json();
        // console.log(JSON.stringify(responseBody));
        if (responseBody.data.priceInfos.length === 0) {
            console.log(`Cặp token ko có giá `)
            wrightError = true;
            note = 'Cặp token ko có giá';
        }
        else {
            const isActive: boolean = Boolean(responseBody.data.priceInfos[0].isActive);
            if (isActive === false) {
                wrightError = true;
                note = 'Giá bị inactive';
                console.log(`Giá bị inactive `)
            }
            else {
                result.baseToken = item.baseToken ?? '';
                result.quoteToken = item.quoteToken ?? '';
                result.baseTokenName = '';
                result.quoteTokenName = '';
                result.denominator = item.denominator;
                result.exchangeRateNum = parseFloat(responseBody.data.priceInfos[0].exchangeRateNum);
                result.exchangeRateDen = parseFloat(responseBody.data.priceInfos[0].exchangeRateDen);
                result.note = '';

            }
        }
        // console.log("Rows hiện tại:", rows.length, rows);
    }
    if (wrightError === true) {
        result.baseToken = item.baseToken ?? '';
        result.quoteToken = item.quoteToken ?? '';
        result.baseTokenName = '';
        result.quoteTokenName = '';
        result.denominator = item.denominator;
        result.note = note;

    }
    return result;
}
