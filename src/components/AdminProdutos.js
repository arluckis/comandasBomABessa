'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import SystemLoader from './SystemLoader'; // <-- NOVO IMPORT

export default function AdminProdutos({ empresaId, onFechar, temaNoturno }) {
  // Estados de Exibição
  const [painelAtivo, setPainelAtivo] = useState('lista'); 
  const [loading, setLoading] = useState(true);
  const [abaMobile, setAbaMobile] = useState('menu'); 
  
  const [notificacao, setNotificacao] = useState({ show: false, tipo: '', mensagem: '' });
  const [categorias, setCategorias] = useState([]);
  const [configPeso, setConfigPeso] = useState([]);
  
  // Filtros
  const [buscaProduto, setBuscaProduto] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');

  // Formulários
  const [novoItem, setNovoItem] = useState({ nome: '', preco: '', custo: '', idCategoria: '', codigo: '' });
  const [editandoItem, setEditandoItem] = useState(null);
  
  const [novaCategoria, setNovaCategoria] = useState('');
  const [editandoCategoriaId, setEditandoCategoriaId] = useState(null);
  const [nomeCategoriaEditando, setNomeCategoriaEditando] = useState('');
  
  const [novoPeso, setNovoPeso] = useState({ nome: '', preco: '', custo: '' });
  const [editandoPeso, setEditandoPeso] = useState(null);
  
  const [textoImportacao, setTextoImportacao] = useState('');
  const [importando, setImportando] = useState(false);

  // Busca de Dados
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

  const mudarPainel = (painel) => {
    setPainelAtivo(painel);
    setAbaMobile('conteudo');
  };

  // --- NOVA FUNÇÃO: GERAR O MENOR NÚMERO DISPONÍVEL ---
  const gerarMenorCodigoDisponivel = () => {
    const codigosExistentes = categorias
      .flatMap(cat => cat.produtos || [])
      .map(p => parseInt(p.codigo))
      .filter(n => !isNaN(n))
      .sort((a, b) => a - b);

    let candidato = 1;
    for (let i = 0; i < codigosExistentes.length; i++) {
      if (codigosExistentes[i] === candidato) {
        candidato++;
      } else if (codigosExistentes[i] > candidato) {
        break;
      }
    }
    return candidato.toString();
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
      return mostrarAviso("Preencha todos os campos obrigatórios.");
    }

    const precoNum = parseFloat(novoItem.preco.toString().replace(',', '.'));
    const custoNum = parseFloat(novoItem.custo.toString().replace(',', '.'));
    
    if (custoNum < precoNum * 0.10) {
      return mostrarAviso("O custo informado não pode ser menor que 10% do valor de venda.");
    }

    const payload = { 
      nome: novoItem.nome, 
      preco: precoNum, 
      custo: custoNum, 
      categoria_id: novoItem.idCategoria, 
      empresa_id: empresaId,
      codigo: novoItem.codigo 
    };
    
    if (editandoItem) { 
      await supabase.from('produtos').update(payload).eq('id', editandoItem.id); 
      mostrarAviso("Produto atualizado!", "sucesso"); 
    } else { 
      await supabase.from('produtos').insert([payload]); 
      mostrarAviso("Produto cadastrado!", "sucesso"); 
    }

    setEditandoItem(null); 
    setNovoItem({ nome: '', preco: '', custo: '', idCategoria: novoItem.idCategoria, codigo: '' }); 
    mudarPainel('lista'); 
    fetchDados();
  };

  const carregarEdicaoProduto = (prod) => {
    setEditandoItem(prod); 
    setNovoItem({ 
      nome: prod.nome, 
      preco: prod.preco, 
      custo: prod.custo || '', 
      idCategoria: prod.categoria_id,
      codigo: prod.codigo || gerarMenorCodigoDisponivel() 
    }); 
    mudarPainel('novo_produto');
  };

  const excluirProduto = async (id) => {
    if (confirm("Deseja excluir este produto definitivamente?")) { 
      await supabase.from('produtos').delete().eq('id', id); fetchDados(); mostrarAviso("Produto excluído.", "sucesso"); 
    }
  };

  // --- LÓGICA DE CATEGORIAS ---
  const salvarCategoria = async () => {
    if (novaCategoria.trim() === '') return mostrarAviso("Digite um nome para a categoria.");
    await supabase.from('categorias').insert([{ nome: novaCategoria, empresa_id: empresaId }]); setNovaCategoria(''); fetchDados(); mostrarAviso("Categoria criada!", "sucesso");
  };

  const salvarEdicaoCategoria = async (id) => {
    if (!nomeCategoriaEditando.trim()) return mostrarAviso("O nome não pode ficar vazio.");
    await supabase.from('categorias').update({ nome: nomeCategoriaEditando }).eq('id', id); setEditandoCategoriaId(null); fetchDados();
  };

  const excluirCategoria = async (id) => {
    if (confirm("ATENÇÃO: Excluir esta categoria apagará TODOS os produtos dentro dela. Continuar?")) { 
      await supabase.from('categorias').delete().eq('id', id); fetchDados(); mostrarAviso("Categoria removida.", "sucesso");
    }
  };

  // --- LÓGICA DE PESO/GRANEL ---
  const salvarPeso = async () => {
    if (!novoPeso.nome || !novoPeso.preco || !novoPeso.custo) return mostrarAviso("Preencha todos os campos do item a granel.");
    const precoNum = parseFloat(novoPeso.preco.toString().replace(',', '.'));
    const custoNum = parseFloat(novoPeso.custo.toString().replace(',', '.'));
    
    if (custoNum < precoNum * 0.10) {
      return mostrarAviso("O custo não pode ser inferior a 10% do valor de venda.");
    }

    const payload = { nome: novoPeso.nome, preco_kg: precoNum, custo_kg: custoNum, empresa_id: empresaId };
    
    if (editandoPeso) { 
      await supabase.from('config_peso').update(payload).eq('id', editandoPeso.id); mostrarAviso("Atualizado com sucesso!", "sucesso");
    } else { 
      await supabase.from('config_peso').insert([payload]); mostrarAviso("Adicionado com sucesso!", "sucesso");
    }
    setEditandoPeso(null); setNovoPeso({ nome: '', preco: '', custo: '' }); fetchDados(); 
  };

  // --- LÓGICA DE IMPORTAÇÃO ---
  const processarImportacaoMassa = async () => {
    if (!textoImportacao.trim()) return mostrarAviso("Cole o texto do catálogo para importar.");
    setImportando(true);

    const linhas = textoImportacao.split('\n');
    let categoriaAtual = '';
    const mapaCategorias = {}; 

    let proximoCodigoImportacao = parseInt(gerarMenorCodigoDisponivel());

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
          const custoAplicado = (custo < preco * 0.1) ? preco * 0.1 : custo;
          mapaCategorias[categoriaAtual].push({ 
            nome, 
            preco, 
            custo: custoAplicado, 
            codigo: proximoCodigoImportacao.toString() 
          });
          proximoCodigoImportacao++;
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
            nome: p.nome, preco: p.preco, custo: p.custo, categoria_id: catId, empresa_id: empresaId, codigo: p.codigo
          }));

          if (produtosParaInserir.length > 0) {
            const { error } = await supabase.from('produtos').insert(produtosParaInserir);
            if (!error) totalAdicionados += produtosParaInserir.length;
          }
        }
      }

      mostrarAviso(`Catálogo atualizado! ${totalAdicionados} itens importados.`, "sucesso");
      setTextoImportacao(''); mudarPainel('lista'); fetchDados();
    } catch (e) {
      mostrarAviso("Ocorreu um erro na importação. Verifique o formato.");
    } finally {
      setImportando(false);
    }
  };

  const categoriasFiltradas = categorias.map(cat => ({
    ...cat, produtos: (cat.produtos || []).filter(p => p.nome.toLowerCase().includes(buscaProduto.toLowerCase()))
  })).filter(cat => (filtroCategoria === '' || cat.id === filtroCategoria) && (buscaProduto === '' || cat.produtos.length > 0));

  return (
    <div className="fixed inset-0 bg-black/80 flex items-start sm:items-center justify-center p-4 sm:p-6 z-[60] backdrop-blur-md overflow-y-auto">
      <div className={`relative w-full max-w-7xl rounded-3xl shadow-2xl animate-in zoom-in-95 border flex flex-col overflow-hidden my-auto shrink-0 transition-colors duration-500 h-[85vh] ${temaNoturno ? 'bg-gradient-to-br from-[#15151e] to-[#0a0a0f] border-gray-800' : 'bg-white border-gray-200'}`}>
        
        {notificacao.show && (
          <div className={`absolute top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full font-bold shadow-xl animate-in slide-in-from-top-4 fade-in duration-300 flex items-center gap-3 ${notificacao.tipo === 'erro' ? 'bg-red-500 text-white border border-red-400' : 'bg-green-500 text-white border border-green-400'}`}>
            {notificacao.mensagem}
          </div>
        )}

        {temaNoturno ? (
          <>
            <div className="absolute -top-32 -right-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none"></div>
          </>
        ) : (
          <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-indigo-50/40 via-transparent to-purple-50/30 pointer-events-none"></div>
        )}

        <div className={`flex justify-between items-center p-5 lg:p-7 border-b relative z-10 shrink-0 ${temaNoturno ? 'border-gray-800/80 bg-[#15151e]/50' : 'border-gray-100 bg-white/50'} backdrop-blur-md`}>
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl shadow-inner ${temaNoturno ? 'bg-gradient-to-br from-purple-500/20 to-indigo-700/10 text-purple-400 border border-purple-500/20' : 'bg-gradient-to-br from-purple-100 to-indigo-50 text-purple-600 border border-purple-200'}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg>
            </div>
            <div>
              <h2 className={`text-xl lg:text-2xl font-black tracking-tight ${temaNoturno ? 'text-gray-100' : 'text-gray-900'}`}>Gestão de Catálogo</h2>
              <p className={`text-xs mt-0.5 font-medium ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`}>Organize produtos, categorias e preços.</p>
            </div>
          </div>
          <button onClick={onFechar} className={`p-2.5 rounded-full font-bold transition active:scale-95 ${temaNoturno ? 'bg-gray-800/80 text-gray-400 hover:text-white hover:bg-gray-700' : 'bg-gray-100 text-gray-400 hover:text-gray-900 hover:bg-gray-200'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <div className={`lg:hidden flex border-b relative z-10 ${temaNoturno ? 'border-gray-800' : 'border-gray-200'}`}>
          {abaMobile === 'conteudo' && (
            <button onClick={() => setAbaMobile('menu')} className={`w-full py-4 text-xs font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2 ${temaNoturno ? 'text-purple-400 bg-gray-900/40' : 'text-purple-600 bg-gray-50/50'}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
              Voltar ao Menu de Opções
            </button>
          )}
        </div>

        <div className="flex flex-col lg:flex-row relative z-10 flex-1 min-h-0">
          
          <div className={`lg:w-72 shrink-0 border-r flex flex-col gap-2 p-4 overflow-y-auto ${abaMobile === 'menu' ? 'flex' : 'hidden lg:flex'} ${temaNoturno ? 'border-gray-800 bg-black/10' : 'border-gray-100 bg-gray-50/30'}`}>
            
            <p className={`text-[10px] font-black uppercase tracking-widest mb-2 px-2 pt-2 ${temaNoturno ? 'text-gray-500' : 'text-gray-400'}`}>Visualização</p>
            <button onClick={() => mudarPainel('lista')} className={`px-4 py-3.5 rounded-xl flex items-center gap-3 text-sm font-bold transition-all ${painelAtivo === 'lista' ? (temaNoturno ? 'bg-purple-900/40 text-purple-400 border border-purple-700/50' : 'bg-white shadow-sm text-purple-700 border border-purple-100') : (temaNoturno ? 'text-gray-400 hover:bg-gray-800/60' : 'text-gray-600 hover:bg-gray-100/60')}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
              Listar Produtos
            </button>

            <p className={`text-[10px] font-black uppercase tracking-widest mb-2 px-2 pt-4 ${temaNoturno ? 'text-gray-500' : 'text-gray-400'}`}>Gerenciamento</p>
            
            <button onClick={() => { 
              setEditandoItem(null); 
              setNovoItem({ nome: '', preco: '', custo: '', idCategoria: '', codigo: gerarMenorCodigoDisponivel() }); 
              mudarPainel('novo_produto'); 
            }} className={`px-4 py-3.5 rounded-xl flex items-center gap-3 text-sm font-bold transition-all ${painelAtivo === 'novo_produto' ? (temaNoturno ? 'bg-purple-900/40 text-purple-400 border border-purple-700/50' : 'bg-white shadow-sm text-purple-700 border border-purple-100') : (temaNoturno ? 'text-gray-400 hover:bg-gray-800/60' : 'text-gray-600 hover:bg-gray-100/60')}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
              Novo Produto
            </button>
            <button onClick={() => mudarPainel('categorias')} className={`px-4 py-3.5 rounded-xl flex items-center gap-3 text-sm font-bold transition-all ${painelAtivo === 'categorias' ? (temaNoturno ? 'bg-purple-900/40 text-purple-400 border border-purple-700/50' : 'bg-white shadow-sm text-purple-700 border border-purple-100') : (temaNoturno ? 'text-gray-400 hover:bg-gray-800/60' : 'text-gray-600 hover:bg-gray-100/60')}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path></svg>
              Categorias
            </button>
            <button onClick={() => mudarPainel('peso')} className={`px-4 py-3.5 rounded-xl flex items-center gap-3 text-sm font-bold transition-all ${painelAtivo === 'peso' ? (temaNoturno ? 'bg-purple-900/40 text-purple-400 border border-purple-700/50' : 'bg-white shadow-sm text-purple-700 border border-purple-100') : (temaNoturno ? 'text-gray-400 hover:bg-gray-800/60' : 'text-gray-600 hover:bg-gray-100/60')}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"></path></svg>
              Venda a Granel
            </button>
            
            <p className={`text-[10px] font-black uppercase tracking-widest mb-2 px-2 pt-4 ${temaNoturno ? 'text-gray-500' : 'text-gray-400'}`}>Avançado</p>
            <button onClick={() => mudarPainel('importacao')} className={`px-4 py-3.5 rounded-xl flex items-center gap-3 text-sm font-bold transition-all ${painelAtivo === 'importacao' ? (temaNoturno ? 'bg-purple-900/40 text-purple-400 border border-purple-700/50' : 'bg-white shadow-sm text-purple-700 border border-purple-100') : (temaNoturno ? 'text-gray-400 hover:bg-gray-800/60' : 'text-gray-600 hover:bg-gray-100/60')}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
              Importar em Massa
            </button>
          </div>

          <div className={`flex-1 p-6 lg:p-8 overflow-y-auto custom-scrollbar ${abaMobile === 'conteudo' ? 'block' : 'hidden lg:block'} ${temaNoturno ? 'bg-transparent' : 'bg-transparent'}`}>
            
            {loading ? (
              // --- USANDO O NOVO COMPONENTE SYSTEMLOADER AQUI ---
              <SystemLoader variant="section" text="Sincronizando catálogo..." />
            ) : (
              <>
                {painelAtivo === 'lista' && (
                  <div className="animate-in fade-in duration-300">
                    <div className={`flex flex-col md:flex-row gap-3 p-3 rounded-2xl border mb-6 ${temaNoturno ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`}>
                      <div className="relative flex-1">
                        <svg className={`w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 ${temaNoturno ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        <input type="text" placeholder="Procurar produto..." value={buscaProduto} onChange={e => setBuscaProduto(e.target.value)} className={`w-full pl-11 pr-4 py-3 rounded-xl border outline-none font-bold text-sm transition focus:border-purple-500 ${temaNoturno ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'}`} />
                      </div>
                      <select value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)} className={`md:w-64 px-4 py-3 rounded-xl border outline-none font-bold text-sm transition focus:border-purple-500 ${temaNoturno ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'}`}>
                        <option value="">Todas as Categorias</option>
                        {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                      </select>
                    </div>

                    {categoriasFiltradas.length === 0 && <p className={`text-center py-10 font-bold ${temaNoturno ? 'text-gray-600' : 'text-gray-400'}`}>Nenhum produto encontrado.</p>}
                    
                    {categoriasFiltradas.map(cat => (
                      <div key={cat.id} className="mb-8">
                        <div className="flex items-center gap-3 mb-4">
                           <h3 className={`text-sm font-black uppercase tracking-widest px-2 ${temaNoturno ? 'text-purple-400' : 'text-purple-600'}`}>{cat.nome}</h3>
                           <div className={`h-px flex-1 ${temaNoturno ? 'bg-gray-800' : 'bg-gray-200'}`}></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {cat.produtos.map(p => (
                             <div key={p.id} className={`p-5 rounded-2xl border flex flex-col justify-between shadow-sm transition-all hover:scale-[1.02] ${temaNoturno ? 'bg-gray-800/80 border-gray-700 hover:border-gray-500' : 'bg-white border-gray-100 hover:border-purple-200 hover:shadow-md'}`}>
                               <div className="flex justify-between items-start mb-4">
                                 <div className="flex flex-col">
                                   {p.codigo && (
                                     <span className={`text-[9px] font-black uppercase tracking-tighter mb-1 px-1.5 py-0.5 rounded w-fit ${temaNoturno ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                                       #{p.codigo}
                                     </span>
                                   )}
                                   <span className={`font-black text-sm tracking-tight ${temaNoturno ? 'text-gray-200' : 'text-gray-800'}`}>{p.nome}</span>
                                 </div>
                               </div>
                               <div className="flex justify-between items-end">
                                 <div className="flex flex-col">
                                   <span className={`font-black tracking-tight text-lg leading-none mb-1 ${temaNoturno ? 'text-green-400' : 'text-green-600'}`}>R$ {p.preco.toFixed(2)}</span>
                                   <span className={`text-[10px] font-bold uppercase tracking-wider ${temaNoturno ? 'text-gray-500' : 'text-gray-400'}`}>Custo: R$ {(p.custo||0).toFixed(2)}</span>
                                 </div>
                                 <div className="flex gap-1.5">
                                   <button onClick={() => carregarEdicaoProduto(p)} className={`p-2.5 rounded-xl transition-colors ${temaNoturno ? 'bg-gray-700 text-blue-400 hover:bg-gray-600' : 'bg-gray-50 text-blue-600 hover:bg-blue-100'}`}><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg></button>
                                   <button onClick={() => excluirProduto(p.id)} className={`p-2.5 rounded-xl transition-colors ${temaNoturno ? 'bg-red-900/20 text-red-400 hover:bg-red-900/40' : 'bg-red-50 text-red-500 hover:bg-red-100'}`}><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                                 </div>
                               </div>
                             </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {painelAtivo === 'novo_produto' && (
                  <div className="max-w-2xl animate-in slide-in-from-bottom-4 fade-in duration-300">
                    <div className={`p-6 lg:p-8 rounded-3xl border shadow-xl ${temaNoturno ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-100'}`}>
                      <h3 className={`text-xs font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-2 ${temaNoturno ? 'text-purple-400' : 'text-purple-600'}`}>
                        {editandoItem ? 'Editar Produto do Catálogo' : 'Cadastrar Novo Produto'}
                      </h3>

                      <div className="mb-8">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                          <span className={temaNoturno ? 'text-gray-400' : 'text-gray-500'}>Progresso do Cadastro</span>
                          <span className={temaNoturno ? 'text-purple-400' : 'text-purple-600'}>{calcularProgressoProduto()}%</span>
                        </div>
                        <div className={`w-full h-2 rounded-full overflow-hidden ${temaNoturno ? 'bg-gray-900' : 'bg-gray-100'}`}>
                          <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500 ease-out" style={{ width: `${calcularProgressoProduto()}%` }}></div>
                        </div>
                      </div>

                      <div className="space-y-5">
                        <div className="group">
                          <label className={`text-[10px] font-black uppercase tracking-widest mb-1.5 block transition-colors ${temaNoturno ? 'text-gray-400 group-focus-within:text-purple-400' : 'text-gray-500 group-focus-within:text-purple-600'}`}>Categoria Obrigatória *</label>
                          <select className={`w-full px-4 py-3.5 rounded-xl border outline-none text-sm font-bold transition-all focus:ring-2 focus:ring-purple-500/20 ${temaNoturno ? 'bg-gray-900/60 border-gray-700/80 focus:border-purple-500 text-white' : 'bg-white border-gray-200 focus:border-purple-500 text-gray-900 shadow-sm'}`} value={novoItem.idCategoria} onChange={e => setNovoItem({...novoItem, idCategoria: e.target.value})}>
                            <option value="">Selecione o setor do produto...</option>
                            {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                          </select>
                        </div>

                        {/* Código Numérico Sequencial Bloqueado */}
                        <div className="group">
                          <label className={`text-[10px] font-black uppercase tracking-widest mb-1.5 block transition-colors ${temaNoturno ? 'text-gray-400 group-focus-within:text-purple-400' : 'text-gray-500 group-focus-within:text-purple-600'}`}>Código de Identificação (Automático)</label>
                          <input type="text" readOnly className={`w-full px-4 py-3.5 rounded-xl border outline-none text-sm font-bold transition-all cursor-not-allowed opacity-70 ${temaNoturno ? 'bg-gray-900/60 border-gray-700 text-gray-400' : 'bg-gray-100 border-gray-200 text-gray-500'}`} value={novoItem.codigo} />
                        </div>

                        <div className="group">
                          <label className={`text-[10px] font-black uppercase tracking-widest mb-1.5 block transition-colors ${temaNoturno ? 'text-gray-400 group-focus-within:text-purple-400' : 'text-gray-500 group-focus-within:text-purple-600'}`}>Nome do Produto *</label>
                          <input type="text" placeholder="Ex: Hambúrguer Artesanal, Cerveja Lata..." className={`w-full px-4 py-3.5 rounded-xl border outline-none text-sm font-bold transition-all focus:ring-2 focus:ring-purple-500/20 ${temaNoturno ? 'bg-gray-900/60 border-gray-700/80 focus:border-purple-500 text-white placeholder-gray-600' : 'bg-white border-gray-200 focus:border-purple-500 text-gray-900 placeholder-gray-400 shadow-sm'}`} value={novoItem.nome} onChange={e => setNovoItem({...novoItem, nome: e.target.value})} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div className="group">
                            <label className={`text-[10px] font-black uppercase tracking-widest mb-1.5 block transition-colors ${temaNoturno ? 'text-gray-400 group-focus-within:text-green-400' : 'text-gray-500 group-focus-within:text-green-600'}`}>Preço de Venda (R$) *</label>
                            <input type="number" step="0.01" placeholder="Ex: 35.00" className={`w-full px-4 py-3.5 rounded-xl border outline-none text-sm font-bold transition-all focus:ring-2 focus:ring-green-500/20 ${temaNoturno ? 'bg-gray-900/60 border-gray-700/80 focus:border-green-500 text-green-400 placeholder-gray-600' : 'bg-white border-gray-200 focus:border-green-500 text-green-700 placeholder-gray-400 shadow-sm'}`} value={novoItem.preco} onChange={e => setNovoItem({...novoItem, preco: e.target.value})} />
                          </div>
                          
                          <div className="group">
                            <label className={`text-[10px] font-black uppercase tracking-widest mb-1.5 flex items-center gap-1 transition-colors ${temaNoturno ? 'text-gray-400 group-focus-within:text-red-400' : 'text-gray-500 group-focus-within:text-red-600'}`}>
                              Custo Real (R$) *
                              <span className="relative group/tooltip flex items-center">
                                <svg className="w-4 h-4 ml-1 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 text-[10px] leading-tight rounded-lg z-20 text-center opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none ${temaNoturno ? 'bg-gray-900 text-gray-300 border border-gray-700' : 'bg-gray-800 text-white'}`}>
                                  Para proteger a saúde do seu caixa, o custo deve ser de no mínimo 10% do valor final de venda.
                                </div>
                              </span>
                            </label>
                            <input type="number" step="0.01" placeholder="Ex: 12.50" className={`w-full px-4 py-3.5 rounded-xl border outline-none text-sm font-bold transition-all focus:ring-2 focus:ring-red-500/20 ${temaNoturno ? 'bg-gray-900/60 border-gray-700/80 focus:border-red-500 text-red-400 placeholder-gray-600' : 'bg-white border-gray-200 focus:border-red-500 text-red-700 placeholder-gray-400 shadow-sm'}`} value={novoItem.custo} onChange={e => setNovoItem({...novoItem, custo: e.target.value})} />
                          </div>
                        </div>

                        <div className="pt-4">
                          <button disabled={calcularProgressoProduto() !== 100} onClick={salvarProduto} className={`w-full font-black py-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 group ${calcularProgressoProduto() === 100 ? (temaNoturno ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-900/20 active:scale-95' : 'bg-gray-900 hover:bg-black text-white shadow-gray-900/20 active:scale-95') : (temaNoturno ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed')}`}>
                            {editandoItem ? 'Atualizar no Catálogo' : 'Finalizar Cadastro'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {painelAtivo === 'categorias' && (
                  <div className="max-w-3xl animate-in slide-in-from-bottom-4 fade-in duration-300">
                    <div className={`p-6 rounded-3xl border mb-8 shadow-sm ${temaNoturno ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-100'}`}>
                      <h3 className={`text-xs font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2 ${temaNoturno ? 'text-purple-400' : 'text-purple-600'}`}>Criar Nova Categoria</h3>
                      <div className="flex flex-col md:flex-row gap-3">
                        <input type="text" placeholder="Nome da categoria (Ex: Bebidas, Sobremesas...)" value={novaCategoria} onChange={e => setNovaCategoria(e.target.value)} onKeyDown={e => e.key === 'Enter' && salvarCategoria()} className={`flex-1 px-4 py-3.5 rounded-xl border outline-none text-sm font-bold transition-all focus:ring-2 focus:ring-purple-500/20 ${temaNoturno ? 'bg-gray-900/60 border-gray-700/80 focus:border-purple-500 text-white placeholder-gray-600' : 'bg-white border-gray-200 focus:border-purple-500 text-gray-900 placeholder-gray-400 shadow-sm'}`} />
                        <button onClick={salvarCategoria} className={`px-8 font-black py-3.5 rounded-xl transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2 ${temaNoturno ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-900/20' : 'bg-gray-900 hover:bg-black text-white shadow-gray-900/20'}`}>
                          Adicionar
                        </button>
                      </div>
                    </div>

                    <h3 className={`text-xs font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2 ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`}>Categorias Existentes ({categorias.length})</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {categorias.map(cat => (
                        <div key={cat.id} className={`p-4 rounded-2xl border flex flex-col justify-between transition-all ${temaNoturno ? 'bg-gray-800/80 border-gray-700 hover:border-gray-500' : 'bg-white border-gray-200 hover:border-purple-200 shadow-sm'}`}>
                          {editandoCategoriaId === cat.id ? (
                             <div className="flex flex-col gap-3">
                               <input autoFocus type="text" className={`w-full px-3 py-2 rounded-lg border text-sm font-bold outline-none ${temaNoturno ? 'bg-gray-900 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'}`} value={nomeCategoriaEditando} onChange={(e) => setNomeCategoriaEditando(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && salvarEdicaoCategoria(cat.id)} />
                               <div className="flex gap-2">
                                 <button onClick={() => salvarEdicaoCategoria(cat.id)} className="flex-1 py-2 bg-green-500 text-white text-xs font-bold rounded-lg hover:bg-green-600 transition">Salvar</button>
                                 <button onClick={() => setEditandoCategoriaId(null)} className="flex-1 py-2 bg-gray-400 text-white text-xs font-bold rounded-lg hover:bg-gray-500 transition">Cancelar</button>
                               </div>
                             </div>
                          ) : (
                            <>
                              <div className="flex items-center justify-between mb-3">
                                <span className={`font-black tracking-tight ${temaNoturno ? 'text-gray-200' : 'text-gray-800'}`}>{cat.nome}</span>
                                <span className={`px-2 py-1 rounded-lg text-[10px] font-bold tracking-widest uppercase ${temaNoturno ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>{cat.produtos?.length || 0} itens</span>
                              </div>
                              <div className="flex gap-2 border-t pt-3 mt-auto justify-end ${temaNoturno ? 'border-gray-700' : 'border-gray-100'}">
                                <button onClick={() => { setEditandoCategoriaId(cat.id); setNomeCategoriaEditando(cat.nome); }} className={`p-2 rounded-xl transition active:scale-95 ${temaNoturno ? 'bg-gray-700 text-blue-400 hover:bg-gray-600' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg></button>
                                <button onClick={() => excluirCategoria(cat.id)} className={`p-2 rounded-xl transition active:scale-95 ${temaNoturno ? 'bg-red-900/20 text-red-400 hover:bg-red-900/40' : 'bg-red-50 text-red-500 hover:bg-red-100'}`}><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {painelAtivo === 'peso' && (
                  <div className="max-w-4xl animate-in slide-in-from-bottom-4 fade-in duration-300">
                    <div className={`p-6 lg:p-8 rounded-3xl border mb-8 shadow-xl ${temaNoturno ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-100'}`}>
                      <h3 className={`text-xs font-black uppercase tracking-[0.2em] mb-1 flex items-center gap-2 ${temaNoturno ? 'text-purple-400' : 'text-purple-600'}`}>
                        {editandoPeso ? 'Editar Medida/Granel' : 'Cadastrar Item por Peso/Medida'}
                      </h3>
                      <p className={`text-[10px] font-bold uppercase tracking-wider mb-6 ${temaNoturno ? 'text-gray-500' : 'text-gray-400'}`}>Configure valores por KG, Litro ou Metro.</p>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="group">
                          <label className={`text-[10px] font-black uppercase tracking-widest mb-1.5 block transition-colors ${temaNoturno ? 'text-gray-400 group-focus-within:text-purple-400' : 'text-gray-500 group-focus-within:text-purple-600'}`}>Nome do Item *</label>
                          <input type="text" placeholder="Ex: Açaí, Queijo, Porção..." className={`w-full px-4 py-3.5 rounded-xl border outline-none text-sm font-bold transition-all focus:ring-2 focus:ring-purple-500/20 ${temaNoturno ? 'bg-gray-900/60 border-gray-700/80 focus:border-purple-500 text-white placeholder-gray-600' : 'bg-white border-gray-200 focus:border-purple-500 text-gray-900 placeholder-gray-400 shadow-sm'}`} value={novoPeso.nome} onChange={e => setNovoPeso({...novoPeso, nome: e.target.value})} />
                        </div>
                        <div className="group">
                          <label className={`text-[10px] font-black uppercase tracking-widest mb-1.5 block transition-colors ${temaNoturno ? 'text-gray-400 group-focus-within:text-green-400' : 'text-gray-500 group-focus-within:text-green-600'}`}>Preço (KG/Unid) *</label>
                          <input type="number" step="0.01" placeholder="Ex: 59.90" className={`w-full px-4 py-3.5 rounded-xl border outline-none text-sm font-bold transition-all focus:ring-2 focus:ring-green-500/20 ${temaNoturno ? 'bg-gray-900/60 border-gray-700/80 focus:border-green-500 text-green-400 placeholder-gray-600' : 'bg-white border-gray-200 focus:border-green-500 text-green-700 placeholder-gray-400 shadow-sm'}`} value={novoPeso.preco} onChange={e => setNovoPeso({...novoPeso, preco: e.target.value})} />
                        </div>
                        <div className="group">
                          <label className={`text-[10px] font-black uppercase tracking-widest mb-1.5 flex items-center gap-1 transition-colors ${temaNoturno ? 'text-gray-400 group-focus-within:text-red-400' : 'text-gray-500 group-focus-within:text-red-600'}`}>
                            Custo Real *
                            <span className="relative group/tooltip flex items-center">
                              <svg className="w-4 h-4 ml-1 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                              <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 text-[10px] leading-tight rounded-lg z-20 text-center opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none ${temaNoturno ? 'bg-gray-900 text-gray-300 border border-gray-700' : 'bg-gray-800 text-white'}`}>
                                Obrigatório ser no mínimo 10% do valor de venda.
                              </div>
                            </span>
                          </label>
                          <input type="number" step="0.01" placeholder="Ex: 15.00" className={`w-full px-4 py-3.5 rounded-xl border outline-none text-sm font-bold transition-all focus:ring-2 focus:ring-red-500/20 ${temaNoturno ? 'bg-gray-900/60 border-gray-700/80 focus:border-red-500 text-red-400 placeholder-gray-600' : 'bg-white border-gray-200 focus:border-red-500 text-red-700 placeholder-gray-400 shadow-sm'}`} value={novoPeso.custo} onChange={e => setNovoPeso({...novoPeso, custo: e.target.value})} />
                        </div>
                      </div>

                      <div className="md:col-span-3 pt-5 flex flex-col md:flex-row gap-3">
                         <button onClick={salvarPeso} className={`flex-1 font-black py-4 rounded-xl transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2 ${temaNoturno ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-900/20' : 'bg-gray-900 hover:bg-black text-white shadow-gray-900/20'}`}>
                           {editandoPeso ? 'Atualizar Configuração' : 'Adicionar Nova Medida'}
                         </button>
                         {editandoPeso && (
                           <button onClick={() => { setEditandoPeso(null); setNovoPeso({ nome: '', preco: '', custo: '' }); }} className={`px-8 font-black rounded-xl transition-all ${temaNoturno ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                             Cancelar
                           </button>
                         )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {configPeso.map(p => (
                        <div key={p.id} className={`p-5 rounded-2xl border flex flex-col justify-between shadow-sm transition-all ${temaNoturno ? 'bg-gray-800/80 border-gray-700 hover:border-gray-500' : 'bg-white border-gray-100 hover:border-purple-200'}`}>
                           <div className="flex justify-between items-start mb-4">
                             <span className={`font-black text-sm tracking-tight ${temaNoturno ? 'text-gray-200' : 'text-gray-800'}`}>{p.nome}</span>
                           </div>
                           <div className="flex justify-between items-end">
                             <div className="flex flex-col">
                               <span className={`font-black tracking-tight text-lg leading-none mb-1 ${temaNoturno ? 'text-green-400' : 'text-green-600'}`}>R$ {parseFloat(p.preco_kg).toFixed(2)}</span>
                               <span className={`text-[10px] font-bold uppercase tracking-wider ${temaNoturno ? 'text-gray-500' : 'text-gray-400'}`}>Custo base: R$ {(p.custo_kg||0).toFixed(2)}</span>
                             </div>
                             <div className="flex gap-1.5">
                               <button onClick={() => {setEditandoPeso(p); setNovoPeso({ nome: p.nome, preco: p.preco_kg, custo: p.custo_kg || '' });}} className={`p-2.5 rounded-xl transition-colors ${temaNoturno ? 'bg-gray-700 text-blue-400 hover:bg-gray-600' : 'bg-gray-50 text-blue-600 hover:bg-blue-100'}`}><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg></button>
                               <button onClick={async () => { if(confirm("Remover opção?")) { await supabase.from('config_peso').delete().eq('id', p.id); fetchDados(); } }} className={`p-2.5 rounded-xl transition-colors ${temaNoturno ? 'bg-red-900/20 text-red-400 hover:bg-red-900/40' : 'bg-red-50 text-red-500 hover:bg-red-100'}`}><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                             </div>
                           </div>
                        </div>
                      ))}
                      {configPeso.length === 0 && <p className={`col-span-full text-center py-10 font-bold ${temaNoturno ? 'text-gray-600' : 'text-gray-400'}`}>Nenhum produto a granel/peso configurado.</p>}
                    </div>
                  </div>
                )}

                {painelAtivo === 'importacao' && (
                  <div className="max-w-3xl animate-in slide-in-from-bottom-4 fade-in duration-300">
                    <div className={`p-6 md:p-8 rounded-3xl border mb-6 shadow-sm ${temaNoturno ? 'bg-gray-800/50 border-gray-700' : 'bg-indigo-50/50 border-indigo-100'}`}>
                      <h3 className={`text-lg font-black mb-3 flex items-center gap-2 ${temaNoturno ? 'text-indigo-400' : 'text-indigo-800'}`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                        Importação Inteligente
                      </h3>
                      <p className={`text-sm font-medium mb-4 leading-relaxed ${temaNoturno ? 'text-gray-300' : 'text-gray-700'}`}>
                        Copie e cole listas inteiras para agilizar seu cadastro. O sistema criará categorias automaticamente.
                      </p>
                      <ul className={`text-xs font-bold space-y-2 mb-6 p-4 rounded-2xl ${temaNoturno ? 'bg-gray-900/50 text-gray-400' : 'bg-white text-gray-600 shadow-sm'}`}>
                        <li className="flex gap-2 items-start"><span className="text-indigo-500">•</span> Para indicar uma <b>Categoria</b>, inicie a linha com "<b>#</b>".</li>
                        <li className="flex gap-2 items-start"><span className="text-indigo-500">•</span> Para indicar um <b>Produto</b>, separe com barra (<b>|</b>) da seguinte forma: <br/><code>Nome do Produto | Preço | Custo Real</code></li>
                        <li className="flex gap-2 items-start text-red-400"><span className="text-red-500">•</span> IMPORTANTE: Se o custo for omitido ou for menor que 10%, aplicaremos nossa margem automática de segurança de 10% do valor de venda.</li>
                      </ul>
                      
                      <div className={`p-4 rounded-xl text-xs font-mono whitespace-pre-wrap border ${temaNoturno ? 'bg-black/40 text-gray-400 border-gray-800' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
{`# Sanduíches
Hambúrguer Duplo | 45.90 | 18.00
X-Bacon | 32.00 | 12.00

# Bebidas
Refrigerante Lata | 8.00 | 3.50
Cerveja Garrafa | 15.00`}
                      </div>
                    </div>

                    <textarea 
                      className={`w-full h-72 p-6 rounded-3xl border outline-none font-mono text-sm resize-y transition-all shadow-inner focus:ring-2 focus:ring-indigo-500/30 ${temaNoturno ? 'bg-gray-900/80 border-gray-700 text-white placeholder-gray-600' : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400'}`}
                      placeholder="Cole sua lista de produtos aqui..."
                      value={textoImportacao}
                      onChange={(e) => setTextoImportacao(e.target.value)}
                    ></textarea>

                    <button 
                      onClick={processarImportacaoMassa}
                      disabled={importando || !textoImportacao.trim()}
                      className={`w-full py-5 font-black text-lg rounded-2xl transition-all shadow-xl mt-6 flex justify-center items-center gap-3 ${importando ? 'bg-gray-600 cursor-wait text-gray-300' : (textoImportacao.trim() ? (temaNoturno ? 'bg-indigo-600 hover:bg-indigo-500 text-white active:scale-95' : 'bg-gray-900 hover:bg-black text-white active:scale-95') : (temaNoturno ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed'))}`}
                    >
                      {importando ? (
                        // --- USANDO O NOVO COMPONENTE SYSTEMLOADER AQUI ---
                        <div className="flex items-center justify-center gap-3 w-full">
                          <SystemLoader variant="inline" />
                          <span>Processando Catálogo...</span>
                        </div>
                      ) : (
                        'Processar e Importar Lista'
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}