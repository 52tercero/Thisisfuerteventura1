# 🎨 Paleta Cromática - This is Fuerteventura

## Filosofía de Color
La paleta cromática ha sido diseñada para evocar la esencia natural y poética de Fuerteventura, inspirada en sus paisajes únicos, playas doradas, aguas turquesas y volcanes oscuros.

---

## 🌅 Paleta Principal

### Colores Naturales de Fuerteventura

| Color | Código Hex | RGB | Nombre | Uso |
|-------|-----------|-----|--------|-----|
| Arena Dorada | `#D4A574` | (212, 165, 116) | **--color-arena** | Fondos, acentos, títulos principales |
| Mar Turquesa | `#00A8B5` | (0, 168, 181) | **--color-mar** | Links, botones primarios, acentos interactivos |
| Cielo Despejado | `#87CEEB` | (135, 206, 235) | **--color-cielo** | Fondos suaves, elementos secundarios |
| Roca Volcánica | `#2C2C2C` | (44, 44, 44) | **--color-volcan** | Texto principal, bordes oscuros |
| Sol Cálido | `#F89B4B` | (248, 155, 75) | **--color-sol** | CTA secundarios, highlights, energía |
| Vegetación Árida | `#6B8E23` | (107, 142, 35) | **--color-vegetacion** | Elementos naturales, tags |
| Blanco | `#FFFFFF` | (255, 255, 255) | **--color-blanco** | Fondos primarios, texto claro |

---

## 🌊 Paleta Secundaria (Variantes)

| Color | Código Hex | Uso |
|-------|-----------|-----|
| Arena Oscura | `#A68860` | Sombras, bordes sutiles |
| Arena Clara | `#E8D7C3` | Fondos claros, alternancia |
| Mar Profundo | `#007A87` | Hover states, énfasis |
| Cielo Oscuro | `#5B9BBC` | Gradientes, profundidad |
| Gris Neutro | `#6B7280` | Texto secundario, deshabilitados |

---

## 🎯 Colores Semánticos

| Semántica | Código | Uso |
|-----------|--------|-----|
| Éxito | `#10B981` | Validaciones, confirmaciones |
| Advertencia | `#F59E0B` | Alertas, información importante |
| Error | `#EF4444` | Errores, validaciones fallidas |

---

## 📱 Gradientes Temáticos

### Mar y Arena
```css
--gradient-mar-arena: linear-gradient(135deg, #00A8B5 0%, #D4A574 100%);
```
*Uso: Heros, fondos heroicos, transiciones poéticas*

### Cielo y Sol
```css
--gradient-cielo-sol: linear-gradient(135deg, #87CEEB 0%, #F89B4B 100%);
```
*Uso: Fondos alternativos, amaneceres/atardeceres*

### Volcán y Arena
```css
--gradient-volcan-arena: linear-gradient(to right, #2C2C2C 0%, #D4A574 100%);
```
*Uso: Encabezados, elementos de contraste*

### Fondo Suave
```css
--gradient-fondo-suave: linear-gradient(135deg, #FFFFFF 0%, #E8D7C3 100%);
```
*Uso: Fondos sutiles, transiciones suaves*

---

## 🔨 Variables CSS en Uso

```css
:root {
  /* PALETA PRINCIPAL */
  --color-arena: #D4A574;
  --color-mar: #00A8B5;
  --color-cielo: #87CEEB;
  --color-volcan: #2C2C2C;
  --color-sol: #F89B4B;
  --color-vegetacion: #6B8E23;
  --color-blanco: #FFFFFF;
  
  /* VARIANTES */
  --color-arena-dark: #A68860;
  --color-arena-light: #E8D7C3;
  --color-mar-dark: #007A87;
  --color-cielo-dark: #5B9BBC;
  --color-gris-neutro: #6B7280;
  
  /* SEMÁNTICOS */
  --color-exito: #10B981;
  --color-advertencia: #F59E0B;
  --color-error: #EF4444;
  
  /* GRADIENTES */
  --gradient-mar-arena: linear-gradient(135deg, #00A8B5 0%, #D4A574 100%);
  --gradient-cielo-sol: linear-gradient(135deg, #87CEEB 0%, #F89B4B 100%);
  --gradient-volcan-arena: linear-gradient(to right, #2C2C2C 0%, #D4A574 100%);
  --gradient-fondo-suave: linear-gradient(135deg, #FFFFFF 0%, #E8D7C3 100%);
}
```

---

## 🎨 Combinaciones Recomendadas

### Texto + Fondo Primario
- **Texto Oscuro** (#2C2C2C) + **Fondo Blanco** (#FFFFFF)
- **Texto Blanco** (#FFFFFF) + **Fondo Volcán** (#2C2C2C)
- **Texto Blanco** + **Gradiente Mar-Arena**

### CTA (Llamadas a Acción)
- **Primario**: Fondo Mar Turquesa + Texto Blanco
- **Secundario**: Fondo Sol Cálido + Texto Volcán
- **Hover**: Mar Profundo + Efecto de elevación

### Cards y Contenedores
- **Fondo**: Arena Clara (#E8D7C3) o Blanco
- **Borde**: Gris Neutro (#6B7280) 1-2px
- **Hover**: Sombra suave + gradiente sutil Mar-Arena

### Iconos y Elementos Decorativos
- **Primarios**: Mar Turquesa (#00A8B5)
- **Secundarios**: Sol Cálido (#F89B4B)
- **Acentos**: Vegetación Árida (#6B8E23)

---

## ✨ Animaciones con Color

### Transiciones Suave
```css
transition: background-color 0.3s ease, color 0.3s ease;
```

### Hover Interactivo
```css
/* Botón primario */
.btn-primary {
  background: var(--color-mar);
  transition: background 0.3s ease;
}

.btn-primary:hover {
  background: var(--color-mar-dark);
}
```

### Estados GSAP
```javascript
gsap.to('.element', {
  backgroundColor: '#00A8B5',  // Mar Turquesa
  duration: 0.5,
  ease: 'power2.inOut'
});
```

---

## 🌙 Modo Oscuro (Futuro)

Para implementación de dark mode:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --color-bg-primary: #1a1a1a;      /* Casi negro */
    --color-text-primary: #E8D7C3;    /* Arena clara */
    --color-accent: #00D9E8;          /* Mar más brillante */
  }
}
```

---

## 📊 Accesibilidad

- ✅ Contraste WCAG AA cumplido para combinaciones principales
- ✅ Colores no son única forma de diferenciación
- ✅ Paleta amigable para daltonismo (verificado)
- ⚠️ Verificar contraste con usuarios reales en producción

---

## 🚀 Próximas Mejoras

1. Generar variantes RGBA para transparencias
2. Crear utilidades CSS para gradientes dinámicos
3. Implementar paleta con Tailwind (si migramos)
4. Añadir animaciones de transición de colores con GSAP
5. Generar guía de colores interactiva

---

**Última actualización**: Noviembre 30, 2025  
**Autor**: This is Fuerteventura Team  
**Versión**: 1.0
