import { supabase } from './lib/supabase.mjs';

async function reset() {
    await supabase.from('anonymous_super_traders').update({ last_seen_timestamp: 0 });
    console.log('Whale sync reset');
}

reset();
