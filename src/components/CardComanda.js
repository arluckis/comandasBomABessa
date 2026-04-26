'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ==========================================
// LÓGICA DE NEGÓCIO
// ==========================================
function useComandaLogic(comanda) {
  const isDelivery = comanda.tipo === 'Delivery';
  
  const totalOriginal = (comanda.produtos || []).reduce((acc, p) => acc + (Number(p.preco) || 0), 0) + (Number(comanda.taxa_entrega) || 0);
  const totalPago = (comanda.pagamentos || []).reduce((acc, p) => acc + (Number(p.valor) || 0), 0);
  const totalPendente = totalOriginal - totalPago;
  
  const isPagaParcial = totalPago > 0 && totalPendente > 0.01;
  const isPagaTotal = totalOriginal > 0 && totalPendente <= 0.01;
  const qtdProdutos = (comanda.produtos || []).length;

  const [minutosAbertos, setMinutosAbertos] = useState(0);
  
  useEffect(() => {
    if (!comanda.hora_abertura || isPagaTotal) return;
    
    const calcTempo = () => {
      const diff = Date.now() - new Date(comanda.hora_abertura).getTime();
      setMinutosAbertos(Math.floor(diff / 60000));
    };
    
    calcTempo();
    const interval = setInterval(calcTempo, 60000);
    return () => clearInterval(interval);
  }, [comanda.hora_abertura, isPagaTotal]);

  return { isDelivery, totalOriginal, totalPendente, isPagaParcial, isPagaTotal, qtdProdutos, minutosAbertos };
}

// ==========================================
// SISTEMA DE DESIGN
// ==========================================
function getCardTheme(logic, isDark) {
  if (logic.isPagaTotal) {
    return {
      bgTinta: isDark ? 'bg-emerald-500/[0.04]' : 'bg-emerald-500/[0.03]',
      bordaHover: isDark ? 'group-hover:border-emerald-500/20' : 'group-hover:border-emerald-500/30',
      dot: 'bg-emerald-500',
      textoValor: isDark ? 'text-emerald-400' : 'text-emerald-600',
      textoTempo: isDark ? 'text-emerald-500/40' : 'text-emerald-600/40'
    };
  }
  if (logic.isDelivery) {
    return {
      bgTinta: isDark ? 'bg-amber-500/[0.03]' : 'bg-amber-500/[0.02]',
      bordaHover: isDark ? 'group-hover:border-amber-500/20' : 'group-hover:border-amber-500/30',
      dot: 'bg-amber-500',
      textoValor: isDark ? 'text-white' : 'text-zinc-900',
      textoTempo: isDark ? 'text-zinc-500/80' : 'text-zinc-400/80'
    };
  }
  
  return {
    bgTinta: 'bg-transparent',
    bordaHover: isDark ? 'group-hover:border-white/10' : 'group-hover:border-black/10',
    dot: isDark ? 'bg-blue-400' : 'bg-blue-500',
    textoValor: isDark ? 'text-white' : 'text-zinc-900',
    textoTempo: isDark ? 'text-zinc-500/80' : 'text-zinc-400/80'
  };
}

// FÍSICA PREMIUM
const springPhysics = {
  type: "spring",
  stiffness: 420,
  damping: 32,
  mass: 0.6
};

