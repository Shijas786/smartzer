
import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { supabase } from './lib/supabase.mjs';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static('public'));

// API Endpoints
app.get('/api/state', async (req, res) => {
    try {
        const { data: followed } = await supabase.from('followed_traders').select('*');
        const { data: anonymous } = await supabase.from('anonymous_super_traders').select('*');
        const { data: trades } = await supabase.from('replicated_trades').select('*');
        const { data: allLogs } = await supabase.from('logs').select('*').order('id', { ascending: false }).limit(60);
        const { data: metrics } = await supabase.from('agent_metrics').select('*');

        const agentPnL = metrics?.find(m => m.key === 'agent_pnl')?.value_numeric || 0;
        const lastCheck = metrics?.find(m => m.key === 'last_check')?.value_timestamp || 0;

        // --- SURVIVAL MODE: Trending from Logs Cache ---
        const cacheLog = allLogs?.find(l => l.text.startsWith('[MARKET_CACHE]'));
        let trending = { data: [] };
        if (cacheLog) {
            try {
                const jsonStr = cacheLog.text.replace('[MARKET_CACHE] ', '');
                trending = JSON.parse(jsonStr);
            } catch (e) {
                console.error("Cache Parse Error:", e);
            }
        }

        // Filter out the cache log from the user-facing logs
        const visibleLogs = allLogs?.filter(l => !l.text.startsWith('[MARKET_CACHE]')).slice(0, 50);

        res.json({
            followedTraders: followed || [],
            anonymousSuperTraders: anonymous || [],
            replicatedTrades: trades?.map(t => ({ ...t, txHash: t.tx_hash })) || [],
            logs: visibleLogs || [],
            agentPnL,
            lastCheck,
            trending: trending.data || []
        });
    } catch (e) {
        console.error("Dashboard Error:", e);
        res.status(500).json({ error: "Sync Failed" });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 SmartZer Passive Dashboard running at http://localhost:${PORT}`);
    console.log(`🛡️ Survival Mode Enabled: Market cache powered by Logs.`);
});
