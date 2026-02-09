import { supabase } from './lib/supabase.mjs';

async function seedWhales() {
    const whales = [
        { label: 'Deep Liquidity A', address: '0x176f3d030e404b23906922631786207a98ee7ce3' },
        { label: 'DeFi Oracle', address: '0xab5801a7d1266046111d45e5593f3f05e693f9c5' },
        { label: 'Base Whale Alpha', address: '0xc8a65f9737119e79435b62b0833b5c327242ba4e' },
        { label: 'Smart Money X', address: '0x66B67062409923D7d68378Eba723501f8cA87221' },
        { label: 'Arbitrage King', address: '0x1D22CeA368bB5EB1687E62F7413E24c0f4dc9855' }
    ];

    for (const whale of whales) {
        const { data: existing } = await supabase.from('anonymous_super_traders').select('id').eq('address', whale.address.toLowerCase());
        if (!existing || existing.length === 0) {
            await supabase.from('anonymous_super_traders').insert({
                label: whale.label,
                address: whale.address.toLowerCase(),
                pnl: 0,
                last_seen_timestamp: 0
            });
            console.log(`✅ Added ${whale.label}`);
        }
    }
}

seedWhales();
