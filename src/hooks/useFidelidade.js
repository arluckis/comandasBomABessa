import { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabase';

export function useFidelidade({ temaNoturno, sessao, mostrarAlerta, clientesFidelidade, setClientesFidelidade, comandas }) {
  const [abaInterna, setAbaInterna] = useState('clientes'); 
  const [busca, setBusca] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('todos');
  const [ordenacao, setOrdenacao] = useState('pontos');
  const [meta, setMeta] = useState({ pontos_necessarios: 10, premio: '1 Açaí de 500ml', valor_minimo: 0 });
  const [mostrarModalNovo, setMostrarModalNovo] = useState(false);
  const [clienteEditando, setClienteEditando] = useState(null); 
  const [clientePerfil, setClientePerfil] = useState(null); 
  const [clienteResgate, setClienteResgate] = useState(null); 
  const [mostrarModalTexto, setMostrarModalTexto] = useState(false);
  const [textoColado, setTextoColado] = useState('');
  const [novoCliente, setNovoCliente] = useState({ nome: '', telefone: '', aniversario: '', pontos: 0 });
  const [copiado, setCopiado] = useState(false);
  const fileInputRef = useRef(null);

  const [diaClienteHover, setDiaClienteHover] = useState(null);
  const [diaGlobalSelect, setDiaGlobalSelect] = useState(new Date().getDay()); 

  useEffect(() => {
    const fetchMeta = async () => {
      const { data } = await supabase.from('config_fidelidade').select('*').eq('empresa_id', sessao.empresa_id).single();
      if (data) setMeta({ pontos_necessarios: data.pontos_necessarios, premio: data.premio, valor_minimo: data.valor_minimo || 0 });
    };
    if (sessao?.empresa_id) fetchMeta();
  }, [sessao]);

  const atualizarMeta = async () => {
    const { error } = await supabase.from('config_fidelidade').upsert({ empresa_id: sessao.empresa_id, pontos_necessarios: meta.pontos_necessarios, premio: meta.premio, valor_minimo: parseFloat(meta.valor_minimo) || 0 }, { onConflict: 'empresa_id' });
    if (!error) mostrarAlerta("Sucesso", "Regras atualizadas e ativas no sistema.");
  };

  const clientesFiltrados = useMemo(() => {
    let filtrados = clientesFidelidade.filter(c => c.nome.toLowerCase().includes(busca.toLowerCase()) || (c.telefone && c.telefone.includes(busca)));
    if (filtroCategoria === 'resgate') filtrados = filtrados.filter(c => c.pontos >= meta.pontos_necessarios);
    else if (filtroCategoria === 'quase') filtrados = filtrados.filter(c => c.pontos >= meta.pontos_necessarios * 0.7 && c.pontos < meta.pontos_necessarios);
    else if (filtroCategoria === 'inativos') filtrados = filtrados.filter(c => c.pontos === 0);
    return filtrados.sort((a, b) => {
      if (ordenacao === 'pontos') return b.pontos - a.pontos;
      if (ordenacao === 'recentes') return new Date(b.created_at || 0) > new Date(a.created_at || 0) ? -1 : 1;
      return a.nome.localeCompare(b.nome);
    });
  }, [clientesFidelidade, busca, filtroCategoria, ordenacao, meta.pontos_necessarios]);

  const ranking = [...clientesFidelidade].sort((a, b) => (b.pontos_totais || b.pontos) - (a.pontos_totais || a.pontos)).slice(0, 10);

  const salvarNovoCliente = async () => {
    if (!novoCliente.nome) return mostrarAlerta("Aviso", "O nome do cliente é obrigatório.");
    if (clienteEditando) {
       const { error } = await supabase.from('clientes_fidelidade').update({nome: novoCliente.nome, telefone: novoCliente.telefone, aniversario: novoCliente.aniversario || null, pontos: novoCliente.pontos}).eq('id', clienteEditando.id);
       if (!error) { setClientesFidelidade(clientesFidelidade.map(c => c.id === clienteEditando.id ? { ...c, ...novoCliente } : c)); mostrarAlerta("Sucesso", "Dados atualizados."); }
    } else {
       const payload = { ...novoCliente, aniversario: novoCliente.aniversario || null, empresa_id: sessao.empresa_id, pontos_totais: novoCliente.pontos };
       const { data, error } = await supabase.from('clientes_fidelidade').insert([payload]).select().single();
       if (data && !error) { setClientesFidelidade([...clientesFidelidade, data]); mostrarAlerta("Sucesso", "Cliente integrado."); }
    }
    setMostrarModalNovo(false); setClienteEditando(null); setNovoCliente({ nome: '', telefone: '', aniversario: '', pontos: 0 });
  };

  const abrirEdicao = (cliente) => { setClienteEditando(cliente); setNovoCliente({ nome: cliente.nome, telefone: cliente.telefone || '', aniversario: cliente.aniversario || '', pontos: cliente.pontos }); setMostrarModalNovo(true); };

  const confirmarResgatePremio = async () => {
    if (!clienteResgate) return;
    const novosPontos = clienteResgate.pontos - meta.pontos_necessarios;
    const { error } = await supabase.from('clientes_fidelidade').update({ pontos: novosPontos }).eq('id', clienteResgate.id);
    if (!error) {
      setClientesFidelidade(clientesFidelidade.map(c => c.id === clienteResgate.id ? { ...c, pontos: novosPontos } : c));
      setClienteResgate(null); mostrarAlerta("Resgate Aprovado", "Ciclo renovado e prêmio entregue.");
    }
  };

  const processarTextoImportacao = async (textoImportacao) => {
    if (!textoImportacao.trim()) return;
    try {
      const linhas = textoImportacao.trim().split('\n'); if (linhas.length === 0) return;
      const primeiraLinha = linhas[0].toLowerCase();
      const separador = primeiraLinha.includes(';') ? ';' : (primeiraLinha.includes('\t') ? '\t' : (primeiraLinha.includes('|') ? '|' : ','));
      const headers = primeiraLinha.split(separador).map(h => h.trim().replace(/["']/g, ''));
      let idxNome = headers.indexOf('nome'); let idxTel = headers.indexOf('telefone'); let idxNasc = headers.findIndex(h => h.includes('aniversario') || h.includes('data')); let idxPontos = headers.indexOf('pontos');
      if (idxNome === -1) { idxNome = 0; idxTel = 1; idxNasc = 2; idxPontos = 3; }
      
      const novos = (idxNome !== -1 ? linhas.slice(1) : linhas).map((l) => {
        let cleanLine = l.replace(/^\|/, '').replace(/\|$/, '').trim(); 
        if (!cleanLine || cleanLine.startsWith('---') || cleanLine.includes('---')) return null;
        const cols = cleanLine.split(separador);
        let nomeStr = (cols[idxNome] || '').trim().replace(/\*\*/g, '').replace(/["']/g, ''); 
        if (!nomeStr || nomeStr.toLowerCase().includes('nome') || nomeStr.toLowerCase().includes('cliente')) return null;
        let dataNasc = (cols[idxNasc] || '').trim().replace(/["']/g, '');
        if (dataNasc && dataNasc.toLowerCase().includes('anivers')) return null; 
        const pt = parseInt((cols[idxPontos] || '').replace(/[^\d]/g, '')) || 0;
        if (dataNasc) {
           if (dataNasc.includes('/')) { const p = dataNasc.split('/'); if (p.length === 3) dataNasc = `${p[2]}-${p[1]}-${p[0]}`; else dataNasc = null; }
           else if (/[a-zA-Z]/.test(dataNasc) || !/^\d{4}-\d{2}-\d{2}$/.test(dataNasc)) dataNasc = null;
        }
        return { nome: nomeStr, telefone: (cols[idxTel] || '').trim().replace(/["']/g, '') || null, aniversario: dataNasc || null, pontos: pt, pontos_totais: pt, empresa_id: sessao.empresa_id };
      }).filter(Boolean);

      if (novos.length > 0) {
        const { data, error } = await supabase.from('clientes_fidelidade').insert(novos).select();
        if (data && !error) { setClientesFidelidade([...clientesFidelidade, ...data]); setMostrarModalTexto(false); setTextoColado(''); mostrarAlerta("Sucesso", `${data.length} clientes importados!`); } 
        else mostrarAlerta("Erro", "Falha de comunicação com o banco.");
      } else mostrarAlerta("Aviso", "Verifique o formato, nenhum cliente válido."); 
    } catch(e) { mostrarAlerta("Erro", "Ocorreu um erro ao decodificar sua tabela."); }
  };

  const acionarImportacao = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (evento) => { await processarTextoImportacao(evento.target.result); if (fileInputRef.current) fileInputRef.current.value = ''; };
      reader.readAsText(file);
    }
  };

  const copiarRegrasWhatsApp = async () => {
    const texto = `*COMO VAI FUNCIONAR:*\n• A cada compra maior que R$ ${meta.valor_minimo}, você ganha 1 ponto.\n• Quando acumular ${meta.pontos_necessarios} pontos, você estará pronto para o resgate.\n• O sistema indicará que você ganhou: ${meta.premio}.`;
    try {
      if (navigator?.clipboard?.writeText) await navigator.clipboard.writeText(texto);
      else {
        const t = document.createElement("textarea"); t.value = texto; t.style.position = "fixed"; t.style.left = "-999999px";
        document.body.appendChild(t); t.select(); document.execCommand("copy"); t.remove();
      }
      setCopiado(true); setTimeout(() => setCopiado(false), 2000);
    } catch (err) { mostrarAlerta("Aviso", "Selecione o texto manualmente."); }
  };

  const formatarData = (dataStr) => !dataStr ? '—' : new Date(dataStr).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });

  const analiseGlobal = useMemo(() => {
    let faturamentoTotal = 0; let faturamentoFiel = 0; let cmdsFieis = 0;
    let diasFaturados = [0, 0, 0, 0, 0, 0, 0]; let diasVolume = [0, 0, 0, 0, 0, 0, 0]; let produtosPorDiaGlobal = Array.from({length: 7}, () => ({}));
    (comandas || []).forEach(c => {
      if(c.status === 'aberta') return; 
      const isFiel = c.tags && c.tags.includes('Fidelidade');
      const ticket = (c.produtos || []).reduce((acc, p) => acc + (p.preco || 0), 0);
      const dia = (c.created_at || c.data_hora || c.data) ? new Date(c.created_at || c.data_hora || c.data).getDay() : -1;
      faturamentoTotal += ticket;
      if (isFiel) { faturamentoFiel += ticket; cmdsFieis++; }
      if(dia >= 0 && dia <= 6) {
        diasFaturados[dia] += ticket; diasVolume[dia] += 1;
        (c.produtos || []).forEach(p => { const n = p.nome.replace(/\s*\(\d+(?:\.\d+)?\s*g\)/i, '').trim().toUpperCase(); produtosPorDiaGlobal[dia][n] = (produtosPorDiaGlobal[dia][n] || 0) + 1; });
      }
    });
    return { diasFaturados, diasVolume, produtosPorDiaGlobal, taxaFidelidade: faturamentoTotal > 0 ? ((faturamentoFiel / faturamentoTotal) * 100).toFixed(1) : 0, ticketGeral: comandas.length ? (faturamentoTotal / comandas.length) : 0, ticketFiel: cmdsFieis ? (faturamentoFiel / cmdsFieis) : 0 };
  }, [comandas]);

  const maxVolumeGlobal = Math.max(...analiseGlobal.diasVolume, 1);
  const top5DiaSelecionado = useMemo(() => Object.entries(analiseGlobal.produtosPorDiaGlobal[diaGlobalSelect] || {}).sort((a, b) => b[1] - a[1]).slice(0, 5), [analiseGlobal, diaGlobalSelect]);

  const obterDiagnostico = (c) => {
    const percent = (c.pontos / meta.pontos_necessarios) * 100;
    if (c.pontos >= meta.pontos_necessarios) return { label: 'Pronto para Resgate', color: 'text-emerald-500', bg: 'bg-emerald-500/10' };
    if (percent >= 75) return { label: 'Muito Ativo', color: 'text-amber-500', bg: 'bg-amber-500/10' };
    if (c.pontos_totais > meta.pontos_necessarios * 3) return { label: 'Cliente Fiel', color: 'text-blue-500', bg: 'bg-blue-500/10' };
    if (c.pontos === 0) return { label: 'Inativo', color: 'text-zinc-500', bg: 'bg-zinc-500/10' };
    return { label: 'Acumulando', color: temaNoturno ? 'text-zinc-300' : 'text-zinc-600', bg: temaNoturno ? 'bg-white/5' : 'bg-black/5' };
  };

  return {
    abaInterna, setAbaInterna, busca, setBusca, filtroCategoria, setFiltroCategoria, ordenacao, setOrdenacao,
    meta, setMeta, mostrarModalNovo, setMostrarModalNovo, clienteEditando, setClienteEditando, clientePerfil, setClientePerfil,
    clienteResgate, setClienteResgate, mostrarModalTexto, setMostrarModalTexto, textoColado, setTextoColado,
    novoCliente, setNovoCliente, copiado, fileInputRef, diaClienteHover, setDiaClienteHover, diaGlobalSelect, setDiaGlobalSelect,
    clientesFiltrados, ranking, analiseGlobal, maxVolumeGlobal, top5DiaSelecionado,
    atualizarMeta, salvarNovoCliente, abrirEdicao, confirmarResgatePremio, acionarImportacao, processarTextoImportacao, copiarRegrasWhatsApp, formatarData, obterDiagnostico
  };
}