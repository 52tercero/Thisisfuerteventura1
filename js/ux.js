/* ux.js: scroll reveal, sticky header, dark mode, galleries, timeline */
(function(){
  const d = document;
  // Sticky header shrink
  const header = d.querySelector('header');
  function onScroll(){ if(!header) return; const s = window.scrollY || d.documentElement.scrollTop; header.classList.toggle('scrolled', s > 10); }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // Scroll reveal
  const io = ('IntersectionObserver' in window) ? new IntersectionObserver((entries)=>{
    entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('show'); io.unobserve(e.target); } });
  },{rootMargin:'0px 0px -10% 0px'}) : null;
  if(io){ d.querySelectorAll('.reveal').forEach(el=> io.observe(el)); }

  // Dark mode toggle
  const THEME_KEY = 'tif.theme';
  function applyTheme(t){ d.documentElement.setAttribute('data-theme', t); }
  const saved = localStorage.getItem(THEME_KEY);
  if(saved){ applyTheme(saved); }
  // Inject toggle button next to nav if not present
  const nav = d.querySelector('nav');
  if(nav && !d.querySelector('.theme-toggle')){
    const btn = d.createElement('button');
    btn.className = 'theme-toggle';
    btn.type = 'button';
    btn.title = 'Cambiar tema';
    btn.innerHTML = '<i class="fas fa-moon"></i> Modo';
    btn.addEventListener('click', ()=>{
      const cur = d.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(cur);
      localStorage.setItem(THEME_KEY, cur);
      btn.innerHTML = cur === 'dark' ? '<i class="fas fa-sun"></i> Modo' : '<i class="fas fa-moon"></i> Modo';
      // Emit custom event for particles.js and other modules
      window.dispatchEvent(new CustomEvent('data-theme-change', { detail: { theme: cur } }));
    });
    nav.parentNode && nav.parentNode.insertBefore(btn, nav.nextSibling);
  }

  // Transform simple image galleries to Swiper if Swiper is loaded
  function initGalleries(){
    if(typeof Swiper === 'undefined') return;
    d.querySelectorAll('.image-gallery .gallery-grid').forEach(grid=>{
      if(grid.dataset.enhanced === '1') return;
      const wrapper = d.createElement('div'); wrapper.className = 'swiper timeline-swiper';
      const inner = d.createElement('div'); inner.className = 'swiper-wrapper';
      ;[...grid.children].forEach(ch=>{
        const slide = d.createElement('div'); slide.className = 'swiper-slide';
        slide.appendChild(ch); inner.appendChild(slide);
        // add hover label
        const fig = slide.querySelector('figure');
        if(fig){ const cap = fig.querySelector('figcaption'); if(cap){ fig.setAttribute('data-label', cap.textContent.trim()); } }
      });
      wrapper.appendChild(inner);
      grid.parentNode.replaceChild(wrapper, grid);
      new Swiper(wrapper, { slidesPerView: 1.2, spaceBetween: 12, loop: true, centeredSlides: false,
        breakpoints: { 480:{slidesPerView:1.6}, 640:{slidesPerView:2.2}, 960:{slidesPerView:3.2} },
        autoplay: { delay: 2500, disableOnInteraction: false },
        keyboard: { enabled: true },
      });
      wrapper.dataset.enhanced = '1';
    });
  }
  // News timeline from featured cards if present
  function initNewsTimeline(){
    const container = d.getElementById('news-timeline');
    const src = d.getElementById('featured-news');
    if(!container || !src) return;
    if(typeof Swiper === 'undefined') return;
    if(container.dataset.built === '1') return;
    const wrapper = d.createElement('div'); wrapper.className = 'swiper timeline-swiper';
    const inner = d.createElement('div'); inner.className = 'swiper-wrapper';
    const cards = src.querySelectorAll('.content-card');
    if(cards.length === 0) { return; }
    cards.forEach(card=>{
      const title = card.querySelector('h3')?.textContent?.trim() || 'Noticia';
      const date = card.querySelector('.date')?.textContent?.trim() || '';
      const slide = d.createElement('div'); slide.className = 'swiper-slide';
      const pill = d.createElement('div'); pill.className = 'timeline-card'; pill.textContent = (date? date+' · ' : '') + title;
      slide.appendChild(pill); inner.appendChild(slide);
    });
    wrapper.appendChild(inner); container.appendChild(wrapper);
    new Swiper(wrapper, { slidesPerView: 'auto', spaceBetween: 10, freeMode: true, loop: true,
      speed: 6000, autoplay: { delay: 0, disableOnInteraction: false }, freeModeMomentum: false,
    });
    container.dataset.built = '1';
  }

  function tryInit(){ initGalleries(); initNewsTimeline(); }
  // Once DOM loaded, and also after a small delay to wait for async content
  if(document.readyState !== 'loading') setTimeout(tryInit, 800);
  else document.addEventListener('DOMContentLoaded', ()=> setTimeout(tryInit, 800));
  // Also observe featured-news mutations to rebuild timeline when loaded
  const featured = d.getElementById('featured-news');
  if('MutationObserver' in window && featured){
    const mo = new MutationObserver(()=> setTimeout(initNewsTimeline, 100));
    mo.observe(featured, { childList: true });
  }
})();
