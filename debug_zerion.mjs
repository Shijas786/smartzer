import fetch from 'node-fetch';
import 'dotenv/config';

async function testZerionRaw() {
    const apiKey = process.env.ZERION_API_KEY;
    const path = '/fungibles/';
    const params = {
        'filter[implementation_chain_id]': 'base',
        'sort': '-market_data.price.percent_change_1d',
        'page[size]': 1
    };

    const url = new URL(`https://api.zerion.io/v1${path}`);
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

    // Zerion Basic Auth is just the API Key as the username, no password.
    const auth = Buffer.from(`${apiKey}:`).toString('base64');

    console.log(`📡 Requesting: ${url.toString()}`);

    try {
        const response = await fetch(url.toString(), {
            headers: {
                'Authorization': `Basic ${auth}`,
                'accept': 'application/json'
            }
        });

        console.log(`📊 Status: ${response.status}`);
        const data = await response.json();

        if (data.data) {
            console.log('✅ Success! Zerion is returning data.');
            console.log(`💎 Found ${data.data.length} trending assets.`);
        } else {
            console.log('⚠️  Response received but no "data" field found.');
            console.log(JSON.stringify(data, null, 2));
        }
    } catch (e) {
        console.error(`❌ Fetch Error: ${e.message}`);
    }
}

testZerionRaw();
