// animations/narrative.js
// Page-specific narrative animations for Noticias, Blog, and other story-driven pages
(function () {
  if (!window.gsap) {
    return;
  }

  const { gsap } = window;

  // === NEWS PAGE NARRATIVE ===
  function initNewsNarrative() {
    const newsContainer = document.querySelector('#news-container');
    if (!newsContainer) {
      return;
    }

    const isReduced = (window.__ANIMATIONS__ && window.__ANIMATIONS__.isReduced)
      ? window.__ANIMATIONS__.isReduced()
      : false;

    // Staggered card reveals
    const cards = newsContainer.querySelectorAll('.content-card');
    if (cards.length > 0) {
      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

      cards.forEach((card, idx) => {
        if (isReduced) {
          card.style.opacity = '1';
          return;
        }

        tl.fromTo(
          card,
          {
            opacity: 0,
            y: 30,
            scale: 0.95,
            rotationZ: -1,
          },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            rotationZ: 0,
            duration: 0.7,
          },
          idx * 0.12
        );
      });
    }
  }

  // === BLOG POST NARRATIVE ===
  function initBlogNarrative() {
    const postContainer = document.querySelector('.blog-post-content, article');
    if (!postContainer) {
      return;
    }

    const isReduced = (window.__ANIMATIONS__ && window.__ANIMATIONS__.isReduced)
      ? window.__ANIMATIONS__.isReduced()
      : false;

    if (isReduced) {
      return;
    }

    // Paragraph appear effect with text from left
    const paragraphs = postContainer.querySelectorAll('p');
    paragraphs.forEach((p) => {
      gsap.fromTo(
        p,
        { opacity: 0, x: -20, skewY: 1 },
        {
          opacity: 1,
          x: 0,
          skewY: 0,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: p,
            start: 'top 75%',
            once: true,
          },
        }
      );
    });

    // Headings with underline animation
    const headings = postContainer.querySelectorAll('h2, h3');
    headings.forEach((h) => {
      const underline = document.createElement('div');
      underline.style.cssText =
        'position:absolute;bottom:-8px;left:0;height:3px;background:linear-gradient(90deg, #2ec4b6, #ffd97d);width:0%;border-radius:2px;';
      h.style.position = 'relative';
      h.appendChild(underline);

      gsap.fromTo(
        underline,
        { width: '0%' },
        {
          width: '100%',
          duration: 0.9,
          ease: 'power2.inOut',
          scrollTrigger: {
            trigger: h,
            start: 'top 80%',
            once: true,
          },
        }
      );
    });

    // Image parallax on scroll
    const images = postContainer.querySelectorAll('img');
    images.forEach((img) => {
      gsap.to(img, {
        scrollTrigger: {
          trigger: img,
          start: 'top center',
          end: 'bottom center',
          scrub: 0.5,
        },
        y: (self) => -self.getVelocity() * 0.1,
        ease: 'none',
      });
    });
  }

  // === TURISMO PAGE ANIMATIONS ===
  function initTurismoNarrative() {
    const sections = document.querySelectorAll('.turismo-section, .tourism-content');
    if (sections.length === 0) {
      return;
    }

    const isReduced = (window.__ANIMATIONS__ && window.__ANIMATIONS__.isReduced)
      ? window.__ANIMATIONS__.isReduced()
      : false;

    sections.forEach((section) => {
      if (isReduced) {
        section.style.opacity = '1';
        return;
      }

      // Title animation
      const title = section.querySelector('h2, h3');
      if (title) {
        gsap.fromTo(
          title,
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: section,
              start: 'top 80%',
              once: true,
            },
          }
        );
      }

      // Content fade and scale
      const content = section.querySelectorAll('p, .info-block');
      if (content.length > 0) {
        gsap.fromTo(
          content,
          { opacity: 0, y: 12 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: 'power1.out',
            stagger: 0.1,
            scrollTrigger: {
              trigger: section,
              start: 'top 75%',
              once: true,
            },
          }
        );
      }
    });
  }

  // === INITIALIZATION ===
  function init() {
    initNewsNarrative();
    initBlogNarrative();
    initTurismoNarrative();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
