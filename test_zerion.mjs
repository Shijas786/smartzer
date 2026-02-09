import { getWalletPnL } from './lib/zerion.mjs';
import 'dotenv/config';

async function test() {
    const address = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'; // Vitalik's address
    const apiKey = process.env.ZERION_API_KEY;
    const url = `https://api.zerion.io/v1/wallets/${address}/pnl`;
    const auth = Buffer.from(`${apiKey}:`).toString('base64');
    const response = await fetch(url, { headers: { 'Authorization': `Basic ${auth}`, 'accept': 'application/json' } });
    const data = await response.json();
    console.log('Raw Zerion Response Body:', JSON.stringify(data, null, 2));
}

test();
