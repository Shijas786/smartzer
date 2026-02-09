import 'dotenv/config';

const NEYNAR_BASE_URL = "https://api.neynar.com/v2/farcaster";

/**
 * Strict production fetch for Neynar API.
 * No mock fallbacks. Returns null on error.
 */
async function neynarFetch(endpoint, apiKey, options = {}) {
    if (!apiKey) throw new Error("Missing NEYNAR_API_KEY");

    const url = `${NEYNAR_BASE_URL}${endpoint}`;
    const headers = {
        'api_key': apiKey,
        'accept': 'application/json',
        'content-type': 'application/json'
    };

    try {
        const response = await fetch(url, { headers, ...options });
        if (!response.ok) {
            const errBody = await response.text();
            console.error(`Neynar API Error [${response.status}]: ${errBody}`);
            return null;
        }
        return await response.json();
    } catch (e) {
        console.error(`Neynar Network Error: ${e.message}`);
        return null;
    }
}

export async function getTrendingCasts(apiKey) {
    const data = await neynarFetch(`/feed?feed_type=filter&filter_type=parent_url&parent_url=https://onchain.farcaster.xyz&limit=5`, apiKey);
    if (!data || !data.casts) return [];

    return data.casts.map(cast => ({
        text: cast.text,
        author: cast.author.username,
        address: cast.author.verifications?.[0] || null
    }));
}

export async function searchCasts(apiKey, query) {
    const data = await neynarFetch(`/cast/search?q=${query}&limit=5`, apiKey);
    if (!data || !data.result?.casts) return [];

    return data.result.casts.map(cast => ({
        text: cast.text,
        author: cast.author.username,
        address: cast.author.verifications?.[0] || null
    }));
}

export async function fetchNotifications(apiKey, fid) {
    if (!fid) return [];
    const data = await neynarFetch(`/notifications?fid=${fid}&type=mentions&type=replies&limit=10`, apiKey);
    if (!data || !data.notifications) return [];

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
    if (!signerUuid) throw new Error("Missing NEYNAR_SIGNER_UUID");

    const body = {
        signer_uuid: signerUuid,
        text: text
    };
    if (parentHash) body.parent = parentHash;

    const result = await neynarFetch(`/cast`, apiKey, {
        method: 'POST',
        body: JSON.stringify(body)
    });

    if (!result) return { success: false, error: "Post failed" };
    return { success: true, ...result };
}

export async function resolveAddressToUsername(apiKey, address) {
    if (!address) return null;
    const data = await neynarFetch(`/user/bulk-by-address?addresses=${address}`, apiKey);
    if (!data || !data[address.toLowerCase()]?.[0]) return null;
    return data[address.toLowerCase()][0].username;
}
