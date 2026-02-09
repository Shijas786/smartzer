import { createWalletClient, http, createPublicClient, parseUnits, parseEther } from 'viem';
import { base, mainnet, arbitrum, polygon } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { Connection, Keypair, VersionedTransaction } from '@solana/web3.js';
import bs58 from 'bs58';
import fetch from 'node-fetch';

const CHAIN_MAP = {
    'base': {
        chain: base,
        router: '0x2626664c2603336E57B271c5C0b26F421741e481',
        weth: '0x4200000000000000000000000000000000000006',
        rpc: 'https://mainnet.base.org'
    },
    'ethereum': {
        chain: mainnet,
        router: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
        weth: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        rpc: 'https://eth.llamarpc.com'
    },
    'arbitrum': {
        chain: arbitrum,
        router: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
        weth: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
        rpc: 'https://arb1.vinere.xyz'
    },
    'polygon': {
        chain: polygon,
        router: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
        weth: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', // WMATIC
        rpc: 'https://polygon.llamarpc.com'
    }
};

const ROUTER_ABI = [
    {
        inputs: [
            {
                components: [
                    { name: 'tokenIn', type: 'address' },
                    { name: 'tokenOut', type: 'address' },
                    { name: 'fee', type: 'uint24' },
                    { name: 'recipient', type: 'address' },
                    { name: 'deadline', type: 'uint256' },
                    { name: 'amountIn', type: 'uint256' },
                    { name: 'amountOutMinimum', type: 'uint256' },
                    { name: 'sqrtPriceLimitX96', type: 'uint160' }
                ],
                name: 'params',
                type: 'tuple'
            }
        ],
        name: 'exactInputSingle',
        outputs: [{ name: 'amountOut', type: 'uint256' }],
        stateMutability: 'payable',
        type: 'function'
    }
];

const ERC20_ABI = [
    { name: 'approve', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ name: 'success', type: 'bool' }], type: 'function' },
    { name: 'balanceOf', inputs: [{ name: 'account', type: 'address' }], outputs: [{ name: 'balance', type: 'uint256' }], type: 'function' }
];

export async function executeAutomatedTrade(side, tokenAddress, chainId, privateKey, solPrivKey) {
    // --- SOLANA LOGIC ---
    if (chainId === 'solana') {
        if (!solPrivKey || solPrivKey.includes('PASTE')) return { success: false, error: 'No Solana Private Key' };
        const rpc = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
        const connection = new Connection(rpc);
        const wallet = Keypair.fromSecretKey(bs58.decode(solPrivKey));

        try {
            console.log(`🚀 Executing Solana ${side} via Jupiter...`);
            const isBuy = side === 'BUY';
            const inputMint = isBuy ? 'So11111111111111111111111111111111111111112' : tokenAddress; // SOL or Token
            const outputMint = isBuy ? tokenAddress : 'So11111111111111111111111111111111111111112';

            const quoteResponse = await fetch(`https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${isBuy ? 10000000 : 1000000}&slippageBps=50`).then(res => res.json());

            const { swapTransaction } = await fetch('https://quote-api.jup.ag/v6/swap', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    quoteResponse,
                    userPublicKey: wallet.publicKey.toString(),
                    wrapAndUnwrapSol: true
                })
            }).then(res => res.json());

            const swapTransactionBuf = Buffer.from(swapTransaction, 'base64');
            const transaction = VersionedTransaction.deserialize(swapTransactionBuf);
            transaction.sign([wallet]);

            const rawTransaction = transaction.serialize();
            const txid = await connection.sendRawTransaction(rawTransaction, {
                skipPreflight: true,
                maxRetries: 2
            });

            console.log(`✅ Solana Trade Hash: ${txid}`);
            return { success: true, hash: txid };
        } catch (e) {
            console.error('❌ Solana Trade Failed:', e.message);
            return { success: false, error: e.message };
        }
    }

    // --- EVM LOGIC ---
    const chainConfig = CHAIN_MAP[chainId];
    if (!chainConfig) return { success: false, error: `Chain ${chainId} not supported.` };
    if (!privateKey || privateKey === '0x...') return { success: false, error: 'No EVM Private Key' };

    const account = privateKeyToAccount(privateKey);
    const client = createWalletClient({ account, chain: chainConfig.chain, transport: http(chainConfig.rpc) });
    const publicClient = createPublicClient({ chain: chainConfig.chain, transport: http(chainConfig.rpc) });

    try {
        const isBuy = side === 'BUY';
        const tokenIn = isBuy ? chainConfig.weth : tokenAddress;
        const tokenOut = isBuy ? tokenAddress : chainConfig.weth;

        let amountIn = isBuy ? parseEther('0.001') : 0n;
        if (!isBuy) {
            amountIn = await publicClient.readContract({
                address: tokenAddress,
                abi: ERC20_ABI,
                functionName: 'balanceOf',
                args: [account.address]
            });
            if (amountIn === 0n) return { success: false, error: 'Zero balance to sell' };
        }

        if (!isBuy) {
            console.log(`🔓 Approving ${tokenAddress}...`);
            const hash = await client.writeContract({ address: tokenAddress, abi: ERC20_ABI, functionName: 'approve', args: [chainConfig.router, amountIn] });
            await publicClient.waitForTransactionReceipt({ hash });
        }

        const { request } = await publicClient.simulateContract({
            account,
            address: chainConfig.router,
            abi: ROUTER_ABI,
            functionName: 'exactInputSingle',
            args: [{ tokenIn, tokenOut, fee: 3000, recipient: account.address, deadline: BigInt(Math.floor(Date.now() / 1000) + 1200), amountIn, amountOutMinimum: 0n, sqrtPriceLimitX96: 0n }],
            value: isBuy ? amountIn : 0n
        });

        const hash = await client.writeContract(request);
        return { success: true, hash };
    } catch (error) {
        return { success: false, error: error.message };
    }
}
