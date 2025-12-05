import { test, expect, request } from '@playwright/test';
import * as XLSX from "xlsx";
import fs from 'fs';
import csv from 'csv-parser';
import * as common from '../Common';
import * as config from '../config';
import { time } from 'console';


test('Scan all collateral and token ', async () => {
    test.setTimeout(900000000);
    const fileName = 'test-results/public_API_listToken.xlsx';
    const sheetName = 'ListToken'
    await callAPIMaxLoanAmountFromFile(fileName, sheetName);
});

async function callAPIMaxLoanAmountFromFile(fileName: string, sheetName: string) {
    let i = 1;
    const listTokenPairs = common.readFromExcelFile(fileName, sheetName);
    const maxBorrow: any[] = [];
    for (const item of listTokenPairs) {
        if (item.note == '429' || item.note == '200') {
            i++;
            const response = await callAPICreateLoan(item.loanToken, item.maxBorrowAmount.toString(), item.collateralToken, item.collateralAmount.toString());
            const hf = await callAPICalculateHF(item.loanToken, item.maxBorrowAmount.toString(), item.collateralToken, item.collateralAmount.toString(), (Number(item.liquidationThreshold) * 10000).toString());
            const maxBorrowAmount = await callAPIMaxBorrow(item.loanToken, item.collateralToken, item.collateralAmount.toString(), (Number(item.liquidationThreshold) * 10000).toString());
            console.log(`call API thành công  ${item.loanToken};  ${item.collateralToken} ;  ${item.collateralAmount}`);
            let result = await readResponse(response);
            let resultHF = await readResponseHF(hf);
            let resultMaxBorrow = await readResponseMaxBorrow(maxBorrowAmount);
            maxBorrow.push({
                loanToken: item.loanToken ?? '',
                loanTokenName: common.searchTokenName(listTokenPairs, item.loanToken),
                minTxAmount: item.minTxAmount,
                collateralToken: item.collateralToken ?? '',
                collateralTokenName: common.searchTokenName(listTokenPairs, item.collateralToken),
                collateralIsEnable: item.collateralIsEnable ?? '',
                liquidationThreshold: item.liquidationThreshold,
                collateralAmount: item.collateralAmount ?? '',
                maxBorrowAmount: item.maxBorrowAmount ?? '',
                note: result?.note,
                message: result?.message,
                noteHF: resultHF?.note,
                healthFactor: resultHF?.message,
                noteMaxborrow: resultMaxBorrow?.note,
                maxBorrowAmountAPI: resultMaxBorrow?.message,

            });
        }
        else {
            maxBorrow.push({
                loanToken: item.loanToken ?? '',
                loanTokenName: common.searchTokenName(listTokenPairs, item.loanToken),
                minTxAmount: item.minTxAmount,
                collateralToken: item.collateralToken ?? '',
                collateralTokenName: common.searchTokenName(listTokenPairs, item.collateralToken),
                collateralIsEnable: item.collateralIsEnable ?? '',
                liquidationThreshold: item.liquidationThreshold,
                collateralAmount: item.collateralAmount ?? '',
                maxBorrowAmount: item.maxBorrowAmount ?? '',
                note: item.note,
                message: item.message,
                noteHF: item.noteHF ?? '',
                healthFactor: item.healthFactor ?? '',
                noteMaxborrow: item.noteMaxborrow ?? '',
                maxBorrowAmountAPI: item.maxBorrowAmountAPI ?? '',
            });
        }
        if (i % 10 === 0) {
            i++;
            console.log('Đang chờ 1 phút để tránh quá tải API...');
            await new Promise(resolve => setTimeout(resolve, 10000));
        }
    }
    // ✅ Sau vòng lặp mới ghi file Excel
    let timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    common.saveToExcelFile(`test-results/check_public_API_createFloat${timestamp}.xlsx`, 'maxLoanAmount', maxBorrow);
}

