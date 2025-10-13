
export function env(env: string) {
    if (env === 'PREVIEW')
        return {
            oracleScriptHash: 'a2fa8564c279ca144d69bbbd37057f5d3d42e59555bc3bfb874919f6',
            url: 'https://onchain-price-aggregator.dev.tekoapis.net/api/v1/prices',
            urlMarket: 'https://crypto-admin-bff.dev.tekoapis.net/api/v1/float-lending/markets',
        }
    else if (env === 'PREPROD')
        return {
            oracleScriptHash: '79d908a5964f87c44d867ced2ca620751edfa844e0f21685180048bd',
            url: 'https://onchain-price-preprod.dev.tekoapis.net/api/v1/prices',
            urlMarket: 'https://crypto-admin-bff.dev.tekoapis.net/api/v1/float-lending/markets',
        }
    else {
        return {
            oracleScriptHash: '',
            url: '',
            urlMarket: '',
        }
    }
}