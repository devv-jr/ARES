'use client';

import { useState, useEffect } from 'react';
import { Bug } from 'lucide-react';

export default function HackerLoadingScreen({ onComplete }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(id);
          return 100;
        }
        const step = Math.random() * 2.5 + 0.4;
        return Math.min(prev + step, 100);
      });
    }, 60);

    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (progress >= 100) {
      const timer = setTimeout(() => onComplete?.(), 800);
      return () => clearTimeout(timer);
    }
  }, [progress, onComplete]);

  const getStatusText = () => {
    const p = Math.floor(progress);
    if (progress >= 100) return '> Agente listo para operar. [OK]';
    if (progress >= 71) return `> Conectando con servicios de IA... [${p}%]`;
    if (progress >= 36) return `> Cargando módulos de seguridad... [${p}%]`;
    return `> Inicializando ARES... [${p}%]`;
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black overflow-hidden">
      {/* Keyframes (vibras hacker) */}
      <style>{`
        @keyframes bug-wobble {
          from { transform: translateX(0px) rotate(-2deg); }
          to   { transform: translateX(4px) rotate(2deg); }
        }
        @keyframes scanline-move {
          0%   { transform: translateY(0); }
          100% { transform: translateY(4px); }
        }
      `}</style>

      {/* Overlay de scanlines para el rollo cyberpunk */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(255,255,255,0.5) 0px, rgba(255,255,255,0.5) 1px, transparent 1px, transparent 3px)',
        }}
      />

      {/* === BARRA DE PROGRESO === */}
      <div className="relative w-[80vw] max-w-3xl px-4">
        <div
          className="relative h-3 w-full overflow-visible rounded-full bg-white"
          style={{
            boxShadow:
              '0 0 25px rgba(220, 38, 38, 0.35), 0 0 60px rgba(220, 38, 38, 0.15)',
          }}
        >
          {/* Relleno rojo que avanza */}
          <div
            className="absolute left-0 top-0 h-full rounded-full bg-red-600"
            style={{
              width: `${progress}%`,
              boxShadow: '0 0 12px rgba(220, 38, 38, 0.85) inset',
              transition: 'width 80ms linear',
            }}
          />

          {/* BUG — lado rojo (persiguiendo), borde derecho pegado a la división */}
          <div
            className="absolute top-1/2 z-10"
            style={{ left: `${progress}%`, transform: 'translate(-100%, -50%)' }}
          >
            <div
              style={{
                animation: 'bug-wobble 0.35s ease-in-out infinite alternate',
                transformOrigin: 'center',
              }}
            >
              <Bug
                className="h-8 w-8 text-red-500"
                style={{
                  filter: 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.95))',
                }}
                strokeWidth={2.5}
              />
            </div>
          </div>
        </div>
      </div>

      {/* === TEXTO DE ESTADO === */}
      <p className="mt-8 font-mono text-sm md:text-base text-red-500 tracking-wider select-none">
        {getStatusText()}
        <span
          className="ml-1 inline-block w-2 bg-red-500 align-middle animate-pulse"
          style={{ height: '1em' }}
        />
      </p>
    </div>
  );
}
