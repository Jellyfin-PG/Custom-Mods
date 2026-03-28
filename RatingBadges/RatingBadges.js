(function () {
    'use strict';

    const STYLE_ID = 'jf-rating-badges-style';
    const CONTAINER_CLASS = 'jf-unified-badge-container';
    const cache = new Map();

    const ensureStyles = () => {
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
            .jf-rating-badge, .jf-badge-new {
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
                position: static !important;
                margin: 0 !important;
                width: fit-content;
            }
            .jf-rating-critic { 
                background: linear-gradient(135deg, rgba(229, 9, 20, 0.95), rgba(170, 7, 15, 0.95)); 
            }
            .jf-rating-community { 
                background: linear-gradient(135deg, rgba(245, 197, 24, 0.98), rgba(215, 170, 20, 0.98)); 
                color: #000 !important; 
                border-color: rgba(0,0,0,0.1) !important;
            }
            .jf-rating-fresh { 
                background: linear-gradient(135deg, rgba(25, 135, 84, 0.95), rgba(15, 100, 60, 0.95)); 
            }
            .jf-rating-badge svg {
                width: 13px;
                height: 13px;
                fill: currentColor;
            }
        `;
        document.head.appendChild(style);
    };

    const getIcons = () => ({
        imdb: `<svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`,
        tomato: `<svg viewBox="0 0 24 24"><path d="M12,2C14.5,2 17,3.5 17,7C17,8 16.5,9 15.5,10C17.5,11 19,13 19,15.5C19,19 16,22 12,22C8,22 5,19 5,15.5C5,13 6.5,11 8.5,10C7.5,9 7,8 7,7C7,3.5 9.5,2 12,2Z"/></svg>`
    });

    const getOrCreateContainer = (cardBox) => {
        let container = cardBox.querySelector(`.${CONTAINER_CLASS}`);
        if (!container) {
            container = document.createElement('div');
            container.className = CONTAINER_CLASS;
            cardBox.appendChild(container);
        }
        return container;
    };

    const processCard = async (card) => {
        if (card.classList.contains('rating-processed')) return;
        
        const itemId = card.getAttribute('data-id');
        const type = card.getAttribute('data-type');
        if (!itemId || (type !== 'Movie' && type !== 'Series')) return;

        card.classList.add('rating-processed');

        const cardBox = card.querySelector('.cardBox');
        if (!cardBox) return;

        cardBox.style.position = 'relative';

        let data = cache.get(itemId);
        if (!data) {
            try {
                const userId = ApiClient.getCurrentUserId();
                data = await ApiClient.getJSON(ApiClient.getUrl(`Users/${userId}/Items/${itemId}`));
                cache.set(itemId, data);
            } catch (err) {
                card.classList.remove('rating-processed');
                return;
            }
        }

        const critic = data.CriticRating;
        const community = data.CommunityRating;

        if (!critic && !community) {
            const newBadge = card.querySelector('.jf-badge-new');
            if (newBadge) {
                const container = getOrCreateContainer(cardBox);
                container.appendChild(newBadge);
            }
            return;
        }

        const container = getOrCreateContainer(cardBox);

        const externalNewBadge = card.querySelector('.jf-badge-new');
        if (externalNewBadge && !container.contains(externalNewBadge)) {
            container.appendChild(externalNewBadge);
        }

        const icons = getIcons();

        if (critic) {
            const isFresh = critic >= 60;
            const badge = document.createElement('div');
            badge.className = `jf-rating-badge ${isFresh ? 'jf-rating-fresh' : 'jf-rating-critic'}`;
            badge.innerHTML = `${icons.tomato} ${critic}%`;
            container.appendChild(badge);
        }

        if (community) {
            const badge = document.createElement('div');
            badge.className = 'jf-rating-badge jf-rating-community';
            badge.innerHTML = `${icons.imdb} ${community.toFixed(1)}`;
            container.appendChild(badge);
        }
    };

    const init = () => {
        ensureStyles();
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) {
                        if (node.classList.contains('card')) processCard(node);
                        else node.querySelectorAll('.card').forEach(processCard);
                    }
                });
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
        document.querySelectorAll('.card').forEach(processCard);
    };

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        init();
    } else {
        window.addEventListener('DOMContentLoaded', init);
    }
})();
