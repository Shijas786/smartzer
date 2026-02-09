import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function seedDB() {
    console.log("🌱 Seeding SmartZer Intelligence Database...");

    // 1. Followed Social Traders
    const followed = [
        { username: 'base_god', address: '0x55639b183451d8b67482817349bc7955c880824b', pnl: 12500 },
        { username: 'jessepollak', address: '0x3566120894Be57904DB2061e86976662760a9f0B', pnl: 45000 }
    ];

    // 2. Anonymous Whales
    const whales = [
        { label: 'Mysterious Whale A', address: '0x176f3d030e404b23906922631786207a98ee7ce3', pnl: 89000 },
        { label: 'Deep Liquidity B', address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', pnl: 156000 }
    ];

    console.log("📤 Inserting Followed Traders...");
    const { error: err1 } = await supabase.from('followed_traders').upsert(followed, { onConflict: 'address' });
    if (err1) console.error("Error seeding followed:", err1);

    console.log("📤 Inserting Anonymous Whales...");
    const { error: err2 } = await supabase.from('anonymous_super_traders').upsert(whales, { onConflict: 'address' });
    if (err2) console.error("Error seeding whales:", err2);

    console.log("✅ Database Seeded Successfully!");
    process.exit(0);
}

seedDB();
