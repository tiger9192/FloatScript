import { test, expect, request } from '@playwright/test';
import * as XLSX from "xlsx";
import fs from 'fs';
import csv from 'csv-parser';
import * as common from '../Common';
import * as config from '../config';


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