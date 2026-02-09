async function updateDashboard() {
    try {
        const stateResponse = await fetch('/api/state');
        if (!stateResponse.ok) throw new Error(`API Error: ${stateResponse.status}`);
        const state = await stateResponse.json();

        // 1. Stats
        document.getElementById('trader-count').innerText = state.followedTraders?.length || 0;
        document.getElementById('trade-count').innerText = state.replicatedTrades?.length || 0;

        // 2. Alpha Pool Rendering
        const alphaList = document.getElementById('alpha-list');
        let alphaHTML = '';

        if (state.anonymousSuperTraders && state.anonymousSuperTraders.length > 0) {
            alphaHTML += `<div style="font-size: 0.65rem; color: var(--accent); margin-bottom: 0.75rem; font-weight: 700;">🐋 WHALE WALLETS</div>`;
            alphaHTML += state.anonymousSuperTraders.slice(0, 3).map(t => `
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.8rem;">
                    <span style="color: var(--text-primary)">${t.label}</span>
                    <span style="color: var(--success); font-weight: 600;">+$${t.pnl.toLocaleString()}</span>
                </div>
            `).join('');
        }

        if (state.followedTraders && state.followedTraders.length > 0) {
            alphaHTML += `<div style="font-size: 0.65rem; color: var(--secondary-accent); margin: 1rem 0 0.75rem 0; font-weight: 700;">👤 SOCIAL TRADERS</div>`;
            alphaHTML += state.followedTraders.slice(0, 5).map(t => `
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.8rem;">
                    <span style="color: var(--text-primary)">@${t.username}</span>
                    <span style="color: var(--success); font-weight: 600;">+$${t.pnl.toLocaleString()}</span>
                </div>
            `).join('');
        }

        if (alphaHTML === '') alphaHTML = '<div style="opacity:0.4; font-size: 0.8rem;">No active targets.</div>';
        alphaList.innerHTML = alphaHTML;

        // 3. Trade Stream Rendering (Modern Style)
        const tradeGrid = document.getElementById('replicated-trades');
        if (state.replicatedTrades && state.replicatedTrades.length > 0) {
            tradeGrid.innerHTML = state.replicatedTrades.sort((a, b) => b.timestamp - a.timestamp).map(t => {
                const isSell = t.side === 'SELL';
                const tagClass = isSell ? 'sell' : 'buy';
                return `
                <div class="stream-item">
                    <div class="item-top">
                        <span class="type-tag ${tagClass}">${t.side} DETECTED</span>
                        <span class="time-stamp">${new Date(t.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div class="item-content">
                        ${t.trader} moved <span>${t.token}</span> on <span>${t.chain || 'Base'}</span>
                    </div>
                </div>
                `;
            }).join('');
        } else {
            tradeGrid.innerHTML = '<div style="opacity:0.4; font-size: 0.85rem; padding: 1rem 0;">Awaiting first on-chain signal...</div>';
        }

        // 4. Intelligence Logs (Terminal Style)
        const logContainer = document.getElementById('thought-log');
        const momentumFeed = document.getElementById('replicated-trades');

        if (state.logs && state.logs.length > 0) {
            // Separate momentum logs from general thoughts
            const heatLogs = state.logs.filter(l => l.text.includes('🔥 Market Heat') || l.text.includes('🎯 SIGNAL'));
            const thoughtLogs = state.logs.filter(l => !l.text.includes('🔥 Market Heat'));

            logContainer.innerHTML = thoughtLogs.map(log => `
                <div class="log-line"><span>></span> ${log.text}</div>
            `).join('');

            // If No Copy Trades, show Momentum Heat in the main stream
            if (!state.replicatedTrades || state.replicatedTrades.length === 0) {
                momentumFeed.innerHTML = heatLogs.map(l => `
                    <div class="stream-item" style="border-left: 2px solid var(--accent)">
                        <div class="item-top">
                            <span class="type-tag" style="background: var(--accent); color: #fff;">MOMENTUM DETECTED</span>
                            <span class="time-stamp">${new Date(l.id).toLocaleTimeString()}</span>
                        </div>
                        <div class="item-content">${l.text.replace('🔥 Market Heat: ', '')}</div>
                    </div>
                `).join('') || '<div style="opacity:0.4; font-size: 0.85rem; padding: 1rem 0;">Awaiting first on-chain signal...</div>';
            }

            logContainer.scrollTop = 0;
        }

        // 5. System Status
        if (state.lastCheck > 0) {
            document.getElementById('zer-score').innerText = 'PROTOCOL ONLINE';
            document.getElementById('zer-score').closest('.status-badge').style.borderColor = 'rgba(0, 230, 118, 0.4)';
        }

        // 6. Market Volatility (Trending Assets)
        if (state.trending && state.trending.length > 0) {
            const marketWatch = document.getElementById('market-watch');
            marketWatch.innerHTML = state.trending.map(t => `
                <div class="metric-card" style="min-width: 200px; padding: 1rem; flex-shrink: 0;">
                    <div style="display:flex; align-items:center; gap: 0.5rem; margin-bottom: 0.5rem;">
                        <img src="${t.attributes.icon?.url || ''}" style="width:16px; height:16px; border-radius:50%; background: #222;">
                        <div class="metric-label" style="margin:0">${t.attributes.symbol}</div>
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:flex-end;">
                        <div style="font-size: 1rem; font-weight: 700;">$${t.attributes.market_data.price.toFixed(4)}</div>
                        <div style="font-size: 0.75rem; color: var(--success); font-weight: 600;">+${t.attributes.market_data.changes.percent_1d.toFixed(1)}%</div>
                    </div>
                </div>
            `).join('');
        }

    } catch (error) {
        console.error("HUD Sync Error:", error);
        const logContainer = document.getElementById('thought-log');
        if (logContainer) {
            logContainer.innerHTML += `<div class="log-line" style="color:var(--danger)"><span>></span> SYNC_ERROR: ${error.message}</div>`;
        }
    }
}

updateDashboard();
setInterval(updateDashboard, 10000);
