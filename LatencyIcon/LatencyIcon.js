(function () {
    'use strict';

    const injectStyles = () => {
        if (document.getElementById('jf-header-ping-styles')) return;
        const style = document.createElement('style');
        style.id = 'jf-header-ping-styles';
        style.textContent = `
            #jf-header-ping {
                display: flex;
                align-items: center;
                justify-content: center;
                margin-right: 12px;
                padding: 4px 10px;
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 8px;
                color: #fff;
                cursor: default;
                transition: background 0.2s, opacity 0.3s;
                font-family: 'Inter', system-ui, sans-serif;
            }
            #jf-header-ping:hover {
                background: rgba(255, 255, 255, 0.1);
            }
            .jf-ping-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                margin-right: 6px;
                background: #888;
                box-shadow: 0 0 5px #888;
                transition: background 0.3s, box-shadow 0.3s;
            }
            .jf-ping-text {
                font-size: 0.95em;
                font-weight: 600;
                min-width: 36px;
                text-align: right;
            }
            
            .jf-ping-good .jf-ping-dot { background: #20c060; box-shadow: 0 0 8px rgba(32, 192, 96, 0.6); }
            .jf-ping-warn .jf-ping-dot { background: #facc15; box-shadow: 0 0 8px rgba(250, 204, 21, 0.6); }
            .jf-ping-bad .jf-ping-dot  { background: #e06060; box-shadow: 0 0 8px rgba(224, 96, 96, 0.6); }
            .jf-ping-err .jf-ping-dot  { background: #888; box-shadow: none; animation: ping-blink 1s infinite alternate; }
            .jf-ping-err .jf-ping-text { opacity: 0.5; }

            @keyframes ping-blink {
                0% { opacity: 0.3; }
                100% { opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    };

    const updatePing = async () => {
        const container = document.getElementById('jf-header-ping');
        if (!container) return;

        if (typeof ApiClient === 'undefined') {
            setTimeout(updatePing, 5000);
            return;
        }

        const start = performance.now();
        try {
            await fetch(ApiClient.getUrl('System/Info/Public'), { cache: 'no-store', method: 'GET' });
            
            const latency = Math.round(performance.now() - start);
            const textEl = container.querySelector('.jf-ping-text');
            textEl.textContent = `${latency}ms`;

            container.classList.remove('jf-ping-good', 'jf-ping-warn', 'jf-ping-bad', 'jf-ping-err');

            if (latency < 80) {
                container.classList.add('jf-ping-good');
                container.title = "Connection: Excellent";
            } else if (latency < 200) {
                container.classList.add('jf-ping-warn');
                container.title = "Connection: Fair";
            } else {
                container.classList.add('jf-ping-bad');
                container.title = "Connection: Poor";
            }
        } catch (err) {
            container.classList.remove('jf-ping-good', 'jf-ping-warn', 'jf-ping-bad');
            container.classList.add('jf-ping-err');
            container.querySelector('.jf-ping-text').textContent = 'Err';
            container.title = "Connection Lost";
        }

        setTimeout(updatePing, 10000);
    };

    const tryInjectHeader = (attempts = 0) => {
        if (document.getElementById('jf-header-ping')) return;
        if (attempts > 20) return; 

        const headerRight = document.querySelector('.headerRight');
        
        if (!headerRight) {
            setTimeout(() => tryInjectHeader(attempts + 1), 500);
            return;
        }

        const container = document.createElement('div');
        container.id = 'jf-header-ping';
        container.className = 'jf-ping-err';
        
        container.innerHTML = `
            <div class="jf-ping-dot"></div>
            <span class="jf-ping-text">...</span>
        `;
        
        headerRight.insertBefore(container, headerRight.firstChild);

        updatePing();
    };

    const init = () => {
        injectStyles();
        
        const observer = new MutationObserver(() => {
            if (!document.getElementById('jf-header-ping')) {
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
