'use client';
import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion } from 'framer-motion';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay, defaultDropAnimationSideEffects } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripHorizontal, LayoutDashboard, Activity, CalendarX } from 'lucide-react';

import { useMetricasFaturamento } from '@/hooks/useMetricasFaturamento';
import ErrorBoundary from './ui/ErrorBoundary';
import { SkeletonWidgetFat, SkeletonCardBase } from './TabFaturamento/SkeletonsFat';
import { AnimatedNumber } from './TabFaturamento/Widgets';

const WidgetTermometro = dynamic(() => import('./TabFaturamento/Widgets').then(mod => mod.WidgetTermometro), { ssr: false, loading: () => <SkeletonWidgetFat altura="min-h-[200px]" /> });
const WidgetLinhaTemporal = dynamic(() => import('./TabFaturamento/Widgets').then(mod => mod.WidgetLinhaTemporal), { ssr: false, loading: () => <SkeletonWidgetFat altura="min-h-[200px]" /> });
const WidgetPagamentos = dynamic(() => import('./TabFaturamento/Widgets').then(mod => mod.WidgetPagamentos), { ssr: false, loading: () => <SkeletonWidgetFat altura="min-h-[180px]" /> });
const WidgetMapaCalor = dynamic(() => import('./TabFaturamento/Widgets').then(mod => mod.WidgetMapaCalor), { ssr: false, loading: () => <SkeletonWidgetFat altura="min-h-[200px]" /> });
const WidgetProdutos = dynamic(() => import('./TabFaturamento/Widgets').then(mod => mod.WidgetProdutos), { ssr: false, loading: () => <SkeletonWidgetFat altura="min-h-[220px]" /> });
const WidgetCombo = dynamic(() => import('./TabFaturamento/Widgets').then(mod => mod.WidgetCombo), { ssr: false, loading: () => <SkeletonWidgetFat altura="min-h-[180px]" /> });

const motionTokens = {
  fast: { duration: 0.18, ease: [0.16, 1, 0.3, 1] },
  base: { duration: 0.28, ease: [0.16, 1, 0.3, 1] },
  slow: { duration: 0.45, ease: [0.16, 1, 0.3, 1] }
};

const getDelay = (i) => {
  if (i < 3) return i * 0.04;
  return 0.12 + (i - 3) * 0.03;
};

const getSurface = (temaNoturno, level) => {
  if (level === 'focus') return temaNoturno ? 'bg-[#0A0A0A]/80 backdrop-blur-3xl shadow-2xl shadow-black/40 border border-white/[0.08]' : 'bg-white/80 backdrop-blur-3xl shadow-2xl shadow-zinc-200/50 border border-black/[0.06]';
  if (level === 'elevated') return temaNoturno ? 'bg-[#0A0A0A]/60 backdrop-blur-2xl shadow-lg shadow-black/20 border border-white/[0.04]' : 'bg-white/70 backdrop-blur-2xl shadow-lg shadow-zinc-200/30 border border-black/[0.04]';
  return temaNoturno ? 'bg-[#0A0A0A]/40 backdrop-blur-xl' : 'bg-white/60 backdrop-blur-xl';
};

const fadeTransition = { duration: 0.25, ease: "easeInOut" };

const SortableItem = ({ id, children, temaNoturno, isOverlay, index }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isOverlay ? 999 : 1 };
  let colSpanClass = (id === 'linhaTemporal' || id === 'produtos') ? 'col-span-1 md:col-span-2 xl:col-span-2 2xl:col-span-3' : 'col-span-1'; 

  return (
    <div ref={setNodeRef} style={style} className={`${colSpanClass} relative group h-full w-full ${isOverlay ? 'scale-[1.03] shadow-2xl cursor-grabbing' : ''}`}>
      <div {...attributes} {...listeners} className={`absolute top-4 right-4 z-50 p-2 rounded-[14px] opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing backdrop-blur-md ${temaNoturno ? 'hover:bg-white/10 text-zinc-500 hover:text-white' : 'hover:bg-black/5 text-zinc-400 hover:text-black'}`}>
        <GripHorizontal className="w-4 h-4" />
      </div>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.96 }} 
        animate={{ opacity: isDragging && !isOverlay ? 0.4 : 1, scale: 1 }} 
        transition={{ ...motionTokens.base, delay: getDelay(index + 3) }}
        whileHover={!isDragging && !isOverlay ? { y: -4, scale: 1.01 } : {}}
        whileTap={!isDragging && !isOverlay ? { scale: 0.98 } : {}}
        className="h-full w-full rounded-[20px]"
      >
        {children}
      </motion.div>
    </div>
  );
};

