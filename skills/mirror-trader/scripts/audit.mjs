import { getWalletPnL } from '../../../lib/zerion.mjs';

/**
 * Audit a wallet address and calculate its Zer Score.
 */
export async function auditWallet(address, zerionKey) {
    const pnl = await getWalletPnL(address, zerionKey);
    const pnlVal = pnl?.total?.value || 0;

    // Calculate Elite Zer Score (50 base, +/- log growth)
    const baseScore = 50;
    const growth = Math.log10(Math.abs(pnlVal) + 1) * 10;
    const zerScore = pnlVal >= 0 ? baseScore + growth : baseScore - growth;

    const finalScore = Math.min(100, Math.max(0, zerScore));
    const status = pnlVal > 1000 ? "🔱 ELITE WHALE" : (pnlVal > 0 ? "✅ PROFITABLE" : "⚠️ NEEDS GROWTH");

    return {
        pnl: pnlVal,
        score: finalScore,
        status: status
    };
}
