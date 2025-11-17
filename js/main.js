/**
 * main.js
 *
 * Responsable de:
 * - Alternar el menú de navegación móvil con atributos ARIA y transiciones accesibles.
 * - Validar y gestionar el formulario de newsletter.
 * - Desplazamiento suave para enlaces ancla internos.
 * - Desregistrar cualquier Service Worker previo para evitar cacheos inesperados.
 * - Forzar recarga en Inicio cuando ya estamos en Inicio para evitar contenido cacheado.
 */
document.addEventListener('DOMContentLoaded', function() {
    // Alternador de menú móvil
    const mobileMenuBtn = document.querySelector('.mobile-menu');
    const nav = document.querySelector('nav');

    if (mobileMenuBtn) {
        if (!nav) {
            console.warn('No <nav> element found for mobile menu toggle');
        } else {
            // Helper: punto de quiebre responsivo
            const isMobile = () => window.matchMedia('(max-width: 768px)').matches;

            // Asegurar que nav tenga un id para que aria-controls pueda apuntar a él
            if (!nav.id) nav.id = 'site-nav';

            // Hacer el alternador accesible: aria-controls y aria-expanded
            try {
                mobileMenuBtn.setAttribute('aria-controls', nav.id);
                const isOpen = nav.classList.contains('active');
                mobileMenuBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');

                // reflejar visibilidad inicial para tecnología asistiva
                // Configuraremos aria-hidden de forma responsiva más abajo
                nav.setAttribute('aria-hidden', isOpen ? 'false' : (isMobile() ? 'true' : 'false'));

                // Si mobileMenuBtn no es un botón nativo, asegurar que sea enfocable por teclado
                const tag = mobileMenuBtn.tagName && mobileMenuBtn.tagName.toLowerCase();
                if (tag !== 'button') {
                    if (!mobileMenuBtn.hasAttribute('role')) mobileMenuBtn.setAttribute('role', 'button');
                    if (!mobileMenuBtn.hasAttribute('tabindex')) mobileMenuBtn.setAttribute('tabindex', '0');
                }
            } catch (err) {
                console.warn('Failed to set ARIA attributes on mobile menu button', err);
            }

            // Aplicar estado de navegación responsivo (solo colapsar en móvil)
            function applyResponsiveNavState() {
                try {
                    if (isMobile()) {
                        nav.classList.add('collapsible');
                        const isOpen = nav.classList.contains('active');
                        nav.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
                        mobileMenuBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
                    } else {
                        nav.classList.remove('collapsible');
                        nav.classList.remove('active');
                        nav.setAttribute('aria-hidden', 'false');
                        mobileMenuBtn.setAttribute('aria-expanded', 'false');
                    }
                } catch (err) { /* ignore */ }
            }
            applyResponsiveNavState();

            function toggleNav() {
                if (!isMobile()) {
                    // En escritorio, nav siempre es visible; ignorar alternancia
                    return;
                }
                // alternar usando una clase para que los estilos puedan manejarse en CSS
                const willOpen = !nav.classList.contains('active');
                nav.classList.toggle('active');

                // CSS controla las transiciones mediante clases; sin estilos inline

                // actualizar aria-expanded y aria-hidden para accesibilidad
                try {
                    const expanded = nav.classList.contains('active') ? 'true' : 'false';
                    mobileMenuBtn.setAttribute('aria-expanded', expanded);
                    // aria-hidden debe ser opuesto a expanded (expanded=true -> aria-hidden=false)
                    nav.setAttribute('aria-hidden', expanded === 'true' ? 'false' : 'true');
                } catch (e) {
                    /* ignorar */
                }

                // Transición gestionada en CSS
            }

            mobileMenuBtn.addEventListener('click', toggleNav);

            // soporte de teclado: Enter y Espacio deben alternar el menú cuando está enfocado
            mobileMenuBtn.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleNav();
                }
            });

            // Recalcular maxHeight al redimensionar si nav está abierto para que el tamaño expandido coincida con el contenido
            window.addEventListener('resize', function () { try { applyResponsiveNavState(); } catch(_){} });
        }
    }

    // Envío de formulario de newsletter
    const newsletterForm = document.getElementById('newsletter-form');

    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const emailInput = this.querySelector('input[type="email"]');
            const email = emailInput ? emailInput.value.trim() : '';

            // Validación de email mejorada
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!email || !emailRegex.test(email)) {
                alert('Por favor, introduce una dirección de correo válida.');
                return;
            }

            // Micro-animación de confirmación (en lugar de alert)
            let check = this.querySelector('.submit-check');
            if(!check){ check = document.createElement('span'); check.className='submit-check'; check.textContent='✓'; this.appendChild(check); }
            requestAnimationFrame(()=>{ check.classList.add('show'); });
            setTimeout(()=>{ if(check) check.classList.remove('show'); }, 1600);
            this.reset();
            if(emailInput){ emailInput.classList.remove('valid','invalid'); }
        });
        // Validación en tiempo real
        const emailInput2 = newsletterForm.querySelector('input[type="email"]');
        const emailRegex2 = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (emailInput2) {
            emailInput2.addEventListener('input', function(){
                const v = this.value.trim();
                if(!v){ this.classList.remove('valid','invalid'); return; }
                this.classList.toggle('valid', emailRegex2.test(v));
                this.classList.toggle('invalid', !emailRegex2.test(v));
            });
        }
    }

    // Desplazamiento suave para enlaces ancla
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (!targetId || targetId === '#') return; // no-op para anclas vacías

            // Solo prevenir default y desplazarse suavemente cuando existe un elemento objetivo
            let targetElement = null;
            try {
                targetElement = document.querySelector(targetId);
            } catch (err) {
                // selector inválido
                targetElement = null;
            }

            if (targetElement) {
                e.preventDefault();
                targetElement.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // Header sticky con clase scrolled
    const header = document.querySelector('header');
    if (header) {
        let lastScroll = 0;
        let ticking = false;

        function updateHeader() {
            const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
            
            if (currentScroll > 100) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
            
            lastScroll = currentScroll;
            ticking = false;
        }

        window.addEventListener('scroll', function() {
            if (!ticking) {
                window.requestAnimationFrame(updateHeader);
                ticking = true;
            }
        });
    }
    // Lazy loading imágenes (unificada para evitar doble listener)
    const lazyLoadOptions = { root: null, rootMargin: '70px', threshold: 0.02 };
    const lazyLoadObserver = ('IntersectionObserver' in window) ? new IntersectionObserver((entries, observer) => {
        for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            const img = entry.target;
            if (img.dataset.src) {
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
            }
            img.loading = 'lazy';
            img.decoding = 'async';
            img.classList.add('loaded');
            observer.unobserve(img);
        }
    }, lazyLoadOptions) : null;
    if (lazyLoadObserver) {
        document.querySelectorAll('img[data-src], img[loading="lazy"]').forEach(img => lazyLoadObserver.observe(img));
    }

    // Marcar enlace activo con aria-current="page"
    const currentPath = location.pathname.replace(/\\+/g,'/').replace(/\/index\.html$/, '/');
    document.querySelectorAll('nav a[href]').forEach(a => {
        const href = a.getAttribute('href');
        if (!href) return;
        let normalized = href.replace(/^\.\//,'');
        if (normalized === 'index.html' && (currentPath === '/' || /\/index\.html$/.test(currentPath))) {
            a.setAttribute('aria-current','page');
        } else if (currentPath.endsWith('/' + normalized)) {
            a.setAttribute('aria-current','page');
        }
    });

    // Fallback genérico de imágenes sin inline onerror (CSP-friendly)
    (function attachImageFallbacks(){
        const FALLBACK_SRC = 'images/Fuerteventura.jpeg?v=2025110501';
        const mark = '__fallback_attached__';
        function guardAndAttach(img){
            try {
                if (!img || img[mark]) return;
                img[mark] = true;
                img.addEventListener('error', function onErr(){
                    try {
                        if (img.dataset && img.dataset.fallbackUsed === '1') return;
                        if (!img.src || img.src.endsWith('Fuerteventura.jpeg') || img.src.includes('Fuerteventura.jpeg?v=')) return;
                        img.dataset.fallbackUsed = '1';
                        img.src = FALLBACK_SRC;
                    } catch(_) { /* ignore */ }
                }, { once: false });
            } catch(_) { /* ignore */ }
        }
        document.querySelectorAll('img').forEach(guardAndAttach);
        // Observar nuevas imágenes añadidas dinámicamente
        try {
            const mo = new MutationObserver((muts)=>{
                muts.forEach(m=>{
                    m.addedNodes && m.addedNodes.forEach(node => {
                        if (node && node.nodeType === 1) {
                            if (node.tagName === 'IMG') guardAndAttach(node);
                            node.querySelectorAll && node.querySelectorAll('img').forEach(guardAndAttach);
                        }
                    });
                });
            });
            mo.observe(document.documentElement, { childList: true, subtree: true });
        } catch(_) { /* ignore */ }
    })();

    // GSAP ripple splash on button clicks
    (function setupGsapRipple(){
        try {
            const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            const urlForce = /(?:[?&])ripple=on(?:&|$)/i.test(location.search);
            const lsForce = (()=>{ try { return localStorage.getItem('rippleForce') === '1'; } catch(_) { return false; } })();
            const forceRipple = urlForce || lsForce;
            if (prefersReduced && !forceRipple) return; // respeta reduce motion salvo que esté forzado

            // Lazy-load GSAP if not already present
            function ensureGSAP(cb){
                if (window.gsap) { cb(); return; }
                if (document.getElementById('gsap-lib-loader')) { // already loading
                    const existing = document.getElementById('gsap-lib-loader');
                    existing.addEventListener('load', () => cb());
                    existing.addEventListener('error', () => {/* ignore */});
                    return;
                }
                const s = document.createElement('script');
                s.src = 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js';
                s.id = 'gsap-lib-loader';
                // Use async for dynamically injected scripts to execute promptly
                s.async = true;
                s.crossOrigin = 'anonymous';
                s.addEventListener('load', () => cb());
                // Swallow errors silently; effect just won't run
                s.addEventListener('error', () => {});
                document.head.appendChild(s);
            }

            // Parse rgb(...) string to [r,g,b]
            function parseRGB(str){
                const m = /rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i.exec(str);
                if (!m) return [46,196,182];
                return [parseInt(m[1],10), parseInt(m[2],10), parseInt(m[3],10)];
            }

            function createRipple(container, evt){
                if (!container) return;
                const rect = container.getBoundingClientRect();
                const x = (evt.clientX || (rect.left + rect.width/2)) - rect.left;
                const y = (evt.clientY || (rect.top + rect.height/2)) - rect.top;

                // Remove any existing ripples quickly (clean up old leftovers)
                try { container.querySelectorAll('.gsap-ripple, .gsap-ripple-ring, .gsap-ripple-ring2, .gsap-drop, .gsap-surface-flash').forEach(n => { if (n._removing) return; }); } catch(_){}

                // Resolve accent color from CSS variable
                const pc = getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || 'rgb(46, 196, 182)';
                const [r,g,b] = parseRGB(pc.trim());

                // Base ripple (filled)
                const ripple = document.createElement('span');
                ripple.className = 'gsap-ripple';
                ripple.style.position = 'absolute';
                ripple.style.left = (x - 10) + 'px';
                ripple.style.top = (y - 10) + 'px';
                ripple.style.width = '20px';
                ripple.style.height = '20px';
                ripple.style.borderRadius = '50%';
                ripple.style.pointerEvents = 'none';
                ripple.style.background = `radial-gradient(circle, rgba(${r},${g},${b},0.35) 0%, rgba(${r},${g},${b},0.25) 45%, rgba(${r},${g},${b},0) 60%)`;
                ripple.style.transform = 'translate(-50%, -50%) scale(0)';
                ripple.style.willChange = 'transform, opacity';

                // Ring ripple (stroke)
                const ring = document.createElement('span');
                ring.className = 'gsap-ripple-ring';
                ring.style.position = 'absolute';
                ring.style.left = (x - 12) + 'px';
                ring.style.top = (y - 12) + 'px';
                ring.style.width = '24px';
                ring.style.height = '24px';
                ring.style.borderRadius = '50%';
                ring.style.pointerEvents = 'none';
                ring.style.border = `2px solid rgba(${r},${g},${b},0.45)`;
                ring.style.boxShadow = `0 0 0 0 rgba(${r},${g},${b},0.15)`;
                ring.style.transform = 'translate(-50%, -50%) scale(0.6)';
                ring.style.willChange = 'transform, opacity, box-shadow';

                // Secondary outer ring (larger, softer)
                const ring2 = document.createElement('span');
                ring2.className = 'gsap-ripple-ring2';
                ring2.style.position = 'absolute';
                ring2.style.left = (x - 14) + 'px';
                ring2.style.top = (y - 14) + 'px';
                ring2.style.width = '28px';
                ring2.style.height = '28px';
                ring2.style.borderRadius = '50%';
                ring2.style.pointerEvents = 'none';
                ring2.style.border = `2px solid rgba(${r},${g},${b},0.25)`;
                ring2.style.transform = 'translate(-50%, -50%) scale(0.4)';
                ring2.style.willChange = 'transform, opacity';

                // Surface shimmer flash
                const flash = document.createElement('span');
                flash.className = 'gsap-surface-flash';
                flash.style.position = 'absolute';
                flash.style.left = '0';
                flash.style.top = '0';
                flash.style.right = '0';
                flash.style.bottom = '0';
                flash.style.pointerEvents = 'none';
                flash.style.background = `radial-gradient( circle at ${x}px ${y}px, rgba(255,255,255,0.35), rgba(255,255,255,0.08) 24%, rgba(255,255,255,0) 60% )`;
                flash.style.opacity = '0';
                flash.style.willChange = 'opacity';

                container.appendChild(ripple);
                container.appendChild(ring);
                container.appendChild(ring2);
                container.appendChild(flash);

                // Compute scale to cover the larger side
                const maxDim = Math.max(rect.width, rect.height);
                const endSize = Math.max(180, Math.min(320, Math.hypot(rect.width, rect.height) * 0.12));
                const scaleVal = endSize / 20; // from 20px base

                try {
                    const tl = window.gsap.timeline({ defaults: { ease: 'power2.out' } });
                    // Surface flash
                    tl.to(flash, { duration: 0.12, opacity: 1, ease: 'power1.out' }, 0)
                      .to(flash, { duration: 0.22, opacity: 0, ease: 'power1.in', onComplete(){ try{ flash.remove(); }catch(_){} } }, '>-0.04');

                    // Base fill ripple
                    tl.to(ripple, { duration: 0.72, scale: scaleVal, opacity: 0, ease: 'expo.out', onComplete(){ ripple.remove(); } }, 0.02);

                    // Primary ring
                    tl.to(ring, {
                        duration: 0.82,
                        scale: scaleVal * 0.98,
                        opacity: 0,
                        boxShadow: `0 0 0 ${Math.round(maxDim*0.12)}px rgba(${r},${g},${b},0)`,
                        onComplete(){ ring.remove(); }
                    }, 0.02);

                    // Secondary outer ring
                    tl.to(ring2, {
                        duration: 0.95,
                        scale: scaleVal * 1.2,
                        opacity: 0,
                        ease: 'expo.out',
                        onComplete(){ try { ring2.remove(); } catch(_){} }
                    }, 0.08);

                    // Water splash droplets
                    const drops = Math.max(10, Math.min(18, Math.round(Math.min(rect.width, rect.height)/30)));
                    const baseDist = Math.max(24, Math.min(72, Math.min(rect.width, rect.height) * 0.18));
                    const liftMin = Math.max(10, Math.min(24, Math.min(rect.width, rect.height) * 0.08));
                    const liftMax = liftMin + 16;
                    for (let i = 0; i < drops; i++) {
                        const a = ((i / drops) * Math.PI * 2) + (Math.random() * 0.6 - 0.3);
                        const dist = baseDist * (0.7 + Math.random() * 1.0);
                        const lift = liftMin + Math.random() * (liftMax - liftMin);
                        const dx = Math.cos(a) * dist;
                        const dy = Math.sin(a) * dist;

                        const d = document.createElement('span');
                        d.className = 'gsap-drop';
                        const size = 4 + Math.random() * 6;
                        d.style.position = 'absolute';
                        d.style.left = x + 'px';
                        d.style.top = y + 'px';
                        d.style.width = size + 'px';
                        d.style.height = size + 'px';
                        // Slight ellipse for teardrop feel
                        d.style.borderRadius = '50% / 60%';
                        d.style.pointerEvents = 'none';
                        d.style.background = `rgba(${r},${g},${b},0.9)`;
                        d.style.boxShadow = `0 1px 2px rgba(${r},${g},${b},0.25)`;
                        d.style.transform = 'translate(-50%, -50%) scale(0.6)';
                        d.style.opacity = '0';
                        d.style.willChange = 'transform, opacity';
                        container.appendChild(d);

                        const dtl = window.gsap.timeline({
                            defaults: { ease: 'power2.out' },
                            onComplete(){ try { d.remove(); } catch(_){} }
                        });
                        const upDur = 0.20 + Math.random()*0.08;
                        const downDur = 0.30 + Math.random()*0.12;
                        const rot = (Math.random() * 40 - 20);
                        // Up (arc) with slight rotation
                        dtl.to(d, { duration: upDur, x: dx*0.55, y: dy*0.55 - lift, opacity: 1, scale: 1.0, rotation: rot, ease: 'circ.out' }, 0)
                           // Down and dissipate with gravity-like ease
                           .to(d, { duration: downDur, x: dx, y: dy + lift*0.28, opacity: 0, scale: 0.55, rotation: rot*1.2, ease: 'quad.in' }, '>-0.02');
                    }
                } catch (e) {
                    // If GSAP animation fails, remove elements to avoid clutter
                    try { ripple.remove(); ring.remove(); } catch(_){}
                }
            }

            // Create or reuse a full-screen overlay layer
            let layer = document.getElementById('gsap-ripple-layer');
            if (!layer) {
                layer = document.createElement('div');
                layer.id = 'gsap-ripple-layer';
                layer.style.position = 'fixed';
                layer.style.inset = '0';
                layer.style.pointerEvents = 'none';
                layer.style.zIndex = '9999';
                document.body.appendChild(layer);
            }

            let lastTs = 0;
            let rippleDoneAt = 0; // timestamp (ms) when current splash is expected to finish
            function splashHandler(e){
                if (e.button !== undefined && e.button !== 0) return; // main button only
                const ts = e.timeStamp || Date.now();
                if (ts - lastTs < 40) return; // throttle ultra-rapid repeats
                lastTs = ts;
                ensureGSAP(() => {
                    try {
                        createRipple(layer, e);
                        // Estimate when animation completes based on current timings
                        // Longest element: ring2 starts at 0.08s and lasts 0.95s
                        const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
                        rippleDoneAt = now + Math.round((0.08 + 0.95) * 1000);
                    } catch(_) {}
                });
            }

            document.addEventListener('pointerdown', splashHandler, { capture: false, passive: true });

            // Gate default navigation until splash finishes
            let navPending = false;
            function gateNav(e){
                const a = e.target && e.target.closest && e.target.closest('a[href]');
                if (!a) return;
                const href = a.getAttribute('href') || '';
                if (!href) return;
                // ignore pure hashes and javascript: or mailto: etc.
                if (href.startsWith('#') || /^(javascript:|mailto:|tel:)/i.test(href)) return;
                // open in new tab or modified clicks shouldn't be gated
                const newTab = (a.target && a.target.toLowerCase() === '_blank');
                const modified = e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;
                if (newTab || modified) return;

                // Determine destination (preserve index self-refresh behavior)
                let destination = a.href;
                try {
                    const normalizedHref = href.replace(/^\.\//,'');
                    const isOnIndex = /\/index\.html$/.test(location.pathname) || /\/$/.test(location.pathname);
                    if (normalizedHref === 'index.html' && isOnIndex) {
                        destination = `index.html?ts=${Date.now()}`;
                    }
                } catch(_) {}

                // Prevent default and delay until current splash finishes
                e.preventDefault();
                if (navPending) return; // avoid double scheduling
                navPending = true;
                const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
                const wait = Math.max(0, rippleDoneAt - now);
                setTimeout(() => { try { location.href = destination; } catch(_) {} }, wait || 0);
            }
            document.addEventListener('click', gateNav, { capture: true, passive: false });
            window.__RIPPLE_NAV_GUARD = true;
        } catch(_) { /* ignore */ }
    })();
});