export default function TabFaturamento({
  temaNoturno, filtroTempo, setFiltroTempo, getHoje, getMesAtual, getAnoAtual,
  faturamentoTotal, lucroEstimado, dadosPizza, rankingProdutos, comandasFiltradas, comandas, caixaAtual, onNavigateComandas = () => {} 
}) {

  const [mostrarMenuPersonalizar, setMostrarMenuPersonalizar] = useState(false);
  const [widgets, setWidgets] = useState({ bruto: true, lucro: true, ticket: true, termometro: true, linhaTemporal: true, pagamentos: true, mapaCalor: true, produtos: true, combo: true }); 
  const [ordemGraficos, setOrdemGraficos] = useState(['termometro', 'linhaTemporal', 'pagamentos', 'mapaCalor', 'produtos', 'combo']);
  const [activeId, setActiveId] = useState(null); 

  const strHoje = getHoje?.() || new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
  const strMesAtual = getMesAtual?.() || ''; const strAnoAtual = getAnoAtual?.() || '';
  const fTipo = filtroTempo?.tipo || ''; const fValor = filtroTempo?.valor || '';
  const fInicio = filtroTempo?.inicio || ''; const fFim = filtroTempo?.fim || '';
  const fatTotalSafe = faturamentoTotal || 0; const lucroSafe = lucroEstimado || 0;
  const totalComandas = (comandasFiltradas || []).length; const ticketMedio = totalComandas > 0 ? (fatTotalSafe / totalComandas) : 0;

  const metricas = useMetricasFaturamento({ comandas, comandasFiltradas, fTipo, fValor, fInicio, fFim, strHoje, strMesAtual, strAnoAtual, fatTotalSafe, dadosPizza, rankingProdutos, temaNoturno });

  const isDiaAtual = fValor === strHoje;
  const isSemMovimento = fatTotalSafe === 0;
  const isDiaNaoIniciado = fTipo === 'dia' && isDiaAtual && isSemMovimento;
  const isDiaPassadoVazio = fTipo === 'dia' && !isDiaAtual && isSemMovimento;
  const isPeriodoVazio = fTipo !== 'dia' && isSemMovimento;

  const insightPrevisao = metricas?.insightsDinamicos?.find(i => i.titulo === 'Previsão Operacional')?.texto || 'Os sistemas estão online aguardando as primeiras transações do turno.';

  useEffect(() => {
    const ws = localStorage.getItem('bessa_widgets_faturamento_v10');
    const os = localStorage.getItem('bessa_ordem_faturamento_v10');
    if (ws) setWidgets(JSON.parse(ws));
    if (os) setOrdemGraficos(JSON.parse(os));
  }, []);

  const toggleWidget = (chave) => { const n = { ...widgets, [chave]: !widgets[chave] }; setWidgets(n); localStorage.setItem('bessa_widgets_faturamento_v10', JSON.stringify(n)); };
  const handleReorder = (novaOrdem) => { setOrdemGraficos(novaOrdem); localStorage.setItem('bessa_ordem_faturamento_v10', JSON.stringify(novaOrdem)); };

  const mudarTempo = (direcao) => {
    if (fTipo === 'dia') {
      const [ano, mes, dia] = (fValor || strHoje).split('-').map(Number); const dataObj = new Date(ano, mes - 1, dia); dataObj.setDate(dataObj.getDate() + direcao);
      setFiltroTempo({ ...filtroTempo, valor: `${dataObj.getFullYear()}-${String(dataObj.getMonth() + 1).padStart(2, '0')}-${String(dataObj.getDate()).padStart(2, '0')}` });
    } else if (fTipo === 'mes') {
      const [ano, mes] = (fValor || strMesAtual).split('-').map(Number); const dataObj = new Date(ano, mes - 1, 1); dataObj.setMonth(dataObj.getMonth() + direcao);
      setFiltroTempo({ ...filtroTempo, valor: `${dataObj.getFullYear()}-${String(dataObj.getMonth() + 1).padStart(2, '0')}` });
    }
  };

  const renderizarConteudoWidget = (id) => {
    switch(id) {
      case 'termometro': return <ErrorBoundary modulo="Termômetro"><WidgetTermometro temaNoturno={temaNoturno} semHistorico={metricas.semHistorico} fTipo={fTipo} fatTotalSafe={fatTotalSafe} fValor={fValor} strHoje={strHoje} diferenca={metricas.diferenca} percentualReal={metricas.percentualReal} percentualBarra={metricas.percentualBarra} bateuMeta={metricas.bateuMeta} diffAbsoluta={metricas.diffAbsoluta} /></ErrorBoundary>;
      case 'linhaTemporal': return <ErrorBoundary modulo="Linha Temporal"><WidgetLinhaTemporal temaNoturno={temaNoturno} dadosGraficoAcumulado={metricas.dadosGraficoAcumulado} /></ErrorBoundary>;
      case 'pagamentos': return <ErrorBoundary modulo="Pagamentos"><WidgetPagamentos temaNoturno={temaNoturno} dadosPizza={dadosPizza} /></ErrorBoundary>;
      case 'mapaCalor': return <ErrorBoundary modulo="Mapa Calor"><WidgetMapaCalor temaNoturno={temaNoturno} maxCalor={metricas.maxCalor} mapaCalor={metricas.mapaCalor} /></ErrorBoundary>;
      case 'produtos': return <ErrorBoundary modulo="Produtos"><WidgetProdutos temaNoturno={temaNoturno} rankingMaiusculo={metricas.rankingMaiusculo} /></ErrorBoundary>;
      case 'combo': return <ErrorBoundary modulo="Combos"><WidgetCombo temaNoturno={temaNoturno} topCombos={metricas.topCombos} /></ErrorBoundary>;
      default: return null;
    }
  };

  const widgetsVisiveis = useMemo(() => ordemGraficos.filter(id => widgets?.[id] && !(id === 'linhaTemporal' && fTipo !== 'dia')), [ordemGraficos, widgets, fTipo]);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const handleDragEnd = (event) => {
    setActiveId(null); const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = widgetsVisiveis.indexOf(active.id); const newIndex = widgetsVisiveis.indexOf(over.id);
      handleReorder([...arrayMove(widgetsVisiveis, oldIndex, newIndex), ...ordemGraficos.filter(id => !widgetsVisiveis.includes(id))]);
    }
  };

  return (
    <div className={`w-full max-w-full pb-8 mt-4 font-sans px-4 md:px-0 ${temaNoturno ? 'text-zinc-100' : 'text-zinc-900'}`}>
      
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full mb-6 z-20 relative">
         <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <div className={`flex p-1.5 rounded-[14px] shadow-sm w-full sm:w-auto ${temaNoturno ? 'bg-white/[0.03] backdrop-blur-xl border border-white/10' : 'bg-white backdrop-blur-xl border border-black/5'}`}>
              {['dia', '7 dias', 'mes', 'ano', 'periodo'].map(t => (
                 <button key={t} onClick={() => setFiltroTempo({...filtroTempo, tipo: t, valor: t==='dia'||t==='7 dias'?strHoje:t==='mes'?strMesAtual:strAnoAtual})} 
                 className={`flex-1 px-4 py-2 rounded-[10px] text-[10px] font-bold uppercase tracking-widest transition-colors duration-200 ease-out ${fTipo === t ? (temaNoturno ? 'bg-white/10 text-white shadow-sm' : 'bg-zinc-100 text-zinc-900 shadow-sm') : (temaNoturno ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-500 hover:text-zinc-700')}`}>
                   {t}
                 </button>
              ))}
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {(fTipo === 'dia' || fTipo === 'mes') && (
                <>
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => mudarTempo(-1)} className={`p-2.5 rounded-[14px] shadow-sm ${temaNoturno ? 'bg-white/[0.03] border border-white/10 text-zinc-400 hover:text-white hover:bg-white/5' : 'bg-white border border-black/5 text-zinc-500 hover:text-black hover:bg-black/5'} transition-colors`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>
                  </motion.button>
                  <input type={fTipo === 'dia' ? 'date' : 'month'} value={fValor || ''} max={fTipo === 'dia' ? strHoje : strMesAtual} onChange={e => setFiltroTempo({...filtroTempo, valor: e.target.value})} 
                    className={`px-4 py-2.5 text-center rounded-[14px] outline-none text-[12px] font-bold uppercase tracking-wider w-full sm:w-36 transition-colors shadow-sm ${temaNoturno ? 'bg-white/[0.03] border border-white/10 [color-scheme:dark]' : 'bg-white border border-black/5'}`} />
                  {fValor < (fTipo === 'dia' ? strHoje : strMesAtual) ? (
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => mudarTempo(1)} className={`p-2.5 rounded-[14px] shadow-sm ${temaNoturno ? 'bg-white/[0.03] border border-white/10 text-zinc-400 hover:text-white hover:bg-white/5' : 'bg-white border border-black/5 text-zinc-500 hover:text-black hover:bg-black/5'} transition-colors`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"></path></svg>
                    </motion.button>
                  ) : <div className="w-[42px]" />}
                </>
              )}
            </div>
         </div>
      </div>

      <div className="w-full relative min-h-[400px]">
        <AnimatePresence initial={false}>
          {isDiaNaoIniciado ? (
            <motion.div key="state-not-started" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={fadeTransition} className="absolute inset-0 w-full flex flex-col items-center justify-center p-12 lg:p-24 rounded-[32px] text-center z-10">
              <div className="absolute -inset-[20%] w-[140%] h-[140%] pointer-events-none flex items-center justify-center">
                <div className={`w-[400px] h-[400px] rounded-full blur-[100px] opacity-30 animate-pulse ${temaNoturno ? 'bg-emerald-500/30' : 'bg-emerald-500/20'}`} />
              </div>
              <div className="relative z-10 flex flex-col items-center">
                <div className={`p-5 rounded-[20px] mb-8 shadow-[0_0_40px_rgba(16,185,129,0.1)] ${temaNoturno ? 'bg-white/[0.02] border border-white/5' : 'bg-black/[0.02] border border-black/5'}`}>
                  <Activity className={`w-8 h-8 animate-pulse ${temaNoturno ? 'text-zinc-300' : 'text-zinc-600'}`} strokeWidth={1.5} />
                </div>
                <h2 className="text-2xl font-medium tracking-tight mb-3">Operação ainda não iniciada</h2>
                <p className={`text-[14px] max-w-sm leading-relaxed ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>{insightPrevisao}</p>
              </div>
            </motion.div>
          ) 
          
          : isDiaPassadoVazio || isPeriodoVazio ? (
            <motion.div key="state-empty-past" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={fadeTransition} className={`absolute inset-0 w-full flex flex-col items-center justify-center p-12 lg:p-24 rounded-[32px] z-10 ${temaNoturno ? 'bg-white/[0.01]' : 'bg-black/[0.01]'}`}>
               <div className="mb-6 opacity-40">
                 <CalendarX className={`w-10 h-10 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}`} strokeWidth={1.5} />
               </div>
               <h2 className="text-[18px] font-medium tracking-tight mb-2">Nenhuma movimentação registrada</h2>
               <p className={`text-[13px] ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>Este período não possui registros operacionais no sistema.</p>
               <div className="mt-10 flex gap-3 opacity-20">
                 {[1, 2, 3, 4, 5].map(i => <div key={i} className={`w-12 h-1.5 rounded-full ${temaNoturno ? 'bg-zinc-600' : 'bg-zinc-300'}`} />)}
               </div>
            </motion.div>
          ) 
          
          : (
            <motion.div key="state-populated" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={fadeTransition} className="flex flex-col gap-5 w-full relative z-10">
              
              {([widgets?.bruto, widgets?.lucro, widgets?.ticket].filter(Boolean).length > 0) && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 w-full">
                  {widgets?.bruto && (
                    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ ...motionTokens.fast, delay: getDelay(0) }} whileHover={{ scale: 1.01, y: -2 }} className={`p-6 rounded-[28px] flex flex-col justify-between min-h-[120px] w-full ${getSurface(temaNoturno, 'focus')}`}>
                      <h3 className={`text-[10px] font-bold uppercase tracking-widest ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}`}>Volume Bruto</h3>
                      <p className="text-3xl font-semibold tracking-tight tabular-nums mt-1"><span className="text-lg opacity-40 font-normal mr-1">R$</span><AnimatedNumber value={fatTotalSafe} minFraction={2} /></p>
                    </motion.div>
                  )}
                  {widgets?.lucro && (
                    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ ...motionTokens.fast, delay: getDelay(1) }} whileHover={{ scale: 1.01, y: -2 }} className={`p-6 rounded-[28px] flex flex-col justify-between min-h-[120px] w-full ${getSurface(temaNoturno, 'focus')}`}>
                      <h3 className={`text-[10px] font-bold uppercase tracking-widest ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}`}>Lucro Estimado</h3>
                      <p className={`text-3xl font-semibold tracking-tight tabular-nums mt-1 ${temaNoturno ? 'text-emerald-400' : 'text-emerald-600'}`}><span className="text-lg opacity-40 font-normal mr-1">R$</span><AnimatedNumber value={lucroSafe} minFraction={2} /></p>
                    </motion.div>
                  )}
                  {widgets?.ticket && (
                    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ ...motionTokens.fast, delay: getDelay(2) }} whileHover={{ scale: 1.01, y: -2 }} className={`p-6 rounded-[28px] flex flex-col justify-between min-h-[120px] w-full ${getSurface(temaNoturno, 'focus')}`}>
                      <div className="flex justify-between items-start mb-1 w-full"><h3 className={`text-[10px] font-bold uppercase tracking-widest ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}`}>Ticket Médio</h3><span className={`text-[10px] font-bold px-2 py-0.5 rounded-[10px] border flex-shrink-0 ${temaNoturno ? 'bg-white/5 border-white/10 text-zinc-400' : 'bg-black/5 border-black/5 text-zinc-500'}`}><AnimatedNumber value={totalComandas} /> cmd</span></div>
                      <p className="text-3xl font-semibold tracking-tight tabular-nums mt-1"><span className="text-lg opacity-40 font-normal mr-1">R$</span><AnimatedNumber value={ticketMedio} minFraction={2} /></p>
                    </motion.div>
                  )}
                </div>
              )}

              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={(e) => setActiveId(e.active.id)} onDragEnd={handleDragEnd}>
                <SortableContext items={widgetsVisiveis} strategy={rectSortingStrategy}>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5 w-full grid-flow-row-dense">
                    {widgetsVisiveis.map((id, index) => (
                      <SortableItem key={id} id={id} index={index} temaNoturno={temaNoturno}>
                         {renderizarConteudoWidget(id)}
                      </SortableItem>
                    ))}
                  </div>
                </SortableContext>
                <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: "0.4" } } }) }}>
                  {activeId ? <SortableItem id={activeId} temaNoturno={temaNoturno} isOverlay index={0}>{renderizarConteudoWidget(activeId)}</SortableItem> : null}
                </DragOverlay>
              </DndContext>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}