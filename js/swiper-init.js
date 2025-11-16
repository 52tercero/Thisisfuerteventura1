// Initialize Swiper carousels with optional parallax support
(() => {
  if (typeof window === 'undefined') return;
  const hasSwiper = typeof window.Swiper !== 'undefined';
  if (!hasSwiper) return;

  const initTimeline = () => {
    const el = document.querySelector('.timeline-swiper');
    if (!(el instanceof HTMLElement)) return null;
    const config = {
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
    };
    // eslint-disable-next-line no-new
    return new window.Swiper(el, config);
  };

  const initGalleries = () => {
    const galleries = document.querySelectorAll('.gallery-swiper');
    galleries.forEach((node) => {
      if (!(node instanceof HTMLElement)) return;
      const paginationEl = node.querySelector('.swiper-pagination');
      const nextEl = node.querySelector('.swiper-button-next');
      const prevEl = node.querySelector('.swiper-button-prev');
      const config = {
        loop: true,
        parallax: true,
        pagination: paginationEl instanceof HTMLElement ? { el: paginationEl, clickable: true } : undefined,
        navigation: nextEl instanceof HTMLElement && prevEl instanceof HTMLElement ? { nextEl, prevEl } : undefined,
      };
      // eslint-disable-next-line no-new
      new window.Swiper(node, config);
    });
  };

  initTimeline();
  initGalleries();
})();
