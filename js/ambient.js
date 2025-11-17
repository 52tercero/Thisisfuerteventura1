/* ambient.js: canvas de olas en la base, más lento y realista */
(function(){
  const d = document; const c = d.createElement('canvas'); c.id = 'ambient-waves';
  const ctx = c.getContext('2d');

  // DPI-aware
  function resize(){
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssH = 120; // altura visible en px CSS
    c.width = Math.max(320, Math.floor(window.innerWidth * dpr));
    c.height = Math.floor(cssH * dpr);
    c.style.width = '100%';
    c.style.height = cssH + 'px';
    ctx.setTransform(1,0,0,1,0,0);
    ctx.scale(dpr, dpr);
  }
  resize();
  (document.body || document.documentElement).appendChild(c);
  window.addEventListener('resize', resize);

  // Parámetros de olas (ajustados para realismo)
  const layers = 3;
  const layerAmp = [12, 16, 20];
  const layerFreq = [0.004, 0.0052, 0.0064]; // más largas
  const layerSpeed = [0.8, 0.96, 1.08]; // lentas y con ligera variación
  const layerPhase = [0.0, 0.7, 1.4];
  const yOffsets = [32, 44, 56];

  // Color base océano
  let baseColor = '0,136,204';
  try {
    const pc = getComputedStyle(document.documentElement).getPropertyValue('--primary-color');
    const m = /rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i.exec(pc.trim());
    if (m) baseColor = `${m[1]},${m[2]},${m[3]}`;
  } catch(_){}
  const colors = [
    `rgba(${baseColor},0.23)`,
    `rgba(${baseColor},0.16)`,
    `rgba(${baseColor},0.10)`
  ];

  // Animación con delta temporal (independiente de FPS)
  let t = 0; let last = (typeof performance!=='undefined' && performance.now)? performance.now(): Date.now();
  function draw(now){
    const ts = now || ((typeof performance!=='undefined' && performance.now)? performance.now(): Date.now());
    const dt = Math.min(50, ts - last) / 1000; // cap 50ms
    last = ts;
    t += dt; // 1 unidad por segundo; layerSpeed escala por-capa

    const w = c.clientWidth, h = c.clientHeight;
    ctx.clearRect(0,0,w,h);

    for(let i=0; i<layers; i++){
      const amp = layerAmp[i];
      const freq = layerFreq[i];
      const speed = layerSpeed[i];
      const phase = layerPhase[i];
      const yBase = h - yOffsets[i];
      ctx.beginPath();
      ctx.moveTo(0,h);
      // Componente secundaria para romper uniformidad (chop)
      const chopAmp = amp * 0.25; const chopFreq = freq * 0.55; const chopSpeed = speed * 0.6;
      for(let x=0; x<=w; x+=2){
        const y1 = Math.sin(x*freq + t*speed + phase) * amp;
        const y2 = Math.sin(x*chopFreq + t*chopSpeed + phase*1.7) * chopAmp;
        const y = yBase + y1 + y2;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w,h); ctx.closePath();
      ctx.fillStyle = colors[i];
      ctx.fill();
    }

    // Espuma en la cresta de la ola superior (más realista)
    (function drawFoam(){
      const i = layers - 1; // capa superior ya dibujada al final
      const amp = layerAmp[i];
      const freq = layerFreq[i];
      const speed = layerSpeed[i];
      const phase = layerPhase[i];
      const yBase = h - yOffsets[i];
      const chopAmp = amp * 0.25; const chopFreq = freq * 0.55; const chopSpeed = speed * 0.6;
      const foamHeight = Math.max(2, Math.min(4, amp * 0.22));
      const crestThreshold = 0.82; // dónde empieza a aparecer espuma
      const density = 2; // paso en px

      // blending más suave para espuma
      const prevComp = ctx.globalCompositeOperation; ctx.globalCompositeOperation = 'screen';

      for(let x=0; x<=w; x+=density){
        const s = Math.sin(x*freq + t*speed + phase);
        const y1 = s * amp;
        const y2 = Math.sin(x*chopFreq + t*chopSpeed + phase*1.7) * chopAmp;
        const y = yBase + y1 + y2;

        // Intensidad de cresta: 0 en valle, 1 en máximo
        const crestness = Math.max(0, s);
        if (crestness > crestThreshold){
          // pseudo ruido simple y rápido dependiente de x y tiempo
          const noise = (Math.sin(x*0.35 + t*1.3) + Math.sin(x*0.12 + t*0.9 + 1.7))*0.25 + 0.5; // ~[0,1]
          const alpha = Math.min(0.95, (crestness - crestThreshold) * 1.6 * (0.55 + 0.45*noise));
          ctx.fillStyle = `rgba(255,255,255,${alpha.toFixed(3)})`;
          const jitter = (noise - 0.5) * foamHeight; // bordes irregulares
          ctx.fillRect(x, y - foamHeight - jitter, density+1, foamHeight + jitter*0.5);

          // gotitas finas salpicadas detrás de la cresta
          if ((x % 6) === 0 && alpha > 0.35){
            const dotY = y - foamHeight - 2 - noise*3;
            const dotA = alpha * 0.35;
            ctx.fillStyle = `rgba(255,255,255,${dotA.toFixed(3)})`;
            ctx.fillRect(x, dotY, 1, 1);
          }
        }
      }
      ctx.globalCompositeOperation = prevComp;
    })();
    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
})();
