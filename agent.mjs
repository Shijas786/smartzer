import 'dotenv/config';
import { searchCasts, postToFarcaster, fetchNotifications } from './lib/farcaster.mjs';
import { getWalletPnL, getWhaleSignals } from './lib/zerion.mjs';
import { executeAutomatedTrade } from './lib/trade.mjs';
import { supabase, logIntelligence, updateMetric } from './lib/supabase.mjs';

const SIMULATION_MODE = false; // 🚀 LIVE PRODUCTION MODE ENABLED

// Load initial state from DB
async function getDBState() {
    const { data: followed } = await supabase.from('followed_traders').select('*');
    const { data: anonymous } = await supabase.from('anonymous_super_traders').select('*');
    const { data: processed } = await supabase.from('processed_notifications').select('notification_id');
    const { data: metrics } = await supabase.from('agent_metrics').select('*');

    // Convert array of objects to simple array of IDs for processed checks
    const processedIds = processed?.map(p => p.notification_id) || [];

    // Get last status post time
    const lastPostMetric = metrics?.find(m => m.key === 'last_status_post');
    const lastStatusPost = lastPostMetric?.value_timestamp || 0;

    return {
        followedTraders: followed || [],
        anonymousSuperTraders: anonymous || [],
        processedNotifications: processedIds,
        lastStatusPost
    };
}

// Logic Helpers
function calculateEliteZerScore(pnl) {
    const base = 50;
    const growth = Math.log10(Math.abs(pnl) + 1) * 10;
    const score = pnl >= 0 ? base + growth : base - growth;
    return Math.min(100, Math.max(0, score));
}

