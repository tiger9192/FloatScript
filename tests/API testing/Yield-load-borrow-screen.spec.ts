import { test, expect, request, APIRequestContext, APIResponse } from '@playwright/test';
import * as config from '../config';

const listToken = [
    { Pool_id: '814de8a99452972a9fa9fe2c0f59f49697f208005c001ecac1ddfd57.83b8a0a2074061394fddfe9aebee6fab4924dd73ec1326162f453dc9', Token: 'f13ac4d66b3ee19a6aa0f2a22298737bd907cc95121662fc971b5275.535452494b45', TokenName: 'STRIKE' },
    { Pool_id: '814de8a99452972a9fa9fe2c0f59f49697f208005c001ecac1ddfd57.4c56da0af61dfca72b32de9fc0c44ecdd248932e69ce267d62b7ddc1', Token: '5d16cc1a177b5d9ba9cfa9793b07e60f1fb70fea1f8aef064415d114.494147', TokenName: 'IAG' },
    { Pool_id: '814de8a99452972a9fa9fe2c0f59f49697f208005c001ecac1ddfd57.18e8d03ef4d8ab3c408551378040ae6a8dd1bb437023858bf4994df7', Token: '2d9db8a89f074aa045eab177f23a3395f62ced8b53499a9e4ad46c80.464c4f57', TokenName: 'SURF' },
    { Pool_id: '814de8a99452972a9fa9fe2c0f59f49697f208005c001ecac1ddfd57.34d8725885174384ff7cd92e8b0b7a1d71a12550c9d61360ad4cf43c', Token: '5deab590a137066fef0e56f06ef1b830f21bc5d544661ba570bdd2ae.424f44454741', TokenName: 'BODEGA' },
    { Pool_id: '814de8a99452972a9fa9fe2c0f59f49697f208005c001ecac1ddfd57.6487e97f20fba709c9edf5da2b72ad2a120ab4c5c38fe381fb76b25d', Token: 'da8c30857834c6ae7203935b89278c532b3995245295456f993e1d24.4c51', TokenName: 'LQ' },
    { Pool_id: '814de8a99452972a9fa9fe2c0f59f49697f208005c001ecac1ddfd57.a1bc0130b1eb217e58c2b40f4e6ed7647af5c71157466bd6a0dbb85c', Token: '533bb94a8850ee3ccbe483106489399112b74c905342cb1792a797a0.494e4459', TokenName: 'INDY' },
    { Pool_id: '814de8a99452972a9fa9fe2c0f59f49697f208005c001ecac1ddfd57.45af09272aeaf60d2215ce33daa6d2bc3ced61e5b59be434d21cd2e8', Token: '577f0b1342f8f8f4aed3388b80a8535812950c7a892495c0ecdf0f1e.0014df10464c4454', TokenName: 'FLDT' },
    { Pool_id: '814de8a99452972a9fa9fe2c0f59f49697f208005c001ecac1ddfd57.9c00007e09c95cc0c282fad790760cfbf33495c3161a77b4c87cfaed', Token: '95a427e384527065f2f8946f5e86320d0117839a5e98ea2c0b55fb00.48554e54', TokenName: 'HUNT' },
    { Pool_id: '814de8a99452972a9fa9fe2c0f59f49697f208005c001ecac1ddfd57.3cfdbb46c8359e7f5e56d48a330cf85fc38eef19c83730198bc0dcbb', Token: '2852268cf6e2db42e20f2fd3125f541e5d6c5a3d70b4dda17c2daa82', TokenName: 'O' },
    { Pool_id: '814de8a99452972a9fa9fe2c0f59f49697f208005c001ecac1ddfd57.03138e523f4c919472b493f0e3432264cc7faed01ef3fb6bb4987281', Token: 'ececc92aeaaac1f5b665f567b01baec8bc2771804b4c21716a87a4e3.53504c415348', TokenName: 'SPLASH' },
    { Pool_id: '814de8a99452972a9fa9fe2c0f59f49697f208005c001ecac1ddfd57.2e614ed06d9ab2b693f108251c6df8d5e37cae81ffce99a4cf0a781f', Token: '279c909f348e533da5808898f87f9a14bb2c3dfbbacccd631d927a3f.534e454b', TokenName: 'SNEK' },
    { Pool_id: '814de8a99452972a9fa9fe2c0f59f49697f208005c001ecac1ddfd57.5f6c47af012a8df6b79a7927d598ed4f59745f9c653a5440656800e3', Token: '25c5de5f5b286073c593edfd77b48abc7a48e5a4f3d4cd9d428ff935.455448', TokenName: 'ETH' },
    { Pool_id: '814de8a99452972a9fa9fe2c0f59f49697f208005c001ecac1ddfd57.eac93ffee36e1c544e9a1eff8aff1a8e4da748f42be54b4b0e2fbb6c', Token: 'f6099832f9563e4cf59602b3351c3c5a8a7dda2d44575ef69b82cf8d', TokenName: 'OADA' },
    { Pool_id: '814de8a99452972a9fa9fe2c0f59f49697f208005c001ecac1ddfd57.251d5ccb51543f3647b344d4a4c8f2df5bff9d164854e3e7fe4b1711', Token: '29d222ce763455e3d7a09a665ce554f00ac89d2e99a1a83d267170c6.4d494e', TokenName: 'MIN' },
    { Pool_id: '814de8a99452972a9fa9fe2c0f59f49697f208005c001ecac1ddfd57.f04403181fbd051edd971af67b85f6c6fe1d9d98949a80b9f3803a14', Token: '', TokenName: 'ADA' },
    { Pool_id: '814de8a99452972a9fa9fe2c0f59f49697f208005c001ecac1ddfd57.7553c4258a557314d787908085e67fb50f7d6f8f6ff6e0d1c9b9306b', Token: 'fe7c786ab321f41c654ef6c1af7b3250a613c24e4213e0425a7ae456.55534441', TokenName: 'USDA' },
    { Pool_id: '814de8a99452972a9fa9fe2c0f59f49697f208005c001ecac1ddfd57.2d94b144d91520d0de771f6c3449d5cff8f0373c472dae2b9851a8c2', Token: '25c5de5f5b286073c593edfd77b48abc7a48e5a4f3d4cd9d428ff935.55534454', TokenName: 'USDT' },
    { Pool_id: '814de8a99452972a9fa9fe2c0f59f49697f208005c001ecac1ddfd57.b96f6167426d625b8975c0437966745c9240e6488517b2b2f44bc7c7', Token: '25c5de5f5b286073c593edfd77b48abc7a48e5a4f3d4cd9d428ff935.55534443', TokenName: 'USDC' },
    { Pool_id: '814de8a99452972a9fa9fe2c0f59f49697f208005c001ecac1ddfd57.134ab43b73bd6f5ae70534fe51194ad62618d39a539830ecef4f8e19', Token: '25c5de5f5b286073c593edfd77b48abc7a48e5a4f3d4cd9d428ff935.425443', TokenName: 'BTC' },
    { Pool_id: '814de8a99452972a9fa9fe2c0f59f49697f208005c001ecac1ddfd57.a90873033a7449a360ab4a9b07b7262cad46a54031d09d784cf01127', Token: '8db269c3ec630e06ae29f74bc39edd1f87c819f1056206e879a1cd61.446a65644d6963726f555344', TokenName: 'DJED' },
    { Pool_id: '814de8a99452972a9fa9fe2c0f59f49697f208005c001ecac1ddfd57.2212068512d00ba78800e493bce47121d492043c864d896ea9f5ad5c', Token: 'c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad.0014df105553444d', TokenName: 'USDM' }
]

