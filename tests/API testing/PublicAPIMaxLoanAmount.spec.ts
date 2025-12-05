import { test, expect, request } from '@playwright/test';
import * as XLSX from "xlsx";
import fs from 'fs';
import csv from 'csv-parser';
import * as common from '../Common';
import * as config from '../config';


test('Scan all collateral and token ', async () => {
    test.setTimeout(9000000);
    const fileName = 'test-results/public_API_listToken.xlsx';
    const sheetName = 'ListToken'
    await callAPIMaxLoanAmountFromFile(fileName, sheetName);
});

async function callAPIMaxLoanAmountFromFile(fileName: string, sheetName: string) {
    const listTokenPairs = common.readFromExcelFile(fileName, sheetName);
    const maxBorrow: any[] = [];
    for (const item of listTokenPairs) {
        if (item.note == '429') {
            if (item.liquidationThreshold !== null) {
                let liquidationThreshold = Number(item.liquidationThreshold) * 1000;

                const response = await callAPIMaxLoanAmount(item.loanToken, item.collateralToken, item.collateralAmount.toString(), liquidationThreshold.toString());
                console.log(`call API thành công  ${item.loanToken};  ${item.collateralToken} ;  ${item.collateralAmount} ; ${liquidationThreshold}`);
                let result = await readResponse(response);
                maxBorrow.push({
                    loanToken: item.loanToken ?? '',
                    loanTokenName: common.searchTokenName(listTokenPairs, item.loanToken),
                    collateralToken: item.collateralToken ?? '',
                    collateralTokenName: common.searchTokenName(listTokenPairs, item.collateralToken),
                    collateralIsEnable: item.collateralIsEnable ?? '',
                    liquidationThreshold: item.liquidationThreshold,
                    collateralAmount: item.collateralAmount,
                    note: result?.note,
                    maxBorrowAmount: result?.maxBorrowAmount,
                    message: result?.message,

                });
            } else {
                console.log(`Bỏ qua  ${item.loanToken};  ${item.collateralToken} ;  ${item.collateralAmount} ; liquidationThreshold null`);
            }
        }
        else {
            maxBorrow.push({
                loanToken: item.loanToken ?? '',
                loanTokenName: common.searchTokenName(listTokenPairs, item.loanToken),
                collateralToken: item.collateralToken ?? '',
                collateralTokenName: common.searchTokenName(listTokenPairs, item.collateralToken),
                collateralIsEnable: item.collateralIsEnable ?? '',
                liquidationThreshold: item.liquidationThreshold,
                collateralAmount: item.collateralAmount,
                note: item.note,
                maxBorrowAmount: item.maxBorrowAmount,
                message: item.message,

            });
        }
    }
    // ✅ Sau vòng lặp mới ghi file Excel
    let timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    common.saveToExcelFile(`test-results/check_public_API_${timestamp}.xlsx`, 'maxLoanAmount', maxBorrow);
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
        console.log(`API trả về ${response.status()} - max loan amount: ${responseBody.data.maxBorrowAmount}`);
        result.maxBorrowAmount = responseBody.data.maxBorrowAmount;
        result.note = response.status();
    }
    return result;

}

async function callAPIMaxLoanAmount(loanToken: string, collateralToken: string, collateralAmount: string, liquidationThreshold: string): Promise<any> {
    const apiContext = await request.newContext();
    const url = "https://danogo-lending.tekoapis.com/api/v1/calculate-max-loan-amount"
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