async function main() {
    console.log("🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦");
    console.log("🤖 SMARTZER WINNER PROTOCOL (CLOUD EDITION)");
    console.log("🌍 Mode: Proof of Intelligence");
    console.log("🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦");

    const config = {
        privateKey: process.env.AGENT_PRIVATE_KEY,
        solanaPrivateKey: process.env.SOLANA_PRIVATE_KEY,
        rpcUrl: process.env.BASE_RPC_URL || "https://mainnet.base.org",
        zerionKey: process.env.ZERION_API_KEY,
        neynarKey: process.env.NEYNAR_API_KEY,
        fid: process.env.AGENT_FID,
        signerUuid: process.env.NEYNAR_SIGNER_UUID
    };

    const SCAN_INTERVAL = 1000 * 60 * 2; // 2 minutes

    while (true) {
        try {
            // Load fresh state every loop to stay synced with other instances (if any)
            let state = await getDBState();

            await logIntelligence("🔄 Initializing high-velocity intelligence scan...");

            // --- PART 1: Intelligence Scan & Verification ---
            if (config.fid && config.neynarKey) {
                await logIntelligence("🔔 Checking Farcaster mentions for identity resolution...");
                const notifications = await fetchNotifications(config.neynarKey, config.fid);

                for (const n of notifications) {
                    if (!state.processedNotifications.includes(n.hash)) {
                        if (n.address) {
                            await logIntelligence(`⚖️ Auditing address ${n.address.slice(0, 6)}... via Zerion.`);
                            const pnl = await getWalletPnL(n.address, config.zerionKey);
                            const pnlVal = pnl?.total?.value || 0;
                            const zerScore = calculateEliteZerScore(pnlVal);
                            const status = pnlVal > 1000 ? "🔱 ELITE WHALE" : (pnlVal > 0 ? "✅ PROFITABLE" : "⚠️ NEEDS GROWTH");

                            // Reply to ALL mentions (no filter)
                            const reply = `@${n.author} Identity Resolved via SmartZer Intelligence 🌍\n\n📊 Zer Score: ${zerScore.toFixed(1)}/100\n💎 Global PnL: $${pnlVal.toLocaleString()}\n⚖️ Ranking: ${status}`;
                            if (config.signerUuid) await postToFarcaster(config.neynarKey, config.signerUuid, reply, n.hash);
                            await logIntelligence(`✅ Replied to @${n.author} with Zer Score ${zerScore.toFixed(1)}`);
                        }
                        // Mark processed in DB
                        await supabase.from('processed_notifications').insert({ notification_id: n.hash });
                        state.processedNotifications.push(n.hash); // Update local state for this loop
                    }
                }
            }

            // --- PART 2: Whale Mirroring ---
            if (state.anonymousSuperTraders.length > 0) {
                for (let whale of state.anonymousSuperTraders) {
                    await logIntelligence(`🐋 Scanning Whale ${whale.label.slice(0, 10)} for new signals...`);
                    const signals = await getWhaleSignals(whale.address, config.zerionKey);

                    // Deduplication Logic using stored last_seen_tx and timestamp
                    const newSignal = signals.find(s => (!whale.last_seen_timestamp || s.timestamp > whale.last_seen_timestamp));

                    if (newSignal) {
                        await logIntelligence(`🎯 SIGNAL DETECTED: ${newSignal.side} on ${newSignal.chainId.toUpperCase()}`);
                        let txHash = "0x_sim_" + Math.random().toString(16).slice(2);

                        if (!SIMULATION_MODE) {
                            await logIntelligence(`🔥 LIVE EXECUTION: Settlement in progress...`);
                            const result = await executeAutomatedTrade(newSignal.side, newSignal.tokenAddress, newSignal.chainId, config.privateKey, config.solanaPrivateKey);
                            if (result.success) txHash = result.hash;
                        } else {
                            await logIntelligence(`🧪 SIMULATING Mirror...`);
                        }

                        // Store Trade
                        await supabase.from('replicated_trades').insert({
                            trader: whale.label,
                            token: newSignal.tokenAddress || "Unknown",
                            side: newSignal.side || "BUY",
                            tx_hash: txHash,
                            timestamp: Date.now(),
                            chain: newSignal.chainId
                        });

                        // Update Whale Last Seen State in DB
                        await supabase.from('anonymous_super_traders')
                            .update({
                                last_seen_tx: newSignal.hash,
                                last_seen_timestamp: newSignal.timestamp
                            })
                            .eq('id', whale.id);

                        await logIntelligence(`✅ Mirror Transaction Logged: ${txHash.slice(0, 10)}...`);
                    }
                }
            }

            // --- PART 3: Global Alpha Discovery ---
            await logIntelligence("🕵️‍♂️ Scouting Farcaster for fresh volatility signals...");
            const keywords = ["Base profit", "Solana gems", "Whale move"];
            const castResults = await searchCasts(config.neynarKey, keywords[Math.floor(Math.random() * keywords.length)]);

            for (const cast of castResults) {
                // Check DB for duplicates
                const { data: existing } = await supabase.from('followed_traders').select('id').eq('address', cast.address);
                if (!existing || existing.length === 0) {
                    if (cast.address) {
                        const pnl = await getWalletPnL(cast.address, config.zerionKey);
                        if (pnl?.total?.value > 5000) {
                            await logIntelligence(`🌟 New Target Discovered: @${cast.author} (+$${pnl.total.value.toLocaleString()})`);
                            await supabase.from('followed_traders').insert({
                                username: cast.author,
                                address: cast.address,
                                pnl: pnl.total.value
                            });
                        }
                    }
                }
            }

            // --- PART 4: Profile Casts (15 per 24hrs = ~90 min intervals) ---
            if (Date.now() - state.lastStatusPost > 1000 * 60 * 90) {
                await logIntelligence("📢 Generating Global Alpha Ripple report...");
                // Re-fetch top traders
                const { data: topTraders } = await supabase.from('followed_traders').select('*').order('pnl', { ascending: false }).limit(2);

                if (topTraders && topTraders.length > 0 && config.signerUuid) {
                    const alphaText = `🌍 SMARTZER LIVE ALPHA REPORT 🌍\n\nI've audited the top movers on @base and beyond. Currently monitoring:\n\n1. @${topTraders[0].username}\n2. @${topTraders[1]?.username || 'Scanning'}\n\nGlobal Intelligence Engine is ONLINE. 🦞🟦`;
                    await postToFarcaster(config.neynarKey, config.signerUuid, alphaText);

                    // Update timestamp in DB
                    await updateMetric('last_status_post', Date.now());
                    await logIntelligence("🚀 Alpha Ripple posted to Farcaster successfully.");
                }
            }

            await updateMetric('last_check', Date.now());
            await logIntelligence("💤 Intelligence cycle complete. Powering down until next block pulse.");
        } catch (e) {
            console.error("❌ Loop Error:", e);
            await logIntelligence(`❌ SYSTEM ERROR: ${e.message}`);
        }
        await new Promise(r => setTimeout(r, SCAN_INTERVAL));
    }
}

main().catch(console.error);
