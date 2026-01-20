
export function priceEnv(env: string) {
    if (env === 'PREVIEW')
        return {
            oracleScriptHash: '',
            urlPrice: '',
        }
    else if (env === 'PREPROD')
        return {
            oracleScriptHash: '',
            urlPrice: '',
        }
    // V1
    else if (env === 'MAIN_OLD_POOL') {
        return {
            oracleScriptHash: '2eb7e9be6a1fff3e3e33d2b05007488f199c895a051b3ee371a95f6c',
            urlPrice: 'https://onchain-price-aggregator.tekoapis.com/api/v1/prices',
        }
    }
    // V2
    else if (env === 'MAIN_NEW_POOL_V2') {
        return {
            oracleScriptHash: 'b2017c9c91c189db01bcc40ac215354a186f3455157380c130bd010f',
            urlPrice: 'https://onchain-price-aggregator.tekoapis.com/api/v1/prices',
        }

    }
    else if (env === 'MAIN_NEW_POOL_V3') {
        return {
            oracleScriptHash: '7115b6ccb9ba59e079b6b043b4344ecc6fe061ef7f748feebe50c120',
            urlPrice: 'https://onchain-price-aggregator.tekoapis.com/api/v1/prices',
        }

    }
    // V3
    else if (env === 'MAIN_BETA_POOL') {
        return {
            oracleScriptHash: '7115b6ccb9ba59e079b6b043b4344ecc6fe061ef7f748feebe50c120',
            urlPrice: 'https://onchain-price-aggregator-beta.tekoapis.com/api/v1/prices',
        }

    }
    else if (env === 'MAIN_POC_V1') {
        return {
            oracleScriptHash: '2eb7e9be6a1fff3e3e33d2b05007488f199c895a051b3ee371a95f6c',
            urlPrice: 'https://poc-onchain-price-aggregator.tekoapis.com/api/v1/prices',
        }
    }
    else if (env === 'MAIN_POC_V2') {
        return {
            oracleScriptHash: '7115b6ccb9ba59e079b6b043b4344ecc6fe061ef7f748feebe50c120',
            urlPrice: 'https://poc-onchain-price-aggregator.tekoapis.com/api/v1/prices',
        }
    }
    else if (env === 'MAIN_V2_PROD_V1') {
        return {
            oracleScriptHash: '2eb7e9be6a1fff3e3e33d2b05007488f199c895a051b3ee371a95f6c',
            urlPrice: 'https://onchain-price-aggregator.api.danogo.io/api/v1/prices',
        }
    }
    else if (env === 'MAIN_V2_PROD_V2') {
        return {
            oracleScriptHash: '7115b6ccb9ba59e079b6b043b4344ecc6fe061ef7f748feebe50c120',
            urlPrice: 'https://onchain-price-aggregator.api.danogo.io/api/v1/prices',
        }
    }
}

