import { supabase } from './lib/supabase.mjs';

async function seed() {
    const logs = [
        { text: '[WHALE_FEED] Mysterious Whale A BUY $DEGEN on 8453', id: Date.now() },
        { text: '[WHALE_FEED] Deep Liquidity B SELL $WETH on 8453', id: Date.now() - 1000 },
        { text: '[WHALE_FEED] Mysterious Whale A BUY $BRETT on 8453', id: Date.now() - 5000 }
    ];

    for (const log of logs) {
        await supabase.from('logs').insert(log);
    }
    console.log('Whale feed logs seeded');
}

seed();
