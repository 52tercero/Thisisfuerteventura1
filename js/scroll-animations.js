/* scroll-animations.js - Animaciones narrativas con scroll */

// Configuración de Intersection Observer para animaciones
const observerOptions = {
    threshold: 0.15,
    rootMargin: '0px 0px -10% 0px'
};

const animateOnScroll = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('show');
            // Opcional: dejar de observar después de animar
            animateOnScroll.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observar todos los elementos con clase 'reveal'
document.addEventListener('DOMContentLoaded', () => {
    const revealElements = document.querySelectorAll('.reveal');
    revealElements.forEach(el => animateOnScroll.observe(el));
});

// Parallax suave para hero y secciones con clase parallax
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const parallaxElements = document.querySelectorAll('.parallax');
    
    parallaxElements.forEach(el => {
        const speed = el.dataset.speed || 0.5;
        el.style.transform = `translateY(${scrolled * speed}px)`;
    });
});

// Efecto de aparición gradual con diferentes delays
document.addEventListener('DOMContentLoaded', () => {
    const staggerElements = document.querySelectorAll('.stagger-item');
    staggerElements.forEach((el, index) => {
        el.style.transitionDelay = `${index * 0.1}s`;
    });
});
