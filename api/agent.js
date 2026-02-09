import { createClient } from '@supabase/supabase-js';
import { postToFarcaster, fetchNotifications } from '../lib/farcaster.mjs';
import { getWalletPnL } from '../lib/zerion.mjs';
import { createWalletClient, http, parseEther } from 'viem';
import { base } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

// Supabase setup
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Helpers
async function logIntelligence(message) {
    console.log(message);
    await supabase.from('logs').insert({ id: Date.now(), text: message });
}

async function updateMetric(key, value) {
    await supabase.from('agent_metrics').upsert({ key, value_numeric: value, value_timestamp: Date.now() });
}

function calculateEliteZerScore(pnl) {
    const baseScore = 50;
    const growth = Math.log10(Math.abs(pnl) + 1) * 10;
    const score = pnl >= 0 ? baseScore + growth : baseScore - growth;
    return Math.min(100, Math.max(0, score));
}

export default async function handler(req, res) {
    console.log("🦞 SmartZer Agent Cycle Starting (Vercel Edition)...");

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

        await logIntelligence("🔄 Initializing high-velocity cloud intelligence scan...");

        // --- PART 1: Reply to Mentions ---
        if (config.fid && config.neynarKey) {
            const notifications = await fetchNotifications(config.neynarKey, config.fid);

            for (const n of notifications) {
                if (!processedIds.includes(n.hash)) {
                    if (n.address) {
                        const pnl = await getWalletPnL(n.address, config.zerionKey);
                        const pnlVal = pnl?.total?.value || 0;
                        const zerScore = calculateEliteZerScore(pnlVal);
                        const statusText = pnlVal > 1000 ? "🔱 ELITE WHALE" : (pnlVal > 0 ? "✅ PROFITABLE" : "⚠️ NEEDS GROWTH");

                        const reply = `@${n.author} Identity Resolved via SmartZer 🌍\n\n📊 Zer Score: ${zerScore.toFixed(1)}/100\n💎 PnL: $${pnlVal.toLocaleString()}\n⚖️ Ranking: ${statusText}`;
                        if (config.signerUuid) await postToFarcaster(config.neynarKey, config.signerUuid, reply, n.hash);
                    }
                    await supabase.from('processed_notifications').insert({ notification_id: n.hash });
                }
            }
        }

        // --- PART 2: On-chain Heartbeat (Real Transaction on Base) ---
        if (config.privateKey) {
            try {
                const account = privateKeyToAccount(config.privateKey);
                const walletClient = createWalletClient({
                    account,
                    chain: base,
                    transport: http()
                });

                await logIntelligence(`💙 Heartbeat: Sending persistent signal to Base...`);
                // Send 0.000001 ETH to self to prove activity
                const hash = await walletClient.sendTransaction({
                    to: account.address,
                    value: parseEther('0.000001')
                });
                await logIntelligence(`✅ On-chain Signal Confirmed: ${hash.slice(0, 10)}...`);
            } catch (txErr) {
                console.error("Heartbeat failed:", txErr.message);
            }
        }

        // --- PART 3: Profile Cast (15/day = 90 min) ---
        if (Date.now() - lastStatusPost > 1000 * 60 * 90) {
            const { data: topTraders } = await supabase.from('followed_traders').select('*').order('pnl', { ascending: false }).limit(2);
            if (topTraders?.length > 0 && config.signerUuid) {
                const alphaText = `🌍 SMARTZER LIVE ALPHA REPORT 🌍\n\nMonitoring top @base movers:\n1. @${topTraders[0]?.username || 'Scanning'}\n2. @${topTraders[1]?.username || 'Scanning'}\n\n🦞 Intelligence Engine ONLINE 🟦`;
                await postToFarcaster(config.neynarKey, config.signerUuid, alphaText);
                await updateMetric('last_status_post', Date.now());
            }
        }

        await updateMetric('last_check', Date.now());
        res.status(200).json({ success: true });
    } catch (e) {
        console.error("Agent Error:", e);
        res.status(500).json({ success: false, error: e.message });
    }
}
