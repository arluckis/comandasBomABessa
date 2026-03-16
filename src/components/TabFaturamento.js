'use client';
import { useState, useEffect, useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip } from 'recharts';

const CORES_VIBRANTES = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#0ea5e9', '#f97316', '#14b8a6', '#84cc16'];

export default function TabFaturamento({
  temaNoturno, filtroTempo, setFiltroTempo, getHoje, getMesAtual, getAnoAtual,
  faturamentoTotal, lucroEstimado, dadosPizza, rankingProdutos, comandasFiltradas,
  comandas
}) {

  const [mostrarMenuPersonalizar, setMostrarMenuPersonalizar] = useState(false);
  const [widgets, setWidgets] = useState({
    bruto: true, lucro: true, ticket: true, termometro: true, pagamentos: true, produtos: true, mapaCalor: true, combo: true 
  }); 

  useEffect(() => {
    const widgetsSalvos = localStorage.getItem('bessa_widgets_faturamento_v4');
    if (widgetsSalvos) setWidgets(JSON.parse(widgetsSalvos));
  }, []);

  const toggleWidget = (chave) => {
    const novosWidgets = { ...widgets, [chave]: !widgets[chave] };
    setWidgets(novosWidgets);
    localStorage.setItem('bessa_widgets_faturamento_v4', JSON.stringify(novosWidgets));
  };

  const totalComandas = comandasFiltradas.length;
  const ticketMedio = totalComandas > 0 ? (faturamentoTotal / totalComandas) : 0;
  const rankingMaiusculo = rankingProdutos.map(p => ({ ...p, nome: p.nome.toUpperCase() }));

  const faltamDiasParaAnalise = useMemo(() => {
    if (!comandas || comandas.length === 0) return 7;
    const datasEmMilissegundos = comandas.map(c => new Date(c.data + 'T12:00:00').getTime()).filter(t => !isNaN(t));
    if (datasEmMilissegundos.length === 0) return 7;
    const dataPrimeira = new Date(Math.min(...datasEmMilissegundos)); 
    const diffDays = Math.floor((new Date(getHoje() + 'T12:00:00') - dataPrimeira) / (1000 * 60 * 60 * 24));
    return Math.max(0, 7 - diffDays);
  }, [comandas, getHoje]);

  const { mediaHistorica, diffAbsoluta, percentualReal, percentualBarra, bateuMeta } = useMemo(() => {
    if (!comandas || comandas.length === 0) return { mediaHistorica: 0, diffAbsoluta: 0, percentualReal: 0, percentualBarra: 0, bateuMeta: false };

    const dataRef = filtroTempo.tipo === 'dia' ? filtroTempo.valor : getHoje();
    const dataObj = new Date(dataRef + 'T12:00:00'); 
    const diaSemana = dataObj.getDay(); 

    const faturamentoPorDia = {};
    comandas.forEach(c => {
      if (!c.data) return;
      if (!faturamentoPorDia[c.data]) faturamentoPorDia[c.data] = 0;
      faturamentoPorDia[c.data] += (c.produtos || []).reduce((acc, p) => acc + p.preco, 0);
    });

    let soma = 0; let qtdDias = 0;
    Object.keys(faturamentoPorDia).forEach(data => {
      if (data < dataRef) {
        if (new Date(data + 'T12:00:00').getDay() === diaSemana) {
          soma += faturamentoPorDia[data];
          qtdDias++;
        }
      }
    });

    const media = qtdDias > 0 ? (soma / qtdDias) : 0;
    
    const pctReal = media > 0 ? (faturamentoTotal / media) * 100 : (faturamentoTotal > 0 ? 100 : 0);
    const pctBarra = Math.min(pctReal, 100);
    const diferenca = Math.abs(faturamentoTotal - media);
    const bateu = faturamentoTotal >= media && faturamentoTotal > 0;

    return { mediaHistorica: media, diffAbsoluta: diferenca, percentualReal: pctReal, percentualBarra: pctBarra, bateuMeta: bateu };
  }, [comandas, filtroTempo.tipo, filtroTempo.valor, getHoje, faturamentoTotal]);

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
        const nomesUnicos = Array.from(new Set(c.produtos.map(p => p.nome.replace(/\s*\(\d+(?:\.\d+)?\s*g\)/i, '').trim().toUpperCase())));
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

  const numCardsResumo = [widgets.bruto, widgets.lucro, widgets.ticket].filter(Boolean).length;

  return (
    <div className="max-w-7xl mx-auto w-full animate-in slide-in-from-bottom-4 duration-500 px-2 lg:px-0 pb-10">
      
      <div className={`p-4 rounded-3xl shadow-sm border mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className={`flex p-1 rounded-xl w-full sm:w-auto border ${temaNoturno ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
            {['dia', '7 dias', 'mes', 'ano', 'periodo'].map(t => <button key={t} onClick={() => setFiltroTempo({...filtroTempo, tipo: t, valor: t==='dia'||t==='7 dias'?getHoje():t==='mes'?getMesAtual():getAnoAtual()})} className={`flex-1 px-4 py-2 rounded-lg text-xs font-bold uppercase transition ${filtroTempo.tipo === t ? (temaNoturno ? 'bg-purple-600 text-white shadow-sm' : 'bg-purple-900 text-white shadow-sm') : (temaNoturno ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-purple-700')}`}>{t}</button>)}
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto flex-1">
            {filtroTempo.tipo === 'dia' && <input type="date" value={filtroTempo.valor} onChange={e => setFiltroTempo({...filtroTempo, valor: e.target.value})} className={`p-2 border rounded-xl outline-none text-sm font-bold w-full focus:border-purple-500 ${temaNoturno ? 'bg-gray-700 border-gray-600 text-white color-scheme-dark' : 'bg-gray-50 border-gray-200'}`} />}
            {filtroTempo.tipo === 'mes' && <input type="month" value={filtroTempo.valor} onChange={e => setFiltroTempo({...filtroTempo, valor: e.target.value})} className={`p-2 border rounded-xl outline-none text-sm font-bold w-full focus:border-purple-500 ${temaNoturno ? 'bg-gray-700 border-gray-600 text-white color-scheme-dark' : 'bg-gray-50 border-gray-200'}`} />}
            {filtroTempo.tipo === 'ano' && <input type="number" value={filtroTempo.valor} onChange={e => setFiltroTempo({...filtroTempo, valor: e.target.value})} className={`p-2 border rounded-xl outline-none text-sm font-bold w-full focus:border-purple-500 ${temaNoturno ? 'bg-gray-700 border-gray-600 text-white color-scheme-dark' : 'bg-gray-50 border-gray-200'}`} />}
            {filtroTempo.tipo === 'periodo' && (
              <><input type="date" value={filtroTempo.inicio} onChange={e => setFiltroTempo({...filtroTempo, inicio: e.target.value})} className={`p-2 border rounded-xl outline-none text-xs font-bold w-full focus:border-purple-500 ${temaNoturno ? 'bg-gray-700 border-gray-600 text-white color-scheme-dark' : 'bg-gray-50 border-gray-200'}`} /><span className={`self-center font-bold ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`}>até</span><input type="date" value={filtroTempo.fim} onChange={e => setFiltroTempo({...filtroTempo, fim: e.target.value})} className={`p-2 border rounded-xl outline-none text-xs font-bold w-full focus:border-purple-500 ${temaNoturno ? 'bg-gray-700 border-gray-600 text-white color-scheme-dark' : 'bg-gray-50 border-gray-200'}`} /></>
            )}
          </div>
        </div>

        <button onClick={() => setMostrarMenuPersonalizar(!mostrarMenuPersonalizar)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition shadow-sm border w-full md:w-auto justify-center ${temaNoturno ? 'bg-gray-900 border-gray-700 text-purple-400 hover:bg-gray-800' : 'bg-white border-purple-200 text-purple-700 hover:bg-purple-50'}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path></svg>
          Visuais
        </button>
      </div>

      {mostrarMenuPersonalizar && (
        <div className={`p-5 rounded-3xl shadow-sm border mb-6 animate-in slide-in-from-top-2 ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
          <h3 className={`text-sm font-black uppercase mb-4 ${temaNoturno ? 'text-white' : 'text-gray-800'}`}>Selecione o que deseja visualizar</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { id: 'bruto', label: 'Faturamento Bruto' }, { id: 'lucro', label: 'Lucro Bruto' }, { id: 'ticket', label: 'Ticket Médio' }, { id: 'termometro', label: 'Termômetro' }, 
              { id: 'pagamentos', label: 'Pagamentos' }, { id: 'produtos', label: 'Produtos Rentáveis' }, { id: 'mapaCalor', label: 'Pico de Vendas' }, { id: 'combo', label: 'Análise de Cesta' }
            ].map(item => (
              <label key={item.id} className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${temaNoturno ? 'bg-gray-900 border-gray-700 hover:bg-gray-800' : 'bg-gray-50 border-gray-200 hover:bg-purple-50'}`}>
                <span className={`text-[10px] font-bold uppercase tracking-widest ${temaNoturno ? 'text-gray-300' : 'text-gray-700'}`}>{item.label}</span>
                <input type="checkbox" checked={widgets[item.id]} onChange={() => toggleWidget(item.id)} className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500" />
              </label>
            ))}
          </div>
        </div>
      )}
      
      {numCardsResumo > 0 && (
        <div className={`grid grid-cols-1 md:grid-cols-${numCardsResumo} gap-6 mb-6`}>
          {widgets.bruto && (
            <div className={`p-8 rounded-3xl shadow-sm border flex flex-col justify-center items-start relative overflow-hidden group ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
              <div className="absolute -right-4 -top-4 w-32 h-32 rounded-full opacity-50 group-hover:scale-110 transition-transform duration-500 bg-purple-500/10"></div>
              <h3 className={`text-xs font-bold uppercase tracking-widest mb-2 relative z-10 ${temaNoturno ? 'text-gray-400' : 'text-gray-400'}`}>Faturamento Bruto</h3>
              <p className={`text-4xl md:text-5xl font-black tracking-tight relative z-10 ${temaNoturno ? 'text-white' : 'text-purple-900'}`}>R$ {faturamentoTotal.toFixed(2)}</p>
            </div>
          )}
          {widgets.lucro && (
            <div className={`p-8 rounded-3xl shadow-sm border flex flex-col justify-center items-start relative overflow-hidden group ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
              <div className="absolute -right-4 -top-4 w-32 h-32 rounded-full opacity-50 group-hover:scale-110 transition-transform duration-500 bg-green-500/10"></div>
              <h3 className={`text-xs font-bold uppercase tracking-widest mb-2 relative z-10 ${temaNoturno ? 'text-gray-400' : 'text-gray-400'}`}>Lucro Bruto Estimado</h3>
              <p className="text-4xl md:text-5xl font-black tracking-tight relative z-10 text-green-500">R$ {lucroEstimado.toFixed(2)}</p>
            </div>
          )}
          {widgets.ticket && (
            <div className={`p-8 rounded-3xl shadow-sm border flex flex-col justify-center items-start relative overflow-hidden group ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
              <div className="absolute -right-4 -top-4 w-32 h-32 rounded-full opacity-50 group-hover:scale-110 transition-transform duration-500 bg-cyan-500/10"></div>
              <h3 className={`text-xs font-bold uppercase tracking-widest mb-2 relative z-10 ${temaNoturno ? 'text-gray-400' : 'text-gray-400'}`}>Ticket Médio</h3>
              <div className="relative z-10 flex items-end gap-3">
                <p className="text-4xl md:text-5xl font-black tracking-tight text-cyan-500">R$ {ticketMedio.toFixed(2)}</p>
                <p className={`text-sm font-bold mb-1.5 ${temaNoturno ? 'text-gray-500' : 'text-gray-400'}`}>/ {totalComandas} cmds</p>
              </div>
            </div>
          )}
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        
        {/* TERMÔMETRO CORPORATIVO */}
        {widgets.termometro && (
          <div className={`p-6 rounded-3xl shadow-sm border flex flex-col items-center justify-between h-[350px] relative ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
            <h3 className={`text-sm w-full text-center font-black uppercase tracking-widest mb-6 ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`}>Performance do Dia</h3>
            
            {faltamDiasParaAnalise > 0 ? (
              <div className="my-auto flex flex-col items-center justify-center text-center px-4">
                <span className="text-5xl mb-4">🧪</span>
                <p className={`text-sm font-black uppercase ${temaNoturno ? 'text-gray-300' : 'text-gray-700'}`}>Mapeando Histórico</p>
                <p className={`text-xs mt-2 font-bold ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`}>Disponível em <span className="text-purple-500 font-black">{faltamDiasParaAnalise} dias</span>.</p>
              </div>
            ) : (
              <div className="flex-1 w-full flex flex-col justify-center px-2">
                 <div className="flex justify-between items-end mb-3">
                   <span className={`text-6xl font-black transition-colors duration-500 ${bateuMeta ? 'text-green-500' : (temaNoturno ? 'text-white' : 'text-gray-800')}`}>
                      {percentualReal.toFixed(0)}%
                   </span>
                   <span className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${temaNoturno ? 'text-gray-500' : 'text-gray-400'}`}>da Meta Média</span>
                 </div>
                 
                 <div className={`w-full h-6 rounded-full overflow-hidden shadow-inner relative ${temaNoturno ? 'bg-gray-900' : 'bg-gray-200'}`}>
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${bateuMeta ? 'bg-green-500' : 'bg-orange-400'}`} 
                      style={{ width: `${percentualBarra}%` }}>
                    </div>
                 </div>
                 
                 <div className={`mt-8 p-5 rounded-2xl border flex items-center justify-between shadow-sm transition-colors ${bateuMeta ? (temaNoturno ? 'bg-green-900/20 border-green-500/30' : 'bg-green-50 border-green-200') : (temaNoturno ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200')}`}>
                    <div className="flex items-center gap-4">
                       <span className="text-3xl">{bateuMeta ? '🎯' : '📈'}</span>
                       <div className="flex flex-col">
                          <span className={`text-[10px] font-black uppercase tracking-widest ${bateuMeta ? 'text-green-600' : (temaNoturno ? 'text-gray-500' : 'text-gray-400')}`}>
                             {bateuMeta ? 'Meta Superada!' : 'Buscando a Média'}
                          </span>
                          <span className={`text-sm font-bold mt-0.5 ${bateuMeta ? 'text-green-500' : 'text-orange-500'}`}>
                             {bateuMeta ? `+ R$ ${diffAbsoluta.toFixed(2)} acima` : `Faltam R$ ${diffAbsoluta.toFixed(2)}`}
                          </span>
                       </div>
                    </div>
                 </div>
              </div>
            )}
          </div>
        )}

        {widgets.pagamentos && (
          <div className={`p-6 rounded-3xl shadow-sm border flex flex-col h-[350px] ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
            <h3 className={`text-sm font-black uppercase mb-2 text-center tracking-widest ${temaNoturno ? 'text-white' : 'text-gray-900'}`}>Pagamentos</h3>
            {dadosPizza.length > 0 ? (
              <div className="flex-1 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={dadosPizza} innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value" stroke="none">
                      {dadosPizza.map((e, i) => <Cell key={i} fill={CORES_VIBRANTES[i % CORES_VIBRANTES.length]} />)}
                    </Pie>
                    <RechartsTooltip formatter={(val) => `R$ ${val.toFixed(2)}`} contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: temaNoturno ? '#1f2937' : '#ffffff', color: temaNoturno ? '#ffffff' : '#000000', fontWeight: 'bold' }} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', color: temaNoturno ? '#e5e7eb' : '#374151' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : <div className={`flex-1 flex items-center justify-center text-xs font-bold uppercase tracking-widest ${temaNoturno ? 'text-gray-600' : 'text-gray-400'}`}>Sem dados</div>}
          </div>
        )}

        {widgets.produtos && (
          <div className={`p-6 rounded-3xl shadow-sm border flex flex-col h-[350px] ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
            <h3 className={`text-sm font-black uppercase mb-2 text-center tracking-widest ${temaNoturno ? 'text-white' : 'text-gray-900'}`}>Mais Rentáveis</h3>
            {rankingMaiusculo.length > 0 ? (
              <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={rankingMaiusculo} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="nome" type="category" axisLine={false} tickLine={false} tick={{fill: temaNoturno ? '#9ca3af' : '#6b7280', fontSize: 10, fontWeight: 'bold'}} width={120} />
                    <RechartsTooltip cursor={{fill: temaNoturno ? '#374151' : '#f3f4f6'}} content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className={`p-4 shadow-xl rounded-2xl border ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                              <p className={`text-xs font-black mb-1 ${temaNoturno ? 'text-white' : 'text-purple-900'}`}>{data.nome}</p>
                              <p className="text-sm font-bold text-green-500">R$ {data.valor.toFixed(2)}</p>
                            </div>
                          );
                        } return null;
                      }} />
                    <Bar dataKey="valor" radius={[0, 4, 4, 0]} barSize={20} label={{ position: 'right', formatter: (val) => `R$ ${val.toFixed(2)}`, fill: temaNoturno ? '#9ca3af' : '#6b7280', fontSize: 10, fontWeight: 'bold' }}>
                      {rankingMaiusculo.map((e, i) => <Cell key={i} fill={CORES_VIBRANTES[i % CORES_VIBRANTES.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : <div className={`flex-1 flex items-center justify-center text-xs font-bold uppercase tracking-widest ${temaNoturno ? 'text-gray-600' : 'text-gray-400'}`}>Sem vendas</div>}
          </div>
        )}
        
        {widgets.mapaCalor && (
          <div className={`p-6 rounded-3xl shadow-sm border flex flex-col col-span-1 lg:col-span-2 min-h-[350px] overflow-hidden ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
            <h3 className={`text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2 ${temaNoturno ? 'text-white' : 'text-gray-900'}`}>
              <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              Mapa de Calor (Histórico de Movimento)
            </h3>
            {maxCalor > 0 ? (
              <div className="flex-1 w-full overflow-x-auto scrollbar-hide flex flex-col justify-center">
                <div className="min-w-[500px]">
                  <div className="grid grid-cols-8 gap-1 mb-2 text-[10px] font-bold text-center uppercase tracking-widest text-gray-400">
                    <div></div>
                    {mapaCalor.horasVisiveis.map(h => <div key={h}>{h}h</div>)}
                  </div>
                  {mapaCalor.diasSemana.map((dia, idx) => (
                    <div key={dia} className="grid grid-cols-8 gap-1 mb-1">
                      <div className={`flex items-center text-xs font-black uppercase tracking-widest ${temaNoturno ? 'text-gray-400' : 'text-gray-600'}`}>{dia}</div>
                      {mapaCalor.horasVisiveis.map(h => {
                        const qtd = mapaCalor.matriz[idx][h];
                        const intensidade = qtd === 0 ? 0 : Math.max(0.15, qtd / maxCalor);
                        return (
                          <div 
                            key={`${dia}-${h}`} title={`${qtd} comandas criadas às ${h}h`}
                            className={`h-10 rounded-lg transition-all hover:scale-105 cursor-crosshair ${temaNoturno ? 'border-gray-700/50' : 'border border-gray-100'}`}
                            style={{ backgroundColor: qtd > 0 ? `rgba(147, 51, 234, ${intensidade})` : (temaNoturno ? '#374151' : '#f9fafb') }}
                          ></div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            ) : <div className={`flex-1 flex items-center justify-center text-xs font-bold uppercase tracking-widest ${temaNoturno ? 'text-gray-600' : 'text-gray-400'}`}>Dados insuficientes.</div>}
          </div>
        )}

        {widgets.combo && (
          <div className={`p-6 rounded-3xl shadow-sm border flex flex-col h-[350px] col-span-1 lg:col-span-1 ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
            <h3 className={`text-sm font-black uppercase mb-6 tracking-widest flex items-center gap-2 ${temaNoturno ? 'text-white' : 'text-gray-900'}`}>
              <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              Análise de Cesta
            </h3>
            {topCombos.length > 0 ? (
              <div className="flex flex-col gap-3 overflow-y-auto pr-2">
                {topCombos.map((combo, idx) => {
                  const [p1, p2] = combo.nome.split(' + ');
                  return (
                    <div key={idx} className={`p-3 rounded-xl border flex items-center justify-between transition ${temaNoturno ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex flex-col">
                        <span className={`text-xs font-black uppercase ${temaNoturno ? 'text-gray-200' : 'text-gray-800'}`}>{p1}</span>
                        <span className={`text-[10px] font-bold mt-0.5 ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`}>+ {p2}</span>
                      </div>
                      <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${temaNoturno ? 'bg-gray-800 text-purple-400 border border-gray-700' : 'bg-white text-purple-700 border border-purple-100'}`}>{combo.qtd}x</span>
                    </div>
                  );
                })}
              </div>
            ) : <div className={`flex-1 flex items-center justify-center text-xs text-center font-bold uppercase tracking-widest leading-relaxed ${temaNoturno ? 'text-gray-600' : 'text-gray-400'}`}>Faça vendas combinadas <br/> para ver o padrão.</div>}
          </div>
        )}

      </div>
    </div>
  );
}