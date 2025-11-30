// animations/news.js: GSAP-driven enter transitions for news cards
(function () {
  if (typeof window === 'undefined') {return;}
  const d = document;
  function register() { try { if (window.gsap && window.ScrollTrigger && window.gsap.registerPlugin) {window.gsap.registerPlugin(window.ScrollTrigger);} } catch (_) { } }
  function animateCards() {
    if (!window.gsap) {return;}
    const cards = d.querySelectorAll('#news-container .content-card');
    cards.forEach((card) => {
      try { window.gsap.from(card, { opacity: 0, y: 24, duration: 0.4, ease: 'power2.out' }); } catch (_) { }
    });
  }
  function init() { register(); animateCards(); }
  if (d.readyState !== 'loading') {init();} else {d.addEventListener('DOMContentLoaded', init);}
  // Re-run on global feed refresh
  document.addEventListener('feed:refresh', () => setTimeout(animateCards, 50));
})();
