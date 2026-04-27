'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, CheckCircle2, ExternalLink, Share2, QrCode, X, Copy, Download, SlidersHorizontal } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const premiumEase = [0.16, 1, 0.3, 1];

// Default Engine State
const defaultDesignEngine = {
  mode: 'dark',
  primaryColor: '#10B981',
  radius: '16px',
  glassmorphism: 'high',
  density: 'comfortable',
  typography: 'sans'
};

export default function CardCardapio({ core, sessao, isDark }) {
  const [status, setStatus] = useState('loading-check');
  const [dadosCardapio, setDadosCardapio] = useState(null);
  
  const [modalQR, setModalQR] = useState(false);
  const [modalDesign, setModalDesign] = useState(false);
  
  const [mesaQtd, setMesaQtd] = useState('');
  const [copiado, setCopiado] = useState(false);
  
  const [designState, setDesignState] = useState(defaultDesignEngine);
  const [salvandoDesign, setSalvandoDesign] = useState(false);

  useEffect(() => {
    const empresaId = core?.id || core?.empresa_id || sessao?.empresa_id || sessao?.id;

    if (!empresaId) {
      const timer = setTimeout(() => setStatus('idle'), 1500);
      return () => clearTimeout(timer);
    }

    const verificarExistente = async () => {
      try {
        const { data } = await supabase
          .from('cardapios')
          .select('id, slug, tema')
          .eq('empresa_id', empresaId)
          .single();

        if (data && data.slug) {
          setDadosCardapio(data);
          // Migração de legacy strings para o novo objeto de design
          if (data.tema) {
            setDesignState(typeof data.tema === 'string' || data.tema.estilo ? defaultDesignEngine : { ...defaultDesignEngine, ...data.tema });
          }
          setStatus('ready');
        } else {
          setStatus('idle');
        }
      } catch (err) {
        setStatus('idle');
      }
    };
    verificarExistente();
  }, [core, sessao]);

  const handleCriarCardapio = async () => {
    const empresaId = core?.id || core?.empresa_id || sessao?.empresa_id || sessao?.id;
    if (!empresaId) return alert("Erro: ID da empresa não encontrado.");

    setStatus('loading');
    try {
      await new Promise(resolve => setTimeout(resolve, 1500)); 

      const nomeBase = core?.nomeEmpresa || 'catalogo';
      const slugLimpo = nomeBase.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
      const sufixo = Math.random().toString(36).substring(2, 6);
      const slugFinal = `${slugLimpo}-${sufixo}`;

      const { data, error } = await supabase
        .from('cardapios')
        .insert([{ empresa_id: empresaId, slug: slugFinal, tema: defaultDesignEngine }])
        .select()
        .single();

      if (error) throw error;

      setDadosCardapio(data);
      setStatus('ready');
    } catch (err) {
      alert("Falha ao inicializar experiência. " + (err.message || ""));
      setStatus('idle');
    }
  };

  const salvarDesignEngine = async (novoEstado) => {
    if (!dadosCardapio?.id) return;
    setDesignState(novoEstado);
    setSalvandoDesign(true);
    try {
      await supabase
        .from('cardapios')
        .update({ tema: novoEstado })
        .eq('id', dadosCardapio.id);
    } catch (error) {
      console.error(error);
    } finally {
      setTimeout(() => setSalvandoDesign(false), 500);
    }
  };

  const updateConfig = (key, value) => {
    const novoEstado = { ...designState, [key]: value };
    salvarDesignEngine(novoEstado);
  };

  const urlBase = typeof window !== 'undefined' ? `${window.location.origin}/cardapio/${dadosCardapio?.slug}` : '';
  const urlComMesa = mesaQtd ? `${urlBase}?mesa=${mesaQtd}` : urlBase;
  const qrCodeImage = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(urlComMesa)}&margin=20`;

  const copiarLink = () => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(urlComMesa);
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = urlComMesa;
      document.body.prepend(textArea);
      textArea.select();
      try { document.execCommand('copy'); } catch (error) {} finally { textArea.remove(); }
    }
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const cardPremium = isDark 
    ? 'bg-[#111113]/80 backdrop-blur-[24px] border border-white/[0.04] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02),0_8px_30px_rgba(0,0,0,0.2)]' 
    : 'bg-white/70 backdrop-blur-[24px] border border-zinc-200/50 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)]';

  const Backdrop = ({ onClick }) => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClick}
      className="fixed inset-0 z-[100] bg-zinc-950/80 backdrop-blur-sm"
    />
  );

  return (
    <>
      <div className={`p-6 md:p-8 rounded-[28px] flex flex-col justify-between h-full w-full relative z-10 ${cardPremium}`}>
        <AnimatePresence mode="wait">
          {status === 'loading-check' && (
            <motion.div key="check" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-center h-full">
              <Loader2 className={`w-6 h-6 animate-spin opacity-40 ${isDark ? 'text-white' : 'text-black'}`} />
            </motion.div>
          )}
          
          {status === 'idle' && (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-4 h-full justify-between">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div className="bg-zinc-800 text-white text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]">Experiência Digital</div>
                  <Sparkles className="w-4 h-4 opacity-40 text-zinc-500" />
                </div>
                <h3 className={`text-xl font-semibold tracking-tight leading-tight ${isDark ? 'text-white' : 'text-zinc-900'}`}>Sua vitrine imersiva.</h3>
                <p className={`text-[13px] font-light mt-2 leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Aproxime seus clientes de uma experiência visual nivel Awwwards.</p>
              </div>
              <button onClick={handleCriarCardapio} className={`w-full py-3.5 rounded-xl font-medium text-[13px] transition-transform active:scale-[0.98] shadow-lg ${isDark ? 'bg-white text-black shadow-white/10' : 'bg-zinc-900 text-white shadow-zinc-900/20'}`}>
                Inicializar Experiência
              </button>
            </motion.div>
          )}

          {status === 'loading' && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center h-full gap-4">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                <div className="w-8 h-8 rounded-full border-2 border-zinc-500/20 border-t-zinc-500" />
              </motion.div>
              <p className={`text-[12px] font-medium tracking-wide uppercase animate-pulse ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Orquestrando Design System...</p>
            </motion.div>
          )}

          {status === 'ready' && (
            <motion.div key="ready" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4 h-full justify-between">
              <div className="flex items-center gap-3.5 p-1">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                </div>
                <div className="overflow-hidden">
                  <h3 className={`text-[14px] font-semibold tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>Experiência Ativa</h3>
                  <p className={`text-[12px] font-light truncate ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>/cardapio/{dadosCardapio?.slug}</p>
                </div>
              </div>
              <div className="flex flex-col gap-2.5">
                <a href={urlBase} target="_blank" rel="noopener noreferrer" className={`flex items-center justify-between p-3.5 rounded-xl border text-[12px] font-medium transition-all duration-300 ${isDark ? 'hover:bg-white/5 border-white/10 text-white' : 'hover:bg-zinc-50 border-zinc-200 text-zinc-900'}`}>
                  <span>Acessar vitrine</span><ExternalLink className="w-4 h-4 opacity-40" />
                </a>
                <div className="grid grid-cols-2 gap-2.5">
                  <button onClick={() => setModalQR(true)} className={`flex items-center justify-center gap-2 p-3.5 rounded-xl border text-[12px] font-medium transition-all duration-300 ${isDark ? 'hover:bg-white/5 border-white/10 text-white' : 'hover:bg-zinc-50 border-zinc-200 text-zinc-900'}`}>
                    <Share2 className="w-4 h-4 opacity-50" /> Distribuir
                  </button>
                  <button onClick={() => setModalDesign(true)} className={`flex items-center justify-center gap-2 p-3.5 rounded-xl border text-[12px] font-medium transition-all duration-300 ${isDark ? 'bg-white/5 hover:bg-white/10 border-white/10 text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]' : 'bg-zinc-50 hover:bg-zinc-100 border-zinc-200 text-zinc-900'}`}>
                    <SlidersHorizontal className="w-4 h-4 opacity-70" /> Design Engine
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* MODAL 1: DISTRIBUIÇÃO */}
      <AnimatePresence>
        {modalQR && (
          <>
            <Backdrop onClick={() => setModalQR(false)} />
            <motion.div initial={{ opacity: 0, y: 30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }} transition={{ ease: premiumEase, duration: 0.5 }}
              className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-[420px] z-[101] rounded-[32px] p-8 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.4)] border ${isDark ? 'bg-[#0A0A0C] border-white/10 text-white' : 'bg-white border-zinc-200 text-zinc-900'}`}
            >
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-zinc-50 border-zinc-200'}`}><QrCode className="w-5 h-5" /></div>
                  <h3 className="font-semibold tracking-tight text-xl">Pontos de Acesso</h3>
                </div>
                <button onClick={() => setModalQR(false)} className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-zinc-100'}`}><X className="w-5 h-5" /></button>
              </div>

              <div className="flex flex-col gap-6">
                <label className="flex flex-col gap-2.5">
                  <span className={`text-[11px] font-bold uppercase tracking-widest ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Mapear Contexto (Mesa/Local)</span>
                  <input type="text" placeholder="Ex: Mesa 04" value={mesaQtd} onChange={(e) => setMesaQtd(e.target.value)} 
                    className={`p-3.5 rounded-xl border outline-none text-sm transition-all shadow-sm ${isDark ? 'bg-[#111113] border-white/10 focus:border-white/30 text-white' : 'bg-zinc-50 border-zinc-200 focus:border-zinc-400 text-zinc-900'}`}
                  />
                </label>

                <div className={`aspect-square w-full rounded-[24px] flex items-center justify-center p-6 border shadow-inner ${isDark ? 'bg-white border-white/10' : 'bg-zinc-50 border-zinc-200'}`}>
                  <img src={qrCodeImage} alt="QR Code" className="w-full h-full object-contain mix-blend-multiply" />
                </div>

                <div className="flex gap-3">
                  <button onClick={copiarLink} className={`flex-1 py-4 rounded-xl font-medium text-[13px] flex justify-center items-center gap-2 border transition-all active:scale-[0.97] ${copiado ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : (isDark ? 'bg-white/5 hover:bg-white/10 border-white/10 text-white' : 'bg-white hover:bg-zinc-50 border-zinc-200 text-zinc-900')}`}>
                    {copiado ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />} {copiado ? 'Copiado!' : 'Copiar URL'}
                  </button>
                  <a href={qrCodeImage} download="qrcode-experiencia.png" target="_blank" className={`flex-1 py-4 rounded-xl font-medium text-[13px] flex justify-center items-center gap-2 transition-all active:scale-[0.97] shadow-lg ${isDark ? 'bg-white text-black shadow-white/10' : 'bg-zinc-900 text-white shadow-zinc-900/20'}`}>
                    <Download className="w-4 h-4" /> Baixar SVG/PNG
                  </a>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* MODAL 2: DESIGN ENGINE */}
      <AnimatePresence>
        {modalDesign && (
          <>
            <Backdrop onClick={() => setModalDesign(false)} />
            <motion.div initial={{ opacity: 0, y: 30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }} transition={{ ease: premiumEase, duration: 0.5 }}
              className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-[460px] z-[101] rounded-[32px] p-8 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] border ${isDark ? 'bg-[#0A0A0C] border-white/10 text-white' : 'bg-white border-zinc-200 text-zinc-900'}`}
            >
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-zinc-50 border-zinc-200'}`}><SlidersHorizontal className="w-5 h-5" /></div>
                  <h3 className="font-semibold tracking-tight text-xl">Design Engine</h3>
                </div>
                <div className="flex items-center gap-3">
                  <AnimatePresence>
                    {salvandoDesign && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><Loader2 className="w-4 h-4 animate-spin text-zinc-500" /></motion.div>}
                  </AnimatePresence>
                  <button onClick={() => setModalDesign(false)} className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-zinc-100'}`}><X className="w-5 h-5" /></button>
                </div>
              </div>

              <div className="space-y-6">
                {/* Mode & Color */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <label className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Appearance</label>
                    <div className={`flex rounded-lg p-1 border ${isDark ? 'bg-[#111113] border-white/10' : 'bg-zinc-50 border-zinc-200'}`}>
                      {['light', 'dark'].map(m => (
                         <button key={m} onClick={() => updateConfig('mode', m)} className={`flex-1 py-2 rounded-md text-xs font-medium capitalize transition-all ${designState.mode === m ? (isDark ? 'bg-white/10 text-white shadow-sm' : 'bg-white text-zinc-900 shadow-sm') : 'text-zinc-500 hover:text-current'}`}>
                           {m}
                         </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Accent Color</label>
                    <div className="flex gap-2">
                      {['#10B981', '#3B82F6', '#F43F5E', '#F59E0B', '#A855F7', '#171717'].map(color => (
                        <button key={color} onClick={() => updateConfig('primaryColor', color)} className="w-8 h-8 rounded-full border-2 transition-transform active:scale-90 flex items-center justify-center" style={{ backgroundColor: color, borderColor: designState.primaryColor === color ? (isDark ? 'white' : '#171717') : 'transparent' }}>
                          {designState.primaryColor === color && <div className="w-1.5 h-1.5 bg-white rounded-full mix-blend-difference" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Typography & Shape */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <label className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Typography</label>
                    <select value={designState.typography} onChange={(e) => updateConfig('typography', e.target.value)} className={`w-full p-2.5 rounded-lg border text-sm outline-none appearance-none ${isDark ? 'bg-[#111113] border-white/10 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'}`}>
                      <option value="sans">SF Pro (Minimal)</option>
                      <option value="serif">Editorial (Serif)</option>
                      <option value="mono">Technical (Mono)</option>
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Border Radius</label>
                    <div className={`flex rounded-lg p-1 border ${isDark ? 'bg-[#111113] border-white/10' : 'bg-zinc-50 border-zinc-200'}`}>
                      {[{l: 'Sharp', v: '0px'}, {l: 'Soft', v: '12px'}, {l: 'Round', v: '24px'}].map(r => (
                         <button key={r.v} onClick={() => updateConfig('radius', r.v)} className={`flex-1 py-2 rounded-md text-xs font-medium transition-all ${designState.radius === r.v ? (isDark ? 'bg-white/10 text-white shadow-sm' : 'bg-white text-zinc-900 shadow-sm') : 'text-zinc-500 hover:text-current'}`}>
                           {r.l}
                         </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Surface Physics */}
                <div className="space-y-3">
                  <label className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Surface Physics (Glassmorphism)</label>
                  <div className={`flex rounded-lg p-1 border ${isDark ? 'bg-[#111113] border-white/10' : 'bg-zinc-50 border-zinc-200'}`}>
                    {['none', 'low', 'high'].map(g => (
                        <button key={g} onClick={() => updateConfig('glassmorphism', g)} className={`flex-1 py-2 rounded-md text-xs font-medium capitalize transition-all ${designState.glassmorphism === g ? (isDark ? 'bg-white/10 text-white shadow-sm' : 'bg-white text-zinc-900 shadow-sm') : 'text-zinc-500 hover:text-current'}`}>
                          {g}
                        </button>
                    ))}
                  </div>
                </div>

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}