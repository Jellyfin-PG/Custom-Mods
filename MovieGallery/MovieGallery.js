(function () {
    'use strict';

    var galleryTimeout = parseInt("{{GALLERY_TIMEOUT}}") || 6000;
    const STYLE_ID = 'jf-slideshow-styles';
    const SLIDESHOW_ID = 'jf-custom-slideshow';
    
    let isFetching = false;
    let slideshowInterval = null;

    function injectCSS() {
        if (document.getElementById(STYLE_ID)) return;
        
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
            #${SLIDESHOW_ID} {
                position: relative;
                width: calc(100% - 4%);
                margin: 1em 2%;
                height: 450px;
                border-radius: var(--rounding-lg, 12px);
                overflow: hidden;
                box-shadow: 0 10px 20px rgba(0,0,0,0.6);
                z-index: 100;
            }
            .jf-slide {
                position: absolute;
                top: 0; left: 0;
                width: 100%; height: 100%;
                opacity: 0;
                
                /* THE FIX: Ignore clicks on invisible slides */
                pointer-events: none; 
                z-index: 1;
                
                transition: opacity 1.2s ease-in-out;
                background-size: cover;
                background-position: center 20%;
                display: flex;
                align-items: flex-end;
                cursor: pointer;
            }
            .jf-slide.active { 
                opacity: 1; 
                
                /* THE FIX: Re-enable clicks for the visible slide */
                pointer-events: auto; 
                z-index: 10;
            }
            .jf-slide-overlay {
                width: 100%;
                padding: 80px 40px 30px;
                background: linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.5) 60%, transparent 100%);
                color: #fff;
                transition: padding-bottom 0.3s ease;
            }
            .jf-slide:hover .jf-slide-overlay {
                padding-bottom: 40px;
            }
            .jf-slide-title { font-size: 2.8em; font-weight: 700; margin: 0 0 10px 0; text-shadow: 2px 2px 5px rgba(0,0,0,0.8); }
            .jf-slide-meta { font-size: 1.2em; color: #ddd; font-weight: 600; text-shadow: 1px 1px 3px rgba(0,0,0,0.8); }
            .jf-rating { color: #facc15; margin-right: 15px; }
        `;
        document.head.appendChild(style);
    }

    async function fetchRecommendedMovies() {
        if (typeof ApiClient === 'undefined') return [];
        const userId = ApiClient.getCurrentUserId();
        if (!userId) return [];
        
        try {
            const response = await ApiClient.getJSON(ApiClient.getUrl(`Users/${userId}/Items`, {
                IncludeItemTypes: 'Movie',
                Limit: 5,
                SortBy: 'Random',
                Filters: 'IsUnplayed',
                Fields: 'CommunityRating,ProductionYear',
                Recursive: true,
                ImageTypes: 'Backdrop'
            }));
            return response.Items || [];
        } catch (err) {
            console.error("Slideshow: Error fetching items:", err);
            return [];
        }
    }

    function renderSlideshow(items, insertTarget) {
        if (document.getElementById(SLIDESHOW_ID)) return;
        if (!items || items.length === 0) return;

        const container = document.createElement('div');
        container.id = SLIDESHOW_ID;

        items.forEach((item, index) => {
            const slide = document.createElement('div');
            slide.className = 'jf-slide' + (index === 0 ? ' active' : '');
            
            const imgUrl = ApiClient.getImageUrl(item.Id, { type: 'Backdrop', maxWidth: 1920 });
            slide.style.backgroundImage = `url('${imgUrl}')`;
            
            const rating = item.CommunityRating ? `<span class="jf-rating">⭐ ${item.CommunityRating.toFixed(1)}</span>` : '';
            const year = item.ProductionYear || '';

            slide.innerHTML = `
                <div class="jf-slide-overlay">
                    <h2 class="jf-slide-title">${item.Name}</h2>
                    <div class="jf-slide-meta">${rating} <span>${year}</span></div>
                </div>
            `;

            slide.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.hash = `#!/details?id=${item.Id}`;
            });

            container.appendChild(slide);
        });

        insertTarget.parentNode.insertBefore(container, insertTarget);

        let currentIdx = 0;
        const slides = container.querySelectorAll('.jf-slide');
        
        if (slideshowInterval) clearInterval(slideshowInterval);
        
        slideshowInterval = setInterval(() => {
            if(!document.getElementById(SLIDESHOW_ID)) {
                clearInterval(slideshowInterval);
                return;
            }
            slides[currentIdx].classList.remove('active');
            currentIdx = (currentIdx + 1) % slides.length;
            slides[currentIdx].classList.add('active');
        }, galleryTimeout);
    }

    async function triggerBuild(insertTarget) {
        if (isFetching || document.getElementById(SLIDESHOW_ID)) return;
        if (typeof ApiClient === 'undefined' || !ApiClient.getCurrentUserId()) return;

        isFetching = true;
        injectCSS();
        
        const movies = await fetchRecommendedMovies();
        
        if (movies.length > 0 && document.body.contains(insertTarget)) {
            renderSlideshow(movies, insertTarget);
        }
        
        isFetching = false;
    }

    function init() {
        if (!document.body) return;

        const isHomePageURL = window.location.hash === '' || window.location.hash === '#!' || window.location.hash.includes('home');
        const activePage = document.querySelector('.page.is-active, .homePage');
        
        const isActuallyHomePage = isHomePageURL && activePage && (activePage.classList.contains('homePage') || activePage.id.includes('home'));

        if (!isActuallyHomePage) {
            if (slideshowInterval) {
                clearInterval(slideshowInterval);
                slideshowInterval = null;
            }
            return;
        }

        const insertTarget = activePage.querySelector('.section, .padded-left, .emby-scroller');
        
        if (insertTarget && !document.getElementById(SLIDESHOW_ID)) {
            triggerBuild(insertTarget);
        }
    }

    const start = () => {
        const observer = new MutationObserver(() => init());
        observer.observe(document.body, { childList: true, subtree: true });
        init();
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
})();
