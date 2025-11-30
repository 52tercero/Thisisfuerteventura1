// animations/gsap.js
// Central GSAP setup with ScrollTrigger and a global reduce-motion toggle
(function() {
  if (!window.gsap) return;
  const { gsap } = window;
  try { gsap.registerPlugin(window.ScrollTrigger); } catch(_) {}

  const state = {
    reduceMotion: false,
  };

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  state.reduceMotion = prefersReduced.matches || localStorage.getItem('reduce-motion') === '1';
  prefersReduced.addEventListener?.('change', e => {
    state.reduceMotion = e.matches || localStorage.getItem('reduce-motion') === '1';
  });

  window.__ANIMATIONS__ = window.__ANIMATIONS__ || {};
  window.__ANIMATIONS__.setReduceMotion = (enabled) => {
    state.reduceMotion = !!enabled;
    localStorage.setItem('reduce-motion', enabled ? '1' : '0');
  };
  window.__ANIMATIONS__.isReduced = () => state.reduceMotion;

  // Chapter-based scroll storytelling
  function initChapters() {
    const chapters = document.querySelectorAll('[data-chapter]');
    chapters.forEach(ch => {
      const name = ch.getAttribute('data-chapter') || 'capitulo';
      const tl = gsap.timeline({ paused: true });
      tl.fromTo(ch, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.9, ease: 'power2.out' });
      if (!state.reduceMotion && window.ScrollTrigger) {
        window.ScrollTrigger.create({
          trigger: ch,
          start: 'top 80%',
          end: 'bottom 20%',
          onEnter: () => tl.play(0),
          onEnterBack: () => tl.play(0),
        });
      } else {
        tl.play(0);
      }
    });
  }

  // Microinteractions: buttons like sand vibration; text wind emerge
  function initMicroInteractions() {
    const buttons = document.querySelectorAll('button, .btn');
    buttons.forEach(btn => {
      btn.addEventListener('mouseenter', () => {
        if (state.reduceMotion) return;
        gsap.to(btn, { y: -1, rotation: 0.5, duration: 0.18, yoyo: true, repeat: 1, ease: 'sine.inOut' });
      });
    });

    const windyTexts = document.querySelectorAll('[data-wind]');
    windyTexts.forEach(el => {
      if (state.reduceMotion) { el.style.opacity = '1'; return; }
      gsap.fromTo(el, { opacity: 0, x: -12 }, { opacity: 1, x: 0, duration: 0.8, ease: 'power1.out', scrollTrigger: { trigger: el, start: 'top 85%' }});
    });
  }

  function init() {
    initChapters();
    initMicroInteractions();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
})();
