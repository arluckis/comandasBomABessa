'use client';
import { useState, useEffect, useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip } from 'recharts';

export default function TabFaturamento({
  temaNoturno, filtroTempo, setFiltroTempo, getHoje, getMesAtual, getAnoAtual,
  faturamentoTotal, lucroEstimado, dadosPizza, rankingProdutos, comandasFiltradas, comandas
}) {

  const [mostrarMenuPersonalizar, setMostrarMenuPersonalizar] = useState(false);
  
  const [widgets, setWidgets] = useState({
    bruto: true, lucro: true, ticket: true, termometro: true, pagamentos: true, produtos: true, mapaCalor: true, combo: true 
  }); 

  useEffect(() => {
    const widgetsSalvos = localStorage.getItem('bessa_widgets_faturamento_v5');
    if (widgetsSalvos) setWidgets(JSON.parse(widgetsSalvos));
  }, []);

  const toggleWidget = (chave) => {
    const novosWidgets = { ...widgets, [chave]: !widgets[chave] };
    setWidgets(novosWidgets);
    localStorage.setItem('bessa_widgets_faturamento_v5', JSON.stringify(novosWidgets));
  };

  const mudarTempo = (direcao) => {
    if (filtroTempo.tipo === 'dia') {
      const [ano, mes, dia] = filtroTempo.valor.split('-').map(Number);
      const dataObj = new Date(ano, mes - 1, dia);
      dataObj.setDate(dataObj.getDate() + direcao);
      
      const anoNovo = dataObj.getFullYear();
      const mesNovo = String(dataObj.getMonth() + 1).padStart(2, '0');
      const diaNovo = String(dataObj.getDate()).padStart(2, '0');
      
      setFiltroTempo({ ...filtroTempo, valor: `${anoNovo}-${mesNovo}-${diaNovo}` });
      
    } else if (filtroTempo.tipo === 'mes') {
      const [ano, mes] = filtroTempo.valor.split('-').map(Number);
      const dataObj = new Date(ano, mes - 1, 1);
      dataObj.setMonth(dataObj.getMonth() + direcao);
      
      const anoNovo = dataObj.getFullYear();
      const mesNovo = String(dataObj.getMonth() + 1).padStart(2, '0');
      
      setFiltroTempo({ ...filtroTempo, valor: `${anoNovo}-${mesNovo}` });
    }
  };

  const podeAvancar = () => {
    if (filtroTempo.tipo === 'dia') return filtroTempo.valor < getHoje();
    if (filtroTempo.tipo === 'mes') return filtroTempo.valor < getMesAtual();
    return false; 
  };

  const totalComandas = comandasFiltradas.length;
  const ticketMedio = totalComandas > 0 ? (faturamentoTotal / totalComandas) : 0;
  
  const rankingMaiusculo = rankingProdutos.map(p => ({ 
    ...p, 
    nome: p.nome,
    custo: Math.max(0, p.valor - (p.lucro || 0)),
    lucro: p.lucro || 0
  }));

  const { diffAbsoluta, percentualReal, percentualBarra, bateuMeta, semHistorico, textoComparacao } = useMemo(() => {
    if (!comandas || comandas.length === 0) return { semHistorico: true };

    let pastStart = null;
    let pastEnd = null;
    let textoComp = "Vs. Passado";

    if (filtroTempo.tipo === 'dia') {
       let d = new Date(filtroTempo.valor + 'T12:00:00');
       d.setDate(d.getDate() - 7); 
       pastStart = d.toISOString().split('T')[0];
       pastEnd = pastStart;
       textoComp = "vs mesmo dia na semana passada";
    } else if (filtroTempo.tipo === '7 dias') {
       let end = new Date(getHoje() + 'T12:00:00');
       end.setDate(end.getDate() - 7);
       let start = new Date(end.getTime());
       start.setDate(start.getDate() - 6);
       pastStart = start.toISOString().split('T')[0];
       pastEnd = end.toISOString().split('T')[0];
       textoComp = "vs 7 dias anteriores";
    } else if (filtroTempo.tipo === 'mes') {
       const [ano, mes] = filtroTempo.valor.split('-');
       let prevMes = parseInt(mes) - 1; let prevAno = parseInt(ano);
       if (prevMes === 0) { prevMes = 12; prevAno--; }
       pastStart = `${prevAno}-${String(prevMes).padStart(2, '0')}-01`;
       pastEnd = `${prevAno}-${String(prevMes).padStart(2, '0')}-31`; 
       textoComp = "vs mês anterior";
    } else if (filtroTempo.tipo === 'ano') {
       pastStart = `${parseInt(filtroTempo.valor) - 1}-01-01`;
       pastEnd = `${parseInt(filtroTempo.valor) - 1}-12-31`;
       textoComp = "vs ano anterior";
    }  else if (filtroTempo.tipo === 'periodo') {
       if (!filtroTempo.inicio || !filtroTempo.fim) return { semHistorico: true };

       const start = new Date(filtroTempo.inicio + 'T12:00:00');
       const end = new Date(filtroTempo.fim + 'T12:00:00');
       const diffTime = Math.abs(end - start);
       const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
       
       let pEnd = new Date(start.getTime());
       pEnd.setDate(pEnd.getDate() - 1);
       let pStart = new Date(pEnd.getTime());
       pStart.setDate(pStart.getDate() - diffDays);
       
       pastStart = pStart.toISOString().split('T')[0];
       pastEnd = pEnd.toISOString().split('T')[0];
       textoComp = "vs período anterior equiv.";
    }

    const temDadosPassados = comandas.some(c => c.data >= pastStart && c.data <= pastEnd);
    
    if (!temDadosPassados || !pastStart) {
       return { semHistorico: true };
    }

    let somaPassada = 0;
    comandas.forEach(c => {
       if (c.data >= pastStart && c.data <= pastEnd) {
          somaPassada += (c.produtos || []).reduce((acc, p) => acc + p.preco, 0);
       }
    });

    const media = somaPassada; 
    const pctReal = media > 0 ? (faturamentoTotal / media) * 100 : (faturamentoTotal > 0 ? 100 : 0);
    const pctBarra = Math.min(pctReal, 100);
    const diferenca = faturamentoTotal - media;
    const bateu = faturamentoTotal >= media && faturamentoTotal > 0;

    return { mediaHistorica: media, diffAbsoluta: Math.abs(diferenca), percentualReal: pctReal, percentualBarra: pctBarra, bateuMeta: bateu, semHistorico: false, textoComparacao: textoComp };
  }, [comandas, filtroTempo.tipo, filtroTempo.valor, filtroTempo.inicio, filtroTempo.fim, getHoje, faturamentoTotal]);

  const { mapaCalor, maxCalor, topCombos } = useMemo(() => {
    const horasVisiveis = [17, 18, 19, 20, 21, 22, 23];
    const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    let matriz = Array(7).fill(0).map(() => Array(24).fill(0));
    let localMaxCalor = 0;
    const pares = {};

    comandas.forEach(c => {
      if (c.hora_abertura) {
        const dt = new Date(c.hora_abertura);
        const d = dt.getDay(); const h = dt.getHours();
        if (!isNaN(d) && !isNaN(h)) {
          matriz[d][h]++;
          if(matriz[d][h] > localMaxCalor) localMaxCalor = matriz[d][h];
        }
      }
    });

    comandasFiltradas.forEach(c => {
      if (c.produtos && c.produtos.length > 1 && c.produtos.length < 10) {
        const nomesUnicos = Array.from(new Set(c.produtos.map(p => p.nome.replace(/\s*\(\d+(?:\.\d+)?\s*g\)/i, '').trim())));
        for(let i = 0; i < nomesUnicos.length; i++) {
          for(let j = i + 1; j < nomesUnicos.length; j++) {
            const pair = [nomesUnicos[i], nomesUnicos[j]].sort().join(' + ');
            pares[pair] = (pares[pair] || 0) + 1;
          }
        }
      }
    });

    const combList = Object.entries(pares).map(([nome, qtd]) => ({ nome, qtd })).sort((a,b) => b.qtd - a.qtd).slice(0, 5);
    return { mapaCalor: { matriz, diasSemana, horasVisiveis }, maxCalor: localMaxCalor, topCombos: combList };
  }, [comandas, comandasFiltradas]);

  // -- CORES SEMÂNTICAS DO TERMÔMETRO --
  let statusPerformance = "";
  let corTextoPercentual = "";
  let corSombraPercentual = "";
  let corBadgeBg = "";
  let corBadgeTexto = "";
  let corBarraPremium = "";

  if (!semHistorico) {
    if (percentualReal === 0) {
      statusPerformance = "Aguardando volume";
      corTextoPercentual = temaNoturno ? "text-zinc-500" : "text-zinc-400";
      corBadgeBg = temaNoturno ? "bg-zinc-800/50 border-zinc-700/50" : "bg-zinc-100 border-zinc-200/50";
      corBadgeTexto = temaNoturno ? "text-zinc-400" : "text-zinc-500";
      corBarraPremium = temaNoturno ? "bg-zinc-800" : "bg-zinc-200";
    } else if (percentualReal < 50) {
      statusPerformance = "Abaixo da média";
      corTextoPercentual = "text-rose-500";
      corBadgeBg = temaNoturno ? "bg-rose-500/10 border-rose-500/20" : "bg-rose-50 border-rose-200";
      corBadgeTexto = "text-rose-600 dark:text-rose-400";
      corBarraPremium = "bg-gradient-to-r from-rose-600 to-rose-400";
      corSombraPercentual = temaNoturno ? "[text-shadow:_0_0_15px_rgba(244,63,94,0.3)]" : "";
    } else if (percentualReal < 100) {
      statusPerformance = "Em progresso";
      corTextoPercentual = "text-amber-500";
      corBadgeBg = temaNoturno ? "bg-amber-500/10 border-amber-500/20" : "bg-amber-50 border-amber-200";
      corBadgeTexto = "text-amber-600 dark:text-amber-400";
      corBarraPremium = "bg-gradient-to-r from-amber-600 to-amber-400";
      corSombraPercentual = temaNoturno ? "[text-shadow:_0_0_15px_rgba(245,158,11,0.3)]" : "";
    } else {
      statusPerformance = "Acima da média";
      corTextoPercentual = "text-emerald-500";
      corBadgeBg = temaNoturno ? "bg-emerald-500/10 border-emerald-500/20" : "bg-emerald-50 border-emerald-200";
      corBadgeTexto = "text-emerald-600 dark:text-emerald-400";
      corBarraPremium = "bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]";
      corSombraPercentual = temaNoturno ? "[text-shadow:_0_0_15px_rgba(16,185,129,0.4)]" : "";
    }
  }

  // -- FUNÇÕES DE CORES PARA PAGAMENTOS E HEATMAP --
  const getCorPagamento = (nome) => {
    const n = nome.toLowerCase();
    if (n.includes('pix')) return 'bg-emerald-500';
    if (n.includes('crédito') || n.includes('credito')) return 'bg-blue-500';
    if (n.includes('débito') || n.includes('debito')) return 'bg-purple-500';
    if (n.includes('dinheiro')) return 'bg-amber-500';
    return temaNoturno ? 'bg-zinc-500' : 'bg-zinc-400';
  };

  const getHeatmapColor = (intensidade, temaEscuro) => {
    if (intensidade === 0) return temaEscuro ? '#18181b' : '#f4f4f5'; // zinc-900 / zinc-100
    // RGB Interpolation: Slate-600 -> Yellow-500 -> Red-500
    let r, g, b;
    if (intensidade < 0.5) {
        const pct = intensidade / 0.5;
        r = Math.round(71 + (234 - 71) * pct);
        g = Math.round(85 + (179 - 85) * pct);
        b = Math.round(105 + (8 - 105) * pct);
    } else {
        const pct = (intensidade - 0.5) / 0.5;
        r = Math.round(234 + (239 - 234) * pct);
        g = Math.round(179 + (68 - 179) * pct);
        b = Math.round(8 + (68 - 8) * pct);
    }
    return `rgb(${r}, ${g}, ${b})`;
  };

  const numCardsResumo = [widgets.bruto, widgets.lucro, widgets.ticket].filter(Boolean).length;
  const totalPagamentos = dadosPizza.reduce((acc, item) => acc + item.value, 0);

  return (
    <div className="max-w-7xl mx-auto w-full animate-in fade-in duration-300 pb-10 mt-6">
      
      {/* CONTROLES DE FILTRO E PERSONALIZAÇÃO */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full mb-8 px-2 md:px-0">
         <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            {/* Segmented Control Filtro Tempo */}
            <div className={`flex p-1 rounded-lg border shadow-sm ${temaNoturno ? 'bg-[#161a20] border-white/[0.05]' : 'bg-zinc-50/80 border-zinc-200/80'}`}>
              {['dia', '7 dias', 'mes', 'ano', 'periodo'].map(t => (
                 <button key={t} onClick={() => setFiltroTempo({...filtroTempo, tipo: t, valor: t==='dia'||t==='7 dias'?getHoje():t==='mes'?getMesAtual():getAnoAtual()})} 
                 className={`flex-1 px-4 py-1.5 rounded-md text-xs font-medium capitalize transition-all duration-200 ${filtroTempo.tipo === t ? (temaNoturno ? 'bg-zinc-800 text-white shadow-sm' : 'bg-white text-zinc-900 shadow-sm border border-zinc-200/50') : (temaNoturno ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100')}`}>
                   {t}
                 </button>
              ))}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {(filtroTempo.tipo === 'dia' || filtroTempo.tipo === 'mes') && (
                <>
                  <button onClick={() => mudarTempo(-1)} className={`p-2 rounded-lg border transition-all hover:-translate-y-[1px] shadow-sm ${temaNoturno ? 'bg-[#161a20] border-white/[0.05] hover:bg-zinc-800 text-zinc-400' : 'bg-white border-zinc-200/80 hover:bg-zinc-50 text-zinc-500'}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                  </button>
                  <input 
                    type={filtroTempo.tipo === 'dia' ? 'date' : 'month'} 
                    value={filtroTempo.valor} 
                    max={filtroTempo.tipo === 'dia' ? getHoje() : getMesAtual()}
                    onChange={e => setFiltroTempo({...filtroTempo, valor: e.target.value})} 
                    className={`w-full md:w-36 px-3 py-1.5 text-center border rounded-lg outline-none text-sm font-medium transition-all shadow-sm focus:border-zinc-400 ${temaNoturno ? 'bg-[#161a20] border-white/[0.05] text-zinc-100 [color-scheme:dark]' : 'bg-white border-zinc-200/80 text-zinc-900'}`} 
                  />
                  {podeAvancar() ? (
                    <button onClick={() => mudarTempo(1)} className={`p-2 rounded-lg border transition-all hover:-translate-y-[1px] shadow-sm ${temaNoturno ? 'bg-[#161a20] border-white/[0.05] hover:bg-zinc-800 text-zinc-400' : 'bg-white border-zinc-200/80 hover:bg-zinc-50 text-zinc-500'}`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                    </button>
                  ) : (
                    <div className="w-[34px]"></div>
                  )}
                </>
              )}
              {filtroTempo.tipo === 'ano' && (
                <input type="number" value={filtroTempo.valor} onChange={e => setFiltroTempo({...filtroTempo, valor: e.target.value})} className={`w-full md:w-28 px-3 py-1.5 text-center border rounded-lg outline-none text-sm font-medium transition-colors shadow-sm focus:border-zinc-400 ${temaNoturno ? 'bg-[#161a20] border-white/[0.05] text-zinc-100 [color-scheme:dark]' : 'bg-white border-zinc-200/80 text-zinc-900'}`} />
              )}
              {filtroTempo.tipo === 'periodo' && (
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border shadow-sm ${temaNoturno ? 'bg-[#161a20] border-white/[0.05]' : 'bg-white border-zinc-200/80'}`}>
                  <input type="date" value={filtroTempo.inicio} onChange={e => setFiltroTempo({...filtroTempo, inicio: e.target.value})} className={`bg-transparent outline-none text-sm font-medium w-full ${temaNoturno ? 'text-zinc-100 [color-scheme:dark]' : 'text-zinc-900'}`} />
                  <span className={`text-xs text-zinc-400`}>até</span>
                  <input type="date" value={filtroTempo.fim} onChange={e => setFiltroTempo({...filtroTempo, fim: e.target.value})} className={`bg-transparent outline-none text-sm font-medium w-full ${temaNoturno ? 'text-zinc-100 [color-scheme:dark]' : 'text-zinc-900'}`} />
                </div>
              )}
            </div>
         </div>

         <button 
            onClick={() => setMostrarMenuPersonalizar(!mostrarMenuPersonalizar)} 
            className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all hover:-translate-y-[1px] shadow-sm flex items-center gap-2 ${temaNoturno ? (mostrarMenuPersonalizar ? 'bg-zinc-100 text-zinc-900 border-transparent' : 'bg-[#161a20] border-white/[0.05] hover:bg-zinc-800 text-zinc-300') : (mostrarMenuPersonalizar ? 'bg-zinc-900 text-white border-transparent' : 'bg-white border-zinc-200/80 hover:bg-zinc-50 text-zinc-700')}`}
          >
            <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
            Personalizar
          </button>
      </div>

      {mostrarMenuPersonalizar && (
        <div className={`p-4 rounded-xl border mb-6 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 animate-in fade-in slide-in-from-top-2 duration-200 shadow-sm px-2 md:px-0 mx-2 md:mx-0 ${temaNoturno ? 'bg-[#161a20] border-white/[0.05]' : 'bg-white border-zinc-200/80'}`}>
          {[
            { id: 'bruto', label: 'Fat. Bruto' }, { id: 'lucro', label: 'Lucro Bruto' }, { id: 'ticket', label: 'Ticket Médio' }, { id: 'termometro', label: 'Termômetro' }, 
            { id: 'pagamentos', label: 'Pagamentos' }, { id: 'produtos', label: 'Rentabilidade' }, { id: 'mapaCalor', label: 'Mapa Calor' }, { id: 'combo', label: 'Cesta Média' }
          ].map(item => (
            <label key={item.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all select-none active:scale-[0.98] ${widgets[item.id] ? (temaNoturno ? 'bg-zinc-800 border-zinc-700 text-zinc-100' : 'bg-zinc-100 border-zinc-200 text-zinc-900') : (temaNoturno ? 'bg-[#161a20] border-transparent hover:bg-zinc-800/50 text-zinc-500' : 'bg-white border-transparent hover:bg-zinc-50 text-zinc-500')}`}>
              <input type="checkbox" checked={widgets[item.id]} onChange={() => toggleWidget(item.id)} className="hidden" />
              <div className={`w-3.5 h-3.5 rounded flex-shrink-0 border flex items-center justify-center transition-colors ${widgets[item.id] ? (temaNoturno ? 'bg-zinc-100 border-zinc-100' : 'bg-zinc-900 border-zinc-900') : (temaNoturno ? 'border-zinc-700 bg-transparent' : 'border-zinc-300 bg-transparent')}`}>
                {widgets[item.id] && <svg className={`w-2.5 h-2.5 ${temaNoturno ? 'text-zinc-900' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
              </div>
              <span className="text-xs font-medium">{item.label}</span>
            </label>
          ))}
        </div>
      )}

      {/* ÁREA DE MÉTRICAS */}
      <div className="flex flex-col w-full min-w-0 gap-6 px-2 md:px-0">
        
        {/* LINHA 1 */}
        {numCardsResumo > 0 && (
          <div className={`grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6`}>
            {widgets.bruto && (
              <div className={`p-6 rounded-2xl border transition-all duration-300 hover:-translate-y-[2px] shadow-sm hover:shadow-md ${temaNoturno ? 'bg-[#161a20] border-white/[0.05]' : 'bg-white border-zinc-200/80'}`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${temaNoturno ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-blue-50 border-blue-100 text-blue-600'}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  </div>
                  <h3 className={`text-xs font-medium ${temaNoturno ? 'text-zinc-400' : 'text-zinc-500'}`}>Faturamento Bruto</h3>
                </div>
                <p className={`text-3xl font-semibold tracking-tight ${temaNoturno ? 'text-zinc-100' : 'text-zinc-900'}`}>R$ {faturamentoTotal.toFixed(2)}</p>
              </div>
            )}
            {widgets.lucro && (
              <div className={`p-6 rounded-2xl border transition-all duration-300 hover:-translate-y-[2px] shadow-sm hover:shadow-md ${temaNoturno ? 'bg-[#161a20] border-white/[0.05]' : 'bg-white border-zinc-200/80'}`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${temaNoturno ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                  </div>
                  <h3 className={`text-xs font-medium ${temaNoturno ? 'text-zinc-400' : 'text-zinc-500'}`}>Lucro Estimado</h3>
                </div>
                <p className={`text-3xl font-semibold tracking-tight ${temaNoturno ? 'text-zinc-100' : 'text-zinc-900'}`}>R$ {lucroEstimado.toFixed(2)}</p>
              </div>
            )}
            {widgets.ticket && (
              <div className={`p-6 rounded-2xl border transition-all duration-300 hover:-translate-y-[2px] shadow-sm hover:shadow-md ${temaNoturno ? 'bg-[#161a20] border-white/[0.05]' : 'bg-white border-zinc-200/80'}`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${temaNoturno ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' : 'bg-purple-50 border-purple-100 text-purple-600'}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"></path></svg>
                  </div>
                  <h3 className={`text-xs font-medium ${temaNoturno ? 'text-zinc-400' : 'text-zinc-500'}`}>Ticket Médio</h3>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className={`text-3xl font-semibold tracking-tight ${temaNoturno ? 'text-zinc-100' : 'text-zinc-900'}`}>R$ {ticketMedio.toFixed(2)}</p>
                  <p className={`text-xs font-medium ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}`}>/ {totalComandas} cmd</p>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* LINHA 2: Termômetro, Pagamentos e Mapa de Calor */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          
          {widgets.termometro && (
            <div className={`p-6 md:p-8 rounded-2xl border flex flex-col justify-between min-h-[260px] transition-all duration-300 hover:-translate-y-[2px] shadow-sm hover:shadow-md ${temaNoturno ? 'bg-[#161a20] border-white/[0.05]' : 'bg-white border-zinc-200/80'}`}>
              <h3 className={`text-xs font-semibold flex items-center gap-2 ${temaNoturno ? 'text-zinc-100' : 'text-zinc-900'}`}>
                Performance Relativa
              </h3>
              
              {semHistorico ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <p className={`text-xs font-medium ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}`}>Sem base de comparação</p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col justify-center mt-4">
                   <div className="flex items-end gap-3 mb-3">
                     <span className={`text-5xl font-semibold tracking-tight ${corTextoPercentual} ${corSombraPercentual}`}>
                        {percentualReal.toFixed(0)}%
                     </span>
                     <span className={`text-xs font-medium pb-1.5 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}`}>{textoComparacao}</span>
                   </div>
                   
                   <div className={`w-full h-2 rounded-full overflow-hidden mb-6 ${temaNoturno ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
                      <div className={`h-full rounded-full transition-all duration-700 ${corBarraPremium}`} style={{ width: `${percentualBarra}%` }}></div>
                   </div>
                   
                   <div className="flex justify-between items-center">
                      <div className="flex flex-col items-start">
                          <span className={`text-[10px] font-medium uppercase tracking-wider mb-1 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}`}>Status</span>
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-md border ${corBadgeBg} ${corBadgeTexto}`}>
                            {statusPerformance}
                          </span>
                      </div>
                      <div className="flex flex-col items-end">
                          <span className={`text-[10px] font-medium uppercase tracking-wider mb-1 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}`}>Diferença</span>
                          <span className={`text-sm font-semibold flex items-center gap-1 ${bateuMeta ? 'text-emerald-500' : 'text-rose-500'}`}>
                              {bateuMeta ? <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg> : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>}
                              R$ {diffAbsoluta.toFixed(2)}
                          </span>
                      </div>
                   </div>
                </div>
              )}
            </div>
          )}

          {widgets.pagamentos && (
            <div className={`p-6 md:p-8 rounded-2xl border flex flex-col min-h-[260px] transition-all duration-300 hover:-translate-y-[2px] shadow-sm hover:shadow-md ${temaNoturno ? 'bg-[#161a20] border-white/[0.05]' : 'bg-white border-zinc-200/80'}`}>
              <h3 className={`text-xs font-semibold mb-6 flex items-center gap-2 ${temaNoturno ? 'text-zinc-100' : 'text-zinc-900'}`}>
                Tipos de Pagamento
              </h3>
              
              {dadosPizza.length > 0 ? (
                <div className="flex-1 w-full overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-4">
                  {dadosPizza.sort((a,b) => b.value - a.value).map((item, idx) => {
                    const percent = ((item.value / totalPagamentos) * 100).toFixed(1);
                    const colorClass = getCorPagamento(item.name);
                    return (
                      <div key={idx} className="flex flex-col group cursor-default">
                        <div className="flex justify-between items-end mb-2">
                          <span className={`text-sm font-medium truncate max-w-[120px] transition-colors ${temaNoturno ? 'text-zinc-300 group-hover:text-white' : 'text-zinc-700 group-hover:text-zinc-900'}`} title={item.name}>
                            {item.name}
                          </span>
                          <div className="flex items-center gap-2 shrink-0">
                             <span className={`text-sm font-semibold transition-colors ${temaNoturno ? 'text-zinc-100' : 'text-zinc-900'}`}>R$ {item.value.toFixed(0)}</span>
                             <span className={`text-xs font-medium ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}`}>({percent}%)</span>
                          </div>
                        </div>
                        <div className={`w-full h-1.5 rounded-full overflow-hidden ${temaNoturno ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
                          <div className={`h-full rounded-full transition-all duration-700 ${colorClass} opacity-80 group-hover:opacity-100`} style={{ width: `${percent}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className={`flex-1 flex items-center justify-center text-xs font-medium ${temaNoturno ? 'text-zinc-600' : 'text-zinc-400'}`}>Sem recebimentos</div>
              )}
            </div>
          )}

         {widgets.mapaCalor && (
            <div className={`p-6 md:p-8 rounded-2xl border flex flex-col min-h-[260px] overflow-hidden transition-all duration-300 hover:-translate-y-[2px] shadow-sm hover:shadow-md ${temaNoturno ? 'bg-[#161a20] border-white/[0.05]' : 'bg-white border-zinc-200/80'}`}>
              <h3 className={`text-xs font-semibold mb-6 flex items-center gap-2 shrink-0 ${temaNoturno ? 'text-zinc-100' : 'text-zinc-900'}`}>
                Picos de Venda
              </h3>
              {maxCalor > 0 ? (
                <div className="flex-1 w-full overflow-x-auto custom-scrollbar flex flex-col justify-center">
                  <div className="min-w-[260px] mx-auto">
                    <div className="grid grid-cols-8 gap-1.5 mb-2 text-xs font-medium text-center text-zinc-400">
                      <div></div>
                      {mapaCalor.horasVisiveis.map(h => <div key={h}>{h}h</div>)}
                    </div>
                    {mapaCalor.diasSemana.map((dia, idx) => (
                      <div key={dia} className="grid grid-cols-8 gap-1.5 mb-1.5 items-center">
                        <div className={`flex items-center text-xs font-medium ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}`}>{dia}</div>
                        {mapaCalor.horasVisiveis.map(h => {
                          const qtd = mapaCalor.matriz[idx][h];
                          const intensidade = qtd === 0 ? 0 : Math.max(0.1, qtd / maxCalor);
                          return (
                            <div 
                              key={`${dia}-${h}`} title={`${qtd} comandas às ${h}h`}
                              className={`h-6 rounded-md transition-all cursor-crosshair border border-transparent hover:border-zinc-400 dark:hover:border-zinc-500 hover:scale-[1.05]`}
                              style={{ backgroundColor: getHeatmapColor(intensidade, temaNoturno) }}
                            ></div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              ) : <div className={`flex-1 flex items-center justify-center text-xs font-medium ${temaNoturno ? 'text-zinc-600' : 'text-zinc-400'}`}>Dados insuficientes</div>}
            </div>
          )}

        </div>

        {/* LINHA 3: Produtos Rentáveis e Análise de Cesta */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-4">
          
          {widgets.produtos && (
            <div className={`lg:col-span-2 p-6 md:p-8 rounded-2xl border flex flex-col min-h-[320px] relative transition-all duration-300 hover:-translate-y-[2px] shadow-sm hover:shadow-md ${temaNoturno ? 'bg-[#161a20] border-white/[0.05]' : 'bg-white border-zinc-200/80'}`}>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
                <h3 className={`text-xs font-semibold flex items-center gap-2 ${temaNoturno ? 'text-zinc-100' : 'text-zinc-900'}`}>
                  Rentabilidade
                </h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span><span className={`text-xs font-medium ${temaNoturno ? 'text-zinc-400' : 'text-zinc-500'}`}>Lucro</span></div>
                  <div className="flex items-center gap-1.5"><span className={`w-2.5 h-2.5 rounded-sm ${temaNoturno ? 'bg-zinc-800' : 'bg-zinc-100 border border-zinc-200'}`}></span><span className={`text-xs font-medium ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}`}>Custo</span></div>
                </div>
              </div>
              
              {rankingMaiusculo.length > 0 ? (
                <div className="flex-1 w-full overflow-y-auto pr-2 custom-scrollbar relative">
                  <div style={{ height: Math.max(220, rankingMaiusculo.length * 40) }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={rankingMaiusculo} layout="vertical" margin={{ top: 0, right: 20, left: -20, bottom: 0 }}>
                        <XAxis type="number" hide />
                        <YAxis dataKey="nome" type="category" axisLine={false} tickLine={false} tick={{fill: temaNoturno ? '#a1a1aa' : '#71717a', fontSize: 11, fontWeight: '500'}} width={140} />
                        <RechartsTooltip 
                          allowEscapeViewBox={{ x: false, y: true }}
                          wrapperStyle={{ zIndex: 1000, outline: 'none' }}
                          cursor={{fill: temaNoturno ? '#27272a50' : '#f4f4f580', radius: 8}} 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className={`p-5 shadow-2xl rounded-xl border backdrop-blur-md ${temaNoturno ? 'bg-[#161a20]/90 border-white/[0.05]' : 'bg-white/90 border-zinc-200/80'}`}>
                                  <p className={`text-xs font-semibold mb-4 border-b pb-2 ${temaNoturno ? 'text-zinc-100 border-zinc-800' : 'text-zinc-900 border-zinc-100'}`}>{data.nome}</p>
                                  <p className="text-xs font-medium flex justify-between gap-8 mb-2">
                                    <span className={temaNoturno ? 'text-zinc-400' : 'text-zinc-500'}>Lucro:</span> 
                                    <span className="font-semibold text-emerald-600 dark:text-emerald-500 tracking-tight">R$ {data.lucro.toFixed(2)}</span>
                                  </p>
                                  <p className="text-xs font-medium flex justify-between gap-8 mb-4">
                                    <span className={temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}>Custo:</span> 
                                    <span className={`font-semibold tracking-tight ${temaNoturno ? 'text-zinc-300' : 'text-zinc-600'}`}>R$ {data.custo.toFixed(2)}</span>
                                  </p>
                                  <p className={`text-xs font-medium pt-3 flex justify-between gap-8 border-t ${temaNoturno ? 'text-zinc-300 border-zinc-800' : 'text-zinc-700 border-zinc-100'}`}>
                                    <span>Receita:</span> 
                                    <span className="font-semibold tracking-tight">R$ {data.valor.toFixed(2)}</span>
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="custo" stackId="a" fill={temaNoturno ? '#27272a' : '#f4f4f5'} radius={[0, 0, 0, 0]} barSize={16} className="transition-all duration-300 hover:brightness-110" />
                        <Bar dataKey="lucro" stackId="a" fill="#10b981" radius={[0, 4, 4, 0]} barSize={16} className="transition-all duration-300 hover:brightness-110" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <div className={`flex-1 flex items-center justify-center text-xs font-medium ${temaNoturno ? 'text-zinc-600' : 'text-zinc-400'}`}>Sem vendas no período</div>
              )}
            </div>
          )}

          {widgets.combo && (
            <div className={`p-6 md:p-8 rounded-2xl border flex flex-col min-h-[320px] transition-all duration-300 hover:-translate-y-[2px] shadow-sm hover:shadow-md ${temaNoturno ? 'bg-[#161a20] border-white/[0.05]' : 'bg-white border-zinc-200/80'}`}>
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-6">
                <h3 className={`text-xs font-semibold flex items-center gap-2 ${temaNoturno ? 'text-zinc-100' : 'text-zinc-900'}`}>
                  Cesta Média
                </h3>
              </div>
              
              {topCombos.length > 0 ? (
                <div className="flex-1 w-full overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-3">
                  {topCombos.map((combo, idx) => {
                    const [p1, p2] = combo.nome.split(' + ');
                    return (
                      <div key={idx} className={`p-4 rounded-xl border flex items-center justify-between transition-all duration-300 hover:scale-[1.01] hover:-translate-y-[1px] hover:shadow-sm cursor-default ${temaNoturno ? 'bg-[#161a20] border-white/[0.05] hover:border-zinc-700' : 'bg-zinc-50/50 border-zinc-200/80 hover:bg-white hover:border-zinc-300'}`}>
                        <div className="flex flex-col gap-1 w-full pr-3">
                          <span className={`text-sm font-medium line-clamp-1 ${temaNoturno ? 'text-zinc-200' : 'text-zinc-800'}`} title={p1}>{p1}</span>
                          <span className={`text-xs font-medium flex items-center gap-1.5 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>
                            <span className="text-zinc-400">+</span>
                            <span className="line-clamp-1" title={p2}>{p2}</span>
                          </span>
                        </div>
                        <div className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-lg border shadow-sm transition-colors ${temaNoturno ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' : 'bg-purple-50 border-purple-100 text-purple-600'}`}>
                          <span className="text-sm font-semibold">{combo.qtd}x</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : <div className={`flex-1 flex items-center justify-center text-xs font-medium text-center px-6 ${temaNoturno ? 'text-zinc-600' : 'text-zinc-400'}`}>Incentive vendas combinadas para obter análise.</div>}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}