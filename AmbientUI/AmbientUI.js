(function () {
    'use strict';

    console.log("[Ambient UI] Initialized.");

    let currentItemId = null;
    let styleElement = null;

    function injectDynamicCSS(rgb) {
        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = 'ambient-ui-styles';
            document.head.appendChild(styleElement);
        }

        const [r, g, b] = rgb;
        
        const glowColor = `rgba(${r}, ${g}, ${b}, 0.15)`;
        const accentColor = `rgb(${r}, ${g}, ${b})`;
        const hoverColor = `rgb(${Math.min(r + 30, 255)}, ${Math.min(g + 30, 255)}, ${Math.min(b + 30, 255)})`;

        styleElement.innerHTML = `
            :root {
                --ambient-accent: ${accentColor};
                --ambient-accent-hover: ${hoverColor};
                --ambient-glow: ${glowColor};
            }

            /* Add a beautiful radial glow to the background of the details page */
            .itemBackdrop::after, .backdropContainer::after {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: radial-gradient(circle at 70% 30%, var(--ambient-glow) 0%, transparent 60%);
                pointer-events: none;
                z-index: -1;
            }

            /* Make the primary play button match the movie's color */
            .btnPlay, .button-submit, .playButton {
                background-color: var(--ambient-accent) !important;
                color: #ffffff !important;
                transition: background-color 0.3s ease !important;
            }

            .btnPlay:hover, .button-submit:hover, .playButton:hover {
                background-color: var(--ambient-accent-hover) !important;
            }

            /* Change the focus ring and text accents */
            .emby-button.show-focus {
                border-color: var(--ambient-accent) !important;
            }
            .navMenuOption-selected, .textActionButton:hover {
                color: var(--ambient-accent) !important;
            }
            .paper-icon-button-light:hover {
                color: var(--ambient-accent) !important;
            }
            
            /* Add a subtle tint to the item details container */
            .detailPageWrapperContainer, .itemDetailsPage, .detailPageContainer {
                background: linear-gradient(to bottom, transparent, rgba(0,0,0,0.8) 40%), 
                            linear-gradient(to right, rgba(0,0,0,0.9) 20%, var(--ambient-glow) 100%) !important;
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
                    reject("Canvas tainted by CORS");
                    return;
                }

                let r = 0, g = 0, b = 0, count = 0;

                for (let i = 0; i < data.length; i += 4) {
                    if (data[i + 3] < 255 || (data[i] < 30 && data[i+1] < 30 && data[i+2] < 30)) {
                        continue;
                    }
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

    async function applyAmbientTheme(itemId) {
        if (!itemId) return;

        try {
            console.log(`[Ambient UI] Extracting colors for item: ${itemId}...`);
          
            const serverUrl = window.ApiClient ? window.ApiClient.serverAddress() : "";
            const imgUrl = `${serverUrl}/Items/${itemId}/Images/Primary?maxWidth=128`; 
            
            const rgb = await getAverageColor(imgUrl);
            injectDynamicCSS(rgb);
            console.log(`[Ambient UI] Applied Color: rgb(${rgb.join(', ')})`);
        } catch (error) {
            console.warn("[Ambient UI] Failed to extract color:", error);
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
            applyAmbientTheme(newItemId);
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });

})();
