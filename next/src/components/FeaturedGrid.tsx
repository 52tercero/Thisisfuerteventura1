"use client";
import { useEffect } from "react";
import { useStaggerReveal } from "@/lib/gsapReveals";

export default function FeaturedGrid({ children }: { children: React.ReactNode }){
  useStaggerReveal('#featured-news > *', { delay: 0.1 });
  useEffect(()=>{},[]);
  return <>{children}</>;
}
