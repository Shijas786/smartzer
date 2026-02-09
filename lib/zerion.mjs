/**
 * Zerion Intelligence Fee & Subscriptions
 */
export async function createTxSubscription(webhookUrl, wallets, apiKey) {
    const url = `https://api.zerion.io/v1/tx-subscriptions/`;
    const auth = Buffer.from(`${apiKey}:`).toString('base64');

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json',
            'accept': 'application/json'
        },
        body: JSON.stringify({
            data: {
                type: 'tx-subscriptions',
                attributes: {
                    callback_url: webhookUrl,
                    address_filters: wallets
                }
            }
        })
    });

    return response.json();
}

/**
 * Audit wallet profitability (Global across all chains)
 */
export async function getWalletPnL(address, apiKey) {
    const url = `https://api.zerion.io/v1/wallets/${address}/pnl`;
    const auth = Buffer.from(`${apiKey}:`).toString('base64');

    try {
        const response = await fetch(url, {
            headers: { 'Authorization': `Basic ${auth}`, 'accept': 'application/json' }
        });
        const data = await response.json();
        return data.data?.attributes || null;
    } catch (e) {
        return null;
    }
}

/**
 * Get latest whale signals (BUYS and SELLS)
 */
export async function getWhaleSignals(address, apiKey) {
    const url = `https://api.zerion.io/v1/wallets/${address}/transactions/?page[size]=15`;
    const auth = Buffer.from(`${apiKey}:`).toString('base64');

    try {
        const response = await fetch(url, {
            headers: { 'Authorization': `Basic ${auth}`, 'accept': 'application/json' }
        });
        const data = await response.json();

        return data.data.filter(tx => {
            return tx.attributes.operation_type === 'trade' && tx.attributes.status === 'confirmed';
        }).map(tx => {
            const transfers = tx.relationships?.transfers?.data || [];
            const receivedToken = transfers.find(t => t.id.includes('receive'))?.id?.split('-')?.[1];
            const sentToken = transfers.find(t => t.id.includes('send'))?.id?.split('-')?.[1];

            const isSell = ['ethereum', 'base:0x833589fcd6edb6e08f4c7c32d4f71b54bda02913', 'base'].includes(receivedToken);

            return {
                hash: tx.attributes.hash,
                chainId: tx.relationships?.chain?.data?.id,
                timestamp: new Date(tx.attributes.mined_at).getTime(),
                side: isSell ? 'SELL' : 'BUY',
                tokenAddress: isSell ? sentToken : receivedToken,
                symbol: tx.attributes.transfers?.[0]?.symbol || 'UNKNOWN'
            };
        });
    } catch (e) {
        return [];
    }
}

/**
 * Check token security and liquidity (Anti-Scam)
 */
export async function getTokenSecurity(tokenAddress, chainId, apiKey) {
    // Zerion composite ID format is {chainId}:{address}
    const url = `https://api.zerion.io/v1/fungibles/${chainId}:${tokenAddress}`;
    const auth = Buffer.from(`${apiKey}:`).toString('base64');

    try {
        const response = await fetch(url, {
            headers: { 'Authorization': `Basic ${auth}`, 'accept': 'application/json' }
        });
        const data = await response.json();
        const attr = data.data?.attributes;

        return {
            isVerified: attr?.is_verified || false,
            marketCap: attr?.market_data?.market_cap || 0,
            volume24h: attr?.market_data?.volume_24h || 0
        };
    } catch (e) {
        return { isVerified: false, marketCap: 0, volume24h: 0 };
    }
}
