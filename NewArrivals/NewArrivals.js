(function () {
    'use strict';

    const DAYS_CONSIDERED_NEW = 14; 
    const ITEMS_TO_CHECK = 200; 
    const STYLE_ID = 'jf-new-arrival-style';
    const CONTAINER_CLASS = 'jf-unified-badge-container';
    let newArrivalIds = new Set();
    let initialized = false;

    function injectCSS() {
        if (document.getElementById(STYLE_ID)) return;
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
            .${CONTAINER_CLASS} {
                position: absolute;
                top: 8px;
                left: 8px;
                display: flex;
                flex-direction: column;
                gap: 6px;
                z-index: 11;
                pointer-events: none;
            }
            .jf-badge-new {
                display: flex;
                align-items: center;
                gap: 5px;
                padding: 4px 10px !important;
                border-radius: 6px !important;
                font-size: 0.75rem !important;
                font-weight: 800 !important;
                color: #fff;
                box-shadow: 0 4px 10px rgba(0,0,0,0.5) !important;
                backdrop-filter: blur(8px);
                -webkit-backdrop-filter: blur(8px);
                border: 1px solid rgba(255,255,255,0.2) !important;
                text-transform: uppercase !important;
                letter-spacing: 0.5px !important;
                line-height: 1 !important;
                background: linear-gradient(135deg, #10b981, #059669);
                width: fit-content;
                animation: jf-new-pulse 2s infinite;
            }
            @keyframes jf-new-pulse {
                0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.6); }
                70% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
                100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
            }
        `;
        document.head.appendChild(style);
    }

    async function fetchNewArrivals() {
        if (typeof ApiClient === 'undefined') return;
        const userId = ApiClient.getCurrentUserId();
        if (!userId) return;
        try {
            const response = await ApiClient.getJSON(ApiClient.getUrl(`Users/${userId}/Items`, {
                Recursive: true,
                IncludeItemTypes: 'Movie,Series', 
                SortBy: 'DateCreated',
                SortOrder: 'Descending',
                Limit: ITEMS_TO_CHECK,
                Fields: 'DateCreated'
            }));
            if (response && response.Items) {
                const now = new Date();
                const msInDay = 24 * 60 * 60 * 1000;
                for (const item of response.Items) {
                    if (item.DateCreated) {
                        const diffDays = Math.floor((now - new Date(item.DateCreated)) / msInDay);
                        if (diffDays <= DAYS_CONSIDERED_NEW) {
                            newArrivalIds.add(item.Id);
                        } else {
                            break; 
                        }
                    }
                }
            }
        } catch (err) {
            console.error("New Arrivals Badge: Error fetching items", err);
        }
    }

    const getOrCreateContainer = (cardBox) => {
        let container = cardBox.querySelector(`.${CONTAINER_CLASS}`);
        if (!container) {
            container = document.createElement('div');
            container.className = CONTAINER_CLASS;
            cardBox.appendChild(container);
        }
        return container;
    };

    function processCards() {
        const cards = document.querySelectorAll('.card:not(.new-badge-processed)');
        cards.forEach(card => {
            card.classList.add('new-badge-processed');
            const itemId = card.getAttribute('data-id');
            if (itemId && newArrivalIds.has(itemId)) {
                const cardBox = card.querySelector('.cardBox');
                if (!cardBox) return;
                cardBox.style.position = 'relative';
                const container = getOrCreateContainer(cardBox);
                const badge = document.createElement('div');
                badge.className = 'jf-badge-new';
                badge.textContent = 'NEW';
                container.prepend(badge);
            }
        });
    }

    async function init() {
        if (typeof ApiClient === 'undefined' || !ApiClient.getCurrentUserId()) return;
        if (!initialized) {
            initialized = true;
            injectCSS();
            await fetchNewArrivals();
        }
        processCards();
    }

    const observer = new MutationObserver(() => {
        if (document.querySelector('.card:not(.new-badge-processed)')) {
            init();
        }
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            observer.observe(document.body, { childList: true, subtree: true });
            init();
        });
    } else {
        observer.observe(document.body, { childList: true, subtree: true });
        init();
    }
})();
