'use client';
import React from 'react';

// ==========================================
// 1. SKELETONS (Para tabelas, listas e cards)
// ==========================================

export const Skeleton = ({ className }) => (
  <div className={`relative overflow-hidden bg-zinc-200/50 rounded-md ${className}`}>
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
  </div>
);

// Skeleton premium para linhas de tabela (Ex: AdminUsuarios, TabComandas)
export const SkeletonRow = () => (
  <div className="flex items-center gap-4 w-full p-4 border-b border-zinc-100 bg-white animate-in fade-in duration-500">
    <Skeleton className="w-10 h-10 rounded-full" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-3 w-1/4" />
    </div>
    <Skeleton className="h-8 w-20 rounded-lg" />
  </div>
);

// Skeleton premium para Cards (Ex: PainelComanda, CardComanda)
export const SkeletonCard = () => (
  <div className="p-5 border border-zinc-100 rounded-xl shadow-sm bg-white space-y-4 animate-in fade-in duration-500">
    <div className="flex justify-between items-start">
       <Skeleton className="h-5 w-1/2" />
       <Skeleton className="h-6 w-6 rounded-full" />
    </div>
    <Skeleton className="h-8 w-1/3 mt-2" />
    <div className="flex gap-2 mt-4">
       <Skeleton className="h-6 w-16 rounded-md" />
       <Skeleton className="h-6 w-20 rounded-md" />
    </div>
  </div>
);


// ==========================================
// 2. COMPONENTE PRINCIPAL DE LOADING
// ==========================================

export default function SystemLoader({ variant = 'section', text = '' }) {
  
  // Animação de barras verticais (Inspirado no gráfico do Login da AROX)
  const AnimatedBars = () => (
    <div className="flex items-end justify-center gap-[6px] h-10">
      {[40, 70, 50, 100, 60].map((h, i) => (
        <div 
          key={i} 
          className="w-1.5 bg-gradient-to-t from-purple-600 to-indigo-500 rounded-t-sm animate-[pulse_1.2s_ease-in-out_infinite]"
          style={{ height: `${h}%`, animationDelay: `${i * 0.15}s` }}
        ></div>
      ))}
    </div>
  );

  // A. INLINE (Botões, Ações rápidas menores)
  if (variant === 'inline') {
    return (
      <div className="flex items-center justify-center gap-1.5 px-1">
        <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
      </div>
    );
  }

  // B. SECTION (Áreas grandes da tela, gráficos carregando, painéis inteiros)
  if (variant === 'section') {
    return (
      <div className="w-full h-full min-h-[250px] flex flex-col items-center justify-center animate-in fade-in duration-500">
        <AnimatedBars />
        {text && <p className="mt-5 text-sm font-medium text-zinc-400 animate-pulse">{text}</p>}
      </div>
    );
  }

  // C. FULL SCREEN (Carregamento inicial master, transições pesadas de rota)
  if (variant === 'full') {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-zinc-50/80 backdrop-blur-md animate-in fade-in duration-500">
        <div className="relative p-10 rounded-3xl bg-white shadow-2xl border border-zinc-100 flex flex-col items-center">
          <span className="text-zinc-950 font-black tracking-tighter text-3xl mb-8">AROX</span>
          <AnimatedBars />
          {text && <p className="mt-6 text-sm font-medium text-zinc-500">{text}</p>}
        </div>
      </div>
    );
  }

  return null;
}