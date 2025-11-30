"use client";
import { useEffect, useRef } from 'react';

export default function Particles(){
  const ref = useRef<HTMLCanvasElement|null>(null);
  useEffect(()=>{
    const canvas = ref.current; if(!canvas) return;
    const ctx = canvas.getContext('2d'); if(!ctx) return;
    let raf = 0; const particles = Array.from({length: 60}, ()=>({ x: Math.random()*window.innerWidth, y: Math.random()*window.innerHeight, vx:(Math.random()-0.5)*0.6, vy:(Math.random()-0.5)*0.6 }));
    function resize(){ canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
    resize(); window.addEventListener('resize', resize);
    function loop(){
      ctx.clearRect(0,0,canvas.width,canvas.height);
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      for(const p of particles){
        p.x+=p.vx; p.y+=p.vy;
        if(p.x<0||p.x>canvas.width) p.vx*=-1; if(p.y<0||p.y>canvas.height) p.vy*=-1;
        ctx.beginPath(); ctx.arc(p.x,p.y,1.8,0,Math.PI*2); ctx.fill();
      }
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);
    return ()=>{ cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  },[]);
  return <canvas ref={ref} style={{position:'fixed', inset:0, zIndex:0, pointerEvents:'none'}} aria-hidden="true" />;
}