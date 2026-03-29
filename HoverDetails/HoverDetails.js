(function () {
    'use strict';

    const STYLE_ID = 'jf-hover-tooltip-style';
    const TOOLTIP_ID = 'jf-hover-tooltip';
    const PROCESSED = 'hover-tooltip-processed';
    const VALID_TYPES = new Set(['Movie', 'Series', 'Episode']);

    let hoverTimer = null;
    let currentCard = null;
    let mx = 0, my = 0;

    const $ = id => document.getElementById(id);
    const css = `#${TOOLTIP_ID}{position:fixed;z-index:99999;background:rgba(15,15,15,.95);color:#fff;padding:16px;border-radius:10px;width:320px;box-shadow:0 12px 40px rgba(0,0,0,.8);border:1px solid rgba(255,255,255,.15);backdrop-filter:blur(12px);pointer-events:none;opacity:0;transition:opacity .2s ease-in-out;display:none;font-family:sans-serif}#${TOOLTIP_ID}.visible{opacity:1;display:block}.jf-tooltip-title{font-size:1.15em;font-weight:800;margin:0 0 6px;color:#fff;line-height:1.2}.jf-tooltip-meta{font-size:.8em;color:#10b981;margin-bottom:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px}.jf-tooltip-overview{font-size:.85em;line-height:1.5;color:#d1d5db;display:-webkit-box;-webkit-line-clamp:6;-webkit-box-orient:vertical;overflow:hidden}`;

    const injectCSS = () => {
        if ($('jf-hover-tooltip-style')) return;
        const s = document.createElement('style');
        s.id = STYLE_ID;
        s.textContent = css;
        document.head.appendChild(s);
    };

    const getTooltip = () => {
        let t = $(TOOLTIP_ID);
        if (!t) { t = document.createElement('div'); t.id = TOOLTIP_ID; document.body.appendChild(t); }
        return t;
    };

    const hideTooltip = () => {
        const t = $(TOOLTIP_ID);
        if (t) t.classList.remove('visible');
    };

    const positionTooltip = (t) => {
        let x = mx + 15, y = my + 15;
        if (x + 340 > window.innerWidth) x = mx - 335;
        if (y + 200 > window.innerHeight) y = my - 180;
        t.style.left = x + 'px';
        t.style.top = y + 'px';
    };

    const showTooltip = item => {
        const t = getTooltip();
        const meta = [
            item.ProductionYear || '',
            item.CommunityRating ? `⭐ ${item.CommunityRating.toFixed(1)}` : '',
            item.Genres?.slice(0, 3).join(', ') || ''
        ].filter(Boolean).join(' <span style="color:#666">|</span> ');

        t.innerHTML = `<div class="jf-tooltip-title">${item.Name}</div><div class="jf-tooltip-meta">${meta}</div><div class="jf-tooltip-overview">${item.Overview || 'No synopsis available.'}</div>`;
        positionTooltip(t);
        t.classList.add('visible');
    };

    const fetchItem = async id => {
        if (typeof ApiClient === 'undefined') return null;
        const uid = ApiClient.getCurrentUserId();
        if (!uid) return null;
        try { return await ApiClient.getJSON(ApiClient.getUrl(`Users/${uid}/Items/${id}`)); }
        catch { return null; }
    };

    const processCards = () => {
        document.querySelectorAll(`.card:not(.${PROCESSED})`).forEach(card => {
            card.classList.add(PROCESSED);
            const id = card.getAttribute('data-id');
            const type = card.getAttribute('data-type');
            if (!id || !VALID_TYPES.has(type)) return;

            card.addEventListener('mouseenter', e => {
                currentCard = card;
                mx = e.clientX; my = e.clientY;
                hoverTimer = setTimeout(async () => {
                    if (currentCard !== card) return;
                    const item = await fetchItem(id);
                    if (item && currentCard === card) showTooltip(item);
                }, 800);
            });

            card.addEventListener('mousemove', e => {
                mx = e.clientX; my = e.clientY;
                const t = $(TOOLTIP_ID);
                if (t?.classList.contains('visible')) positionTooltip(t);
            });

            card.addEventListener('mouseleave', () => {
                currentCard = null;
                clearTimeout(hoverTimer);
                hideTooltip();
            });
        });
    };

    const onNavigate = () => {
        clearTimeout(hoverTimer);
        currentCard = null;
        hideTooltip();
        processCards();
    };

    const observer = new MutationObserver(() => {
        if (document.querySelector(`.card:not(.${PROCESSED})`)) processCards();
    });

    const init = () => {
        injectCSS();
        observer.observe(document.body, { childList: true, subtree: true });
        processCards();
        window.addEventListener('hashchange', onNavigate);
        window.addEventListener('popstate', onNavigate);
    };

    document.readyState === 'loading'
        ? document.addEventListener('DOMContentLoaded', init)
        : init();
})();