// Nota: Se evita registrar el Service Worker por defecto para prevenir cacheos inesperados.
// Si deseas habilitar PWA, elimina el bloque de anulación más abajo y registra aquí el SW.

// Eliminar cualquier Service Worker previamente registrado y no registrar ninguno nuevo
(function unregisterSW() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', function() {
            navigator.serviceWorker.getRegistrations()
                .then(registrations => {
                    registrations.forEach(reg => {
                        try { reg.unregister(); } catch (_) {}
                    });
                })
                .catch(() => {});
        });
    }
})();

// Forzar recarga si se hace clic en Inicio estando ya en Inicio (evitar contenido cacheado)
document.addEventListener('click', function (e) {
    if (window.__RIPPLE_NAV_GUARD) return; // Ripple nav guard handles this case
    const target = e.target.closest('a[href]');
    if (!target) return;
    const href = target.getAttribute('href') || '';
    if (href.replace(/^\.\//, '') === 'index.html') {
        const isOnIndex = /\/index\.html$/.test(location.pathname) || /\/$/.test(location.pathname);
        if (isOnIndex) {
            e.preventDefault();
            const bust = Date.now();
            // Small delay to play ripple before navigation
            setTimeout(() => { location.href = `index.html?ts=${bust}`; }, 220);
        }
    }
});
