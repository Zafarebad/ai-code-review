'use client';

import { useRef, useEffect } from 'react';

interface BackgroundVideoProps {
  src?: string;
  opacity?: number;
  className?: string;
}

/**
 * Premium Background Video with ambient gradients, vignette, and contrast tuning.
 * Plays smoothly behind dashboard content with z-0 positioning.
 */
export function BackgroundVideo({
  src = '/videos/bg-video.mp4',
  opacity = 0.65,
  className = '',
}: BackgroundVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.defaultMuted = true;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.warn('[BackgroundVideo] Autoplay prevented:', error);
        });
      }
    }
  }, []);

  return (
    <div
      aria-hidden="true"
      className={`absolute inset-0 pointer-events-none z-0 overflow-hidden select-none ${className}`}
    >
      {/* Video element */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover filter contrast-110 brightness-90"
        style={{ opacity }}
      >
        <source src={src} type="video/mp4" />
      </video>

      {/* Dark gradient overlay for crystal-clear readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/35 to-black/75" />

      {/* Radial vignette overlay to draw eyes to center form */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.6)_100%)]" />

      {/* Subtle brand glow accent */}
      <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[600px] h-[250px] bg-[var(--color-brand-600)]/20 rounded-full blur-3xl pointer-events-none" />
    </div>
  );
}
