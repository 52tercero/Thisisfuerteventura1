// Initialize Swiper carousels with optional parallax support
(() => {
  if (typeof window === 'undefined') return;
  const hasSwiper = typeof window.Swiper !== 'undefined';
  if (!hasSwiper) return;

  const initTimeline = () => {
    const el = document.querySelector('.timeline-swiper');
    if (!el) return null;
    // eslint-disable-next-line no-new
    return new window.Swiper(el, {
      slidesPerView: 'auto',
      spaceBetween: 12,
      freeMode: true,
      watchOverflow: true,
      observer: true,
      observeParents: true,
      parallax: true,
      breakpoints: {
        768: { spaceBetween: 16 },
        1024: { spaceBetween: 20 },
      },
    });
  };

  const initGalleries = () => {
    const galleries = document.querySelectorAll('.gallery-swiper');
    galleries.forEach((node) => {
      // eslint-disable-next-line no-new
      new window.Swiper(node, {
        loop: true,
        parallax: true,
        pagination: { el: node.querySelector('.swiper-pagination'), clickable: true },
        navigation: {
          nextEl: node.querySelector('.swiper-button-next'),
          prevEl: node.querySelector('.swiper-button-prev'),
        },
      });
    });
  };

  initTimeline();
  initGalleries();
})();
