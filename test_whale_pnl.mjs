import { getWalletPnL } from './lib/zerion.mjs';
import 'dotenv/config';

async function testWhale() {
    const address = '0x46427d6d31481a979ca8474929841029c9cc7446';
    const apiKey = process.env.ZERION_API_KEY;
    const url = `https://api.zerion.io/v1/wallets/${address}/pnl`;
    const auth = Buffer.from(`${apiKey}:`).toString('base64');
    const response = await fetch(url, { headers: { 'Authorization': `Basic ${auth}`, 'accept': 'application/json' } });
    const data = await response.json();
    console.log('Raw PnL Response for vace.eth:', JSON.stringify(data, null, 2));
}

testWhale();