test('Verify Borrow screen API ', async () => {
    const apiContext = await request.newContext();
    // const env = config.env('PREVIEW');
    // const env = config.env('PREPROD');
    const env = config.env('MAIN_OLD_POOL');

    for (const item of listToken) {

        const response = await callAPIGetBorrowScreen(apiContext, item.Token,item.Pool_id);
        expect(response.status()).toBe(200);
        // Verify body trả về là JSON
        const responseBody = await response.json();
        expect(responseBody).toBeTruthy();
        // đọc data từ API supply  trả về
        expect(responseBody).toHaveProperty('data');
        let totalSupply = parseFloat(responseBody.data.totalSupply);
        let totalBorrow = parseFloat(responseBody.data.totalBorrow);
        console.log(`⚡token: ${item.TokenName} total borrow:  ${totalBorrow} - total supply: ${totalSupply}`);
    }
});



async function callAPIGetBorrowScreen(apiContext: APIRequestContext, token: string, pool_id: string): Promise<APIResponse> {
    const requestParam = JSON.stringify({
        token: token,
        poolId: pool_id

    });
    const env = config.env('MAIN_OLD_POOL');
    const url = `${env.yieldUrl}api/v1/float/load-borrow-screen?token=${token}&poolId=${pool_id}`;
    // console.log(url);
    return await apiContext.get(url, {
        headers: {
            'Content-Type': 'application/json'
        },
    });
}