"use client";
import { useEffect, useRef, useState } from 'react';
import styles from './ambient-sounds.module.css';
import { getMessages } from '../lib/i18n';

const SOURCES: Record<string,{src:string; label:string}> = {
  ocean: { src: '/sounds/olas.mp3', label: 'Olas' },
  wind: { src: '/sounds/viento.mp3', label: 'Viento' },
  music: { src: '/sounds/musica_local.mp3', label: 'Música local' }
};

type AmbientI18n = {
  title: string; description: string; select: string; play: string; stop: string; statusSelect: string; statusPlaying: (label:string)=>string; statusStopped: string; toggleOpen: string; toggleClose: string;
};

function getStrings(locale: string): AmbientI18n{
  switch(locale){
    case 'en': return { title:'Ambient sounds', description:'Enable ocean, wind or local music while browsing.', select:'— Select —', play:'Play', stop:'Stop', statusSelect:'Select an ambience.', statusPlaying:(l)=>'Playing: '+l, statusStopped:'Stopped', toggleOpen:'Ambient sounds', toggleClose:'Close sounds' };
    case 'de': return { title:'Umgebungsgeräusche', description:'Aktiviere Wellen, Wind oder lokale Musik beim Browsen.', select:'— Auswählen —', play:'Abspielen', stop:'Stop', statusSelect:'Wähle eine Umgebung.', statusPlaying:(l)=>'Wird abgespielt: '+l, statusStopped:'Gestoppt', toggleOpen:'Umgebungsgeräusche', toggleClose:'Geräusche schließen' };
    default: return { title:'Sonidos ambientales', description:'Activa olas, viento o música local mientras navegas.', select:'— Selecciona —', play:'Reproducir', stop:'Detener', statusSelect:'Selecciona un ambiente.', statusPlaying:(l)=>'Reproduciendo: '+l, statusStopped:'Detenido', toggleOpen:'Sonidos ambiente', toggleClose:'Cerrar sonidos' };
  }
}

export default function AmbientSounds(){
  const [open,setOpen] = useState(false);
  const [current,setCurrent] = useState<string>('');
  const [status,setStatus] = useState<string>('');
  const audioRef = useRef<HTMLAudioElement|null>(null);
  const playingRef = useRef<string>('');

  useEffect(()=>{
    if(!open && audioRef.current){ audioRef.current.pause(); }
  },[open]);

  async function playSelected(){
    try {
      if(audioRef.current){ audioRef.current.pause(); }
      if(!current){ setStatus('Selecciona un ambiente.'); return; }
      const info = SOURCES[current];
      const el = new Audio(info.src);
      el.loop = true;
      audioRef.current = el;
      await el.play();
      playingRef.current = current;
      setStatus('Reproduciendo: ' + info.label);
    } catch (e){
      setStatus('No se pudo reproducir.');
    }
  }

  function stop(){
    if(audioRef.current){ audioRef.current.pause(); audioRef.current = null; }
    playingRef.current='';
    setStatus('Detenido');
  }

  const html = typeof document!=='undefined' ? document.documentElement : null;
  const locale = html?.getAttribute('lang') || 'es';
  const messages = getMessages(locale);
  const ambient = messages.ambient || getStrings(locale);
  return (
    <div className={styles.ambientWrap} aria-label="Sonidos ambientales opcionales">
      <button type="button" onClick={()=> setOpen(o=>!o)} className={styles.toggleBtn} aria-expanded={open} aria-controls="ambient-panel">
        {open ? '✖' : '♫'} <span>{open ? ambient.toggleClose : ambient.toggleOpen}</span>
      </button>
      {open && (
        <div id="ambient-panel" className={styles.panel}>
          <strong className="text-sm">{ambient.title}</strong>
          <p className="mt-1 text-xs">{ambient.description}</p>
          <select className={styles.select} value={current} onChange={e=> setCurrent(e.target.value)} aria-label={ambient.select}>
            <option value="">{ambient.select}</option>
            {Object.entries(SOURCES).map(([key,info])=> <option key={key} value={key}>{info.label}</option>)}
          </select>
          <div className="flex gap-2 mt-2">
            <button type="button" onClick={playSelected} className={styles.playBtn}>{ambient.play}</button>
            <button type="button" onClick={stop} className={styles.playBtn} style={{background:'var(--primary-color)'}}>{ambient.stop}</button>
          </div>
          <div className={styles.status} aria-live="polite">{status || ''}</div>
        </div>
      )}
    </div>
  );
}