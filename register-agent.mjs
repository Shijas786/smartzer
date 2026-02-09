
// register-agent.js (ESM)
// ═══════════════════════════════════════════════════════════════
// GIVE THIS TO YOUR AGENT - It registers itself with zero gas
// ═══════════════════════════════════════════════════════════════
//
// SETUP - Set these two environment variables:
//
//   AGENT_PRIVATE_KEY  Your agent's wallet private key (0x...)
//   AGENT_NAME         Your agent's name (e.g. "Clawd")
//
// RUN:
//   AGENT_PRIVATE_KEY=0x... AGENT_NAME="My Agent" node register-agent.js
//
// ═══════════════════════════════════════════════════════════════

import 'dotenv/config'; // Added to ensure env vars are loaded
import { createWalletClient, http } from 'viem';
import { base } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { signAuthorization } from 'viem/experimental';

const DELEGATE = '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432'; // Official ERC-8004 Identity Registry on Base
const SPONSOR_URL = 'https://sponsored.howto8004.com/api/register';

// Fallback to local env if not passed in shell
const privateKey = process.env.AGENT_PRIVATE_KEY;
const agentName = process.env.AGENT_NAME || "SmartZer 🦞";

async function register() {
    if (!privateKey) {
        console.error('❌ Missing AGENT_PRIVATE_KEY in .env');
        process.exit(1);
    }

    const account = privateKeyToAccount(privateKey);
    console.log('');
    console.log('═══════════════════════════════════════════');
    console.log('  ERC-8004 Agent Registration (Sponsored)');
    console.log('═══════════════════════════════════════════');
    console.log('');
    console.log('🤖 Agent:', agentName);
    console.log('📍 Address:', account.address);
    console.log('');

    const client = createWalletClient({
        account,
        chain: base,
        transport: http(),
    });

    // Generate metadata URI from agent name
    const metadata = { name: agentName, address: account.address, description: "SmartZer: The ultimate on-chain intelligence engine." };
    const agentURI = 'data:application/json,' + encodeURIComponent(JSON.stringify(metadata));

    // Sign EIP-7702 authorization
    console.log('📝 Signing authorization (EIP-7702)...');
    const authorization = await signAuthorization(client, {
        contractAddress: DELEGATE,
    });

    // Sign registration intent
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600); // 1 hour
    console.log('📝 Signing intent...');
    const intentSignature = await client.signTypedData({
        domain: {
            name: 'AgentRegistrationDelegate',
            version: '1',
            chainId: 8453,
            verifyingContract: DELEGATE,
        },
        types: {
            Registration: [
                { name: 'agentURI', type: 'string' },
                { name: 'deadline', type: 'uint256' },
                { name: 'nonce', type: 'uint256' },
            ],
        },
        primaryType: 'Registration',
        message: { agentURI, deadline, nonce: 0n }, // Nonce 0 is correct for first interactions
    });

    // Submit to sponsor
    console.log('📤 Submitting to sponsor...');

    try {
        const response = await fetch(SPONSOR_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                agentAddress: account.address,
                agentURI,
                deadline: deadline.toString(),
                intentSignature,
                authorization: {
                    address: authorization.contractAddress,
                    chainId: Number(authorization.chainId),
                    nonce: Number(authorization.nonce),
                    r: authorization.r,
                    s: authorization.s,
                    yParity: authorization.yParity,
                },
            }),
        });

        const result = await response.json();

        console.log('');
        if (result.success) {
            console.log('═══════════════════════════════════════════');
            console.log('  🎉 SUCCESS - You are registered!');
            console.log('═══════════════════════════════════════════');
            console.log('  Transaction:', result.txHash);
            console.log('  Agent ID:', result.agentId);
            console.log('  View at: https://basescan.org/tx/' + result.txHash);
        } else {
            console.error('❌ Registration failed:', result.error);
            console.log('');
            console.log('⚠️  Note: Sponsored transactions can fail if the sponsor is out of gas or rejects the key.');
            console.log('    If this fails, fund the wallet and use the manual method.');
        }
    } catch (e) {
        console.error("❌ Network Error:", e.message);
    }
}

register().catch(console.error);
