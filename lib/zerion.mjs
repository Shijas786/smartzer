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
 * Added retry logic for throttling support
 */
export async function getWalletPnL(address, apiKey) {
    const url = `https://api.zerion.io/v1/wallets/${address}/pnl`;
    const auth = Buffer.from(`${apiKey}:`).toString('base64');
    let retries = 2;

    while (retries > 0) {
        try {
            const response = await fetch(url, {
                headers: { 'Authorization': `Basic ${auth}`, 'accept': 'application/json' }
            });
            const data = await response.json();

            if (data.errors?.[0]?.title === 'Too many requests') {
                await new Promise(r => setTimeout(r, 2000));
                retries--;
                continue;
            }

            const attr = data.data?.attributes;
            if (!attr) return null;

            return {
                total: {
                    value: (attr.realized_gain || 0) + (attr.unrealized_gain || 0)
                }
            };
        } catch (e) {
            return null;
        }
    }
    return null;
}

/**
 * Get latest whale signals (BUYS and SELLS)
 */
export async function getWhaleSignals(address, apiKey) {
    const url = `https://api.zerion.io/v1/wallets/${address}/transactions/?page[size]=25&filter[chain_ids]=base,ethereum&sort=-mined_at`;
    const auth = Buffer.from(`${apiKey}:`).toString('base64');

    try {
        const response = await fetch(url, {
            headers: { 'Authorization': `Basic ${auth}`, 'accept': 'application/json' }
        });
        const data = await response.json();

        return data.data.map(tx => {
            const op = tx.attributes.operation_type;
            const transfers = tx.attributes.transfers || [];

            // Determine side and token
            let side = op.toUpperCase();
            let symbol = 'UNKNOWN';
            let tokenAddress = null;

            if (transfers.length > 0) {
                const mainTransfer = transfers[0];
                symbol = mainTransfer.fungible_info?.symbol || 'UNKNOWN';
                tokenAddress = mainTransfer.fungible_info?.implementations?.[0]?.address;
                if (op === 'trade') {
                    const received = transfers.find(t => t.direction === 'in');
                    side = ['ETH', 'USDC', 'USDT', 'DAI'].includes(received?.fungible_info?.symbol) ? 'SELL' : 'BUY';
                    symbol = side === 'BUY' ? received?.fungible_info?.symbol : transfers.find(t => t.direction === 'out')?.fungible_info?.symbol;
                }
            }

            return {
                hash: tx.attributes.hash,
                chainId: tx.relationships?.chain?.data?.id,
                timestamp: new Date(tx.attributes.mined_at).getTime(),
                side: side,
                tokenAddress: tokenAddress,
                symbol: symbol,
                isTrade: op === 'trade' || (op === 'execute' && (tx.relationships?.dapp?.data?.id || '').includes('uniswap')),
                rawOp: op
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
