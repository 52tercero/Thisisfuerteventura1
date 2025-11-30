# 🎬 Animaciones GSAP - This is Fuerteventura

**Versión**: 1.0  
**Última actualización**: Noviembre 30, 2025  
**Estado**: ✅ Documentación completada | 🔄 Implementación pendiente

---

## 📋 Índice

1. [Concepto Artístico](#concepto-artístico)
2. [Configuración GSAP](#configuración-gsap)
3. [Hero Header Animations](#hero-header-animations)
4. [Scroll-Triggered Scenes](#scroll-triggered-scenes)
5. [Micro-interactions](#micro-interactions)
6. [Performance Tips](#performance-tips)
7. [Browser Support](#browser-support)

---

## 🎨 Concepto Artístico

### Filosofía de Animación
- **Ritmo**: Pausado, contemplativo (0.4s - 1.2s durations)
- **Easing**: Power2/Power3 out, sine inOut para loops
- **Estilo**: Suave, elegante, poético (no agresivo)
- **Inspiración**: Movimientos naturales de Fuerteventura

### Elementos Animados
1. **Hero Content**: Entrada suave de título, subtítulo, CTA
2. **Scroll Indicator**: Arrow bounce infinito
3. **Nav Links**: Underline animate on hover
4. **Parallax**: Video + overlay durante scroll
5. **Cards**: Fade-in staggered on scroll
6. **Gradients**: Transiciones de color suaves

---

## ⚙️ Configuración GSAP

### Instalación
```html
<!-- CDN (recomendado) -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollToPlugin.min.js"></script>

<script>
  gsap.registerPlugin(ScrollTrigger);
</script>
```

### Variables Globales
```javascript
// Color palette para animaciones
const colors = {
  marTurquesa: '#00A8B5',
  arenaDora: '#D4A574',
  solCalido: '#F89B4B',
  volcanOscuro: '#2C2C2C',
  blanco: '#FFFFFF'
};

// Easing presets
const easePresets = {
  entrance: 'power3.out',     // 0.4s-0.8s
  exit: 'power2.inOut',       // 0.3s
  hover: 'power2.out',        // 0.2s
  loop: 'sine.inOut'          // 1.5s+
};

// Duraciones estándar
const durations = {
  micro: 0.2,
  fast: 0.4,
  base: 0.6,
  slow: 0.8,
  verySlow: 1.2
};
```

---

## 🎬 Hero Header Animations

### 1. Timeline de Entrada (On Load)
```javascript
// Archivo: js/hero-animations.js

function initHeroEntrance() {
  // Guard: elemento debe existir
  if (!document.querySelector('.hero-content')) return;

  const tl = gsap.timeline({ delay: 0.2 });

  // H1 fade-in + slide up
  tl.from('.hero-content h1', {
    opacity: 0,
    y: 60,
    duration: durations.slow,
    ease: easePresets.entrance
  })

  // Subtitle fade-in + slide up (overlap)
  .from('.hero-content .hero-subtitle', {
    opacity: 0,
    y: 40,
    duration: durations.base,
    ease: easePresets.entrance
  }, '-=0.4')

  // CTA button fade-in + scale
  .from('.hero-content .btn-primary', {
    opacity: 0,
    scale: 0.85,
    duration: durations.base,
    ease: 'back.out(1.7)'
  }, '-=0.3')

  // Glow pulse en botón
  .to('.hero-content .btn-primary', {
    textShadow: [
      '0 0 10px rgba(0, 168, 181, 0.5)',
      '0 0 20px rgba(0, 168, 181, 0.8)',
      '0 0 10px rgba(0, 168, 181, 0.5)'
    ],
    repeat: -1,
    yoyo: true,
    duration: 2,
    ease: easePresets.loop
  }, 0) // Comienza inmediatamente
}

// Ejecutar cuando DOM esté listo
document.addEventListener('DOMContentLoaded', initHeroEntrance);
```

### 2. Scroll Indicator (Arrow Bounce)
```javascript
function initScrollIndicator() {
  const indicator = document.querySelector('.scroll-indicator');
  if (!indicator) return;

  gsap.to(indicator, {
    y: 15,
    opacity: 0.4,
    repeat: -1,
    yoyo: true,
    duration: 1.5,
    ease: easePresets.loop
  });
}

document.addEventListener('DOMContentLoaded', initScrollIndicator);
```

**HTML a añadir en hero**:
```html
<div class="scroll-indicator" aria-hidden="true">
  <i class="fas fa-chevron-down"></i>
</div>
```

**CSS**:
```css
.scroll-indicator {
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 1.5rem;
  color: rgba(255, 255, 255, 0.7);
  z-index: 50;
  pointer-events: none;
}
```

### 3. Nav Links Underline (Hover)
```javascript
function initNavLinkHovers() {
  const navLinks = document.querySelectorAll('.header-nav-link');

  navLinks.forEach(link => {
    link.addEventListener('mouseenter', function() {
      gsap.to(this, {
        textShadow: `0 0 10px ${colors.marTurquesa}`,
        duration: durations.micro,
        ease: easePresets.hover
      });
    });

    link.addEventListener('mouseleave', function() {
      gsap.to(this, {
        textShadow: 'none',
        duration: durations.micro,
        ease: easePresets.hover
      });
    });
  });
}

document.addEventListener('DOMContentLoaded', initNavLinkHovers);
```

---

## 📜 Scroll-Triggered Scenes

### 1. Content Cards Fade-In
```javascript
function initCardAnimations() {
  gsap.utils.toArray('.content-card').forEach((card, i) => {
    gsap.from(card, {
      opacity: 0,
      y: 60,
      duration: durations.base,
      ease: easePresets.entrance,
      scrollTrigger: {
        trigger: card,
        start: 'top 85%',
        end: 'top 50%',
        scrub: false,
        markers: false // Debug
      }
    });
  });
}

window.addEventListener('load', initCardAnimations);
```

### 2. Parallax Mejorado con GSAP
```javascript
function initParallaxGSAP() {
  const heroImg = document.querySelector('.hero-bg');
  if (!heroImg) return;

  gsap.to(heroImg, {
    y: () => window.innerHeight * 0.3, // 30% del viewport
    ease: 'none',
    scrollTrigger: {
      trigger: 'header.hero-header',
      start: 'top top',
      end: 'bottom top',
      scrub: 1, // Smooth scrubbing
      markers: false
    }
  });
}

window.addEventListener('load', initParallaxGSAP);
```

### 3. Overlay Fade-Out on Scroll
```javascript
function initOverlayFade() {
  const overlay = document.querySelector('.hero-overlay');
  if (!overlay) return;

  gsap.to(overlay, {
    opacity: 0.1,
    scrollTrigger: {
      trigger: 'header.hero-header',
      start: 'top top',
      end: 'center top',
      scrub: 0.5,
      markers: false
    }
  });
}

window.addEventListener('load', initOverlayFade);
```

---

## 🎯 Micro-interactions

### 1. Button Hover Glow
```javascript
function initButtonGlows() {
  const buttons = document.querySelectorAll('.btn');

  buttons.forEach(btn => {
    btn.addEventListener('mouseenter', function() {
      gsap.to(this, {
        boxShadow: `0 8px 30px rgba(0, 168, 181, 0.6)`,
        y: -3,
        duration: durations.micro,
        ease: easePresets.hover
      });
    });

    btn.addEventListener('mouseleave', function() {
      gsap.to(this, {
        boxShadow: 'none',
        y: 0,
        duration: durations.micro,
        ease: easePresets.hover
      });
    });
  });
}

document.addEventListener('DOMContentLoaded', initButtonGlows);
```

### 2. Form Input Focus
```javascript
function initFormFocus() {
  const inputs = document.querySelectorAll('input, textarea, select');

  inputs.forEach(input => {
    input.addEventListener('focus', function() {
      gsap.to(this, {
        borderColor: colors.marTurquesa,
        boxShadow: `0 0 10px rgba(0, 168, 181, 0.3)`,
        duration: durations.micro,
        ease: easePresets.hover
      });
    });

    input.addEventListener('blur', function() {
      gsap.to(this, {
        borderColor: '#e0e0e0',
        boxShadow: 'none',
        duration: durations.micro,
        ease: easePresets.hover
      });
    });
  });
}

document.addEventListener('DOMContentLoaded', initFormFocus);
```

### 3. Category Filter Pulse
```javascript
function initFilterPulse() {
  const filters = document.querySelectorAll('.filter-btn');

  filters.forEach(filter => {
    filter.addEventListener('click', function() {
      gsap.fromTo(this, 
        { scale: 1 },
        { 
          scale: 1.05, 
          yoyo: true,
          repeat: 1,
          duration: durations.micro,
          ease: 'power2.out'
        }
      );
    });
  });
}

document.addEventListener('DOMContentLoaded', initFilterPulse);
```

---

## ⚡ Performance Tips

### 1. Usar Will-Change
```css
/* En elementos animados frecuentemente */
.hero-bg {
  will-change: transform;
}

.scroll-indicator {
  will-change: transform, opacity;
}
```

### 2. GPU Acceleration
```javascript
// Siempre usar transform en lugar de position
gsap.to(element, {
  x: 100,  // ✅ GPU accelerated
  y: 100,  // ✅ GPU accelerated
  // NO usar left, top ❌
});
```

### 3. Debounce Scroll Events
```javascript
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Uso
window.addEventListener('scroll', debounce(() => {
  // Update animations
}, 100));
```

### 4. Lazy Load GSAP
```javascript
// Solo cargar en desktop
const isMobile = window.matchMedia('(max-width: 768px)').matches;

if (!isMobile) {
  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js';
  document.head.appendChild(script);
}
```

---

## 🌐 Browser Support

```javascript
// Verificar soporte GSAP
const hasGSAP = typeof gsap !== 'undefined';

if (hasGSAP) {
  // Inicializar animaciones
  initHeroEntrance();
  initScrollIndicator();
  // ...
} else {
  console.warn('GSAP no cargó, usando fallback CSS');
}
```

### Fallback CSS para navegadores sin GSAP
```css
/* Animaciones CSS como backup */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.hero-content h1 {
  animation: fadeInUp 0.8s ease-out 0.2s both;
}

.hero-content .hero-subtitle {
  animation: fadeInUp 0.6s ease-out 0.4s both;
}

.btn-primary {
  animation: fadeInUp 0.6s ease-out 0.6s both;
}
```

---

## 📝 Roadmap de Implementación

### Phase 1: Hero Animations (30 min)
- [ ] Cargar GSAP CDN
- [ ] Crear `js/hero-animations.js`
- [ ] Implementar entrance timeline
- [ ] Añadir scroll indicator
- [ ] Testar en desktop + móvil

### Phase 2: Scroll Triggers (1 hora)
- [ ] Cargar ScrollTrigger plugin
- [ ] Card fade-in animations
- [ ] Parallax mejorado
- [ ] Overlay fade
- [ ] Testar performance

### Phase 3: Micro-interactions (1 hora)
- [ ] Nav link hovers
- [ ] Button glows
- [ ] Form focus effects
- [ ] Filter pulses
- [ ] Pulido final

### Phase 4: Optimization (30 min)
- [ ] Minificar archivos
- [ ] Will-change tunning
- [ ] Lazy load GSAP
- [ ] Performance audit
- [ ] Mobile testing

---

## 🔗 Referencias

- [GSAP Docs](https://greensock.com/gsap/)
- [ScrollTrigger Guide](https://greensock.com/docs/v3/Plugins/ScrollTrigger)
- [Easing Functions](https://greensock.com/docs/v3/Eases)
- [Performance Best Practices](https://greensock.com/docs/v3/GSAP/gsap.globalTimeline())

---

## 📊 Checklist Final

- [ ] Todas las animaciones funcionan en desktop
- [ ] Responsive en tablet/móvil
- [ ] No hay jank (60fps)
- [ ] Accessible (motion preferences respetadas)
- [ ] Performance > 90 Lighthouse
- [ ] SEO no afectado
- [ ] Fallbacks CSS funcionan

---

**Estado**: ✅ Documentación completada  
**Implementación pendiente**: Sí  
**Prioridad**: 🔴 Alta  
**Estimado**: 3-4 horas total
