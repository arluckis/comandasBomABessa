'use client';
import { useEffect, useRef, useState } from 'react';

export default function AroxCinematicScene({
  scenePhase = 'ignition', 
  customConfig = null,
  temaAnterior = 'dark',
  children
}) {
  const [isClient, setIsClient] = useState(false);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const requestRef = useRef();
  const [isMobile, setIsMobile] = useState(false);

  const isLight = temaAnterior === 'light';

  useEffect(() => {
    setIsClient(true);
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const phaseConfig = {
    ignition:    { light: 0.00, rotation: -2,   planetY: isMobile ? -240 : 60, scale: isMobile ? 0.90 : 0.85, blur: 0,   overlay: 0 },
    reveal:      { light: 0.02, rotation: -1.5, planetY: isMobile ? -260 : 40, scale: isMobile ? 0.95 : 0.90, blur: 0,   overlay: 0 },
    sync:        { light: 0.10, rotation: 0.0,  planetY: isMobile ? -280 : 15, scale: isMobile ? 1.05 : 0.98, blur: isMobile ? 0 : 2, overlay: isMobile ? 0 : 0.05 },
    handoff:     { light: 0.30, rotation: 1.5,  planetY: isMobile ? -200 : -10, scale: 1.00, blur: 4,   overlay: 0.15 },
    bridgeLight: { light: 150.0, rotation: 1.5, planetY: isMobile ? -200 : -10, scale: 1.00, blur: 12,  overlay: 1 }, 
    bridgeDark:  { light: 0.00,  rotation: 1.5, planetY: isMobile ? -200 : -10, scale: 1.00, blur: 16,  overlay: 1 } 
  };

  const activeConfig = customConfig || phaseConfig[scenePhase] || phaseConfig.ignition;

  const physics = useRef({
    mouseX: 0, targetMouseX: 0, 
    mouseY: 0, targetMouseY: 0,
    light: activeConfig.light, targetLight: activeConfig.light, 
    rotation: activeConfig.rotation, targetRotation: activeConfig.rotation, 
    planetY: activeConfig.planetY, targetPlanetY: activeConfig.planetY,
    scale: activeConfig.scale, targetScale: activeConfig.scale
  });

  useEffect(() => {
    physics.current.targetLight = activeConfig.light;
    physics.current.targetRotation = activeConfig.rotation;
    physics.current.targetPlanetY = activeConfig.planetY;
    physics.current.targetScale = activeConfig.scale;
  }, [activeConfig]);

  useEffect(() => {
    if (!isClient) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
    let width = window.innerWidth; 
    let height = window.innerHeight;
    canvas.width = width; 
    canvas.height = height;

    // --- ARTEFATOS TEMA-AWARE ---
    const PI2 = Math.PI * 2; 
    const baseCount = isMobile ? 200 : 800;
    const particleCount = isLight ? Math.floor(baseCount * 0.25) : baseCount;

    const particles = Array.from({ length: particleCount }).map(() => ({ 
      x: (Math.random() - 0.5) * 6000, 
      y: (Math.random() - 0.5) * 6000,
      baseZ: Math.random() * 2000 + 500, 
      size: isLight ? (Math.random() * 1.5 + 0.5) : (Math.random() * 0.8 + 0.1), 
      alphaMult: Math.random() * 0.5 + 0.1, 
      twinkle: !isLight && Math.random() > 0.5, 
      timeOffset: Math.random() * PI2,
      hasHalo: !isLight && Math.random() > 0.9
    }));

    const lerp = (start, end, f) => start + (end - start) * f;
    const fov = 1000;

    const handleMouseMove = (e) => {
      if (scenePhase === 'bridgeLight' || scenePhase === 'bridgeDark') return;
      physics.current.targetMouseX = (e.clientX / width - 0.5) * 0.4;
      physics.current.targetMouseY = (e.clientY / height - 0.5) * 0.4;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('resize', () => {
      width = window.innerWidth; height = window.innerHeight;
      canvas.width = width; canvas.height = height;
    }, { passive: true });

    let time = 0;

    const render = () => {
      time += 0.01; 
      const p = physics.current;
      const isBridge = scenePhase === 'bridgeLight' || scenePhase === 'bridgeDark' || activeConfig.overlay === 1;
      
      p.scale = lerp(p.scale, p.targetScale, 0.02);
      p.rotation = lerp(p.rotation, p.targetRotation, 0.02);
      p.planetY = lerp(p.planetY, p.targetPlanetY, 0.02);
      p.mouseX = lerp(p.mouseX, isBridge ? 0 : p.targetMouseX, 0.04);
      p.mouseY = lerp(p.mouseY, isBridge ? 0 : p.targetMouseY, 0.04);

      let speedLight = 0.02;
      if (isBridge && isLight) {
        const progress = Math.min(p.light / p.targetLight, 1);
        speedLight = 0.005 + (Math.pow(progress, 3) * 0.1); 
      }
      p.light = lerp(p.light, p.targetLight, speedLight);

      // FUNDAÇÃO ABSOLUTA: Frame 0 com a cor correta
      ctx.fillStyle = isLight ? '#fdfdfd' : '#030406';
      ctx.fillRect(0, 0, width, height);

      // Neblina refratada em profundidade no modo claro
      if (isLight) {
        const gradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width * 0.8);
        gradient.addColorStop(0, 'rgba(255,255,255,0)');
        gradient.addColorStop(1, 'rgba(240,244,248,0.8)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
      }

      const cx = width / 2; 
      const cy = (height / 2) + p.planetY; 
      const dimFactor = Math.max(0, 1 - (p.light * (isLight ? 2.0 : 0.08))); 

      if (dimFactor > 0.01) {
        const currentScale = p.scale;
        const parallaxX = p.mouseX * 120;
        const parallaxY = p.mouseY * 120;

        for (let i = 0; i < particles.length; i++) {
          const pt = particles[i]; 
          const actualZ = pt.baseZ / currentScale; 
          const zRatio = fov / actualZ; 
          
          const px = (pt.x * zRatio) + cx - (parallaxX * zRatio); 
          const py = (pt.y * zRatio) + cy - (parallaxY * zRatio);
          const size = Math.max(0.1, pt.size * zRatio);

          if (px < -size || px > width + size || py < -size || py > height + size) continue;

          let currentAlpha = pt.alphaMult;
          if (pt.twinkle) currentAlpha *= (0.6 + Math.sin(time + pt.timeOffset) * 0.4);
          
          const alpha = Math.min(currentAlpha, (3000 - actualZ) / 1000); 
          
          if (alpha > 0) {
             ctx.fillStyle = isLight ? `rgba(148, 163, 184, ${alpha * dimFactor * 0.4})` : `rgba(220, 235, 255, ${alpha * dimFactor})`; 
             ctx.beginPath(); 
             ctx.arc(px, py, size, 0, PI2); 
             ctx.fill();

             if (pt.hasHalo) {
               ctx.fillStyle = `rgba(160, 200, 255, ${alpha * 0.25 * dimFactor})`;
               ctx.beginPath(); ctx.arc(px, py, size * 3, 0, PI2); ctx.fill();
             }
          }
        }
      }

      if (containerRef.current) {
        const lightProg = Math.min(p.light / 150.0, 1);
        containerRef.current.style.cssText = `
          --pr-mouse-x: ${p.mouseX}; --pr-mouse-y: ${p.mouseY};
          --pr-light: ${p.light}; --pr-light-prog: ${lightProg};
          --pr-rot: ${p.rotation}deg; --pr-planet-y: ${p.planetY}px; --pr-scale: ${p.scale};
        `;
      }
      
      requestRef.current = requestAnimationFrame(render);
    };

    render();
    return () => { window.removeEventListener('mousemove', handleMouseMove); cancelAnimationFrame(requestRef.current); };
  }, [isClient, scenePhase, temaAnterior]);

  if (!isClient) return null;

  const themeClass = isLight ? 'theme-light' : 'theme-dark';
  const overlayColor = isLight ? '253, 253, 253' : '3, 4, 6'; 
  const isExiting = activeConfig.overlay === 1;

  return (
    // A cor de fundo na raiz garante zero flash de herança
    <div ref={containerRef} className={`fixed inset-0 w-full h-[100dvh] z-0 overflow-hidden font-sans select-none ${themeClass} ${isLight ? 'bg-[#fdfdfd]' : 'bg-[#030406]'}`}>
      
      <style dangerouslySetInnerHTML={{__html: `
        .cinematic-entry { animation: cinematicFadeIn 3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes cinematicFadeIn { 0% { opacity: 0; filter: blur(12px); } 100% { opacity: 1; filter: blur(0); } }

        .orbital-backlight {
          position: absolute; top: 50%; left: 50%;
          width: clamp(320px, 50vw, 600px); height: clamp(320px, 50vw, 600px);
          border-radius: 50%;
          transform: translate(-50%, -50%) translateY(var(--pr-planet-y, 0px)) scale(calc(1 + (var(--pr-light-prog) * 30))) translateZ(0);
          z-index: 0; pointer-events: none; mix-blend-mode: screen;
        }

        .arox-planet-system {
          position: absolute; top: 50%; left: 50%;
          width: clamp(320px, 50vw, 600px); height: clamp(320px, 50vw, 600px);
          pointer-events: none; z-index: 1;
          transform: translate(-50%, -50%) translateY(var(--pr-planet-y, 0px)) scale(var(--pr-scale, 1)) rotate(var(--pr-rot, 0deg)) translateZ(0);
        }

        .arox-planet {
          position: absolute; inset: 0; border-radius: 50%;
          transform: translate3d(calc(var(--pr-mouse-x, 0) * -20px), calc(var(--pr-mouse-y, 0) * -20px), 0);
          z-index: 20;
        }

        .arox-planet::after, .arox-planet::before { content: ''; position: absolute; inset: 0; border-radius: 50%; pointer-events: none; }

        .arox-ring-main {
          position: absolute; top: 50%; left: 50%; width: 120%; height: 120%; border-radius: 50%;
          transform: translate(-50%, -50%) translate3d(calc(var(--pr-mouse-x, 0) * -30px), calc(var(--pr-mouse-y, 0) * -30px), 0); 
          z-index: 10; border: 1px solid transparent;
        }
        .arox-ring-thin-group {
          position: absolute; top: 50%; left: 50%; width: 140%; height: 140%;
          transform: translate(-50%, -50%) translate3d(calc(var(--pr-mouse-x, 0) * -16px), calc(var(--pr-mouse-y, 0) * -16px), 0); z-index: 5;
        }
        .arox-ring-thin { position: absolute; top: 50%; left: 50%; border-radius: 50%; transform: translate(-50%, -50%); border: 1px solid transparent; }
        .arox-ring-thin:nth-child(1) { width: 100%; height: 100%; } .arox-ring-thin:nth-child(2) { width: 92%; height: 92%; }
        .arox-ring-thin:nth-child(3) { width: 84%; height: 84%; } .arox-ring-thin:nth-child(4) { width: 76%; height: 76%; }

        .arox-flare { position: absolute; width: 160px; height: 160px; z-index: 40; }
        .flare-bl { bottom: 10%; left: -2%; transform: translate3d(calc(var(--pr-mouse-x, 0) * -50px), calc(var(--pr-mouse-y, 0) * -50px), 0) rotate(20deg); }
        .flare-tr { top: 10%; right: -2%; transform: translate3d(calc(var(--pr-mouse-x, 0) * -50px), calc(var(--pr-mouse-y, 0) * -50px), 0) rotate(20deg); }
        .flare-core { position: absolute; top: 50%; left: 50%; width: 2px; height: 2px; border-radius: 50%; transform: translate(-50%, -50%); }
        .flare-beam { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); }
        .flare-beam.h { width: 80%; height: 1px; } .flare-beam.v { width: 80%; height: 1px; transform: translate(-50%, -50%) rotate(90deg); }
        .flare-beam.diag { width: 120%; height: 1px; transform: translate(-50%, -50%) rotate(30deg); }

        /* --- ARTE DARK MODE --- */
        .theme-dark .orbital-backlight { background: radial-gradient(circle at center, rgba(160, 190, 255, 0.15) 0%, transparent 65%); opacity: calc(var(--pr-light, 0) * 0.8); }
        .theme-dark .arox-planet-system { opacity: calc(1 - (var(--pr-light-prog) * 1.5)); }
        .theme-dark .arox-planet { background: radial-gradient(circle at 50% 50%, #06080b 0%, #020304 60%, #000000 100%); box-shadow: inset 0 0 40px rgba(0,0,0,1); }
        .theme-dark .arox-planet::after { inset: -2px; background: radial-gradient(circle at 50% 50%, rgba(255,255,255,0) 30%, rgba(255,255,255,1) 80%); opacity: calc(var(--pr-light-prog) * 4); mix-blend-mode: screen; }
        .theme-dark .arox-planet::before { background: radial-gradient(circle at 50% 100%, rgba(255,255,255,calc(min(0.2, var(--pr-light, 0) * 0.015))) 0%, transparent 60%); z-index: 21; }
        .theme-dark .arox-ring-main { border-color: rgba(255, 255, 255, 0.20); } .theme-dark .arox-ring-thin { border-color: rgba(255, 255, 255, 0.04); }
        .theme-dark .arox-ring-thin:nth-child(1) { border-color: rgba(255, 255, 255, 0.06); }
        .theme-dark .flare-core { background: rgba(255, 255, 255, 0.9); box-shadow: 0 0 6px 1px rgba(255,255,255,0.4); }
        .theme-dark .flare-beam { background: radial-gradient(ellipse at center, rgba(255,255,255,0.5) 0%, transparent 60%); }
        .theme-dark .flare-beam.diag { opacity: 0.4; }
        .theme-dark .arox-ring-main, .theme-dark .arox-ring-thin-group, .theme-dark .arox-flare { opacity: calc(1 - (var(--pr-light-prog) * 12)); }

        /* --- ARTE LIGHT MODE (EDITORIAL PREMIUM) --- */
        .theme-light .orbital-backlight {
          background: radial-gradient(circle at center, rgba(255,255,255,1) 0%, rgba(255,255,255,0.8) 30%, rgba(255,255,255,0) 70%);
          opacity: calc(0.3 + var(--pr-light-prog) * 3); mix-blend-mode: normal;
        }
        .theme-light .arox-planet-system { opacity: calc(1 - (var(--pr-light-prog) * 2)); }
        .theme-light .arox-planet {
          background: radial-gradient(circle at 35% 35%, #ffffff 0%, #e2e8f0 40%, #94a3b8 100%);
          box-shadow: inset -10px -10px 40px rgba(0,0,0,0.08), 0 20px 50px rgba(0,0,0,0.05);
          mix-blend-mode: multiply; /* Segredo da materialidade: ele sombreia o ar claro ao redor */
        }
        .theme-light .arox-planet::after {
          inset: -3px; background: radial-gradient(circle at 50% 50%, rgba(255,255,255,0) 40%, rgba(255,255,255,1) 90%);
          opacity: calc(var(--pr-light-prog) * 2); mix-blend-mode: normal;
        }
        .theme-light .arox-planet::before { display: none; }
        .theme-light .arox-ring-main { border-color: rgba(0, 0, 0, 0.04); }
        .theme-light .arox-ring-thin { border-color: rgba(0, 0, 0, 0.02); }
        .theme-light .arox-ring-thin:nth-child(1) { border-color: rgba(0, 0, 0, 0.03); }
        .theme-light .arox-flare { display: none; } /* Removemos as luzes de sci-fi escuras */
        .theme-light .arox-ring-main, .theme-light .arox-ring-thin-group { opacity: calc(0.8 - (var(--pr-light-prog) * 5)); }
      `}} />

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      <div className="orbital-backlight"></div>

      <div className="arox-planet-system cinematic-entry">
         <div className="arox-ring-main"></div>
         <div className="arox-ring-thin-group">
            <div className="arox-ring-thin"></div>
            <div className="arox-ring-thin"></div>
            <div className="arox-ring-thin"></div>
            <div className="arox-ring-thin"></div>
         </div>
         <div className="arox-planet"></div>
         <div className="arox-flare flare-bl"><div className="flare-core"></div><div className="flare-beam h"></div><div className="flare-beam v"></div><div className="flare-beam diag"></div></div>
         <div className="arox-flare flare-tr"><div className="flare-core"></div><div className="flare-beam h"></div><div className="flare-beam v"></div><div className="flare-beam diag"></div></div>
      </div>

      <div 
        className={`absolute inset-0 z-[50] pointer-events-none transition-all ${isExiting ? 'duration-[800ms] ease-in' : 'duration-[2000ms] ease-[cubic-bezier(0.25,0.1,0.25,1)]'}`}
        style={{ backdropFilter: `blur(${activeConfig.blur}px)`, WebkitBackdropFilter: `blur(${activeConfig.blur}px)`, backgroundColor: `rgba(${overlayColor}, ${activeConfig.overlay})` }}
      />
      <div className="relative z-[20] w-full h-full">{children}</div>
    </div>
  );
}