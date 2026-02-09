import { supabase } from './lib/supabase.mjs';
import { getWhaleSignals } from './lib/zerion.mjs';
import 'dotenv/config';

async function debugWhales() {
    const { data: whales } = await supabase.from('anonymous_super_traders').select('*');
    const apiKey = process.env.ZERION_API_KEY;

    for (const whale of whales) {
        console.log(`\n🔍 Fetching for ${whale.label} (${whale.address})...`);
        const signals = await getWhaleSignals(whale.address, apiKey);
        console.log(`Found ${signals.length} signals.`);
        if (signals.length > 0) {
            console.log('Latest signal:', signals[0]);
        }
    }
}

debugWhales();
