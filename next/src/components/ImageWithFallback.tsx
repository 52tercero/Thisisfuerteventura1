"use client";
import React, { useState, useCallback } from 'react';

interface ImageWithFallbackProps {
  src?: string;
  alt: string;
  fallbackSrc?: string; // default placeholder
  className?: string;
}

export function ImageWithFallback({ src, alt, fallbackSrc = '/images/placeholder.svg', className }: ImageWithFallbackProps) {
  const [currentSrc, setCurrentSrc] = useState(src || fallbackSrc);
  const handleError = useCallback(() => {
    if (currentSrc !== fallbackSrc) setCurrentSrc(fallbackSrc);
  }, [currentSrc, fallbackSrc]);
  return <img src={currentSrc} alt={alt} onError={handleError} className={className} />;
}

export default ImageWithFallback;