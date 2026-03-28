(function () {
    'use strict';
    const DAYS_CONSIDERED_NEW = 14; 
    
    const ITEMS_TO_CHECK = 200; 

    const STYLE_ID = 'jf-new-arrival-style';
    let newArrivalIds = new Set();
    let initialized = false;

    function injectCSS() {
        if (document.getElementById(STYLE_ID)) return;
        
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
            .jf-badge-container-new {
                position: absolute;
                top: -6px;
                left: -6px;
                z-index: 10;
                pointer-events: none;
            }
            .jf-badge-new {
                background: linear-gradient(135deg, #10b981, #059669);
                color: #fff;
                padding: 4px 10px;
                border-radius: 6px;
                font-size: 0.75rem;
                font-weight: 800;
                text-transform: uppercase;
                letter-spacing: 1px;
                box-shadow: 0 4px 10px rgba(16, 185, 129, 0.4);
                border: 1px solid rgba(255, 255, 255, 0.2);
                animation: jf-pulse 2s infinite; 
            }
            
            @keyframes jf-pulse {
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
                        const dateCreated = new Date(item.DateCreated);
                        
                        const diffDays = Math.floor((now - dateCreated) / msInDay);

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

    function processCards() {
        const cards = document.querySelectorAll('.card:not(.new-badge-processed)');
        
        cards.forEach(card => {
            card.classList.add('new-badge-processed');
            
            const itemId = card.getAttribute('data-id');
            if (!itemId) return;

            if (newArrivalIds.has(itemId)) {
                const targetBox = card.querySelector('.cardBox');
                if (!targetBox) return;

                targetBox.style.position = 'relative';

                const badgeContainer = document.createElement('div');
                badgeContainer.className = 'jf-badge-container-new';
                
                const badge = document.createElement('div');
                badge.className = 'jf-badge-new';
                badge.textContent = 'NEW';
                
                badgeContainer.appendChild(badge);
                targetBox.appendChild(badgeContainer);
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
