'use client';

export default function PainelComanda({
  temaNoturno,
  comandaAtiva,
  abaDetalheMobile,
  setAbaDetalheMobile,
  filtroCategoriaCardapio,
  setFiltroCategoriaCardapio,
  menuCategorias,
  adicionarProdutoNaComanda,
  setMostrarModalPeso,
  tagsGlobais,
  toggleTag,
  editarProduto,
  excluirProduto,
  setMostrarModalPagamento,
  encerrarMesa
}) {
  
  const renderCardapioComanda = () => {
    let categoriasParaRenderizar = [];
    
    if (filtroCategoriaCardapio === 'Favoritos') {
      const todosFavoritos = menuCategorias.flatMap(c => c.itens).filter(p => p.favorito);
      if (todosFavoritos.length > 0) {
        categoriasParaRenderizar = [{ id: 'favs', nome: '⭐ Favoritos', itens: todosFavoritos }];
      }
    } else if (filtroCategoriaCardapio === 'Todas') {
      categoriasParaRenderizar = menuCategorias;
    } else {
      const catEspecifica = menuCategorias.find(c => c.id === filtroCategoriaCardapio);
      if (catEspecifica) categoriasParaRenderizar = [catEspecifica];
    }

    return categoriasParaRenderizar.map(cat => (
      <div key={cat.id} className="mb-8">
        <h3 className={`text-xs font-black uppercase tracking-widest mb-3 ${temaNoturno ? 'text-gray-500' : 'text-gray-400'}`}>{cat.nome}</h3>
        {cat.itens.length === 0 ? (
          <p className={`text-sm italic ${temaNoturno ? 'text-gray-600' : 'text-gray-400'}`}>Nenhum produto encontrado nesta categoria.</p>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {cat.itens.map(item => (
              <button 
                key={item.id} 
                onClick={() => adicionarProdutoNaComanda(item)} 
                className={`p-4 rounded-2xl text-xs font-bold transition text-left flex flex-col gap-1 active:scale-95 shadow-sm border ${temaNoturno ? 'bg-gray-800 border-gray-700 text-gray-200 hover:border-purple-500' : 'bg-white border-gray-100 text-gray-800 hover:border-purple-400'}`}
              >
                <span>{item.nome}</span>
                <span className="text-green-500 font-black">R$ {item.preco.toFixed(2)}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    ));
  };

  if (!comandaAtiva) return null;

  return (
    <div className="flex-1 flex flex-col w-full h-full animate-in zoom-in-95 duration-300">
      <div className={`md:hidden flex p-1 rounded-xl mb-4 w-full border ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-gray-200 border-gray-300'}`}>
        <button onClick={() => setAbaDetalheMobile('menu')} className={`flex-1 py-3 text-sm font-bold rounded-lg transition ${abaDetalheMobile === 'menu' ? (temaNoturno ? 'bg-gray-700 text-purple-400 shadow-sm' : 'bg-white text-purple-700 shadow-sm') : (temaNoturno ? 'text-gray-500' : 'text-gray-500')}`}>Cardápio</button>
        <button onClick={() => setAbaDetalheMobile('resumo')} className={`flex-1 py-3 text-sm font-bold rounded-lg transition flex items-center justify-center gap-2 ${abaDetalheMobile === 'resumo' ? (temaNoturno ? 'bg-purple-600 text-white shadow-sm' : 'bg-purple-600 text-white shadow-sm') : (temaNoturno ? 'text-gray-500' : 'text-gray-500')}`}>Resumo <span className="bg-white/20 text-white px-2 py-0.5 rounded-full text-[10px]">{comandaAtiva?.produtos.length || 0}</span></button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 h-full">
        <div className={`p-4 md:p-6 rounded-3xl shadow-sm border overflow-y-auto pb-24 md:pb-6 ${temaNoturno ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-200'} ${abaDetalheMobile === 'menu' ? 'block' : 'hidden md:block'}`}>
          <div className="flex overflow-x-auto gap-2 mb-4 pb-2 scrollbar-hide">
            <button onClick={() => setFiltroCategoriaCardapio('Favoritos')} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition border ${filtroCategoriaCardapio === 'Favoritos' ? (temaNoturno ? 'bg-yellow-900/20 text-yellow-400 border-yellow-800/50' : 'bg-yellow-50 text-yellow-600 border-yellow-200') : (temaNoturno ? 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-100')}`}>⭐ Favoritos</button>
            <button onClick={() => setFiltroCategoriaCardapio('Todas')} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition border ${filtroCategoriaCardapio === 'Todas' ? (temaNoturno ? 'bg-purple-900/30 text-purple-400 border-purple-800' : 'bg-purple-100 text-purple-700 border-purple-200') : (temaNoturno ? 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-100')}`}>Todas</button>
            {menuCategorias.map(c => (
              <button key={c.id} onClick={() => setFiltroCategoriaCardapio(c.id)} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition border ${filtroCategoriaCardapio === c.id ? (temaNoturno ? 'bg-purple-900/30 text-purple-400 border-purple-800' : 'bg-purple-100 text-purple-700 border-purple-200') : (temaNoturno ? 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-100')}`}>{c.nome}</button>
            ))}
          </div>

          <button onClick={() => setMostrarModalPeso(true)} className={`w-full p-4 mb-6 border-2 border-dashed rounded-2xl font-bold transition active:scale-95 shadow-sm ${temaNoturno ? 'border-purple-500/50 text-purple-400 bg-purple-900/10 hover:bg-purple-900/30' : 'border-purple-300 text-purple-600 bg-purple-50 hover:bg-purple-100'}`}>⚖️ Lançar Açaí no Peso</button>
          
          {renderCardapioComanda()}
        </div>
        
        <div className={`p-4 md:p-6 rounded-3xl shadow-2xl flex flex-col h-[calc(100vh-180px)] md:h-auto border relative overflow-hidden ${temaNoturno ? 'bg-gray-900 border-gray-700' : 'bg-white border-purple-100'} ${abaDetalheMobile === 'resumo' ? 'flex' : 'hidden md:flex'}`}>
          <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-20 ${temaNoturno ? 'bg-purple-900/50' : 'bg-purple-200'}`}></div>
          <div className="flex-1 overflow-y-auto pr-2 pb-4 relative z-10 scrollbar-hide">
            <div className="mb-4">
              <p className={`text-[10px] uppercase tracking-widest font-bold mb-2 ${temaNoturno ? 'text-gray-500' : 'text-gray-400'}`}>Classificação do Cliente:</p>
              <div className="flex flex-wrap gap-1.5">
                {tagsGlobais.map(tagObj => (
                  <button key={tagObj.id} onClick={() => toggleTag(tagObj.nome)} className={`px-2 py-1 rounded-md text-[10px] font-bold transition border ${comandaAtiva?.tags.includes(tagObj.nome) ? (temaNoturno ? 'bg-purple-900/50 text-purple-300 border-purple-700' : 'bg-purple-600 text-white border-purple-700') : (temaNoturno ? 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100')}`}>
                    {tagObj.nome}
                  </button>
                ))}
              </div>
            </div>
            <div className={`flex justify-between items-center p-3 rounded-xl mb-4 border ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-purple-50/50 border-purple-100'}`}>
              <span className={`text-xs font-bold ${temaNoturno ? 'text-gray-300' : 'text-purple-900'}`}>ITENS LANÇADOS</span>
            </div>
            {comandaAtiva?.produtos.map((p) => (
              <div key={p.id} className={`flex justify-between items-center border-b py-3 text-sm transition ${p.pago ? 'opacity-40 line-through' : 'opacity-100'} ${temaNoturno ? 'border-gray-800' : 'border-purple-800/40'}`}>
                <div className="flex flex-col"><span className={`font-bold ${temaNoturno ? 'text-gray-100' : 'text-gray-800'}`}>{p.nome} {p.pago && <span className={`text-[10px] px-1 py-0.5 rounded ml-1 no-underline ${temaNoturno ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-700'}`}>PAGO</span>}</span>{p.observacao && <span className={`text-xs font-medium ${temaNoturno ? 'text-gray-400' : 'text-purple-500'}`}>↳ {p.observacao}</span>}</div>
                <div className="flex items-center gap-2"><span className={`font-black tracking-tight ${temaNoturno ? 'text-white' : 'text-gray-900'}`}>R$ {p.preco.toFixed(2)}</span>{!p.pago && <div className="flex gap-1 ml-2"><button onClick={() => editarProduto(p.id, p.observacao)} className={`p-1.5 rounded-lg text-xs transition ${temaNoturno ? 'bg-gray-700 hover:bg-gray-600' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'}`}>✏️</button><button onClick={() => excluirProduto(p.id)} className={`p-1.5 rounded-lg text-xs transition ${temaNoturno ? 'bg-red-500/20 text-red-400 hover:text-red-100 hover:bg-red-500' : 'bg-red-50 text-red-500 hover:bg-red-100'}`}>🗑️</button></div>}</div>
              </div>
            ))}
          </div>
          <div className={`mt-auto pt-4 border-t pb-2 md:pb-0 relative z-10 ${temaNoturno ? 'border-gray-800 bg-gray-900' : 'border-purple-100 bg-white'}`}>
            <div className="flex justify-between items-end mb-4 px-2">
              <span className={`text-xs font-bold uppercase ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`}>Restante</span>
              <span className="text-green-500 text-3xl font-black tracking-tighter">R$ {comandaAtiva?.produtos.filter(p => !p.pago).reduce((acc, p) => acc + p.preco, 0).toFixed(2)}</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setMostrarModalPagamento(true)} disabled={comandaAtiva?.produtos.filter(p=>!p.pago).length === 0} className="flex-[2] bg-green-500 py-4 rounded-2xl font-black text-white text-lg hover:bg-green-600 transition shadow-lg disabled:opacity-50 active:scale-95">COBRAR</button>
              <button onClick={encerrarMesa} disabled={!comandaAtiva || comandaAtiva?.produtos.length === 0 || comandaAtiva?.produtos.some(p => !p.pago)} className={`flex-1 py-4 rounded-2xl font-bold text-xs uppercase transition disabled:opacity-30 active:scale-95 ${temaNoturno ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'}`}>Encerrar Mesa</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}