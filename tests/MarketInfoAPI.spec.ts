import * as XLSX from "xlsx";
import { test, expect, request } from "@playwright/test";
import * as common from './Common';

test('Verify MarketInfo APY', async () => {
    const apiContext = await request.newContext();
    const allTokenList = common.readFromExcelFile('./tests/datatest/Token_list.xlsx', 'All float token');
    const response = await apiContext.get('https://crypto-admin-bff.tekoapis.com/api/v1/float-lending/markets', {
        headers: {
            'Content-Type': 'application/json'
        },
    });
    expect(response.status()).toBe(200);
    const responseMarketInfo = await response.json();
    const rows: any[] = [];

    responseMarketInfo.data.markets.forEach((market: any) => {
        market.supportedCollaterals.forEach((col: any) => {
            let searchTokenName = common.searchTokenName(allTokenList, col.token);
            let compareTokenName = '';
            if (searchTokenName.toUpperCase() !== col.tokenName.toUpperCase()) {
                compareTokenName = searchTokenName;
            }
            rows.push({
                Token: market.token,
                TokenName: market.tokenName,
                collateralToken: col.token,
                collateralTokenName: col.tokenName,
                liquidationThreshold: col.liquidationThreshold,
                compareTokenName: compareTokenName
            });
        });
    });
    // Chuyển sang sheet
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Markets");
    // Xuất file Excel
    XLSX.writeFile(workbook, "./tests/test_result/markets.xlsx");
    console.log("✅ Đã ghi dữ liệu ra file markets.xlsx");
});

