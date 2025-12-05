// Wire accessibility toggles for reduce-motion
document.addEventListener('DOMContentLoaded', function() {
    const reduceBtn = document.getElementById('reduce-motion-toggle');
    if (reduceBtn && window.__ANIMATIONS__) {
        const update = () => {
            reduceBtn.setAttribute('aria-pressed', window.__ANIMATIONS__.isReduced() ? 'true' : 'false');
        };
        update();
        reduceBtn.addEventListener('click', () => {
            const next = !window.__ANIMATIONS__.isReduced();
            window.__ANIMATIONS__.setReduceMotion(next);
            update();
        });
    }
});
