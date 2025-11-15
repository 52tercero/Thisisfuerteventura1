/* ambient.js: simple canvas waves at bottom */
(function(){
  const d = document; const c = d.createElement('canvas'); c.id = 'ambient-waves';
  const ctx = c.getContext('2d');
  function resize(){ c.width = window.innerWidth; c.height = 120; }
  resize();
  (document.body || document.documentElement).appendChild(c);
  window.addEventListener('resize', resize);
  let t = 0;
  function draw(){
    const w = c.width, h = c.height; ctx.clearRect(0,0,w,h);
    const colors = ['rgba(0,136,204,0.25)','rgba(0,136,204,0.18)','rgba(0,136,204,0.12)'];
    colors.forEach((col, i)=>{
      const amp = 10 + i*5; const freq = 0.006 + i*0.002; const yBase = h - 30 - i*12;
      ctx.beginPath(); ctx.moveTo(0,h);
      for(let x=0; x<=w; x+=2){
        const y = yBase + Math.sin((x*freq)+t*(0.8+i*0.15)) * amp;
        ctx.lineTo(x,y);
      }
      ctx.lineTo(w,h); ctx.closePath(); ctx.fillStyle = col; ctx.fill();
    });
    t += 0.8; requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
})();
