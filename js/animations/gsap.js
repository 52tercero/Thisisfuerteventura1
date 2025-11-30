// animations/gsap.js
// Central GSAP orchestration: ScrollTrigger, chapters, microinteractions, 3D sync, and accessibility
(function () {
  if (!window.gsap) {
    return;
  }
  const { gsap } = window;
  try {
    gsap.registerPlugin(window.ScrollTrigger);
  } catch (_) {}

  // === STATE MANAGEMENT ===
  const state = {
    reduceMotion: false,
    activeChapter: null,
    chapters: [],
    scrollProgress: 0,
  };

  // === ACCESSIBILITY: REDUCE-MOTION ===
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  state.reduceMotion = prefersReduced.matches || localStorage.getItem('reduce-motion') === '1';
  prefersReduced.addEventListener?.('change', (e) => {
    state.reduceMotion = e.matches || localStorage.getItem('reduce-motion') === '1';
    if (state.reduceMotion) {
      gsap.globalTimeline.pause();
    } else {
      gsap.globalTimeline.resume();
    }
  });

  // === PUBLIC API ===
  window.__ANIMATIONS__ = window.__ANIMATIONS__ || {};
  window.__ANIMATIONS__.setReduceMotion = (enabled) => {
    state.reduceMotion = !!enabled;
    localStorage.setItem('reduce-motion', enabled ? '1' : '0');
    if (state.reduceMotion) {
      gsap.globalTimeline.pause();
    } else {
      gsap.globalTimeline.resume();
    }
  };
  window.__ANIMATIONS__.isReduced = () => state.reduceMotion;
  window.__ANIMATIONS__.getActiveChapter = () => state.activeChapter;
  window.__ANIMATIONS__.getScrollProgress = () => state.scrollProgress;

  // === CHAPTER SYSTEM: Scroll-driven narrative ===
  function initChapters() {
    const chapters = document.querySelectorAll('[data-chapter]');
    if (chapters.length === 0) {
      return;
    }

    chapters.forEach((ch, idx) => {
      const name = ch.getAttribute('data-chapter') || `chapter-${idx}`;
      const chapterObj = { element: ch, name, timeline: null };
      state.chapters.push(chapterObj);

      // Create timeline for chapter reveal
      const tl = gsap.timeline({ paused: true });
      chapterObj.timeline = tl;

      // Main chapter fade + slide in
      tl.fromTo(
        ch,
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 1.2, ease: 'power2.out' },
        0
      );

      // Staggered sub-elements
      const heading = ch.querySelector('h2, h3');
      if (heading) {
        tl.fromTo(
          heading,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.8, ease: 'power1.out' },
          0.1
        );
      }

      const paragraph = ch.querySelector('p:first-of-type');
      if (paragraph) {
        tl.fromTo(
          paragraph,
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.7, ease: 'power1.out' },
          0.2
        );
      }

      const buttons = ch.querySelectorAll('.btn');
      if (buttons.length > 0) {
        tl.fromTo(
          buttons,
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.6, ease: 'power1.out', stagger: 0.08 },
          0.35
        );
      }

      // ScrollTrigger for chapter
      if (!state.reduceMotion && window.ScrollTrigger) {
        window.ScrollTrigger.create({
          trigger: ch,
          start: 'top 75%',
          onEnter: () => {
            state.activeChapter = name;
            tl.play(0);
            document.dispatchEvent(
              new CustomEvent('chapter:enter', { detail: { name, index: idx } })
            );
          },
          onEnterBack: () => {
            state.activeChapter = name;
            tl.play(0);
            document.dispatchEvent(
              new CustomEvent('chapter:enterBack', { detail: { name, index: idx } })
            );
          },
          onLeave: () => {
            document.dispatchEvent(
              new CustomEvent('chapter:leave', { detail: { name, index: idx } })
            );
          },
        });
      } else {
        tl.play(0);
      }
    });
  }

  // === MICROINTERACTIONS ===
  function initMicroInteractions() {
    // Sand vibration on button hover
    const buttons = document.querySelectorAll('button, .btn, [role="button"]');
    buttons.forEach((btn) => {
      btn.addEventListener('mouseenter', () => {
        if (state.reduceMotion) {
          return;
        }
        // Sand vibration effect: small rotation + scale pulse
        gsap.to(btn, {
          rotation: 0.8,
          scale: 1.02,
          duration: 0.12,
          ease: 'back.out',
          yoyo: true,
          repeat: 1,
        });
      });

      // Keyboard accessibility: focus + enter
      btn.addEventListener('focus', () => {
        if (state.reduceMotion) {
          return;
        }
        gsap.to(btn, {
          duration: 0.2,
          boxShadow: '0 0 20px rgba(46,196,182,0.5)',
          ease: 'power1.out',
        });
      });
      btn.addEventListener('blur', () => {
        gsap.to(btn, { duration: 0.2, boxShadow: 'none', ease: 'power1.out' });
      });
    });

    // Wind-emerge text effect
    const windyTexts = document.querySelectorAll('[data-wind]');
    windyTexts.forEach((el) => {
      if (state.reduceMotion) {
        el.style.opacity = '1';
        return;
      }
      gsap.fromTo(
        el,
        { opacity: 0, x: -24, skewY: 2 },
        {
          opacity: 1,
          x: 0,
          skewY: 0,
          duration: 1.1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 80%',
            once: true,
          },
        }
      );
    });

    // Sand-grain particles on scroll (optional accent)
    const particleElements = document.querySelectorAll('[data-particles]');
    particleElements.forEach((el) => {
      if (state.reduceMotion) {
        return;
      }
      const originalBg = window.getComputedStyle(el).backgroundColor;
      gsap.to(el, {
        scrollTrigger: {
          trigger: el,
          start: 'top center',
          end: 'bottom center',
          scrub: 0.3,
          onUpdate: (self) => {
            const blur = Math.sin(self.progress * Math.PI) * 3;
            el.style.filter = `blur(${blur}px)`;
          },
        },
      });
    });
  }

  // === SCROLL PROGRESS TRACKER ===
  function initScrollProgress() {
    if (!window.ScrollTrigger) {
      return;
    }
    window.ScrollTrigger.create({
      onUpdate: (self) => {
        state.scrollProgress = self.progress;
      },
    });
  }

  // === GLOBAL TIMELINE ORCHESTRATION ===
  function initGlobalTimeline() {
    // Global timeline can be used for page-wide effects
    window.__ANIMATIONS__ = window.__ANIMATIONS__ || {};
    window.__ANIMATIONS__.timeline = gsap.timeline({ paused: false });
  }

  // === 3D SCENE SYNC ===
  function init3DSync() {
    // Listen for chapter changes and sync with 3D scenes
    document.addEventListener('chapter:enter', (e) => {
      const name = (e.detail && e.detail.name) || '';
      if (window.AmbientSounds && typeof window.AmbientSounds.playCue === 'function') {
        if (state.reduceMotion) {
          return;
        }
        const cue = /playas/i.test(name)
          ? 'waves'
          : /volcan/i.test(name)
            ? 'earth'
            : 'wind';
        try {
          window.AmbientSounds.playCue(cue, { volume: 0.35 });
        } catch (_) {}
      }
    });

    document.addEventListener('chapter:leave', () => {
      if (window.AmbientSounds && typeof window.AmbientSounds.fadeOut === 'function') {
        if (state.reduceMotion) {
          return;
        }
        try {
          window.AmbientSounds.fadeOut(0.8);
        } catch (_) {}
      }
    });
  }

  // === INITIALIZATION ===
  function init() {
    initGlobalTimeline();
    initScrollProgress();
    initChapters();
    initMicroInteractions();
    init3DSync();

    // Expose global state for debugging
    if (window.location.hash.includes('debug-animations')) {
      window.__ANIMATIONS__.DEBUG = true;
      console.log('[ANIMATIONS] Debug mode enabled', state);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
