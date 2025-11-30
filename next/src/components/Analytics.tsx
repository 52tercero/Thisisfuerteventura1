"use client";
import { useEffect } from 'react';

export default function Analytics(){
  useEffect(()=>{
    // Defer legacy analytics script injection if present
    const url = '/js/analytics.js';
    const el = document.createElement('script');
    el.src = url; el.async = true; el.defer = true;
    el.onerror = ()=>{ /* silently ignore if not found */ };
    document.head.appendChild(el);
    return ()=>{ el.remove(); };
  },[]);
  return null;
}