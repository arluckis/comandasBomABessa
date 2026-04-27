'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, MotionConfig, LayoutGroup } from 'framer-motion';
import { Search, Loader2, X, Plus, Minus, ShoppingBag, ChevronDown, CheckCircle2, BellRing } from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Premium Physics
const springTransition = { type: "spring", stiffness: 400, damping: 30 };
const springCart = { type: "spring", stiffness: 300, damping: 25 };
const premiumEase = [0.16, 1, 0.3, 1];

// Product Card Component
const ProductCard = ({ p, themeClasses, isDark, primaryColor, onAddCart }) => {
  const [expanded, setExpanded] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const hasImage = !!p.imagem_url;
  
  return (
    <motion.div 
      layout
      transition={springTransition}
      className={`relative flex flex-col cursor-pointer group transition-all duration-300 border ${themeClasses.glass} rounded-[var(--radius)] overflow-hidden ${isDark ? 'hover:border-white/20' : 'hover:bg-white hover:border-zinc-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)]'}`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="absolute inset-0 rounded-[var(--radius)] pointer-events-none shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="p-4 md:p-5 flex gap-4">
        {hasImage ? (
          <div className="w-20 h-20 md:w-24 md:h-24 shrink-0 rounded-xl overflow-hidden relative bg-current/5">
            {!imgLoaded && <div className="absolute inset-0 shimmer-effect" />}
            <img 
              src={p.imagem_url} 
              alt={p.nome} 
              loading="lazy"
              onLoad={() => setImgLoaded(true)}
              className={`w-full h-full object-cover transition-opacity duration-500 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`} 
            />
          </div>
        ) : (
          <div className={`w-[4px] shrink-0 rounded-full my-1 transition-colors duration-500`} style={{ backgroundColor: primaryColor }} />
        )}

        <div className="flex flex-col justify-between flex-1 py-1 relative z-10">
          <div>
            <div className="flex justify-between items-start gap-2">
              <span className="font-semibold tracking-tight text-[16px] md:text-[17px] leading-tight">{p.nome}</span>
              {p.badge && (
                <span className="shrink-0 text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded border text-white" style={{ backgroundColor: primaryColor, borderColor: primaryColor }}>
                  {p.badge}
                </span>
              )}
            </div>
            
            <AnimatePresence initial={false}>
              {expanded ? (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <p className={`mt-2 text-[13px] leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    {p.descricao || "Uma experiência gastronômica cuidadosamente preparada para o seu paladar."}
                  </p>
                </motion.div>
              ) : (
                <motion.p className={`mt-1 text-[13px] line-clamp-1 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  {p.descricao || "Toque para ver mais detalhes."}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <div className="flex justify-between items-end mt-3">
            <span className="text-[16px] font-semibold tabular-nums tracking-tight" style={{ color: primaryColor }}>
              R$ {Number(p.preco || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <motion.button 
              whileTap={{ scale: 0.9 }}
              onClick={(e) => { e.stopPropagation(); onAddCart(p); }}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow-sm ${isDark ? 'bg-white text-black hover:bg-zinc-200' : 'bg-black text-white hover:bg-zinc-800'}`}
            >
               <Plus className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function MenuClient({ cardapio, empresa, categorias, mesa }) {
  const defaultTheme = { mode: 'dark', primaryColor: '#10B981', radius: '16px', glassmorphism: 'high', density: 'comfortable', typography: 'sans' };
  const theme = useMemo(() => {
    let t = cardapio.tema || defaultTheme;
    if (typeof t === 'string' || t.estilo) t = defaultTheme;
    return t;
  }, [cardapio.tema]);

  const nomeEmpresa = empresa?.nome || 'Experiência';
  const logoEmpresa = empresa?.logo_url || null;

  const [busca, setBusca] = useState('');
  const [buscaDebounced, setBuscaDebounced] = useState('');
  const [categoriaAtiva, setCategoriaAtiva] = useState(Object.keys(categorias)[0] || '');
  const [chamandoGarcom, setChamandoGarcom] = useState(false);
  const [garcomConfirmado, setGarcomConfirmado] = useState(false);
  
  const [carrinho, setCarrinho] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => setBuscaDebounced(busca), 300);
    return () => clearTimeout(handler);
  }, [busca]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`arox_cart_${cardapio.id}`);
      if (saved) setCarrinho(JSON.parse(saved));
    } catch(e){}
  }, [cardapio.id]);

  useEffect(() => {
    localStorage.setItem(`arox_cart_${cardapio.id}`, JSON.stringify(carrinho));
  }, [carrinho, cardapio.id]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const visibleEntries = entries.filter(e => e.isIntersecting);
      if (visibleEntries.length > 0) {
        visibleEntries.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        setCategoriaAtiva(visibleEntries[0].target.id.replace('cat-', ''));
      }
    }, { rootMargin: '-120px 0px -60% 0px', threshold: 0.1 });

    const sections = document.querySelectorAll('section[id^="cat-"]');
    sections.forEach(s => observer.observe(s));
    return () => sections.forEach(s => observer.unobserve(s));
  }, [categorias]);

  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 400], [0, 80]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 300], [1, 0.95]);
  const headerY = useTransform(scrollY, [0, 100], [0, 12]);
  const headerWidth = useTransform(scrollY, [0, 100], ['100%', '90%']);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const updateScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', updateScroll, { passive: true });
    return () => window.removeEventListener('scroll', updateScroll);
  }, []);

  const categoriasFiltradas = Object.entries(categorias).reduce((acc, [nomeCat, prods]) => {
    const filtrados = prods.filter(p => p.nome.toLowerCase().includes(buscaDebounced.toLowerCase()) || (p.codigo && p.codigo.toLowerCase().includes(buscaDebounced.toLowerCase())));
    if (filtrados.length > 0) acc[nomeCat] = filtrados;
    return acc;
  }, {});

  const handleChamarGarcom = async () => {
    setChamandoGarcom(true);
    try {
      const channel = supabase.channel(`empresa-${cardapio.empresa_id}`);
      await channel.send({ type: 'broadcast', event: 'novo_chamado', payload: { mesa: mesa || 'Balcão' } });
    } catch (e) { console.error(e); }
    setTimeout(() => {
      setChamandoGarcom(false);
      setGarcomConfirmado(true);
      setTimeout(() => setGarcomConfirmado(false), 5000);
    }, 1200);
  };

  const addCart = (produto) => {
    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(50);
    }
    setCarrinho(prev => {
      const exists = prev.find(item => item.id === produto.id);
      if (exists) return prev.map(item => item.id === produto.id ? { ...item, qtd: item.qtd + 1 } : item);
      return [...prev, { ...produto, qtd: 1 }];
    });
  };

  const updateQtd = (id, delta) => {
    setCarrinho(prev => prev.map(item => {
      if (item.id === id) {
        const newQtd = item.qtd + delta;
        return newQtd > 0 ? { ...item, qtd: newQtd } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const isDark = theme.mode === 'dark';
  const fontClass = theme.typography === 'serif' ? 'font-serif tracking-tight' : theme.typography === 'mono' ? 'font-mono tracking-tight' : 'font-sans tracking-tight';
  const glassClass = theme.glassmorphism === 'high' 
    ? (isDark ? 'bg-[#0A0A0C]/70 backdrop-blur-2xl border-white/10' : 'bg-white/70 backdrop-blur-2xl border-zinc-200/50')
    : theme.glassmorphism === 'low' 
    ? (isDark ? 'bg-[#0A0A0C]/90 backdrop-blur-md border-white/5' : 'bg-white/90 backdrop-blur-md border-zinc-200')
    : (isDark ? 'bg-[#0A0A0C] border-white/10' : 'bg-white border-zinc-200');

  const cartTotal = carrinho.reduce((acc, item) => acc + (Number(item.preco)*item.qtd), 0);
  const cartItemsCount = carrinho.reduce((acc, item) => acc + item.qtd, 0);

  return (
    <MotionConfig reducedMotion="user">
      <main className={`min-h-screen pb-40 transition-colors duration-700 ${isDark ? 'bg-[#050505] text-zinc-50' : 'bg-[#FAFAFA] text-zinc-900'} ${fontClass}`} style={{ '--primary': theme.primaryColor, '--radius': theme.radius }}>
        
        {/* HEADER DYNAMIC ISLAND */}
        <div className="fixed top-0 left-0 w-full z-50 flex justify-center pointer-events-none pt-2">
          <motion.header 
            style={{ width: headerWidth, y: headerY, borderRadius: scrolled ? '28px' : '0px' }}
            className={`pointer-events-auto flex items-center justify-between px-5 py-3.5 border transition-all duration-500 overflow-hidden ${glassClass} ${scrolled ? (isDark ? 'shadow-[0_16px_40px_-16px_rgba(0,0,0,0.8)]' : 'shadow-[0_16px_40px_-16px_rgba(0,0,0,0.1)]') : 'shadow-none border-transparent bg-transparent backdrop-blur-none'}`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-current/5 border border-current/10 overflow-hidden flex items-center justify-center shrink-0">
                {logoEmpresa ? <img src={logoEmpresa} className="object-cover w-full h-full" alt="Logo" /> : <span className="opacity-50 font-bold text-sm">{nomeEmpresa.charAt(0)}</span>}
              </div>
            </div>
            {mesa && (
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: theme.primaryColor }} />
                <div className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase border border-current/10 bg-current/5`}>
                  Mesa {mesa}
                </div>
              </div>
            )}
          </motion.header>
        </div>

        <div className="max-w-[640px] mx-auto w-full pt-[100px]">
          {/* HERO SECTION */}
          <div className="px-5 py-6 overflow-hidden">
            <motion.div style={{ y: heroY, opacity: heroOpacity, scale: heroScale }} className="relative z-10 py-4 flex flex-col items-center text-center">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] rounded-full blur-[100px] opacity-20 pointer-events-none" style={{ backgroundColor: theme.primaryColor }} />
              <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: premiumEase }} className={`text-[10px] uppercase tracking-[0.3em] font-semibold mb-4 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                {mesa ? 'Atendimento Exclusivo' : 'Sua experiência começa aqui'}
              </motion.p>
              <motion.h2 initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.1, ease: premiumEase }} className="text-4xl font-bold tracking-tighter leading-[1.1] max-w-[90%]">
                {mesa ? 'Descubra sabores pensados para este momento.' : 'Um menu desenhado para encantar.'}
              </motion.h2>
            </motion.div>
          </div>

          {/* SEARCH */}
          <div className="px-5 mb-8 sticky top-[80px] z-40 pt-2 pb-4 bg-gradient-to-b from-[var(--bg-from)] to-transparent" style={{ '--bg-from': isDark ? '#050505' : '#FAFAFA' }}>
            <div className={`relative flex items-center w-full h-14 rounded-[var(--radius)] border overflow-hidden shadow-sm transition-all focus-within:ring-2 ${glassClass}`} style={{ '--tw-ring-color': theme.primaryColor }}>
              <Search className={`absolute left-4 w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`} />
              <input 
                type="text" placeholder="Explorar menu..." value={busca} onChange={(e) => setBusca(e.target.value)}
                className="w-full h-full bg-transparent pl-12 pr-4 text-[15px] outline-none placeholder:opacity-40 font-medium"
              />
              <AnimatePresence>
                {busca && (
                  <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} onClick={() => setBusca('')} className={`absolute right-3 p-1.5 rounded-full hover:bg-current/10`}>
                    <X className="w-4 h-4" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* CATEGORY NAV */}
          {Object.keys(categorias).length > 0 && !buscaDebounced && (
            <div className="px-5 mb-10 overflow-x-auto hide-scrollbar flex gap-2 pb-2 relative sticky top-[150px] z-30">
              {Object.keys(categorias).map((cat) => {
                const isActive = categoriaAtiva === cat;
                return (
                  <button 
                    key={cat} 
                    onClick={() => {
                      setCategoriaAtiva(cat);
                      document.getElementById(`cat-${cat}`).scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className={`relative px-5 py-2.5 rounded-full whitespace-nowrap text-[13px] font-semibold transition-colors duration-300 ${isActive ? (isDark ? 'text-black' : 'text-white') : (isDark ? 'text-zinc-400 hover:text-white bg-[#111113] border border-white/5' : 'text-zinc-500 hover:text-black bg-white border border-zinc-200')}`}
                  >
                    {isActive && (
                      <motion.div layoutId="activeCatPill" transition={springTransition} className="absolute inset-0 rounded-full shadow-md" style={{ backgroundColor: isDark ? '#FFFFFF' : '#000000' }} />
                    )}
                    <span className="relative z-10">{cat}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* PRODUCT GRIDS */}
          <LayoutGroup>
            <div className="px-5 space-y-16 relative z-10">
              <AnimatePresence mode="popLayout">
                {Object.entries(categoriasFiltradas).length > 0 ? (
                  Object.entries(categoriasFiltradas).map(([nomeCat, prods]) => (
                    <motion.section key={nomeCat} id={`cat-${nomeCat}`} className="scroll-mt-48" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.8 }}>
                      <div className="flex items-center gap-4 mb-6">
                        <h3 className={`text-[11px] font-bold uppercase tracking-[0.2em] ${isDark ? 'text-zinc-300' : 'text-zinc-800'}`}>{nomeCat}</h3>
                        <div className="h-[1px] flex-1 bg-current opacity-10" />
                      </div>
                      <div className="flex flex-col gap-4">
                        {prods.map((p) => (
                          <ProductCard key={p.id} p={p} themeClasses={{ glass: glassClass }} isDark={isDark} primaryColor={theme.primaryColor} onAddCart={addCart} />
                        ))}
                      </div>
                    </motion.section>
                  ))
                ) : (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 flex flex-col items-center gap-4">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center border ${isDark ? 'bg-white/5 border-white/10' : 'bg-zinc-50 border-zinc-200'}`}>
                      <Search className="w-6 h-6 opacity-30" />
                    </div>
                    <h3 className="text-[15px] font-medium tracking-tight">Nenhuma experiência encontrada.</h3>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </LayoutGroup>
        </div>

        {/* CONTAINER FIXO BOTTOM (Garçom + Carrinho) */}
        <div className="fixed bottom-6 left-0 w-full px-5 z-[90] flex flex-col gap-3 items-center pointer-events-none">
          
          {/* Waiter Button - Restaurado com altíssimo destaque e física Apple */}
          {mesa && (
            <motion.button 
              initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5, ...springTransition }}
              onClick={handleChamarGarcom} disabled={chamandoGarcom || garcomConfirmado}
              className={`pointer-events-auto flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-full shadow-2xl transition-all active:scale-95 border backdrop-blur-md ${garcomConfirmado ? 'bg-emerald-500 text-white border-emerald-400' : (isDark ? 'bg-[#1A1A1A]/90 text-white border-white/10 hover:bg-[#222]' : 'bg-white/90 text-zinc-900 border-zinc-200 hover:bg-zinc-50')}`}
            >
              {chamandoGarcom ? <Loader2 className="w-5 h-5 animate-spin" /> : garcomConfirmado ? <><CheckCircle2 className="w-5 h-5" /><span className="text-[14px] font-semibold tracking-tight">Equipe notificada</span></> : <><BellRing className="w-5 h-5" /><span className="text-[14px] font-semibold tracking-tight">Solicitar equipe à mesa</span></>}
            </motion.button>
          )}

          {/* iOS Floating Cart */}
          <AnimatePresence>
            {cartItemsCount > 0 && (
              <motion.button
                initial={{ y: 50, scale: 0.9, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }} exit={{ y: 50, scale: 0.9, opacity: 0 }} transition={springCart}
                onClick={() => setIsCartOpen(true)}
                className="pointer-events-auto w-full max-w-[400px] h-[64px] rounded-full flex items-center justify-between px-2 pr-6 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.5)] overflow-hidden relative group text-white"
                style={{ backgroundColor: theme.primaryColor }}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full" />
                
                <div className="w-[48px] h-[48px] bg-black/20 rounded-full flex items-center justify-center relative">
                  <ShoppingBag className="w-5 h-5" />
                  <motion.div key={cartItemsCount} initial={{ scale: 1.5 }} animate={{ scale: 1 }} className="absolute -top-1 -right-1 w-5 h-5 bg-white text-black text-[11px] font-bold rounded-full flex items-center justify-center shadow-sm">
                    {cartItemsCount}
                  </motion.div>
                </div>
                <span className="font-semibold text-[15px] tracking-tight ml-4">Ver Pedido</span>
                <span className="font-bold text-[17px] tabular-nums tracking-tight ml-auto">
                  R$ {cartTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* CART MODAL (Full Screen Sheet) */}
        <AnimatePresence>
          {isCartOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCartOpen(false)} className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm" />
              <motion.div 
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={springTransition}
                className={`fixed bottom-0 left-0 w-full h-[85vh] z-[101] rounded-t-[32px] p-6 flex flex-col shadow-[0_-20px_60px_-15px_rgba(0,0,0,0.3)] ${isDark ? 'bg-[#0A0A0C] text-white' : 'bg-white text-zinc-900'}`}
              >
                <div className="flex justify-between items-center mb-6 shrink-0">
                  <h3 className="text-2xl font-bold tracking-tight">Seu Pedido</h3>
                  <button onClick={() => setIsCartOpen(false)} className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-white/10' : 'bg-zinc-100'}`}><ChevronDown className="w-5 h-5" /></button>
                </div>

                <div className="flex-1 overflow-y-auto hide-scrollbar space-y-4 pb-10">
                  <AnimatePresence mode="popLayout">
                    {carrinho.map(item => (
                      <motion.div layout key={item.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, x: -50 }} className={`flex items-center gap-4 p-4 rounded-2xl border ${isDark ? 'bg-[#111113] border-white/10' : 'bg-zinc-50 border-zinc-200'}`}>
                        <div className="flex-1">
                          <h4 className="font-semibold text-[15px] leading-tight mb-1">{item.nome}</h4>
                          <span className="text-[14px] font-medium" style={{ color: theme.primaryColor }}>R$ {Number(item.preco).toLocaleString('pt-BR', {minimumFractionDigits:2})}</span>
                        </div>
                        <div className={`flex items-center gap-3 p-1.5 rounded-full border ${isDark ? 'border-white/10 bg-black' : 'border-zinc-200 bg-white'}`}>
                          <button onClick={() => updateQtd(item.id, -1)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-current/10"><Minus className="w-4 h-4" /></button>
                          <span className="text-[14px] font-bold w-4 text-center tabular-nums">{item.qtd}</span>
                          <button onClick={() => updateQtd(item.id, 1)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-current/10"><Plus className="w-4 h-4" /></button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {carrinho.length === 0 && (
                     <div className="text-center py-10 opacity-50 text-sm">Seu pedido está vazio.</div>
                  )}
                </div>

                {carrinho.length > 0 && (
                  <div className="pt-5 border-t shrink-0" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
                    <div className="flex justify-between items-center mb-5">
                      <span className="text-[16px] font-semibold">Total estimado</span>
                      <span className="text-3xl font-bold tracking-tight">R$ {cartTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <button className="w-full h-14 rounded-2xl flex items-center justify-center text-white font-bold text-[16px] active:scale-95 transition-transform" style={{ backgroundColor: theme.primaryColor }}>
                      Confirmar Solicitação
                    </button>
                  </div>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>
        
        <style dangerouslySetInnerHTML={{__html: `
          .hide-scrollbar::-webkit-scrollbar { display: none; }
          .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          .shimmer-effect {
            background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0) 100%);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite linear;
          }
          @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        `}} />
      </main>
    </MotionConfig>
  );
}