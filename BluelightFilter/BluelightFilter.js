(function () {
    'use strict';

    const FILTER_COLOR = 'rgba(255, 147, 41, 0.25)'; 

    const FILTER_ID = 'jf-bluelight-filter';
    const BTN_ID = 'jf-nightmode-btn';
    const STORAGE_KEY = 'jf-nightmode-enabled';

    let isNightMode = localStorage.getItem(STORAGE_KEY) === 'true';

    function injectFilter() {
        if (document.getElementById(FILTER_ID)) return;

        const style = document.createElement('style');
        style.textContent = `
            #${FILTER_ID} {
                position: fixed;
                top: 0; 
                left: 0; 
                width: 100vw; 
                height: 100vh;
                background-color: ${FILTER_COLOR};
                
                mix-blend-mode: multiply; 
                
                pointer-events: none;
                z-index: 99998;
                
                opacity: 0;
                transition: opacity 0.8s ease-in-out;
                display: none;
            }
            #${FILTER_ID}.active {
                opacity: 1;
                display: block;
            }
            
            #${BTN_ID} {
                transition: color 0.2s, transform 0.2s;
                margin-right: 4px;
            }
            #${BTN_ID}:hover {
                color: #10b981;
                transform: scale(1.1);
            }
            #${BTN_ID}.active-btn {
                color: #facc15 !important;
            }
        `;
        document.head.appendChild(style);

        const filter = document.createElement('div');
        filter.id = FILTER_ID;
        if (isNightMode) filter.classList.add('active');
        document.body.appendChild(filter);
    }

    function toggleNightMode(btn) {
        isNightMode = !isNightMode;
        localStorage.setItem(STORAGE_KEY, isNightMode);

        const filter = document.getElementById(FILTER_ID);
        if (filter) {
            if (isNightMode) filter.classList.add('active');
            else filter.classList.remove('active');
        }

        if (btn) {
            if (isNightMode) btn.classList.add('active-btn');
            else btn.classList.remove('active-btn');
        }
    }

    function injectButton() {
        if (document.getElementById(BTN_ID)) return;

        const fullscreenBtn = document.querySelector('.btnFullscreen');
        if (!fullscreenBtn) return;

        const btn = document.createElement('button');
        btn.id = BTN_ID;
        btn.setAttribute('is', 'paper-icon-button-light');
        btn.className = 'autoSize paper-icon-button-light focuscontainer-x itemAction';
        btn.title = 'Toggle Night Mode (Blue Light Filter)';
        btn.setAttribute('aria-label', 'Toggle Night Mode');
        
        if (isNightMode) btn.classList.add('active-btn');

        const span = document.createElement('span');
        span.className = 'material-icons largePaperIconButton';
        span.setAttribute('aria-hidden', 'true');
        span.textContent = 'brightness_4';

        btn.appendChild(span);

        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleNightMode(btn);
        });

        fullscreenBtn.parentNode.insertBefore(btn, fullscreenBtn);
    }

    function checkPlayerState() {
        const hasVideo = document.querySelector('video');
        const hasFullscreenBtn = document.querySelector('.btnFullscreen');
        
        if (hasVideo && hasFullscreenBtn) {
            if (!document.getElementById(BTN_ID)) {
                injectButton();
            }
        } else if (!hasVideo) {
            const btn = document.getElementById(BTN_ID);
            if (btn) btn.remove();
        }
    }

    function init() {
        injectFilter();
        checkPlayerState();
    }

    const observer = new MutationObserver(checkPlayerState);

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        init();
        observer.observe(document.body, { childList: true, subtree: true });
    } else {
        window.addEventListener('DOMContentLoaded', () => {
            init();
            observer.observe(document.body, { childList: true, subtree: true });
        });
    }

})();
