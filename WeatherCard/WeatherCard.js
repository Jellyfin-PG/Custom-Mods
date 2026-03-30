(function () {
    'use strict';

    const injectStyles = () => {
        if (document.getElementById('jf-weather-card-styles')) return;
        const style = document.createElement('style');
        style.id = 'jf-weather-card-styles';
        style.textContent = `
            #jf-weather-card {
                display: flex;
                flex-direction: column;
                background: rgba(20, 20, 20, 0.6);
                backdrop-filter: blur(20px) saturate(1.2);
                -webkit-backdrop-filter: blur(20px) saturate(1.2);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 14px;
                padding: 24px;
                margin: 20px 3.3%;
                color: #fff;
                box-shadow: 0 10px 30px rgba(0,0,0,0.4);
                font-family: 'Inter', system-ui, sans-serif;
                transition: opacity 0.4s ease, transform 0.4s ease;
            }
            .jf-wt-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 20px; }
            .jf-wt-time-container { display: flex; flex-direction: column; }
            .jf-wt-time { font-size: 3.2rem; font-weight: 700; line-height: 1; letter-spacing: -0.02em; }
            .jf-wt-date { font-size: 1rem; opacity: 0.6; font-weight: 500; margin-top: 4px; letter-spacing: 0.05em; text-transform: uppercase; }
            .jf-wt-city { font-size: 0.85rem; opacity: 0.8; font-weight: 600; margin-top: 8px; color: #00a4dc; display: flex; align-items: center; gap: 4px; }
            .jf-wt-city .material-icons { font-size: 14px; }
            
            .jf-wt-current { display: flex; align-items: center; gap: 16px; text-align: right; }
            .jf-wt-current-icon .material-icons { font-size: 3.5rem; text-shadow: 0 0 20px rgba(255,255,255,0.2); }
            .jf-wt-current-temp { font-size: 2.5rem; font-weight: 600; line-height: 1; }
            .jf-wt-current-desc { font-size: 0.9rem; opacity: 0.6; font-weight: 500; margin-top: 4px; }

            .jf-wt-forecast { display: flex; justify-content: space-between; gap: 10px; }
            .jf-wt-day { display: flex; flex-direction: column; align-items: center; flex: 1; background: rgba(255,255,255,0.03); padding: 12px 0; border-radius: 10px; }
            .jf-wt-day-name { font-size: 0.8rem; opacity: 0.7; font-weight: 600; text-transform: uppercase; margin-bottom: 8px; }
            .jf-wt-day .material-icons { font-size: 1.8rem; margin-bottom: 8px; opacity: 0.9; }
            .jf-wt-day-temps { font-size: 0.9rem; font-weight: 600; display: flex; gap: 8px; }
            .jf-wt-high { color: #fff; }
            .jf-wt-low { opacity: 0.5; }

            @keyframes w-spin { 100% { transform: rotate(360deg); } }
            @keyframes w-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
            @keyframes w-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
            @keyframes w-rain { 0% { transform: translateY(-2px); opacity: 0; } 50% { opacity: 1; } 100% { transform: translateY(6px); opacity: 0; } }

            .anim-sun { animation: w-spin 20s linear infinite; color: #ffd700; }
            .anim-cloud { animation: w-float 4s ease-in-out infinite; color: #b0c4de; }
            .anim-rain { animation: w-rain 1.5s linear infinite; color: #4db8ff; }
            .anim-storm { animation: w-pulse 2s ease-in-out infinite; color: #a463ff; }
            .anim-snow { animation: w-spin 10s linear infinite; color: #ffffff; }

            @media(max-width: 768px) {
                #jf-weather-card { padding: 16px; margin: 10px 2%; }
                .jf-wt-time { font-size: 2.2rem; }
                .jf-wt-current-icon .material-icons { font-size: 2.5rem; }
                .jf-wt-current-temp { font-size: 1.8rem; }
                .jf-wt-day { padding: 8px 0; }
                .jf-wt-day .material-icons { font-size: 1.4rem; }
                .jf-wt-day-temps { font-size: 0.8rem; flex-direction: column; gap: 2px; align-items: center; }
            }
        `;
        document.head.appendChild(style);
    };

    const getWeatherMap = (code) => {
        if (code === 0) return { i: 'wb_sunny', c: 'anim-sun', d: 'Clear' };
        if (code >= 1 && code <= 3) return { i: 'cloud', c: 'anim-cloud', d: 'Cloudy' };
        if (code >= 45 && code <= 48) return { i: 'foggy', c: 'anim-cloud', d: 'Fog' };
        if (code >= 51 && code <= 67 || code >= 80 && code <= 82) return { i: 'water_drop', c: 'anim-rain', d: 'Rain' };
        if (code >= 71 && code <= 77 || code >= 85 && code <= 86) return { i: 'ac_unit', c: 'anim-snow', d: 'Snow' };
        if (code >= 95) return { i: 'bolt', c: 'anim-storm', d: 'Storm' };
        return { i: 'wb_sunny', c: 'anim-sun', d: 'Clear' };
    };

    const buildCard = (targetContainer) => {
        if (document.getElementById('jf-weather-card')) return;
        
        const card = document.createElement('div');
        card.id = 'jf-weather-card';
        card.innerHTML = `
            <div class="jf-wt-top">
                <div class="jf-wt-time-container">
                    <div class="jf-wt-time" id="jf-wt-clock">--:--</div>
                    <div class="jf-wt-date" id="jf-wt-date">--</div>
                    <div class="jf-wt-city" id="jf-wt-city"><span class="material-icons">location_on</span> Locating...</div>
                </div>
                <div class="jf-wt-current">
                    <div class="jf-wt-current-desc-container">
                        <div class="jf-wt-current-temp" id="jf-wt-temp">--°</div>
                        <div class="jf-wt-current-desc" id="jf-wt-desc">--</div>
                    </div>
                    <div class="jf-wt-current-icon" id="jf-wt-icon"></div>
                </div>
            </div>
            <div class="jf-wt-forecast" id="jf-wt-forecast-box"></div>
        `;
        
        targetContainer.insertBefore(card, targetContainer.firstChild);
        
        updateTime();
        fetchLocationAndWeather();
    };

    const tryInject = (attempts = 0) => {
        if (document.getElementById('jf-weather-card')) return;
        if (attempts > 15) return;

        const homePage = document.querySelector('.homePage');
        if (!homePage) {
            setTimeout(() => tryInject(attempts + 1), 500);
            return;
        }

        const targetContainer = homePage.querySelector('.section0') || 
                                homePage.querySelector('.padded-left') || 
                                homePage.querySelector('.scrollSlider') || 
                                homePage.firstElementChild;

        if (!targetContainer) {
            setTimeout(() => tryInject(attempts + 1), 500);
            return;
        }

        buildCard(targetContainer);
    };

    const updateTime = () => {
        const clockEl = document.getElementById('jf-wt-clock');
        const dateEl = document.getElementById('jf-wt-date');
        if (!clockEl || !dateEl) return;

        const now = new Date();
        clockEl.textContent = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
        dateEl.textContent = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
        
        setTimeout(updateTime, 1000 * (60 - now.getSeconds()));
    };

    const fetchLocationAndWeather = async () => {
        try {
            const geoRes = await fetch('https://get.geojs.io/v1/ip/geo.json');
            if (!geoRes.ok) throw new Error('Location fetch failed');
            const geoData = await geoRes.json();
            
            const lat = geoData.latitude;
            const lon = geoData.longitude;
            
            const cityEl = document.getElementById('jf-wt-city');
            if (cityEl) {
                cityEl.innerHTML = `<span class="material-icons">location_on</span> ${geoData.city}, ${geoData.region}`;
            }

            const wtRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&timezone=auto`);
            if (!wtRes.ok) throw new Error('Weather fetch failed');
            const data = await wtRes.json();

            const currentMap = getWeatherMap(data.current.weather_code);
            document.getElementById('jf-wt-temp').textContent = `${Math.round(data.current.temperature_2m)}°`;
            document.getElementById('jf-wt-desc').textContent = currentMap.d;
            document.getElementById('jf-wt-icon').innerHTML = `<span class="material-icons ${currentMap.c}">${currentMap.i}</span>`;

            const forecastBox = document.getElementById('jf-wt-forecast-box');
            let forecastHTML = '';
            
            for (let i = 1; i <= 5; i++) {
                const date = new Date(data.daily.time[i] + 'T00:00:00');
                const dayName = date.toLocaleDateString([], { weekday: 'short' });
                const dayMap = getWeatherMap(data.daily.weather_code[i]);
                const high = Math.round(data.daily.temperature_2m_max[i]);
                const low = Math.round(data.daily.temperature_2m_min[i]);

                forecastHTML += `
                    <div class="jf-wt-day">
                        <div class="jf-wt-day-name">${dayName}</div>
                        <span class="material-icons ${dayMap.c}">${dayMap.i}</span>
                        <div class="jf-wt-day-temps">
                            <span class="jf-wt-high">${high}°</span>
                            <span class="jf-wt-low">${low}°</span>
                        </div>
                    </div>
                `;
            }
            forecastBox.innerHTML = forecastHTML;

        } catch (e) {
            console.error(e);
            const cityEl = document.getElementById('jf-wt-city');
            if (cityEl) cityEl.innerHTML = `<span class="material-icons">error_outline</span> Location Unavailable`;
        }
    };

    const init = () => {
        injectStyles();
        const checkPage = () => {
            if (window.location.hash.includes('home') || window.location.hash === '' || window.location.hash === '#/') {
                tryInject(0);
            }
        };
        
        window.addEventListener('hashchange', checkPage);
        document.addEventListener('viewshow', checkPage);
        
        checkPage();
    };

    init();

})();
