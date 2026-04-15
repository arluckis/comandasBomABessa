'use client';
import { motion } from 'framer-motion';
import { ResponsiveContainer, BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip } from 'recharts';
import { Activity, TrendingUp, DollarSign, Clock, BarChart2, Zap } from 'lucide-react';

const cardSurface = (tema) => tema ? 'bg-[#0A0A0A]/80 backdrop-blur-xl border border-white/[0.04] shadow-lg' : 'bg-white/80 backdrop-blur-xl border border-black/[0.04] shadow-sm';
const labelArox = (tema) => `text-[10px] font-bold uppercase tracking-widest ${tema ? 'text-zinc-500' : 'text-zinc-500'}`;

export const WidgetTermometro = ({ temaNoturno, semHistorico, fTipo, fatTotalSafe, fValor, strHoje, diferenca, percentualReal, percentualBarra, bateuMeta, diffAbsoluta }) => {
  
  // === AQUI ESTÁ O ERRO INJETADO ===

  return (
    <div className={`flex flex-col justify-between p-6 rounded-[24px] transition-all hover:shadow-md h-full min-h-[200px] w-full ${cardSurface(temaNoturno)}`}>
      <div><h3 className={`flex items-center gap-2 mb-1 ${labelArox(temaNoturno)}`}><Activity className="w-3.5 h-3.5" /> Performance vs Histórico</h3><p className={`text-[11px] opacity-70 ${temaNoturno ? 'text-zinc-400' : 'text-zinc-500'}`}>Comparado à média anterior</p></div>
      {semHistorico || (fTipo === 'dia' && fatTotalSafe === 0 && fValor === strHoje) ? (
        <div className="flex-1 flex flex-col items-center justify-center mt-4"><p className={`text-[13px] font-medium ${temaNoturno ? 'text-zinc-600' : 'text-zinc-400'}`}>Sem base de comparação</p></div>
      ) : (
        <div className="mt-2 flex flex-col flex-1 justify-end w-full">
           <div className="flex items-baseline gap-2 mb-3"><span className={`text-4xl font-bold tracking-tight tabular-nums ${diferenca >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{(percentualReal || 0).toFixed(0)}<span className="text-2xl opacity-50 ml-1">%</span></span></div>
           <div className={`w-full h-1.5 rounded-full overflow-hidden mb-4 ${temaNoturno ? 'bg-white/10' : 'bg-black/10'}`}><motion.div initial={{ width: 0 }} animate={{ width: `${percentualBarra || 0}%` }} transition={{ duration: 1, ease: "easeOut" }} className={`h-full rounded-full ${diferenca >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} /></div>
           <div className={`flex justify-between items-end border-t pt-4 w-full ${temaNoturno ? 'border-white/5' : 'border-black/5'}`}>
              <div className="flex flex-col gap-1 w-full"><span className={`text-[9px] font-bold uppercase tracking-widest ${temaNoturno ? 'text-zinc-600' : 'text-zinc-400'}`}>Delta (Histórico)</span><span className={`text-[14px] font-bold tabular-nums ${bateuMeta ? 'text-emerald-500' : 'text-rose-500'}`}>{bateuMeta ? '+' : '-'} R$ {(diffAbsoluta || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span></div>
           </div>
        </div>
      )}
    </div>
  );
};

export const WidgetLinhaTemporal = ({ temaNoturno, dadosGraficoAcumulado }) => (
  <div className={`flex flex-col justify-between p-6 rounded-[24px] transition-all hover:shadow-md h-full min-h-[200px] w-full relative overflow-hidden group ${cardSurface(temaNoturno)}`}>
    <div className={`absolute -top-32 -right-32 w-64 h-64 rounded-full blur-[80px] opacity-0 group-hover:opacity-40 transition-opacity duration-1000 pointer-events-none ${temaNoturno ? 'bg-emerald-500/20' : 'bg-emerald-500/10'}`}></div>
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 relative z-10 w-full">
      <div><h3 className={`flex items-center gap-2 mb-1 ${labelArox(temaNoturno)}`}><TrendingUp className="w-3.5 h-3.5" /> Linha Temporal de Receita</h3></div>
      <div className="flex items-center gap-4 mt-1 sm:mt-0">
        <div className="flex items-center gap-1.5"><div className={`w-2 h-2 rounded-full ${temaNoturno ? 'bg-[#34d399]' : 'bg-[#059669]'}`}></div><span className={`text-[10px] font-bold uppercase ${temaNoturno ? 'text-zinc-400' : 'text-zinc-500'}`}>Hoje</span></div>
        <div className="flex items-center gap-1.5"><div className={`w-2 h-2 rounded-full ${temaNoturno ? 'bg-[#064e3b]' : 'bg-[#a7f3d0]'}`}></div><span className={`text-[10px] font-bold uppercase ${temaNoturno ? 'text-zinc-400' : 'text-zinc-500'}`}>Média</span></div>
      </div>
    </div>
    {dadosGraficoAcumulado.length > 0 ? (
      <div className="w-full h-[140px] min-h-[140px] mt-4 -ml-4 relative z-10 overflow-hidden">
        <ResponsiveContainer width="100%" height="100%" minHeight={140} debounce={50}>
          <AreaChart data={dadosGraficoAcumulado} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs><linearGradient id="colorAtual" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={temaNoturno ? '#34d399' : '#059669'} stopOpacity={0.4}/><stop offset="95%" stopColor={temaNoturno ? '#34d399' : '#059669'} stopOpacity={0}/></linearGradient></defs>
            <XAxis dataKey="hora" tick={{fontSize: 10, fontWeight: 700, fill: temaNoturno ? '#71717a' : '#a1a1aa'}} axisLine={false} tickLine={false} />
            <RechartsTooltip cursor={{ stroke: temaNoturno ? '#3f3f46' : '#e4e4e7', strokeDasharray: '4 4' }} content={({ active, payload }) => {
                if (active && payload && payload.length) {
                    const valAtual = payload.find(p => p.dataKey === 'atual'); const valPassado = payload.find(p => p.dataKey === 'passado');
                    const temAtual = valAtual && valAtual.value !== null; const passadoV = valPassado?.value || 0; const atualV = temAtual ? valAtual.value : 0;
                    return (
                        <div className={`p-4 rounded-[16px] border shadow-xl text-xs backdrop-blur-xl min-w-[200px] ${temaNoturno ? 'bg-zinc-900/80 border-white/10 shadow-black/50' : 'bg-white/80 border-black/10 shadow-zinc-200/50'}`}>
                            <div className="flex justify-between items-center mb-3 pb-2 border-b border-zinc-500/20"><p className={`font-bold ${temaNoturno ? 'text-zinc-100' : 'text-zinc-800'}`}>{payload[0].payload.hora}</p></div>
                            <div className="flex flex-col gap-3">
                              {temAtual ? <div className="flex justify-between items-center gap-4"><span className="font-bold text-[11px] text-zinc-500">Hoje</span><span className="font-bold">R$ {atualV.toFixed(2)}</span></div> : <p className="text-[10px] text-zinc-500 italic pb-1">Sem volume.</p>}
                              <div className="flex justify-between items-center gap-4"><span className="font-bold text-[11px] text-zinc-500">Média Hist.</span><span className="font-bold">R$ {passadoV.toFixed(2)}</span></div>
                            </div>
                        </div>
                    );
                } return null;
            }} />
            <Area type="monotone" dataKey="passado" stroke={temaNoturno ? '#064e3b' : '#a7f3d0'} fill="none" strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="atual" stroke={temaNoturno ? '#34d399' : '#059669'} fill="url(#colorAtual)" strokeWidth={3.5} dot={false} isAnimationActive={true} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    ) : (<div className="flex-1 flex flex-col items-center justify-center w-full"><p className={`text-[13px] font-medium ${temaNoturno ? 'text-zinc-600' : 'text-zinc-400'}`}>Aguardando volume</p></div>)}
  </div>
);

export const WidgetPagamentos = ({ temaNoturno, dadosPizza }) => {
  const getCor = (n) => { const x = (n||'').toLowerCase(); if(x.includes('pix')) return temaNoturno?'#34d399':'#10b981'; if(x.includes('crédito')||x.includes('credito')) return temaNoturno?'#60a5fa':'#3b82f6'; if(x.includes('débito')||x.includes('debito')) return temaNoturno?'#c084fc':'#a855f7'; if(x.includes('dinheiro')) return temaNoturno?'#fbbf24':'#f59e0b'; return temaNoturno?'#71717a':'#a1a1aa'; };
  const total = (dadosPizza || []).reduce((a, b) => a + (b?.value || 0), 0);
  return (
    <div className={`flex flex-col p-6 rounded-[24px] transition-all hover:shadow-md h-full min-h-[180px] w-full ${cardSurface(temaNoturno)}`}>
      <h3 className={`flex items-center gap-2 mb-4 ${labelArox(temaNoturno)}`}><DollarSign className="w-3.5 h-3.5" /> Pagamentos</h3>
      {dadosPizza && dadosPizza.length > 0 ? (
        <div className="flex-1 flex flex-col justify-center gap-4 w-full">
          {[...dadosPizza].sort((a,b) => (b?.value || 0) - (a?.value || 0)).map((item, idx) => {
            const pct = total > 0 ? (((item?.value||0) / total) * 100).toFixed(1) : "0.0";
            return (
              <div key={idx} className="flex flex-col w-full">
                <div className="flex justify-between items-end mb-1 pr-4 w-full"><span className="text-[13px] font-bold">{item?.name || 'Outros'}</span><div className="flex items-baseline gap-2"><span className="text-[13px] font-bold">R$ {(item?.value||0).toLocaleString('pt-BR')}</span><span className="text-[11px] w-8 text-right opacity-50">{pct}%</span></div></div>
                <div className={`w-full h-1.5 rounded-full overflow-hidden ${temaNoturno ? 'bg-white/10' : 'bg-black/10'}`}><motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} className="h-full rounded-full" style={{ backgroundColor: getCor(item?.name) }} /></div>
              </div>
            );
          })}
        </div>
      ) : (<div className="flex-1 flex items-center justify-center"><p className={`text-[13px] font-medium ${temaNoturno ? 'text-zinc-600' : 'text-zinc-400'}`}>Sem transações</p></div>)}
    </div>
  );
};

export const WidgetMapaCalor = ({ temaNoturno, maxCalor, mapaCalor }) => {
  const getHC = (i) => { if(!i) return temaNoturno?'#18181b':'#fafafa'; const o = Math.min(1, 0.2 + (i * 0.8)); return temaNoturno ? `rgba(250, 250, 250, ${o})` : `rgba(24, 24, 27, ${o})`; };
  return (
    <div className={`flex flex-col p-6 rounded-[24px] transition-all hover:shadow-md h-full min-h-[200px] w-full ${cardSurface(temaNoturno)}`}>
      <h3 className={`flex items-center gap-2 mb-4 ${labelArox(temaNoturno)}`}><Clock className="w-3.5 h-3.5" /> Densidade Operacional</h3>
      {maxCalor > 0 && mapaCalor?.horasVisiveis ? (
        <div className="flex-1 w-full flex flex-col justify-center">
          <div className="w-full">
            <div className="grid grid-cols-8 gap-1 mb-2 text-[9px] font-bold uppercase tracking-wider text-center text-zinc-400 pr-2"><div></div>{mapaCalor.horasVisiveis.map(h => <div key={h}>{h}h</div>)}</div>
            {mapaCalor.diasSemana.map((dia, idx) => (
              <div key={dia} className="grid grid-cols-8 gap-1 mb-1 items-center pr-2">
                <div className={`text-[9px] font-bold uppercase tracking-wider ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}`}>{dia}</div>
                {mapaCalor.horasVisiveis.map(h => {
                  const qtd = mapaCalor?.matriz?.[idx]?.[h] || 0; const i = qtd === 0 ? 0 : Math.max(0.1, qtd / (maxCalor || 1));
                  return (<motion.div key={`${dia}-${h}`} className={`h-6 sm:h-7 rounded-md border ${temaNoturno?'border-white/5':'border-black/5'} flex items-center justify-center text-[10px] font-bold w-full ${temaNoturno ? (i > 0.4 ? 'text-zinc-900' : 'text-zinc-300') : (i > 0.4 ? 'text-zinc-100' : 'text-zinc-700')}`} style={{ backgroundColor: getHC(i) }}>{qtd > 0 ? qtd : ''}</motion.div>);
                })}
              </div>
            ))}
          </div>
        </div>
      ) : (<div className="flex-1 flex items-center justify-center"><p className={`text-[13px] font-medium ${temaNoturno ? 'text-zinc-600' : 'text-zinc-400'}`}>Sem dados</p></div>)}
    </div>
  );
};

export const WidgetProdutos = ({ temaNoturno, rankingMaiusculo }) => (
  <div className={`flex flex-col p-6 rounded-[24px] transition-all hover:shadow-md h-full min-h-[220px] w-full ${cardSurface(temaNoturno)}`}>
    <div className="flex justify-between items-center mb-4 pr-6 w-full"><h3 className={`flex items-center gap-2 ${labelArox(temaNoturno)}`}><BarChart2 className="w-3.5 h-3.5" /> Rentabilidade</h3></div>
    {rankingMaiusculo && rankingMaiusculo.length > 0 ? (
      <div className="w-full h-[160px] min-h-[160px] overflow-hidden">
        <ResponsiveContainer width="100%" height="100%" minHeight={160} debounce={50}>
          <BarChart data={rankingMaiusculo} layout="vertical" margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
            <XAxis type="number" hide />
            <YAxis dataKey="nome" type="category" axisLine={false} tickLine={false} tick={{fill: temaNoturno ? '#a1a1aa' : '#71717a', fontSize: 11, fontWeight: 700}} width={140} />
            <RechartsTooltip cursor={{fill: temaNoturno ? '#18181b' : '#f4f4f5'}} content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  return (
                    <div className={`p-4 rounded-[16px] border shadow-xl backdrop-blur-xl ${temaNoturno ? 'bg-zinc-900/80 border-white/10' : 'bg-white/80 border-black/10'}`}>
                      <p className="text-[13px] font-bold mb-3">{d?.nome || 'Produto'}</p>
                      <div className="flex flex-col gap-2">
                        <p className="text-[11px] font-bold uppercase tracking-wider flex justify-between gap-6"><span className="opacity-50">Lucro:</span> <span className="text-emerald-500">R$ {(d?.lucro||0).toFixed(2)}</span></p>
                        <p className="text-[11px] font-bold uppercase tracking-wider flex justify-between gap-6"><span className="opacity-50">Custo:</span> <span>R$ {(d?.custo||0).toFixed(2)}</span></p>
                      </div>
                    </div>
                  );
                } return null;
              }}
            />
            <Bar dataKey="custo" stackId="a" fill={temaNoturno ? '#27272a' : '#e4e4e7'} radius={[0,0,0,0]} barSize={16} />
            <Bar dataKey="lucro" stackId="a" fill={temaNoturno ? '#34d399' : '#10b981'} radius={[0,4,4,0]} barSize={16} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    ) : (<div className="flex-1 flex items-center justify-center"><p className={`text-[13px] font-medium opacity-50`}>Sem movimentação</p></div>)}
  </div>
);

