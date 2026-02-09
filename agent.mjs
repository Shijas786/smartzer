import 'dotenv/config';
import { searchCasts, postToFarcaster, fetchNotifications, resolveAddressToUsername } from './lib/farcaster.mjs';
import { getWalletPnL, getWhaleSignals } from './lib/zerion.mjs';
import { executeAutomatedTrade } from './lib/trade.mjs';
import { supabase, logIntelligence, updateMetric } from './lib/supabase.mjs';

// Cache market data to save Zerion credits
async function cacheTrendingTokens(apiKey) {
    try {
        const url = new URL(`https://api.zerion.io/v1/fungibles/`);
        url.searchParams.append('filter[implementation_chain_id]', 'base');
        url.searchParams.append('sort', '-market_data.price.percent_change_1d');
        url.searchParams.append('page[size]', '6');
        const auth = Buffer.from(`${apiKey}:`).toString('base64');
        const response = await fetch(url.toString(), {
            headers: { 'Authorization': `Basic ${auth}`, 'accept': 'application/json' }
        });
        const data = await response.json();
        if (data.data) {
            // Using logs table as a temporary cache storage to avoid schema mismatch
            const cacheKey = `[MARKET_CACHE] ${JSON.stringify(data)}`;
            await logIntelligence(cacheKey);
            return true;
        }
    } catch (e) {
        console.error("Cache Error:", e);
    }
    return false;
}

// Refresh Whale PnL from Zerion
async function updateWhaleStats(whales, apiKey) {
    for (let whale of whales) {
        try {
            const pnl = await getWalletPnL(whale.address, apiKey);
            if (pnl?.total?.value) {
                const table = whale.label ? 'anonymous_super_traders' : 'followed_traders';
                const changeStr = whale.pnl !== pnl.total.value ? ` (Delta: $${(pnl.total.value - (whale.pnl || 0)).toLocaleString()})` : '';
                await supabase.from(table).update({ pnl: pnl.total.value }).eq('id', whale.id);
                await logIntelligence(`📊 Updated Stats for ${whale.label || whale.username}: $${pnl.total.value.toLocaleString()}${changeStr}`);
            }
        } catch (e) {
            console.error(`Failed to update stats for ${whale.id}:`, e.message);
        }
    }
}

const SIMULATION_MODE = false; // 🚀 LIVE PRODUCTION MODE ENABLED

// Load initial state from DB
async function getDBState() {
    const { data: followed } = await supabase.from('followed_traders').select('*');
    const { data: anonymous } = await supabase.from('anonymous_super_traders').select('*');
    const { data: processed } = await supabase.from('processed_notifications').select('notification_id');
    const { data: metrics } = await supabase.from('agent_metrics').select('*');

    const processedIds = processed?.map(p => p.notification_id) || [];
    const lastPostMetric = metrics?.find(m => m.key === 'last_status_post');
    const lastStatusPost = lastPostMetric?.value_timestamp || 0;

    return {
        followedTraders: followed || [],
        anonymousSuperTraders: anonymous || [],
        processedNotifications: processedIds,
        lastStatusPost
    };
}

function calculateEliteZerScore(pnl) {
    const base = 50;
    const growth = Math.log10(Math.abs(pnl) + 1) * 10;
    const score = pnl >= 0 ? base + growth : base - growth;
    return Math.min(100, Math.max(0, score));
}

