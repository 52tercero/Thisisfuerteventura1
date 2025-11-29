"use client";
import { useEffect, useRef } from 'react';

type Props = {
  children: React.ReactNode;
  className?: string;
  once?: boolean;
  threshold?: number;
};

export default function ScrollObserver({ children, className, once=true, threshold=0.1 }: Props){
  const ref = useRef<HTMLDivElement|null>(null);
  useEffect(()=>{
    const el = ref.current; if(!el) return;
    const obs = new IntersectionObserver(entries=>{
      for(const e of entries){
        if(e.isIntersecting){
          el.classList.add('reveal-in');
          if(once) obs.unobserve(el);
        } else if(!once){
          el.classList.remove('reveal-in');
        }
      }
    },{ threshold });
    obs.observe(el);
    return ()=> obs.disconnect();
  },[once,threshold]);
  return <div ref={ref} className={className?`reveal ${className}`:'reveal'}>{children}</div>;
}