export function env(env: string) {
    if (env === 'PREVIEW')
        return {
            oracleScriptHash: 'a2fa8564c279ca144d69bbbd37057f5d3d42e59555bc3bfb874919f6',
            //  oracleScriptHash: '6ffa215ebd214d2d804dbb425f0c708262a3bc635f3ce2391b845748',
            urlPrice: 'https://onchain-price-aggregator.dev.tekoapis.net/api/v1/prices',
            urlMarket: 'https://crypto-admin-bff.dev.tekoapis.net/api/v1/float-lending/markets',
            yieldUrl: '',
            resultName: 'PREVIEW',
            lendingUrl: '',
            usdm: '',
        }
    else if (env === 'PREPROD')
        return {
            // oracleScriptHash: '79d908a5964f87c44d867ced2ca620751edfa844e0f21685180048bd',
            // oracleScriptHash: '25bc9716547b91ad00c5250a828be8d4c95f1e69eb3b42a2cd164b16',
            // oracleScriptHash: '887d60969ff82614c24fbdd7951e0e52134d4cda8c5b4b4126d899c2', // V2
            oracleScriptHash: '9613270846c950e6c3162fdc309f5d31de9c125f51fc454552bb1396', // V3
            urlPrice: 'https://onchain-price-preprod.dev.tekoapis.net/api/v1/prices',
            urlMarket: 'https://crypto-admin-preprod-bff.dev.tekoapis.net/api/v1/float-lending/markets',
            yieldUrl: '',
            resultName: 'PREPROD',
            lendingUrl: 'https://danogo.dev.teko.vn/',
            usdm: '834a15101873b4e1ddfaa830df46792913995d8738dcde34eda27905.665553444d',
        }
    else if (env === 'PREPROD_FLOAT')
        return {
            oracleScriptHash: '9613270846c950e6c3162fdc309f5d31de9c125f51fc454552bb1396', // V3
            urlPrice: 'https://onchain-price-preprod.dev.tekoapis.net/api/v1/prices',
            urlMarket: 'https://crypto-admin-float-preprod-bff.dev.tekoapis.net/api/v1/float-lending/markets',
            yieldUrl: '',
            resultName: 'PREPROD_FLOAT',
            lendingUrl: 'https://float-supply-leverage.dev.teko.vn/',
            usdm: '834a15101873b4e1ddfaa830df46792913995d8738dcde34eda27905.665553444d',
        }
    else if (env === 'MAIN_OLD_POOL') {
        return {
            oracleScriptHash: '2eb7e9be6a1fff3e3e33d2b05007488f199c895a051b3ee371a95f6c',
            urlPrice: 'https://onchain-price-aggregator.tekoapis.com/api/v1/prices',
            urlMarket: 'https://crypto-admin-bff.tekoapis.com/api/v1/float-lending/markets',
            yieldUrl: 'https://yield-aggregator.tekoapis.com/',
            resultName: 'MAIN_OLD_POOL',
            lendingUrl: 'https://float-lending-bff.tekoapis.com/api/v1/load-main-screen',
            usdm: '',
        }
    }
    else if (env === 'MAIN_POC_POOL') {
        return {
            oracleScriptHash: '7115b6ccb9ba59e079b6b043b4344ecc6fe061ef7f748feebe50c120', // poc
            urlPrice: 'https://onchain-price-aggregator.api.danogo.io/api/v1/prices',
            urlMarket: 'https://crypto-admin-bff.tekoapis.com/api/v1/float-lending/markets',
            yieldUrl: 'https://yield-aggregator.tekoapis.com/',
            resultName: 'MAIN_POC_POOL',
            lendingUrl: 'https://float-lending-bff.tekoapis.com/api/v1/load-main-screen',
            usdm: '',
        }
    }
    else if (env === 'MAIN_NEW_POOL') {
        return {
            // oracleScriptHash: '7115b6ccb9ba59e079b6b043b4344ecc6fe061ef7f748feebe50c120',
            // oracleScriptHash: '7115b6ccb9ba59e079b6b043b4344ecc6fe061ef7f748feebe50c120',
            oracleScriptHash: '7115b6ccb9ba59e079b6b043b4344ecc6fe061ef7f748feebe50c120', // V3
            // urlPrice: 'https://onchain-price-aggregator.tekoapis.com/api/v1/prices',
            urlPrice: 'https://onchain-price-aggregator-beta.tekoapis.com/api/v1/prices',
            urlMarket: 'https://crypto-admin-beta.tekoapis.com/api/v1/float-lending/markets',
            yieldUrl: 'https://float-lending-bff.tekoapis.com/',
            resultName: 'MAIN_NEW_POOL',
            lendingUrl: '',
            usdm: '',
        }
    }
    if (env === 'MAIN_POV') {
        return {
            oracleScriptHash: '2eb7e9be6a1fff3e3e33d2b05007488f199c895a051b3ee371a95f6c', // V3
            urlPrice: 'https://poc-onchain-price-aggregator.tekoapis.com/api/v1/prices',
            urlMarket: '',
            yieldUrl: '',
            resultName: 'MAIN_POV',
            lendingUrl: 'https://poc-float-lending-bff.tekoapis.com/api/v1/load-main-screen',
            usdm: '',
        }
    }
    else {
        return {
            oracleScriptHash: '',
            urlPrice: '',
            urlMarket: '',
            yieldUrl: '',
            resultName: '',
            lendingUrl: '',
            usdm: '',
        }
    }
}