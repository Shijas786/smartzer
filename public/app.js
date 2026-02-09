async function updateDashboard() {
    try {
        const stateResponse = await fetch('/api/state');
        if (!stateResponse.ok) {
            throw new Error(`API Error: ${stateResponse.status}`);
        }
        const state = await stateResponse.json();

        // 1. Fund Stats
        document.getElementById('trader-count').innerText = state.followedTraders?.length || 0;
        document.getElementById('trade-count').innerText = state.replicatedTrades?.length || 0;

        // 2. Alpha Pool
        const alphaList = document.getElementById('alpha-list');
        let alphaHTML = '';

        if (state.anonymousSuperTraders && state.anonymousSuperTraders.length > 0) {
            alphaHTML += `<div style="font-size: 0.7rem; color: var(--accent-color); margin-bottom: 0.5rem; border-bottom: 1px solid #222;">🐋 WHALES</div>`;
            alphaHTML += state.anonymousSuperTraders.slice(0, 3).map(t => `
                <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                    <span style="opacity:0.7">${t.label}</span>
                    <span style="color:var(--secondary-accent)">+$${t.pnl.toFixed(0)}</span>
                </div>
            `).join('');
        }

        if (state.followedTraders && state.followedTraders.length > 0) {
            alphaHTML += `<div style="font-size: 0.7rem; color: var(--secondary-accent); margin: 0.5rem 0; border-bottom: 1px solid #222;">👤 SOCIALS</div>`;
            alphaHTML += state.followedTraders.slice(0, 3).map(t => `
                <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                    <span style="opacity:0.7">@${t.username}</span>
                    <span style="color:var(--secondary-accent)">+$${t.pnl.toFixed(0)}</span>
                </div>
            `).join('');
        }

        if (alphaHTML === '') {
            alphaHTML = '<div style="opacity:0.4">Searching for alpha...</div>';
        }
        alphaList.innerHTML = alphaHTML;

        // 3. Trade Stream
        const tradeGrid = document.getElementById('replicated-trades');
        if (state.replicatedTrades && state.replicatedTrades.length > 0) {
            tradeGrid.innerHTML = state.replicatedTrades.sort((a, b) => b.timestamp - a.timestamp).map(t => {
                const isSell = t.side === 'SELL';
                const color = isSell ? '#FF5252' : '#2962FF';
                return `
                <div class="stream-item" style="border-left-color: ${color}">
                    <div style="display:flex; justify-content:space-between;">
                        <span style="color:${color}; font-weight:bold;">${t.side} DETECTED</span>
                        <span style="opacity:0.5; font-size:0.7rem;">${new Date(t.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div style="margin-top:4px; font-size: 0.8rem;">
                        TARGET: <span style="color:#fff">${t.trader}</span> |
                        ASSET: <span style="color:#fff">${t.token}</span><br>
                        CHAIN: <span style="color:var(--secondary-accent)">${t.chain?.toUpperCase() || 'BASE'}</span>
                    </div>
                </div>
                `;
            }).join('');
        } else {
            tradeGrid.innerHTML = '<div class="stream-item" style="opacity:0.3">[SYSTEM] Awaiting cloud synchronization...</div>';
        }

        // 4. Intelligence Logs
        const logContainer = document.getElementById('thought-log');
        if (state.logs && state.logs.length > 0) {
            logContainer.innerHTML = state.logs.map(log => `<div class="log-entry">${log.text}</div>`).join('');
            logContainer.scrollTop = 0;
        }

        // 5. System Status
        if (state.lastCheck > 0) {
            document.getElementById('zer-score').innerText = '99.9 PROTOCOL CALIBRATED';
            document.getElementById('zer-score').style.color = '#00E676';
        }

    } catch (error) {
        console.error("Dashboard update failed:", error);
        document.getElementById('thought-log').innerHTML += `<div class="log-entry" style="color:red">SYNC_ERROR: ${error.message}</div>`;
    }
}

updateDashboard();
setInterval(updateDashboard, 10000);
