import 'dotenv/config';
import { getWalletPnL } from './lib/zerion.mjs';

async function testZerion() {
    const apiKey = process.env.ZERION_API_KEY;
    const testAddress = '0x1Ff8c1f0dE2692019818171d3d3D3d3D3D3d3d3d'; // Known whale/test address 

    console.log(`🔍 Testing Zerion API for address: ${testAddress}`);

    if (!apiKey) {
        console.error('❌ ZERION_API_KEY is missing from .env');
        return;
    }

    const pnl = await getWalletPnL(testAddress, apiKey);

    if (pnl) {
        console.log('✅ Zerion API is Fetching Correctly!');
        console.log(`📊 Total Return: $${pnl.total?.value.toLocaleString()}`);
        console.log(`📈 24h Change: ${pnl.total?.absolute_change_24h.toLocaleString()}`);
    } else {
        console.error('❌ Zerion API Failed to fetch data. Check your API Key or rate limits.');
    }
}

testZerion();
