import 'dotenv/config';

async function testEndpoints() {
    const apiKey = process.env.NEYNAR_API_KEY;
    const fid = process.env.AGENT_FID;

    const endpoints = [
        `/notifications?fid=${fid}`,
        `/notifications/type?fid=${fid}&type=mentions`,
        `/mentions?fid=${fid}`
    ];

    for (const ep of endpoints) {
        const url = `https://api.neynar.com/v2/farcaster${ep}`;
        console.log(`📡 Trying: ${url}`);
        const res = await fetch(url, {
            headers: { 'api_key': apiKey }
        });
        console.log(`📊 Status: ${res.status}`);
        if (res.ok) {
            console.log(`✅ Success for ${ep}`);
            break;
        } else {
            const body = await res.text();
            console.log(`❌ Fail: ${body}`);
        }
    }
}

testEndpoints();
