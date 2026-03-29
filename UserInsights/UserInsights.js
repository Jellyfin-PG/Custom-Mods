(function () {
    'use strict';

    const MODAL_ID = 'jf-insights-modal';
    const BTN_ID = 'jf-insights-nav-btn';
    let isFetching = false;

    const ensureStyles = () => {
        if (document.getElementById('jf-insights-style')) return;
        const s = document.createElement('style');
        s.id = 'jf-insights-style';
        s.textContent = `#${MODAL_ID}{position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,.7);backdrop-filter:blur(35px) saturate(1.5);-webkit-backdrop-filter:blur(35px) saturate(1.5);z-index:100000;display:none;justify-content:center;overflow-y:auto;color:#fff;font-family:'Noto Sans',sans-serif}#${MODAL_ID}.active{display:flex}.insights-container{max-width:1000px;width:90%;margin:60px 0;animation:jf-slide .5s cubic-bezier(.16,1,.3,1)}@keyframes jf-slide{from{opacity:0;transform:translateY(30px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}.insights-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:40px}.insights-header h2{font-size:2rem;font-weight:700;margin:0;letter-spacing:-.5px}.insights-hero{background:linear-gradient(135deg,rgba(255,255,255,.08),rgba(255,255,255,.03));border:1px solid rgba(255,255,255,.1);border-radius:24px;padding:40px;margin-bottom:24px;display:flex;flex-direction:column;align-items:center;text-align:center}.hero-val{font-size:4.5rem;font-weight:900;line-height:1;background:linear-gradient(to bottom,#fff,rgba(255,255,255,.7));-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin:10px 0}.insights-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:24px}.insight-card{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);padding:30px;border-radius:20px;display:flex;flex-direction:column}.insight-label{font-size:.8rem;text-transform:uppercase;letter-spacing:2px;color:rgba(255,255,255,.5);font-weight:700;margin-bottom:20px;display:flex;align-items:center;gap:8px}.insight-label i{font-size:1.2rem;color:var(--active-color,#10b981)}.stats-row{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:12px}.stats-row .val{font-size:1.8rem;font-weight:700}.stats-row .sub{font-size:.9rem;color:rgba(255,255,255,.5);margin-bottom:5px}.progress-bar{height:8px;background:rgba(255,255,255,.1);border-radius:10px;overflow:hidden;display:flex}.progress-fill{height:100%;transition:width 1.2s cubic-bezier(.16,1,.3,1)}.top-list{list-style:none;padding:0;margin:0}.top-list-item{display:flex;align-items:center;padding:14px 0;border-bottom:1px solid rgba(255,255,255,.05)}.top-list-item:last-child{border:none}.rank-number{width:28px;font-size:.8rem;font-weight:800;color:rgba(255,255,255,.3)}.item-name{flex:1;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-right:15px}.item-badge{font-size:.75rem;background:rgba(255,255,255,.1);padding:4px 10px;border-radius:12px;font-weight:700}.close-insights{background:#fff;border:none;color:#000;padding:12px 28px;border-radius:50px;cursor:pointer;font-weight:700;transition:transform .2s}.close-insights:hover{transform:scale(1.05)}.loading-state{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px}.spinner{width:40px;height:40px;border:4px solid rgba(255,255,255,.1);border-top-color:var(--active-color,#10b981);border-radius:50%;animation:jf-spin 1s linear infinite}@keyframes jf-spin{to{transform:rotate(360deg)}}`;
        document.head.appendChild(s);
    };

    const formatTime = (ticks) => {
        const s = ticks / 10000000;
        return { days: Math.floor(s / 86400), hours: Math.floor((s % 86400) / 3600) };
    };

    const fetchStats = async () => {
        const userId = ApiClient.getCurrentUserId();
        const { Items } = await ApiClient.getJSON(ApiClient.getUrl(`Users/${userId}/Items`, {
            Recursive: true,
            IncludeItemTypes: 'Movie,Episode',
            Fields: 'Genres,RunTimeTicks,UserData',
        }));

        const stats = { totalTicks: 0, watchedMovies: 0, watchedEpisodes: 0, favGenres: {}, topItems: [] };
        if (!Items?.length) return stats;

        const watched = Items.filter(i => i.UserData?.PlayCount > 0);

        for (const item of watched) {
            const pc = item.UserData.PlayCount;
            if (item.Type === 'Movie') stats.watchedMovies++;
            else if (item.Type === 'Episode') stats.watchedEpisodes++;
            stats.totalTicks += (item.RunTimeTicks || 0) * pc;
            item.Genres?.forEach(g => { stats.favGenres[g] = (stats.favGenres[g] || 0) + 1; });
        }

        stats.topItems = watched
            .sort((a, b) => b.UserData.PlayCount - a.UserData.PlayCount)
            .slice(0, 5);

        return stats;
    };

    const listItems = (items, render) => items.length
        ? items.map((x, i) => `<li class="top-list-item"><span class="rank-number">0${i + 1}</span>${render(x)}</li>`).join('')
        : '<li class="top-list-item" style="color:rgba(255,255,255,.4)">Not enough data yet</li>';

    const renderDashboard = (stats) => {
        const { days, hours } = formatTime(stats.totalTicks);
        const total = stats.watchedMovies + stats.watchedEpisodes;
        const moviePct = total > 0 ? (stats.watchedMovies / total) * 100 : 0;
        const genres = Object.entries(stats.favGenres).sort((a, b) => b[1] - a[1]).slice(0, 5);
        const dismiss = `document.getElementById('${MODAL_ID}').classList.remove('active')`;

        document.getElementById(MODAL_ID).innerHTML = `
            <div class="insights-container">
                <div class="insights-header">
                    <h2>Insights</h2>
                    <button class="close-insights" onclick="${dismiss}">Dismiss</button>
                </div>
                <div class="insights-hero">
                    <div class="insight-label">Your Total Screen Time</div>
                    <div class="hero-val">${days}d ${hours}h</div>
                    <div style="color:rgba(255,255,255,.4);font-size:.9rem;font-weight:500">Calculated across ${total} unique items</div>
                </div>
                <div class="insights-grid">
                    <div class="insight-card">
                        <div class="insight-label"><i class="material-icons">pie_chart</i>Library Distribution</div>
                        <div class="stats-row"><span class="sub">Movies</span><span class="val">${stats.watchedMovies}</span></div>
                        <div class="stats-row"><span class="sub">Episodes</span><span class="val">${stats.watchedEpisodes}</span></div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width:${moviePct}%;background:var(--active-color,#10b981)"></div>
                            <div class="progress-fill" style="width:${100 - moviePct}%;background:#3b82f6"></div>
                        </div>
                    </div>
                    <div class="insight-card">
                        <div class="insight-label"><i class="material-icons">favorite</i>Top Preferences</div>
                        <ul class="top-list">${listItems(genres, ([name, count]) => `<span class="item-name">${name}</span><span class="item-badge">${count}</span>`)}</ul>
                    </div>
                    <div class="insight-card">
                        <div class="insight-label"><i class="material-icons">history</i>Most Revisited</div>
                        <ul class="top-list">${listItems(stats.topItems, item => `<span class="item-name">${item.Name}</span><span class="item-badge" style="color:#facc15">${item.UserData.PlayCount}x</span>`)}</ul>
                    </div>
                </div>
            </div>`;
    };

    const getOrCreateModal = () => {
        let modal = document.getElementById(MODAL_ID);
        if (!modal) {
            ensureStyles();
            modal = document.createElement('div');
            modal.id = MODAL_ID;
            document.body.appendChild(modal);
        }
        return modal;
    };

    const openInsights = async () => {
        if (isFetching) return;
        const modal = getOrCreateModal();
        modal.classList.add('active');
        modal.innerHTML = `<div class="loading-state"><div class="spinner"></div><div style="font-weight:700;letter-spacing:1px;color:rgba(255,255,255,.6);text-transform:uppercase;font-size:.8rem">Analyzing Watch History</div></div>`;
        isFetching = true;
        try {
            renderDashboard(await fetchStats());
        } catch (e) {
            console.error(e);
            modal.innerHTML = `<div class="insights-container" style="text-align:center"><h2>Could not sync data.</h2><button class="close-insights" onclick="location.reload()">Retry</button></div>`;
        } finally {
            isFetching = false;
        }
    };

    const injectButton = () => {
        if (document.getElementById(BTN_ID)) return;
        const headerRight = document.querySelector('.headerRight');
        if (!headerRight) return;
        const btn = document.createElement('button');
        btn.id = BTN_ID;
        btn.className = 'paper-icon-button-light headerButton';
        btn.title = 'Insights';
        btn.innerHTML = '<span class="material-icons">analytics</span>';
        btn.addEventListener('click', openInsights);
        headerRight.prepend(btn);
    };

    const init = () => {
        injectButton();
        new MutationObserver(injectButton).observe(document.body, { childList: true, subtree: true });
    };

    if (document.readyState === 'complete') init();
    else window.addEventListener('DOMContentLoaded', init);
})();                align-items: center;
                text-align: center;
            }

            .hero-val {
                font-size: 4.5rem;
                font-weight: 900;
                line-height: 1;
                background: linear-gradient(to bottom, #fff, rgba(255,255,255,0.7));
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                margin: 10px 0;
            }

            .insights-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 24px;
            }

            .insight-card {
                background: rgba(255, 255, 255, 0.04);
                border: 1px solid rgba(255, 255, 255, 0.08);
                padding: 30px;
                border-radius: 20px;
                display: flex;
                flex-direction: column;
            }

            .insight-label {
                font-size: 0.8rem;
                text-transform: uppercase;
                letter-spacing: 2px;
                color: rgba(255,255,255,0.5);
                font-weight: 700;
                margin-bottom: 20px;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .insight-label i { font-size: 1.2rem; color: var(--active-color, #10b981); }

            .stats-row {
                display: flex;
                justify-content: space-between;
                align-items: flex-end;
                margin-bottom: 12px;
            }

            .stats-row .val { font-size: 1.8rem; font-weight: 700; }
            .stats-row .sub { font-size: 0.9rem; color: rgba(255,255,255,0.5); margin-bottom: 5px; }

            .progress-bar {
                height: 8px;
                background: rgba(255,255,255,0.1);
                border-radius: 10px;
                overflow: hidden;
                display: flex;
            }

            .progress-fill { height: 100%; transition: width 1.2s cubic-bezier(0.16, 1, 0.3, 1); }

            .top-list { list-style: none; padding: 0; margin: 0; }
            .top-list-item {
                display: flex;
                align-items: center;
                padding: 14px 0;
                border-bottom: 1px solid rgba(255,255,255,0.05);
            }
            .top-list-item:last-child { border: none; }
            
            .rank-number {
                width: 28px;
                font-size: 0.8rem;
                font-weight: 800;
                color: rgba(255,255,255,0.3);
            }

            .item-name {
                flex: 1;
                font-weight: 600;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                margin-right: 15px;
            }

            .item-badge {
                font-size: 0.75rem;
                background: rgba(255,255,255,0.1);
                padding: 4px 10px;
                border-radius: 12px;
                font-weight: 700;
            }

            .close-insights {
                background: #fff;
                border: none;
                color: #000;
                padding: 12px 28px;
                border-radius: 50px;
                cursor: pointer;
                font-weight: 700;
                transition: transform 0.2s;
            }
            .close-insights:hover { transform: scale(1.05); }

            .loading-state {
                height: 100%;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 20px;
            }

            .spinner {
                width: 40px;
                height: 40px;
                border: 4px solid rgba(255,255,255,0.1);
                border-top-color: var(--active-color, #10b981);
                border-radius: 50%;
                animation: jf-spin 1s linear infinite;
            }
            @keyframes jf-spin { to { transform: rotate(360deg); } }
        `;
        document.head.appendChild(style);
    };

    const formatTicksToTime = (ticks) => {
        const totalSeconds = ticks / 10000000;
        const days = Math.floor(totalSeconds / 86400);
        const hours = Math.floor((totalSeconds % 86400) / 3600);
        return { days, hours };
    };

    const fetchDetailedStats = async () => {
        if (typeof ApiClient === 'undefined') return;
        const userId = ApiClient.getCurrentUserId();
        
        const response = await ApiClient.getJSON(ApiClient.getUrl(`Users/${userId}/Items`, {
            Recursive: true,
            IncludeItemTypes: 'Movie,Episode',
            Fields: 'Genres,CumulativeRunTimeTicks,PlayCount',
            Filters: 'IsPlayed'
        }));

        const stats = {
            totalTicks: 0,
            watchedMovies: 0,
            watchedEpisodes: 0,
            favGenres: {},
            topItems: []
        };

        if (response && response.Items) {
            response.Items.forEach(item => {
                const playCount = item.UserData ? item.UserData.PlayCount || 0 : 0;
                if (playCount === 0) return;

                if (item.Type === 'Movie') stats.watchedMovies++;
                if (item.Type === 'Episode') stats.watchedEpisodes++;
                
                const runTime = item.RunTimeTicks || 0;
                stats.totalTicks += (runTime * playCount);

                if (item.Genres) {
                    item.Genres.forEach(g => {
                        stats.favGenres[g] = (stats.favGenres[g] || 0) + 1;
                    });
                }
            });

            stats.topItems = [...response.Items]
                .sort((a, b) => (b.UserData?.PlayCount || 0) - (a.UserData?.PlayCount || 0))
                .slice(0, 5);
        }

        return stats;
    };

    const renderDashboard = (stats) => {
        const time = formatTicksToTime(stats.totalTicks);
        const totalWatched = stats.watchedMovies + stats.watchedEpisodes;
        const moviePct = totalWatched > 0 ? (stats.watchedMovies / totalWatched) * 100 : 0;
        
        const sortedGenres = Object.entries(stats.favGenres)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        const modal = document.getElementById(MODAL_ID);
        modal.innerHTML = `
            <div class="insights-container">
                <div class="insights-header">
                    <h2>Insights</h2>
                    <button class="close-insights" onclick="document.getElementById('${MODAL_ID}').classList.remove('active')">Dismiss</button>
                </div>
                
                <div class="insights-hero">
                    <div class="insight-label">Your Total Screen Time</div>
                    <div class="hero-val">${time.days}d ${time.hours}h</div>
                    <div style="color:rgba(255,255,255,0.4); font-size:0.9rem; font-weight:500;">Calculated across ${totalWatched} unique items</div>
                </div>

                <div class="insights-grid">
                    <div class="insight-card">
                        <div class="insight-label"><i class="material-icons">pie_chart</i>Library Distribution</div>
                        <div class="stats-row">
                            <span class="sub">Movies</span>
                            <span class="val">${stats.watchedMovies}</span>
                        </div>
                        <div class="stats-row">
                            <span class="sub">Episodes</span>
                            <span class="val">${stats.watchedEpisodes}</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width:${moviePct}%; background:var(--active-color, #10b981);"></div>
                            <div class="progress-fill" style="width:${100 - moviePct}%; background:#3b82f6;"></div>
                        </div>
                    </div>

                    <div class="insight-card">
                        <div class="insight-label"><i class="material-icons">favorite</i>Top Preferences</div>
                        <ul class="top-list">
                            ${sortedGenres.length > 0 ? sortedGenres.map(([name, count], i) => `
                                <li class="top-list-item">
                                    <span class="rank-number">0${i+1}</span>
                                    <span class="item-name">${name}</span>
                                    <span class="item-badge">${count}</span>
                                </li>
                            `).join('') : '<li class="top-list-item" style="color:rgba(255,255,255,0.4)">Not enough data yet</li>'}
                        </ul>
                    </div>

                    <div class="insight-card">
                        <div class="insight-label"><i class="material-icons">history</i>Most Revisited</div>
                        <ul class="top-list">
                            ${stats.topItems.length > 0 ? stats.topItems.map((item, i) => `
                                <li class="top-list-item">
                                    <span class="rank-number">0${i+1}</span>
                                    <span class="item-name">${item.Name}</span>
                                    <span class="item-badge" style="color:#facc15;">${item.UserData.PlayCount}x</span>
                                </li>
                            `).join('') : '<li class="top-list-item" style="color:rgba(255,255,255,0.4)">Not enough data yet</li>'}
                        </ul>
                    </div>
                </div>
            </div>
        `;
    };

    const openInsights = async () => {
        if (isFetching) return;
        
        const modal = document.getElementById(MODAL_ID) || createModal();
        modal.classList.add('active');
        modal.innerHTML = `
            <div class="loading-state">
                <div class="spinner"></div>
                <div style="font-weight:700; letter-spacing:1px; color:rgba(255,255,255,0.6); text-transform:uppercase; font-size:0.8rem;">Analyzing Watch History</div>
            </div>`;
        
        isFetching = true;
        try {
            const stats = await fetchDetailedStats();
            renderDashboard(stats);
        } catch (e) {
            console.error(e);
            modal.innerHTML = '<div class="insights-container" style="text-align:center;"><h2>Could not sync data.</h2><button class="close-insights" onclick="location.reload()">Retry</button></div>';
        } finally {
            isFetching = false;
        }
    };

    const createModal = () => {
        ensureStyles();
        const modal = document.createElement('div');
        modal.id = MODAL_ID;
        document.body.appendChild(modal);
        return modal;
    };

    const injectButton = () => {
        if (document.getElementById(BTN_ID)) return;
        const headerRight = document.querySelector('.headerRight');
        if (!headerRight) return;

        const btn = document.createElement('button');
        btn.id = BTN_ID;
        btn.className = 'paper-icon-button-light headerButton';
        btn.title = 'Insights';
        btn.innerHTML = '<span class="material-icons">analytics</span>';
        
        btn.addEventListener('click', openInsights);
        headerRight.prepend(btn);
    };

    const init = () => {
        injectButton();
        new MutationObserver(injectButton).observe(document.body, { childList: true, subtree: true });
    };

    if (document.readyState === 'complete') init();
    else window.addEventListener('DOMContentLoaded', init);

})();
