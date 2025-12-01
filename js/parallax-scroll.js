// Parallax scroll effect for hero and header
(function() {
  'use strict';

  // Detectar si tenemos soporte para RequestAnimationFrame
  const supportRAF = typeof requestAnimationFrame !== 'undefined';

  let ticking = false;
  let lastScrollY = 0;

  function updateParallax() {
    const scrollY = window.scrollY || window.pageYOffset;
    
    // Aplicar parallax al hero
    const hero = document.querySelector('.hero.parallax');
    if (hero) {
      const heroOffset = hero.offsetTop;
      const heroHeight = hero.offsetHeight;
      const windowHeight = window.innerHeight;
      
      // Solo aplicar parallax cuando el hero está visible o cerca
      if (scrollY + windowHeight > heroOffset && scrollY < heroOffset + heroHeight) {
        const parallaxAmount = (scrollY - heroOffset) * 0.5; // 50% parallax speed
        const bgElement = hero.querySelector('.hero-bg');
        if (bgElement) {
          bgElement.style.transform = `translateY(${parallaxAmount}px)`;
        }
      }
    }

    // Aplicar parallax al header
    const header = document.querySelector('header.header');
    if (header) {
      const headerHeight = header.offsetHeight;
      if (scrollY < headerHeight) {
        const parallaxAmount = scrollY * 0.4; // 40% parallax speed (slower)
        const headerImg = header.querySelector('.header-hero-image');
        if (headerImg) {
          headerImg.style.transform = `translateY(${parallaxAmount}px)`;
        }
      }
    }

    // Aplicar fade-out effect al header overlay mientras haces scroll
    const headerOverlay = document.querySelector('.header-overlay-text');
    if (headerOverlay && header) {
      const headerHeight = header.offsetHeight;
      const opacity = Math.max(0, 1 - (scrollY / (headerHeight * 0.6)));
      headerOverlay.style.opacity = opacity;
      // También aplicar un pequeño scale
      const scale = Math.max(0.95, 1 - (scrollY / (headerHeight * 2)));
      headerOverlay.style.transform = `scale(${scale})`;
    }

    ticking = false;
  }

  function onScroll() {
    lastScrollY = window.scrollY || window.pageYOffset;
    if (!ticking && supportRAF) {
      requestAnimationFrame(updateParallax);
      ticking = true;
    } else if (!supportRAF) {
      updateParallax();
    }
  }

  function init() {
    // Solo inicializar si hay elementos parallax
    if (document.querySelector('.hero.parallax') || document.querySelector('header.header .header-hero-image')) {
      window.addEventListener('scroll', onScroll, { passive: true });
      // Initial call
      updateParallax();
    }
  }

  // Ejecutar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
