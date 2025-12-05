// Hero header navigation toggle
(function() {
  'use strict';

  function initHeroHeader() {
    const hamburger = document.querySelector('.header-hamburger');
    const nav = document.querySelector('.header-nav.top-nav');

    if (!hamburger || !nav) return;

    hamburger.addEventListener('click', function() {
      hamburger.classList.toggle('active');
      nav.classList.toggle('active');
    });

    // Close menu cuando se click en un link
    const navLinks = nav.querySelectorAll('.header-nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', function() {
        hamburger.classList.remove('active');
        nav.classList.remove('active');
      });
    });

    // Close menu cuando se hace click fuera
    document.addEventListener('click', function(e) {
      if (!hamburger.contains(e.target) && !nav.contains(e.target)) {
        hamburger.classList.remove('active');
        nav.classList.remove('active');
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHeroHeader);
  } else {
    initHeroHeader();
  }
})();
