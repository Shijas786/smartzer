import { createWalletClient, http, publicActions, encodeDeployData } from 'viem';
import { base } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

// Minimal ERC20 ABI
const ABI = [
    {
        "inputs": [
            { "name": "name", "type": "string" },
            { "name": "symbol", "type": "string" },
            { "name": "initialSupply", "type": "uint256" }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    { "name": "name", "type": "function", "inputs": [], "outputs": [{ "name": "", "type": "string" }], "stateMutability": "view" },
    { "name": "symbol", "type": "function", "inputs": [], "outputs": [{ "name": "", "type": "string" }], "stateMutability": "view" },
    { "name": "totalSupply", "type": "function", "inputs": [], "outputs": [{ "name": "", "type": "uint256" }], "stateMutability": "view" },
    { "name": "balanceOf", "type": "function", "inputs": [{ "name": "account", "type": "address" }], "outputs": [{ "name": "", "type": "uint256" }], "stateMutability": "view" }
];

// Standard ERC20 Bytecode (Commonly used minimal implementation)
const BYTECODE = "0x608060405234801561001057600080fd5b5060405161092a38038061092a83398101604052805160a081019060e0915160c09251...[TRUNCATED_REAL_ERC20_BYTECODE]";

export async function deployMemeToken(name, symbol, privateKey, rpcUrl) {
    const account = privateKeyToAccount(privateKey);
    const client = createWalletClient({
        account,
        chain: base,
        transport: http(rpcUrl),
    }).extend(publicActions);

    console.log(`🚀 Deploying ${name} (${symbol}) on Base...`);

    // 1 Billion Supply
    const initialSupply = BigInt(1000000000) * BigInt(10 ** 18);

    try {
        // In a real hackathon, you'd have the actual artifact from a hardhat/foundry compile.
        // For this demonstration, we'll simulate the successful deployment if BYTECODE is valid,
        // OR we can provide a real bytecode here.

        // NOTE: Replace the string below with a real compiled bytecode from a local .sol file 
        // if you want this to run for real on mainnet.
        if (BYTECODE.includes("TRUNCATED")) {
            console.warn("⚠️ Bytecode is currently a placeholder. To deploy for real, compile a standard ERC20.sol and paste the bytecode here.");
            return {
                address: "0x" + "a".repeat(40),
                txHash: "0x" + "b".repeat(64),
                isMock: true
            };
        }

        const hash = await client.deployContract({
            abi: ABI,
            bytecode: BYTECODE,
            args: [name, symbol, initialSupply],
        });

        console.log(`⏳ Waiting for transaction: ${hash}`);
        const receipt = await client.waitForTransactionReceipt({ hash });

        console.log(`✅ Deployed at: ${receipt.contractAddress}`);
        return {
            address: receipt.contractAddress,
            txHash: hash,
            isMock: false
        };
    } catch (error) {
        console.error("❌ On-chain deployment failed:", error.message);
        throw error;
    }
}
