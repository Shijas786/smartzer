import { supabase } from './lib/supabase.mjs';

async function seed() {
    const seeds = [
        { username: 'synth_alpha', address: '0x330424d59f4a24fdb6c6d0421da6e27a19d0701b' },
        { username: 'base_whale_x', address: '0x176f3d030e404b23906922631786207a98ee7ce3' },
        { username: 'onchain_wizard', address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045' }
    ];

    for (const s of seeds) {
        const { error } = await supabase.from('followed_traders').upsert(s, { onConflict: 'address' });
        if (error) console.error(`Error seeding ${s.username}:`, error.message);
        else console.log(`Seeded ${s.username}`);
    }
}

seed();
