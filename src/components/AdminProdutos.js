'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminProdutos({ empresaId, temaNoturno }) {
  const [painelAtivo, setPainelAtivo] = useState('lista'); 
  const [loading, setLoading] = useState(true);
  const [abaMobile, setAbaMobile] = useState('menu'); 
  
  const [notificacao, setNotificacao] = useState({ show: false, tipo: '', mensagem: '' });
  const [categorias, setCategorias] = useState([]);
  const [configPeso, setConfigPeso] = useState([]);
  
  const [buscaProduto, setBuscaProduto] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');

  const [novoItem, setNovoItem] = useState({ nome: '', preco: '', custo: '', idCategoria: '', codigo: '' });
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

  useEffect(() => { if(empresaId) fetchDados(); }, [empresaId]);

  const mostrarAviso = (mensagem, tipo = 'erro') => {
    setNotificacao({ show: true, tipo, mensagem });
    setTimeout(() => setNotificacao({ show: false, tipo: '', mensagem: '' }), 4000);
  };

  const mudarPainel = (painel) => { setPainelAtivo(painel); setAbaMobile('conteudo'); };

  const gerarMenorCodigoDisponivel = () => {
    const codigosExistentes = categorias.flatMap(cat => cat.produtos || []).map(p => parseInt(p.codigo)).filter(n => !isNaN(n)).sort((a, b) => a - b);
    let candidato = 1;
    for (let i = 0; i < codigosExistentes.length; i++) {
      if (codigosExistentes[i] === candidato) candidato++;
      else if (codigosExistentes[i] > candidato) break;
    }
    return candidato.toString();
  };

  const calcularProgressoProduto = () => {
    let p = 0;
    if (novoItem.idCategoria) p += 25;
    if (novoItem.nome) p += 25;
    if (novoItem.preco) p += 25;
    if (novoItem.custo) p += 25;
    return p;
  };

  const salvarProduto = async () => {
    if (!novoItem.nome || !novoItem.preco || !novoItem.idCategoria || !novoItem.custo) return mostrarAviso("Preencha todos os campos obrigatórios.");
    const precoNum = parseFloat(novoItem.preco.toString().replace(',', '.'));
    const custoNum = parseFloat(novoItem.custo.toString().replace(',', '.'));
    if (custoNum < precoNum * 0.10) return mostrarAviso("O custo informado não pode ser menor que 10% do valor de venda.");

    const payload = { nome: novoItem.nome, preco: precoNum, custo: custoNum, categoria_id: novoItem.idCategoria, empresa_id: empresaId, codigo: novoItem.codigo };
    if (editandoItem) { await supabase.from('produtos').update(payload).eq('id', editandoItem.id); mostrarAviso("Produto atualizado!", "sucesso"); } 
    else { await supabase.from('produtos').insert([payload]); mostrarAviso("Produto cadastrado!", "sucesso"); }
    setEditandoItem(null); setNovoItem({ nome: '', preco: '', custo: '', idCategoria: novoItem.idCategoria, codigo: '' }); mudarPainel('lista'); fetchDados();
  };

  const carregarEdicaoProduto = (prod) => {
    setEditandoItem(prod); 
    setNovoItem({ nome: prod.nome, preco: prod.preco, custo: prod.custo || '', idCategoria: prod.categoria_id, codigo: prod.codigo || gerarMenorCodigoDisponivel() }); 
    mudarPainel('novo_produto');
  };

  const excluirProduto = async (id) => { if (confirm("Deseja excluir este produto definitivamente?")) { await supabase.from('produtos').delete().eq('id', id); fetchDados(); mostrarAviso("Produto excluído.", "sucesso"); } };
  const salvarCategoria = async () => { if (novaCategoria.trim() === '') return mostrarAviso("Digite um nome para a categoria."); await supabase.from('categorias').insert([{ nome: novaCategoria, empresa_id: empresaId }]); setNovaCategoria(''); fetchDados(); mostrarAviso("Categoria criada!", "sucesso"); };
  const salvarEdicaoCategoria = async (id) => { if (!nomeCategoriaEditando.trim()) return mostrarAviso("O nome não pode ficar vazio."); await supabase.from('categorias').update({ nome: nomeCategoriaEditando }).eq('id', id); setEditandoCategoriaId(null); fetchDados(); };
  const excluirCategoria = async (id) => { if (confirm("ATENÇÃO: Excluir esta categoria apagará TODOS os produtos dentro dela. Continuar?")) { await supabase.from('categorias').delete().eq('id', id); fetchDados(); mostrarAviso("Categoria removida.", "sucesso"); } };

  const salvarPeso = async () => {
    if (!novoPeso.nome || !novoPeso.preco || !novoPeso.custo) return mostrarAviso("Preencha todos os campos.");
    const precoNum = parseFloat(novoPeso.preco.toString().replace(',', '.'));
    const custoNum = parseFloat(novoPeso.custo.toString().replace(',', '.'));
    if (custoNum < precoNum * 0.10) return mostrarAviso("O custo não pode ser inferior a 10% do valor.");
    const payload = { nome: novoPeso.nome, preco_kg: precoNum, custo_kg: custoNum, empresa_id: empresaId };
    if (editandoPeso) { await supabase.from('config_peso').update(payload).eq('id', editandoPeso.id); mostrarAviso("Atualizado com sucesso!", "sucesso"); } 
    else { await supabase.from('config_peso').insert([payload]); mostrarAviso("Adicionado com sucesso!", "sucesso"); }
    setEditandoPeso(null); setNovoPeso({ nome: '', preco: '', custo: '' }); fetchDados(); 
  };

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
        if (!categoriaAtual) { categoriaAtual = 'Geral'; if (!mapaCategorias[categoriaAtual]) mapaCategorias[categoriaAtual] = []; }
        const partes = linha.split('|').map(p => p.trim());
        const nome = partes[0]; const preco = parseFloat((partes[1] || '0').replace(',', '.')); const custo = parseFloat((partes[2] || '0').replace(',', '.'));
        if (nome && !isNaN(preco)) {
          const custoAplicado = (custo < preco * 0.1) ? preco * 0.1 : custo;
          mapaCategorias[categoriaAtual].push({ nome, preco, custo: custoAplicado, codigo: proximoCodigoImportacao.toString() });
          proximoCodigoImportacao++;
        }
      }
    }
    try {
      const categoriasExistentes = [...categorias];
      const mapCatIds = {}; categoriasExistentes.forEach(c => mapCatIds[c.nome.toLowerCase()] = c.id);
      let totalAdicionados = 0;
      for (const catNome of Object.keys(mapaCategorias)) {
        let catId = mapCatIds[catNome.toLowerCase()];
        if (!catId) { const { data: novaCat } = await supabase.from('categorias').insert([{ nome: catNome, empresa_id: empresaId }]).select().single(); if (novaCat) { catId = novaCat.id; mapCatIds[catNome.toLowerCase()] = catId; } }
        if (catId) {
          const produtosParaInserir = mapaCategorias[catNome].map(p => ({ nome: p.nome, preco: p.preco, custo: p.custo, categoria_id: catId, empresa_id: empresaId, codigo: p.codigo }));
          if (produtosParaInserir.length > 0) { const { error } = await supabase.from('produtos').insert(produtosParaInserir); if (!error) totalAdicionados += produtosParaInserir.length; }
        }
      }
      mostrarAviso(`Catálogo atualizado! ${totalAdicionados} itens importados.`, "sucesso"); setTextoImportacao(''); mudarPainel('lista'); fetchDados();
    } catch (e) { mostrarAviso("Erro na importação."); } finally { setImportando(false); }
  };

  const categoriasFiltradas = categorias.map(cat => ({ ...cat, produtos: (cat.produtos || []).filter(p => p.nome.toLowerCase().includes(buscaProduto.toLowerCase())) })).filter(cat => (filtroCategoria === '' || cat.id === filtroCategoria) && (buscaProduto === '' || cat.produtos.length > 0));

  const labelArox = `text-[10px] font-bold uppercase tracking-widest block mb-1.5 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`;
  const inputArox = `w-full px-4 py-3.5 rounded-xl border outline-none text-sm font-bold transition-all shadow-sm focus:ring-1 focus:ring-offset-0 ${temaNoturno ? 'bg-white/[0.02] border-white/10 focus:border-white/20 focus:ring-white/20 text-white placeholder-zinc-600' : 'bg-black/[0.02] border-zinc-200 focus:border-zinc-300 focus:ring-zinc-200 text-zinc-900 placeholder-zinc-400'}`;
  const btnSecundario = `px-4 py-3.5 rounded-xl flex items-center gap-3 text-sm font-bold transition-all ${temaNoturno ? 'text-zinc-400 hover:bg-white/5 hover:text-white' : 'text-zinc-600 hover:bg-black/5 hover:text-black'}`;
  const btnSecundarioAtivo = `px-4 py-3.5 rounded-xl flex items-center gap-3 text-sm font-bold transition-all ${temaNoturno ? 'bg-white/10 text-white border border-white/10' : 'bg-white shadow-sm text-zinc-900 border border-zinc-200'}`;

  return (
    <div className="flex flex-col lg:flex-row h-full w-full relative">
      {notificacao.show && (
        <div className={`absolute top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full text-xs font-bold shadow-xl animate-in fade-in duration-300 ${notificacao.tipo === 'erro' ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'}`}>
          {notificacao.mensagem}
        </div>
      )}

      <div className={`lg:w-64 shrink-0 border-r flex flex-col gap-2 p-4 overflow-y-auto scrollbar-hide ${abaMobile === 'menu' ? 'flex' : 'hidden lg:flex'} ${temaNoturno ? 'border-white/[0.06] bg-[#0A0A0A]/50' : 'border-zinc-200 bg-zinc-50/50'}`}>
        <p className={labelArox}>Visualização</p>
        <button onClick={() => mudarPainel('lista')} className={painelAtivo === 'lista' ? btnSecundarioAtivo : btnSecundario}>Listar Produtos</button>
        <p className={`mt-4 ${labelArox}`}>Gerenciamento</p>
        <button onClick={() => { setEditandoItem(null); setNovoItem({ nome: '', preco: '', custo: '', idCategoria: '', codigo: gerarMenorCodigoDisponivel() }); mudarPainel('novo_produto'); }} className={painelAtivo === 'novo_produto' ? btnSecundarioAtivo : btnSecundario}>Novo Produto</button>
        <button onClick={() => mudarPainel('categorias')} className={painelAtivo === 'categorias' ? btnSecundarioAtivo : btnSecundario}>Categorias</button>
        <button onClick={() => mudarPainel('peso')} className={painelAtivo === 'peso' ? btnSecundarioAtivo : btnSecundario}>Venda a Granel</button>
        <p className={`mt-4 ${labelArox}`}>Avançado</p>
        <button onClick={() => mudarPainel('importacao')} className={painelAtivo === 'importacao' ? btnSecundarioAtivo : btnSecundario}>Importar em Massa</button>
      </div>

      <div className={`lg:hidden flex border-b relative z-10 ${temaNoturno ? 'border-white/5' : 'border-zinc-200'}`}>
        {abaMobile === 'conteudo' && <button onClick={() => setAbaMobile('menu')} className={`w-full py-4 text-[10px] font-bold uppercase tracking-widest ${temaNoturno ? 'text-zinc-400' : 'text-zinc-600'}`}>← Voltar ao Menu</button>}
      </div>

      <div className={`flex-1 p-6 lg:p-8 overflow-y-auto scrollbar-hide ${abaMobile === 'conteudo' ? 'block' : 'hidden lg:block'}`}>
        {loading ? (
          <div className="flex flex-col items-center justify-center w-full h-full gap-4 text-zinc-500">
            <svg className="animate-spin h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            <p className="text-[12px] font-bold uppercase tracking-widest">Sincronizando catálogo...</p>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto w-full">
            {painelAtivo === 'lista' && (
              <div className="animate-in fade-in duration-300">
                <div className="flex flex-col md:flex-row gap-3 mb-8">
                  <input type="text" placeholder="Procurar produto..." value={buscaProduto} onChange={e => setBuscaProduto(e.target.value)} className={inputArox} />
                  <select value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)} className={`${inputArox} md:w-64`}>
                    <option value="">Todas as Categorias</option>
                    {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </div>
                {categoriasFiltradas.length === 0 && <p className={`text-center py-10 text-[13px] font-medium ${temaNoturno ? 'text-zinc-600' : 'text-zinc-400'}`}>Nenhum produto encontrado.</p>}
                {categoriasFiltradas.map(cat => (
                  <div key={cat.id} className="mb-8">
                    <h3 className={labelArox}>{cat.nome}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">
                      {cat.produtos.map(p => (
                        <div key={p.id} className={`p-5 rounded-2xl border flex flex-col justify-between shadow-sm transition-all hover:scale-[1.01] ${temaNoturno ? 'bg-[#111111] border-white/[0.06] hover:border-white/20' : 'bg-white border-zinc-200 hover:border-black/20'}`}>
                          <div className="flex flex-col mb-4">
                            {p.codigo && <span className={`text-[9px] font-bold uppercase tracking-widest mb-1.5 px-2 py-0.5 rounded w-fit ${temaNoturno ? 'bg-white/10 text-zinc-400' : 'bg-black/5 text-zinc-500'}`}>#{p.codigo}</span>}
                            <span className="font-bold text-[14px] leading-tight">{p.nome}</span>
                          </div>
                          <div className="flex justify-between items-end">
                            <div className="flex flex-col">
                              <span className={`font-bold tracking-tight text-lg leading-none mb-1 ${temaNoturno ? 'text-emerald-400' : 'text-emerald-600'}`}>R$ {p.preco.toFixed(2)}</span>
                              <span className={`text-[10px] font-bold uppercase tracking-wider ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}`}>Custo: R$ {(p.custo||0).toFixed(2)}</span>
                            </div>
                            <div className="flex gap-1.5">
                              <button onClick={() => carregarEdicaoProduto(p)} className={`p-2.5 rounded-lg transition-colors ${temaNoturno ? 'bg-white/5 text-zinc-400 hover:text-white' : 'bg-black/5 text-zinc-500 hover:text-black'}`}><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg></button>
                              <button onClick={() => excluirProduto(p.id)} className={`p-2.5 rounded-lg transition-colors ${temaNoturno ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20' : 'bg-rose-50 text-rose-600 hover:bg-rose-100'}`}><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
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
              <div className="max-w-2xl animate-in fade-in duration-300">
                <div className={`p-6 lg:p-8 rounded-[24px] border shadow-sm ${temaNoturno ? 'bg-[#111111] border-white/[0.06]' : 'bg-white border-zinc-200'}`}>
                  <h3 className={labelArox}>{editandoItem ? 'Editar Produto' : 'Cadastrar Produto'}</h3>
                  <div className="space-y-5 mt-6">
                    <div className="group">
                      <label className={labelArox}>Categoria *</label>
                      <select className={inputArox} value={novoItem.idCategoria} onChange={e => setNovoItem({...novoItem, idCategoria: e.target.value})}>
                        <option value="">Selecione o setor...</option>
                        {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                      </select>
                    </div>
                    <div className="group">
                      <label className={labelArox}>Código (Automático)</label>
                      <input type="text" readOnly className={`${inputArox} opacity-50 cursor-not-allowed`} value={novoItem.codigo} />
                    </div>
                    <div className="group">
                      <label className={labelArox}>Nome do Produto *</label>
                      <input type="text" placeholder="Ex: Hambúrguer Artesanal..." className={inputArox} value={novoItem.nome} onChange={e => setNovoItem({...novoItem, nome: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="group">
                        <label className={labelArox}>Preço de Venda (R$) *</label>
                        <input type="number" step="0.01" placeholder="Ex: 35.00" className={inputArox} value={novoItem.preco} onChange={e => setNovoItem({...novoItem, preco: e.target.value})} />
                      </div>
                      <div className="group">
                        <label className={labelArox}>Custo Real (R$) * (Mín 10%)</label>
                        <input type="number" step="0.01" placeholder="Ex: 12.50" className={inputArox} value={novoItem.custo} onChange={e => setNovoItem({...novoItem, custo: e.target.value})} />
                      </div>
                    </div>
                    <button disabled={calcularProgressoProduto() !== 100} onClick={salvarProduto} className={`w-full py-4 rounded-xl text-[13px] font-bold transition-all mt-4 ${calcularProgressoProduto() === 100 ? (temaNoturno ? 'bg-white text-zinc-900 active:scale-95' : 'bg-zinc-900 text-white active:scale-95') : (temaNoturno ? 'bg-white/5 text-zinc-600 cursor-not-allowed' : 'bg-black/5 text-zinc-400 cursor-not-allowed')}`}>
                      {editandoItem ? 'Atualizar Catálogo' : 'Finalizar Cadastro'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {painelAtivo === 'categorias' && (
              <div className="max-w-3xl animate-in fade-in duration-300">
                <div className={`p-6 rounded-[24px] border mb-8 shadow-sm ${temaNoturno ? 'bg-[#111111] border-white/[0.06]' : 'bg-white border-zinc-200'}`}>
                  <h3 className={labelArox}>Criar Nova Categoria</h3>
                  <div className="flex flex-col md:flex-row gap-3 mt-4">
                    <input type="text" placeholder="Ex: Bebidas..." value={novaCategoria} onChange={e => setNovaCategoria(e.target.value)} onKeyDown={e => e.key === 'Enter' && salvarCategoria()} className={inputArox} />
                    <button onClick={salvarCategoria} className={`px-8 py-3.5 rounded-xl text-[13px] font-bold transition-all active:scale-95 ${temaNoturno ? 'bg-white text-zinc-900' : 'bg-zinc-900 text-white'}`}>Adicionar</button>
                  </div>
                </div>
                <h3 className={labelArox}>Categorias Existentes</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {categorias.map(cat => (
                    <div key={cat.id} className={`p-4 rounded-2xl border flex flex-col justify-between transition-all ${temaNoturno ? 'bg-[#111111] border-white/[0.06]' : 'bg-white border-zinc-200'}`}>
                      {editandoCategoriaId === cat.id ? (
                         <div className="flex flex-col gap-3">
                           <input autoFocus type="text" className={inputArox} value={nomeCategoriaEditando} onChange={(e) => setNomeCategoriaEditando(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && salvarEdicaoCategoria(cat.id)} />
                           <div className="flex gap-2">
                             <button onClick={() => salvarEdicaoCategoria(cat.id)} className="flex-1 py-2 bg-emerald-500 text-white text-[11px] font-bold uppercase rounded-lg">Salvar</button>
                             <button onClick={() => setEditandoCategoriaId(null)} className={`flex-1 py-2 text-[11px] font-bold uppercase rounded-lg ${temaNoturno ? 'bg-white/10 text-white' : 'bg-black/10 text-zinc-900'}`}>Cancelar</button>
                           </div>
                         </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-bold text-[14px]">{cat.nome}</span>
                            <span className={`px-2 py-1 rounded-md text-[9px] font-bold tracking-widest uppercase ${temaNoturno ? 'bg-white/10 text-zinc-400' : 'bg-black/5 text-zinc-500'}`}>{cat.produtos?.length || 0} itens</span>
                          </div>
                          <div className={`flex gap-2 border-t pt-3 mt-auto justify-end ${temaNoturno ? 'border-white/[0.06]' : 'border-zinc-100'}`}>
                            <button onClick={() => { setEditandoCategoriaId(cat.id); setNomeCategoriaEditando(cat.nome); }} className={`p-2 rounded-lg transition ${temaNoturno ? 'bg-white/5 text-zinc-400 hover:text-white' : 'bg-black/5 text-zinc-500 hover:text-black'}`}><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg></button>
                            <button onClick={() => excluirCategoria(cat.id)} className={`p-2 rounded-lg transition ${temaNoturno ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20' : 'bg-rose-50 text-rose-600 hover:bg-rose-100'}`}><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {painelAtivo === 'peso' && (
              <div className="max-w-4xl animate-in fade-in duration-300">
                <div className={`p-6 lg:p-8 rounded-[24px] border mb-8 shadow-sm ${temaNoturno ? 'bg-[#111111] border-white/[0.06]' : 'bg-white border-zinc-200'}`}>
                  <h3 className={labelArox}>{editandoPeso ? 'Editar Medida' : 'Cadastrar Venda a Granel'}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
                    <div className="group"><label className={labelArox}>Nome (Ex: Açaí) *</label><input type="text" className={inputArox} value={novoPeso.nome} onChange={e => setNovoPeso({...novoPeso, nome: e.target.value})} /></div>
                    <div className="group"><label className={labelArox}>Preço/KG (R$) *</label><input type="number" step="0.01" className={inputArox} value={novoPeso.preco} onChange={e => setNovoPeso({...novoPeso, preco: e.target.value})} /></div>
                    <div className="group"><label className={labelArox}>Custo/KG *</label><input type="number" step="0.01" className={inputArox} value={novoPeso.custo} onChange={e => setNovoPeso({...novoPeso, custo: e.target.value})} /></div>
                  </div>
                  <div className="flex gap-3 mt-6">
                     <button onClick={salvarPeso} className={`px-8 py-3.5 rounded-xl text-[13px] font-bold transition-all active:scale-95 flex-1 ${temaNoturno ? 'bg-white text-zinc-900' : 'bg-zinc-900 text-white'}`}>{editandoPeso ? 'Atualizar' : 'Adicionar Medida'}</button>
                     {editandoPeso && <button onClick={() => { setEditandoPeso(null); setNovoPeso({ nome: '', preco: '', custo: '' }); }} className={`px-8 rounded-xl font-bold text-[13px] ${temaNoturno ? 'bg-white/10 text-white' : 'bg-black/10 text-zinc-900'}`}>Cancelar</button>}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {configPeso.map(p => (
                    <div key={p.id} className={`p-5 rounded-2xl border flex flex-col justify-between shadow-sm transition-all ${temaNoturno ? 'bg-[#111111] border-white/[0.06]' : 'bg-white border-zinc-200'}`}>
                       <span className="font-bold text-[14px] mb-4">{p.nome}</span>
                       <div className="flex justify-between items-end">
                         <div className="flex flex-col">
                           <span className={`font-bold tracking-tight text-lg leading-none mb-1 ${temaNoturno ? 'text-emerald-400' : 'text-emerald-600'}`}>R$ {parseFloat(p.preco_kg).toFixed(2)}</span>
                           <span className={labelArox}>Custo: R$ {(p.custo_kg||0).toFixed(2)}</span>
                         </div>
                         <div className="flex gap-1.5">
                           <button onClick={() => {setEditandoPeso(p); setNovoPeso({ nome: p.nome, preco: p.preco_kg, custo: p.custo_kg || '' });}} className={`p-2.5 rounded-lg transition-colors ${temaNoturno ? 'bg-white/5 text-zinc-400 hover:text-white' : 'bg-black/5 text-zinc-500 hover:text-black'}`}><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg></button>
                           <button onClick={async () => { if(confirm("Remover opção?")) { await supabase.from('config_peso').delete().eq('id', p.id); fetchDados(); } }} className={`p-2.5 rounded-lg transition-colors ${temaNoturno ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20' : 'bg-rose-50 text-rose-600 hover:bg-rose-100'}`}><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                         </div>
                       </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {painelAtivo === 'importacao' && (
              <div className="max-w-3xl animate-in fade-in duration-300">
                <div className={`p-6 rounded-[24px] border mb-6 shadow-sm ${temaNoturno ? 'bg-[#111111] border-white/[0.06]' : 'bg-white border-zinc-200'}`}>
                  <h3 className={labelArox}>Importação Automática em Massa</h3>
                  <p className={`text-[12px] font-medium mb-4 mt-2 ${temaNoturno ? 'text-zinc-400' : 'text-zinc-600'}`}>Formato: <b># Categoria</b> na primeira linha, seguido de <b>Produto | Preço | Custo</b>.</p>
                  <textarea className={`${inputArox} h-72 font-mono text-[12px] resize-y mb-4`} placeholder="# Bebidas&#10;Coca Cola | 6.00 | 2.50" value={textoImportacao} onChange={(e) => setTextoImportacao(e.target.value)}></textarea>
                  <button onClick={processarImportacaoMassa} disabled={importando || !textoImportacao.trim()} className={`w-full py-4 rounded-xl text-[13px] font-bold transition-all ${importando ? 'bg-zinc-600 cursor-wait text-zinc-300' : (textoImportacao.trim() ? (temaNoturno ? 'bg-white text-zinc-900 active:scale-95' : 'bg-zinc-900 text-white active:scale-95') : (temaNoturno ? 'bg-white/5 text-zinc-600 cursor-not-allowed' : 'bg-black/5 text-zinc-400 cursor-not-allowed'))}`}>
                    {importando ? (
                      <div className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Processando Catálogo...
                      </div>
                    ) : 'Processar e Importar Lista'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}