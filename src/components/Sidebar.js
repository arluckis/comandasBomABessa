'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

export default function Sidebar({
  menuMobileAberto, setMenuMobileAberto, temaNoturno, setTemaNoturno, logoEmpresa,
  sessao, nomeEmpresa, abaAtiva, setAbaAtiva, setMostrarConfigEmpresa,
  fazerLogout, statusPresenca, onExpandToggle
}) {
  const [planoEmpresa, setPlanoEmpresa] = useState('Starter');
  const [isExpanded, setIsExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [windowWidth, setWindowWidth] = useState(0);

  const isDark = temaNoturno;
  const isDashboard = abaAtiva === 'dashboard';

  // === FÍSICA CINEMÁTICA REFINADA (FRAMER MOTION) ===
  const cinematicSpring = { type: "spring", stiffness: 260, damping: 26, mass: 0.9 };
  const cinematicEase = [0.16, 1, 0.3, 1];

  // === LÓGICA DE RESPONSIVIDADE PRECISA ===
  useEffect(() => {
    setMounted(true);
    setWindowWidth(window.innerWidth);
    
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = mounted ? windowWidth < 768 : false;
  const isTablet = mounted ? windowWidth >= 768 && windowWidth < 1280 : false;
  const isDesktop = mounted ? windowWidth >= 1280 : true;

  const showText = (isDesktop && isExpanded) || (isMobile && menuMobileAberto);

  useEffect(() => {
    if (isTablet) setIsExpanded(false);
    if (!isMobile && menuMobileAberto) setMenuMobileAberto(false);
  }, [isTablet, isMobile, menuMobileAberto, setMenuMobileAberto]);

  useEffect(() => {
    if (isDashboard) setIsExpanded(false);
  }, [isDashboard]);

  useEffect(() => {
    if (onExpandToggle) onExpandToggle(isExpanded);
  }, [isExpanded, onExpandToggle]);

  useEffect(() => {
    const buscarPlano = async () => {
      if (sessao?.empresa_id) {
        const { data, error } = await supabase.from('empresas').select('plano').eq('id', sessao.empresa_id).single();
        if (!error && data?.plano) setPlanoEmpresa(data.plano);
      }
    };
    buscarPlano();
  }, [sessao?.empresa_id]);

  const fecharPainelEMudarAba = (novaAba) => {
    setAbaAtiva(novaAba);
    setMenuMobileAberto(false);
    document.getElementById('btn-voltar-header')?.click();
  };

  const handleClickAba = (id) => { 
    fecharPainelEMudarAba(id); 
    if (id === 'dashboard') setIsExpanded(false);
  };

  const iconStroke = 1.5;
  const iconeInicio = <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={iconStroke} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>;
  const iconeComandas = <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={iconStroke} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>;
  const iconeEncerradas = <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={iconStroke} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path></svg>;
  const iconeFaturamento = <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={iconStroke} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path></svg>;
  const iconeCaixa = <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={iconStroke} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08-.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>;
  const iconeClientes = <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={iconStroke} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>;
  const iconeConfig = <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={iconStroke}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
  const iconeLogout = <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={iconStroke}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;

  const MenuItem = ({ id, titulo, icone, onClick, isAtivo, danger }) => {
    // REMOVIDO o mb-1.5 daqui para controlar o gap diretamente no pai
    const baseClasses = "relative rounded-full flex items-center outline-none overflow-hidden transition-colors duration-300 mx-auto w-full";

    let stateClasses = "";
    if (isAtivo) {
      stateClasses = isDark 
        ? "text-white ring-1 ring-white/[0.12] shadow-[0_4px_16px_-4px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.08)] bg-white/[0.04]" 
        : "text-zinc-900 bg-white ring-1 ring-black/5 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,1)]";
    } else {
      if (danger) {
        stateClasses = isDark ? "text-zinc-500 hover:text-rose-400 hover:bg-white/[0.06]" : "text-zinc-500 hover:text-rose-600 hover:bg-black/[0.03]";
      } else {
        stateClasses = isDark ? "text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.08]" : "text-zinc-500 hover:text-zinc-900 hover:bg-black/[0.04]";
      }
    }

    return (
      <div className="relative group w-full flex justify-center">
        <motion.button 
          layout
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          transition={cinematicSpring}
          onClick={onClick} 
          // REDUZIDO height para 44px e width retraído para 44px
          style={{ height: '44px', padding: showText ? '0 16px' : '0', width: showText ? '100%' : '44px', justifyContent: showText ? 'flex-start' : 'center' }}
          className={`${baseClasses} ${stateClasses}`}
        >
          {isAtivo && isDark && <motion.div layoutId="sidebar-active-pill" className="absolute inset-0 bg-white/[0.08] rounded-full z-0 pointer-events-none" transition={cinematicSpring} />}
          
          <motion.span layout className={`relative z-10 shrink-0 flex items-center justify-center transition-all duration-300 ${isAtivo ? 'opacity-100 scale-110 drop-shadow-[0_0_6px_rgba(255,255,255,0.4)]' : 'opacity-70 group-hover:opacity-100'} ${danger && 'group-hover:text-rose-500'}`}>
            {icone}
          </motion.span>
          
          <AnimatePresence>
            {showText && (
              <motion.span 
                initial={{ opacity: 0, width: 0, marginLeft: 0 }}
                animate={{ opacity: 1, width: 'auto', marginLeft: 12 }}
                exit={{ opacity: 0, width: 0, marginLeft: 0 }}
                transition={{ duration: 0.3, ease: cinematicEase }}
                className="relative z-10 text-[13px] font-medium truncate whitespace-nowrap tracking-tight"
              >
                {titulo}
              </motion.span>
            )}
          </AnimatePresence>
          
          {isAtivo && isDark && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[16px] rounded-r-full shadow-[0_0_12px_rgba(255,255,255,0.6)] bg-zinc-100 z-10"></span>}
        </motion.button>

        {!showText && (
          <div className={`hidden md:flex absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3.5 py-1.5 rounded-full text-[12px] font-medium tracking-tight whitespace-nowrap pointer-events-none opacity-0 translate-x-[-8px] group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-[300ms] ease-[cubic-bezier(0.16,1,0.3,1)] z-[99999] shadow-[0_16px_32px_-12px_rgba(0,0,0,0.6)] border ${danger ? (isDark ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 backdrop-blur-md' : 'bg-rose-50 text-rose-600 border-rose-100') : (isDark ? 'bg-[#111113] text-zinc-200 border-white/[0.08]' : 'bg-white text-zinc-800 border-zinc-200/60')}`}>
            {titulo}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <AnimatePresence>
        {isMobile && menuMobileAberto && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: cinematicEase }}
            className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm pointer-events-auto" 
            onClick={() => setMenuMobileAberto(false)} 
          />
        )}
      </AnimatePresence>
      
      <motion.div 
        animate={{ width: showText && isDesktop ? 288 : 80 }} 
        transition={cinematicSpring} 
        className="hidden md:block shrink-0" 
      />

      <motion.aside 
        initial={false}
        animate={{ 
          width: isMobile ? 'min(80vw, 320px)' : (isTablet ? 80 : (isExpanded ? 288 : 80)),
          x: isMobile ? (menuMobileAberto ? 0 : -40) : 0,
          opacity: isMobile ? (menuMobileAberto ? 1 : 0) : 1,
          scale: isMobile ? (menuMobileAberto ? 1 : 0.98) : 1
        }}
        style={{ pointerEvents: isMobile && !menuMobileAberto ? 'none' : 'auto' }}
        transition={cinematicSpring}
        className={`fixed top-0 left-0 h-full flex flex-col z-[100] transition-colors duration-500
          ${isDark ? 'bg-[#08080A] md:bg-transparent' : 'bg-[#FAFAFA] md:bg-transparent'} 
          ${isMobile ? 'rounded-r-[24px] border-r border-zinc-200/50 dark:border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.3)]' : ''} 
          ${showText ? 'overflow-y-auto overflow-x-hidden' : 'overflow-visible'}`}
      >
         
         <div className={`h-[76px] flex items-center shrink-0 mb-4 mt-0 relative transition-all duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${isDesktop && isExpanded ? 'justify-between px-6' : 'justify-center px-4'}`}>
             
             {isMobile && menuMobileAberto && (
               <button onClick={() => setMenuMobileAberto(false)} className="absolute left-6 top-1/2 -translate-y-1/2 p-2 rounded-full transition-colors z-50 text-zinc-500 hover:text-zinc-900 bg-black/5 hover:bg-black/10 dark:text-zinc-400 dark:hover:text-zinc-100 dark:bg-white/5 dark:hover:bg-white/10">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
               </button>
             )}

             <AnimatePresence>
               {showText && (
                 <motion.div
                    initial={{ opacity: 0, x: -10, filter: 'blur(8px)' }} 
                    animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }} 
                    exit={{ opacity: 0, x: -10, filter: 'blur(8px)' }} 
                    transition={{ duration: 0.5, ease: cinematicEase }}
                    className={`flex items-center ${isMobile ? 'pl-10' : ''}`}
                 >
                   <span className={`font-semibold tracking-[-0.02em] text-[17px] leading-none select-none pr-3 ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                      AROX
                   </span>
                 </motion.div>
               )}
             </AnimatePresence>

             {isDesktop && (
               <motion.button 
                  layout
                  onClick={() => setIsExpanded(!isExpanded)} 
                  className={`flex items-center justify-center transition-all duration-300 rounded-full ${isExpanded ? 'w-8 h-8 ring-1 ring-white/10 bg-white/[0.04]' : 'w-10 h-10'} ${isDark ? 'text-zinc-400 hover:text-white hover:bg-white/[0.08] hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]' : 'text-zinc-500 hover:text-zinc-900 hover:bg-black/[0.04] hover:shadow-[0_1px_2px_rgba(0,0,0,0.05)]'} ${!isExpanded && 'mx-auto'}`}
               >
                 <motion.svg animate={{ rotate: isExpanded ? 0 : 180 }} transition={cinematicSpring} viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-[18px] h-[18px]" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                   <path d="M15 18l-6-6 6-6" />
                 </motion.svg>
               </motion.button>
             )}
         </div>

         {/* REDUZIDO gap-6 para gap-4 entre os grupos */}
         <div className="flex-1 px-4 [&::-webkit-scrollbar]:hidden flex flex-col gap-4 pt-2">
            
            {/* ADICIONADO gap-1 nos agrupamentos internos */}
            <div className="flex flex-col gap-1">
              <AnimatePresence>
                {showText && (
                  <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className={`px-3 text-[9px] font-semibold uppercase tracking-[0.15em] whitespace-nowrap mb-1.5 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Visão Geral</motion.p>
                )}
              </AnimatePresence>
              <MenuItem id="dashboard" titulo="Início" icone={iconeInicio} isAtivo={abaAtiva === 'dashboard'} onClick={() => handleClickAba('dashboard')} />
            </div>

            <div className="flex flex-col gap-1">
              <AnimatePresence>
                {showText && (
                  <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className={`px-3 text-[9px] font-semibold uppercase tracking-[0.15em] whitespace-nowrap mb-1.5 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Operação</motion.p>
                )}
              </AnimatePresence>
              <MenuItem id="comandas" titulo="Terminal" icone={iconeComandas} isAtivo={abaAtiva === 'comandas'} onClick={() => handleClickAba('comandas')} />
              <MenuItem id="fechadas" titulo="Histórico" icone={iconeEncerradas} isAtivo={abaAtiva === 'fechadas'} onClick={() => handleClickAba('fechadas')} />
              {(sessao?.role === 'dono' || sessao?.perm_faturamento) && <MenuItem id="faturamento" titulo="Métricas" icone={iconeFaturamento} isAtivo={abaAtiva === 'faturamento'} onClick={() => handleClickAba('faturamento')} />}
            </div>

            <div className="flex flex-col gap-1">
              <AnimatePresence>
                {showText && (
                  <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className={`px-3 text-[9px] font-semibold uppercase tracking-[0.15em] whitespace-nowrap mb-1.5 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Gestão</motion.p>
                )}
              </AnimatePresence>
              <MenuItem id="caixa" titulo="Caixa Central" icone={iconeCaixa} isAtivo={abaAtiva === 'caixa'} onClick={() => handleClickAba('caixa')} />
              {(sessao?.role === 'dono' || sessao?.perm_fidelidade || sessao?.perm_estudo) && <MenuItem id="fidelidade" titulo="Fidelidade" icone={iconeClientes} isAtivo={abaAtiva === 'fidelidade'} onClick={() => handleClickAba('fidelidade')} />}
            </div>
         </div>

         <div className="mt-auto shrink-0 pb-4 xl:pb-6 pt-4">
            {/* ADICIONADO gap-1 no rodapé */}
            <div className="px-4 flex flex-col gap-1">
               <AnimatePresence>
                 {!isDashboard && (
                    <motion.div initial={{ opacity: 0, height: 0, y: 10 }} animate={{ opacity: 1, height: 'auto', y: 0 }} exit={{ opacity: 0, height: 0, y: 10 }} transition={{ duration: 0.5, ease: cinematicEase }} className="mb-4 overflow-hidden">
                      <div className="relative group w-full flex">
                        {/* Ajustado padding e width do card de perfil para manter a consistência de 44px */}
                        <div className={`flex items-center rounded-full w-full cursor-pointer transition-colors duration-300 ${showText ? 'px-3 py-2' : 'justify-center py-2 px-0 mx-auto w-[44px]'} ${isDark ? 'bg-transparent hover:bg-white/[0.04]' : 'bg-transparent hover:bg-black/[0.03]'}`}>
                          <div className={`relative shrink-0 flex items-center justify-center transition-all duration-300 ${showText ? 'w-[40px] h-[40px]' : 'w-[36px] h-[36px]'}`}>
                            <img src={logoEmpresa || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'} alt="Logo" className="w-full h-full object-cover rounded-full border border-black/[0.05]" />
                            <span className={`absolute -bottom-0.5 -right-0.5 block h-3 w-3 rounded-full transition-colors duration-500 ${statusPresenca === 'online' ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]' : 'bg-amber-500'} ring-[2.5px] ${isDark ? 'ring-[#09090B]' : 'ring-white'}`}></span>
                          </div>
                          <div className={`flex flex-col min-w-0 transition-all duration-[400ms] ${showText ? 'w-auto opacity-100 ml-3.5' : 'w-0 opacity-0 ml-0 overflow-hidden'}`}>
                             <span className={`text-[13px] font-semibold truncate leading-tight tracking-[-0.01em] ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>{nomeEmpresa || 'Estabelecimento'}</span>
                             <div className="flex items-center gap-1.5 mt-0.5"><span className={`text-[11px] font-medium truncate tracking-tight ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>{sessao?.nome_usuario || 'Usuário'}</span></div>
                          </div>
                        </div>

                        {!showText && (
                          <div className={`hidden md:flex flex-col absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3.5 py-2.5 rounded-xl whitespace-nowrap pointer-events-none opacity-0 translate-x-[-8px] group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-[300ms] ease-[cubic-bezier(0.16,1,0.3,1)] z-[99999] shadow-[0_16px_32px_-12px_rgba(0,0,0,0.6)] border ${isDark ? 'bg-[#111113] border-white/[0.08]' : 'bg-white border-zinc-200/60'}`}>
                            <span className={`text-[13px] font-semibold leading-tight tracking-tight ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>{nomeEmpresa || 'Estabelecimento'}</span>
                            <span className={`text-[12px] font-medium mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>{sessao?.nome_usuario || 'Usuário'}</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                 )}
               </AnimatePresence>
               
               {sessao?.role === 'dono' && <MenuItem titulo="Ajustes da Empresa" icone={iconeConfig} onClick={() => { setMostrarConfigEmpresa(true); setMenuMobileAberto(false); }} />}
               <MenuItem titulo={temaNoturno ? 'Modo Claro' : 'Modo Escuro'} icone={temaNoturno ? <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={iconStroke} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg> : <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={iconStroke} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>} onClick={() => setTemaNoturno(!temaNoturno)} />
               <MenuItem titulo="Sair da Plataforma" danger={true} icone={iconeLogout} onClick={fazerLogout} />
            </div>
         </div>
      </motion.aside>
    </>
  );
}