import 'dotenv/config';

async function testTransactions() {
    const address = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'; // Vitalik
    const apiKey = process.env.ZERION_API_KEY;
    const url = `https://api.zerion.io/v1/wallets/${address}/transactions/?page[size]=1&filter[chain_ids]=base,ethereum&sort=-mined_at`;
    const auth = Buffer.from(`${apiKey}:`).toString('base64');
    const response = await fetch(url, { headers: { 'Authorization': `Basic ${auth}`, 'accept': 'application/json' } });
    const data = await response.json();
    console.log('Raw Transaction Response:', JSON.stringify(data.data[0], null, 2));
}

testTransactions();
