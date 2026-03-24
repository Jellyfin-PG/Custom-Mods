(function () {
    const injectCSS = () => {
        if (document.getElementById('custom-slideshow-style')) return;
        
        const style = document.createElement('style');
        style.id = 'custom-slideshow-style';
        style.textContent = `
            .jf-custom-slideshow {
                position: relative;
                width: calc(100% - 4%); /* Aligns with Jellyfin 10.11 padding */
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
                transition: opacity 1.2s ease-in-out;
                background-size: cover;
                background-position: center 20%;
                display: flex;
                align-items: flex-end;
            }
            .jf-slide.active { opacity: 1; }
            .jf-slide-overlay {
                width: 100%;
                padding: 80px 40px 30px;
                background: linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.5) 60%, transparent 100%);
                color: #fff;
            }
            .jf-slide-title { font-size: 2.8em; font-weight: 700; margin: 0 0 10px 0; text-shadow: 2px 2px 5px rgba(0,0,0,0.8); }
            .jf-slide-meta { font-size: 1.2em; color: #ddd; font-weight: 600; text-shadow: 1px 1px 3px rgba(0,0,0,0.8); }
            .jf-rating { color: #facc15; margin-right: 15px; }
        `;
        document.head.appendChild(style);
    };

    const fetchRecommendedMovies = async () => {
        if (typeof ApiClient === 'undefined') {
            console.warn("ApiClient not ready.");
            return [];
        }

        const userId = ApiClient.getCurrentUserId();
        
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
            console.error("Error fetching slideshow items:", err);
            return [];
        }
    };

    const renderSlideshow = (items) => {
        if (!items || items.length === 0) return;
        if (document.querySelector('.jf-custom-slideshow')) return;

        const activePage = document.querySelector('.page.is-active, .homePage');
        if (!activePage || (!activePage.classList.contains('homePage') && !activePage.id.includes('home'))) return;

        const insertTarget = activePage.querySelector('.section, .padded-left, .emby-scroller');
        if (!insertTarget) {
            console.log("Could not find a place to inject the slider.");
            return;
        }

        const container = document.createElement('div');
        container.className = 'jf-custom-slideshow';

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
            container.appendChild(slide);
        });

        insertTarget.parentNode.insertBefore(container, insertTarget);

        let currentIdx = 0;
        const slides = container.querySelectorAll('.jf-slide');
        setInterval(() => {
            if(!document.querySelector('.jf-custom-slideshow')) return;
            slides[currentIdx].classList.remove('active');
            currentIdx = (currentIdx + 1) % slides.length;
            slides[currentIdx].classList.add('active');
        }, 6000);
    };

    const init = async () => {
        if (window.location.hash.includes('home') || window.location.hash === '#!' || window.location.hash === '') {
            injectCSS();
            const movies = await fetchRecommendedMovies();
            renderSlideshow(movies);
        }
    };

    window.addEventListener('hashchange', () => {
        setTimeout(init, 500);
    });
    
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        init();
    } else {
        document.addEventListener('DOMContentLoaded', () => setTimeout(init, 1000));
    }

})();
