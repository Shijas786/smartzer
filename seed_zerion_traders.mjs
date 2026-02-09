import { supabase } from './lib/supabase.mjs';

async function seedWhales() {
    const whales = [
        { label: 'Zerion Top: SmartMoney.eth', address: '0x25d49c53783457dede54d09c6480cd718991de97' },
        { label: 'Zerion Top: Deep Liquidity', address: '0x176f3d030e404b23906922631786207a98ee7ce3' },
        { label: 'Zerion Top: alpha.zerion.eth', address: '0x7e35cc31238618f0813958055663784111326123' }, // Placeholder for alpha wallet
        { label: 'Zerion Top: vace.eth', address: '0x46427d6d31481a979ca8474929841029c9cc7446' }
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
