# ANIMATIONS — GSAP + Three.js Integration

## Overview
- Narrative: Each section becomes a chapter with scroll-driven reveals and microinteractions (wind, sand, waves).
- Three.js: Stylized low-poly scenes — map, beaches (wave shader), volcano (breathing glow).
- Sync: GSAP ScrollTrigger drives camera and shader intensities; 2D text/UI align with 3D transitions.
- Accessibility: Global reduce-motion toggle respects `prefers-reduced-motion` and local setting.

## Modules
- `js/animations/gsap.js`: Registers ScrollTrigger, chapter reveals via `[data-chapter]`, microinteractions for buttons and windy text, and reduce-motion toggle via `window.__ANIMATIONS__`.
- `js/scenes/mapa.js`: Low-poly island plane, wind particles, camera dolly synced to scroll.
- `js/scenes/playas.js`: Wave shader plane with intensity linked to scroll.
- `js/scenes/volcan.js`: Low-poly volcano with crater glow shader, scroll-linked intensity.

## Page Wiring
- Add containers where needed:
  - `#scene-mapa` (map section)
  - `#scene-playas` (beaches section)
  - `#scene-volcan` (volcano section)
- Load CDNs: GSAP + ScrollTrigger, Three.js (defer). Load modules after DOM.

## Reduce Motion
- API: `window.__ANIMATIONS__.setReduceMotion(true|false)`; `isReduced()`.
- Respects `prefers-reduced-motion`. Disables requestAnimationFrame loops and ScrollTrigger scrub.

## Performance
- Lazy init per container presence; pixel ratio capped at 1.5.
- Keep antialias off; flat shading, minimal geometry.
- Defer script loading; scenes only run on pages with containers.

## Future Extensions
- Chapter-specific narratives per page (Inicio, Playas, Noticias, Turismo, Blog).
- Ambient audio: trigger via GSAP timelines with accessible controls.
- Texture compression and `<picture>` AVIF/WEBP fallbacks for imagery.

## Testing
- Confirm >50 FPS desktop; verify reduce-motion disabling.
- Basic a11y: keyboard navigation intact; no focus traps; contrast OK.
