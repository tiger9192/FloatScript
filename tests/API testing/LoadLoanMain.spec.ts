import { test, expect, request } from '@playwright/test';
import * as XLSX from "xlsx";
import fs from 'fs';
import csv from 'csv-parser';
import * as common from '../Common';
import * as config from '../config';




test('Verify Price API Preview', async () => {
    test.setTimeout(1000000);
    await comparePOCVSMain();
});

async function comparePOCVSMain() {
    const jsonText = 
    '{"loanOwnerNfts":["aca8e306eda3eb6c25a838bebac37d929c216aab13c8d463fca5a08d.b662db7195a35d7d2a67cacea38f67f207e73f970212ccf5ef674b0e","aca8e306eda3eb6c25a838bebac37d929c216aab13c8d463fca5a08d.1743020541c25979a3ace7479e5247119816debc4cd37bd768969817","aca8e306eda3eb6c25a838bebac37d929c216aab13c8d463fca5a08d.18f368ae63c381878888ecacc7b0b1ca0fe778b3af479ead93dcfa3b","aca8e306eda3eb6c25a838bebac37d929c216aab13c8d463fca5a08d.250fd00e6ab6c94fb5761f69f917dece4629a6e0937a2213e99f0d52","aca8e306eda3eb6c25a838bebac37d929c216aab13c8d463fca5a08d.3ffd06fd0785065f7faf263c32f51b8c4ea52f5d54c76440abcccf4c","aca8e306eda3eb6c25a838bebac37d929c216aab13c8d463fca5a08d.4faa1fa42c1014348f3598d930d1f9182fb6d1b9742fcb534b34913b","aca8e306eda3eb6c25a838bebac37d929c216aab13c8d463fca5a08d.c41b804e153c8f283a3cae8c30ca94872cadc800a46a21b99e21beb4","aca8e306eda3eb6c25a838bebac37d929c216aab13c8d463fca5a08d.c76101d671ec69b71a9b0f5fa7e82749efbd669db068739e61d3843d","aca8e306eda3eb6c25a838bebac37d929c216aab13c8d463fca5a08d.d37266e3d6738c0d57287892f4089dc44974d07ed5fdba2414ea4128"]}'
    const body = JSON.parse(jsonText);
    const mail = config.env('MAIN_OLD_POOL');
    const poc = config.env('MAIN_POV');
    const responseV1 = await callAPILoadLoanScreen(mail.lendingUrl, body);
    const responseV2 = await callAPILoadLoanScreen(poc.lendingUrl, body);
    let resultV1 = await readResponse(responseV1);
    let resultV2 = await readResponse(responseV2);
    let timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    common.saveToExcelFile2sheet(`test-results/check_load_loan_screen_${timestamp}.xlsx`, 'Main', 'POC', resultV1, resultV2);
}


async function callAPILoadLoanScreen(url: string, listNft: any): Promise<any> {
    const apiContext = await request.newContext();
    let requestParam = JSON.stringify({});
    if (listNft !== null) {
        requestParam = JSON.stringify({
             listNft
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

async function readResponse(response: any): Promise<any> {
    if (response.status() !== 200) {
        console.log(`API V1 trả về ${response.status()}`);
        return null;
    }
    else {
        // Verify body trả về là JSON
        const responseBody = await response.json();
        // console.log(JSON.stringify(responseBody));
        if (responseBody.data.pools.length === 0) {
            console.log(`Ko có pool nào`)
            return null;
        }
        else {
            const allPools: any[] = [];
            for (const item of responseBody.data.pools) {
                allPools.push({
                    token: item.token,
                    tokenName: item.tokenName,
                    tokenImage: item.tokenImage,
                    tokenDecimals: parseFloat(item.tokenDecimals),
                    tokenTicker: item.tokenTicker,
                    syntheticGroupName: item.syntheticGroupName,
                    poolId: item.poolId,
                    liquidity: parseFloat(item.liquidity),
                    liquidityInUsd: parseFloat(item.liquidityInUsd),
                    totalBorrow: parseFloat(item.totalBorrow),
                    totalBorrowInUsd: parseFloat(item.totalBorrowInUsd),
                    utilization: parseFloat(item.utilization),
                    supplyApy: parseFloat(item.supplyApy),
                    borrowApr: parseFloat(item.borrowApr),
                    dToken: item.dToken,
                    dTokenRate: parseFloat(item.dTokenRate),
                    tokenPriceInUsd: parseFloat(item.tokenPriceInUsd),
                });


            }
            return allPools;
        }
    }
}


