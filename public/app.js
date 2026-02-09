async function updateDashboard() {
    try {
        const stateResponse = await fetch('/api/state');
        const state = await stateResponse.json();

        // 1. Fund Stats
        document.getElementById('trader-count').innerText = state.followedTraders?.length || 0;
        document.getElementById('trade-count').innerText = state.replicatedTrades?.length || 0;

        // 2. Verified Alpha List (Followed)
        const alphaList = document.getElementById('alpha-list');
        let alphaHTML = '';

        if (state.anonymousSuperTraders) {
            alphaHTML += `<div style="font-size: 0.7rem; color: var(--primary); margin-bottom: 0.5rem;">🐋 ANONYMOUS WHALES</div>`;
            alphaHTML += state.anonymousSuperTraders.slice(0, 3).map(t => `
                <div class="stat-row">
                    <span class="stat-label">${t.label}</span>
                    <span class="stat-value" style="color: var(--accent)">+$${t.pnl.toFixed(0)}</span>
                </div>
            `).join('');
        }

        if (state.followedTraders && state.followedTraders.length > 0) {
            alphaHTML += `<div style="font-size: 0.7rem; color: var(--secondary); margin: 0.5rem 0;">👤 SOCIAL TRADERS</div>`;
            alphaHTML += state.followedTraders.slice(0, 3).map(t => `
                <div class="stat-row">
                    <span class="stat-label">@${t.username}</span>
                    <span class="stat-value" style="color: var(--accent)">+$${t.pnl.toFixed(0)}</span>
                </div>
            `).join('');
        }
        alphaList.innerHTML = alphaHTML;

        // 3. Replicated Trades Stream
        const tradeGrid = document.getElementById('replicated-trades');
        if (state.replicatedTrades && state.replicatedTrades.length > 0) {
            tradeGrid.innerHTML = state.replicatedTrades.sort((a, b) => b.timestamp - a.timestamp).map(t => {
                const isSell = t.side === 'SELL';
                const color = isSell ? '#FF5252' : '#2962FF'; // Red (Sell) vs Zerion Blue (Buy)
                return `
                <div class="stream-item" style="border-left-color: ${color}">
                    <div style="display:flex; justify-content:space-between;">
                        <span style="color:${color}; font-weight:bold;">${t.side} DETECTED</span>
                        <span style="opacity:0.5; font-size:0.7rem;">${new Date(t.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div style="margin-top:4px;">
                        TARGET: <span style="color:#fff">${t.trader}</span><br>
                        ASSET: <span style="color:#fff">${t.token}</span><br>
                        CHAIN: <span style="color:var(--secondary-accent)">${t.chain || 'Global'}</span>
                    </div>
                </div>
                `;
            }).join('');
        }

        // 4. Ticker Tape Logic (Simplified)
        async function updateTicker() {
            // We just grab raw data and put it in the footer
            // This is a simplified "sci-fi" approach
        }


        // 5. Intelligence Log Rendering
        const logContainer = document.getElementById('thought-log');
        if (state.logs && state.logs.length > 0) {
            logContainer.innerHTML = state.logs.map(log => `<div class="log-entry">${log.text}</div>`).join('');
            logContainer.scrollTop = 0;
        }

        // 6. Dynamic Score update
        if (state.replicatedTrades && state.replicatedTrades.length > 0) {
            document.getElementById('zer-score').innerText = '99.9 PROTOCOL CALIBRATED';
            document.getElementById('zer-score').style.color = 'var(--accent)';
        }

    } catch (error) {
        console.error("Dashboard update failed:", error);
    }
}

updateDashboard();
setInterval(updateDashboard, 15000);
