import { fetchNotifications, postToFarcaster } from '../../../lib/farcaster.mjs';
import { auditWallet } from './audit.mjs';
import { executeMirrorAction } from './trade.mjs';
import { supabase } from '../../../lib/supabase.mjs';

/**
 * Main monitoring loop for the skill.
 */
export async function runMonitoringCycle(config) {
    console.log("🔍 Mirror Trader Skill: Starting Cycle...");

    // 1. Check Mentions
    if (config.fid && config.neynarKey) {
        const notifications = await fetchNotifications(config.neynarKey, config.fid);

        // Fetch processed IDs from Supabase
        const { data: processed } = await supabase.from('processed_notifications').select('notification_id');
        const processedIds = processed?.map(p => p.notification_id) || [];

        for (const n of notifications) {
            if (!processedIds.includes(n.hash)) {
                if (n.address) {
                    const result = await auditWallet(n.address, config.zerionKey);

                    const reply = `@${n.author} Identity Resolved via Mirror Trader Skill 🌍\n\n📊 Zer Score: ${result.score.toFixed(1)}/100\n💎 Global PnL: $${result.pnl.toLocaleString()}\n⚖️ Ranking: ${result.status}`;

                    if (config.signerUuid) {
                        await postToFarcaster(config.neynarKey, config.signerUuid, reply, n.hash);
                    }
                }
                // Mark as processed
                await supabase.from('processed_notifications').insert({ notification_id: n.hash });
            }
        }
    }

    // 2. Proof of Activity (Heartbeat)
    if (config.privateKey) {
        const heartbeat = await executeMirrorAction(config.privateKey, 'heartbeat');
        if (heartbeat.success) {
            console.log(`✅ Heartbeat Signal: ${heartbeat.hash}`);
        }
    }
}
