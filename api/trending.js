import fetch from 'node-fetch';

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

export default async function handler(req, res) {
    const { chainId } = req.query;
    try {
        const data = await fetchZerion('/fungibles/', {
            'filter[implementation_chain_id]': chainId || 'base',
            'sort': '-market_data.price.percent_change_1d',
            'page[size]': 6
        });
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
