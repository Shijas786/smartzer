import { postToFarcaster } from './lib/farcaster.mjs';
import 'dotenv/config';

async function testPost() {
    console.log("Testing Real Cast (Free Tier)...");
    const result = await postToFarcaster(
        process.env.NEYNAR_API_KEY,
        process.env.NEYNAR_SIGNER_UUID,
        "Create Agent. Verify Agent. 🦞 @smartzer"
    );

    if (result.mock) {
        console.log("⚠️ Used MOCK (API failed or fell back)");
    } else {
        console.log("✅ REAL CAST SUCCEEDED:", result.cast?.hash);
    }
}

testPost();
