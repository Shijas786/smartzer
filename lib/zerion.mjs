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
        const attr = data.data?.attributes;
        if (!attr) return null;

        // Zerion returns realized and unrealized separately.
        return {
            total: {
                value: (attr.realized_gain || 0) + (attr.unrealized_gain || 0)
            }
        };
    } catch (e) {
        return null;
    }
}

/**
 * Get latest whale signals (BUYS and SELLS)
 */
export async function getWhaleSignals(address, apiKey) {
    // 🛡️ Optimized: Filter for major chains and sort by most recent
    const url = `https://api.zerion.io/v1/wallets/${address}/transactions/?page[size]=25&filter[chain_ids]=base,ethereum&sort=-mined_at`;
    const auth = Buffer.from(`${apiKey}:`).toString('base64');

    try {
        const response = await fetch(url, {
            headers: { 'Authorization': `Basic ${auth}`, 'accept': 'application/json' }
        });
        const data = await response.json();

        // Detect both 'trade' and specialized 'execute' operations that look like swaps
        return data.data.filter(tx => {
            const isTrade = tx.attributes.operation_type === 'trade';
            const isExecute = tx.attributes.operation_type === 'execute' && (tx.relationships?.dapp?.data?.id || '').includes('uniswap');
            return (isTrade || isExecute) && tx.attributes.status === 'confirmed';
        }).map(tx => {
            const transfers = tx.attributes.transfers || []; // Using attributes.transfers is more reliable
            const receivedToken = transfers.find(t => t.direction === 'in')?.fungible_info?.implementations?.[0]?.address;
            const sentToken = transfers.find(t => t.direction === 'out')?.fungible_info?.implementations?.[0]?.address;
            const symbol = transfers.find(t => t.direction === 'in')?.fungible_info?.symbol || 'UNKNOWN';

            // Heuristic for SELL: Receiving ETH or stable
            const isSell = ['ETH', 'USDC', 'USDT', 'DAI'].includes(symbol);

            return {
                hash: tx.attributes.hash,
                chainId: tx.relationships?.chain?.data?.id,
                timestamp: new Date(tx.attributes.mined_at).getTime(),
                side: isSell ? 'SELL' : 'BUY',
                tokenAddress: isSell ? sentToken : receivedToken,
                symbol: symbol
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
