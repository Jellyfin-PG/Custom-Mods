(function () {
    'use strict';

    const injectStyles = () => {
        if (document.getElementById('jf-header-time-styles')) return;
        const style = document.createElement('style');
        style.id = 'jf-header-time-styles';
        style.textContent = `
            #jf-header-time {
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
                transition: background 0.2s;
                font-size: 0.95em;
                font-weight: 600;
                font-family: 'Inter', system-ui, sans-serif;
                letter-spacing: 0.02em;
            }
            #jf-header-time:hover {
                background: rgba(255, 255, 255, 0.1);
            }
        `;
        document.head.appendChild(style);
    };

    const updateTime = () => {
        const timeEl = document.getElementById('jf-header-time');
        if (!timeEl) return;

        const now = new Date();
        timeEl.textContent = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
        
        setTimeout(updateTime, 1000 * (60 - now.getSeconds()));
    };

    const tryInjectHeader = (attempts = 0) => {
        if (document.getElementById('jf-header-time')) return;
        if (attempts > 20) return;

        const headerRight = document.querySelector('.headerRight');
        
        if (!headerRight) {
            setTimeout(() => tryInjectHeader(attempts + 1), 500);
            return;
        }

        const container = document.createElement('div');
        container.id = 'jf-header-time';
        
        headerRight.insertBefore(container, headerRight.firstChild);

        updateTime();
    };

    const init = () => {
        injectStyles();
        
        const observer = new MutationObserver(() => {
            if (!document.getElementById('jf-header-time')) {
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
