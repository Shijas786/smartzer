import 'dotenv/config';

async function testChannelFeed() {
    const apiKey = process.env.NEYNAR_API_KEY;
    const url = `https://api.neynar.com/v2/farcaster/feed?feed_type=filter&filter_type=channel_id&channel_ids=base&limit=5`;

    try {
        const response = await fetch(url, {
            headers: { 'api_key': apiKey, 'accept': 'application/json' }
        });

        if (!response.ok) {
            console.error("Feed Error:", response.status, await response.text());
        } else {
            const data = await response.json();
            console.log("Channel Feed Success! Found:", data.casts?.length);
            if (data.casts?.length > 0) console.log(data.casts[0].text);
        }
    } catch (e) {
        console.error("Fetch failed:", e.message);
    }
}

testChannelFeed();
