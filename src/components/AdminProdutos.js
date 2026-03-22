// src/components/AdminProdutos.js
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminProdutos({ empresaId, onFechar, temaNoturno }) {
  // Estados de Exibição
  // 'lista' | 'novo_produto' | 'peso' | 'categorias' | 'importacao'
  const [painelAtivo, setPainelAtivo] = useState('lista'); 
  const [loading, setLoading] = useState(true);
  
  // Notificação customizada (substituindo alert)
  const [notificacao, setNotificacao] = useState({ show: false, tipo: '', mensagem: '' });

  // Dados
  const [categorias, setCategorias] = useState([]);
  const [configPeso, setConfigPeso] = useState([]);
  
  // Filtros Listagem
  const [buscaProduto, setBuscaProduto] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');

  // Formulários
  const [novoItem, setNovoItem] = useState({ nome: '', preco: '', custo: '', idCategoria: '' });
  const [editandoItem, setEditandoItem] = useState(null);
  
  const [novaCategoria, setNovaCategoria] = useState('');
  const [editandoCategoriaId, setEditandoCategoriaId] = useState(null);
  const [nomeCategoriaEditando, setNomeCategoriaEditando] = useState('');
  
  const [novoPeso, setNovoPeso] = useState({ nome: '', preco: '', custo: '' });
  const [editandoPeso, setEditandoPeso] = useState(null);

  const [textoImportacao, setTextoImportacao] = useState('');
  const [importando, setImportando] = useState(false);

  const fetchDados = async () => {
    setLoading(true);
    const { data: catData } = await supabase.from('categorias').select('*, produtos(*)').eq('empresa_id', empresaId); 
    if (catData) setCategorias(catData);
    
    const { data: pesoData } = await supabase.from('config_peso').select('*').eq('empresa_id', empresaId);
    if (pesoData) setConfigPeso(pesoData);
    
    setLoading(false);
  };

  useEffect(() => { fetchDados(); }, [empresaId]);

  const mostrarAviso = (mensagem, tipo = 'erro') => {
    setNotificacao({ show: true, tipo, mensagem });
    setTimeout(() => setNotificacao({ show: false, tipo: '', mensagem: '' }), 4000);
  };

  // --- LÓGICA DE PRODUTOS ---
  const calcularProgressoProduto = () => {
    let p = 0;
    if (novoItem.idCategoria) p += 25;
    if (novoItem.nome) p += 25;
    if (novoItem.preco) p += 25;
    if (novoItem.custo) p += 25;
    return p;
  };

  const salvarProduto = async () => {
    if (!novoItem.nome || !novoItem.preco || !novoItem.idCategoria || !novoItem.custo) {
      return mostrarAviso("Preencha todos os campos obrigatórios, incluindo o custo do produto.");
    }
    
    const precoNum = parseFloat(novoItem.preco.toString().replace(',', '.'));
    const custoNum = parseFloat(novoItem.custo.toString().replace(',', '.'));

    if (custoNum < precoNum * 0.10) {
      return mostrarAviso("O custo informado não pode ser menor que 10% do valor de venda. Revise seus números.");
    }

    const payload = { 
      nome: novoItem.nome, 
      preco: precoNum, 
      custo: custoNum,
      categoria_id: novoItem.idCategoria,
      empresa_id: empresaId 
    };

    if (editandoItem) {
      await supabase.from('produtos').update(payload).eq('id', editandoItem.id);
      mostrarAviso("Produto atualizado com sucesso!", "sucesso");
    } else {
      await supabase.from('produtos').insert([payload]);
      mostrarAviso("Produto cadastrado com sucesso!", "sucesso");
    }
    
    setEditandoItem(null);
    setNovoItem({ nome: '', preco: '', custo: '', idCategoria: novoItem.idCategoria });
    setPainelAtivo('lista');
    fetchDados();
  };

  const carregarEdicaoProduto = (prod) => {
    setEditandoItem(prod);
    setNovoItem({ nome: prod.nome, preco: prod.preco, custo: prod.custo || '', idCategoria: prod.categoria_id });
    setPainelAtivo('novo_produto');
  };

  const toggleFavorito = async (id, statusAtual) => {
    await supabase.from('produtos').update({ favorito: !statusAtual }).eq('id', id);
    fetchDados();
  };

  const excluirProduto = async (id) => {
    if (confirm("Tem certeza que deseja excluir este produto do catálogo?")) {
      await supabase.from('produtos').delete().eq('id', id);
      fetchDados();
      mostrarAviso("Produto excluído.", "sucesso");
    }
  };

  // --- LÓGICA DE CATEGORIAS ---
  const salvarCategoria = async () => {
    if (novaCategoria.trim() === '') return mostrarAviso("Digite um nome para a categoria.");
    await supabase.from('categorias').insert([{ nome: novaCategoria, empresa_id: empresaId }]);
    setNovaCategoria(''); 
    fetchDados();
    mostrarAviso("Categoria adicionada com sucesso!", "sucesso");
  };

  const salvarEdicaoCategoria = async (id) => {
    if (!nomeCategoriaEditando.trim()) return mostrarAviso("O nome não pode ficar vazio.");
    await supabase.from('categorias').update({ nome: nomeCategoriaEditando }).eq('id', id);
    setEditandoCategoriaId(null);
    setNomeCategoriaEditando('');
    fetchDados();
    mostrarAviso("Categoria atualizada!", "sucesso");
  };

  const excluirCategoria = async (id) => {
    if (confirm("ATENÇÃO: Excluir esta categoria apagará TODOS os produtos dentro dela. Continuar?")) {
      await supabase.from('categorias').delete().eq('id', id);
      fetchDados();
      mostrarAviso("Categoria removida.", "sucesso");
    }
  };

  // --- LÓGICA DE PESO/GRANEL ---
  const salvarPeso = async () => {
    if (!novoPeso.nome || !novoPeso.preco || !novoPeso.custo) {
      return mostrarAviso("Preencha nome, preço e custo por KG/Unidade de Medida.");
    }
    const precoNum = parseFloat(novoPeso.preco.toString().replace(',', '.'));
    const custoNum = parseFloat(novoPeso.custo.toString().replace(',', '.'));
    
    if (custoNum < precoNum * 0.10) {
      return mostrarAviso("O custo não pode ser inferior a 10% do valor de venda.");
    }

    const payload = { 
      nome: novoPeso.nome, 
      preco_kg: precoNum,
      custo_kg: custoNum,
      empresa_id: empresaId
    };

    if (editandoPeso) {
      await supabase.from('config_peso').update(payload).eq('id', editandoPeso.id);
      mostrarAviso("Configuração atualizada!", "sucesso");
    } else {
      await supabase.from('config_peso').insert([payload]);
      mostrarAviso("Item a granel configurado!", "sucesso");
    }
    
    setEditandoPeso(null); setNovoPeso({ nome: '', preco: '', custo: '' }); fetchDados();
  };

  const carregarEdicaoPeso = (peso) => {
    setEditandoPeso(peso); setNovoPeso({ nome: peso.nome, preco: peso.preco_kg, custo: peso.custo_kg || '' });
  };

  const excluirPeso = async (id) => {
    if (confirm("Remover esta opção de venda a granel/peso?")) {
      await supabase.from('config_peso').delete().eq('id', id); 
      fetchDados();
      mostrarAviso("Removido com sucesso.", "sucesso");
    }
  };

  // --- LÓGICA DE IMPORTAÇÃO EM MASSA ---
  const processarImportacaoMassa = async () => {
    if (!textoImportacao.trim()) return mostrarAviso("Cole o texto do catálogo para importar.");
    setImportando(true);

    const linhas = textoImportacao.split('\n');
    let categoriaAtual = '';
    const mapaCategorias = {}; 

    for (let linha of linhas) {
      linha = linha.trim();
      if (!linha) continue;

      if (linha.startsWith('#')) {
        categoriaAtual = linha.replace('#', '').trim();
        if (!mapaCategorias[categoriaAtual]) mapaCategorias[categoriaAtual] = [];
      } else {
        if (!categoriaAtual) {
          categoriaAtual = 'Geral';
          if (!mapaCategorias[categoriaAtual]) mapaCategorias[categoriaAtual] = [];
        }
        
        const partes = linha.split('|').map(p => p.trim());
        const nome = partes[0];
        const preco = parseFloat((partes[1] || '0').replace(',', '.'));
        const custo = parseFloat((partes[2] || '0').replace(',', '.'));

        if (nome && !isNaN(preco)) {
          // Força regra dos 10% se o custo não for preenchido ou for baixo
          const custoAplicado = (custo < preco * 0.1) ? preco * 0.1 : custo;
          mapaCategorias[categoriaAtual].push({ nome, preco, custo: custoAplicado });
        }
      }
    }

    try {
      const categoriasExistentes = [...categorias];
      const mapCatIds = {}; 
      categoriasExistentes.forEach(c => mapCatIds[c.nome.toLowerCase()] = c.id);

      let totalAdicionados = 0;

      for (const catNome of Object.keys(mapaCategorias)) {
        let catId = mapCatIds[catNome.toLowerCase()];
        
        if (!catId) {
           const { data: novaCat } = await supabase.from('categorias').insert([{ nome: catNome, empresa_id: empresaId }]).select().single();
           if (novaCat) { catId = novaCat.id; mapCatIds[catNome.toLowerCase()] = catId; }
        }

        if (catId) {
          const produtosParaInserir = mapaCategorias[catNome].map(p => ({
            nome: p.nome, preco: p.preco, custo: p.custo, categoria_id: catId, empresa_id: empresaId
          }));

          if (produtosParaInserir.length > 0) {
            const { error } = await supabase.from('produtos').insert(produtosParaInserir);
            if (!error) totalAdicionados += produtosParaInserir.length;
          }
        }
      }

      mostrarAviso(`Catálogo atualizado! ${totalAdicionados} itens importados.`, "sucesso");
      setTextoImportacao('');
      setPainelAtivo('lista');
      fetchDados();

    } catch (e) {
      console.error(e);
      mostrarAviso("Ocorreu um erro na importação. Verifique o formato.");
    } finally {
      setImportando(false);
    }
  };

  // SVGs Reutilizáveis
  const iconeBusca = <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>;
  const iconeAdicionar = <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>;
  const iconeCategoria = <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path></svg>;
  const iconeBalanca = <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"></path></svg>;
  const iconeUpload = <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>;
  const iconeLixeira = <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>;
  const iconeEditar = <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>;

  // Filtragem
  const categoriasFiltradas = categorias.map(cat => ({
    ...cat,
    produtos: (cat.produtos || []).filter(p => p.nome.toLowerCase().includes(buscaProduto.toLowerCase()))
  })).filter(cat => 
    (filtroCategoria === '' || cat.id === filtroCategoria) && 
    (buscaProduto === '' || cat.produtos.length > 0)
  );

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-[60] animate-in fade-in duration-300">
      <div className={`rounded-3xl p-6 w-full max-w-6xl shadow-2xl flex flex-col h-[90vh] border overflow-hidden relative ${temaNoturno ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
        
        {/* Notificação Toast */}
        {notificacao.show && (
          <div className={`absolute top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full font-bold shadow-xl animate-in slide-in-from-top-4 fade-in duration-300 flex items-center gap-3 ${notificacao.tipo === 'erro' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
            {notificacao.tipo === 'erro' ? (
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            ) : (
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
            )}
            {notificacao.mensagem}
          </div>
        )}

        {/* HEADER DO MODAL */}
        <div className={`flex justify-between items-center mb-6 border-b pb-4 shrink-0 ${temaNoturno ? 'border-gray-800' : 'border-gray-100'}`}>
          <div className="flex items-center gap-4">
            {painelAtivo !== 'lista' && (
              <button onClick={() => { setPainelAtivo('lista'); setEditandoItem(null); setNovoItem({nome:'', preco:'', custo:'', idCategoria:''})}} className={`p-2 rounded-xl transition hover:scale-105 active:scale-95 ${temaNoturno ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
              </button>
            )}
            <h2 className={`text-xl md:text-2xl font-black ${temaNoturno ? 'text-white' : 'text-purple-900'}`}>
              {painelAtivo === 'lista' ? 'Gestão de Catálogo' :
               painelAtivo === 'novo_produto' ? (editandoItem ? 'Editar Produto' : 'Novo Produto') :
               painelAtivo === 'categorias' ? 'Gerenciar Categorias' :
               painelAtivo === 'peso' ? 'Venda a Granel/Peso' : 'Importação em Massa'
              }
            </h2>
          </div>
          <button onClick={onFechar} className={`p-2.5 rounded-full font-bold transition hover:scale-105 active:scale-95 ${temaNoturno ? 'bg-gray-800 hover:bg-red-900/40 text-gray-400 hover:text-red-400' : 'bg-gray-100 hover:bg-red-50 text-gray-500 hover:text-red-500'}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide">
          {loading ? <p className="text-center font-bold mt-10 text-purple-500 animate-pulse">A carregar informações...</p> : (
            <>
              {/* === PAINEL PRINCIPAL (LISTA E BOTÕES) === */}
              {painelAtivo === 'lista' && (
                <div className="flex flex-col gap-6 animate-in fade-in duration-300">
                  
                  {/* Grade de Ações Rápidas */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                    <button onClick={() => setPainelAtivo('novo_produto')} className={`p-4 md:p-5 rounded-2xl flex flex-col items-center justify-center gap-2 border transition-all hover:scale-[1.02] shadow-sm active:scale-95 ${temaNoturno ? 'bg-purple-900/20 border-purple-800 text-purple-400 hover:bg-purple-900/40' : 'bg-purple-50 border-purple-100 text-purple-700 hover:bg-purple-100'}`}>
                      {iconeAdicionar}
                      <span className="font-bold text-sm">Adicionar Produto</span>
                    </button>
                    <button onClick={() => setPainelAtivo('categorias')} className={`p-4 md:p-5 rounded-2xl flex flex-col items-center justify-center gap-2 border transition-all hover:scale-[1.02] shadow-sm active:scale-95 ${temaNoturno ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'}`}>
                      {iconeCategoria}
                      <span className="font-bold text-sm">Categorias</span>
                    </button>
                    <button onClick={() => setPainelAtivo('peso')} className={`p-4 md:p-5 rounded-2xl flex flex-col items-center justify-center gap-2 border transition-all hover:scale-[1.02] shadow-sm active:scale-95 ${temaNoturno ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'}`}>
                      {iconeBalanca}
                      <span className="font-bold text-sm">A Granel / Peso</span>
                    </button>
                    <button onClick={() => setPainelAtivo('importacao')} className={`p-4 md:p-5 rounded-2xl flex flex-col items-center justify-center gap-2 border transition-all hover:scale-[1.02] shadow-sm active:scale-95 ${temaNoturno ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'}`}>
                      {iconeUpload}
                      <span className="font-bold text-sm">Importação em Massa</span>
                    </button>
                  </div>

                  {/* Barra de Filtros */}
                  <div className={`flex flex-col md:flex-row gap-3 p-3 rounded-2xl border ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
                    <div className="flex-1 relative flex items-center">
                      <span className={`absolute left-4 ${temaNoturno ? 'text-gray-500' : 'text-gray-400'}`}>{iconeBusca}</span>
                      <input 
                        type="text" placeholder="Procurar produto..." value={buscaProduto} onChange={e => setBuscaProduto(e.target.value)}
                        className={`w-full pl-11 pr-4 py-3 rounded-xl border outline-none font-bold text-sm transition focus:border-purple-500 ${temaNoturno ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-800'}`}
                      />
                    </div>
                    <select 
                      value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)}
                      className={`md:w-64 px-4 py-3 rounded-xl border outline-none font-bold text-sm transition focus:border-purple-500 ${temaNoturno ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-800'}`}
                    >
                      <option value="">Todas as Categorias</option>
                      {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                    </select>
                  </div>

                  {/* Listagem de Produtos */}
                  <div>
                    {categoriasFiltradas.length === 0 && <p className={`text-center py-10 font-bold ${temaNoturno ? 'text-gray-600' : 'text-gray-400'}`}>Nenhum produto encontrado no catálogo.</p>}
                    
                    {categoriasFiltradas.map(cat => (
                      <div key={cat.id} className="mb-8">
                        <div className="flex items-center gap-3 mb-4">
                           <h3 className={`text-sm font-black uppercase tracking-widest px-2 ${temaNoturno ? 'text-purple-400' : 'text-purple-800'}`}>{cat.nome}</h3>
                           <div className={`h-px flex-1 ${temaNoturno ? 'bg-gray-800' : 'bg-gray-100'}`}></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                          {cat.produtos.map(p => (
                             <div key={p.id} className={`p-4 rounded-2xl border flex flex-col justify-between shadow-sm transition-all hover:shadow-md ${temaNoturno ? 'bg-gray-800 border-gray-700 hover:border-gray-500' : 'bg-white border-gray-100 hover:border-purple-200'}`}>
                               <div className="flex justify-between items-start mb-4">
                                 <span className={`font-bold text-sm truncate pr-2 ${temaNoturno ? 'text-gray-200' : 'text-gray-800'}`}>{p.nome}</span>
                                 <button onClick={() => toggleFavorito(p.id, p.favorito)} className={`shrink-0 transition-all hover:scale-125 ${p.favorito ? 'text-yellow-400' : (temaNoturno ? 'text-gray-600 hover:text-yellow-400/50' : 'text-gray-300 hover:text-yellow-400/50')}`}>
                                   <svg className="w-5 h-5" fill={p.favorito ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path></svg>
                                 </button>
                               </div>
                               <div className="flex justify-between items-end">
                                 <div className="flex flex-col">
                                   <span className={`font-black tracking-tight text-lg leading-none mb-1 ${temaNoturno ? 'text-green-400' : 'text-green-600'}`}>R$ {p.preco.toFixed(2)}</span>
                                   <span className={`text-[10px] font-bold uppercase tracking-wider ${temaNoturno ? 'text-gray-500' : 'text-gray-400'}`}>Custo: R$ {(p.custo||0).toFixed(2)}</span>
                                 </div>
                                 <div className="flex gap-1.5">
                                   <button onClick={() => carregarEdicaoProduto(p)} className={`p-2 rounded-xl transition hover:scale-110 active:scale-95 ${temaNoturno ? 'bg-gray-700 hover:bg-blue-900/40 text-blue-400' : 'bg-gray-50 hover:bg-blue-50 text-blue-600 border border-gray-100'}`}>{iconeEditar}</button>
                                   <button onClick={() => excluirProduto(p.id)} className={`p-2 rounded-xl transition hover:scale-110 active:scale-95 ${temaNoturno ? 'bg-gray-700 hover:bg-red-900/40 text-red-400' : 'bg-gray-50 hover:bg-red-50 text-red-500 border border-gray-100'}`}>{iconeLixeira}</button>
                                 </div>
                               </div>
                             </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              )}

              {/* === PAINEL NOVO PRODUTO === */}
              {painelAtivo === 'novo_produto' && (
                <div className="max-w-3xl mx-auto py-4 animate-in slide-in-from-bottom-4 fade-in duration-300">
                  <div className={`p-6 md:p-8 rounded-3xl border shadow-xl ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                    
                    {/* Barra de Progresso Visual */}
                    <div className="mb-8">
                      <div className="flex justify-between text-xs font-bold mb-2">
                        <span className={temaNoturno ? 'text-gray-400' : 'text-gray-500'}>Progresso do Cadastro</span>
                        <span className={temaNoturno ? 'text-purple-400' : 'text-purple-600'}>{calcularProgressoProduto()}%</span>
                      </div>
                      <div className={`w-full h-2.5 rounded-full overflow-hidden ${temaNoturno ? 'bg-gray-900' : 'bg-gray-100'}`}>
                        <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500 ease-out" style={{ width: `${calcularProgressoProduto()}%` }}></div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="md:col-span-2">
                        <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${temaNoturno ? 'text-gray-400' : 'text-gray-600'}`}>Categoria Obrigatória *</label>
                        <select className={`w-full p-4 rounded-xl border outline-none text-sm font-bold transition focus:ring-2 focus:ring-purple-500/30 ${temaNoturno ? 'bg-gray-900 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'}`} value={novoItem.idCategoria} onChange={e => setNovoItem({...novoItem, idCategoria: e.target.value})}>
                          <option value="">Selecione de qual setor é este produto</option>
                          {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${temaNoturno ? 'text-gray-400' : 'text-gray-600'}`}>Nome do Produto *</label>
                        <input type="text" placeholder="Ex: Camiseta Básica, Hambúrguer, Serviço X..." className={`w-full p-4 rounded-xl border outline-none text-sm font-bold transition focus:ring-2 focus:ring-purple-500/30 ${temaNoturno ? 'bg-gray-900 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'}`} value={novoItem.nome} onChange={e => setNovoItem({...novoItem, nome: e.target.value})} />
                      </div>

                      <div>
                        <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${temaNoturno ? 'text-gray-400' : 'text-gray-600'}`}>Preço de Venda Final (R$) *</label>
                        <input type="number" step="0.01" placeholder="Ex: 89.90" className={`w-full p-4 rounded-xl border outline-none text-sm font-bold text-green-600 transition focus:ring-2 focus:ring-green-500/30 ${temaNoturno ? 'bg-gray-900 border-gray-600' : 'bg-gray-50 border-gray-200'}`} value={novoItem.preco} onChange={e => setNovoItem({...novoItem, preco: e.target.value})} />
                      </div>

                      <div>
                        <label className={`block text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2 ${temaNoturno ? 'text-gray-400' : 'text-gray-600'}`}>
                          Custo Real do Item (R$) *
                          <span className="group relative cursor-help">
                            <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            <span className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 text-[10px] leading-tight bg-gray-900 text-white rounded-lg z-10 text-center">Para proteger seu caixa, o custo deve ser no mínimo 10% do valor de venda.</span>
                          </span>
                        </label>
                        <input type="number" step="0.01" placeholder="Ex: 35.00" className={`w-full p-4 rounded-xl border outline-none text-sm font-bold transition focus:ring-2 focus:ring-red-500/30 ${temaNoturno ? 'bg-gray-900 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'}`} value={novoItem.custo} onChange={e => setNovoItem({...novoItem, custo: e.target.value})} />
                      </div>
                      
                      <div className="md:col-span-2 pt-4 flex gap-3">
                        <button onClick={salvarProduto} className={`flex-1 font-black p-4 rounded-xl transition-all shadow-lg active:scale-95 ${calcularProgressoProduto() === 100 ? 'bg-purple-600 text-white hover:bg-purple-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}>
                          {editandoItem ? 'Atualizar no Catálogo' : 'Finalizar Cadastro'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* === PAINEL CATEGORIAS === */}
              {painelAtivo === 'categorias' && (
                <div className="max-w-2xl mx-auto py-4 animate-in slide-in-from-bottom-4 fade-in duration-300">
                  <div className={`p-4 md:p-6 mb-6 rounded-3xl border flex flex-col md:flex-row gap-3 shadow-sm ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                    <input type="text" placeholder="Nome da nova categoria (Ex: Calçados, Bebidas...)" className={`flex-1 p-4 rounded-xl border outline-none text-sm font-bold transition focus:ring-2 focus:ring-purple-500/30 ${temaNoturno ? 'bg-gray-900 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-800'}`} value={novaCategoria} onChange={e => setNovaCategoria(e.target.value)} onKeyDown={e => e.key === 'Enter' && salvarCategoria()} />
                    <button onClick={salvarCategoria} className="bg-purple-600 text-white font-bold px-8 py-4 rounded-xl hover:bg-purple-700 transition shadow-lg active:scale-95 flex justify-center items-center gap-2">
                      {iconeAdicionar} Criar
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {categorias.map(cat => (
                      <div key={cat.id} className={`flex flex-col sm:flex-row justify-between sm:items-center p-4 rounded-2xl border transition-all hover:shadow-md ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                        {editandoCategoriaId === cat.id ? (
                           <div className="flex flex-1 gap-2 mr-4">
                             <input autoFocus type="text" className={`flex-1 p-2 rounded-lg border text-sm font-bold outline-none ${temaNoturno ? 'bg-gray-900 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'}`} value={nomeCategoriaEditando} onChange={(e) => setNomeCategoriaEditando(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && salvarEdicaoCategoria(cat.id)} />
                             <button onClick={() => salvarEdicaoCategoria(cat.id)} className="px-4 py-2 bg-green-500 text-white text-xs font-bold rounded-lg hover:bg-green-600 transition">Salvar</button>
                             <button onClick={() => setEditandoCategoriaId(null)} className="px-4 py-2 bg-gray-400 text-white text-xs font-bold rounded-lg hover:bg-gray-500 transition">Cancelar</button>
                           </div>
                        ) : (
                          <div className="flex items-center gap-3 mb-3 sm:mb-0">
                            <span className={`font-black text-lg ${temaNoturno ? 'text-gray-200' : 'text-gray-800'}`}>{cat.nome}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase ${temaNoturno ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>{cat.produtos?.length || 0} itens</span>
                          </div>
                        )}
                        
                        {editandoCategoriaId !== cat.id && (
                          <div className="flex gap-2">
                            <button onClick={() => { setEditandoCategoriaId(cat.id); setNomeCategoriaEditando(cat.nome); }} className={`flex-1 sm:flex-none p-2 rounded-xl flex items-center justify-center transition active:scale-95 ${temaNoturno ? 'bg-gray-700 text-blue-400 hover:bg-gray-600' : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100'}`}>{iconeEditar}</button>
                            <button onClick={() => excluirCategoria(cat.id)} className={`flex-1 sm:flex-none p-2 rounded-xl flex items-center justify-center transition active:scale-95 ${temaNoturno ? 'bg-gray-700 text-red-400 hover:bg-red-900/40' : 'bg-red-50 text-red-500 hover:bg-red-100 border border-red-100'}`}>{iconeLixeira}</button>
                          </div>
                        )}
                      </div>
                    ))}
                    {categorias.length === 0 && <p className={`text-center font-bold py-10 ${temaNoturno ? 'text-gray-600' : 'text-gray-400'}`}>Nenhuma categoria criada. Comece criando uma acima!</p>}
                  </div>
                </div>
              )}

              {/* === PAINEL A GRANEL / PESO === */}
              {painelAtivo === 'peso' && (
                <div className="max-w-4xl mx-auto py-4 animate-in slide-in-from-bottom-4 fade-in duration-300">
                  <div className={`p-6 md:p-8 mb-8 rounded-3xl border grid grid-cols-1 md:grid-cols-3 gap-5 shadow-xl ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                    <div className="md:col-span-3">
                      <h3 className={`font-black mb-1 ${temaNoturno ? 'text-purple-400' : 'text-purple-800'}`}>Cadastro de Item a Granel</h3>
                      <p className={`text-xs font-bold uppercase tracking-wider ${temaNoturno ? 'text-gray-500' : 'text-gray-400'}`}>Configure preços por quilo ou unidade de medida.</p>
                    </div>

                    <div>
                      <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${temaNoturno ? 'text-gray-400' : 'text-gray-600'}`}>Nome do Item *</label>
                      <input type="text" placeholder="Ex: Tecido, Açaí, Parafusos..." className={`w-full p-4 rounded-xl border outline-none text-sm font-bold transition focus:ring-2 focus:ring-purple-500/30 ${temaNoturno ? 'bg-gray-900 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'}`} value={novoPeso.nome} onChange={e => setNovoPeso({...novoPeso, nome: e.target.value})} />
                    </div>
                    <div>
                       <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${temaNoturno ? 'text-gray-400' : 'text-gray-600'}`}>Preço Final (KG/Unid) *</label>
                      <input type="number" step="0.01" placeholder="Ex: 49.90" className={`w-full p-4 rounded-xl border outline-none text-sm font-bold text-green-600 transition focus:ring-2 focus:ring-green-500/30 ${temaNoturno ? 'bg-gray-900 border-gray-600' : 'bg-gray-50 border-gray-200'}`} value={novoPeso.preco} onChange={e => setNovoPeso({...novoPeso, preco: e.target.value})} />
                    </div>
                    <div>
                       <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${temaNoturno ? 'text-gray-400' : 'text-gray-600'}`}>Custo Real (KG/Unid) *</label>
                      <input type="number" step="0.01" placeholder="Ex: 15.00" className={`w-full p-4 rounded-xl border outline-none text-sm font-bold transition focus:ring-2 focus:ring-red-500/30 ${temaNoturno ? 'bg-gray-900 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'}`} value={novoPeso.custo} onChange={e => setNovoPeso({...novoPeso, custo: e.target.value})} />
                    </div>
                    <div className="md:col-span-3 pt-2 flex gap-3">
                       <button onClick={salvarPeso} className="flex-1 bg-purple-600 text-white font-black py-4 rounded-xl hover:bg-purple-700 transition shadow-lg active:scale-95">{editandoPeso ? 'Atualizar Configuração' : 'Cadastrar Medida'}</button>
                       {editandoPeso && <button onClick={() => { setEditandoPeso(null); setNovoPeso({ nome: '', preco: '', custo: '' }); }} className={`px-8 font-black rounded-xl transition ${temaNoturno ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>Cancelar</button>}
                    </div>
                  </div>

                  {/* Tabela de Pesos */}
                  <div className={`rounded-2xl border overflow-hidden ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                    <table className="w-full text-left border-collapse">
                      <thead className={temaNoturno ? 'bg-gray-900/50' : 'bg-gray-50'}>
                        <tr className={`text-[10px] uppercase font-bold tracking-widest ${temaNoturno ? 'text-gray-400 border-b border-gray-700' : 'text-gray-500 border-b border-gray-200'}`}>
                          <th className="p-4">Item p/ Balança</th>
                          <th className="p-4 text-right">Preço Venda</th>
                          <th className="p-4 text-right hidden sm:table-cell">Custo</th>
                          <th className="p-4 text-center">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {configPeso.map(p => (
                          <tr key={p.id} className={`transition text-sm border-b last:border-0 ${temaNoturno ? 'border-gray-700 hover:bg-gray-700/50 text-gray-200' : 'border-gray-100 hover:bg-purple-50 text-gray-800'}`}>
                            <td className="p-4 font-black">{p.nome}</td>
                            <td className="p-4 text-right text-green-500 font-black">R$ {parseFloat(p.preco_kg).toFixed(2)}</td>
                            <td className={`p-4 text-right font-bold hidden sm:table-cell ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`}>R$ {parseFloat(p.custo_kg || 0).toFixed(2)}</td>
                            <td className="p-4 flex justify-center gap-2">
                              <button onClick={() => carregarEdicaoPeso(p)} className={`p-2 rounded-lg transition active:scale-95 ${temaNoturno ? 'bg-gray-900 text-blue-400 hover:bg-blue-900/40' : 'bg-white border text-blue-600 hover:bg-blue-50'}`}>{iconeEditar}</button>
                              <button onClick={() => excluirPeso(p.id)} className={`p-2 rounded-lg transition active:scale-95 ${temaNoturno ? 'bg-gray-900 text-red-400 hover:bg-red-900/40' : 'bg-white border text-red-500 hover:bg-red-50'}`}>{iconeLixeira}</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {configPeso.length === 0 && <p className={`text-center py-10 font-bold ${temaNoturno ? 'text-gray-500' : 'text-gray-400'}`}>Nenhum produto a granel/peso configurado.</p>}
                  </div>
                </div>
              )}

              {/* === PAINEL IMPORTAÇÃO EM MASSA === */}
              {painelAtivo === 'importacao' && (
                <div className="max-w-3xl mx-auto py-4 animate-in slide-in-from-bottom-4 fade-in duration-300 flex flex-col gap-6">
                  <div className={`p-6 rounded-3xl border ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-blue-50 border-blue-100'}`}>
                    <h3 className={`font-black mb-2 flex items-center gap-2 text-lg ${temaNoturno ? 'text-blue-400' : 'text-blue-800'}`}>
                      Integração Inteligente de Catálogo
                    </h3>
                    <p className={`text-sm font-medium mb-4 leading-relaxed ${temaNoturno ? 'text-gray-400' : 'text-gray-700'}`}>
                      Se você tem uma lista longa, poupe tempo! Copie e cole abaixo. Para categorias, use <b>#</b>. Para produtos, separe Nome, Preço e Custo com uma barra (<b>|</b>). <i>Se o custo for omitido, aplicaremos a margem mínima de segurança (10%).</i>
                    </p>
                    <div className={`p-4 rounded-xl text-sm font-mono whitespace-pre-wrap border shadow-inner ${temaNoturno ? 'bg-gray-900 text-gray-300 border-gray-800' : 'bg-white text-gray-700 border-gray-200'}`}>
{`# Moda Masculina
Camisa Polo Azul | 89.90 | 30.00
Calça Jeans | 149.90 | 60.00

# Moda Feminina
Vestido Floral | 120.00 | 45.00
Bolsa de Couro | 250.00`}
                    </div>
                    <p className={`text-xs mt-4 font-bold uppercase tracking-wider ${temaNoturno ? 'text-purple-400' : 'text-purple-600'}`}>
                      Dica: Você pode pedir para uma IA formatar listas de clientes (PDF/Excel) direto neste formato.
                    </p>
                  </div>

                  <textarea 
                    className={`w-full h-72 p-6 rounded-3xl border outline-none font-mono text-sm resize-y transition shadow-inner focus:ring-2 focus:ring-purple-500/50 ${temaNoturno ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'}`}
                    placeholder="Cole os dados do catálogo aqui..."
                    value={textoImportacao}
                    onChange={(e) => setTextoImportacao(e.target.value)}
                  ></textarea>

                  <button 
                    onClick={processarImportacaoMassa}
                    disabled={importando}
                    className={`w-full py-5 font-black text-lg rounded-2xl transition-all shadow-xl active:scale-95 flex justify-center items-center gap-3 ${importando ? 'bg-gray-500 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 text-white'}`}
                  >
                    {importando ? (
                      <span className="animate-pulse">A processar catálogo... aguarde.</span>
                    ) : (
                      <> {iconeUpload} Processar e Importar Catálogo </>
                    )}
                  </button>
                </div>
              )}

            </>
          )}
        </div>
      </div>
    </div>
  );
}