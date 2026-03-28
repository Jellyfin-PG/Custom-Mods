(function () {
    'use strict';

    let currentItemId = null;
    let styleElement = null;

    function injectDynamicCSS(rgb) {
        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = 'ambient-play-button-styles';
            document.head.appendChild(styleElement);
        }

        const [r, g, b] = rgb;
        const accentColor = `rgb(${r}, ${g}, ${b})`;
        const hoverColor = `rgb(${Math.min(r + 30, 255)}, ${Math.min(g + 30, 255)}, ${Math.min(b + 30, 255)})`;

        styleElement.innerHTML = `
            .btnPlay, .button-submit, .playButton {
                background-color: ${accentColor} !important;
                color: #ffffff !important;
                transition: background-color 0.3s ease !important;
            }

            .btnPlay:hover, .button-submit:hover, .playButton:hover {
                background-color: ${hoverColor} !important;
            }
        `;
    }

    function resetDynamicCSS() {
        if (styleElement) {
            styleElement.innerHTML = '';
        }
    }

    function getAverageColor(imgUrl) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = 64;
                canvas.height = 64;
                ctx.drawImage(img, 0, 0, 64, 64);
                
                let data;
                try {
                    data = ctx.getImageData(0, 0, 64, 64).data;
                } catch (e) {
                    reject("CORS Error");
                    return;
                }

                let r = 0, g = 0, b = 0, count = 0;
                for (let i = 0; i < data.length; i += 4) {
                    if (data[i + 3] < 255 || (data[i] < 30 && data[i+1] < 30 && data[i+2] < 30)) continue;
                    r += data[i];
                    g += data[i + 1];
                    b += data[i + 2];
                    count++;
                }

                if (count === 0) {
                    resolve([0, 164, 220]);
                } else {
                    resolve([
                        Math.min(255, Math.round((r / count) * 1.2)),
                        Math.min(255, Math.round((g / count) * 1.2)),
                        Math.min(255, Math.round((b / count) * 1.2))
                    ]);
                }
            };
            img.onerror = reject;
            img.src = imgUrl;
        });
    }

    async function applyButtonTheme(itemId) {
        if (!itemId) return;
        try {
            const serverUrl = window.ApiClient ? window.ApiClient.serverAddress() : "";
            const imgUrl = `${serverUrl}/Items/${itemId}/Images/Primary?maxWidth=128`; 
            const rgb = await getAverageColor(imgUrl);
            injectDynamicCSS(rgb);
        } catch (error) {
            resetDynamicCSS();
        }
    }

    function getItemId() {
        const url = window.location.href;
        const idMatch = url.match(/[?&]id=([a-zA-Z0-9-]+)/i) || url.match(/\/details\/([a-zA-Z0-9-]+)/i);
        return idMatch ? idMatch[1] : null;
    }

    const observer = new MutationObserver(() => {
        const url = window.location.href.toLowerCase();
        const newItemId = getItemId();

        if (!url.includes('details') && !url.includes('item')) {
            currentItemId = null;
            resetDynamicCSS();
            return;
        }

        if (newItemId && newItemId !== currentItemId) {
            currentItemId = newItemId;
            applyButtonTheme(newItemId);
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });

})();
