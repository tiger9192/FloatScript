import { test, expect, request } from '@playwright/test';
import * as XLSX from "xlsx";
import fs from 'fs';
import csv from 'csv-parser';
import * as common from '../Common';
import * as config from '../config';

test('Verify Price API', async () => {
 const requestParam = JSON.stringify({
            tokenPairs: [{
                baseToken: item.collateralToken ?? '',
                quoteToken: item.Token ?? '',
                denominator: "10000000",
                oracleScriptHash: env.oracleScriptHash
            }
            ]
        });
        const response = await apiContext.post(env.urlPrice, {
            headers: {
                'Content-Type': 'application/json'
            },
            data: requestParam

        });
});