(function(){
  'use strict';
  const ready = (fn) => (document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', fn, { once: true }) : fn());

  function escapeHTML(s){
    return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
  }

  function splitToSpans(el){
    const text = el.textContent || '';
    const parts = [];
    for (let i=0; i<text.length; i++){
      const ch = text[i];
      if (ch === ' '){
        parts.push('<span class="wind-sp">&nbsp;</span>');
      } else {
        parts.push('<span class="wind-ch">'+ escapeHTML(ch) +'</span>');
      }
    }
    el.innerHTML = parts.join('');
    const spans = el.querySelectorAll('.wind-ch, .wind-sp');
    spans.forEach(s => { s.style.display = 'inline-block'; s.style.willChange = 'transform'; });
    return el.querySelectorAll('.wind-ch');
  }

  function ensureGSAP(cb){
    if (window.gsap) { cb(window.gsap); return; }
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js';
    s.defer = true; s.onload = () => cb(window.gsap);
    document.head.appendChild(s);
  }

  ready(() => {
    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return; // respeta accesibilidad

    ensureGSAP((gsap) => {
      // Objetivo 1: letras del hero y título principal de sección
      const heroH2 = document.querySelector('.hero-content h2');
      const sectionH2 = document.querySelector('.tourism-content > h2');

      const letterTweens = [];
      if (heroH2){
        const letters = splitToSpans(heroH2);
        letters.forEach((span, i) => {
          const ampX = 10; const ampY = 3; const rot = 1.2;
          letterTweens.push(
            gsap.to(span, {
              x: () => gsap.utils.random(-ampX*0.2, ampX),
              y: () => gsap.utils.random(-ampY, ampY),
              rotation: () => gsap.utils.random(-rot, rot),
              duration: () => gsap.utils.random(2, 4),
              ease: 'sine.inOut',
              repeat: -1,
              yoyo: true,
              delay: i * 0.02
            })
          );
        });
      }
      if (sectionH2){
        const letters = splitToSpans(sectionH2);
        letters.forEach((span, i) => {
          const ampX = 6; const ampY = 2; const rot = 0.8;
          letterTweens.push(
            gsap.to(span, {
              x: () => gsap.utils.random(-ampX*0.2, ampX),
              y: () => gsap.utils.random(-ampY, ampY),
              rotation: () => gsap.utils.random(-rot, rot),
              duration: () => gsap.utils.random(2.2, 4.6),
              ease: 'sine.inOut',
              repeat: -1,
              yoyo: true,
              delay: i * 0.018
            })
          );
        });
      }

      // Objetivo 2: cabezales y párrafos con brisa suave a nivel de elemento
      const gentleTargets = document.querySelectorAll([
        '.hero-content p',
        '.tourism-card h3',
        '.itineraries h2',
        '.itinerary h3',
        '.image-gallery h2',
        '.activities h2',
        '.activities h3',
        '.tips h2',
        '.tips h3',
        '.interactive-map-section h2'
      ].join(','));

      gentleTargets.forEach((el, idx) => {
        el.style.willChange = 'transform';
        gsap.to(el, {
          x: 'random(-6, 12)',
          y: 'random(-1, 3)',
          skewX: 'random(-2, 2)',
          duration: () => gsap.utils.random(2.5, 5.5),
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
          repeatRefresh: true,
          delay: (idx % 7) * 0.07
        });
      });

      // Ráfagas de viento: empujón ocasional hacia la derecha en los títulos
      const gustTargets = [heroH2, sectionH2].filter(Boolean);
      if (gustTargets.length){
        const gust = { k: 0 };
        const applyGust = () => {
          gustTargets.forEach(el => el.style.setProperty('--gust-x', `${gust.k}px`));
        };
        gsap.ticker.add(applyGust);
        const tl = gsap.timeline({ repeat: -1, repeatDelay: 2 });
        tl.to(gust, { k: 0, duration: 1, ease: 'sine.out' })
          .to(gust, { k: () => gsap.utils.random(10, 26), duration: () => gsap.utils.random(0.8, 1.6), ease: 'power1.inOut' })
          .to(gust, { k: 0, duration: () => gsap.utils.random(2.5, 4.5), ease: 'sine.inOut' });

        // aplica la ráfaga como translateX adicional a cada letra
        const applyToLetters = (container) => {
          if (!container) return;
          container.querySelectorAll('.wind-ch').forEach(span => {
            const base = getComputedStyle(span).transform;
            // usamos gsap.set con function-based value para sumar la ráfaga cada frame
            gsap.ticker.add(() => {
              // se usa translate 3d para forzar GPU
              span.style.transform = `translate3d(${gust.k}px, 0, 0)` + (base && base !== 'none' ? ' ' + base : '');
            });
          });
        };
        gustTargets.forEach(applyToLetters);
      }
    });
  });
})();
