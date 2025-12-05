// animations/news.js: Transiciones de entrada con GSAP para tarjetas de noticias
(function () {
  if (typeof window === 'undefined') {return;}
  const d = document;
  // Registrar plugin ScrollTrigger si está disponible
  function register() { try { if (window.gsap && window.ScrollTrigger && window.gsap.registerPlugin) {window.gsap.registerPlugin(window.ScrollTrigger);} } catch (_) { } }
  // Animar tarjetas de noticias
  function animateCards() {
    if (!window.gsap) {return;}
    const cards = d.querySelectorAll('#news-container .content-card');
    cards.forEach((card) => {
      try { window.gsap.from(card, { opacity: 0, y: 24, duration: 0.4, ease: 'power2.out' }); } catch (_) { }
    });
  }
  // Inicializar animaciones
  function init() { register(); animateCards(); }
  if (d.readyState !== 'loading') {init();} else {d.addEventListener('DOMContentLoaded', init);}
  // Re-ejecutar al refrescar el feed global
  document.addEventListener('feed:refresh', () => setTimeout(animateCards, 50));
})();
