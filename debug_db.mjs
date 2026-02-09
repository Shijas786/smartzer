import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function debugDB() {
    console.log("🔍 Checking Supabase Data Integrity...");
    console.log("---------------------------------------");

    // 1. Logs
    const { data: logs } = await supabase.from('logs').select('*').order('id', { ascending: false }).limit(5);
    console.log(`📝 Recent Logs (${logs?.length || 0}):`);
    logs?.forEach(l => console.log(`   - [${new Date(l.id).toLocaleTimeString()}] ${l.text}`));

    // 2. Metrics
    const { data: metrics } = await supabase.from('agent_metrics').select('*');
    console.log(`\n📊 Metrics (${metrics?.length || 0}):`);
    metrics?.forEach(m => {
        const val = m.value_numeric !== null ? m.value_numeric : new Date(m.value_timestamp).toLocaleString();
        console.log(`   - ${m.key}: ${val}`);
    });

    // 3. Traders
    const { data: followed } = await supabase.from('followed_traders').select('username, pnl');
    const { data: anonymous } = await supabase.from('anonymous_super_traders').select('label, pnl');
    console.log(`\n👤 Followed Traders: ${followed?.length || 0}`);
    console.log(`🐋 Anonymous Whales: ${anonymous?.length || 0}`);

    // 4. Notifications
    const { data: processed } = await supabase.from('processed_notifications').select('count');
    console.log(`\n🔔 Processed Notifications: ${processed?.[0]?.count || processed?.length || 0}`);

    process.exit(0);
}

debugDB();
