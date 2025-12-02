/**
 * animations.js
 * Professional scroll and interaction animations (Pearson-inspired)
 * - Smooth reveal on scroll
 * - Subtle hover effects
 * - Fade-in transitions
 * No heavy dependencies, performant GSAP usage
 */

(function() {
  'use strict';

  // Wait for GSAP and DOM ready
  if (!window.gsap) {
    console.warn('[Animations] GSAP not loaded');
    return;
  }

  const gsap = window.gsap;

  // Register ScrollTrigger if available
  if (window.ScrollTrigger && gsap.registerPlugin) {
    gsap.registerPlugin(window.ScrollTrigger);
  }

  /**
   * Initialize all animations
   */
  function initAnimations() {
    setupScrollReveal();
    setupButtonHovers();
    setupCardHovers();
    setupFadeInElements();
  }

  /**
   * Smooth reveal on scroll for sections with .reveal class
   */
  function setupScrollReveal() {
    const revealElements = document.querySelectorAll('.reveal:not(.featured-content):not(#featured-news)');
    if (!revealElements.length) return;

    revealElements.forEach((el) => {
      // Skip if already animated
      if (el.dataset.animated) return;

      gsap.fromTo(
        el,
        {
          opacity: 0,
          y: 30,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 80%',
            end: 'top 50%',
            once: true,
          },
        }
      );

      el.dataset.animated = 'true';
    });
  }

  /**
   * Button hover animations
   */
  function setupButtonHovers() {
    const buttons = document.querySelectorAll('.btn');
    if (!buttons.length) return;

    buttons.forEach((btn) => {
      btn.addEventListener('mouseenter', () => {
        gsap.to(btn, {
          duration: 0.3,
          scale: 1.05,
          boxShadow: '0 8px 16px rgba(0, 119, 182, 0.2)',
          overwrite: 'auto',
        });
      });

      btn.addEventListener('mouseleave', () => {
        gsap.to(btn, {
          duration: 0.3,
          scale: 1,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          overwrite: 'auto',
        });
      });
    });
  }

  /**
   * Card hover animations
   */
  function setupCardHovers() {
    const cards = document.querySelectorAll('.content-card, .category-card');
    if (!cards.length) return;

    cards.forEach((card) => {
      card.addEventListener('mouseenter', () => {
        gsap.to(card, {
          duration: 0.3,
          y: -8,
          boxShadow: '0 12px 24px rgba(0, 0, 0, 0.15)',
          overwrite: 'auto',
        });
      });

      card.addEventListener('mouseleave', () => {
        gsap.to(card, {
          duration: 0.3,
          y: 0,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          overwrite: 'auto',
        });
      });
    });
  }

  /**
   * Fade in elements on page load
   */
  function setupFadeInElements() {
    const fadeElements = document.querySelectorAll('[data-fade-in]');
    if (!fadeElements.length) return;

    gsap.from(fadeElements, {
      opacity: 0,
      duration: 0.6,
      stagger: 0.1,
      ease: 'power2.out',
    });
  }

  /**
   * Initialize when DOM is ready
   */
  function ready(fn) {
    if (document.readyState !== 'loading') {
      fn();
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  }

  ready(() => {
    setTimeout(initAnimations, 100);
  });

  // Re-initialize on dynamic content load
  window.addEventListener('load', initAnimations);

  // Expose API if needed
  window.AnimationUtils = {
    revealElement: (el) => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }
      );
    },
    fadeIn: (el, duration = 0.6) => {
      gsap.to(el, { opacity: 1, duration, ease: 'power2.out' });
    },
    fadeOut: (el, duration = 0.6) => {
      gsap.to(el, { opacity: 0, duration, ease: 'power2.out' });
    },
  };

  console.log('✅ Professional animations loaded');
})();

