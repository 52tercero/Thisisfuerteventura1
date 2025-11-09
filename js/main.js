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
                const willOpen = !nav.classList.contains('nav-open');
                nav.classList.toggle('nav-open');

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
                    if (nav.style && (!nav.classList.contains('nav-open'))) {
                        nav.style.display = 'none';
                    } else if (nav.style) {
                        nav.style.display = 'block';
                    }
                }

                // actualizar aria-expanded y aria-hidden para accesibilidad
                try {
                    const expanded = nav.classList.contains('nav-open') ? 'true' : 'false';
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
                        if (nav.classList.contains('nav-open')) {
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
                    if (isMobile() && nav.classList.contains('nav-open')) {
                        // si maxHeight fue limpiado después de transitionend, establecerlo temporalmente para permitir redimensionamiento suave
                        nav.style.maxHeight = nav.scrollHeight + 'px';
                        // luego limpiarlo para que el flujo natural se reanude
                        setTimeout(() => { if (isMobile() && nav.classList.contains('nav-open')) nav.style.maxHeight = ''; }, 300);
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

            // Aquí típicamente enviarías esto a tu backend
            alert(`¡Gracias por suscribirte con ${email}! Pronto recibirás nuestras actualizaciones.`);
            this.reset();
        });
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
});

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
