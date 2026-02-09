
import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { supabase } from './lib/supabase.mjs';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static('public'));

// Helper to fetch from Zerion
async function fetchZerion(path, params = {}) {
    const url = new URL(`https://api.zerion.io/v1${path}`);
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
    const auth = Buffer.from(`${process.env.ZERION_API_KEY}:`).toString('base64');
    const response = await fetch(url.toString(), {
        headers: {
            'Authorization': `Basic ${auth}`,
            'accept': 'application/json'
        }
    });
    return response.json();
}

// API Endpoints
app.get('/api/state', async (req, res) => {
    try {
        const { data: followed } = await supabase.from('followed_traders').select('*');
        const { data: anonymous } = await supabase.from('anonymous_super_traders').select('*');
        const { data: trades } = await supabase.from('replicated_trades').select('*');
        const { data: logs } = await supabase.from('logs').select('*').order('id', { ascending: false }).limit(50);
        const { data: metrics } = await supabase.from('agent_metrics').select('*');

        const agentPnL = metrics?.find(m => m.key === 'agent_pnl')?.value_numeric || 0;
        const lastCheck = metrics?.find(m => m.key === 'last_check')?.value_timestamp || 0;
        const { data: processed } = await supabase.from('processed_notifications').select('notification_id');

        res.json({
            followedTraders: followed || [],
            anonymousSuperTraders: anonymous || [],
            replicatedTrades: trades?.map(t => ({ ...t, txHash: t.tx_hash })) || [],
            logs: logs || [],
            agentPnL,
            lastCheck,
            processedNotifications: processed?.map(p => p.notification_id) || []
        });
    } catch (e) {
        console.error("Supabase Error:", e);
        res.status(500).json({ error: "Database Connection Failed" });
    }
});

app.get('/api/trending/:chainId', async (req, res) => {
    try {
        const data = await fetchZerion('/fungibles/', {
            'filter[implementation_chain_id]': req.params.chainId,
            'sort': '-market_data.price.percent_change_1d',
            'page[size]': 6
        });
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/portfolio/:address', async (req, res) => {
    try {
        const data = await fetchZerion(`/wallets/${req.params.address}/portfolio/`, {
            'filter[chain_ids]': 'base'
        });
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/signals', async (req, res) => {
    const { data: trades } = await supabase.from('replicated_trades').select('*').order('timestamp', { ascending: false }).limit(20);
    res.json({
        agent: "Lobster Smart Fund",
        network: "Base",
        version: "1.0.0",
        signals: trades?.map(t => ({
            timestamp: t.timestamp,
            type: "COPY_BUY",
            source: t.trader,
            token: t.token,
            tx: `https://basescan.org/tx/${t.tx_hash}`
        })) || []
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Agent Dashboard Server (Supabase Mode) running at http://localhost:${PORT}`);
});
