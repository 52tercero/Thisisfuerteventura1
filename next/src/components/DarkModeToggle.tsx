"use client";
import { useEffect, useState } from 'react';

const THEME_KEY = 'fuerteventura-theme';

function getPreferred(){
  if(typeof window==='undefined') return 'light';
  const saved = localStorage.getItem(THEME_KEY);
  if(saved) return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export default function DarkModeToggle(){
  const [theme,setTheme] = useState('light');
  useEffect(()=>{ setTheme(getPreferred()); },[]);
  useEffect(()=>{
    const root = document.documentElement;
    if(theme==='dark') root.setAttribute('data-theme','dark'); else root.removeAttribute('data-theme');
    try { localStorage.setItem(THEME_KEY, theme); } catch{}
  },[theme]);
  useEffect(()=>{
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = (e: MediaQueryListEvent)=>{ if(!localStorage.getItem(THEME_KEY)){ setTheme(e.matches ? 'dark':'light'); } };
    mq.addEventListener('change', listener); return ()=> mq.removeEventListener('change', listener);
  },[]);
  return (
    <button
      type="button"
      aria-label={theme==='dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
      aria-pressed={theme==='dark'}
      onClick={()=> setTheme(theme==='dark' ? 'light':'dark')}
      className="theme-toggle inline-flex items-center justify-center w-10 h-10 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-xl"
    >
      <span className="sr-only">Toggle theme</span>
      {theme==='dark' ? '🌞' : '🌙'}
    </button>
  );
}