// ==========================================
// MAIN COMPONENT
// ==========================================
export default function CardComanda({ comanda, onClick, temaNoturno: isDark }) {
  const logic = useComandaLogic(comanda);
  const theme = getCardTheme(logic, isDark);

  const tempoTexto = logic.minutosAbertos > 59 
    ? `${Math.floor(logic.minutosAbertos / 60)}h ${logic.minutosAbertos % 60}m` 
    : `${logic.minutosAbertos}m`;

  return (
    <motion.div
      onClick={onClick}
      initial={{
        boxShadow: isDark 
          ? "0px 4px 24px -8px rgba(0,0,0,0.4)" 
          : "0px 4px 16px -8px rgba(0,0,0,0.04)"
      }}
      whileHover={{ 
        scale: 1.015,
        y: -2,
        boxShadow: isDark 
          ? "0px 12px 32px -8px rgba(0,0,0,0.7)" 
          : "0px 12px 24px -8px rgba(0,0,0,0.12)"
      }}
      whileTap={{ 
        scale: 0.975,
        transition: { type: "spring", stiffness: 500, damping: 30 }
      }}
      transition={springPhysics}
      className={`group relative w-full sm:w-[280px] h-[150px] cursor-pointer rounded-[24px] flex flex-col justify-between p-5 border transition-colors duration-300 ease-out ${
        isDark 
          ? `bg-[#0A0A0A] border-white/[0.03] ${theme.bordaHover}` 
          : `bg-white border-black/[0.03] ${theme.bordaHover}`
      }`}
    >
      {/* Edge Highlight (Premium Inset) */}
      <div 
        className={`absolute inset-0 z-20 rounded-[24px] pointer-events-none opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100 ${
          isDark ? 'shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]' : 'shadow-[inset_0_1px_1px_rgba(0,0,0,0.03)]'
        }`} 
      />

      {/* Tinta de Fundo: Fade-in suave simulando respiração orgânica */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`absolute inset-0 z-0 rounded-[24px] pointer-events-none transition-colors duration-700 ${theme.bgTinta}`} 
      />

      <div className="flex justify-between items-start w-full relative z-10 pointer-events-none">
        
        <div className="flex flex-col min-w-0 pr-3">
          <h3 className={`font-medium text-[14px] truncate tracking-tight mb-1.5 ${isDark ? 'text-zinc-200/90' : 'text-zinc-800/90'}`}>
            {comanda.nome || 'Comanda S/N'}
          </h3>
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${theme.dot}`} />
            <span className={`text-[9px] font-bold uppercase tracking-widest ${isDark ? 'text-zinc-500/80' : 'text-zinc-400/80'}`}>
              {logic.isDelivery ? 'Delivery' : 'Mesa'} {logic.isPagaParcial && !logic.isPagaTotal && '• Parc'}
            </span>
          </div>
        </div>

        <AnimatePresence>
          {!logic.isPagaTotal && logic.minutosAbertos > 0 && (
            <motion.span 
              initial={{ opacity: 0, y: 2 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={`text-[11px] font-mono tracking-wider text-right transition-colors duration-500 ${theme.textoTempo}`}
            >
              {tempoTexto}
            </motion.span>
          )}
        </AnimatePresence>

      </div>

      <div className="flex items-end justify-between w-full mt-auto relative z-20 pointer-events-none">
        
        <div className="flex flex-col mb-1">
           <span className={`text-[11px] font-medium tracking-wide ${isDark ? 'text-zinc-600/80' : 'text-zinc-400/80'}`}>
             {logic.qtdProdutos === 0 ? 'Vazia' : `${logic.qtdProdutos} ite${logic.qtdProdutos === 1 ? 'm' : 'ns'}`}
           </span>
        </div>

        <div className="text-right flex flex-col items-end leading-none relative">
           
           <AnimatePresence>
             {logic.isPagaParcial && !logic.isPagaTotal && (
               <motion.span 
                 initial={{ opacity: 0, y: 2 }} 
                 animate={{ opacity: 1, y: 0 }} 
                 exit={{ opacity: 0, y: 2 }}
                 transition={{ duration: 0.2, ease: "easeOut" }}
                 className={`absolute bottom-[110%] right-0 mb-1 text-[11px] font-medium line-through ${isDark ? 'text-zinc-600/70' : 'text-zinc-400/70'}`}
               >
                 R$ {logic.totalOriginal.toFixed(2)}
               </motion.span>
             )}
           </AnimatePresence>
           
           <div className="flex items-baseline gap-1">
             <span className={`text-[12px] font-medium ${logic.isPagaTotal ? (isDark ? 'text-emerald-500/50' : 'text-emerald-600/50') : (isDark ? 'text-zinc-500/70' : 'text-zinc-400/70')}`}>
               R$
             </span>
             
             <AnimatePresence mode="wait">
               <motion.span
                 key={logic.isPagaTotal ? logic.totalOriginal : logic.totalPendente}
                 initial={{ opacity: 0, scale: 1.02 }}
                 animate={{ opacity: 1, scale: 1 }}
                 transition={{ duration: 0.15, ease: "easeOut" }}
                 className={`font-semibold text-[32px] tabular-nums tracking-tighter leading-none ${theme.textoValor}`}
               >
                 {(logic.isPagaTotal ? logic.totalOriginal : logic.totalPendente).toFixed(2)}
               </motion.span>
             </AnimatePresence>
           </div>

        </div>
      </div>
      
    </motion.div>
  );
}