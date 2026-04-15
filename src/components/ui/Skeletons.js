'use client';
import React from 'react';

// --- 1. O MOTOR DE SHIMMER (Injetado apenas uma vez) ---
const ShimmerEngine = () => (
  <style dangerouslySetInnerHTML={{__html: `
    @keyframes arox-shimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
    .animate-shimmer {
      animation: arox-shimmer 2s cubic-bezier(0.2, 0.8, 0.2, 1) infinite;
    }
  `}} />
);

// --- 2. BLOCO ATÔMICO (A base de tudo) ---
export const SkeletonBlock = ({ temaNoturno = true, className = '', delay = 0, style = {} }) => {
  // Cores ultra-sutis (Ghost UI)
  const baseColor = temaNoturno 
    ? 'bg-white/[0.02] border-white/[0.02]' 
    : 'bg-black/[0.03] border-black/[0.02]';
    
  const shimmerGradient = temaNoturno 
    ? 'from-transparent via-white/[0.04] to-transparent' 
    : 'from-transparent via-black/[0.04] to-transparent';

  return (
    <div 
      className={`relative overflow-hidden border ${baseColor} ${className}`} 
      style={{ ...style, animationDelay: `${delay}ms` }}
    >
      <div className={`absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r ${shimmerGradient}`} />
    </div>
  );
};


// --- 3. ESQUELETO DAS ABAS (Usado no page.js) ---
export const SkeletonTabContent = ({ temaNoturno = true }) => (
  <div className="w-full h-full flex flex-col gap-6 p-4 md:p-8 pt-2 md:pt-6 animate-in fade-in duration-500">
    <ShimmerEngine />
    
    {/* Título da Aba fantasma */}
    <SkeletonBlock temaNoturno={temaNoturno} className="w-48 h-8 rounded-lg mb-2" />
    
    {/* Grid principal de conteúdo */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full flex-1">
      <SkeletonBlock temaNoturno={temaNoturno} className="lg:col-span-2 rounded-[32px] h-full min-h-[400px]" delay={100} />
      <SkeletonBlock temaNoturno={temaNoturno} className="rounded-[32px] h-full min-h-[400px]" delay={200} />
    </div>
  </div>
);


// --- 4. ESQUELETO DO PAINEL DE COMANDAS ---
export const SkeletonPainelComanda = ({ temaNoturno = true, abaDetalheMobile = 'menu' }) => {
  return (
    <div className="w-full h-full flex flex-col animate-in fade-in duration-500 rounded-[32px] overflow-hidden border border-transparent">
      <ShimmerEngine />

      {/* Header (Categorias) */}
      <div className={`w-full shrink-0 px-4 py-3 flex gap-3 overflow-hidden border-b ${temaNoturno ? 'border-white/[0.04]' : 'border-black/[0.04]'}`}>
        {[1, 2, 3, 4, 5, 6].map((i, idx) => (
          <SkeletonBlock key={i} temaNoturno={temaNoturno} className="h-8 w-24 shrink-0 rounded-lg" delay={idx * 50} />
        ))}
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Esquerdo: Grade de Produtos */}
        <div className={`w-full md:w-[65%] lg:w-[70%] flex flex-col h-full p-4 md:p-6 md:border-r ${abaDetalheMobile === 'menu' ? 'flex' : 'hidden md:flex'} ${temaNoturno ? 'border-white/[0.04]' : 'border-black/[0.04]'}`}>
          <SkeletonBlock temaNoturno={temaNoturno} className="w-full h-[76px] mb-6 rounded-[20px]" />
          <SkeletonBlock temaNoturno={temaNoturno} className="h-4 w-32 mb-5 rounded-md" delay={100} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i, idx) => (
              <SkeletonBlock key={i} temaNoturno={temaNoturno} className="h-[72px] rounded-[16px]" delay={150 + (idx * 30)} />
            ))}
          </div>
        </div>

        {/* Direito: Carrinho */}
        <div className={`w-full md:w-[35%] lg:w-[30%] flex flex-col h-full p-4 md:p-6 ${abaDetalheMobile === 'resumo' ? 'flex' : 'hidden md:flex'}`}>
          <SkeletonBlock temaNoturno={temaNoturno} className="h-5 w-40 mb-8 rounded-md" delay={200} />
          
          <div className="flex-1 space-y-6">
            {[1, 2, 3].map((i, idx) => (
              <div key={i} className="flex justify-between items-start">
                 <div className="flex flex-col gap-2 w-full pr-6">
                   <SkeletonBlock temaNoturno={temaNoturno} className="h-3 w-full rounded" delay={250 + (idx * 50)} />
                   <SkeletonBlock temaNoturno={temaNoturno} className="h-6 w-20 rounded-md" delay={300 + (idx * 50)} />
                 </div>
                 <SkeletonBlock temaNoturno={temaNoturno} className="h-4 w-10 rounded shrink-0" delay={250 + (idx * 50)} />
              </div>
            ))}
          </div>
          
          <SkeletonBlock temaNoturno={temaNoturno} className="w-full h-[140px] rounded-[24px] mt-auto" delay={400} />
        </div>
      </div>
    </div>
  );
};