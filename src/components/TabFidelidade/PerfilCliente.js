'use client';
import React, { useState, useMemo } from 'react';

const textSecundario = (tema) => tema ? 'text-zinc-400' : 'text-zinc-500';
const textPrincipal = (tema) => tema ? 'text-zinc-100' : 'text-zinc-900';
const bordaBase = (tema) => tema ? 'border-white/[0.08]' : 'border-black/[0.08]';
const surfaceBase = (tema) => tema ? 'bg-[#0A0A0C]' : 'bg-white';

export const PerfilCliente = ({ temaNoturno, clientePerfil, setClientePerfil, comandas, meta, obterDiagnostico }) => {
  const [viewMapa, setViewMapa] = useState('mes'); 
  const [hoverBox, setHoverBox] = useState(null);
  const [mesFoco, setMesFoco] = useState(new Date());

  const diasSemanaNomesCurto = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
  
  // Ordem de negócio (Seg a Dom)
  const indicesBusiness = [1, 2, 3, 4, 5, 6, 0];
  const nomesBusiness = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'];

  const metricas = useMemo(() => {
    let totalGasto = 0;
    let totalVisitas = 0;
    let ultimaVisitaDate = null;
    
    const contagemGlobal = {};
    let horasFrequencia = Array.from({ length: 24 }, () => ({ count: 0 })); 
    let diasSemFrequencia = Array.from({ length: 7 }, () => ({ count: 0, gasto: 0 }));
    let diasDoMesFrequencia = {}; 

    const comandasDele = (comandas || []).filter(c => c.nome?.toLowerCase() === clientePerfil.nome?.toLowerCase());
    
    comandasDele.forEach(c => {
      const ticket = (c.produtos || []).reduce((acc, p) => acc + (p.preco || 0), 0);
      totalGasto += ticket;
      
      const dataVisita = c.created_at || c.data_hora || c.data;
      if (dataVisita) {
        totalVisitas++;
        const d = new Date(dataVisita);
        const diaSemana = d.getDay();
        const hora = d.getHours();
        
        const diaStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        
        if (!ultimaVisitaDate || d > ultimaVisitaDate) ultimaVisitaDate = d;
        
        if (diaSemana >= 0 && diaSemana <= 6) {
            diasSemFrequencia[diaSemana].count++;
            diasSemFrequencia[diaSemana].gasto += ticket;
        }
        if (hora >= 0 && hora <= 23) horasFrequencia[hora].count++;
        
        if (!diasDoMesFrequencia[diaStr]) diasDoMesFrequencia[diaStr] = { count: 0, gasto: 0 };
        diasDoMesFrequencia[diaStr].count++;
        diasDoMesFrequencia[diaStr].gasto += ticket;
      }

      (c.produtos || []).forEach(p => {
        const n = p.nome.replace(/\s*\(\d+(?:\.\d+)?\s*g\)/i, '').trim().toUpperCase();
        contagemGlobal[n] = (contagemGlobal[n] || 0) + 1;
      });
    });

    const ticketMedio = totalVisitas > 0 ? (totalGasto / totalVisitas) : 0;
    
    let isEstimado = false;
    let valorAcumuladoExibicao = totalGasto;
    if (totalGasto === 0 && (clientePerfil.pontos_totais || clientePerfil.pontos) > 0) {
        valorAcumuladoExibicao = (clientePerfil.pontos_totais || clientePerfil.pontos) * (meta.valor_minimo || 1);
        isEstimado = true;
    }

    const totalPontosLtv = clientePerfil.pontos_totais || clientePerfil.pontos || 0;
    
    let produtos = Object.entries(contagemGlobal).map(([nome, qtd]) => ({ nome, qtd })).sort((a, b) => b.qtd - a.qtd);
    const totalItensComprados = produtos.reduce((acc, p) => acc + p.qtd, 0);
    produtos = produtos.map(p => ({ ...p, percent: totalItensComprados ? ((p.qtd / totalItensComprados) * 100) : 0 }));

    let diaFavorito = { nome: '-', count: 0 };
    diasSemFrequencia.forEach((d, i) => { 
        if (d.count > diaFavorito.count) diaFavorito = { nome: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][i], count: d.count }; 
    });
    
    let horaFavorita = { nome: '-', count: 0 };
    let maxHoraRealCount = 0;
    horasFrequencia.forEach((h, i) => { 
        if (h.count > horaFavorita.count) {
            horaFavorita = { nome: `${i}h`, count: h.count }; 
            maxHoraRealCount = h.count;
        }
    });

    let produtoFavorito = produtos.length > 0 ? produtos[0].nome : 'Nenhum item';

    let diasAtrasVisita = 'Inativo';
    if (ultimaVisitaDate) {
      const diff = new Date() - ultimaVisitaDate;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      diasAtrasVisita = days === 0 ? 'Hoje' : days === 1 ? 'Ontem' : `${days} dias atrás`;
    }

    return { 
        totalGasto: valorAcumuladoExibicao, isEstimado, ticketMedio, totalVisitas, diasAtrasVisita,
        produtos, maxProdutoQtd: produtos.length > 0 ? produtos[0].qtd : 1,
        horasFrequencia, maxHoraRealCount, diasSemFrequencia, diasDoMesFrequencia, totalPontosLtv,
        insights: { diaFavorito: diaFavorito.nome, horaFavorita: horaFavorita.nome, produtoFavorito }
    };
  }, [clientePerfil, comandas, meta]);

  const anoFoco = mesFoco.getFullYear();
  const mesFocoIdx = mesFoco.getMonth();
  const diasNoMes = new Date(anoFoco, mesFocoIdx + 1, 0).getDate();
  const primeiroDiaDaSemana = new Date(anoFoco, mesFocoIdx, 1).getDay();
  
  const gridDias = Array.from({ length: primeiroDiaDaSemana }, () => null).concat(
      Array.from({ length: diasNoMes }, (_, i) => i + 1)
  );

  const maxMensalCount = useMemo(() => {
    let max = 1;
    for (let i = 1; i <= diasNoMes; i++) {
        const dStr = `${anoFoco}-${String(mesFocoIdx + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        if (metricas.diasDoMesFrequencia[dStr] && metricas.diasDoMesFrequencia[dStr].count > max) {
            max = metricas.diasDoMesFrequencia[dStr].count;
        }
    }
    return max;
  }, [anoFoco, mesFocoIdx, diasNoMes, metricas.diasDoMesFrequencia]);

  const maxSemanalCount = Math.max(...metricas.diasSemFrequencia.map(d => d.count), 1);

  const irParaMesAnterior = () => setMesFoco(new Date(anoFoco, mesFocoIdx - 1, 1));
  const irParaProximoMes = () => setMesFoco(new Date(anoFoco, mesFocoIdx + 1, 1));

  // Formatação de data precisa
  const dataCadastroFormatada = new Date(clientePerfil.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <div className={`flex flex-col h-full w-full animate-in fade-in duration-500 bg-transparent`}>
      
      {/* TOPO COMPACTO */}
      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 pt-5 pb-5 shrink-0 flex items-center gap-4 relative">
        <button onClick={() => setClientePerfil(null)} className={`shrink-0 p-2 rounded-md transition-colors ${temaNoturno ? 'hover:bg-white/10' : 'hover:bg-black/5'} ${textPrincipal(temaNoturno)}`}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        </button>
        
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-3 mb-0.5">
            <h1 className={`text-2xl font-black tracking-tight truncate ${textPrincipal(temaNoturno)}`}>
              {clientePerfil.nome}
            </h1>
            <div className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border ${obterDiagnostico(clientePerfil).bg} ${obterDiagnostico(clientePerfil).color} ${temaNoturno ? 'border-white/10' : 'border-black/10'}`}>
              {obterDiagnostico(clientePerfil).label}
            </div>
          </div>
          <p className={`text-[12px] font-medium flex items-center gap-2 ${textSecundario(temaNoturno)}`}>
            <span>{clientePerfil.telefone || 'S/ Contato'}</span>
            <span className="opacity-30">•</span>
            <span>Cliente desde {dataCadastroFormatada}</span>
          </p>
        </div>
      </div>

      {/* ÁREA DE CONTEÚDO (Menos padding, mais densidade) */}
      <div className="flex-1 overflow-y-auto scrollbar-hide min-h-0 w-full px-4 md:px-8 pb-10">
        <div className="max-w-7xl mx-auto space-y-4">
          
          {/* BLOCO 1: MÉTRICAS COMPACTAS (Linear Style) */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* LTV & Consumo */}
            <div className={`col-span-1 md:col-span-2 p-5 rounded-[20px] border flex flex-col justify-between relative overflow-hidden ${surfaceBase(temaNoturno)} ${bordaBase(temaNoturno)}`}>
              <div className="flex justify-between items-start z-10">
                <div>
                    <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 opacity-70 ${textSecundario(temaNoturno)}`}>Valor Consumido Total</p>
                    <div className="flex items-baseline gap-1 group cursor-default">
                        <span className={`text-[14px] font-bold ${textSecundario(temaNoturno)}`}>R$</span>
                        <p className={`text-3xl font-black tracking-tight ${textPrincipal(temaNoturno)}`}>{metricas.totalGasto.toFixed(2).replace('.', ',')}</p>
                        {metricas.isEstimado && <span className={`ml-1 text-[12px] opacity-40 ${textPrincipal(temaNoturno)}`} title="Estimado">*</span>}
                    </div>
                </div>
                <div className="text-right">
                    <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 opacity-70 ${textSecundario(temaNoturno)}`}>Pontos Acumulados</p>
                    <p className={`text-xl font-bold tracking-tight ${textPrincipal(temaNoturno)}`}>{metricas.totalPontosLtv} <span className="text-[10px] opacity-60">pts</span></p>
                </div>
              </div>
            </div>

            {/* Progresso & Visitas */}
            <div className={`p-5 rounded-[20px] border flex flex-col justify-center ${surfaceBase(temaNoturno)} ${bordaBase(temaNoturno)}`}>
              <div className="flex justify-between items-end mb-3">
                 <div>
                    <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 opacity-70 ${textSecundario(temaNoturno)}`}>Meta Atual</p>
                    <div className="flex items-baseline gap-1">
                        <p className={`text-2xl font-black tracking-tight ${clientePerfil.pontos >= meta.pontos_necessarios ? 'text-emerald-500' : textPrincipal(temaNoturno)}`}>{clientePerfil.pontos}</p>
                        <span className={`text-[11px] font-bold ${textSecundario(temaNoturno)}`}>/ {meta.pontos_necessarios}</span>
                    </div>
                 </div>
                 <div className="text-right">
                    <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 opacity-70 ${textSecundario(temaNoturno)}`}>Visitas</p>
                    <p className={`text-lg font-bold tracking-tight ${textPrincipal(temaNoturno)}`}>{metricas.totalVisitas}</p>
                 </div>
              </div>
              <div className={`w-full h-1.5 rounded-full overflow-hidden ${temaNoturno ? 'bg-white/10' : 'bg-black/10'}`}>
                 <div className={`h-full rounded-full ${clientePerfil.pontos >= meta.pontos_necessarios ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{ width: `${Math.min((clientePerfil.pontos / meta.pontos_necessarios) * 100, 100)}%` }} />
              </div>
            </div>

            {/* Insights Rápidos */}
            <div className={`p-4 rounded-[20px] border flex flex-col justify-between gap-2 ${surfaceBase(temaNoturno)} ${bordaBase(temaNoturno)}`}>
               <div className="flex justify-between items-center">
                 <p className={`text-[10px] font-bold uppercase tracking-widest opacity-70 ${textSecundario(temaNoturno)}`}>Última Visita</p>
                 <p className={`text-[13px] font-bold ${textPrincipal(temaNoturno)}`}>{metricas.diasAtrasVisita}</p>
               </div>
               <div className="flex justify-between items-center">
                 <p className={`text-[10px] font-bold uppercase tracking-widest opacity-70 ${textSecundario(temaNoturno)}`}>Ticket Médio</p>
                 <p className={`text-[13px] font-bold ${textPrincipal(temaNoturno)}`}>R$ {metricas.ticketMedio.toFixed(2).replace('.', ',')}</p>
               </div>
               <div className="flex justify-between items-center border-t pt-2 mt-1" style={{ borderColor: temaNoturno ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                 <p className={`text-[10px] font-bold uppercase tracking-widest opacity-70 ${textSecundario(temaNoturno)}`}>Produto Campeão</p>
                 <p className={`text-[11px] font-bold truncate max-w-[50%] text-right ${textPrincipal(temaNoturno)}`}>{metricas.insights.produtoFavorito}</p>
               </div>
            </div>
          </div>

          {/* BLOCO 2: PAINEL SEMANAL (Visão Operacional Direta) */}
          <div className={`w-full p-4 md:p-5 rounded-[20px] border flex flex-col gap-3 ${surfaceBase(temaNoturno)} ${bordaBase(temaNoturno)}`}>
             <div className="flex justify-between items-center">
                <h3 className={`text-[11px] font-bold uppercase tracking-widest ${textSecundario(temaNoturno)}`}>Ritmo Semanal (Visitas)</h3>
                <span className={`text-[10px] font-bold ${temaNoturno ? 'text-amber-400' : 'text-amber-600'}`}>Pico: {metricas.insights.diaFavorito}</span>
             </div>
             <div className="grid grid-cols-7 gap-2 h-14">
                {indicesBusiness.map((diaIdx, i) => {
                    const info = metricas.diasSemFrequencia[diaIdx];
                    const height = maxSemanalCount === 0 ? 0 : (info.count / maxSemanalCount) * 100;
                    const isPico = info.count === maxSemanalCount && info.count > 0;
                    
                    return (
                        <div key={i} className="flex flex-col justify-end items-center h-full relative group">
                            {/* Tooltip Semanal */}
                            {info.count > 0 && (
                                <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-800 text-white text-[9px] font-bold px-2 py-1 rounded pointer-events-none z-10 whitespace-nowrap">
                                    {info.count} visitas
                                </div>
                            )}
                            <div className={`w-full max-w-[32px] rounded-sm transition-all ${isPico ? 'bg-amber-500' : (temaNoturno ? 'bg-indigo-500/30' : 'bg-indigo-500/20')}`} style={{ height: `${Math.max(height, 10)}%` }} />
                            <span className={`text-[9px] font-bold mt-1 ${isPico ? (temaNoturno ? 'text-amber-400' : 'text-amber-600') : textSecundario(temaNoturno)}`}>{nomesBusiness[i]}</span>
                        </div>
                    )
                })}
             </div>
          </div>

          {/* BLOCO 3: MAPAS & RANKING (Lado a Lado Compacto) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
             
             {/* Gráficos Temporais (Esquerda - 7 colunas) */}
             <div className={`col-span-1 lg:col-span-7 p-5 rounded-[20px] border flex flex-col min-h-[280px] ${surfaceBase(temaNoturno)} ${bordaBase(temaNoturno)}`}>
                <div className="flex justify-between items-center mb-4">
                   <div className={`flex items-center p-0.5 rounded-lg border ${temaNoturno ? 'bg-[#141414] border-white/5' : 'bg-zinc-50 border-black/5'}`}>
                      {[{id: 'mes', l:'Calendário'}, {id: 'hora', l:'Horário Pico'}].map((btn) => (
                        <button key={btn.id} onClick={() => setViewMapa(btn.id)} className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all duration-200 ${viewMapa === btn.id ? (temaNoturno ? 'bg-white/10 text-white shadow-sm' : 'bg-white shadow-sm text-black') : `hover:opacity-80 ${textSecundario(temaNoturno)}`}`}>
                          {btn.l}
                        </button>
                      ))}
                   </div>
                   {viewMapa === 'mes' && (
                       <div className="flex items-center gap-2">
                           <button onClick={irParaMesAnterior} className={`p-1 rounded ${temaNoturno ? 'hover:bg-white/10' : 'hover:bg-black/10'}`}><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg></button>
                           <span className={`text-[10px] font-bold uppercase ${textPrincipal(temaNoturno)}`}>{mesFoco.toLocaleString('pt-BR', { month: 'short', year: 'numeric' })}</span>
                           <button onClick={irParaProximoMes} className={`p-1 rounded ${temaNoturno ? 'hover:bg-white/10' : 'hover:bg-black/10'}`}><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg></button>
                       </div>
                   )}
                </div>

                <div className="flex-1 w-full relative flex flex-col justify-end">
                   
                   {/* Calendário Contido */}
                   {viewMapa === 'mes' && (
                     <div className="w-full flex flex-col h-full justify-between">
                       <div className="grid grid-cols-7 gap-1 w-full flex-1">
                         {diasSemanaNomesCurto.map((d, i) => (
                           <div key={`h-${i}`} className={`text-center text-[9px] font-bold uppercase opacity-50 flex items-center justify-center ${textSecundario(temaNoturno)}`}>{d}</div>
                         ))}
                         {gridDias.map((dia, idx) => {
                            if (!dia) return <div key={`empty-${idx}`} className="w-full" />;

                            const dataStr = `${anoFoco}-${String(mesFocoIdx + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
                            const info = metricas.diasDoMesFrequencia[dataStr];
                            const count = info ? info.count : 0;
                            const isPico = count === maxMensalCount && count > 0;
                            
                            let corFundo = temaNoturno ? 'bg-transparent border border-white/[0.04]' : 'bg-transparent border border-black/[0.04]';
                            if (count > 0) corFundo = isPico ? 'bg-indigo-500' : (temaNoturno ? 'bg-indigo-500/40' : 'bg-indigo-500/20');

                            return (
                              <div key={dia} onMouseEnter={() => setHoverBox(`dia_${dia}`)} onMouseLeave={() => setHoverBox(null)} className="w-full h-7 sm:h-8 relative group">
                                <div className={`w-full h-full rounded-md flex items-center justify-center text-[10px] font-bold transition-all ${count > 0 ? 'hover:scale-105 z-10 cursor-pointer' : ''} ${corFundo} ${count > 0 ? (isPico ? 'text-white' : (temaNoturno ? 'text-indigo-100' : 'text-indigo-900')) : (temaNoturno ? 'text-zinc-600' : 'text-zinc-300')}`}>
                                  {dia}
                                </div>
                                {hoverBox === `dia_${dia}` && count > 0 && (
                                  <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 p-2 bg-zinc-800 text-white text-left rounded shadow-xl z-30 min-w-[100px] pointer-events-none">
                                    <div className="flex justify-between text-[9px] font-bold"><span>Visitas:</span><span className="text-indigo-400">{count}</span></div>
                                    <div className="flex justify-between text-[9px] font-bold"><span>Gasto:</span><span className="text-emerald-400">R${info.gasto.toFixed(0)}</span></div>
                                  </div>
                                )}
                              </div>
                            )
                         })}
                       </div>
                     </div>
                   )}

                   {/* Visão 24 Horas */}
                   {viewMapa === 'hora' && (
                     <div className="w-full h-full flex flex-col justify-end gap-1 pb-1">
                        <div className="flex-1 flex items-end justify-between gap-1 w-full">
                            {metricas.horasFrequencia.map((h, i) => {
                            const height = metricas.maxHoraRealCount === 0 ? 0 : (h.count / metricas.maxHoraRealCount) * 100;
                            const isPico = h.count === metricas.maxHoraRealCount && h.count > 0;
                            
                            return (
                                <div key={i} onMouseEnter={() => setHoverBox(`hora_${i}`)} onMouseLeave={() => setHoverBox(null)} className="flex flex-col items-center justify-end w-full h-full relative group cursor-pointer">
                                    {hoverBox === `hora_${i}` && h.count > 0 && (
                                        <div className="absolute bottom-full mb-1 px-2 py-1 bg-zinc-800 text-white text-[9px] font-bold rounded shadow-xl z-20 whitespace-nowrap">
                                        {h.count} v. ({i}h)
                                        </div>
                                    )}
                                    <div className={`w-full max-w-[20px] rounded-t-[3px] transition-all group-hover:opacity-80 ${isPico ? 'bg-amber-500' : (temaNoturno ? 'bg-white/10' : 'bg-black/10')}`} style={{ height: `${height}%`, minHeight: h.count > 0 ? '4px' : '0' }} />
                                </div>
                            )
                            })}
                        </div>
                        <div className="flex justify-between w-full border-t pt-1.5 opacity-50 px-0.5" style={{ borderColor: temaNoturno ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}}>
                            {metricas.horasFrequencia.map((_, i) => (
                                <span key={`lbl-${i}`} className={`text-[8px] font-bold w-full text-center ${textSecundario(temaNoturno)}`}>
                                    <span className="md:hidden">{i % 6 === 0 ? `${i}h` : ''}</span>
                                    <span className="hidden md:block lg:hidden">{i % 3 === 0 ? `${i}h` : ''}</span>
                                    <span className="hidden lg:block">{i % 2 === 0 ? `${i}h` : ''}</span>
                                </span>
                            ))}
                        </div>
                     </div>
                   )}
                </div>
             </div>

             {/* Ranking de Produtos (Direita - 5 colunas) */}
             <div className={`col-span-1 lg:col-span-5 p-5 rounded-[20px] border flex flex-col h-[280px] ${surfaceBase(temaNoturno)} ${bordaBase(temaNoturno)}`}>
                <div className="flex justify-between items-center mb-4 shrink-0">
                   <h3 className={`text-[11px] font-bold uppercase tracking-widest ${textSecundario(temaNoturno)}`}>Ranking de Produtos</h3>
                </div>
                
                <div className="flex-1 overflow-y-auto scrollbar-hide pr-1 space-y-3 relative">
                   {metricas.produtos.length === 0 ? (
                     <div className="absolute inset-0 flex items-center justify-center text-center opacity-30 text-[10px] font-bold uppercase">Sem Histórico</div>
                   ) : (
                     metricas.produtos.map((p, idx) => {
                       const barWidth = `${(p.qtd / metricas.maxProdutoQtd) * 100}%`;
                       const isTop1 = idx === 0;
                       
                       return (
                         <div key={idx} className="flex flex-col gap-1 w-full">
                           <div className="flex justify-between items-end gap-2 w-full">
                              <span className={`font-bold tracking-tight truncate flex-1 ${isTop1 ? `text-[13px] ${textPrincipal(temaNoturno)}` : `text-[11px] ${textSecundario(temaNoturno)}`}`}>
                                <span className={isTop1 ? (temaNoturno ? 'text-emerald-400 mr-1' : 'text-emerald-600 mr-1') : 'opacity-40 mr-1'}>{idx + 1}.</span> 
                                {p.nome}
                              </span>
                              <div className="flex items-baseline gap-1.5 shrink-0">
                                <span className={`font-black ${isTop1 ? `text-[13px] ${temaNoturno ? 'text-emerald-400' : 'text-emerald-600'}` : `text-[11px] ${textPrincipal(temaNoturno)}`}`}>{p.qtd}x</span>
                              </div>
                           </div>
                           <div className={`w-full rounded-full overflow-hidden ${isTop1 ? 'h-1.5' : 'h-1'} ${temaNoturno ? 'bg-white/5' : 'bg-black/5'}`}>
                              <div className={`h-full rounded-full ${isTop1 ? 'bg-emerald-500' : (temaNoturno ? 'bg-zinc-600' : 'bg-zinc-300')}`} style={{ width: barWidth }} />
                           </div>
                         </div>
                       );
                     })
                   )}
                </div>
             </div>

          </div>
        </div>
      </div>
    </div>
  );
};