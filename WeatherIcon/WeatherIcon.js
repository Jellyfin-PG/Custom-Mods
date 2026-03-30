(function () {
    'use strict';

    const injectStyles = () => {
        if (document.getElementById('jf-header-weather-styles')) return;
        const style = document.createElement('style');
        style.id = 'jf-header-weather-styles';
        style.textContent = `
            #jf-header-weather {
                display: flex;
                align-items: center;
                justify-content: center;
                margin-right: 12px;
                padding: 4px 8px;
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 8px;
                color: #fff;
                cursor: default;
                transition: background 0.2s;
            }
            #jf-header-weather:hover {
                background: rgba(255, 255, 255, 0.1);
            }
            #jf-header-weather .jf-hw-temp {
                font-size: 0.95em;
                font-weight: 600;
                margin-left: 6px;
                font-family: 'Inter', system-ui, sans-serif;
            }

            /* Animations */
            @keyframes hw-spin { 100% { transform: rotate(360deg); } }
            @keyframes hw-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
            @keyframes hw-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
            @keyframes hw-rain { 0% { transform: translateY(-1px); opacity: 0; } 50% { opacity: 1; } 100% { transform: translateY(3px); opacity: 0; } }

            .hw-anim-sun { animation: hw-spin 20s linear infinite; color: #ffd700; }
            .hw-anim-cloud { animation: hw-float 4s ease-in-out infinite; color: #b0c4de; }
            .hw-anim-rain { animation: hw-rain 1.5s linear infinite; color: #4db8ff; }
            .hw-anim-storm { animation: hw-pulse 2s ease-in-out infinite; color: #a463ff; }
            .hw-anim-snow { animation: hw-spin 10s linear infinite; color: #ffffff; }
        `;
        document.head.appendChild(style);
    };

    const getWeatherMap = (code) => {
        if (code === 0) return { i: 'wb_sunny', c: 'hw-anim-sun', d: 'Clear' };
        if (code >= 1 && code <= 3) return { i: 'cloud', c: 'hw-anim-cloud', d: 'Cloudy' };
        if (code >= 45 && code <= 48) return { i: 'foggy', c: 'hw-anim-cloud', d: 'Fog' };
        if (code >= 51 && code <= 67 || code >= 80 && code <= 82) return { i: 'water_drop', c: 'hw-anim-rain', d: 'Rain' };
        if (code >= 71 && code <= 77 || code >= 85 && code <= 86) return { i: 'ac_unit', c: 'hw-anim-snow', d: 'Snow' };
        if (code >= 95) return { i: 'bolt', c: 'hw-anim-storm', d: 'Storm' };
        return { i: 'wb_sunny', c: 'hw-anim-sun', d: 'Clear' };
    };

    const fetchHeaderWeather = async (container) => {
        try {
            const geoRes = await fetch('https://get.geojs.io/v1/ip/geo.json');
            if (!geoRes.ok) throw new Error('Location fetch failed');
            const geoData = await geoRes.json();
            
            const wtRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${geoData.latitude}&longitude=${geoData.longitude}&current=temperature_2m,weather_code&temperature_unit=fahrenheit&timezone=auto`);
            if (!wtRes.ok) throw new Error('Weather fetch failed');
            const data = await wtRes.json();

            const wMap = getWeatherMap(data.current.weather_code);
            const temp = Math.round(data.current.temperature_2m);

            container.innerHTML = `
                <span class="material-icons ${wMap.c}" style="font-size: 1.4em;">${wMap.i}</span>
                <span class="jf-hw-temp">${temp}°</span>
            `;
            container.title = `${wMap.d} in ${geoData.city}`;

        } catch (e) {
            console.error("Header Weather Error:", e);
            container.innerHTML = `<span class="material-icons" style="font-size: 1.4em; opacity: 0.5;">cloud_off</span>`;
            container.title = "Weather unavailable";
        }
    };

    const tryInjectHeader = (attempts = 0) => {
        if (document.getElementById('jf-header-weather')) return;
        if (attempts > 20) return;

        const headerRight = document.querySelector('.headerRight');
        
        if (!headerRight) {
            setTimeout(() => tryInjectHeader(attempts + 1), 500);
            return;
        }

        const container = document.createElement('div');
        container.id = 'jf-header-weather';
        container.innerHTML = `<span class="material-icons" style="font-size: 1.4em; opacity: 0.5; animation: hw-spin 2s linear infinite;">sync</span>`;
        
        headerRight.insertBefore(container, headerRight.firstChild);

        fetchHeaderWeather(container);
    };

    const init = () => {
        injectStyles();
        
        const observer = new MutationObserver(() => {
            if (!document.getElementById('jf-header-weather')) {
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
