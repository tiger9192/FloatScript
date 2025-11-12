import { test, expect, request } from '@playwright/test';
import * as XLSX from "xlsx";
import fs from 'fs';
import csv from 'csv-parser';
import * as common from '../Common';
import * as config from '../config';


test('Verify Price API all collateral', async () => {
    test.setTimeout(1000000);
    const apiContext = await request.newContext();
    const listTokenPairs = common.readFromExcelFile('test-results/market_PREPROD.xlsx', 'Markets');
    const env = config.env('PREPROD');
    let index = 0;
    const rows: any[] = [];
    const allPrice: any[] = [];
    for (const item of listTokenPairs) {
        const requestParam = JSON.stringify({
            tokenPairs: [{
                baseToken: item.collateralToken ?? '',
                quoteToken: item.Token ?? '',
                denominator: "10000000",
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
        console.log(`Cặp giá ${++index}: ${item.collateralToken} - ${item.Token}`);
        let note = '';
        if (response.status() !== 200) {
            console.log(`API trả về ${response.status()}`);
            rows.push({
                baseToken: item.collateralToken ?? '',
                quoteToken: item.Token ?? '',
                note: `API trả về ${response.status()}`,
                baseTokenName: common.searchTokenName(listTokenPairs, item.baseToken),
                quoteTokenName: common.searchTokenName(listTokenPairs, item.quoteToken),
            });
        }
        else {
            // Verify body trả về là JSON
            const responseBody = await response.json();
            // console.log(JSON.stringify(responseBody));
            if (responseBody.data.priceInfos.length === 0) {
                console.log(`Cặp token ko có giá `)
                rows.push({
                    baseToken: item.collateralToken ?? '',
                    quoteToken: item.Token ?? '',
                    note: 'Cặp token ko có giá',
                    baseTokenName: common.searchTokenName(listTokenPairs, item.baseToken),
                    quoteTokenName: common.searchTokenName(listTokenPairs, item.quoteToken),
                });
            }
            else {
                const isActive: boolean = Boolean(responseBody.data.priceInfos[0].isActive);
                if (isActive === false) {
                    rows.push({
                        baseToken: item.collateralToken ?? '',
                        quoteToken: item.Token ?? '',
                        note: 'Giá bị inactive',
                        baseTokenName: common.searchTokenName(listTokenPairs, item.baseToken),
                        quoteTokenName: common.searchTokenName(listTokenPairs, item.quoteToken),
                    });
                    console.log(`Giá bị inactive `)
                }
                else {
                    // console.log(`cặp token có giá: ${parseFloat(responseBody.data.priceInfos.exchangeRateNum)} - ${parseFloat(responseBody.data.priceInfos.exchangeRateDen)}`);
                    // console.log(`cặp token có giá: ${responseBody.data.priceInfos.exchangeRateNum} - ${(responseBody.data.priceInfos.exchangeRateDen)}`);
                    // console.log(`msg : ${responseBody.data.priceInfos[0].baseToken}`);
                    allPrice.push({
                        baseToken: item.collateralToken ?? '',
                        quoteToken: item.Token ?? '',
                        baseTokenName: common.searchTokenName(listTokenPairs, item.collateralToken),
                        quoteTokenName: common.searchTokenName(listTokenPairs, item.Token),
                        exchangeRateNum: parseFloat(responseBody.data.priceInfos[0].exchangeRateNum),
                        exchangeRateDen: parseFloat(responseBody.data.priceInfos[0].exchangeRateDen),
                    });
                }
            }
            // console.log("Rows hiện tại:", rows.length, rows);
        }
    }
    // ✅ Sau vòng lặp mới ghi file Excel
    let timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    // common.saveToExcelFile(`test-results/check_price_${timestamp}.xlsx`,'Error Price', rows);
    common.saveToExcelFile2sheet(`test-results/check_price_${timestamp}.xlsx`, 'Error Price', 'valide Price', rows, allPrice);
});

test('Verify Price API Preview', async () => {
    test.setTimeout(1000000);
    const fileName = 'test-results/market_PREVIEW.xlsx';
    const sheetName = 'ListCheckPrice';
    const env = config.env('PREVIEW');
    await callAPIPriceDenominator(fileName, sheetName, env);
});

test('Verify Price API PREPROD', async () => {
    test.setTimeout(1000000);
    const env = config.env('PREPROD');
    const fileName = 'test-results/market_PREPROD.xlsx';
    const sheetName = 'ListCheckPrice';
    await callAPIPriceDenominator(fileName, sheetName, env);
});


async function callAPIPriceDenominator(fileName: string, sheetName: string, env: any) {
    const apiContext = await request.newContext();
    const listTokenPairs = common.readFromExcelFile(fileName, sheetName);
    let index = 0;
    const rows: any[] = [];
    const allPrice: any[] = [];
    let wrightError = false;
    let note = '';
    for (const item of listTokenPairs) {
        const requestParam = JSON.stringify({
            tokenPairs: [{
                baseToken: item.collateralToken ?? '',
                quoteToken: item.Token ?? '',
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
        console.log(`Cặp giá ${++index}: ${item.collateralToken} - ${item.Token} - denomination ${item.denominator}`);
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
                    // console.log(`cặp token có giá: ${parseFloat(responseBody.data.priceInfos.exchangeRateNum)} - ${parseFloat(responseBody.data.priceInfos.exchangeRateDen)}`);
                    // console.log(`cặp token có giá: ${responseBody.data.priceInfos.exchangeRateNum} - ${(responseBody.data.priceInfos.exchangeRateDen)}`);
                    // console.log(`msg : ${responseBody.data.priceInfos[0].baseToken}`);
                    wrightError = false;
                    note = '',
                        allPrice.push({
                            baseToken: item.collateralToken ?? '',
                            quoteToken: item.Token ?? '',
                            baseTokenName: common.searchTokenName(listTokenPairs, item.collateralToken),
                            quoteTokenName: common.searchTokenName(listTokenPairs, item.Token),
                            denominator: item.denominator,
                            exchangeRateNum: parseFloat(responseBody.data.priceInfos[0].exchangeRateNum),
                            exchangeRateDen: parseFloat(responseBody.data.priceInfos[0].exchangeRateDen),
                        });
                }
            }
            // console.log("Rows hiện tại:", rows.length, rows);
        }
        if (wrightError === true) {
            rows.push({
                baseToken: item.collateralToken ?? '',
                quoteToken: item.Token ?? '',
                note: note,
                denominator: item.denominator,
                baseTokenName: common.searchTokenName(listTokenPairs, item.collateralToken),
                quoteTokenName: common.searchTokenName(listTokenPairs, item.Token),
            });
        }
    }
    // ✅ Sau vòng lặp mới ghi file Excel
    let timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    // common.saveToExcelFile(`test-results/check_price_${timestamp}.xlsx`,'Error Price', rows);
    common.saveToExcelFile2sheet(`test-results/check_price_${timestamp}.xlsx`, 'Error Price', 'valide Price', rows, allPrice);

}