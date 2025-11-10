
export function env(env: string) {
    if (env === 'PREVIEW')
        return {
            oracleScriptHash: 'a2fa8564c279ca144d69bbbd37057f5d3d42e59555bc3bfb874919f6',
            urlPrice: 'https://onchain-price-aggregator.dev.tekoapis.net/api/v1/prices',
            urlMarket: 'https://crypto-admin-bff.dev.tekoapis.net/api/v1/float-lending/markets',
            yieldUrl: '',
            resultName: 'PREVIEW',
            lendingUrl:'',
        }
    else if (env === 'PREPROD')
        return {
            // oracleScriptHash: '79d908a5964f87c44d867ced2ca620751edfa844e0f21685180048bd',
             oracleScriptHash: '25bc9716547b91ad00c5250a828be8d4c95f1e69eb3b42a2cd164b16',
            urlPrice: 'https://onchain-price-preprod.dev.tekoapis.net/api/v1/prices',
            urlMarket: 'https://crypto-admin-preprod-bff.dev.tekoapis.net/api/v1/float-lending/markets',
            yieldUrl: '',
            resultName: 'PREPROD',
            lendingUrl:'https://danogo.dev.teko.vn/',
        }
    else if (env === 'MAIN_OLD_POOL') {
        return {
            oracleScriptHash: '2eb7e9be6a1fff3e3e33d2b05007488f199c895a051b3ee371a95f6c',
            urlPrice: 'https://onchain-price-aggregator.tekoapis.com/api/v1/prices',
            urlMarket: 'https://crypto-admin-bff.tekoapis.com/api/v1/float-lending/markets',
            yieldUrl: 'https://yield-aggregator.tekoapis.com/',
            resultName: 'MAIN_OLD_POOL',
            lendingUrl:'',
        }
    }
    else if (env === 'MAIN_NEW_POOL') {
        return {
            oracleScriptHash: '',
            urlPrice: '',
            urlMarket: 'https://crypto-admin-beta.tekoapis.com/api/v1/float-lending/markets',
            yieldUrl: 'https://float-lending-bff.tekoapis.com/',
            resultName: 'MAIN_NEW_POOL',
            lendingUrl:'',
        }
    }
    else {
        return {
            oracleScriptHash: '',
            urlPrice: '',
            urlMarket: '',
            yieldUrl: '',
            resultName: '',
            lendingUrl:'',
        }
    }
}