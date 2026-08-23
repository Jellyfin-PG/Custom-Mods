(function () {
    'use strict';

    const MAX_TILT = 12;
    const HOVER_SCALE = 1.05;

    const injectStyles = () => {
        if (document.getElementById('jf-3d-poster-styles')) return;
        const style = document.createElement('style');
        style.id = 'jf-3d-poster-styles';
        style.textContent = `
            .cardBox { perspective: 1200px; margin-left: 1.2em !important; }
            .cardScalable { transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94); transform-style: preserve-3d; will-change: transform; position: relative; }
            .card.tilt-active .cardScalable { transition: transform 0.1s ease-out; }
            .cardScalable::after { content: ''; position: absolute; inset: 0; border-radius: inherit; background: radial-gradient(circle at var(--mouseX, 50%) var(--mouseY, 50%), rgba(255, 255, 255, 0.15) 0%, transparent 60%); opacity: 0; transition: opacity 0.4s ease; pointer-events: none; z-index: 10; }
            .card.tilt-active .cardScalable::after { opacity: 1; }
        `;
        document.head.appendChild(style);
    };

    injectStyles();

    document.addEventListener('mousemove', (e) => {
        const card = e.target.closest('.card');
        if (!card) return;

        const scalable = card.querySelector('.cardScalable');
        if (!scalable) return;

        card.classList.add('tilt-active');

        const rect = scalable.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -MAX_TILT;
        const rotateY = ((x - centerX) / centerX) * MAX_TILT;
        const percentX = (x / rect.width) * 100;
        const percentY = (y / rect.height) * 100;

        scalable.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(${HOVER_SCALE}, ${HOVER_SCALE}, ${HOVER_SCALE})`;
        scalable.style.setProperty('--mouseX', `${percentX}%`);
        scalable.style.setProperty('--mouseY', `${percentY}%`);
    });

    document.addEventListener('mouseout', (e) => {
        const card = e.target.closest('.card');
        if (!card) return;

        if (!card.contains(e.relatedTarget)) {
            card.classList.remove('tilt-active');
            
            const scalable = card.querySelector('.cardScalable');
            if (scalable) {
                scalable.style.transform = `rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
            }
        }
    });

})();
