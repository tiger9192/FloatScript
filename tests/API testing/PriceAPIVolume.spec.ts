import { test, expect, request } from '@playwright/test';
import * as XLSX from "xlsx";
import fs from 'fs';
import csv from 'csv-parser';
import * as common from '../Common';
import * as config from '../config';


test('Compare Price Main V1 Vs Beta V3.0 ', async () => {
    test.setTimeout(9000000);
    const inputFileName = './tests/datatest/ListPriceFloat.xlsx';
    const inputSheetName = 'Market info';
    const env1 = config.priceEnv('MAIN_V1');
    const env3 = config.priceEnv('BETA_V3.0');
    await callAPIPriceCompare2Version(inputFileName, inputSheetName, env1, env3, 'MainV1_vs_BetaV3.0');
});

test('Compare Price Main V3.1 Vs Beta V3.3', async () => {
    test.setTimeout(9000000);
    const inputFileName = './tests/datatest/ListPriceLeverage.xlsx';
    const inputSheetName = 'Market info';
    const env2 = config.priceEnv('MAIN_V3.1');
    const env3 = config.priceEnv('BETA_V3.3');
    await callAPIPriceCompare2Version(inputFileName, inputSheetName, env2, env3, 'MainV3.1_vs_BetaV3.3');
});



// Có dùng
async function callAPIPriceDenominator(fileName: string, sheetName: string, env: any) {
    const listTokenPairs = common.readFromExcelFile(fileName, sheetName);
    let index = 0;
    const allPrice: any[] = [];
    for (const item of listTokenPairs) {
        if (item.denominator == null) {
            item.denominator = '';
        }
        const response = await callAPIPrice(item.collateralToken ?? '', item.Token ?? '', (item.denominator).toString() ?? '', env.oracleScriptHash, env.urlPrice);

        console.log(`Cặp giá ${++index}: ${item.collateralToken} - ${item.Token} - denomination ${item.denominator}`);
        let result = await readResponse(response);
        allPrice.push({
            baseToken: item.collateralToken ?? '',
            baseTokenName: common.searchTokenName(listTokenPairs, item.collateralToken),
            quoteToken: item.Token ?? '',
            quoteTokenName: common.searchTokenName(listTokenPairs, item.Token),
            denominator: item.denominator,
            collateralIsEnable: item.collateralIsEnable,
            exchangeRateNum: result?.exchangeRateNum,
            exchangeRateDem: result?.exchangeRateDen,
            note: result?.note,

        });
    }
    // ✅ Sau vòng lặp mới ghi file Excel
    let timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    common.saveToExcelFile(`test-results/check_price_${timestamp}.xlsx`, 'Price 3 Version', allPrice);
}

async function callAPIPriceCompare2Version(inputFileName: string, inputSheetName: string, env1: any, env2: any, outputFileName: string) {
    const listTokenPairs = common.readFromExcelFile(inputFileName, inputSheetName);
    let index = 0;
    const allPrice: any[] = [];
    for (const item of listTokenPairs) {

        const responseV1 = await callAPIPrice(item.collateralToken ?? '', item.Token ?? '', item.denominator ?? '', env1.oracleScriptHash, env1.urlPrice);
        const responseV2 = await callAPIPrice(item.collateralToken ?? '', item.Token ?? '', item.denominator ?? '', env2.oracleScriptHash, env2.urlPrice);
        // const responseV3NoDen = await callAPIPrice(item.collateralToken ?? '', item.Token ?? '',  '', v3SKH, env.urlPrice);

        console.log(`Cặp giá ${++index}: ${item.collateralToken} - ${item.Token} - denomination ${item.denominator}`);
        let resultV1 = await readResponse(responseV1);
        let resultV2 = await readResponse(responseV2);
        // let resultV3NoDen = await readResponse(responseV3NoDen);
        allPrice.push({
            baseToken: item.collateralToken ?? '',
            baseTokenName: common.searchTokenName(listTokenPairs, item.collateralToken),
            quoteToken: item.Token ?? '',
            quoteTokenName: common.searchTokenName(listTokenPairs, item.Token),
            denominator: item.denominator,

            collateralIsEnable: item.collateralIsEnable,
            exchangeRateNumV1: resultV1?.exchangeRateNum,
            exchangeRateDemV1: resultV1?.exchangeRateDen,
            noteV1: resultV1?.note,

            exchangeRateNumV2: resultV2?.exchangeRateNum,
            exchangeRateDemV2: resultV2?.exchangeRateDen,
            noteV2: resultV2?.note,

        });
    }
    // ✅ Sau vòng lặp mới ghi file Excel
    let timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    // common.saveToExcelFile(`test-results/check_price_${timestamp}.xlsx`,'Error Price', rows);
    // common.saveToExcelFile2sheet(`test-results/check_price_${timestamp}.xlsx`, 'Error Price', 'valide Price', rows, allPrice);
    common.saveToExcelFile(`test-results/${outputFileName}_${timestamp}.xlsx`, 'Price 2 Version', allPrice);
}


