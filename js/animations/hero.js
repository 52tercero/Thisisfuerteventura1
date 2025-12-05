// animations/hero.js: Animaciones del hero con GSAP y comportamientos de ScrollTrigger
(function () {
  if (typeof window === 'undefined') {return;}
  const d = document;
  // Registrar ScrollTrigger de forma segura si está disponible
  function register() {
    try { if (window.gsap && window.ScrollTrigger && window.gsap.registerPlugin) {window.gsap.registerPlugin(window.ScrollTrigger);} } catch (_) { }
  }
  // Timeline de entrada del hero (título, párrafo, botón)
  function initHeroTimeline() {
    const hero = d.querySelector('.hero .hero-content');
    if (!hero || !window.gsap) {return;}
    const tl = window.gsap.timeline({ defaults:{ ease:'power3.out' } });
    const h2 = hero.querySelector('h2'); const p = hero.querySelector('p'); const btn = hero.querySelector('.btn');
    tl.from([h2, p, btn], { y:40, opacity:0, stagger:0.12, duration:0.8 });
  }
  // Fijar (pin) la sección hero durante el scroll y animar overlay
  function initPinnedHero() {
    const section = d.querySelector('.hero');
    const overlay = d.querySelector('.hero .hero-overlay');
    if (!section || !window.ScrollTrigger) {return;}
    const endDistance = window.matchMedia('(min-width: 1024px)').matches ? '+=70%' : '+=48%';
    window.ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: endDistance,
      pin: true,
      pinSpacing: true,
      scrub: 0.25,
      onUpdate: (self) => {
        const v = Math.max(0, Math.min(1, self.progress));
        if (window.gsap) { window.gsap.to(section, { duration: 0.1, opacity: 1 - v * 0.04 }); }
        if (overlay) {
          const y = (v * 35);
          const alpha = 0.25 + v * 0.15;
          overlay.style.transform = `translate3d(0, ${y}px, 0)`;
          overlay.style.backgroundColor = `rgba(0,0,0,${alpha.toFixed(3)})`;
        }
      }
    });
  }
  // Parallax suave del texto del hero durante el scroll
  function initTextParallax() {
    const section = d.querySelector('.hero');
    const hero = d.querySelector('.hero .hero-content');
    const h2 = hero?.querySelector('h2'); const p = hero?.querySelector('p');
    if (!section || !h2 || !p || !window.ScrollTrigger) {return;}
    window.ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: 'bottom top',
      scrub: 0.25,
      onUpdate: (self) => {
        const v = Math.max(0, Math.min(1, self.progress));
        h2.style.transform = `translate3d(0, ${v * -20}px, 0)`;
        p.style.transform = `translate3d(0, ${v * -10}px, 0)`;
      }
    });
  }
  // Inicialización: registrar plugin y lanzar animaciones
  function init() { register(); initHeroTimeline(); initPinnedHero(); initTextParallax(); }
  if (d.readyState !== 'loading') {init();} else {d.addEventListener('DOMContentLoaded', init);}
})();
