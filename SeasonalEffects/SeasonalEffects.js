(function () {
    'use strict';
  
    const IS_NORTHERN_HEMISPHERE = true; 
    
    const PARTICLE_COUNT = 35; 

    const CONTAINER_ID = 'jf-seasonal-overlay';
    const STYLE_ID = 'jf-seasonal-style';

    function getCurrentSeason() {
        const month = new Date().getMonth();
        let season = '';

        if ([11, 0, 1].includes(month)) season = 'winter';
        else if ([2, 3, 4].includes(month)) season = 'spring';
        else if ([5, 6, 7].includes(month)) season = 'summer';
        else if ([8, 9, 10].includes(month)) season = 'autumn';

        if (!IS_NORTHERN_HEMISPHERE) {
            const swap = { 'winter': 'summer', 'spring': 'autumn', 'summer': 'winter', 'autumn': 'spring' };
            season = swap[season];
        }

        return season;
    }

    function injectCSS(season) {
        if (document.getElementById(STYLE_ID)) return;

        const style = document.createElement('style');
        style.id = STYLE_ID;
        
        let css = `
            #${CONTAINER_ID} {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                pointer-events: none;
                z-index: 100;
                overflow: hidden;
            }
            .jf-particle {
                position: absolute;
                pointer-events: none;
                user-select: none;
            }
        `;

        if (season === 'winter') {
            css += `
                .jf-particle {
                    background: #ffffff;
                    border-radius: 50%;
                    opacity: 0.6;
                    box-shadow: 0 0 4px #ffffff;
                    animation: jf-fall linear infinite;
                }
                @keyframes jf-fall {
                    0% { transform: translate3d(0, -10vh, 0); opacity: 0; }
                    10% { opacity: 0.6; }
                    90% { opacity: 0.6; }
                    100% { transform: translate3d(20px, 110vh, 0); opacity: 0; }
                }
            `;
        } else if (season === 'spring') {
            css += `
                .jf-particle {
                    background: #ffb7c5;
                    border-radius: 15px 0 15px 0;
                    opacity: 0.7;
                    animation: jf-drift linear infinite;
                }
                @keyframes jf-drift {
                    0% { transform: translate3d(0, -10vh, 0) rotate(0deg); opacity: 0; }
                    20% { opacity: 0.8; }
                    80% { opacity: 0.8; }
                    100% { transform: translate3d(100px, 110vh, 0) rotate(360deg); opacity: 0; }
                }
            `;
        } else if (season === 'autumn') {
            css += `
                .jf-particle {
                    border-radius: 2px;
                    opacity: 0.8;
                    animation: jf-tumble linear infinite;
                }
                @keyframes jf-tumble {
                    0% { transform: translate3d(0, -10vh, 0) rotateX(0deg) rotateY(0deg); opacity: 0; }
                    10% { opacity: 0.8; }
                    90% { opacity: 0.8; }
                    100% { transform: translate3d(-50px, 110vh, 0) rotateX(360deg) rotateY(180deg); opacity: 0; }
                }
            `;
        } else if (season === 'summer') {
            css += `
                .jf-particle {
                    background: #ffea00;
                    border-radius: 50%;
                    box-shadow: 0 0 8px 2px rgba(255, 234, 0, 0.6);
                    animation: jf-float-up linear infinite;
                }
                @keyframes jf-float-up {
                    0% { transform: translate3d(0, 110vh, 0) scale(0.5); opacity: 0; }
                    50% { opacity: 0.6; transform: translate3d(30px, 50vh, 0) scale(1.2); }
                    100% { transform: translate3d(-30px, -10vh, 0) scale(0.5); opacity: 0; }
                }
            `;
        }

        style.textContent = css;
        document.head.appendChild(style);
    }

    function createParticles(season) {
        let container = document.getElementById(CONTAINER_ID);
        if (container) container.remove();

        container = document.createElement('div');
        container.id = CONTAINER_ID;

        const autumnColors = ['#e07a5f', '#f2cc8f', '#d00000', '#eb5e28'];

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const particle = document.createElement('div');
            particle.className = 'jf-particle';

            const left = Math.random() * 100;
            const animationDuration = 5 + Math.random() * 10;
            const animationDelay = Math.random() * 10;
            const size = 4 + Math.random() * 8;

            particle.style.left = `${left}vw`;
            particle.style.animationDuration = `${animationDuration}s`;
            particle.style.animationDelay = `-${animationDelay}s`;

            if (season === 'autumn') {
                particle.style.width = `${size + 4}px`;
                particle.style.height = `${size + 4}px`;
                particle.style.backgroundColor = autumnColors[Math.floor(Math.random() * autumnColors.length)];
            } else if (season === 'spring') {
                particle.style.width = `${size + 2}px`;
                particle.style.height = `${size + 6}px`;
            } else if (season === 'summer') {
                particle.style.width = `${size / 2}px`;
                particle.style.height = `${size / 2}px`;
            } else {
                particle.style.width = `${size}px`;
                particle.style.height = `${size}px`;
            }

            container.appendChild(particle);
        }

        document.body.appendChild(container);
    }

    function init() {
        if (document.getElementById(CONTAINER_ID)) return;
        
        const season = getCurrentSeason();
        console.log(`Jellyfin Seasonal Styles: Initializing ${season} theme.`);
        
        injectCSS(season);
        createParticles(season);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