async function callAPIPriceCompare2VersionDen(fileName: string, sheetName: string, env1: any, env2: any, outputFileName: string) {
    const listTokenPairs = common.readFromExcelFile(fileName, sheetName);
    let index = 0;
    const allPrice: any[] = [];
    for (const item of listTokenPairs) {

        // const responseV1 = await callAPIPrice(item.collateralToken ?? '', item.Token ?? '', item.denominator.toString() ?? '', env1.oracleScriptHash, env1.urlPrice);
        // const responseV2 = await callAPIPrice(item.collateralToken ?? '', item.Token ?? '', item.denominator.toString() ?? '', env2.oracleScriptHash, env2.urlPrice);

        const responseV1 = await callAPIPrice(item.collateralToken ?? '', item.Token ?? '', '', env1.oracleScriptHash, env1.urlPrice);
        const responseV2 = await callAPIPrice(item.collateralToken ?? '', item.Token ?? '', '', env2.oracleScriptHash, env2.urlPrice);

        console.log(`Cặp giá ${++index}: ${item.collateralToken} - ${item.Token} - denomination ${item.denominator}`);
        let resultV1 = await readResponse(responseV1);
        let resultV2 = await readResponse(responseV2);
        // let resultV3NoDen = await readResponse(responseV3NoDen);
        allPrice.push({
            baseToken: item.collateralToken ?? '',
            baseTokenName: common.searchTokenName(listTokenPairs, item.collateralToken),
            quoteToken: item.Token ?? '',
            quoteTokenName: common.searchTokenName(listTokenPairs, item.Token),
            denominator: item.denominator,
            collateralIsEnable: item.collateralIsEnable,
            exchangeRateNumV1: resultV1?.exchangeRateNum,
            exchangeRateDemV1: resultV1?.exchangeRateDen,
            noteV1: resultV1?.note,

            exchangeRateNumV2: resultV2?.exchangeRateNum,
            exchangeRateDemV2: resultV2?.exchangeRateDen,
            noteV2: resultV2?.note,

        });
    }
    // ✅ Sau vòng lặp mới ghi file Excel
    let timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    // common.saveToExcelFile(`test-results/check_price_${timestamp}.xlsx`,'Error Price', rows);
    // common.saveToExcelFile2sheet(`test-results/check_price_${timestamp}.xlsx`, 'Error Price', 'valide Price', rows, allPrice);
    common.saveToExcelFile(`test-results/${outputFileName}_${timestamp}.xlsx`, 'Price 2 Version', allPrice);
}
async function callAPIPriceCompare3VersionNoDen(fileName: string, sheetName: string, env1: any, env2: any, env3: any) {
    const listTokenPairs = common.readFromExcelFile(fileName, sheetName);
    let index = 0;
    const allPrice: any[] = [];
    for (const item of listTokenPairs) {

        const responseV1 = await callAPIPrice(item.collateralToken ?? '', item.Token ?? '', '', env1.oracleScriptHash, env1.urlPrice);
        const responseV2 = await callAPIPrice(item.collateralToken ?? '', item.Token ?? '', '', env2.oracleScriptHash, env2.urlPrice);
        const responseV3 = await callAPIPrice(item.collateralToken ?? '', item.Token ?? '', '', env3.oracleScriptHash, env3.urlPrice);
        // const responseV3NoDen = await callAPIPrice(item.collateralToken ?? '', item.Token ?? '',  '', v3SKH, env.urlPrice);

        console.log(`Cặp giá ${++index}: ${item.collateralToken} - ${item.Token} - denomination ${item.denominator}`);
        let resultV1 = await readResponse(responseV1);
        let resultV2 = await readResponse(responseV2);
        let resultV3 = await readResponse(responseV3);
        // let resultV3NoDen = await readResponse(responseV3NoDen);
        allPrice.push({
            baseToken: item.collateralToken ?? '',
            baseTokenName: common.searchTokenName(listTokenPairs, item.collateralToken),
            quoteToken: item.Token ?? '',
            quoteTokenName: common.searchTokenName(listTokenPairs, item.Token),
            denominator: item.denominator,
            collateralIsEnable: item.collateralIsEnable,
            exchangeRateNumV1: resultV1?.exchangeRateNum,
            exchangeRateDemV1: resultV1?.exchangeRateDen,
            noteV1: resultV1?.note,

            exchangeRateNumV2: resultV2?.exchangeRateNum,
            exchangeRateDemV2: resultV2?.exchangeRateDen,
            noteV2: resultV2?.note,

            exchangeRateNumV3: resultV3?.exchangeRateNum,
            exchangeRateDemV3: resultV3?.exchangeRateDen,
            noteV3: resultV3?.note,



        });
    }
    // ✅ Sau vòng lặp mới ghi file Excel
    let timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    // common.saveToExcelFile(`test-results/check_price_${timestamp}.xlsx`,'Error Price', rows);
    // common.saveToExcelFile2sheet(`test-results/check_price_${timestamp}.xlsx`, 'Error Price', 'valide Price', rows, allPrice);
    common.saveToExcelFile(`test-results/check_price_Main_POV_${timestamp}.xlsx`, 'Price 3 Version', allPrice);
}

