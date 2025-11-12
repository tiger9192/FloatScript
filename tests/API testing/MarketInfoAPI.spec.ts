import * as XLSX from "xlsx";
import { test, expect, request } from "@playwright/test";
import * as config from '../config';

test('Verify MarketInfo APY', async () => {
    const apiContext = await request.newContext();
    const env = config.env('PREVIEW');
    // const env = config.env('PREPROD');
    // const env = config.env('MAIN_OLD_POOL');
    // const env = config.env('MAIN_NEW_UI');
    const response = await apiContext.get(env.urlMarket, {
        headers: {
            'Content-Type': 'application/json'
        },
    });
    expect(response.status()).toBe(200);
    const responseMarketInfo = await response.json();
    const rows: any[] = [];

    responseMarketInfo.data.markets.forEach((market: any) => {
        market.supportedCollaterals.forEach((col: any) => {
            rows.push({
                Pool_id: market.poolId,
                Token: market.token,
                TokenName: market.tokenName,
                collateralToken: col.token,
                collateralTokenName: col.tokenName,
                collateralIsEnable: col.isEnable,
                liquidationThreshold: col.liquidationThreshold,
            });
        });
    });
    // Chuyển sang sheet
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Markets");
    // Xuất file Excel
    // XLSX.writeFile(workbook, "test-results/markets_preprod.xlsx");
    // XLSX.writeFile(workbook, "test-results/markets_main_old_pool.xlsx");
    XLSX.writeFile(workbook, `test-results/market_${env.resultName}.xlsx`);
    console.log("✅ Đã ghi dữ liệu ra file markets excel");
});

test('Verify API load_supply_list_screen ', async () => {
    const apiContext = await request.newContext();
    // const allTokenList = common.readFromExcelFile('./tests/datatest/Token_list.xlsx', 'All float token');
    const url = 'https://yield-aggregator.dev.tekoapis.net/api/v1/load-supply-list-screen?page=1&pageSize=10&token=&onlyMySupply=false&userAddress=addr_test1qqlq5e8dvclt2er90rx75qs36tmp4w8c6dpwvstpv99q52nex6zylqp9703ta84g29a3mmr5akts26xerycfywkdqtvqlxwkn6';
    const response = await apiContext.get(url, {
        headers: {
            'Content-Type': 'application/json'
        },
    });
    expect(response.status()).toBe(200);
    const listPool = await response.json();
    const rows: any[] = [];

    listPool.data.supplyingPositions.forEach((positions: any) => {
        positions.supportedCollaterals.forEach((col: any) => {
            rows.push({
                Pool_id: positions.poolId,
                protocolCode: positions.protocolCode,
                protocolSupplyApy: positions.protocolSupplyApy,
                collateralToken: col.token,
                collateralTokenName: col.tokenName,
                collateralRiskLabel: col.riskLabel,
            });
        });
    });
    // Chuyển sang sheet
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Markets");
    // Xuất file Excel
    XLSX.writeFile(workbook, "test-results/supply_list_ADA.xlsx");
    console.log("✅ Đã ghi dữ liệu ra file supply_list_ADA.xlsx");
});
