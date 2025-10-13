import { test, expect, request } from '@playwright/test';
import * as XLSX from "xlsx";
import fs from 'fs';
import csv from 'csv-parser';
import * as common from './Common';

test('Verify Price API', async () => {
    test.setTimeout(1000000);
    const apiContext = await request.newContext();
    // const listTokenPairs = await readCSV('./tests/datatest/Live_all_price.csv');
    // const listTokenPairs = await readCSV('./tests/datatest/tmp.csv');
    const listTokenPairs = common.readFromExcelFile('./tests/datatest/Token_list.xlsx', 'ListTokenPairs');
    const allTokenList = common.readFromExcelFile('./tests/datatest/Token_list.xlsx', 'All float token');
    let index = 0;
    const rows: any[] = [];
    const allPrice: any[] = [];
    for (const item of listTokenPairs) {
        const requestParam = JSON.stringify({
            tokenPairs: [{
                baseToken: item.baseToken ?? '',
                quoteToken: item.quoteToken ?? '',
                oracleScriptHash: '2eb7e9be6a1fff3e3e33d2b05007488f199c895a051b3ee371a95f6c'
            }
            ]
        });
        const response = await apiContext.post('https://onchain-price-aggregator.tekoapis.com/api/v1/prices', {
            // const response = await apiContext.post('https://onchain-price-aggregator-beta.tekoapis.com/api/v1/prices', {
            headers: {
                'Content-Type': 'application/json'
            },
            data: requestParam

        });
        console.log(`Cặp giá ${++index}: ${item.baseToken} - ${item.quoteToken}`);
        if (response.status() !== 200) {
            console.log(`API trả về ${response.status()}`);
            rows.push({
                baseToken: item.baseToken ?? '',
                quoteToken: item.quoteToken ?? '',
                note: `API trả về ${response.status()}`,
                baseTokenName: common.searchTokenName(allTokenList, item.baseToken),
                quoteTokenName: common.searchTokenName(allTokenList, item.quoteToken),
            });
        }
        else {
            // Verify body trả về là JSON
            const responseBody = await response.json();
            // console.log(JSON.stringify(responseBody));
            if (responseBody.data.priceInfos.length === 0) {
                console.log(`Cặp token ko có giá `)
                rows.push({
                    baseToken: item.baseToken ?? '',
                    quoteToken: item.quoteToken ?? '',
                    note: 'Cặp token ko có giá',
                    baseTokenName: common.searchTokenName(allTokenList, item.baseToken),
                    quoteTokenName: common.searchTokenName(allTokenList, item.quoteToken),
                });
            }
            else {
                const isActive: boolean = Boolean(responseBody.data.priceInfos[0].isActive);
                if (isActive === false) {
                    rows.push({
                        baseToken: item.baseToken ?? '',
                        quoteToken: item.quoteToken ?? '',
                        note: 'Giá bị inactive',
                        baseTokenName: common.searchTokenName(allTokenList, item.baseToken),
                        quoteTokenName: common.searchTokenName(allTokenList, item.quoteToken),
                    });
                    console.log(`Giá bị inactive `)
                }
                else {
                    allPrice.push({
                        baseToken: item.baseToken ?? '',
                        quoteToken: item.quoteToken ?? '',
                        baseTokenName: common.searchTokenName(allTokenList, item.baseToken),
                        quoteTokenName: common.searchTokenName(allTokenList, item.quoteToken),
                        exchangeRateNum: parseFloat(responseBody.data.priceInfos.exchangeRateNum),
                        exchangeRateDen: parseFloat(responseBody.data.priceInfos.exchangeRateDen),
                    });
                }
            }
            // console.log("Rows hiện tại:", rows.length, rows);
        }
    }
    // ✅ Sau vòng lặp mới ghi file Excel
    let timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    // common.saveToExcelFile(`./tests/test_result/check_price_${timestamp}.xlsx`,'Error Price', rows);
    common.saveToExcelFile2sheet(`./tests/test_result/check_price_${timestamp}.xlsx`, 'Error Price', 'valide Price', rows, allPrice);
});

test('Parse list price', async () => {
    const rowData = common.readFromExcelFile('./tests/datatest/Token_list.xlsx', 'NewToken');
    const rows: any[] = [];
    for (const item of rowData) {
        let jsonData: any;
        try {
            jsonData = JSON.parse(item.collaterals);
        } catch (e) {
            throw new Error('Không parse được JSON: ' + e);
        }
        for (const tmp of jsonData) {
            rows.push({
                supply_token: item.supply_token,
                collateral: tmp.token,
                threshold: tmp.threshold,
                isActive: tmp.enable
            })
        }
    }
    common.saveToExcelFile(`./tests/test_result/newToken.xlsx`, 'listPaireToken', rows);
})

async function readCSV(filePath: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
        const results: any[] = [];
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', (err) => reject(err));
    });
}