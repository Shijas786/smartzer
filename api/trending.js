import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
    try {
        // --- SURVIVAL MODE: Read from Cache instead of Zerion API ---
        const { data, error } = await supabase
            .from('agent_metrics')
            .select('value_text')
            .eq('key', 'cached_trending_base')
            .single();

        if (error || !data?.value_text) {
            return res.status(200).json({ data: [], note: "Cache Empty. Awaiting Agent Sync." });
        }

        const cachedData = JSON.parse(data.value_text);
        res.status(200).json(cachedData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
