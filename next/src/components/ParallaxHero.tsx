"use client";
import { useEffect, useRef } from "react";

export default function ParallaxHero({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    function onScroll(){
      const y = window.scrollY;
      el.style.transform = `translate3d(0, ${Math.min(y * 0.2, 60)}px, 0)`;
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return <div ref={ref}>{children}</div>;
}
