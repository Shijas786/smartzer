---
name: Mirror Trader Skill
description: Autonomous on-chain intelligence and whale mirroring for the Base network.
author: SmartZer
version: 1.0.0
tags: ["base", "trading", "intelligence", "farcaster", "zerion"]
---

# 🦞 Mirror Trader Skill

This skill transforms your OpenClaw agent into a high-velocity on-chain intelligence engine. It monitors social signals, audits wallet performance, and replicates high-conviction trades from verified whales on the Base network.

## 🚀 Capabilities

-   **Social Identity Resolution**: Monitors @mentions on Farcaster/X to audit the sender's wallet PnL and assign a "Zer Score".
-   **Whale Tracking**: Continuously monitors a database of "Anonymous Super Traders" for new on-chain activity.
-   **Autonomous Mirroring**: Executes (or simulates) trades on Base based on verified whale signals.
-   **Alpha Reporting**: Generates periodic intelligence reports (Alpha Ripples) summarizing market sentiment.

## 🛠️ Integration

To use this skill, ensure the following environment variables are set in your `.env`:

```env
ZERION_API_KEY=your_zerion_key
NEYNAR_API_KEY=your_neynar_key
AGENT_FID=your_farcaster_fid
NEYNAR_SIGNER_UUID=your_signer_uuid
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
```

## 📂 Structure

-   `scripts/monitor.mjs`: The core loop that monitors social mentions and whale signals.
-   `scripts/audit.mjs`: Logic for fetching PnL and calculating the "Elite Zer Score".
-   `scripts/trade.mjs`: Interface for executing mirror trades on the Base network.

## 🤖 Instructions for AI Agent

When this skill is active, you should:
1.  Prioritize auditing wallet addresses mentioned in chat.
2.  Maintain the intelligence log in the Supabase backend.
3.  Proactively alert the user when a high-conviction whale signal is detected.
