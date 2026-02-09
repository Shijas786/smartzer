import { supabase } from './lib/supabase.mjs';

async function check() {
    const { data } = await supabase.from('anonymous_super_traders').select('*');
    console.log('Current Whales:', JSON.stringify(data, null, 2));
}

check();
