'use client';
import { useState, useEffect, useRef } from 'react';

export default function PreComanda({ 
  onFinalizarAbertura,
  isAntecipado = false,
  temaAnterior = 'dark',
  onAcessarSistema,
  temPendencia = false,
  onResolverPendencia,
  usuarioNome = 'Usuário',
  isFreshLogin = false,
  caixaAberto = false
}) {
  const estadoInicial = isFreshLogin ? 'boas-vindas' : (temPendencia ? 'pendencia' : (isAntecipado ? 'antecipado' : 'inicio'));

  const [etapa, setEtapa] = useState(estadoInicial);
  const [valorCaixa, setValorCaixa] = useState('');
  const [isClient, setIsClient] = useState(false);
  const [isMounting, setIsMounting] = useState(true);
  
  const [isExiting, setIsExiting] = useState(false);

  const canvasRef = useRef(null);
  const requestRef = useRef();
  
  const physics = useRef({
    mouseX: 0, targetMouseX: 0, 
    mouseY: 0, targetMouseY: 0,
    light: 0, targetLight: 0, 
    rotation: 0, targetRotation: 0, 
    planetY: 0, targetPlanetY: 0,
    scale: 1, targetScale: 1
  });

  const envStates = {
    'boas-vindas': { light: 0.1, rotation: 0,  planetY: 10, scale: 0.98 },
    pendencia:     { light: 0.1, rotation: -2, planetY: 15, scale: 0.98 },
    antecipado:    { light: 0.1, rotation: 0,  planetY: 10, scale: 0.99 },
    inicio:        { light: 0.2, rotation: 2,  planetY: 0,  scale: 1.00 },
    data:          { light: 0.4, rotation: 5,  planetY: -5, scale: 1.01 },
    valor:         { light: 0.6, rotation: 8,  planetY: -10, scale: 1.02 },
    pronto:        { light: 1.2, rotation: 12, planetY: -15, scale: 1.05 },
    exit:          { light: 2.5, rotation: 20, planetY: -20, scale: 1.15 } 
  };

  useEffect(() => {
    setIsClient(true);
    document.body.style.overflow = 'hidden'; 
    const timer = setTimeout(() => setIsMounting(false), 50);
    return () => { document.body.style.overflow = ''; clearTimeout(timer); };
  }, []);

  useEffect(() => {
    const state = envStates[etapa] || envStates.inicio;
    physics.current.targetLight = state.light;
    physics.current.targetRotation = state.rotation;
    physics.current.targetPlanetY = state.planetY;
    physics.current.targetScale = state.scale;
  }, [etapa]);

  const dataHoje = isClient ? new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : '';

  useEffect(() => {
    if (!isClient) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    let width = window.innerWidth; let height = window.innerHeight;
    canvas.width = width; canvas.height = height;

    const starsLayer1 = Array.from({ length: 800 }).map(() => ({ 
      x: (Math.random() - 0.5) * 6000, y: (Math.random() - 0.5) * 6000,
      baseZ: Math.random() * 2000 + 1500, size: Math.random() * 0.4 + 0.1, alphaMult: Math.random() * 0.2 + 0.1, twinkle: false, timeOffset: 0
    }));
    
    const starsLayer2 = Array.from({ length: 250 }).map(() => ({ 
      x: (Math.random() - 0.5) * 5000, y: (Math.random() - 0.5) * 5000,
      baseZ: Math.random() * 800 + 700, size: Math.random() * 0.8 + 0.4, alphaMult: Math.random() * 0.4 + 0.2, twinkle: Math.random() > 0.5, timeOffset: Math.random() * Math.PI * 2
    }));

    const starsLayer3 = Array.from({ length: 50 }).map(() => ({ 
      x: (Math.random() - 0.5) * 4000, y: (Math.random() - 0.5) * 4000,
      baseZ: Math.random() * 400 + 200, size: Math.random() * 1.5 + 1.0, alphaMult: Math.random() * 0.6 + 0.4, twinkle: true, timeOffset: Math.random() * Math.PI * 2, hasHalo: true
    }));

    const stars = [...starsLayer1, ...starsLayer2, ...starsLayer3];
    const lerp = (start, end, f) => start + (end - start) * f;

    const handleMouseMove = (e) => {
      physics.current.targetMouseX = (e.clientX / width - 0.5) * 0.6;
      physics.current.targetMouseY = (e.clientY / height - 0.5) * 0.6;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', () => {
      width = window.innerWidth; height = window.innerHeight;
      canvas.width = width; canvas.height = height;
    });

    let time = 0;

    const render = () => {
      time += 0.012; 
      const p = physics.current;
      
      p.mouseX = lerp(p.mouseX, p.targetMouseX, 0.04); 
      p.mouseY = lerp(p.mouseY, p.targetMouseY, 0.04);
      p.light = lerp(p.light, p.targetLight, 0.02); 
      p.rotation = lerp(p.rotation, p.targetRotation, 0.015); 
      p.planetY = lerp(p.planetY, p.targetPlanetY, 0.015);
      p.scale = lerp(p.scale, p.targetScale, 0.015);

      ctx.fillStyle = '#030406';
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2; const cy = height / 2;

      for (let i = 0; i < stars.length; i++) {
        const star = stars[i]; 
        const actualZ = star.baseZ / p.scale; 
        
        const fov = 1000;
        const offsetX = p.mouseX * 120 * (1000 / actualZ); 
        const offsetY = p.mouseY * 120 * (1000 / actualZ);
        
        const px = (star.x / actualZ) * fov + cx - offsetX; 
        const py = (star.y / actualZ) * fov + cy - offsetY;
        
        let currentAlpha = star.alphaMult;
        if (star.twinkle) {
          currentAlpha *= (0.6 + Math.sin(time + star.timeOffset) * 0.4);
        }
        
        const alpha = Math.min(currentAlpha, (3000 - actualZ) / 1000); 
        const size = Math.max(0.1, star.size * (fov / actualZ));
        
        if (px > 0 && px < width && py > 0 && py < height && alpha > 0) {
           ctx.fillStyle = `rgba(220, 235, 255, ${alpha})`; 
           ctx.beginPath(); 
           ctx.arc(px, py, size, 0, Math.PI * 2); 
           ctx.fill();

           if (star.hasHalo && size > 1.2) {
             ctx.fillStyle = `rgba(160, 200, 255, ${alpha * 0.25})`;
             ctx.beginPath();
             ctx.arc(px, py, size * 3, 0, Math.PI * 2);
             ctx.fill();
           }
        }
      }

      document.documentElement.style.setProperty('--pr-mouse-x', p.mouseX);
      document.documentElement.style.setProperty('--pr-mouse-y', p.mouseY);
      document.documentElement.style.setProperty('--pr-light', p.light);
      document.documentElement.style.setProperty('--pr-rot', `${p.rotation}deg`);
      document.documentElement.style.setProperty('--pr-planet-y', `${p.planetY}px`);
      document.documentElement.style.setProperty('--pr-scale', p.scale);
      
      requestRef.current = requestAnimationFrame(render);
    };

    render();
    return () => { window.removeEventListener('mousemove', handleMouseMove); cancelAnimationFrame(requestRef.current); };
  }, [isClient]);

  const goToStep = (novaEtapa) => {
    if(isExiting || etapa === 'pronto') return;
    setEtapa(novaEtapa);
  };

  const handleSequenceFinal = (callback) => {
    if(isExiting) return;
    setEtapa('pronto'); 
    
    setTimeout(() => {
      setIsExiting(true);
      setEtapa('exit'); 
      setTimeout(() => { callback(); }, 1200); 
    }, 1500); 
  };

  if (!isClient) return null;

  const getSunClass = () => {
    switch(etapa) {
      case 'boas-vindas': return 'scale-[0.5] opacity-20 blur-[1px] bg-[#fff]';
      case 'pendencia':
      case 'antecipado':
      case 'inicio': return 'scale-[0.8] opacity-30 blur-[1px] bg-[#fff]';
      case 'data':   return 'scale-[1.5] opacity-50 blur-[2px] shadow-[0_0_40px_10px_rgba(255,255,255,0.1)]';
      case 'valor':  return 'scale-[3] opacity-80 blur-[2px] shadow-[0_0_80px_20px_rgba(255,255,255,0.2)]';
      case 'pronto': return 'scale-[8] opacity-100 blur-[3px] shadow-[0_0_120px_30px_rgba(255,255,255,0.4)]';
      case 'exit':   return temaAnterior === 'light' ? 'scale-[300] opacity-100 bg-white shadow-none transition-[transform,background-color] duration-[1200ms]' : 'scale-[300] opacity-100 bg-[#09090b] shadow-none transition-[transform,background-color] duration-[1200ms]';
      default:       return 'scale-50 opacity-20';
    }
  };

  return (
    <div className={`fixed inset-0 w-full h-[100dvh] z-[999999] bg-[#030406] overflow-hidden text-zinc-200 font-sans select-none transition-opacity duration-1000 ${isExiting ? (temaAnterior==='dark' ? 'bg-[#09090b]' : 'bg-[#fafafa]') : ''}`}>
      
      <style dangerouslySetInnerHTML={{__html: `
        :root { 
          --pr-mouse-x: 0; --pr-mouse-y: 0; --pr-light: 0; 
          --pr-rot: 0deg; --pr-planet-y: 0px; --pr-scale: 1;
        }

        .cinematic-entry { animation: cinematicFadeIn 2.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
        @keyframes cinematicFadeIn { 0% { opacity: 0; filter: blur(10px); transform: translate(-50%, -40%) scale(1.02); } 100% { opacity: 1; filter: blur(0); transform: translate(-50%, -50%) scale(1); } }

        .step-transition { animation: elegantStepFade 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
        @keyframes elegantStepFade { 0% { opacity: 0; transform: translateY(6px); filter: blur(2px); } 100% { opacity: 1; transform: translateY(0); filter: blur(0); } }

        .arox-planet-container {
          position: absolute; top: 50%; left: 50%;
          width: clamp(280px, 45vw, 550px); height: clamp(280px, 45vw, 550px);
          pointer-events: none; z-index: 1;
          transform: translate(-50%, -50%) translate3d(calc(var(--pr-mouse-x) * -12px), calc(var(--pr-mouse-y) * -12px + var(--pr-planet-y)), 0) rotate(var(--pr-rot)) scale(var(--pr-scale));
          will-change: transform;
        }

        .arox-planet {
          width: 100%; height: 100%; border-radius: 50%;
          background: radial-gradient(circle at 65% 35%, #151c24 0%, #0a0d14 40%, #040508 80%, #000000 100%);
          box-shadow: 
            inset -30px -30px 60px rgba(0,0,0,0.9), 
            inset 20px 20px 50px rgba(110, 160, 210, calc(0.02 + var(--pr-light)*0.1)), 
            inset -10px 10px 30px rgba(220, 140, 80, calc(0.01 + var(--pr-light)*0.08)),
            0 0 100px rgba(80, 130, 200, calc(0.05 + var(--pr-light)*0.15));
          position: relative;
        }

        .arox-planet::after {
          content: ''; position: absolute; inset: -10px; border-radius: 50%;
          background: radial-gradient(circle at 65% 35%, rgba(160, 190, 220, calc(0.02 + var(--pr-light)*0.15)) 0%, transparent 60%);
          filter: blur(15px); z-index: -1;
        }

        .cockpit-wrapper {
          position: relative; z-index: 10;
          transform: translate3d(calc(var(--pr-mouse-x) * 6px), calc(var(--pr-mouse-y) * 6px), 0) rotateX(calc(var(--pr-mouse-y) * 0.8deg)) rotateY(calc(var(--pr-mouse-x) * -0.8deg));
          will-change: transform; transition: opacity 0.5s ease;
        }

        input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
      `}} />

      <div className={`absolute top-[8%] right-[15%] w-[8px] h-[8px] rounded-full transition-all duration-1000 ease-[cubic-bezier(0.4,0,0.2,1)] z-[5] ${getSunClass()}`} />

      <canvas ref={canvasRef} className={`absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-1000 ${isExiting ? 'opacity-0' : 'opacity-100'}`} />

      <div className={`arox-planet-container cinematic-entry ${isExiting ? 'opacity-0 transition-opacity duration-[800ms]' : ''}`}>
         <div className="arox-planet"></div>
      </div>

      <div className={`relative z-10 w-full h-full flex flex-col items-center justify-center px-6 perspective-[1200px] transition-all duration-[1500ms] ${isMounting ? 'opacity-0 translate-y-4 blur-sm' : 'opacity-100 translate-y-0 blur-0'} ${isExiting ? 'opacity-0 scale-95 pointer-events-none' : ''}`}>
        
        <div className="cockpit-wrapper w-full max-w-[440px] bg-[#05060A]/85 backdrop-blur-[40px] border border-white/[0.05] rounded-3xl p-10 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.06)] flex flex-col min-h-[440px]">
          
          <div className="w-full flex justify-center mb-10 shrink-0">
            <span className="text-[11px] font-bold tracking-[0.4em] text-zinc-500 uppercase">AROX</span>
          </div>

          <div className="relative flex-1 flex flex-col w-full overflow-hidden">
            
            {etapa === 'boas-vindas' && (
              <div key="boas-vindas" className="flex flex-col h-full step-transition items-center justify-center">
                <div className="text-center shrink-0 w-full mt-4">
                  <h1 className="text-[24px] font-medium tracking-tight text-white mb-3">Bem-vindo, {usuarioNome}</h1>
                  <p className="text-[15px] text-zinc-400 font-light">Tudo pronto para começar.</p>
                </div>
                <div className="mt-auto pt-8 w-full shrink-0 flex flex-col gap-3">
                  <button onClick={() => {
                    if (temPendencia) goToStep('pendencia');
                    else if (caixaAberto) handleSequenceFinal(() => onAcessarSistema());
                    else goToStep(isAntecipado ? 'antecipado' : 'inicio');
                  }} className="w-full py-4 bg-white text-black text-[13px] font-semibold tracking-wide rounded-xl transition-all hover:bg-zinc-200 shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-[0.98]">
                    Continuar
                  </button>
                </div>
              </div>
            )}

            {etapa === 'pendencia' && (
              <div key="pendencia" className="flex flex-col h-full step-transition">
                <div className="text-center shrink-0">
                  <h1 className="text-[22px] font-medium tracking-tight text-zinc-100 mb-3">Conciliação Pendente</h1>
                  <p className="text-[14px] text-zinc-400 leading-relaxed font-light">Existem registros financeiros não processados no turno anterior que requerem sua atenção.</p>
                </div>
                <div className="mt-auto pt-8 shrink-0">
                  <button onClick={() => handleSequenceFinal(() => onResolverPendencia && onResolverPendencia())} className="w-full py-4 bg-white text-black text-[13px] font-semibold tracking-wide rounded-xl transition-all hover:bg-zinc-200 shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-[0.98]">
                    Resolver Pendências
                  </button>
                </div>
              </div>
            )}

            {etapa === 'antecipado' && (
              <div key="antecipado" className="flex flex-col h-full step-transition">
                <div className="text-center shrink-0">
                  <h1 className="text-[22px] font-medium tracking-tight text-zinc-100 mb-3">Acesso Administrativo</h1>
                  <p className="text-[14px] text-zinc-400 leading-relaxed font-light">O estabelecimento ainda não está no horário habitual de abertura. Deseja abrir antecipadamente ou apenas acessar o sistema?</p>
                </div>
                <div className="mt-auto pt-8 shrink-0 flex flex-col gap-3">
                  <button onClick={() => goToStep('data')} className="w-full py-4 bg-white text-black text-[13px] font-semibold tracking-wide rounded-xl transition-all hover:bg-zinc-200 shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-[0.98]">
                    Abrir Antecipadamente
                  </button>
                  <button onClick={() => handleSequenceFinal(() => onAcessarSistema ? onAcessarSistema() : onFinalizarAbertura(0))} className="w-full py-3.5 bg-transparent border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.02] text-[13px] font-medium tracking-wide rounded-xl transition-all active:scale-[0.98]">
                    Apenas Acessar
                  </button>
                </div>
              </div>
            )}

            {etapa === 'inicio' && (
              <div key="inicio" className="flex flex-col h-full step-transition">
                <div className="text-center shrink-0">
                  <h1 className="text-[22px] font-medium tracking-tight text-zinc-100 mb-3">Abertura de Caixa</h1>
                  <p className="text-[14px] text-zinc-400 leading-relaxed font-light">O ambiente de controle está sincronizado e os módulos estão prontos para inicialização.</p>
                </div>
                <div className="mt-auto pt-8 shrink-0 flex flex-col gap-3">
                  <button onClick={() => goToStep('data')} className="w-full py-4 bg-white text-black text-[13px] font-semibold tracking-wide rounded-xl transition-all hover:bg-zinc-200 shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-[0.98]">
                    Configurar Abertura
                  </button>
                  <button onClick={() => handleSequenceFinal(() => onAcessarSistema())} className="w-full py-3.5 bg-transparent border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.02] text-[13px] font-medium tracking-wide rounded-xl transition-all active:scale-[0.98]">
                    Agora não
                  </button>
                </div>
              </div>
            )}

            {etapa === 'data' && (
              <div key="data" className="flex flex-col h-full step-transition">
                <div className="text-center shrink-0">
                  <h1 className="text-[22px] font-medium tracking-tight text-zinc-100 mb-3">Data Operacional</h1>
                  <p className="text-[14px] text-zinc-400 font-light">Confirme a data base que será registrada para os movimentos desta sessão.</p>
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-[18px] font-medium text-zinc-200 capitalize tracking-wide">{dataHoje}</p>
                </div>
                <div className="mt-auto pt-4 shrink-0 flex gap-3">
                  <button onClick={() => goToStep(temPendencia ? 'pendencia' : (isAntecipado ? 'antecipado' : 'inicio'))} className="px-6 py-4 bg-transparent text-zinc-500 hover:text-zinc-300 text-[13px] font-medium rounded-xl transition-colors">
                    Voltar
                  </button>
                  <button onClick={() => goToStep('valor')} className="flex-1 py-4 bg-white text-black text-[13px] font-semibold tracking-wide rounded-xl transition-all hover:bg-zinc-200 active:scale-[0.98]">
                    Continuar
                  </button>
                </div>
              </div>
            )}

            {etapa === 'valor' && (
              <div key="valor" className="flex flex-col h-full step-transition">
                <div className="text-center shrink-0">
                  <h1 className="text-[22px] font-medium tracking-tight text-zinc-100 mb-3">Fundo de Troco</h1>
                  <p className="text-[14px] text-zinc-400 font-light">Insira o saldo em espécie atualmente disponível na gaveta da operação.</p>
                </div>
                <div className="flex-1 flex items-center justify-center py-6">
                  <div className="w-full flex items-center justify-center relative">
                    <span className="text-xl font-light text-zinc-600 mr-2 pointer-events-none">R$</span>
                    <input type="number" placeholder="0,00" value={valorCaixa} onChange={(e) => setValorCaixa(e.target.value)} className="w-full bg-transparent text-[40px] tabular-nums font-light text-zinc-100 tracking-tight focus:outline-none placeholder:text-zinc-800 border-b border-zinc-800 focus:border-zinc-400 transition-colors pb-2 text-center" autoFocus />
                  </div>
                </div>
                <div className="mt-auto pt-4 shrink-0 flex gap-3">
                  <button onClick={() => goToStep('data')} className="px-6 py-4 bg-transparent text-zinc-500 hover:text-zinc-300 text-[13px] font-medium rounded-xl transition-colors">
                    Voltar
                  </button>
                  <button onClick={() => handleSequenceFinal(() => onFinalizarAbertura(valorCaixa ? parseFloat(valorCaixa) : 0))} className="flex-1 py-4 bg-emerald-500 text-black text-[13px] font-semibold tracking-wide rounded-xl transition-all hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)] active:scale-[0.98]">
                    Abrir Caixa
                  </button>
                </div>
              </div>
            )}

            {etapa === 'pronto' && (
              <div key="pronto" className="flex flex-col h-full step-transition items-center justify-center">
                <div className="text-center shrink-0 animate-pulse-slow">
                  <h1 className="text-[26px] font-medium tracking-tight text-white mb-2">Tudo pronto.</h1>
                  <p className="text-[16px] text-zinc-400 font-light">Sessão iniciada, {usuarioNome}.</p>
                </div>
              </div>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
}