async function callAPIPriceCompare3VersionDen(fileName: string, sheetName: string, env1: any, env2: any, env3: any) {
    const listTokenPairs = common.readFromExcelFile(fileName, sheetName);
    let index = 0;
    const allPrice: any[] = [];
    for (const item of listTokenPairs) {

        const responseV1 = await callAPIPrice(item.collateralToken ?? '', item.Token ?? '', item.denominator ?? '', env1.oracleScriptHash, env1.urlPrice);
        const responseV2 = await callAPIPrice(item.collateralToken ?? '', item.Token ?? '', item.denominator ?? '', env2.oracleScriptHash, env2.urlPrice);
        const responseV3 = await callAPIPrice(item.collateralToken ?? '', item.Token ?? '', item.denominator ?? '', env3.oracleScriptHash, env3.urlPrice);
        // const responseV3NoDen = await callAPIPrice(item.collateralToken ?? '', item.Token ?? '',  '', v3SKH, env.urlPrice);

        console.log(`Cặp giá ${++index}: ${item.collateralToken} - ${item.Token} - denomination ${item.denominator}`);
        let resultV1 = await readResponse(responseV1);
        let resultV2 = await readResponse(responseV2);
        let resultV3 = await readResponse(responseV3);
        // let resultV3NoDen = await readResponse(responseV3NoDen);
        allPrice.push({
            baseToken: item.collateralToken ?? '',
            baseTokenName: common.searchTokenName(listTokenPairs, item.collateralToken),
            quoteToken: item.Token ?? '',
            quoteTokenName: common.searchTokenName(listTokenPairs, item.Token),
            denominator: item.denominator,
            collateralIsEnable: item.collateralIsEnable,
            exchangeRateNumV1: resultV1?.exchangeRateNum,
            exchangeRateDemV1: resultV1?.exchangeRateDen,
            noteV1: resultV1?.note,

            exchangeRateNumV2: resultV2?.exchangeRateNum,
            exchangeRateDemV2: resultV2?.exchangeRateDen,
            noteV2: resultV2?.note,

            exchangeRateNumV3: resultV3?.exchangeRateNum,
            exchangeRateDemV3: resultV3?.exchangeRateDen,
            noteV3: resultV3?.note,



        });
    }
    // ✅ Sau vòng lặp mới ghi file Excel
    let timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    // common.saveToExcelFile(`test-results/check_price_${timestamp}.xlsx`,'Error Price', rows);
    // common.saveToExcelFile2sheet(`test-results/check_price_${timestamp}.xlsx`, 'Error Price', 'valide Price', rows, allPrice);
    common.saveToExcelFile(`test-results/check_price_Main_POV_${timestamp}.xlsx`, 'Price 3 Version', allPrice);
}

