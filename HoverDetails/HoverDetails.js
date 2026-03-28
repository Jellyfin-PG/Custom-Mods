(function () {
    'use strict';

    const STYLE_ID = 'jf-hover-tooltip-style';
    const TOOLTIP_ID = 'jf-hover-tooltip';
    let hoverTimer = null;
    let currentCard = null;
    let lastMouseX = 0;
    let lastMouseY = 0;

    function injectCSS() {
        if (document.getElementById(STYLE_ID)) return;
        
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
            #${TOOLTIP_ID} {
                position: fixed;
                z-index: 99999;
                background: rgba(15, 15, 15, 0.95);
                color: #fff;
                padding: 16px;
                border-radius: 10px;
                width: 320px;
                box-shadow: 0 12px 40px rgba(0,0,0,0.8);
                border: 1px solid rgba(255,255,255,0.15);
                backdrop-filter: blur(12px);
                pointer-events: none;
                opacity: 0;
                transition: opacity 0.2s ease-in-out;
                display: none;
                font-family: sans-serif;
            }
            #${TOOLTIP_ID}.visible {
                opacity: 1;
                display: block;
            }
            .jf-tooltip-title {
                font-size: 1.15em;
                font-weight: 800;
                margin: 0 0 6px 0;
                color: #fff;
                line-height: 1.2;
            }
            .jf-tooltip-meta {
                font-size: 0.8em;
                color: #10b981;
                margin-bottom: 10px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .jf-tooltip-overview {
                font-size: 0.85em;
                line-height: 1.5;
                color: #d1d5db;
                display: -webkit-box;
                -webkit-line-clamp: 6;
                -webkit-box-orient: vertical;
                overflow: hidden;
            }
        `;
        document.head.appendChild(style);
    }

    function createTooltipElement() {
        let tooltip = document.getElementById(TOOLTIP_ID);
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = TOOLTIP_ID;
            document.body.appendChild(tooltip);
        }
        return tooltip;
    }

    async function fetchItemDetails(itemId) {
        if (typeof ApiClient === 'undefined') return null;
        const userId = ApiClient.getCurrentUserId();
        if (!userId) return null;

        try {
            return await ApiClient.getJSON(ApiClient.getUrl(`Users/${userId}/Items/${itemId}`));
        } catch (err) {
            console.error("Hover Tooltip: Error fetching item details", err);
            return null;
        }
    }

    function showTooltip(item) {
        const tooltip = createTooltipElement();
        
        const year = item.ProductionYear || '';
        const rating = item.CommunityRating ? `⭐ ${item.CommunityRating.toFixed(1)}` : '';
        const genres = item.Genres && item.Genres.length > 0 ? item.Genres.slice(0, 3).join(', ') : '';
        const overview = item.Overview || 'No synopsis available for this item.';

        let metaString = [year, rating, genres].filter(Boolean).join(' <span style="color:#666;">|</span> ');

        tooltip.innerHTML = `
            <div class="jf-tooltip-title">${item.Name}</div>
            <div class="jf-tooltip-meta">${metaString}</div>
            <div class="jf-tooltip-overview">${overview}</div>
        `;

        let x = lastMouseX + 15;
        let y = lastMouseY + 15;

        if (x + 340 > window.innerWidth) { x = lastMouseX - 335; }
        if (y + 200 > window.innerHeight) { y = lastMouseY - 180; }

        tooltip.style.left = x + 'px';
        tooltip.style.top = y + 'px';
        tooltip.classList.add('visible');
    }

    function hideTooltip() {
        const tooltip = document.getElementById(TOOLTIP_ID);
        if (tooltip) {
            tooltip.classList.remove('visible');
        }
    }

    function processHoverEvents() {
        const cards = document.querySelectorAll('.card:not(.hover-tooltip-processed)');
        
        cards.forEach(card => {
            card.classList.add('hover-tooltip-processed');
            
            const itemId = card.getAttribute('data-id');
            const itemType = card.getAttribute('data-type');
            
            if (!itemId || !['Movie', 'Series', 'Episode'].includes(itemType)) return;

            card.addEventListener('mouseenter', (e) => {
                currentCard = card;
                lastMouseX = e.clientX;
                lastMouseY = e.clientY;
                
                hoverTimer = setTimeout(async () => {
                    if (currentCard === card) {
                        const itemDetails = await fetchItemDetails(itemId);
                        
                        if (itemDetails && currentCard === card) {
                            showTooltip(itemDetails);
                        }
                    }
                }, 800); 
            });

            card.addEventListener('mousemove', (e) => {
                lastMouseX = e.clientX;
                lastMouseY = e.clientY;
                
                const tooltip = document.getElementById(TOOLTIP_ID);
                if (tooltip && tooltip.classList.contains('visible')) {
                    let x = lastMouseX + 15;
                    let y = lastMouseY + 15;
                    
                    if (x + 340 > window.innerWidth) x = lastMouseX - 335;
                    if (y + 200 > window.innerHeight) y = lastMouseY - 180;
                    
                    tooltip.style.left = x + 'px';
                    tooltip.style.top = y + 'px';
                }
            });

            card.addEventListener('mouseleave', () => {
                currentCard = null;
                clearTimeout(hoverTimer);
                hideTooltip();
            });
        });
    }

    function init() {
        injectCSS();
        processHoverEvents();
    }

    const observer = new MutationObserver(() => {
        if (document.querySelector('.card:not(.hover-tooltip-processed)')) {
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
