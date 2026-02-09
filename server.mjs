import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { readFileSync, existsSync } from 'fs';

const app = express();
const PORT = process.env.PORT || 3000;
const STATE_FILE = 'state.json';

app.use(cors());
app.use(express.static('public'));

// Helper to fetch from Zerion
async function fetchZerion(path, params = {}) {
    const url = new URL(`https://api.zerion.io/v1${path}`);
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

    const auth = Buffer.from(`${process.env.ZERION_API_KEY}:`).toString('base64');

    const response = await fetch(url.toString(), {
        headers: {
            'Authorization': `Basic ${auth}`,
            'accept': 'application/json'
        }
    });

    return response.json();
}

// API Endpoints
app.get('/api/state', (req, res) => {
    if (existsSync(STATE_FILE)) {
        const state = JSON.parse(readFileSync(STATE_FILE, 'utf8'));
        res.json(state);
    } else {
        res.json({ deployments: [], lastUpdate: Date.now(), sentiment: "Unknown" });
    }
});

app.get('/api/trending/:chainId', async (req, res) => {
    try {
        const data = await fetchZerion('/fungibles/', {
            'filter[implementation_chain_id]': req.params.chainId,
            'sort': '-market_data.price.percent_change_1d',
            'page[size]': 6
        });
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/portfolio/:address', async (req, res) => {
    try {
        const data = await fetchZerion(`/wallets/${req.params.address}/portfolio/`, {
            'filter[chain_ids]': 'base'
        });
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/signals', (req, res) => {
    if (existsSync(STATE_FILE)) {
        const state = JSON.parse(readFileSync(STATE_FILE, 'utf8'));
        // Return a clean, machine-readable feed of replicated trades
        res.json({
            agent: "Lobster Smart Fund",
            network: "Base",
            version: "1.0.0",
            signals: state.replicatedTrades?.map(t => ({
                timestamp: t.timestamp,
                type: "COPY_BUY",
                source: t.trader,
                token: t.token,
                tx: `https://basescan.org/tx/${t.txHash}`
            })) || []
        });
    } else {
        res.json({ signals: [] });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Agent Dashboard Server running at http://localhost:${PORT}`);
});
