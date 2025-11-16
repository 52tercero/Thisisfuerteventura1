/* narrative-scroll.js: GSAP ScrollTrigger para animaciones narrativas secuenciales */
(function(){
  if(typeof gsap === 'undefined' || !gsap.registerPlugin) return;
  gsap.registerPlugin(ScrollTrigger);

  const d = document;

  // Fade-in profundo con parallax para secciones .reveal-deep
  d.querySelectorAll('.reveal-deep').forEach(el => {
    gsap.from(el, {
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        end: 'top 30%',
        scrub: 1,
        // markers: true // descomenta para debug
      },
      opacity: 0,
      y: 80,
      scale: 0.95,
      ease: 'power2.out',
      immediateRender: false
    });
  });

  // Stagger de tarjetas en grids (.card-stagger)
  d.querySelectorAll('.card-stagger').forEach(grid => {
    const cards = grid.querySelectorAll('.content-card, .news-card, .tourism-card, .beach-card');
    if(!cards.length) return;
    gsap.from(cards, {
      scrollTrigger: {
        trigger: grid,
        start: 'top 75%'
      },
      opacity: 0,
      y: 60,
      stagger: 0.1,
      duration: 0.8,
      ease: 'power3.out',
      immediateRender: false
    });
  });

  // Hero title reveal con efecto "curtain" (opt-in via data-animate="curtain")
  d.querySelectorAll('.hero-content h2[data-animate="curtain"]').forEach(title => {
    if (title.dataset.split === '1') return;
    const chars = title.textContent.split('');
    title.innerHTML = chars.map(c => `<span class="ns-inline">${c === ' ' ? '&nbsp;' : c}</span>`).join('');
    title.dataset.split = '1';
    gsap.from(title.children, {
      scrollTrigger: {
        trigger: title,
        start: 'top 80%'
      },
      opacity: 0,
      y: 50,
      rotationX: -90,
      stagger: 0.03,
      duration: 1,
      ease: 'back.out(1.4)',
      immediateRender: false
    });
  });

  // Parallax suave en imágenes de hero
  d.querySelectorAll('.hero.parallax').forEach(hero => {
    gsap.to(hero, {
      scrollTrigger: {
        trigger: hero,
        start: 'top top',
        end: 'bottom top',
        scrub: true
      },
      backgroundPositionY: '50%',
      ease: 'none'
    });
  });

  // Contador animado para cifras (.count-up)
  d.querySelectorAll('.count-up').forEach(el => {
    const target = parseInt(el.dataset.count || el.textContent, 10);
    if(!isFinite(target)) return;
    gsap.from({ val: 0 }, {
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        once: true
      },
      val: target,
      duration: 2,
      ease: 'power2.out',
      onUpdate: function(){
        el.textContent = Math.round(this.targets()[0].val);
      }
    });
  });

  // Timeline horizontal para galerías (.gallery-timeline)
  d.querySelectorAll('.gallery-timeline').forEach(gallery => {
    const track = gallery.querySelector('.gallery-track');
    if(!track) return;
    gsap.to(track, {
      scrollTrigger: {
        trigger: gallery,
        start: 'top 60%',
        end: 'bottom 40%',
        scrub: 1
      },
      x: () => -(track.scrollWidth - gallery.offsetWidth),
      ease: 'none'
    });
  });

  // UI de capítulos: etiqueta la sección visible (por h2) mientras haces scroll
  let chapterBox = d.getElementById('chapter-indicator');
  if(!chapterBox){
    chapterBox = d.createElement('div');
    chapterBox.id = 'chapter-indicator';
    chapterBox.setAttribute('aria-live','polite');
    // Evitar estilos inline: depender de estilos globales por defecto
    d.body.appendChild(chapterBox);
  }
  const sections = Array.from(d.querySelectorAll('main section.reveal, main section.hero'));
  sections.forEach(sec => {
    const h = sec.querySelector('h2, h1');
    if(!h) return;
    const title = h.textContent.trim();
    ScrollTrigger.create({
      trigger: sec,
      start: 'top 40%',
      end: 'bottom 40%',
      onEnter: ()=> chapterBox.textContent = `Capítulo: ${title}`,
      onEnterBack: ()=> chapterBox.textContent = `Capítulo: ${title}`
    });
  });
})();
