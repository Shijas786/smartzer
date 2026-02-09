
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
    throw new Error("❌ Missing SUPABASE_URL or SUPABASE_KEY in .env");
}

export const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Helper to log intelligence events
export async function logIntelligence(message) {
    const { error } = await supabase
        .from('logs')
        .insert({ id: Date.now(), text: message }); // ID is timestamp for sorting

    if (error) console.error("Supabase Log Error:", error);
}

// Helper to update metrics
export async function updateMetric(key, value) {
    const { error } = await supabase
        .from('agent_metrics')
        .upsert({ key, value_numeric: value, value_timestamp: Date.now() });

    if (error) console.error(`Supabase Metric Error (${key}):`, error);
}
