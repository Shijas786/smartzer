import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
    try {
        const { data: followed } = await supabase.from('followed_traders').select('*');
        const { data: anonymous } = await supabase.from('anonymous_super_traders').select('*');
        const { data: trades } = await supabase.from('replicated_trades').select('*');
        const { data: logs } = await supabase.from('logs').select('*').order('id', { ascending: false }).limit(50);
        const { data: metrics } = await supabase.from('agent_metrics').select('*');

        const agentPnL = metrics?.find(m => m.key === 'agent_pnl')?.value_numeric || 0;
        const lastCheck = metrics?.find(m => m.key === 'last_check')?.value_timestamp || 0;

        res.status(200).json({
            followedTraders: followed || [],
            anonymousSuperTraders: anonymous || [],
            replicatedTrades: trades?.map(t => ({ ...t, txHash: t.tx_hash })) || [],
            logs: logs || [],
            agentPnL,
            lastCheck
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}
