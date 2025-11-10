import { request } from '@playwright/test';
import cron from 'node-cron';
import fs from 'fs';
import path from 'path';

const logFilePath = path.resolve('test-results/api_check.log');

async function checkApiWithUrl(url, token_name) {

    // Tạo request context của Playwright
    const requestContext = await request.newContext();

    // Gọi API

    const response = await requestContext.get(url, {
        headers: {
            'Content-Type': 'application/json'
        },
    });

    const listPool = await response.json();
    // Kiểm tra status code
    if (response.status() === 200) {
        // console.log('✅ API response 200');
        let checkfloat = false;
        let protocolSupplyApy = '';
        listPool.data.supplyingPositions.forEach((positions) => {
            if (positions.protocolCode === 'float') {
                checkfloat = true;
                protocolSupplyApy = positions.protocolSupplyApy;
            }
        })
        if (checkfloat === true) {
            // console.log('✅ API có trả về float ', token_name, ' Supply APY ', protocolSupplyApy);
            logToFile(`✅ ${token_name}: có FLOAT, Supply APY = ${protocolSupplyApy}`);
        }
        else {
            // console.error('❌ API KO trả về float ', token_name);
            logToFile(`❌ ${token_name}: KHÔNG có FLOAT`, true);
        }
    } else {
        // console.error('❌ API FAILED:', response.status());
        logToFile(`❌ ${token_name}: API FAILED [${response.status()}]`, true);
    }

    await requestContext.dispose();
}

async function checkAllToken() {
    const token_list = [
        { token_id: 'f13ac4d66b3ee19a6aa0f2a22298737bd907cc95121662fc971b5275.535452494b45', token_name: 'STRIKE' },
        { token_id: '5d16cc1a177b5d9ba9cfa9793b07e60f1fb70fea1f8aef064415d114.494147', token_name: 'IAG' },
        { token_id: '2d9db8a89f074aa045eab177f23a3395f62ced8b53499a9e4ad46c80.464c4f57', token_name: 'SURF' },
        { token_id: '5deab590a137066fef0e56f06ef1b830f21bc5d544661ba570bdd2ae.424f44454741', token_name: 'BODEGA' },
        { token_id: 'da8c30857834c6ae7203935b89278c532b3995245295456f993e1d24.4c51', token_name: 'LQ' },
        { token_id: '533bb94a8850ee3ccbe483106489399112b74c905342cb1792a797a0.494e4459', token_name: 'INDY' },
        { token_id: '577f0b1342f8f8f4aed3388b80a8535812950c7a892495c0ecdf0f1e.0014df10464c4454', token_name: 'FLDT' },
        { token_id: '95a427e384527065f2f8946f5e86320d0117839a5e98ea2c0b55fb00.48554e54', token_name: 'HUNT' },
        { token_id: '2852268cf6e2db42e20f2fd3125f541e5d6c5a3d70b4dda17c2daa82', token_name: 'O' },
        { token_id: 'ececc92aeaaac1f5b665f567b01baec8bc2771804b4c21716a87a4e3.53504c415348', token_name: 'SPLASH' },
        { token_id: '279c909f348e533da5808898f87f9a14bb2c3dfbbacccd631d927a3f.534e454b', token_name: 'SNEK' },
        { token_id: '25c5de5f5b286073c593edfd77b48abc7a48e5a4f3d4cd9d428ff935.455448', token_name: 'ETH' },
        { token_id: 'f6099832f9563e4cf59602b3351c3c5a8a7dda2d44575ef69b82cf8d', token_name: 'OADA' },
        { token_id: '29d222ce763455e3d7a09a665ce554f00ac89d2e99a1a83d267170c6.4d494e', token_name: 'MIN' },
        { token_id: '', token_name: 'ADA' },
        { token_id: 'fe7c786ab321f41c654ef6c1af7b3250a613c24e4213e0425a7ae456.55534441', token_name: 'USDA' },
        { token_id: '25c5de5f5b286073c593edfd77b48abc7a48e5a4f3d4cd9d428ff935.55534454', token_name: 'USDT' },
        { token_id: '25c5de5f5b286073c593edfd77b48abc7a48e5a4f3d4cd9d428ff935.55534443', token_name: 'USDC' },
        { token_id: '25c5de5f5b286073c593edfd77b48abc7a48e5a4f3d4cd9d428ff935.425443', token_name: 'BTC' },
        { token_id: '8db269c3ec630e06ae29f74bc39edd1f87c819f1056206e879a1cd61.446a65644d6963726f555344', token_name: 'DJED' },
        { token_id: 'c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad.0014df105553444d', token_name: 'USDM' },
    ];
    // console.log(`[${new Date().toISOString()}] 🔍 Running API check...`);
    logToFile(`[${new Date().toISOString()}] 🔍 Running API check...`);
    token_list.forEach((token) => {
        const url = `https://yield-aggregator.tekoapis.com/api/v1/load-supply-list-screen?page=1&pageSize=10&token=${token.token_id}&onlyMySupply=false&userAddress=addr1q8009gf2f66x5nnk3xd7f3kagn3avqtyhk5uf4zhnejmjrw7lqahdkjjknfuxdj9kevvyqmlu3zyx3x547dqw2pevx0scdedcr`;
        checkApiWithUrl(url, token.token_name);
    })

}

function logToFile(message, isError = false) {
    const timestamp = new Date().toISOString();
    const fullMessage = `[${timestamp}] ${message}\n`;
    if (isError) console.error(message);
    else console.log(message);
    fs.appendFileSync(logFilePath, fullMessage, 'utf8');
}
// ⏰ Lên lịch chạy mỗi 10 phút
// Cú pháp cron: "*/10 * * * *" nghĩa là "mỗi 10 phút"
cron.schedule('*/30 * * * *', () => {
    // checkApi().catch(console.error);
    checkAllToken().catch(console.error);
});

console.log('🚀 Job started! Checking API every 30 minutes...');