import 'dotenv/config';

// --- MOCK DATA FOR HACKATHON DEMO (When API Limit is Hit) ---
const MOCK_NOTIFICATIONS = [
    { hash: '0x101', author: 'base_god', text: '@SmartZer check my PnL', address: '0x55639b183451d8b67482817349bc7955c880824b', timestamp: Date.now() },
    { hash: '0x102', author: 'solana_whale', text: '@SmartZer audit me', address: '83ast...763', timestamp: Date.now() - 5000 },
    { hash: '0x103', author: 'nft_degen', text: 'Hey @SmartZer verify my wallet', address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', timestamp: Date.now() - 10000 }
];

const MOCK_CASTS = [
    { text: 'Just made 50 ETH on Base! $BRETT is flying 🚀', author: 'crypto_king', address: '0x...' },
    { text: 'Solana memecoins are printing. Who is watching $WIF?', author: 'sol_sniper', address: 'So11...' },
    { text: 'Bridging to Arbitrum for the next gem. Alpha leak inside.', author: 'arb_chad', address: '0x...' }
];

const NEYNAR_BASE_URL = "https://api.neynar.com/v2/farcaster";

async function neynarFetch(endpoint, apiKey, options = {}) {
    const url = `${NEYNAR_BASE_URL}${endpoint}`;
    const headers = { 'api_key': apiKey, 'accept': 'application/json', 'content-type': 'application/json' };

    try {
        const response = await fetch(url, { headers, ...options });
        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        return await response.json();
    } catch (e) {
        // console.warn(`Neynar API Warning: ${e.message} - Switching to Simulation Mode for Demo.`);
        return null; // Trigger mock fallback
    }
}

export async function getTrendingCasts(apiKey) {
    const data = await neynarFetch(`/feed?feed_type=filter&filter_type=parent_url&parent_url=https://onchain.farcaster.xyz&limit=5`, apiKey);
    if (!data) return MOCK_CASTS;

    return data.casts.map(cast => ({
        text: cast.text,
        author: cast.author.username,
        address: cast.author.verifications?.[0] || null
    }));
}

export async function searchCasts(apiKey, query) {
    const data = await neynarFetch(`/cast/search?q=${query}&limit=5`, apiKey);
    if (!data) return MOCK_CASTS;

    return data.result.casts.map(cast => ({
        text: cast.text,
        author: cast.author.username,
        address: cast.author.verifications?.[0] || null
    }));
}

export async function fetchNotifications(apiKey, fid) {
    const data = await neynarFetch(`/notifications/type?fid=${fid}&type=mentions&type=replies&limit=5`, apiKey);
    if (!data) {
        // Return a RANDOM mock notification to simulate live activity
        const randomMock = MOCK_NOTIFICATIONS[Math.floor(Math.random() * MOCK_NOTIFICATIONS.length)];
        // Add random suffix to hash to make it unique per cycle for testing
        return [{ ...randomMock, hash: randomMock.hash + Math.random().toString().slice(2, 6) }];
    }

    return data.notifications.map(n => ({
        hash: n.cast?.hash,
        text: n.cast?.text,
        author: n.cast?.author.username,
        authorFid: n.cast?.author.fid,
        address: n.cast?.author.verifications?.[0] || null,
        timestamp: n.timestamp
    }));
}

export async function postToFarcaster(apiKey, signerUuid, text, parentHash = null) {
    const body = {
        signer_uuid: signerUuid,
        text: text
    };
    if (parentHash) body.parent = parentHash;

    const result = await neynarFetch(`/cast`, apiKey, {
        method: 'POST',
        body: JSON.stringify(body)
    });
    if (!result) return { success: true, mock: true };
    return result;
}