// So sánh trên cùng 1 môi trường Beta
async function callAPIPriceCompare3Version(fileName: string, sheetName: string, env: any) {
    const listTokenPairs = common.readFromExcelFile(fileName, sheetName);
    let index = 0;
    const allPrice: any[] = [];
    for (const item of listTokenPairs) {
        const v1SKH = '2eb7e9be6a1fff3e3e33d2b05007488f199c895a051b3ee371a95f6c';
        const v2SKH = 'b2017c9c91c189db01bcc40ac215354a186f3455157380c130bd010f';
        const v3SKH = '7115b6ccb9ba59e079b6b043b4344ecc6fe061ef7f748feebe50c120';
        const responseV1 = await callAPIPrice(item.collateralToken ?? '', item.Token ?? '', '', v1SKH, env.urlPrice);
        const responseV2 = await callAPIPrice(item.collateralToken ?? '', item.Token ?? '', '', v2SKH, env.urlPrice);
        const responseV3 = await callAPIPrice(item.collateralToken ?? '', item.Token ?? '', (item.denominator).toString() ?? '', v3SKH, env.urlPrice);
        const responseV3NoDen = await callAPIPrice(item.collateralToken ?? '', item.Token ?? '', '', v3SKH, env.urlPrice);

        console.log(`Cặp giá ${++index}: ${item.collateralToken} - ${item.Token} - denomination ${item.denominator}`);
        let resultV1 = await readResponse(responseV1);
        let resultV2 = await readResponse(responseV2);
        let resultV3 = await readResponse(responseV3);
        let resultV3NoDen = await readResponse(responseV3NoDen);
        allPrice.push({
            baseToken: item.collateralToken ?? '',
            baseTokenName: common.searchTokenName(listTokenPairs, item.collateralToken),
            quoteToken: item.Token ?? '',
            quoteTokenName: common.searchTokenName(listTokenPairs, item.Token),
            denominator: item.denominator,
            collateralIsEnable: item.collateralIsEnable,
            exchangeRateNumV1: resultV1?.exchangeRateNum,
            exchangeRateDemV1: resultV1?.exchangeRateDen,
            noteV1: resultV1?.note,

            exchangeRateNumV2: resultV2?.exchangeRateNum,
            exchangeRateDemV2: resultV2?.exchangeRateDen,
            noteV2: resultV2?.note,

            exchangeRateNumV3: resultV3?.exchangeRateNum,
            exchangeRateDemV3: resultV3?.exchangeRateDen,
            noteV3: resultV3?.note,

            exchangeRateNumV3NoDen: resultV3NoDen?.exchangeRateNum,
            exchangeRateDemV3NoDen: resultV3NoDen?.exchangeRateDen,
            noteV3NoDen: resultV3NoDen?.note,


        });
    }
    // ✅ Sau vòng lặp mới ghi file Excel
    let timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    // common.saveToExcelFile(`test-results/check_price_${timestamp}.xlsx`,'Error Price', rows);
    // common.saveToExcelFile2sheet(`test-results/check_price_${timestamp}.xlsx`, 'Error Price', 'valide Price', rows, allPrice);
    common.saveToExcelFile(`test-results/check_price_${timestamp}.xlsx`, 'Price 3 Version', allPrice);
}
// lấy già dtoken V3 và so sánh với giá chuyển đổi từ token sang token khác
async function checkdTokenV3(fileName: string, sheetName: string, env: any) {
    const listTokenPairs = common.readFromExcelFile(fileName, sheetName);
    let index = 0;
    const allPrice: any[] = [];
    for (const item of listTokenPairs) {
        const responsedToken = await callAPIPrice(item.collateralToken ?? '', item.OriginalToken ?? '', (item.denominator).toString() ?? '', env.oracleScriptHash, env.urlPrice);
        let resultdToken = await readResponse(responsedToken);
        if (resultdToken != null) {
            if (resultdToken.exchangeRateNum != 0 && resultdToken.exchangeRateDen != 0) {
                let convertToken = Math.floor(item.denominator * (resultdToken.exchangeRateNum / resultdToken.exchangeRateDen));
                console.log(`${item.collateralTokenName} to ${item.OriginalTokenNam}: convert token : ${convertToken}`);
                const responsedTokenToToken
                    = await callAPIPrice(item.OriginalToken ?? '', item.Token ?? '', convertToken.toString() ?? '', env.oracleScriptHash, env.urlPrice);
                let result = await readResponse(responsedTokenToToken);
                let tokenToToken = 0
                if (result != null) {
                    if (result.exchangeRateNum != 0 && result.exchangeRateDen != 0) {
                        tokenToToken = Math.floor(convertToken * result.exchangeRateNum / result.exchangeRateDen);
                        console.log(`${item.OriginalTokenNam} to ${item.TokenName}: Token to Token  : ${tokenToToken}`);
                    }
                    const responsedDTokenToToken
                        = await callAPIPrice(item.collateralToken ?? '', item.Token ?? '', item.denominator.toString() ?? '', env.oracleScriptHash, env.urlPrice);
                    let resultDTokenToToken = await readResponse(responsedDTokenToToken);
                    let dTokenToToken = 0;
                    if (resultDTokenToToken != null) {
                        if (resultDTokenToToken.exchangeRateNum != 0 && resultDTokenToToken.exchangeRateDen != 0) {
                            dTokenToToken = Math.floor(item.denominator * resultDTokenToToken.exchangeRateNum / resultDTokenToToken.exchangeRateDen);
                            console.log(`${item.collateralTokenName} to ${item.TokenName}: dToken to Token  : ${dTokenToToken}`);
                            console.log(`Cặp giá ${++index}: ${item.denominator} ${item.collateralTokenName} = ${convertToken} ${item.OriginalTokenNam} = ${dTokenToToken}- ${item.TokenName}`);
                            expect(tokenToToken).toBeCloseTo(dTokenToToken, 2);
                        }

                    }

                }
            }
            // ✅ Sau vòng lặp mới ghi file Excel
            // let timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            // common.saveToExcelFile(`test-results/check_price_${timestamp}.xlsx`, 'Price 3 Version', allPrice);
        }
    }
}

async function readResponse(response: any) {
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
async function callAPIPrice(baseToken: string, quoteToken: string, denominatior: string, skh: string, url: string): Promise<any> {
    const apiContext = await request.newContext();
    let requestParam = JSON.stringify({});
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

