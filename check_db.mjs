import { supabase } from './lib/supabase.mjs';

async function check() {
    const { data: followed } = await supabase.from('followed_traders').select('*').order('pnl', { ascending: false });
    const { data: anonymous } = await supabase.from('anonymous_super_traders').select('*').order('pnl', { ascending: false });

    console.log("--- Followed Traders (Count: " + (followed?.length || 0) + ") ---");
    followed?.slice(0, 5).forEach(t => console.log(`@${t.username}: $${t.pnl.toLocaleString()}`));

    console.log("\n--- Anonymous Super Traders (Count: " + (anonymous?.length || 0) + ") ---");
    anonymous?.slice(0, 5).forEach(t => console.log(`${t.label}: $${t.pnl.toLocaleString()}`));

    console.log("\n--- Recent Logs ---");
    const { data: logs } = await supabase.from('logs').select('*').order('id', { ascending: false }).limit(10);
    logs.forEach(l => {
        const timestamp = isNaN(Number(l.id)) ? l.created_at : new Date(Number(l.id)).toLocaleTimeString();
        console.log(`[${timestamp}] ${l.text.slice(0, 100)}`);
    });
}

check();