export const WidgetCombo = ({ temaNoturno, topCombos }) => (
  <div className={`flex flex-col p-6 rounded-[24px] transition-all hover:shadow-md h-full min-h-[180px] w-full ${cardSurface(temaNoturno)}`}>
    <h3 className={`flex items-center gap-2 mb-4 ${labelArox(temaNoturno)}`}><Zap className="w-3.5 h-3.5" /> Cesta Inteligente</h3>
    {topCombos && topCombos.length > 0 ? (
      <div className="flex flex-col gap-2.5 pr-2 w-full">
        {topCombos.map((combo, idx) => {
          const [p1, p2] = (combo?.nome || '').includes(' + ') ? combo.nome.split(' + ') : [combo?.nome, ''];
          return (
            <div key={idx} className={`p-3 rounded-xl border flex items-center justify-between w-full shadow-sm ${temaNoturno ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/5'}`}>
              <div className="flex flex-col pr-2 min-w-0">
                <span className="text-[12px] font-bold line-clamp-1">{p1}</span>
                {p2 && <span className="text-[10px] font-bold flex items-center gap-1 mt-0.5 opacity-50"><span>+</span><span className="line-clamp-1">{p2}</span></span>}
              </div>
              <div className={`px-2.5 py-1 flex-shrink-0 rounded-md border text-[10px] font-black ${temaNoturno ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-zinc-200'}`}>{combo?.qtd || 0}x</div>
            </div>
          );
        })}
      </div>
    ) : (<div className="flex-1 flex items-center justify-center"><p className={`text-[13px] font-medium opacity-50`}>Sem padrões</p></div>)}
  </div>
);