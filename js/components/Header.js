/**
 * Header Component - Modern, Responsive & Animated
 * 
 * Features:
 * - Mobile hamburger menu with GSAP animations
 * - Smooth transitions and hover effects
 * - Keyboard navigation support
 * - Accessibility-first design (ARIA labels, semantic HTML)
 * - Dynamic search with auto-focus on mobile
 * - Social icons with tooltip hints
 * - Scroll detection for sticky behavior
 * 
 * Dependencies: GSAP (for animations)
 */

(function HeaderComponent() {
  // Configuration
  const CONFIG = {
    mobileBreakpoint: 768,
    menuAnimDuration: 0.4,
    staggerDelay: 0.08,
    scrollThreshold: 50,
  };

  // State
  let state = {
    isMenuOpen: false,
    isSearchActive: false,
    hasScrolled: false,
  };

  // DOM Elements (lazy-loaded)
  let els = {
    header: null,
    mobileMenuBtn: null,
    mobileMenu: null,
    searchInput: null,
    searchBtn: null,
    navLinks: null,
    socialLinks: null,
    ctaBtn: null,
  };

  /**
   * Initialize Header Component
   */
  function init() {
    cacheElements();
    if (!els.header) {
      console.warn('[Header] Header element not found');
      return;
    }

    // Wait for GSAP before setting up animations
    if (typeof gsap === 'undefined') {
      console.warn('[Header] GSAP not loaded, using CSS-only fallback');
      setupFallbackEvents();
      return;
    }

    setupEventListeners();
    setupScrollDetection();
    setupAnimations();
    setupKeyboardNavigation();
    setupAccessibility();

    console.log('[Header] Component initialized successfully');
  }

  /**
   * Cache DOM elements
   */
  function cacheElements() {
    els.header = document.querySelector('header');
    els.mobileMenuBtn = document.querySelector('.header-hamburger');
    els.mobileMenu = document.querySelector('.header-nav.top-nav');
    els.navLinks = document.querySelectorAll('.header-nav a');
    els.searchInput = document.querySelector('.header-search-input');
    els.searchBtn = document.querySelector('.header-search-btn');
    els.socialLinks = document.querySelectorAll('.header-social a');
    els.ctaBtn = document.querySelector('.header-cta');
  }

  /**
   * Setup event listeners
   */
  function setupEventListeners() {
    // Mobile menu toggle
    if (els.mobileMenuBtn) {
      els.mobileMenuBtn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); toggleMobileMenu(); });
      // Ensure mobile devices register taps
      els.mobileMenuBtn.addEventListener('touchstart', (e) => { e.preventDefault(); e.stopPropagation(); toggleMobileMenu(); }, { passive: false });
      els.mobileMenuBtn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleMobileMenu();
        }
      });
    }

    // Defensive: delegate clicks to ensure toggle works even if button is re-rendered
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.header-hamburger');
      if (btn) {
        e.stopPropagation();
        // Refresh cached elements in case of dynamic changes
        if (!els.mobileMenuBtn || !els.mobileMenu) cacheElements();
        toggleMobileMenu();
      }
    });

    // Close mobile menu when clicking on a link
    if (els.navLinks) {
      els.navLinks.forEach(link => {
        link.addEventListener('click', closeMobileMenu);
      });
    }

    // Search functionality
    if (els.searchBtn) {
      els.searchBtn.addEventListener('click', toggleSearch);
    }
    if (els.searchInput) {
      els.searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          handleSearch();
        }
      });
    }

    // Close mobile menu on outside click
    document.addEventListener('click', (e) => {
      if (!e.target.closest('header') && state.isMenuOpen) {
        closeMobileMenu();
      }
    });

    // CTA button interactions
    if (els.ctaBtn) {
      els.ctaBtn.addEventListener('click', handleCTA);
      els.ctaBtn.addEventListener('mouseenter', highlightCTAOnHover);
      els.ctaBtn.addEventListener('mouseleave', normalizeCtaOnLeave);
    }

    // Hover effects on social icons
    if (els.socialLinks) {
      els.socialLinks.forEach(link => {
        link.addEventListener('mouseenter', enhanceSocialHover);
        link.addEventListener('mouseleave', normalizeAllSocials);
      });
    }
  }

  /**
   * Toggle mobile menu with GSAP animation
   */
  function toggleMobileMenu() {
    if (state.isMenuOpen) {
      closeMobileMenu();
    } else {
      openMobileMenu();
    }
  }

  /**
   * Open mobile menu with smooth animation
   */
  function openMobileMenu() {
    if (!els.mobileMenuBtn || !els.mobileMenu) return;

    state.isMenuOpen = true;
    els.mobileMenuBtn.setAttribute('aria-expanded', 'true');
    els.mobileMenuBtn.classList.add('active');
    els.mobileMenu.classList.add('active');
    document.body.classList.add('nav-open');
    const list = els.mobileMenu.querySelector('.header-nav-list');
    if (list) {
      list.setAttribute('aria-hidden', 'false');
      // Fallback to ensure visibility on strict mobile CSS
      list.style.display = 'flex';
    }
  }

  /**
   * Close mobile menu with smooth animation
   */
  function closeMobileMenu() {
    if (!els.mobileMenuBtn || !els.mobileMenu) return;

    state.isMenuOpen = false;
    els.mobileMenuBtn.setAttribute('aria-expanded', 'false');
    els.mobileMenuBtn.classList.remove('active');
    els.mobileMenu.classList.remove('active');
    document.body.classList.remove('nav-open');
    const list = els.mobileMenu.querySelector('.header-nav-list');
    if (list) {
      list.setAttribute('aria-hidden', 'true');
      // Reset inline fallback so CSS media queries remain authoritative
      list.style.display = '';
    }
  }

  /**
   * Toggle search bar
   */
  function toggleSearch() {
    if (!els.searchInput) return;

    state.isSearchActive = !state.isSearchActive;

    if (typeof gsap !== 'undefined') {
      if (state.isSearchActive) {
        gsap.to(els.searchInput, {
          duration: 0.3,
          width: 'auto',
          opacity: 1,
          ease: 'power2.out',
        });
        els.searchInput.focus();
      } else {
        gsap.to(els.searchInput, {
          duration: 0.3,
          width: '0px',
          opacity: 0,
          ease: 'power2.in',
        });
      }
    }
  }

  /**
   * Handle search submission
   */
  function handleSearch() {
    if (!els.searchInput || !els.searchInput.value.trim()) return;

    const query = els.searchInput.value.trim();
    console.log('[Header] Search query:', query);

    // Implement search navigation
    // Example: redirect to search results page or trigger search overlay
    window.location.href = `/noticias.html?search=${encodeURIComponent(query)}`;
  }

  /**
   * Handle CTA button click
   */
  function handleCTA() {
    console.log('[Header] CTA triggered');
    // Navigate to exploration page or trigger modal
    window.location.href = '/turismo.html';
  }

  /**
   * Enhance social icon on hover
   */
  function enhanceSocialHover(e) {
    if (typeof gsap === 'undefined') return;

    const icon = e.target.closest('a');
    if (!icon) return;

    gsap.to(icon, {
      duration: 0.3,
      y: -5,
      scale: 1.15,
      ease: 'back.out',
    });

    // Rotate icon
    gsap.to(icon.querySelector('i'), {
      duration: 0.4,
      rotation: 15,
      ease: 'back.out',
    });
  }

  /**
   * Normalize all social icons
   */
  function normalizeAllSocials() {
    if (typeof gsap === 'undefined') return;

    if (els.socialLinks) {
      els.socialLinks.forEach(link => {
        gsap.to(link, {
          duration: 0.3,
          y: 0,
          scale: 1,
          ease: 'power2.out',
        });

        gsap.to(link.querySelector('i'), {
          duration: 0.3,
          rotation: 0,
          ease: 'power2.out',
        });
      });
    }
  }

  /**
   * CTA button hover effect
   */
  function highlightCTAOnHover() {
    if (typeof gsap === 'undefined') return;

    gsap.to(els.ctaBtn, {
      duration: 0.3,
      scale: 1.05,
      boxShadow: '0 10px 30px rgba(46, 196, 182, 0.4)',
      ease: 'back.out',
    });
  }

  /**
   * Normalize CTA button
   */
  function normalizeCtaOnLeave() {
    if (typeof gsap === 'undefined') return;

    gsap.to(els.ctaBtn, {
      duration: 0.3,
      scale: 1,
      boxShadow: '0 4px 15px rgba(46, 196, 182, 0.25)',
      ease: 'power2.out',
    });
  }

  /**
   * Setup scroll detection for sticky header behavior
   */
  function setupScrollDetection() {
    if (typeof gsap === 'undefined') return;

    let scrollTimeline = gsap.timeline();

    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY;
      const isScrolled = scrollY > CONFIG.scrollThreshold;

      if (isScrolled && !state.hasScrolled) {
        state.hasScrolled = true;
        gsap.to(els.header, {
          duration: 0.3,
          boxShadow: 'var(--shadow-lg)',
          ease: 'power2.out',
        });
      } else if (!isScrolled && state.hasScrolled) {
        state.hasScrolled = false;
        gsap.to(els.header, {
          duration: 0.3,
          boxShadow: 'var(--shadow-sm)',
          ease: 'power2.out',
        });
      }
    }, { passive: true });
  }

  /**
   * Setup animations on header load
   */
  function setupAnimations() {
    if (typeof gsap === 'undefined') return;

    // Fade in header on page load
    gsap.from(els.header, {
      duration: 0.6,
      opacity: 0,
      y: -20,
      ease: 'power2.out',
    });

    // Stagger nav links on load
    if (els.navLinks) {
      gsap.from(els.navLinks, {
        duration: 0.5,
        opacity: 0,
        x: -10,
        stagger: 0.05,
        ease: 'power2.out',
        delay: 0.3,
      });
    }

    // Highlight CTA button
    if (els.ctaBtn) {
      gsap.from(els.ctaBtn, {
        duration: 0.6,
        opacity: 0,
        scale: 0.9,
        ease: 'back.out',
        delay: 0.4,
      });

      // Subtle pulse animation on CTA
      gsap.to(els.ctaBtn, {
        duration: 2,
        boxShadow: [
          '0 4px 15px rgba(46, 196, 182, 0.25)',
          '0 4px 20px rgba(46, 196, 182, 0.4)',
          '0 4px 15px rgba(46, 196, 182, 0.25)',
        ],
        repeat: -1,
        ease: 'sine.inOut',
        delay: 1,
      });
    }
  }

  /**
   * Setup keyboard navigation
   */
  function setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
      // Close menu on ESC
      if (e.key === 'Escape' && state.isMenuOpen) {
        closeMobileMenu();
        if (els.mobileMenuBtn) els.mobileMenuBtn.focus();
      }

      // Toggle search on Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (els.searchBtn) toggleSearch();
      }
    });
  }

  /**
   * Setup accessibility features
   */
  function setupAccessibility() {
    // Ensure header has proper ARIA roles
    if (els.header) {
      els.header.setAttribute('role', 'banner');
    }

    // Add aria-current to active nav item
    const currentPage = getCurrentPagePath();
    if (els.navLinks) {
      els.navLinks.forEach(link => {
        const linkPath = link.getAttribute('href');
        if (linkPath === currentPage || linkPath === '/' && currentPage === '/index.html') {
          link.setAttribute('aria-current', 'page');
        }
      });
    }

    // Ensure social links have proper labels
    if (els.socialLinks) {
      els.socialLinks.forEach(link => {
        if (!link.getAttribute('aria-label')) {
          const platform = link.getAttribute('data-platform') || link.className;
          link.setAttribute('aria-label', `Visit our ${platform} page`);
        }
      });
    }

    // Add visual focus indicators
    setupFocusStyles();
  }

  /**
   * Setup focus styles for keyboard navigation
   */
  function setupFocusStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .header-nav a:focus-visible,
      .header-social a:focus-visible,
      .header-cta:focus-visible,
      .header-search-btn:focus-visible,
      .header-hamburger:focus-visible {
        outline: 2px solid var(--color-mar);
        outline-offset: 2px;
        border-radius: 2px;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Get current page path for active nav highlighting
   */
  function getCurrentPagePath() {
    return window.location.pathname || '/';
  }

  /**
   * Setup fallback events (when GSAP not available)
   */
  function setupFallbackEvents() {
    if (els.mobileMenuBtn) {
      els.mobileMenuBtn.addEventListener('click', () => {
        if (els.mobileMenu) {
          els.mobileMenu.classList.toggle('active');
          els.mobileMenuBtn.classList.toggle('active');
        }
      });
    }
  }

  /**
   * Public API
   */
  const HeaderAPI = {
    init,
    openMenu: openMobileMenu,
    closeMenu: closeMobileMenu,
    toggleMenu: toggleMobileMenu,
    search: handleSearch,
    getState: () => ({ ...state }),
  };

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose API globally
  window.HeaderComponent = HeaderAPI;
})();



