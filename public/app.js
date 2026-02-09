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
                    <span style="color: var(--success); font-weight: 600;">+$${(t.pnl || 0).toLocaleString()}</span>
                </div>
            `).join('');
        }

        if (state.followedTraders && state.followedTraders.length > 0) {
            alphaHTML += `<div style="font-size: 0.65rem; color: var(--secondary-accent); margin: 1rem 0 0.75rem 0; font-weight: 700;">👤 SOCIAL ALPHA</div>`;
            alphaHTML += state.followedTraders.slice(0, 5).map(t => `
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.8rem;">
                    <span style="color: var(--text-primary)">@${t.username}</span>
                    <span style="color: var(--success); font-weight: 600;">+$${(t.pnl || 0).toLocaleString()}</span>
                </div>
            `).join('');
        }

        if (alphaHTML === '') alphaHTML = '<div style="opacity:0.4; font-size: 0.8rem;">No active targets.</div>';
        alphaList.innerHTML = alphaHTML;

        // Populate Identity Registry (Leaderboard Style)
        const identityList = document.getElementById('tab-identity');
        if (identityList) {
            const allTraders = [
                ...(state.followedTraders || []).map(t => ({ ...t, name: `@${t.username}`, type: 'SOCIAL' })),
                ...(state.anonymousSuperTraders || []).map(t => ({ ...t, name: t.label, type: 'WHALE' }))
            ].sort((a, b) => (b.pnl || 0) - (a.pnl || 0));

            if (allTraders.length > 0) {
                const inner = identityList.querySelector('.section-card');
                if (inner) {
                    inner.innerHTML = `
                        <div class="card-header">
                            <div class="card-title">SMARTZER GLOBAL LEADERBOARD</div>
                            <div style="font-size: 0.65rem; color: var(--accent); font-weight: 700;">RANKED BY PORTFOLIO PNL</div>
                        </div>
                        <div class="scroll-area">
                            ${allTraders.map((r, i) => `
                                <div style="display:flex; align-items:center; gap:1rem; padding: 1rem; border-bottom: 1px solid var(--border); transition: background 0.2s; cursor: pointer;" onmouseover="this.style.background='rgba(0,186,255,0.05)'" onmouseout="this.style.background='transparent'">
                                    <div style="font-family: monospace; font-weight: 800; color: var(--accent); width: 25px;">#${i + 1}</div>
                                    <div style="width:36px; height:36px; border-radius:50%; background: ${r.type === 'WHALE' ? 'linear-gradient(45deg, #00B9FF, #0077FF)' : 'linear-gradient(45deg, #FF00E5, #7000FF)'}; display:flex; align-items:center; justify-content:center; font-weight:bold; color: white;">${r.name.replace('@', '')[0].toUpperCase()}</div>
                                    <div style="flex: 1;">
                                        <div style="font-weight:700; color:var(--text-primary)">${r.name}</div>
                                        <div style="font-size:0.65rem; color:var(--text-dim); font-family: monospace; letter-spacing: 1px;">${r.address.slice(0, 6)}...${r.address.slice(-4)}</div>
                                    </div>
                                    <div style="text-align: right;">
                                        <div style="font-weight:700; color:var(--success); font-size: 0.9rem;">$${(r.pnl || 0).toLocaleString()}</div>
                                        <div style="font-size: 0.55rem; color: var(--accent); font-weight: 800; text-transform: uppercase;">${r.type} ALPHA</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>`;
                    inner.style.opacity = "1";
                }
            }
        }

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
            // Separate logs for different views
            const heatLogs = state.logs.filter(l => l.text.includes('🔥 Market Heat') || l.text.includes('🎯 SIGNAL'));
            const thoughtLogs = state.logs.filter(l => !l.text.includes('🔥 Market Heat') && !l.text.includes('[WHALE_FEED]'));
            const whaleFeedLogs = state.logs.filter(l => l.text.includes('[WHALE_FEED]'));

            // Update Intelligence Logs (Thought Stream)
            logContainer.innerHTML = thoughtLogs.map(log => `
                <div class="log-line"><span>></span> ${log.text}</div>
            `).join('');

            // Update Whale Tracker Tab
            const whaleFeedList = document.getElementById('whale-feed-list');
            if (whaleFeedList && whaleFeedLogs.length > 0) {
                whaleFeedList.innerHTML = whaleFeedLogs.map(l => {
                    // Robust parsing for: Label (Address) Side $Symbol on Chain
                    const text = l.text.replace('[WHALE_FEED] ', '');
                    const addressMatch = text.match(/\((0x[a-fA-F0-9]+)\)/);
                    const address = addressMatch ? addressMatch[1] : 'Unknown';
                    const name = text.split(' (')[0] || 'Unknown';

                    const metaParts = text.split(') ')[1] || '';
                    const parts = metaParts.split(' ');
                    const side = parts[0] || 'MOVE';
                    const token = parts[1] || '';
                    const chain = parts[3] || 'Base';

                    return `
                    <div class="stream-item">
                        <div class="item-top">
                            <span class="type-tag ${side === 'SELL' ? 'sell' : 'buy'}">${side} DETECTED</span>
                            <span class="time-stamp">${new Date(l.id).toLocaleTimeString()}</span>
                        </div>
                        <div class="item-content">
                            <b>${name}</b> <code style="font-size:0.65rem; opacity:0.6;">${address.slice(0, 6)}...${address.slice(-4)}</code> moved <span>${token}</span> on <span>${chain}</span>
                        </div>
                    </div>
                    `;
                }).join('');
            } else if (whaleFeedList && whaleFeedLogs.length === 0) {
                whaleFeedList.innerHTML = '<div style="opacity:0.4; font-size: 0.85rem; padding: 1rem 0; text-align: center;">Waiting for high-net-worth activity...</div>';
            }

            // If No Copy Trades, show Momentum Heat in the main stream
            if (!state.replicatedTrades || state.replicatedTrades.length === 0) {
                momentumFeed.innerHTML = heatLogs.map(l => {
                    const timestamp = isNaN(Number(l.id)) ? '' : new Date(Number(l.id)).toLocaleTimeString();
                    return `
                    <div class="stream-item" style="border-left: 2px solid var(--accent)">
                        <div class="item-top">
                            <span class="type-tag" style="background: var(--accent); color: #fff;">MOMENTUM DETECTED</span>
                            <span class="time-stamp">${timestamp}</span>
                        </div>
                        <div class="item-content">${l.text.replace('🔥 Market Heat: ', '')}</div>
                    </div>
                    `;
                }).join('') || '<div style="opacity:0.4; font-size: 0.85rem; padding: 1rem 0;">Awaiting first on-chain signal...</div>';
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

// --- TAB SWITCHING LOGIC ---
function switchTab(tabId) {
    // 1. Update Navigation UI
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    const activeNav = document.getElementById(`nav-${tabId}`);
    if (activeNav) activeNav.classList.add('active');

    // 2. Hide all tabs, show selected
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.style.display = 'none';
        tab.classList.remove('active');
    });

    const targetTab = document.getElementById(`tab-${tabId}`);
    if (targetTab) {
        targetTab.style.display = 'block';
        targetTab.classList.add('active');
    }

    // 3. Update breadcrumb
    const breadcrumb = document.querySelector('.breadcrumb b');
    if (breadcrumb) {
        breadcrumb.innerText = tabId.charAt(0).toUpperCase() + tabId.slice(1);
    }
}

// Navigation Listeners
document.getElementById('nav-dashboard')?.addEventListener('click', (e) => { e.preventDefault(); switchTab('dashboard'); });
document.getElementById('nav-whales')?.addEventListener('click', (e) => { e.preventDefault(); switchTab('whales'); });
document.getElementById('nav-identity')?.addEventListener('click', (e) => { e.preventDefault(); switchTab('identity'); });

updateDashboard();
setInterval(updateDashboard, 10000);
