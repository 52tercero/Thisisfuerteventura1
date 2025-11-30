"use client";
import { useEffect, useRef, useState } from "react";

interface HeroVideoProps {
  src: string;
  poster?: string;
  className?: string;
}

export default function HeroVideo({ src, poster, className = "w-full h-full object-cover" }: HeroVideoProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [failed, setFailed] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const handleError = () => {
      setFailed(true);
    };
    const handleLoaded = () => {
      // Try to play programmatically in case autoplay did not trigger yet
      const playAttempt = v.play();
      if (playAttempt && typeof playAttempt.then === "function") {
        playAttempt.then(() => setStarted(true)).catch(() => setFailed(true));
      } else {
        setStarted(true);
      }
    };
    v.addEventListener("error", handleError);
    v.addEventListener("loadeddata", handleLoaded);
    return () => {
      v.removeEventListener("error", handleError);
      v.removeEventListener("loadeddata", handleLoaded);
    };
  }, [src]);

  if (failed) {
    return <img src={poster || "/images/turismo/la-oliva.avif"} alt="Fuerteventura" className={className} />;
  }

  return (
    <video
      ref={videoRef}
      className={className + (started ? "" : " opacity-0 animate-fade-in")}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      poster={poster}
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}
