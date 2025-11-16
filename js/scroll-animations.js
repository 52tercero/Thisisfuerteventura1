// Scroll animations using GSAP + ScrollTrigger (progressive enhancement)
(() => {
  if (typeof window === 'undefined') return;
  const hasGSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  if (!hasGSAP) return;

  const { gsap } = window;
  gsap.registerPlugin(window.ScrollTrigger);

  // Reveal elements with .reveal
  const reveals = Array.from(document.querySelectorAll('.reveal'));
  if (reveals.length) {
    reveals.forEach((el) => {
      gsap.fromTo(
        el,
        { autoAlpha: 0, y: 24 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            once: true,
          },
        }
      );
    });
  }

  // Subtle hero parallax for video/image backgrounds
  const hero = document.querySelector('.hero-video, .hero.parallax');
  if (hero) {
    const bg = hero.querySelector('.hero-bg');
    if (bg) {
      gsap.to(bg, {
        yPercent: 10,
        ease: 'none',
        scrollTrigger: {
          trigger: hero,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      });
    }
    const content = hero.querySelector('.hero-content');
    if (content) {
      gsap.fromTo(
        content,
        { y: 0, autoAlpha: 1 },
        {
          y: -40,
          autoAlpha: 0.9,
          ease: 'none',
          scrollTrigger: {
            trigger: hero,
            start: 'top top',
            end: 'bottom top',
            scrub: true,
          },
        }
      );
    }
  }
})();
/* scroll-animations.js - Animaciones narrativas con scroll */

// Configuración de Intersection Observer para animaciones
const observerOptions = {
    threshold: 0.15,
    rootMargin: '0px 0px -10% 0px'
};

const animateOnScroll = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('show');
            // Opcional: dejar de observar después de animar
            animateOnScroll.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observar todos los elementos con clase 'reveal'
document.addEventListener('DOMContentLoaded', () => {
    const revealElements = document.querySelectorAll('.reveal');
    revealElements.forEach(el => animateOnScroll.observe(el));
});

// Parallax suave para hero y secciones con clase parallax
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const parallaxElements = document.querySelectorAll('.parallax');
    
    parallaxElements.forEach(el => {
        const speed = el.dataset.speed || 0.5;
        el.style.transform = `translateY(${scrolled * speed}px)`;
    });
});

// Efecto de aparición gradual con diferentes delays
document.addEventListener('DOMContentLoaded', () => {
    const staggerElements = document.querySelectorAll('.stagger-item');
    staggerElements.forEach((el, index) => {
        el.style.transitionDelay = `${index * 0.1}s`;
    });
});
