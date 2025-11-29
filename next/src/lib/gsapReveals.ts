"use client";
import { useEffect } from "react";
import { gsap } from "gsap";

export function useStaggerReveal(selector: string, options: { delay?: number } = {}) {
  useEffect(() => {
    const q = document.querySelectorAll(selector);
    if (!q || q.length === 0) return;
    gsap.from(q, {
      opacity: 0,
      y: 18,
      duration: 0.6,
      stagger: 0.08,
      ease: "power2.out",
      delay: options.delay ?? 0.1,
    });
  }, [selector, options.delay]);
}
