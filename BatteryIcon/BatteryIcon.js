(function () {
    'use strict';

    const injectStyles = () => {
        if (document.getElementById('jf-header-battery-styles')) return;
        const style = document.createElement('style');
        style.id = 'jf-header-battery-styles';
        style.textContent = `
            #jf-header-battery {
                display: flex;
                align-items: center;
                justify-content: center;
                margin-right: 12px;
                padding: 4px 10px;
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 8px;
                color: #fff;
                cursor: default;
                transition: background 0.2s, opacity 0.3s;
                font-family: 'Inter', system-ui, sans-serif;
            }
            #jf-header-battery:hover {
                background: rgba(255, 255, 255, 0.1);
            }
            .jf-batt-icon {
                font-size: 1.3em !important;
                margin-right: 4px;
                transition: color 0.3s;
                opacity: 0.9;
            }
            .jf-batt-text {
                font-size: 0.95em;
                font-weight: 600;
                min-width: 38px;
                text-align: right;
            }
            
            .jf-batt-good .jf-batt-icon { color: #20c060; animation: batt-charge 2s infinite alternate ease-in-out; }
            .jf-batt-warn .jf-batt-icon { color: #facc15; }
            .jf-batt-low .jf-batt-icon  { color: #e06060; animation: batt-blink 1s infinite alternate; }

            @keyframes batt-blink {
                0% { opacity: 0.3; }
                100% { opacity: 1; }
            }

            @keyframes batt-charge {
                0% { opacity: 0.7; text-shadow: 0 0 0 rgba(32, 192, 96, 0); }
                100% { opacity: 1; text-shadow: 0 0 12px rgba(32, 192, 96, 0.8); }
            }
        `;
        document.head.appendChild(style);
    };

    const updateBatteryUI = (level, charging, isFallback = false) => {
        const container = document.getElementById('jf-header-battery');
        if (!container) return;

        const percent = Math.round(level * 100);
        const textEl = container.querySelector('.jf-batt-text');
        const iconEl = container.querySelector('.jf-batt-icon');

        textEl.textContent = `${percent}%`;

        container.classList.remove('jf-batt-low', 'jf-batt-warn', 'jf-batt-good');

        let iconName = 'battery_full';

        if (charging && !isFallback) {
            iconName = 'battery_charging_full';
            container.classList.add('jf-batt-good');
            container.title = `Battery: ${percent}% (Charging)`;
        } else {
            if (percent <= 20) {
                iconName = 'battery_alert';
                container.classList.add('jf-batt-low');
            } else if (percent <= 50) {
                iconName = 'battery_3_bar';
                container.classList.add('jf-batt-warn');
            } else if (percent <= 80) {
                iconName = 'battery_5_bar';
            } else {
                iconName = 'battery_full';
            }
            container.title = isFallback ? 'Battery: Power Connected' : `Battery: ${percent}%`;
        }

        iconEl.textContent = iconName;
    };

    const initBatteryMonitor = async () => {
        if ('getBattery' in navigator) {
            try {
                const battery = await navigator.getBattery();
                
                updateBatteryUI(battery.level, battery.charging);

                battery.addEventListener('levelchange', () => {
                    updateBatteryUI(battery.level, battery.charging);
                });
                battery.addEventListener('chargingchange', () => {
                    updateBatteryUI(battery.level, battery.charging);
                });
            } catch (err) {
                console.warn('Battery API blocked or failed, using fallback.');
                updateBatteryUI(1, true, true);
            }
        } else {
            updateBatteryUI(1, true, true);
        }
    };

    const tryInjectHeader = (attempts = 0) => {
        if (document.getElementById('jf-header-battery')) return;
        if (attempts > 20) return; 

        const headerRight = document.querySelector('.headerRight');
        
        if (!headerRight) {
            setTimeout(() => tryInjectHeader(attempts + 1), 500);
            return;
        }

        const container = document.createElement('div');
        container.id = 'jf-header-battery';
        
        container.innerHTML = `
            <span class="material-icons jf-batt-icon" style="opacity: 0.5; animation: batt-blink 1s infinite alternate;">battery_charging_full</span>
            <span class="jf-batt-text">...</span>
        `;
        
        headerRight.insertBefore(container, headerRight.firstChild);

        initBatteryMonitor();
    };

    const init = () => {
        injectStyles();
        
        const observer = new MutationObserver(() => {
            if (!document.getElementById('jf-header-battery')) {
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
