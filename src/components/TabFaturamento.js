'use client';
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip } from 'recharts';
import GraficoFaturamento from '@/components/GraficoFaturamento';

const CORES_PIZZA = ['#0d9488', '#4f46e5', '#059669', '#ef4444', '#f59e0b'];

export default function TabFaturamento({
  temaNoturno,
  filtroTempo,
  setFiltroTempo,
  getHoje,
  getMesAtual,
  getAnoAtual,
  faturamentoTotal,
  lucroEstimado,
  dadosPizza,
  rankingProdutos,
  comandasFiltradas
}) {
  return (
    <div className="max-w-6xl mx-auto w-full animate-in slide-in-from-bottom-4 duration-500">
      <div className={`p-4 rounded-3xl shadow-sm border mb-6 flex flex-col md:flex-row justify-between items-center gap-4 ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
        <div className={`flex p-1 rounded-xl w-full md:w-auto border ${temaNoturno ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
          {['dia', 'mes', 'ano', 'periodo'].map(t => <button key={t} onClick={() => setFiltroTempo({...filtroTempo, tipo: t, valor: t==='dia'?getHoje():t==='mes'?getMesAtual():getAnoAtual()})} className={`flex-1 px-4 py-2 rounded-lg text-xs font-bold uppercase transition ${filtroTempo.tipo === t ? (temaNoturno ? 'bg-purple-600 text-white shadow-sm' : 'bg-purple-900 text-white shadow-sm') : (temaNoturno ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-purple-700')}`}>{t}</button>)}
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          {filtroTempo.tipo === 'dia' && <input type="date" value={filtroTempo.valor} onChange={e => setFiltroTempo({...filtroTempo, valor: e.target.value})} className={`p-2 border rounded-xl outline-none text-sm font-bold w-full focus:border-purple-500 ${temaNoturno ? 'bg-gray-700 border-gray-600 text-white color-scheme-dark' : 'bg-gray-50 border-gray-200'}`} />}
          {filtroTempo.tipo === 'mes' && <input type="month" value={filtroTempo.valor} onChange={e => setFiltroTempo({...filtroTempo, valor: e.target.value})} className={`p-2 border rounded-xl outline-none text-sm font-bold w-full focus:border-purple-500 ${temaNoturno ? 'bg-gray-700 border-gray-600 text-white color-scheme-dark' : 'bg-gray-50 border-gray-200'}`} />}
          {filtroTempo.tipo === 'ano' && <input type="number" value={filtroTempo.valor} onChange={e => setFiltroTempo({...filtroTempo, valor: e.target.value})} className={`p-2 border rounded-xl outline-none text-sm font-bold w-full focus:border-purple-500 ${temaNoturno ? 'bg-gray-700 border-gray-600 text-white color-scheme-dark' : 'bg-gray-50 border-gray-200'}`} />}
          {filtroTempo.tipo === 'periodo' && (
            <><input type="date" value={filtroTempo.inicio} onChange={e => setFiltroTempo({...filtroTempo, inicio: e.target.value})} className={`p-2 border rounded-xl outline-none text-xs font-bold w-full focus:border-purple-500 ${temaNoturno ? 'bg-gray-700 border-gray-600 text-white color-scheme-dark' : 'bg-gray-50 border-gray-200'}`} /><span className={`self-center font-bold ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`}>até</span><input type="date" value={filtroTempo.fim} onChange={e => setFiltroTempo({...filtroTempo, fim: e.target.value})} className={`p-2 border rounded-xl outline-none text-xs font-bold w-full focus:border-purple-500 ${temaNoturno ? 'bg-gray-700 border-gray-600 text-white color-scheme-dark' : 'bg-gray-50 border-gray-200'}`} /></>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className={`p-8 rounded-3xl shadow-sm border flex flex-col justify-center items-start relative overflow-hidden group ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
          <div className="absolute -right-4 -top-4 w-32 h-32 rounded-full opacity-50 group-hover:scale-110 transition-transform duration-500 bg-purple-500/10"></div>
          <h3 className={`text-xs font-bold uppercase tracking-widest mb-2 relative z-10 ${temaNoturno ? 'text-gray-400' : 'text-gray-400'}`}>Faturamento Bruto</h3>
          <p className={`text-4xl md:text-5xl font-black tracking-tight relative z-10 ${temaNoturno ? 'text-white' : 'text-purple-900'}`}>R$ {faturamentoTotal.toFixed(2)}</p>
        </div>
        <div className={`p-8 rounded-3xl shadow-sm border flex flex-col justify-center items-start relative overflow-hidden group ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
          <div className="absolute -right-4 -top-4 w-32 h-32 rounded-full opacity-50 group-hover:scale-110 transition-transform duration-500 bg-green-500/10"></div>
          <h3 className={`text-xs font-bold uppercase tracking-widest mb-2 relative z-10 ${temaNoturno ? 'text-gray-400' : 'text-gray-400'}`}>Lucro Bruto Estimado</h3>
          <p className="text-4xl md:text-5xl font-black tracking-tight relative z-10 text-green-500">R$ {lucroEstimado.toFixed(2)}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className={`p-6 rounded-3xl shadow-sm border flex flex-col h-[400px] ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
          <h3 className={`text-sm font-bold uppercase mb-4 ${temaNoturno ? 'text-white' : 'text-purple-900'}`}>Divisão por Pagamentos</h3>
          {dadosPizza.length > 0 ? (
            <div className="flex-1 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={dadosPizza} innerRadius={80} outerRadius={110} paddingAngle={4} dataKey="value" stroke="none">
                    {dadosPizza.map((e, i) => <Cell key={i} fill={CORES_PIZZA[i % CORES_PIZZA.length]} />)}
                  </Pie>
                  <RechartsTooltip formatter={(val) => `R$ ${val.toFixed(2)}`} contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: temaNoturno ? '#1f2937' : '#ffffff', color: temaNoturno ? '#ffffff' : '#000000', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', color: temaNoturno ? '#e5e7eb' : '#374151' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
             <div className={`flex-1 flex items-center justify-center text-sm font-bold ${temaNoturno ? 'text-gray-600' : 'text-gray-400'}`}>Sem dados de pagamento no período</div>
          )}
        </div>

        <div className={`p-6 rounded-3xl shadow-sm border flex flex-col h-[400px] ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
          <h3 className={`text-sm font-bold uppercase mb-4 ${temaNoturno ? 'text-white' : 'text-purple-900'}`}>Produtos Mais Rentáveis</h3>
          {rankingProdutos.length > 0 ? (
            <div className="flex-1 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rankingProdutos} layout="vertical" margin={{ top: 0, right: 60, left: 0, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="nome" type="category" axisLine={false} tickLine={false} tick={{fill: temaNoturno ? '#9ca3af' : '#6b7280', fontSize: 11, fontWeight: 'bold'}} width={150} />
                  <RechartsTooltip 
                    cursor={{fill: temaNoturno ? '#374151' : '#f3f4f6'}} 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className={`p-4 shadow-xl rounded-2xl border ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                            <p className={`text-xs font-black mb-1 ${temaNoturno ? 'text-white' : 'text-purple-900'}`}>{data.nome}</p>
                            <p className="text-sm font-bold text-green-500">Receita: R$ {data.valor.toFixed(2)}</p>
                            <p className={`text-[10px] font-bold uppercase mt-2 border-t pt-1 ${temaNoturno ? 'border-gray-700 text-gray-400' : 'border-gray-100 text-gray-500'}`}>
                              {data.isPeso ? `Volume: ${(data.volume / 1000).toFixed(3)} kg` : `Vendidos: ${data.volume} unid.`}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="valor" fill={temaNoturno ? '#a855f7' : '#9333ea'} radius={[0, 6, 6, 0]} barSize={24} label={{ position: 'right', formatter: (val) => `R$ ${val.toFixed(2)}`, fill: temaNoturno ? '#9ca3af' : '#6b7280', fontSize: 11, fontWeight: 'bold' }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className={`flex-1 flex items-center justify-center text-sm font-bold ${temaNoturno ? 'text-gray-600' : 'text-gray-400'}`}>Sem vendas no período</div>
          )}
        </div>
      </div>

      <GraficoFaturamento comandas={comandasFiltradas} temaNoturno={temaNoturno} />
    </div>
  );
}