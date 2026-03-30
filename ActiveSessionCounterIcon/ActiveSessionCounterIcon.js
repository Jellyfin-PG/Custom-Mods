(function () {
    'use strict';

    const injectStyles = () => {
        if (document.getElementById('jf-header-streams-styles')) return;
        const style = document.createElement('style');
        style.id = 'jf-header-streams-styles';
        style.textContent = `
            #jf-header-streams {
                display: flex;
                align-items: center;
                justify-content: center;
                margin-right: 12px;
                padding: 4px 10px;
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 8px;
                color: #fff;
                cursor: pointer;
                transition: all 0.3s ease;
                font-family: 'Inter', system-ui, sans-serif;
                opacity: 0.6; /* Faded when inactive */
            }
            #jf-header-streams:hover {
                background: rgba(255, 255, 255, 0.1);
                opacity: 1;
            }
            #jf-header-streams.jf-streams-active {
                opacity: 1;
                color: #00a4dc;
                background: rgba(0, 164, 220, 0.1);
                border-color: rgba(0, 164, 220, 0.3);
                box-shadow: 0 0 10px rgba(0, 164, 220, 0.15);
            }
            #jf-header-streams .jf-hs-count {
                font-size: 0.95em;
                font-weight: 600;
                margin-left: 6px;
            }
            .jf-hs-icon {
                font-size: 1.4em !important;
                transition: transform 0.2s ease;
            }
            #jf-header-streams.jf-streams-active .jf-hs-icon {
                animation: hs-pulse-glow 2s infinite alternate;
            }

            @keyframes hs-pulse-glow {
                0% { text-shadow: 0 0 5px rgba(0, 164, 220, 0.2); }
                100% { text-shadow: 0 0 15px rgba(0, 164, 220, 0.8); }
            }
        `;
        document.head.appendChild(style);
    };

    const fetchActiveStreams = async () => {
        if (typeof ApiClient === 'undefined') return 0;
        try {
            const sessions = await ApiClient.getJSON(ApiClient.getUrl('Sessions'));
            
            const activeStreams = sessions.filter(session => {
                return session.NowPlayingItem && (!session.PlayState || !session.PlayState.IsPaused);
            });
            
            return activeStreams.length;
        } catch (err) {
            console.error("Stream Counter Error:", err);
            return -1;
        }
    };

    const updateStreams = async () => {
        const container = document.getElementById('jf-header-streams');
        if (!container) return;

        const count = await fetchActiveStreams();

        if (count === -1) {
            container.innerHTML = `
                <span class="material-icons jf-hs-icon">error_outline</span>
                <span class="jf-hs-count">Err</span>
            `;
            container.title = "Failed to fetch sessions";
            container.classList.remove('jf-streams-active');
        } else if (count === 0) {
            container.innerHTML = `
                <span class="material-icons jf-hs-icon">visibility_off</span>
                <span class="jf-hs-count">0</span>
            `;
            container.title = "No active streams";
            container.classList.remove('jf-streams-active');
        } else {
            container.innerHTML = `
                <span class="material-icons jf-hs-icon">visibility</span>
                <span class="jf-hs-count">${count}</span>
            `;
            container.title = `${count} Active Stream${count > 1 ? 's' : ''}`;
            container.classList.add('jf-streams-active');
        }

        // Poll every 15 seconds
        setTimeout(updateStreams, 15000);
    };

    const tryInjectHeader = (attempts = 0) => {
        if (document.getElementById('jf-header-streams')) return;
        if (attempts > 20) return;

        const headerRight = document.querySelector('.headerRight');
        
        if (!headerRight) {
            setTimeout(() => tryInjectHeader(attempts + 1), 500);
            return;
        }

        const container = document.createElement('div');
        container.id = 'jf-header-streams';
        
        container.innerHTML = `
            <span class="material-icons jf-hs-icon" style="opacity: 0.5; animation: hw-spin 2s linear infinite;">sync</span>
            <span class="jf-hs-count">...</span>
        `;
        
        container.addEventListener('click', () => {
            window.location.hash = '#!/dashboard.html';
        });

        headerRight.insertBefore(container, headerRight.firstChild);

        updateStreams();
    };

    const init = () => {
        injectStyles();
        
        const observer = new MutationObserver(() => {
            if (!document.getElementById('jf-header-streams')) {
                tryInjectHeader(0);
            }
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
        tryInjectHeader(0);
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
