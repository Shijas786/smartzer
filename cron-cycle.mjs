import { createClient } from '@supabase/supabase-js';
import { postToFarcaster, fetchNotifications } from './lib/farcaster.mjs';
import { getWalletPnL } from './lib/zerion.mjs';
import { createWalletClient, http, parseEther } from 'viem';
import { base } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import 'dotenv/config';

// Supabase setup
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function logIntelligence(message) {
    console.log(`[${new Date().toLocaleTimeString()}] ${message}`);
    await supabase.from('logs').insert({ id: Date.now(), text: message });
}

async function updateMetric(key, value, numeric = true) {
    if (numeric) {
        await supabase.from('agent_metrics').upsert({ key, value_numeric: value, value_timestamp: Date.now() });
    } else {
        // Use value_text as a JSON storage
        await supabase.from('agent_metrics').upsert({ key, value_text: value, value_timestamp: Date.now() });
    }
}

function calculateEliteZerScore(pnl) {
    const baseScore = 50;
    const growth = Math.log10(Math.abs(pnl) + 1) * 10;
    const score = pnl >= 0 ? baseScore + growth : baseScore - growth;
    return Math.min(100, Math.max(0, score));
}

// Helper to fetch and cache trending tokens to save Zerion API credits
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
            await updateMetric('cached_trending_base', JSON.stringify(data), false);
            return true;
        }
    } catch (e) {
        console.error("Cache Error:", e);
    }
    return false;
}

async function runCycle() {
    console.log("🦞 SMARTZER CRON CYCLE STARTING (SURVIVAL MODE)...");

    const config = {
        zerionKey: process.env.ZERION_API_KEY,
        neynarKey: process.env.NEYNAR_API_KEY,
        fid: process.env.AGENT_FID,
        signerUuid: process.env.NEYNAR_SIGNER_UUID,
        privateKey: process.env.AGENT_PRIVATE_KEY
    };

    try {
        // Load state
        const { data: processed } = await supabase.from('processed_notifications').select('notification_id');
        const processedIds = processed?.map(p => p.notification_id) || [];

        const { data: metrics } = await supabase.from('agent_metrics').select('*');
        const lastPostMetric = metrics?.find(m => m.key === 'last_status_post');
        const lastStatusPost = lastPostMetric?.value_timestamp || 0;

        await logIntelligence("🔄 Survival Agent: Checking mentions and caching market data...");

        // --- PART 1: Cache Market Data (Prevents Dashboard from using API credits) ---
        await cacheTrendingTokens(config.zerionKey);

        // --- PART 2: Reply to Mentions ---
        if (config.fid && config.neynarKey) {
            const notifications = await fetchNotifications(config.neynarKey, config.fid);
            for (const n of notifications) {
                if (!processedIds.includes(n.hash)) {
                    if (n.address) {
                        const pnl = await getWalletPnL(n.address, config.zerionKey);
                        const pnlVal = pnl?.total?.value || 0;
                        const zerScore = calculateEliteZerScore(pnlVal);
                        const status = pnlVal > 1000 ? "🔱 ELITE WHALE" : (pnlVal > 0 ? "✅ PROFITABLE" : "⚠️ NEEDS GROWTH");

                        const reply = `@${n.author} Identity Resolved 🌍\n\n📊 Zer Score: ${zerScore.toFixed(1)}/100\n💎 PnL: $${pnlVal.toLocaleString()}\n⚖️ Ranking: ${status}`;
                        if (config.signerUuid) await postToFarcaster(config.neynarKey, config.signerUuid, reply, n.hash);
                        await logIntelligence(`✅ Replied to @${n.author}`);
                    }
                    await supabase.from('processed_notifications').insert({ notification_id: n.hash });
                }
            }
        }

        // --- PART 3: On-chain Heartbeat ---
        if (config.privateKey) {
            try {
                const account = privateKeyToAccount(config.privateKey);
                const walletClient = createWalletClient({ account, chain: base, transport: http() });
                const hash = await walletClient.sendTransaction({
                    to: account.address,
                    value: parseEther('0.000001')
                });
                await logIntelligence(`✅ Heartbeat Signal: ${hash.slice(0, 10)}...`);
            } catch (txErr) {
                console.error("Heartbeat failed:", txErr.message);
            }
        }

        // --- PART 4: Profile Cast (every 90 min) ---
        if (Date.now() - lastStatusPost > 1000 * 60 * 90) {
            const { data: topTraders } = await supabase.from('followed_traders').select('*').order('pnl', { ascending: false }).limit(2);
            if (topTraders?.length > 0 && config.signerUuid) {
                const alphaText = `🌍 SMARTZER LIVE ALPHA REPORT 🌍\n\nMonitoring top @base movers:\n1. @${topTraders[0]?.username}\n2. @${topTraders[1]?.username}\n\n🦞 Intelligence Engine ONLINE 🟦`;
                await postToFarcaster(config.neynarKey, config.signerUuid, alphaText);
                await updateMetric('last_status_post', Date.now());
            }
        }

        await updateMetric('last_check', Date.now());
        console.log("✅ SURVIVAL CYCLE COMPLETE.");
        process.exit(0);
    } catch (e) {
        console.error("Cron Error:", e);
        process.exit(1);
    }
}

runCycle();
