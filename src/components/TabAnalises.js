'use client';
import { useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip } from 'recharts';

export default function TabAnalises({
  temaNoturno,
  filtroTempo,
  setFiltroTempo,
  getHoje,
  getMesAtual,
  getAnoAtual,
  dadosTipos,
  dadosTags
}) {

  // Inteligência de Negócio: Calculando os líderes para exibir como insight gamificado
  const destaqueOrigem = useMemo(() => {
    if (!dadosTipos || dadosTipos.length === 0) return null;
    return [...dadosTipos].sort((a, b) => b.qtd - a.qtd)[0];
  }, [dadosTipos]);

  const destaqueTag = useMemo(() => {
    if (!dadosTags || dadosTags.length === 0) return null;
    return [...dadosTags].sort((a, b) => b.qtd - a.qtd)[0];
  }, [dadosTags]);

  return (
    <div className="max-w-5xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8">
      
      {/* CABEÇALHO PRESERVADO (Com ajustes finos de padding para não ocupar muita tela) */}
      <div className={`p-4 md:p-5 rounded-b-2xl shadow-sm border-x border-b border-t-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 relative transition-colors duration-500 mb-5 ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className={`absolute top-0 left-5 right-5 border-t border-dashed ${temaNoturno ? 'border-gray-700' : 'border-gray-200'}`}></div>
        
        <div className="flex w-full md:w-auto items-center mt-1 md:mt-0">
            <h2 className={`text-lg md:text-xl font-black uppercase tracking-wide flex items-center gap-2 ${temaNoturno ? 'text-white' : 'text-gray-900'}`}>
              Inteligência & Tags
            </h2>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto justify-end">
            <div className={`flex p-1 rounded-xl w-full sm:w-auto border ${temaNoturno ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
              {['dia', '7 dias', 'mes', 'ano'].map(t => (
                <button key={t} onClick={() => setFiltroTempo({...filtroTempo, tipo: t, valor: t==='dia'||t==='7 dias'?getHoje():t==='mes'?getMesAtual():getAnoAtual()})} 
                className={`flex-1 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all duration-300 ${filtroTempo.tipo === t ? (temaNoturno ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md' : 'bg-white text-purple-700 shadow-sm border border-gray-200') : (temaNoturno ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-purple-700')}`}>
                  {t}
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {filtroTempo.tipo === 'dia' && <input type="date" value={filtroTempo.valor} onChange={e => setFiltroTempo({...filtroTempo, valor: e.target.value})} className={`w-full md:w-36 px-2 py-2.5 border rounded-xl outline-none text-[11px] font-bold transition-colors focus:border-purple-500 ${temaNoturno ? 'bg-gray-900 border-gray-700 text-white [color-scheme:dark]' : 'bg-gray-50 border-gray-200 text-gray-900'}`} />}
              {filtroTempo.tipo === 'mes' && <input type="month" value={filtroTempo.valor} onChange={e => setFiltroTempo({...filtroTempo, valor: e.target.value})} className={`w-full md:w-36 px-2 py-2.5 border rounded-xl outline-none text-[11px] font-bold transition-colors focus:border-purple-500 ${temaNoturno ? 'bg-gray-900 border-gray-700 text-white [color-scheme:dark]' : 'bg-gray-50 border-gray-200 text-gray-900'}`} />}
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        
        {/* GRÁFICO 1 - ORIGEM DO PEDIDO */}
        <div className={`p-4 md:p-5 flex flex-col rounded-2xl shadow-sm border h-[280px] transition-all duration-300 group ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
          <div className="flex justify-between items-start mb-4">
             <h3 className={`text-xs font-black uppercase tracking-widest flex items-center gap-1.5 ${temaNoturno ? 'text-white' : 'text-gray-900'}`}>
                <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                Origem Real
             </h3>
             {destaqueOrigem && destaqueOrigem.qtd > 0 && (
                <div className={`flex flex-col text-right`}>
                   <span className={`text-[8px] font-black uppercase tracking-widest ${temaNoturno ? 'text-gray-500' : 'text-gray-400'}`}>Destaque</span>
                   <span className="text-[10px] font-bold text-amber-500">{destaqueOrigem.nome} ({destaqueOrigem.qtd})</span>
                </div>
             )}
          </div>
          
          <div className="flex-1 w-full min-h-0">
            {dadosTipos && dadosTipos.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dadosTipos} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorOrigem" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#fbbf24" stopOpacity={1}/>
                          <stop offset="100%" stopColor="#d97706" stopOpacity={0.8}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={temaNoturno ? '#374151' : '#f3f4f6'} />
                    <XAxis dataKey="nome" tickLine={false} axisLine={false} tick={{fill: temaNoturno ? '#9ca3af' : '#6b7280', fontSize: 9, fontWeight: '900'}} dy={5} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: temaNoturno ? '#6b7280' : '#9ca3af', fontSize: 9}} />
                    <RechartsTooltip 
                      cursor={{fill: temaNoturno ? '#37415150' : '#f3f4f680', radius: 8}} 
                      contentStyle={{ backgroundColor: temaNoturno ? 'rgba(31,41,55,0.95)' : 'rgba(255,255,255,0.95)', color: temaNoturno ? '#ffffff' : '#000000', borderRadius: '12px', border: 'none', backdropFilter: 'blur(8px)', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }} 
                      itemStyle={{ fontWeight: '900', color: '#f59e0b', fontSize: '12px' }}
                      labelStyle={{ fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', color: temaNoturno ? '#9ca3af' : '#6b7280', marginBottom: '2px' }}
                    />
                    <Bar dataKey="qtd" fill="url(#colorOrigem)" radius={[4, 4, 0, 0]} barSize={32} animationDuration={1000} />
                  </BarChart>
                </ResponsiveContainer>
            ) : <div className={`h-full flex items-center justify-center text-[10px] font-bold uppercase tracking-widest ${temaNoturno ? 'text-gray-600' : 'text-gray-400'}`}>Sem dados</div>}
          </div>
        </div>

        {/* GRÁFICO 2 - COMPORTAMENTO E TAGS */}
        <div className={`p-4 md:p-5 flex flex-col rounded-2xl shadow-sm border h-[280px] transition-all duration-300 group ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
          <div className="flex justify-between items-start mb-4">
             <h3 className={`text-xs font-black uppercase tracking-widest flex items-center gap-1.5 ${temaNoturno ? 'text-white' : 'text-gray-900'}`}>
                <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg>
                Comportamento (Tags)
             </h3>
             {destaqueTag && destaqueTag.qtd > 0 && (
                <div className={`flex flex-col text-right`}>
                   <span className={`text-[8px] font-black uppercase tracking-widest ${temaNoturno ? 'text-gray-500' : 'text-gray-400'}`}>Mais Usada</span>
                   <span className="text-[10px] font-bold text-purple-500">{destaqueTag.nome} ({destaqueTag.qtd})</span>
                </div>
             )}
          </div>
          
          <div className="flex-1 w-full min-h-0 overflow-y-auto scrollbar-hide pr-1">
            {dadosTags && dadosTags.length > 0 ? (
                <div style={{ height: Math.max(180, dadosTags.length * 35) }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dadosTags} layout="vertical" margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorTags" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#a855f7" stopOpacity={0.8}/>
                            <stop offset="100%" stopColor="#7e22ce" stopOpacity={1}/>
                        </linearGradient>
                      </defs>
                      <XAxis type="number" hide />
                      <YAxis dataKey="nome" type="category" axisLine={false} tickLine={false} tick={{fill: temaNoturno ? '#9ca3af' : '#6b7280', fontSize: 9, fontWeight: '900'}} width={90}/>
                      <RechartsTooltip 
                        cursor={{fill: temaNoturno ? '#37415150' : '#f3f4f680', radius: 8}} 
                        contentStyle={{ backgroundColor: temaNoturno ? 'rgba(31,41,55,0.95)' : 'rgba(255,255,255,0.95)', color: temaNoturno ? '#ffffff' : '#000000', borderRadius: '12px', border: 'none', backdropFilter: 'blur(8px)', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }} 
                        itemStyle={{ fontWeight: '900', color: '#a855f7', fontSize: '12px' }}
                        labelStyle={{ fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', color: temaNoturno ? '#9ca3af' : '#6b7280', marginBottom: '2px' }}
                      />
                      <Bar dataKey="qtd" fill="url(#colorTags)" radius={[0, 4, 4, 0]} barSize={16} animationDuration={1000} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
            ) : <div className={`h-full flex items-center justify-center text-[10px] font-bold uppercase tracking-widest ${temaNoturno ? 'text-gray-600' : 'text-gray-400'}`}>Nenhuma tag registrada</div>}
          </div>
        </div>

      </div>
    </div>
  );
}