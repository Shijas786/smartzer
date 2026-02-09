import 'dotenv/config';

async function getProfile() {
    const apiKey = process.env.NEYNAR_API_KEY;
    const fid = process.env.AGENT_FID;

    const url = `https://api.neynar.com/v2/farcaster/user/bulk?fids=${fid}`;
    const res = await fetch(url, {
        headers: { 'api_key': apiKey }
    });
    const data = await res.json();
    if (data.users && data.users.length > 0) {
        const user = data.users[0];
        console.log(`✅ Farcaster Profile Found!`);
        console.log(`Username: @${user.username}`);
        console.log(`Display Name: ${user.display_name}`);
        console.log(`Profile URL: https://warpcast.com/${user.username}`);
    } else {
        console.error('❌ User not found');
    }
}

getProfile();
