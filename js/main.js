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
                const isOpen = nav.classList.contains('nav-open');
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
                        // Preparar para colapso/expansión animado en móvil
                        nav.style.overflow = 'hidden';
                        if (nav.classList.contains('nav-open')) {
                            nav.style.maxHeight = nav.scrollHeight + 'px';
                            nav.style.opacity = '1';
                            nav.setAttribute('aria-hidden', 'false');
                            mobileMenuBtn.setAttribute('aria-expanded', 'true');
                        } else {
                            nav.style.maxHeight = '0';
                            nav.style.opacity = '0';
                            nav.setAttribute('aria-hidden', 'true');
                            mobileMenuBtn.setAttribute('aria-expanded', 'false');
                        }
                    } else {
                        // Escritorio: asegurar que nav sea completamente visible y limpiar overrides inline
                        nav.classList.remove('nav-open');
                        nav.style.maxHeight = '';
                        nav.style.opacity = '';
                        nav.style.overflow = '';
                        nav.style.display = '';
                        nav.setAttribute('aria-hidden', 'false');
                        mobileMenuBtn.setAttribute('aria-expanded', 'false');
                    }
                } catch (err) {
                    // ignorar
                }
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

                // Usar altura medida para transición suave
                try {
                    if (willOpen) {
                        // establecer maxHeight al scrollHeight para expandir
                        const h = nav.scrollHeight;
                        nav.style.maxHeight = h + 'px';
                        // asegurar visibilidad durante animación
                        nav.style.opacity = '1';
                    } else {
                        // colapsar
                        nav.style.maxHeight = '0';
                        nav.style.opacity = '0';
                    }
                } catch (err) {
                    // fallback: alternar display si la medición falla
                    if (nav.style && (!nav.classList.contains('active'))) {
                        nav.style.display = 'none';
                    } else if (nav.style) {
                        nav.style.display = 'block';
                    }
                }

                // actualizar aria-expanded y aria-hidden para accesibilidad
                try {
                    const expanded = nav.classList.contains('active') ? 'true' : 'false';
                    mobileMenuBtn.setAttribute('aria-expanded', expanded);
                    // aria-hidden debe ser opuesto a expanded (expanded=true -> aria-hidden=false)
                    nav.setAttribute('aria-hidden', expanded === 'true' ? 'false' : 'true');
                } catch (e) {
                    /* ignorar */
                }

                // Después de que la transición se complete, si nav está abierto remover maxHeight inline para que el contenido pueda crecer naturalmente
                try {
                    nav.addEventListener('transitionend', function onEnd(evt) {
                        if (evt.propertyName !== 'max-height') return;
                        if (nav.classList.contains('active')) {
                            // permitir altura natural
                            nav.style.maxHeight = '';
                        }
                        // remover este handler
                        nav.removeEventListener('transitionend', onEnd);
                    });
                } catch (e) {
                    // ignorar
                }
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
            window.addEventListener('resize', function () {
                try {
                    applyResponsiveNavState();
                    if (isMobile() && nav.classList.contains('active')) {
                        // si maxHeight fue limpiado después de transitionend, establecerlo temporalmente para permitir redimensionamiento suave
                        nav.style.maxHeight = nav.scrollHeight + 'px';
                        // luego limpiarlo para que el flujo natural se reanude
                        setTimeout(() => { if (isMobile() && nav.classList.contains('active')) nav.style.maxHeight = ''; }, 300);
                    }
                } catch (e) { /* ignorar */ }
            });
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
});

// Lazy loading de imágenes mejorado
const lazyLoadOptions = {
    root: null,
    rootMargin: '50px',
    threshold: 0.01
};

const lazyLoadObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const img = entry.target;
            if (img.dataset.src) {
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
            }
            img.classList.add('loaded');
            observer.unobserve(img);
        }
    });
}, lazyLoadOptions);

document.addEventListener('DOMContentLoaded', () => {
    const lazyImages = document.querySelectorAll('img[data-src], img[loading="lazy"]');
    lazyImages.forEach(img => lazyLoadObserver.observe(img));
});

// Registrar Service Worker para PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered:', registration);
            })
            .catch(error => {
                console.log('SW registration failed:', error);
            });
    });
}

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
    const target = e.target.closest('a[href]');
    if (!target) return;
    const href = target.getAttribute('href') || '';
    if (href.replace(/^\.\//, '') === 'index.html') {
        const isOnIndex = /\/index\.html$/.test(location.pathname) || /\/$/.test(location.pathname);
        if (isOnIndex) {
            e.preventDefault();
            const bust = Date.now();
            location.href = `index.html?ts=${bust}`;
        }
    }
});
