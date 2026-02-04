import * as XLSX from "xlsx";
import { test, expect, request } from "@playwright/test";
import * as config from '../config';
import * as common from '../Common';

test('Verify MarketInfo APY', async () => {
    const apiContext = await request.newContext();
    // const env = config.env('PREVIEW');
    // const env = config.env('PREPROD');
    // const env = config.env('PREPROD_FLOAT');
    // const env = config.env('MAIN_OLD_POOL');
    const env = config.env('MAIN_NEW_POOL');
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
    const listToken = await readTokenList(rows);
    let timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    common.saveToExcelFile2sheet(`test-results/market_${env.resultName}_${timestamp}.xlsx`, 'Market info', 'List token', rows, listToken);
    console.log("✅ Đã ghi dữ liệu ra file markets excel");
});

async function readTokenList(marketList: any[]): Promise<any[]> {
    let allToken: any[] = [];
    marketList.forEach((market: any) => {
        allToken.push({ token: market.token, tokenName: market.tokenName });
        allToken.push({ token: market.collateralToken, tokenName: market.collateralTokenName });
    });

    const tokenList = [...new Map(allToken.map(item => [item.token, item])).values()];
    return tokenList;
}

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
