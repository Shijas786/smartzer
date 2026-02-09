import { supabase } from './lib/supabase.mjs';

async function seed() {
    const logs = [
        { text: '[WHALE_FEED] Mysterious Whale A (0x330424d59f4a24fdb6c6d0421da6e27a19d0701b) BUY $DEGEN on 8453', id: Date.now() },
        { text: '[WHALE_FEED] Deep Liquidity B (0x176f3d030e404b23906922631786207a98ee7ce3) SELL $WETH on 8453', id: Date.now() - 1000 },
        { text: '[WHALE_FEED] Mysterious Whale A (0x330424d59f4a24fdb6c6d0421da6e27a19d0701b) BUY $BRETT on 8453', id: Date.now() - 5000 }
    ];

    for (const log of logs) {
        await supabase.from('logs').insert(log);
    }
    console.log('Whale feed logs (with addresses) seeded');
}

seed();
