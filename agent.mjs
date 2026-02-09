import 'dotenv/config';
import { searchCasts, postToFarcaster, fetchNotifications } from './lib/farcaster.mjs';
import { getWalletPnL, getWhaleSignals } from './lib/zerion.mjs';
import { executeAutomatedTrade } from './lib/trade.mjs';
import { writeFileSync, readFileSync, existsSync } from 'fs';

const STATE_FILE = 'state.json';
const SIMULATION_MODE = true;        // ⚠️ Set to false for LIVE BOT AGENT TRADING

function getState() {
    if (existsSync(STATE_FILE)) return JSON.parse(readFileSync(STATE_FILE, 'utf8'));
    return { followedTraders: [], anonymousSuperTraders: [], replicatedTrades: [], agentPnL: 0, lastCheck: Date.now(), processedNotifications: [], logs: [] };
}

function addLog(state, message) {
    const log = { id: Date.now(), text: `[${new Date().toLocaleTimeString()}] ${message}` };
    state.logs = [log, ...(state.logs || [])].slice(0, 50);
}

function calculateEliteZerScore(pnl) {
    const base = 50;
    const growth = Math.log10(Math.abs(pnl) + 1) * 10;
    const score = pnl >= 0 ? base + growth : base - growth;
    return Math.min(100, Math.max(0, score));
}

function saveState(state) {
    writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

async function main() {
    console.log("🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦");
    console.log("🤖 SMARTZER WINNER PROTOCOL");
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

    let state = getState();
    const SCAN_INTERVAL = 1000 * 60 * 2;

    while (true) {
        try {
            addLog(state, "🔄 Initializing high-velocity intelligence scan...");

            // --- PART 1: Intelligence Scan & Verification ---
            if (config.fid && config.neynarKey) {
                addLog(state, "🔔 Checking Farcaster mentions for identity resolution...");
                const notifications = await fetchNotifications(config.neynarKey, config.fid);
                for (const n of notifications) {
                    if (!state.processedNotifications.includes(n.hash)) {
                        if (n.address) {
                            addLog(state, `⚖️ Auditing address ${n.address.slice(0, 6)}... via Zerion.`);
                            const pnl = await getWalletPnL(n.address, config.zerionKey);
                            const pnlVal = pnl?.total?.value || 0;
                            const zerScore = calculateEliteZerScore(pnlVal);
                            const status = pnlVal > 1000 ? "🔱 ELITE WHALE" : (pnlVal > 0 ? "✅ PROFITABLE" : "⚠️ NEEDS GROWTH");

                            const reply = `@${n.author} Identity Resolved via SmartZer Intelligence 🌍\n\n📊 Zer Score: ${zerScore.toFixed(1)}/100\n💎 Global PnL: $${pnlVal.toLocaleString()}\n⚖️ Ranking: ${status}`;
                            if (config.signerUuid) await postToFarcaster(config.neynarKey, config.signerUuid, reply, n.hash);
                            addLog(state, `✅ Replied to @${n.author} with Zer Score ${zerScore.toFixed(1)}`);
                        }
                        state.processedNotifications.push(n.hash);
                    }
                }
            }

            // --- PART 2: Whale Mirroring (The Decision Engine) ---
            if (state.anonymousSuperTraders) {
                for (let whale of state.anonymousSuperTraders) {
                    addLog(state, `🐋 Scanning Whale ${whale.label.slice(0, 10)} for new signals...`);
                    const signals = await getWhaleSignals(whale.address, config.zerionKey);
                    const newSignal = signals.find(s => (!whale.lastSeenTx || s.timestamp > whale.lastSeenTimestamp));

                    if (newSignal) {
                        addLog(state, `🎯 SIGNAL DETECTED: ${newSignal.side} on ${newSignal.chainId.toUpperCase()}`);
                        let txHash = "0x_sim_" + Math.random().toString(16).slice(2);

                        if (SIMULATION_MODE) {
                            addLog(state, `🧪 SIMULATING Mirror: Capturing ${newSignal.side} flow on ${newSignal.chainId}...`);
                        } else {
                            addLog(state, `🔥 LIVE EXECUTION: Settlement in progress on ${newSignal.chainId}...`);
                            const result = await executeAutomatedTrade(
                                newSignal.side,
                                newSignal.tokenAddress,
                                newSignal.chainId,
                                config.privateKey,
                                config.solanaPrivateKey
                            );
                            if (result.success) txHash = result.hash;
                        }

                        state.replicatedTrades.push({
                            trader: whale.label,
                            side: newSignal.side,
                            token: newSignal.tokenAddress || "Unknown",
                            chain: newSignal.chainId,
                            txHash: txHash,
                            timestamp: Date.now()
                        });
                        whale.lastSeenTx = newSignal.hash;
                        whale.lastSeenTimestamp = newSignal.timestamp;
                        addLog(state, `✅ Mirror Transaction Logged: ${txHash.slice(0, 10)}...`);
                    }
                }
            }

            // --- PART 3: Global Alpha Discovery ---
            addLog(state, "🕵️‍♂️ Scouting Farcaster for fresh volatility signals...");
            const keywords = ["Base profit", "Solana gems", "Whale move"];
            const castResults = await searchCasts(config.neynarKey, keywords[Math.floor(Math.random() * keywords.length)]);
            for (const cast of castResults) {
                if (cast.address && !state.followedTraders.find(t => t.address === cast.address)) {
                    const pnl = await getWalletPnL(cast.address, config.zerionKey);
                    if (pnl?.total?.value > 5000) {
                        addLog(state, `🌟 New Target Discovered: @${cast.author} (+$${pnl.total.value.toLocaleString()})`);
                        state.followedTraders.push({ username: cast.author, address: cast.address, pnl: pnl.total.value, timestamp: Date.now() });
                    }
                }
            }

            // --- PART 4: Daily Intelligence Ripple (Permissionless Marketing) ---
            // Post a summary once every 12 hours (approx every 360 cycles of 2 mins)
            if (!state.lastStatusPost || Date.now() - state.lastStatusPost > 1000 * 60 * 60 * 12) {
                addLog(state, "📢 Generating Global Alpha Ripple report...");
                const topTraders = state.followedTraders?.sort((a, b) => b.pnl - a.pnl).slice(0, 2);
                if (topTraders && topTraders.length > 0 && config.signerUuid) {
                    const alphaText = `🌍 SMARTZER WEEKLY ALPHA REPORT 🌍\n\nI've audited the top movers on @base and beyond. Currently monitoring:\n\n1. @${topTraders[0].username} (Zer Score: ${calculateEliteZerScore(topTraders[0].pnl).toFixed(0)})\n2. @${topTraders[1]?.username || 'Scanning'} (Zer Score: ${calculateEliteZerScore(topTraders[1]?.pnl || 0).toFixed(0)})\n\nGlobal Intelligence Engine is ONLINE. 🦞🟦`;
                    await postToFarcaster(config.neynarKey, config.signerUuid, alphaText);
                    state.lastStatusPost = Date.now();
                    addLog(state, "🚀 Alpha Ripple posted to Farcaster successfully.");
                }
            }

            state.lastCheck = Date.now();
            saveState(state);
            addLog(state, "💤 Intelligence cycle complete. Powering down until next block pulse.");
            console.log("💤 Cycle complete.");
        } catch (e) {
            console.error("❌ Loop Error:", e.message);
            addLog(state, `❌ SYSTEM ERROR: ${e.message}`);
        }
        await new Promise(r => setTimeout(r, SCAN_INTERVAL));
    }
}

main().catch(console.error);
