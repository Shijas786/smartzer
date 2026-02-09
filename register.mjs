import 'dotenv/config';
import { createWalletClient, http, encodeFunctionData, createPublicClient } from 'viem';
import { base } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

// Official ERC-8004 Identity Registry on Base
const REGISTRY = '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432';

// ABI for the register function (ERC-8004 standard)
const abi = [
    {
        inputs: [{ internalType: "string", name: "tokenURI", type: "string" }],
        name: "register",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "nonpayable",
        type: "function"
    }
];

async function register() {
    console.log('');
    console.log('═══════════════════════════════════════════');
    console.log('  ERC-8004 Agent Registration (Direct)');
    console.log('  Chain: Base Mainnet');
    console.log('═══════════════════════════════════════════');
    console.log('');

    if (!process.env.AGENT_PRIVATE_KEY) {
        console.error("❌ No Private Key found in .env. Set AGENT_PRIVATE_KEY.");
        process.exit(1);
    }

    const account = privateKeyToAccount(process.env.AGENT_PRIVATE_KEY);
    const agentName = process.env.AGENT_NAME || "SmartZer 🦞";

    console.log('🤖 Agent:', agentName);
    console.log('📍 Address:', account.address);
    console.log('📋 Registry:', REGISTRY);
    console.log('');

    const client = createWalletClient({
        account,
        chain: base,
        transport: http('https://mainnet.base.org')
    });

    const publicClient = createPublicClient({
        chain: base,
        transport: http('https://mainnet.base.org')
    });

    // Build metadata
    const metadata = {
        name: agentName,
        description: process.env.AGENT_DESCRIPTION || "SmartZer: On-chain intelligence engine.",
        address: account.address,
        url: process.env.AGENT_URL || "https://github.com/Shijas786/smartzer"
    };

    const tokenURI = 'data:application/json,' + encodeURIComponent(JSON.stringify(metadata));

    console.log('💰 Checking balance...');
    const balance = await publicClient.getBalance({ address: account.address });
    console.log('   Balance:', (Number(balance) / 1e18).toFixed(6), 'ETH');

    if (balance < 100000n) { // Need at least some gas
        console.log('');
        console.error('❌ Insufficient funds! Please send Base ETH to:');
        console.log('   ' + account.address);
        console.log('');
        process.exit(1);
    }

    console.log('📝 Sending registration transaction...');

    try {
        const hash = await client.writeContract({
            address: REGISTRY,
            abi,
            functionName: 'register',
            args: [tokenURI]
        });

        console.log('');
        console.log('═══════════════════════════════════════════');
        console.log('  🎉 Transaction Sent!');
        console.log('═══════════════════════════════════════════');
        console.log('  Tx Hash:', hash);
        console.log('  View: https://basescan.org/tx/' + hash);
        console.log('');
        console.log('⏳ Waiting for confirmation...');

        const receipt = await publicClient.waitForTransactionReceipt({ hash });

        if (receipt.status === 'success') {
            console.log('');
            console.log('═══════════════════════════════════════════');
            console.log('  🎉 SUCCESS - You are registered!');
            console.log('═══════════════════════════════════════════');
            console.log('  Block:', receipt.blockNumber);
            console.log('');
        } else {
            console.error('❌ Transaction reverted.');
        }
    } catch (e) {
        console.error("❌ Transaction Failed:", e.message);
    }
}

register().catch(console.error);
