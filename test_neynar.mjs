import { NeynarAPIClient } from "@neynar/nodejs-sdk";
import 'dotenv/config';

async function test() {
    const client = new NeynarAPIClient(process.env.NEYNAR_API_KEY);
    try {
        const res = await client.fetchMentionAndReplyNotifications(Number(process.env.AGENT_FID), { limit: 1 });
        console.log("Notifications success!", res.notifications.length);
    } catch (e) {
        console.error("Notifications failed:", e.response?.status, e.response?.data);
    }
}

test();
