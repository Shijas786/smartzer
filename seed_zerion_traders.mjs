import { supabase } from './lib/supabase.mjs';

async function seedWhales() {
    const whales = [
        { label: 'Zerion Top: SmartMoney.eth', address: '0x25d49c53783457dede54d09c6480cd718991de97' },
        { label: 'Zerion Top: Deep Liquidity', address: '0x176f3d030e404b23906922631786207a98ee7ce3' },
        { label: 'Zerion Top: alpha.zerion.eth', address: '0x7e35cc31238618f0813958055663784111326123' },
        { label: 'Zerion Top: vace.eth', address: '0x46427d6d31481a979ca8474929841029c9cc7446' },
        { label: 'Zerion Top: jesse.base.eth', address: '0x5bb57463f273574d6c4e09f7a755f130b4200ec0' },
        { label: 'Zerion Top: whale.base.eth', address: '0xdac17f958d2ee523a2206206994597c13d831ec7' },
        { label: 'Zerion Top: trader_alpha_1', address: '0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad' }
    ];

    for (const whale of whales) {
        const payload = {
            label: whale.label,
            address: whale.address.toLowerCase(),
            pnl: 0
        };

        const { error } = await supabase
            .from('anonymous_super_traders')
            .upsert(payload, { onConflict: 'address' });

        if (error) {
            console.error(`❌ Error adding ${whale.label}:`, error.message);
        } else {
            console.log(`✅ Upserted ${whale.label}`);
        }
    }
}

seedWhales();
