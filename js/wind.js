(function(){
  'use strict';
  const ready = (fn) => (document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', fn, { once: true }) : fn());

  function shouldEnable(){
    const url = new URL(window.location.href);
    const q = url.searchParams.get('wind');
    if (q === 'on' || q === 'true') return true;
    if (q === 'off' || q === 'false') return false;
    const ls = localStorage.getItem('windEffect');
    if (ls === 'on') return true;
    if (ls === 'off') return false;
    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return !prefersReduced; // por defecto activo salvo reduce
  }

  function clamp01(n){ return Math.max(0, Math.min(1, n)); }
  function parseLevel(v){
    if (!v) return null;
    const s = String(v).trim().toLowerCase();
    if (s === 'low') return 0.35;
    if (s === 'med' || s === 'mid' || s === 'medium') return 0.6;
    if (s === 'high' || s === 'max') return 0.9;
    const f = parseFloat(s);
    return isFinite(f) ? clamp01(f) : null;
  }
  function getWindDetail(){
    try{ const v = parseLevel(new URL(location.href).searchParams.get('windDetail')); if (v !== null) return v; }catch(_){ }
    try{ const v = parseLevel(getComputedStyle(document.documentElement).getPropertyValue('--wind-detail')); if (v !== null) return v; }catch(_){ }
    try{ const v = parseLevel(localStorage.getItem('windDetail')); if (v !== null) return v; }catch(_){ }
    return 0.7; // por defecto más detallado
  }
  function getWindSpeed(){
    // factor multiplicador (0.5..2.0), 1 = normal
    const parse = (x) => { const f = parseFloat(x); return isFinite(f) ? Math.max(0.3, Math.min(2.5, f)) : null; };
    try{ const q = new URL(location.href).searchParams.get('windSpeed'); const v = parse(q); if (v) return v; }catch(_){ }
    try{ const css = getComputedStyle(document.documentElement).getPropertyValue('--wind-speed'); const v = parse(css); if (v) return v; }catch(_){ }
    try{ const ls = parse(localStorage.getItem('windSpeed')); if (ls) return ls; }catch(_){ }
    return 0.7; // por defecto más lento
  }

  function ensureGSAP(cb){
    if (window.gsap) { cb(window.gsap); return; }
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js';
    s.defer = true; s.onload = () => cb(window.gsap);
    document.head.appendChild(s);
  }

  function createOverlay(){
    const el = document.createElement('div');
    el.id = 'wind-overlay';
    el.style.position = 'fixed';
    el.style.left = '0';
    el.style.top = '0';
    el.style.width = '100%';
    el.style.height = '100%';
    el.style.pointerEvents = 'none';
    el.style.zIndex = '9999';
    el.style.mixBlendMode = 'screen';
    const c = document.createElement('canvas');
    c.width = 16; c.height = 16; // se ajusta luego
    el.appendChild(c);
    document.body.appendChild(el);
    return { wrap: el, canvas: c };
  }

  function WindSystem(canvas, gsap){
    const ctx = canvas.getContext('2d');
    const DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    let w = 0, h = 0;
    const DETAIL = getWindDetail();
    const SPEED = getWindSpeed();

    function resize(){
      const r = canvas.parentElement.getBoundingClientRect();
      w = Math.max(1, Math.floor(r.width));
      h = Math.max(1, Math.floor(r.height));
      canvas.width = Math.floor(w * DPR);
      canvas.height = Math.floor(h * DPR);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    const gusts = [];
    const whisps = [];

    // Fondo: hebras muy suaves que cruzan el lienzo lentamente
    function initWhisps(){
      const n = Math.round(10 + 20*DETAIL);
      for (let i=0; i<n; i++){
        whisps.push({
          x: Math.random()*w,
          y: Math.random()*h,
          len: w*gsap.utils.random(0.08, 0.18),
          amp: gsap.utils.random(6, 16),
          sway: gsap.utils.random(0.0006, 0.0015),
          lw: gsap.utils.random(0.6, 1.2),
          phase: Math.random()*Math.PI*2,
          alpha: 0.18 + 0.22*DETAIL,
          vx: 20 * SPEED // px/s aprox
        });
      }
    }
    initWhisps();

    function spawnGust(){
      const y = gsap.utils.random(h*0.15, h*0.8);
      const count = Math.round(gsap.utils.random(12, 24) * (0.8 + DETAIL));
      const duration = gsap.utils.random(3.0, 5.8) / Math.max(0.4, SPEED); // más lento
      const amp = gsap.utils.random(12, 36);
      const sway = gsap.utils.random(0.0012, 0.0026);
      const lwBase = gsap.utils.random(1.2, 2.4);
      const colorCore = 'rgba(255,255,255,0.9)';
      const startX = -w*0.2;
      const endX = w*1.2;

      const streaks = new Array(count).fill(0).map((_, i) => ({
        offY: gsap.utils.random(-24, 24),
        phase: gsap.utils.random(0, Math.PI*2),
        len: gsap.utils.random(w*0.14, w*0.34),
        lw: lwBase * (0.7 + 0.8*Math.random()),
        alpha: 0,
        dash: Math.random() > 0.55,
        blur: 3 + 8*DETAIL,
        colorCore
      }));

      const gust = { x: startX, y, amp, sway, colorCore, streaks, t: 0, life: 0, duration };
      gusts.push(gust);

      // timeline de entrada -> pico -> salida
      const tl = gsap.timeline({ onComplete(){
        // marcar para destruir
        gust.life = 9999;
      }});
      tl.to(gust, { x: (startX+endX)/2, alpha: 1, duration: duration*0.45, ease: 'sine.out' })
        .to(gust, { x: endX, duration: duration*0.55, ease: 'sine.inOut' }, '<')
        .to(gust, { t: 1, duration, ease: 'linear' }, 0);

      // animar alpha por streak
      streaks.forEach((s, idx) => {
        gsap.fromTo(s, { alpha: 0 }, { alpha: 1, duration: duration*0.25, ease: 'sine.out', yoyo: true, repeat: 1, repeatDelay: duration*0.35, delay: idx*0.02 });
      });

      // gotitas/partículas 
      const particles = Math.round(gsap.utils.random(8, 16) * (0.5 + DETAIL));
      for (let i=0; i<particles; i++){
        const p = { x: startX + Math.random()*w*0.2, y: y + gsap.utils.random(-24, 24), a: 1, r: gsap.utils.random(0.6, 1.8), vy: gsap.utils.random(-10, -3), rot: gsap.utils.random(-20, 20) };
        gsap.to(p, { x: endX, y: p.y + gsap.utils.random(-16, 16), a: 0, rotation: p.rot*gsap.utils.random(0.8, 1.2), duration: duration*gsap.utils.random(0.9, 1.2), ease: 'power1.out', onUpdate(){ p.draw && p.draw(); } });
        gust.streaks.push({ particle: p });
      }

      return tl;
    }

    function draw(){
      ctx.clearRect(0,0,w,h);

      // dibuja hebras de fondo
      ctx.save();
      whisps.forEach(ws => {
        ws.x += (ws.vx/60);
        if (ws.x - ws.len > w) { ws.x = -ws.len; ws.y = Math.random()*h; }
        const x1 = ws.x;
        const x2 = ws.x + ws.len;
        const y1 = ws.y + Math.sin((x1 + ws.phase) * ws.sway) * ws.amp;
        const y2 = ws.y + Math.sin((x2 + ws.phase) * ws.sway) * ws.amp;
        ctx.globalAlpha = ws.alpha;
        ctx.lineWidth = ws.lw;
        ctx.strokeStyle = 'rgba(255,255,255,0.8)';
        ctx.beginPath();
        const cx = (x1 + x2)/2;
        const cy = (y1 + y2)/2 + Math.sin((x1 + ws.phase)*ws.sway*1.2) * ws.amp * 0.6;
        ctx.quadraticCurveTo(cx, cy, x2, y2);
        ctx.stroke();
      });
      ctx.restore();
      // leve velo general
      //ctx.fillStyle = 'rgba(255,255,255,0.0)'; ctx.fillRect(0,0,w,h);

      gusts.forEach((g, gi) => {
        const x0 = g.x;
        const y0 = g.y;
        const amp = g.amp;
        const sway = g.sway;

        g.streaks.forEach((s, si) => {
          if (s.particle){
            const p = s.particle;
            p.draw = function(){
              ctx.save();
              ctx.globalAlpha = Math.max(0, Math.min(1, p.a));
              ctx.fillStyle = 'rgba(255,255,255,0.85)';
              ctx.beginPath();
              ctx.ellipse(p.x, p.y, p.r*2, p.r, 0, 0, Math.PI*2);
              ctx.fill();
              ctx.restore();
            };
            p.draw();
            return;
          }
          const len = s.len;
          const x1 = x0 - len*0.2;
          const x2 = x0 + len*0.8;
          const y1 = y0 + s.offY + Math.sin((x0 + s.phase) * sway) * amp * 0.4;
          const y2 = y0 + s.offY + Math.sin((x0 + s.phase + len) * sway) * amp * 0.4;
          ctx.save();
          ctx.globalAlpha = Math.max(0, Math.min(1, s.alpha * 0.95));
          ctx.lineWidth = s.lw;
          ctx.lineCap = 'round';
          if (s.dash){
            ctx.setLineDash([8, 10]);
          } else {
            ctx.setLineDash([]);
          }
          // gradiente para caída de color
          const grad = ctx.createLinearGradient(x1, y1, x2, y2);
          grad.addColorStop(0, 'rgba(255,255,255,0)');
          grad.addColorStop(0.35, g.colorCore);
          grad.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.strokeStyle = grad;
          ctx.shadowColor = 'rgba(255,255,255,0.6)';
          ctx.shadowBlur = s.blur;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          // curva suave con control vertical para cartoon feel
          const cx = (x1 + x2) / 2;
          const cy = (y1 + y2) / 2 + Math.sin((x0 + s.phase) * sway * 1.5) * amp * 0.6;
          ctx.quadraticCurveTo(cx, cy, x2, y2);
          ctx.stroke();
          ctx.restore();
        });

        g.life += 1/60;
      });

      // limpiar gusts muertos
      for (let i = gusts.length - 1; i >= 0; i--){
        if (gusts[i].life > 3){
          gusts.splice(i,1);
        }
      }
    }

    // bucle de dibujo con gsap ticker (sin crear otro rAF)
    gsap.ticker.add(draw);

    // spawner aleatorio
    const loop = () => {
      const baseDelay = gsap.utils.random(5.5, 10.5); // más espaciado
      const delay = baseDelay / Math.max(0.4, SPEED);
      gsap.delayedCall(delay, () => { spawnGust(); loop(); });
    };
    loop();

    // API mínima
    return {
      spawn: spawnGust,
      destroy(){
        gsap.ticker.remove(draw);
        window.removeEventListener('resize', resize);
      }
    };
  }

  ready(() => {
    if (!shouldEnable()) return;
    ensureGSAP((gsap) => {
      const { wrap, canvas } = createOverlay();
      WindSystem(canvas, gsap);
    });
  });
})();