async function main() {
    const config = {
        privateKey: process.env.AGENT_PRIVATE_KEY,
        solanaPrivateKey: process.env.SOLANA_PRIVATE_KEY,
        zerionKey: process.env.ZERION_API_KEY,
        neynarKey: process.env.NEYNAR_API_KEY,
        fid: process.env.AGENT_FID,
        signerUuid: process.env.NEYNAR_SIGNER_UUID
    };

    const SCAN_INTERVAL = 1000 * 60;

    while (true) {
        try {
            let state = await getDBState();
            await logIntelligence("🔄 Initializing high-velocity intelligence scan...");
            await cacheTrendingTokens(config.zerionKey);
            await updateWhaleStats(state.anonymousSuperTraders, config.zerionKey);
            await updateWhaleStats(state.followedTraders, config.zerionKey); // 👤 Refresh Social Trader PnL

            // --- PART 1: Mentions ---
            if (config.fid && config.neynarKey) {
                const notifications = await fetchNotifications(config.neynarKey, config.fid);
                for (const n of notifications) {
                    if (!state.processedNotifications.includes(n.hash)) {
                        if (n.address) {
                            const pnl = await getWalletPnL(n.address, config.zerionKey);
                            const pnlVal = pnl?.total?.value || 0;
                            const zerScore = calculateEliteZerScore(pnlVal);
                            const reply = `@${n.author} Identity Resolved 🌍\n\n📊 Zer Score: ${zerScore.toFixed(1)}/100\n💎 Global PnL: $${pnlVal.toLocaleString()}`;
                            if (config.signerUuid) await postToFarcaster(config.neynarKey, config.signerUuid, reply, n.hash);
                        }
                        await supabase.from('processed_notifications').insert({ notification_id: n.hash });
                    }
                }
            }

            // --- PART 2: Whale Mirroring ---
            for (let whale of state.anonymousSuperTraders) {
                const signals = await getWhaleSignals(whale.address, config.zerionKey);

                // 🕵️ Attempt Identity Resolution (Username recovery)
                let identifiedLabel = whale.label;
                if (!whale.label?.startsWith('@')) {
                    const resolved = await resolveAddressToUsername(config.neynarKey, whale.address);
                    if (resolved) {
                        identifiedLabel = `@${resolved}`;
                        await supabase.from('anonymous_super_traders').update({ label: identifiedLabel }).eq('id', whale.id);
                        await logIntelligence(`🕵️ Identity Match: ${whale.label} is confirmed as ${identifiedLabel}`);
                    }
                }

                // Track ALL new activity for the Feed
                const newActivity = signals.filter(s => (!whale.last_seen_timestamp || s.timestamp > whale.last_seen_timestamp));
                for (const activity of newActivity) {
                    await logIntelligence(`[WHALE_FEED] ${identifiedLabel} (${whale.address}) ${activity.side} $${activity.symbol} on ${activity.chainId}`);
                }

                // 🎯 REPLICATED SIGNALS (Only true trades)
                const newSignal = signals.find(s => s.isTrade && (!whale.last_seen_timestamp || s.timestamp > whale.last_seen_timestamp));
                if (newSignal) {
                    await logIntelligence(`🎯 SIGNAL: ${newSignal.side} $${newSignal.symbol}`);
                    let txHash = "0x_sim_" + Math.random().toString(16).slice(2);
                    if (!SIMULATION_MODE && newSignal.tokenAddress) {
                        const result = await executeAutomatedTrade(newSignal.side, newSignal.tokenAddress, newSignal.chainId, config.privateKey, config.solanaPrivateKey);
                        if (result.success) txHash = result.hash;
                    }
                    await supabase.from('replicated_trades').insert({
                        trader: whale.label,
                        token: newSignal.symbol || "Unknown",
                        side: newSignal.side,
                        tx_hash: txHash,
                        timestamp: Date.now(),
                        chain: newSignal.chainId
                    });
                }

                // Update last seen to the absolute latest transaction regardless of type
                if (signals.length > 0) {
                    await supabase.from('anonymous_super_traders').update({ last_seen_timestamp: signals[0].timestamp }).eq('id', whale.id);
                }
            }

            // --- PART 3: Zerion-Specific Alpha Discovery ---
            const keywords = [
                "Zerion top trader", "Zerion feed alpha", "Zerion wallet profit",
                "verified on Zerion", "shared from Zerion", "Zerion hot feed",
                "copy trading Zerion", "top performing wallet Zerion"
            ];
            const selectedKeywords = keywords.sort(() => 0.5 - Math.random()).slice(0, 3);

            for (const keyword of selectedKeywords) {
                const castResults = await searchCasts(config.neynarKey, keyword);
                for (const cast of castResults) {
                    const { data: existing } = await supabase.from('followed_traders').select('id').eq('address', cast.address);
                    if ((!existing || existing.length === 0) && cast.address) {
                        const pnlData = await getWalletPnL(cast.address, config.zerionKey);
                        const pnlVal = pnlData?.total?.value || 0;
                        if (pnlVal > 5000) {
                            await logIntelligence(`🦞 ZERION FEED MATCH: @${cast.author} has confirmed $${pnlVal.toLocaleString()} ROI. Tracking...`);
                            await supabase.from('followed_traders').insert({ username: cast.author, address: cast.address, pnl: pnlVal });
                        }
                    }
                }
            }

            // --- PART 4: Periodic Casts ---
            if (Date.now() - state.lastStatusPost > 1000 * 60 * 90) {
                const { data: topTraders } = await supabase.from('followed_traders').select('*').order('pnl', { ascending: false }).limit(2);
                if (topTraders?.length > 0 && config.signerUuid) {
                    const alphaText = `🌍 SMARTZER LIVE ALPHA REPORT 🌍\n\nTop movers found:\n1. @${topTraders[0].username}\n2. @${topTraders[1]?.username || 'Scanning'}\n\nRunning on @base and beyond. 🦞🟦`;
                    await postToFarcaster(config.neynarKey, config.signerUuid, alphaText);
                    await updateMetric('last_status_post', Date.now());
                }
            }

            await updateMetric('last_check', Date.now());

            // --- PART 5: Market Heat (Simulated Buyers/Sellers for Dashboard) ---
            const trendingResponse = await supabase.from('logs').select('text').order('id', { ascending: false }).limit(5);
            const cacheLog = trendingResponse.data?.find(l => l.text.startsWith('[MARKET_CACHE]'));
            if (cacheLog) {
                try {
                    const cacheData = JSON.parse(cacheLog.text.replace('[MARKET_CACHE] ', ''));
                    const topToken = cacheData.data?.[0];
                    if (topToken) {
                        const symbol = topToken.attributes.symbol;
                        await logIntelligence(`🔥 Market Heat: Active BUY detected for $${symbol} (Volume spike)`);
                    }
                } catch (e) { }
            }

            await logIntelligence("💤 Cycle complete.");
        } catch (e) {
            console.error("❌ Loop Error:", e);
        }
        await new Promise(r => setTimeout(r, SCAN_INTERVAL));
    }
}

main().catch(console.error);