async function readResponse(response: any) {
    let result = {
        note: '',
        maxBorrowAmount: '',
        message: '',
    };
    if (response.status() !== 200) {
        const responseBody = await response.json();
        console.log(`API trả về ${response.status()}`);
        result.note = response.status();
        result.message = responseBody.message;
    }
    else {
        // Verify body trả về là JSON
        const responseBody = await response.json();
        // console.log(JSON.stringify(responseBody));
        console.log(`API trả về ${response.status()}`);
        result.maxBorrowAmount = responseBody.data.maxBorrowAmount;
        result.note = response.status();
        result.message = JSON.stringify(responseBody, null, 2);
    }
    return result;

}

async function readResponseMaxBorrow(response: any) {
    let result = {
        note: '',
        message: '',
    };
    if (response.status() !== 200) {
        const responseBody = await response.json();
        console.log(`API trả về ${response.status()}`);
        result.note = response.status();
        result.message = responseBody.message;
    }
    else {
        // Verify body trả về là JSON
        const responseBody = await response.json();
        // console.log(JSON.stringify(responseBody));
        console.log(`API trả về ${response.status()}`);
        result.note = response.status();
        result.message = responseBody.data.maxBorrowAmount.toString();
    }
    return result;
}

async function readResponseHF(response: any) {
    let result = {
        note: '',
        maxBorrowAmount: '',
        message: '',
    };
    if (response.status() !== 200) {
        const responseBody = await response.json();
        console.log(`API trả về ${response.status()}`);
        result.note = response.status();
        result.message = responseBody.message;
    }
    else {
        // Verify body trả về là JSON
        const responseBody = await response.json();
        // console.log(JSON.stringify(responseBody));
        console.log(`API trả về ${response.status()}`);
        result.maxBorrowAmount = responseBody.data.maxBorrowAmount;
        result.note = response.status();
        result.message = responseBody.data.healthFactor.toString();
    }
    return result;
}

async function callAPICreateLoan(loanToken: string, borrowAmount: string, collateralToken: string, collateralAmount: string): Promise<any> {
    const apiContext = await request.newContext();
    const url = "https://danogo-lending.tekoapis.com/api/v1/get-create-float-loan-params";
    let requestParam = JSON.stringify({});

    requestParam = JSON.stringify({
        borrowToken: loanToken ?? '',
        borrowAmount: borrowAmount,
        collaterals: [{
            collateralToken: collateralToken ?? '',
            collateralAmount: collateralAmount ?? '',

        }
        ]
    });
    const response = await apiContext.post(url, {
        headers: {
            'Content-Type': 'application/json'
        },
        data: requestParam

    });
    return response;
}

async function callAPICalculateHF(loanToken: string, borrowAmount: string, collateralToken: string, collateralAmount: string, liquidationThreshold: string): Promise<any> {
    const apiContext = await request.newContext();
    const url = "https://danogo-lending.tekoapis.com/api/v1/calculate-health-factor";
    let requestParam = JSON.stringify({});

    requestParam = JSON.stringify({
        loanToken: loanToken ?? '',
        loanAmount: borrowAmount,
        collateralTokens: [{
            collateralToken: collateralToken ?? '',
            collateralAmount: collateralAmount ?? '',
            liquidationThreshold: liquidationThreshold ?? '',
        }
        ]
    });
    const response = await apiContext.post(url, {
        headers: {
            'Content-Type': 'application/json'
        },
        data: requestParam

    });
    return response;
}

async function callAPIMaxBorrow(loanToken: string, collateralToken: string, collateralAmount: string, liquidationThreshold: string): Promise<any> {
    const apiContext = await request.newContext();
    const url = "https://danogo-lending.tekoapis.com/api/v1/calculate-max-loan-amount";
    let requestParam = JSON.stringify({});

    requestParam = JSON.stringify({
        loanToken: loanToken ?? '',
        healthFactor: 1.1,
        collateralTokens: [{
            collateralToken: collateralToken ?? '',
            collateralAmount: collateralAmount ?? '',
            liquidationThreshold: liquidationThreshold ?? '',
        }
        ]
    });
    const response = await apiContext.post(url, {
        headers: {
            'Content-Type': 'application/json'
        },
        data: requestParam

    });
    return response;
}


