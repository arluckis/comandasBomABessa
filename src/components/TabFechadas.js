'use client';

export default function TabFechadas({
  temaNoturno,
  comandasFechadasHoje,
  reabrirComandaFechada,
  excluirComandaFechada
}) {
  return (
    <div className="max-w-6xl mx-auto w-full animate-in fade-in duration-300">
      <h2 className={`text-2xl font-black mb-6 flex items-center gap-2 ${temaNoturno ? 'text-white' : 'text-gray-800'}`}>Comandas Encerradas <span className={`text-sm font-normal px-2 py-0.5 rounded-md ${temaNoturno ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-400'}`}>Hoje ({comandasFechadasHoje.length})</span></h2>
      {comandasFechadasHoje.length === 0 ? (
        <div className={`p-12 rounded-3xl text-center shadow-sm border ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
          <p className={`font-bold text-lg mb-2 ${temaNoturno ? 'text-gray-300' : 'text-gray-600'}`}>Ainda não há comandas encerradas hoje.</p>
          <p className={`text-sm ${temaNoturno ? 'text-gray-500' : 'text-gray-400'}`}>Quando você cobrar e encerrar uma mesa, o recibo aparecerá aqui.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {comandasFechadasHoje.map(c => {
            const valorTotalComanda = c.pagamentos.reduce((acc, p) => acc + p.valor, 0);
            return (
              <div key={c.id} className={`p-5 rounded-3xl shadow-sm border flex flex-col ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                <div className={`flex justify-between items-start border-b pb-3 mb-3 ${temaNoturno ? 'border-gray-700' : 'border-gray-100'}`}>
                  <div>
                    <h3 className={`font-black text-lg leading-tight flex items-center gap-2 ${temaNoturno ? 'text-white' : 'text-gray-800'}`}>
                      {c.nome} {c.tags.length > 0 && <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase border ${temaNoturno ? 'bg-purple-900/30 text-purple-300 border-purple-800' : 'bg-purple-50 text-purple-700 border-purple-100'}`}>{c.tags[0]}</span>}
                    </h3>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md mt-1 inline-block border ${c.tipo === 'Delivery' ? (temaNoturno ? 'bg-orange-900/20 text-orange-400 border-orange-800' : 'bg-orange-50 text-orange-600 border-orange-100') : (temaNoturno ? 'bg-purple-900/20 text-purple-400 border-purple-800' : 'bg-purple-50 text-purple-600 border-purple-100')}`}>{c.tipo}</span>
                  </div>
                  <span className="font-black text-xl tracking-tight text-green-500">R$ {valorTotalComanda.toFixed(2)}</span>
                </div>
                <div className="flex-1 mb-4">
                  <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${temaNoturno ? 'text-gray-500' : 'text-gray-400'}`}>Resumo dos Itens</p>
                  <p className={`text-sm line-clamp-2 leading-relaxed ${temaNoturno ? 'text-gray-300' : 'text-gray-600'}`}>{c.produtos.map(p => p.nome).join(', ')}</p>
                  <p className={`text-xs mt-1 font-medium italic ${temaNoturno ? 'text-gray-500' : 'text-gray-400'}`}>({c.produtos.length} produtos)</p>
                </div>
                <div className={`p-3 rounded-xl flex items-center justify-between border mb-3 ${temaNoturno ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
                  <span className={`text-xs font-bold uppercase ${temaNoturno ? 'text-gray-500' : 'text-gray-500'}`}>Pagamento</span>
                  <div className="flex flex-wrap gap-1 justify-end">{c.pagamentos.map((p, i) => <span key={i} className={`text-[10px] font-bold px-2 py-1 rounded border shadow-sm ${temaNoturno ? 'bg-gray-800 border-gray-600 text-gray-300' : 'bg-white border-gray-200 text-gray-600'}`}>{p.forma}</span>)}</div>
                </div>
                <div className={`flex gap-2 pt-3 border-t ${temaNoturno ? 'border-gray-700' : 'border-gray-100'}`}>
                  <button onClick={() => reabrirComandaFechada(c.id)} className={`flex-1 font-bold p-2 rounded-xl text-xs transition text-center ${temaNoturno ? 'bg-blue-900/20 text-blue-400 hover:bg-blue-900/40' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}>🔄 Reabrir</button>
                  <button onClick={() => excluirComandaFechada(c.id)} className={`flex-1 font-bold p-2 rounded-xl text-xs transition text-center ${temaNoturno ? 'bg-red-900/20 text-red-400 hover:bg-red-900/40' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}>🗑️ Excluir</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}