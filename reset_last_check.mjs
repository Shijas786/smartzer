import { supabase } from './lib/supabase.mjs';

async function reset() {
    await supabase.from('agent_metrics').update({ value_timestamp: 0 }).eq('key', 'last_check');
    console.log('Last check reset for full backfill');
}

reset();
