'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence, LayoutGroup, useScroll, useTransform, useMotionTemplate } from 'framer-motion';

const mapAbaTitulo = { 
  comandas: 'Terminal de Operações', 
  fechadas: 'Histórico de Vendas', 
  faturamento: 'Métricas de Crescimento', 
  caixa: 'Controle Operacional', 
  fidelidade: 'Fidelidade', 
  dashboard: 'Início' 
};

// ============================================================================
// SYSTEM CAPSULE (DUAL-CAPSULE FUSION SYSTEM)
// ============================================================================
const SystemCapsule = ({ isDark, statusOperacao, tensaoEstado, dataCaixaFormatada, abaAtiva, irParaControleOperacional, isCicloAtrasado }) => {
  // Motion Language: Premium Apple-like Spring Physics
  const cinematicSpring = { type: "spring", stiffness: 280, damping: 28, mass: 0.9 };

  // 1. Hierarquia de Estados Inteligente
  let derivedState = 'normal';
  if (statusOperacao === 'inativa') derivedState = 'inativa';
  else if (tensaoEstado === 'critico') derivedState = 'critico';
  else if (tensaoEstado === 'atraso') derivedState = 'atraso';
  else if (tensaoEstado === 'pre-fechamento') derivedState = 'pre-fechamento';
  else if (isCicloAtrasado) derivedState = 'turno_estendido';

  // 2. Regra de Existência da Capsula B
  const isDashboard = abaAtiva === 'dashboard';
  const showCapsuleB = derivedState !== 'normal' && derivedState !== 'inativa' && !isDashboard;

  const dateLabel = dataCaixaFormatada ? `Ciclo • ${dataCaixaFormatada}` : 'Sistema Ativo';

  // 3. Sistema de Cores e Labels
  const config = {
    inativa: { 
      dot: 'bg-zinc-500', text: isDark ? 'text-zinc-400' : 'text-zinc-500', 
      bg: isDark ? 'bg-white/5' : 'bg-black/[0.03]', border: isDark ? 'border-white/10' : 'border-black/5', 
      labelA: 'Sistema Inativo', labelB: null 
    },
    normal: { 
      dot: 'bg-emerald-500', text: isDark ? 'text-emerald-400' : 'text-emerald-700', 
      bg: isDark ? 'bg-[#1c1c1e]/80' : 'bg-white/80', border: isDark ? 'border-emerald-500/20' : 'border-emerald-500/20', 
      labelA: dateLabel, labelB: null 
    },
    turno_estendido: { 
      dot: 'bg-orange-500', text: isDark ? 'text-orange-400' : 'text-orange-700', 
      bg: isDark ? 'bg-orange-500/10' : 'bg-orange-50/90', border: isDark ? 'border-orange-500/20' : 'border-orange-500/20', 
      labelA: dateLabel, labelB: 'Turno Estendido' 
    },
    'pre-fechamento': { 
      dot: 'bg-amber-500', text: isDark ? 'text-amber-400' : 'text-amber-700', 
      bg: isDark ? 'bg-amber-500/10' : 'bg-amber-50/90', border: isDark ? 'border-amber-500/20' : 'border-amber-500/20', 
      labelA: dateLabel, labelB: 'Pré-fechamento' 
    },
    atraso: { 
      dot: 'bg-orange-500', text: isDark ? 'text-orange-400' : 'text-orange-700', 
      bg: isDark ? 'bg-orange-500/10' : 'bg-orange-50/90', border: isDark ? 'border-orange-500/20' : 'border-orange-500/20', 
      labelA: dateLabel, labelB: 'Atraso Operacional' 
    },
    critico: { 
      dot: 'bg-rose-500', text: isDark ? 'text-rose-400' : 'text-rose-700', 
      bg: isDark ? 'bg-rose-500/10' : 'bg-rose-50/90', border: isDark ? 'border-rose-500/20' : 'border-rose-500/20', 
      labelA: dateLabel, labelB: 'Operação Crítica' 
    }
  };

  const currentConfig = config[derivedState] || config.normal;

  return (
    <motion.button
      layout
      layoutId="arox-status-pill"
      onClick={irParaControleOperacional}
      initial={{ opacity: 0, scale: 0.8, y: -10, filter: 'blur(8px)' }}
      animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, scale: 0.8, y: -10, filter: 'blur(8px)' }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={cinematicSpring}
      className={`relative group flex items-center h-8 sm:h-[36px] px-3 sm:px-4 rounded-full border shadow-[0_4px_16px_-8px_rgba(0,0,0,0.1)] backdrop-blur-[16px] transition-colors duration-500 overflow-hidden cursor-pointer ${currentConfig.bg} ${currentConfig.border}`}
      style={{ borderRadius: 32 }}
    >
      <motion.div layout transition={cinematicSpring} className="flex items-center gap-2 sm:gap-3 relative z-10">
        
        {/* CAPSULE A: System Core */}
        <motion.div layout transition={cinematicSpring} className="flex items-center gap-2">
          <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2 shrink-0">
            {derivedState !== 'inativa' && (
              <span className={`absolute inline-flex h-full w-full rounded-full opacity-80 animate-[pulse_2s_ease-in-out_infinite] ${currentConfig.dot}`} />
            )}
            <span className={`relative inline-flex rounded-full h-full w-full ${currentConfig.dot}`} />
          </span>
          <motion.span layout transition={cinematicSpring} className={`text-[12px] sm:text-[13px] font-medium tracking-tight whitespace-nowrap ${currentConfig.text}`}>
            <span className="sm:hidden">{currentConfig.labelA.split(' • ')[1] || currentConfig.labelA}</span>
            <span className="hidden sm:inline">{currentConfig.labelA}</span>
          </motion.span>
        </motion.div>

        {/* CAPSULE B: Dynamic Events (Magnetic Merge effect) */}
        <AnimatePresence mode="popLayout">
          {showCapsuleB && (
            <motion.div
              layout
              initial={{ opacity: 0, x: -10, filter: 'blur(4px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, x: -10, filter: 'blur(4px)' }}
              transition={cinematicSpring}
              className="flex items-center gap-2 sm:gap-3"
            >
              <motion.div layout transition={cinematicSpring} className={`w-[1px] h-3.5 sm:h-4 opacity-30 ${isDark ? 'bg-white' : 'bg-black'}`} />
              <motion.span layout transition={cinematicSpring} className={`text-[12px] sm:text-[13px] font-semibold tracking-tight whitespace-nowrap ${currentConfig.text}`}>
                {currentConfig.labelB}
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>

      </motion.div>

      {/* Glassmorphism Inner Light Overlay */}
      <div className={`absolute inset-0 rounded-full pointer-events-none transition-opacity duration-500 opacity-0 group-hover:opacity-100 ${isDark ? 'bg-white/[0.03]' : 'bg-black/[0.02]'}`} />
    </motion.button>
  );
};

// ============================================================================
// MAIN HEADER COMPONENT
// ============================================================================
export default function Header({
  comandaAtiva, setIdSelecionado, setMenuMobileAberto, temaNoturno,
  abaAtiva, fetchData, sessao, caixaAtual, setAbaAtiva,
  sidebarExpandida = false
}) {
  const [editandoNome, setEditandoNome] = useState(false);
  const [tempNome, setTempNome] = useState('');
  
  const [buscaCliente, setBuscaCliente] = useState('');
  const [mostrarDropdownCliente, setMostrarDropdownCliente] = useState(false);
  const [clientesFidelidade, setClientesFidelidade] = useState([]);
  const [indexSelecionado, setIndexSelecionado] = useState(0);
  const dropdownClienteRef = useRef(null);

  const [mostrarDropdownMesa, setMostrarDropdownMesa] = useState(false);
  const [buscaMesa, setBuscaMesa] = useState('');
  const [totalMesas, setTotalMesas] = useState(20);
  const [editandoTotalMesas, setEditandoTotalMesas] = useState(false);
  const dropdownMesaRef = useRef(null);
  const inputMesaRef = useRef(null);

  const isDark = temaNoturno; 

  const [animatingData, setAnimatingData] = useState(null);
  useEffect(() => {
    if (comandaAtiva) setAnimatingData(comandaAtiva);
  }, [comandaAtiva]);
  const safeComanda = comandaAtiva || animatingData;

  const cinematicSpring = { type: "spring", stiffness: 260, damping: 28, mass: 1 };
  const cinematicEase = [0.16, 1, 0.3, 1];

  const { scrollY } = useScroll();
  const innerScale = useTransform(scrollY, [0, 80], [1, 0.98]);
  const borderAlpha = useTransform(scrollY, [10, 80], [0, isDark ? 0.08 : 0.06]);
  const borderBottomColor = useMotionTemplate`rgba(${isDark ? '255, 255, 255' : '0, 0, 0'}, ${borderAlpha})`;

  const isOperacaoAtiva = caixaAtual?.status === 'aberto';
  let statusOperacao = isOperacaoAtiva ? 'ativa' : 'inativa';
  
  let dataCaixaFormatada = '';
  if (caixaAtual?.data_abertura) {
    const [ano, mes, dia] = String(caixaAtual.data_abertura).substring(0, 10).split('-');
    dataCaixaFormatada = `${dia}/${mes}`;
  }

  if (isOperacaoAtiva && caixaAtual?.data_abertura) {
    const dataAberturaDB = String(caixaAtual.data_abertura).substring(0, 10);
    const agora = new Date();
    const hoje = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}-${String(agora.getDate()).padStart(2, '0')}`;
    
    if (dataAberturaDB < hoje && agora.getHours() >= 5) {
      statusOperacao = 'pendente';
    }
  }

  const hojeCalendario = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
  const isCicloAtrasado = caixaAtual?.status === 'aberto' && caixaAtual?.data_abertura && String(caixaAtual.data_abertura).substring(0, 10) < hojeCalendario;

  const [horarioFechamento, setHorarioFechamento] = useState('23:00:00');
  const [tensaoEstado, setTensaoEstado] = useState('normal');

  const [ephemeralMsg, setEphemeralMsg] = useState(null);
  const timeoutRef = useRef(null);

  const showBubble = useCallback((text, id, icon = null) => {
    setEphemeralMsg({ text, id, icon });
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setEphemeralMsg(null), 2200);
  }, []);

  useEffect(() => {
    if (abaAtiva) showBubble(mapAbaTitulo[abaAtiva] || 'Visão Geral', `aba-${abaAtiva}`);
  }, [abaAtiva, showBubble]);

  const prevTensao = useRef(tensaoEstado);
  useEffect(() => {
    if (prevTensao.current !== tensaoEstado && tensaoEstado !== 'normal') {
      const labels = { 'pre-fechamento': 'Pré-fechamento', 'atraso': 'Atraso Operacional', 'critico': 'Operação Crítica' };
      const icon = <svg className={`w-3.5 h-3.5 mr-2 shrink-0 ${tensaoEstado === 'critico' ? 'text-rose-400' : 'text-amber-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
      showBubble(labels[tensaoEstado], `tensao-${tensaoEstado}`, icon);
    }
    prevTensao.current = tensaoEstado;
  }, [tensaoEstado, showBubble]);

  const prevComandaId = useRef(comandaAtiva?.id);
  useEffect(() => {
    if (comandaAtiva?.id && comandaAtiva.id !== prevComandaId.current) {
      const icon = <svg className="w-3.5 h-3.5 mr-2 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>;
      showBubble('Comanda Aberta', `comanda-open-${comandaAtiva.id}`, icon);
      prevComandaId.current = comandaAtiva.id;
    } else if (!comandaAtiva) {
      prevComandaId.current = null;
    }
  }, [comandaAtiva, showBubble]);

  useEffect(() => {
    const fetchConfigEmpresa = async () => {
      if (!sessao?.empresa_id) return;
      const { data } = await supabase.from('empresas').select('horario_fechamento').eq('id', sessao.empresa_id).single();
      if (data?.horario_fechamento) setHorarioFechamento(data.horario_fechamento);
    };
    fetchConfigEmpresa();
  }, [sessao?.empresa_id]);

  useEffect(() => {
    if (statusOperacao === 'inativa') { setTensaoEstado('normal'); return; }
    const calcularTensao = () => {
      const agoraStr = new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" });
      const agora = new Date(agoraStr);
      const agoraMinutos = agora.getHours() * 60 + agora.getMinutes();

      const [fHourStr, fMinStr] = horarioFechamento.split(':');
      const fHour = parseInt(fHourStr);
      const fMin = parseInt(fMinStr);
      let fechamentoMinutos = fHour * 60 + fMin;

      if (fHour < 5 && agora.getHours() >= 12) fechamentoMinutos += 24 * 60;
      let minAtuaisParaCalculo = agoraMinutos;
      if (agora.getHours() < 5 && fHour >= 12) minAtuaisParaCalculo += 24 * 60;

      const diff = fechamentoMinutos - minAtuaisParaCalculo;

      if (diff > 10) setTensaoEstado('normal');
      else if (diff <= 10 && diff > 0) setTensaoEstado('pre-fechamento');
      else if (diff <= 0 && diff > -30) setTensaoEstado('atraso');
      else setTensaoEstado('critico');
    };

    calcularTensao();
    const tickInterval = setInterval(calcularTensao, 60000);
    return () => clearInterval(tickInterval);
  }, [statusOperacao, horarioFechamento]);

  const matchMesaAtiva = (safeComanda?.nome || '').match(/^\[Mesa\s(\d+)\]/);
  const mesaAtivaVisivel = safeComanda?.mesa || (matchMesaAtiva ? matchMesaAtiva[1] : null);

  const focarBuscaProduto = useCallback(() => { setTimeout(() => { const inputProduto = document.querySelector('.input-busca-produto'); if (inputProduto) inputProduto.focus(); }, 100); }, []);
  const carregarClientes = useCallback(async () => { if (!sessao?.empresa_id) return; try { const { data, error } = await supabase.from('clientes_fidelidade').select('id, nome, pontos').eq('empresa_id', sessao.empresa_id); if (data && !error) setClientesFidelidade(data); } catch (err) {} }, [sessao?.empresa_id]);
  useEffect(() => { carregarClientes(); }, [carregarClientes]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownClienteRef.current && !dropdownClienteRef.current.contains(e.target)) setMostrarDropdownCliente(false);
      if (dropdownMesaRef.current && !dropdownMesaRef.current.contains(e.target)) { setMostrarDropdownMesa(false); setEditandoTotalMesas(false); }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'F7') { e.preventDefault(); setMostrarDropdownMesa(true); setTimeout(() => inputMesaRef.current?.focus(), 50); }
      if (e.key === 'F6' && comandaAtiva) { e.preventDefault(); alternarTipoComanda(); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [comandaAtiva]);

  const atualizarNomeInteligente = async (novoNomeCliente, novaMesa) => {
    if (!comandaAtiva) return;
    const nomeAtualDB = comandaAtiva.nome || '';
    const mesaFinal = novaMesa !== undefined ? novaMesa : mesaAtivaVisivel;
    let clienteFinal = novoNomeCliente !== undefined ? novoNomeCliente : '';

    if (novoNomeCliente === undefined) {
      clienteFinal = nomeAtualDB.replace(/^\[Mesa\s\d+\](?:\s*-\s*)?/, '').trim();
      if (['Mesa ', 'Balcão', 'Delivery', 'Comanda'].some(prefix => clienteFinal.startsWith(prefix))) clienteFinal = '';
    }

    let nomeConstruido = '';
    if (mesaFinal && clienteFinal) nomeConstruido = `[Mesa ${mesaFinal}] - ${clienteFinal}`;
    else if (clienteFinal) nomeConstruido = clienteFinal;
    else if (mesaFinal) nomeConstruido = `[Mesa ${mesaFinal}]`;
    else nomeConstruido = comandaAtiva?.tipo || 'Comanda';

    const updates = { nome: nomeConstruido };
    comandaAtiva.nome = nomeConstruido;
    if(novaMesa !== undefined) comandaAtiva.mesa = novaMesa;

    const { error } = await supabase.from('comandas').update(updates).eq('id', comandaAtiva.id);
    if (!error && fetchData) await fetchData();
  };

  const handleKeyDownCliente = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setIndexSelecionado(prev => Math.min(prev + 1, clientesFiltrados.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setIndexSelecionado(prev => Math.max(prev - 1, 0)); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      if (clientesFiltrados.length > 0 && mostrarDropdownCliente) vincularCliente(clientesFiltrados[indexSelecionado]);
      else if (buscaCliente.trim()) vincularCliente({ nome: buscaCliente.trim(), pontos: undefined });
    }
    else if (e.key === 'Escape') { setMostrarDropdownCliente(false); e.target.blur(); focarBuscaProduto(); }
  };

  const clientesFiltrados = clientesFidelidade.filter(c => c.nome.toLowerCase().includes(buscaCliente.toLowerCase())).slice(0, 6);

  const vincularCliente = async (cliente) => {
    if (!comandaAtiva) return;
    let tagsAtuais = comandaAtiva.tags || [];
    if (cliente.pontos !== undefined && !tagsAtuais.includes('Fidelidade')) tagsAtuais = [...tagsAtuais, 'Fidelidade'];
    if (tagsAtuais.length !== (comandaAtiva.tags || []).length) await supabase.from('comandas').update({ tags: tagsAtuais }).eq('id', comandaAtiva.id);
    await atualizarNomeInteligente(cliente.nome, undefined);
    setBuscaCliente(''); setMostrarDropdownCliente(false); focarBuscaProduto();
  };

  const salvarNome = async () => {
    if (!tempNome || !tempNome.trim() || tempNome === comandaAtiva?.nome) { setEditandoNome(false); return; }
    if (comandaAtiva) comandaAtiva.nome = tempNome; 
    const { error } = await supabase.from('comandas').update({ nome: tempNome }).eq('id', comandaAtiva?.id);
    if (!error && fetchData) await fetchData();
    setEditandoNome(false);
  };

  const mesasGeradas = Array.from({ length: totalMesas }, (_, i) => String(i + 1));
  const mesasFiltradas = buscaMesa ? mesasGeradas.filter(m => m.includes(buscaMesa)) : mesasGeradas;

  const vincularMesa = async (numero) => {
    if (!comandaAtiva) return;
    await atualizarNomeInteligente(undefined, String(numero));
    setBuscaMesa(''); setMostrarDropdownMesa(false); focarBuscaProduto();
  };

  const handleKeyDownMesa = (e) => {
    if (e.key === 'Enter' && mesasFiltradas.length > 0) { e.preventDefault(); vincularMesa(mesasFiltradas[0]); } 
    else if (e.key === 'Escape') { setMostrarDropdownMesa(false); e.target.blur(); focarBuscaProduto(); }
  };

  const alternarTipoComanda = async () => {
    if (!comandaAtiva) return;
    const novoTipo = comandaAtiva?.tipo === 'Balcão' ? 'Delivery' : 'Balcão';
    if(comandaAtiva) comandaAtiva.tipo = novoTipo; 
    const { error } = await supabase.from('comandas').update({ tipo: novoTipo }).eq('id', comandaAtiva?.id);
    if (!error && fetchData) await fetchData();
  };

  const irParaControleOperacional = () => {
    if(setAbaAtiva) setAbaAtiva('caixa');
    setIdSelecionado(null);
  };

  const Kbd = ({ children }) => (
    <kbd className={`hidden xl:flex items-center justify-center px-1.5 h-4 text-[9px] font-medium uppercase tracking-widest rounded transition-all shrink-0 ${isDark ? 'bg-white/5 text-zinc-400 ring-1 ring-inset ring-white/10' : 'bg-black/5 text-zinc-500 ring-1 ring-inset ring-black/10'}`}>
      {children}
    </kbd>
  );

  const isIslandFocused = editandoNome || mostrarDropdownCliente || mostrarDropdownMesa;

  return (
    <motion.div className="sticky top-0 z-50 flex items-center justify-center w-full bg-transparent flex-col py-1 sm:py-0 h-[76px]">
      <motion.div 
        className="absolute inset-0 z-0 pointer-events-none bg-transparent"
        style={{ borderBottomWidth: '1px', borderBottomStyle: 'solid', borderBottomColor }}
      />

      {/* O bloco Critical Core Ambient Tint foi removido daqui */}

      <motion.div style={{ scale: innerScale }} className="relative z-10 w-full flex flex-col h-full justify-center">
        
        {/* Barra superior legada removida a favor do Capsule System */}

        <header className="flex items-center justify-between px-4 sm:px-6 w-full relative min-h-[52px] sm:min-h-auto h-full">
          
          <div className="flex items-center gap-3 sm:gap-4 shrink-0 relative z-20 w-auto min-w-[48px] sm:w-[280px]">
            <AnimatePresence mode="popLayout" initial={false}>
              {comandaAtiva ? (
                <motion.button
                  key="btn-voltar" initial={{ opacity: 0, scale: 0.8, filter: 'blur(4px)' }} animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }} exit={{ opacity: 0, scale: 0.8, filter: 'blur(4px)' }} transition={cinematicSpring} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => { setIdSelecionado(null); setEditandoNome(false); }} 
                  className={`group flex items-center justify-center sm:justify-start w-9 h-9 sm:w-auto sm:px-3 sm:gap-2 rounded-full transition-colors duration-200 outline-none backdrop-blur-md ${isDark ? 'text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10' : 'text-zinc-600 hover:text-zinc-900 bg-black/5 hover:bg-black/10'}`}
                >
                  <svg className="w-4 h-4 sm:w-3.5 sm:h-3.5 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                  <span className="hidden sm:inline text-[13px] font-medium tracking-[-0.01em]">Voltar</span>
                </motion.button>
              ) : (
                <motion.button
                  key="btn-menu" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={cinematicSpring} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => setMenuMobileAberto(true)} 
                  className={`xl:hidden flex items-center justify-center w-9 h-9 rounded-full transition-colors duration-200 outline-none backdrop-blur-md ${isDark ? 'text-zinc-400 bg-white/5 hover:bg-white/10 hover:text-white' : 'text-zinc-600 bg-black/5 hover:bg-black/10 hover:text-zinc-900'}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                </motion.button>
              )}
            </AnimatePresence>

            <AnimatePresence initial={false}>
              {!sidebarExpandida && !comandaAtiva && (
                <motion.div
                  key="arox-logo-header" initial={{ opacity: 0, width: 0, filter: 'blur(8px)', x: -10 }} animate={{ opacity: 1, width: 'auto', filter: 'blur(0px)', x: 0 }} exit={{ opacity: 0, width: 0, filter: 'blur(8px)', x: -10 }} transition={{ duration: 0.4, ease: cinematicEase }}
                  className={`hidden sm:flex items-center cursor-default shrink-0 overflow-hidden backdrop-blur-md rounded-md px-2 -ml-2 py-1 ${isDark ? 'bg-black/20' : 'bg-white/20'}`}
                >
                  <span className={`font-semibold text-[17px] tracking-[-0.02em] leading-none select-none flex items-center ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                    AROX
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none z-[100] w-full px-4">
            {!comandaAtiva && (
              <span className={`sm:hidden absolute font-semibold text-[17px] tracking-[-0.02em] leading-none select-none transition-opacity duration-300 backdrop-blur-md rounded-md px-2 py-1 ${ephemeralMsg ? 'opacity-0' : 'opacity-100'} ${isDark ? 'text-zinc-100 bg-black/20' : 'text-zinc-900 bg-white/20'}`}>
                AROX
              </span>
            )}

            <AnimatePresence mode="wait">
              {ephemeralMsg && !comandaAtiva && (
                <motion.div
                  key={ephemeralMsg.id}
                  initial={{ opacity: 0, scale: 0.95, filter: 'blur(8px)' }}
                  animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, scale: 0.95, filter: 'blur(8px)' }}
                  transition={{ duration: 0.4, ease: cinematicEase }}
                  className={`h-[32px] sm:h-[36px] px-4 sm:px-5 rounded-full flex items-center justify-center backdrop-blur-md shadow-sm ring-1 whitespace-nowrap overflow-hidden absolute ${
                    isDark ? 'bg-[#18181A]/80 ring-white/10 text-zinc-200' : 'bg-white/80 ring-black/5 text-zinc-800'
                  }`}
                >
                  {ephemeralMsg.icon}
                  <span className="font-medium text-[13px] sm:text-[14px]">
                    {ephemeralMsg.text}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <LayoutGroup>
            <div className={`flex justify-center items-center flex-1 relative z-30 px-1 sm:px-2 min-w-0 pointer-events-none`}>
              <div className="pointer-events-auto">
                <AnimatePresence>
                  {comandaAtiva && (
                    <motion.div 
                      key="dynamic-island"
                      layoutId="arox-dynamic-island"
                      initial={{ opacity: 0, y: -10, scale: 0.95, filter: 'blur(8px)' }}
                      animate={{ 
                        opacity: 1, y: 0, scale: isIslandFocused ? 1 : 1, filter: 'blur(0px)',
                        boxShadow: isIslandFocused 
                          ? (isDark ? '0 12px 32px -12px rgba(0,0,0,0.6), inset 0 1px 0 0 rgba(255,255,255,0.1)' : '0 12px 32px -12px rgba(0,0,0,0.1), inset 0 1px 0 0 rgba(255,255,255,0.6)')
                          : (isDark ? '0 4px 16px -8px rgba(0,0,0,0.4), inset 0 1px 0 0 rgba(255,255,255,0.06)' : '0 4px 16px -8px rgba(0,0,0,0.05), inset 0 1px 0 0 rgba(255,255,255,0.4)')
                      }}
                      exit={{ opacity: 0, y: -8, scale: 0.96, filter: 'blur(8px)' }}
                      transition={cinematicSpring}
                      className={`flex items-center h-10 sm:h-[44px] rounded-full px-1.5 sm:px-2 w-auto max-w-[full] md:max-w-[720px] transition-colors duration-300 overflow-visible relative ${isDark ? 'bg-[#1c1c1e]/80 ring-1 ring-white/10 backdrop-blur-[16px]' : 'bg-white/80 ring-1 ring-black/[0.05] backdrop-blur-[16px]'} ${!isIslandFocused ? 'animate-[island-breathe_8s_ease-in-out_infinite]' : ''}`}
                    >
                      <style jsx>{` @keyframes island-breathe { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.001); } } `}</style>
                      
                      <motion.div layout transition={cinematicSpring} className="flex-shrink-0 relative flex items-center min-w-[40px] md:min-w-[140px] max-w-[120px] sm:max-w-[200px] md:max-w-[260px] z-10">
                        {editandoNome ? (
                          <input autoFocus className={`w-full h-8 text-[13px] font-medium px-3 md:px-4 rounded-full outline-none transition-all bg-transparent ${isDark ? 'text-white placeholder-zinc-500 ring-1 ring-inset ring-white/20 bg-white/5' : 'text-zinc-900 placeholder-zinc-500 ring-1 ring-inset ring-black/10 bg-black/5'}`} placeholder="Nome da comanda..." value={tempNome} onChange={e => setTempNome(e.target.value)} onBlur={salvarNome} onKeyDown={e => e.key === 'Enter' && salvarNome()} />
                        ) : (
                          <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={() => { setTempNome(safeComanda?.nome || ''); setEditandoNome(true); }} className={`h-8 w-8 md:w-auto px-0 md:px-3 rounded-full cursor-text transition-colors duration-200 flex items-center justify-center md:justify-start gap-2.5 overflow-hidden group ${isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}>
                            <svg className={`w-3.5 h-3.5 shrink-0 transition-colors duration-200 ${isDark ? 'text-zinc-400 group-hover:text-zinc-300' : 'text-zinc-500 group-hover:text-zinc-700'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                            <span className={`hidden md:block text-[13px] font-medium truncate tracking-[-0.01em] transition-colors duration-200 ${isDark ? 'text-zinc-300 group-hover:text-white' : 'text-zinc-700 group-hover:text-zinc-900'}`}>{safeComanda?.nome || 'Definir nome'}</span>
                          </motion.button>
                        )}
                      </motion.div>

                      <motion.div layout transition={cinematicSpring} className={`w-[1px] h-4 mx-1 md:mx-1.5 shrink-0 ${isDark ? 'bg-white/10' : 'bg-black/5'}`}></motion.div>

                      <motion.div layout transition={cinematicSpring} className="relative flex flex-1 items-center z-20 min-w-[40px]" ref={dropdownClienteRef}>
                        <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className={`flex items-center justify-center sm:justify-start h-8 px-2 sm:px-3 w-full rounded-full transition-colors duration-200 group cursor-text ${isDark ? 'focus-within:bg-white/5 hover:bg-white/5' : 'focus-within:bg-black/5 hover:bg-black/5'}`} onClick={() => { setMostrarDropdownCliente(true); setTimeout(() => document.querySelector('.input-cliente')?.focus(), 50); }}>
                          <div className="flex items-center flex-1 min-w-0 justify-center sm:justify-start">
                            <svg className={`w-4 h-4 sm:w-[15px] sm:h-[15px] shrink-0 transition-colors duration-200 ${mostrarDropdownCliente ? (isDark ? 'text-white' : 'text-zinc-900') : (isDark ? 'text-zinc-400 group-hover:text-zinc-300' : 'text-zinc-500 group-hover:text-zinc-700')}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                            <input className={`input-cliente w-full bg-transparent text-[13px] font-medium outline-none mx-2.5 transition-all truncate tracking-[-0.01em] ${mostrarDropdownCliente ? 'block' : 'hidden md:block'} ${isDark ? 'placeholder-zinc-500 text-white' : 'placeholder-zinc-400 text-zinc-900'}`} placeholder="Vincular cliente..." value={buscaCliente} onChange={e => { setBuscaCliente(e.target.value); setMostrarDropdownCliente(true); setIndexSelecionado(0); }} onFocus={() => setMostrarDropdownCliente(true)} onKeyDown={handleKeyDownCliente} />
                          </div>
                          {!mostrarDropdownCliente && !buscaCliente && <div className="hidden xl:flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 ml-1"><Kbd>F4</Kbd></div>}
                        </motion.div>
                        
                        <AnimatePresence>
                          {mostrarDropdownCliente && clientesFiltrados.length > 0 && (
                            <motion.div key="dropdown-cliente" initial={{ opacity: 0, y: 8, scale: 0.98, filter: 'blur(4px)' }} animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }} exit={{ opacity: 0, y: 4, scale: 0.98, filter: 'blur(4px)' }} transition={{ duration: 0.3, ease: cinematicEase }} className={`absolute top-[calc(100%+16px)] left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0 w-[300px] sm:w-[140%] sm:min-w-[340px] rounded-2xl ring-1 z-50 overflow-hidden p-1.5 backdrop-blur-xl ${isDark ? 'bg-[#18181A]/90 ring-white/10 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.05)]' : 'bg-white/90 ring-black/5 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.6)]'}`}>
                              <div className="flex flex-col gap-0.5">
                                {clientesFiltrados.map((c, idx) => (
                                  <motion.div layoutId={`cliente-${c.id}`} key={c.id} onClick={() => vincularCliente(c)} onMouseEnter={() => setIndexSelecionado(idx)} className={`flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-colors duration-150 ${indexSelecionado === idx ? (isDark ? 'bg-white/5' : 'bg-black/5') : 'hover:bg-transparent'}`}>
                                    <div className="flex items-center gap-3">
                                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-medium text-[13px] ${isDark ? 'bg-white/10 text-zinc-200' : 'bg-black/5 text-zinc-700'}`}>{c.nome.charAt(0).toUpperCase()}</div>
                                      <div className="flex flex-col">
                                        <span className={`text-[13px] font-medium leading-snug tracking-[-0.01em] ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>{c.nome}</span>
                                        <span className={`text-[11px] font-normal ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>{c.pontos} Pts</span>
                                      </div>
                                    </div>
                                    <svg className={`w-3.5 h-3.5 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${indexSelecionado === idx ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'} ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                                  </motion.div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>

                      <motion.div layout transition={cinematicSpring} className={`w-[1px] h-4 mx-1 md:mx-1.5 shrink-0 ${isDark ? 'bg-white/10' : 'bg-black/5'}`}></motion.div>
                      
                      <motion.div layout transition={cinematicSpring} className="relative flex items-center z-20" ref={dropdownMesaRef}>
                        <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={() => { setMostrarDropdownMesa(!mostrarDropdownMesa); setTimeout(() => inputMesaRef.current?.focus(), 50); }} className={`flex items-center gap-2 h-8 w-8 md:w-auto justify-center px-0 md:px-3 rounded-full transition-colors duration-200 group ${mostrarDropdownMesa ? (isDark ? 'bg-white/10' : 'bg-black/5') : (isDark ? 'hover:bg-white/5' : 'hover:bg-black/5')} ${mesaAtivaVisivel && !mostrarDropdownMesa ? (isDark ? 'bg-white/5 ring-1 ring-inset ring-white/10' : 'bg-black/[0.03] ring-1 ring-inset ring-black/5') : ''}`}>
                          <svg className={`w-4 h-4 sm:w-[15px] sm:h-[15px] shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${mostrarDropdownMesa ? 'rotate-180' : 'rotate-0'} ${mesaAtivaVisivel ? (isDark ? 'text-zinc-200' : 'text-zinc-800') : (isDark ? 'text-zinc-400 group-hover:text-zinc-300' : 'text-zinc-500 group-hover:text-zinc-700')}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                          <span className={`hidden sm:block text-[13px] font-medium tracking-[-0.01em] transition-colors duration-200 ${mesaAtivaVisivel ? (isDark ? 'text-white' : 'text-zinc-900') : (isDark ? 'text-zinc-400 group-hover:text-zinc-300' : 'text-zinc-600 group-hover:text-zinc-800')}`}>{mesaAtivaVisivel ? `Mesa ${mesaAtivaVisivel}` : 'Mesa'}</span>
                          <div className="hidden xl:flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"><Kbd>F7</Kbd></div>
                        </motion.button>

                        <AnimatePresence>
                          {mostrarDropdownMesa && (
                            <motion.div key="dropdown-mesa" initial={{ opacity: 0, y: 8, scale: 0.98, filter: 'blur(4px)' }} animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }} exit={{ opacity: 0, y: 4, scale: 0.98, filter: 'blur(4px)' }} transition={{ duration: 0.3, ease: cinematicEase }} className={`absolute top-[calc(100%+16px)] right-0 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 w-[280px] sm:w-[320px] rounded-2xl ring-1 z-50 overflow-hidden p-2 backdrop-blur-xl ${isDark ? 'bg-[#18181A]/90 ring-white/10 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.05)]' : 'bg-white/90 ring-black/5 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.6)]'}`}>
                              <div className="flex items-center gap-2 mb-3 relative px-1">
                                <div className="relative flex-1">
                                  <svg className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                                  <input ref={inputMesaRef} className={`input-mesa w-full h-9 pl-9 pr-3 rounded-lg text-[13px] font-medium outline-none bg-transparent transition-colors tracking-[-0.01em] ${isDark ? 'text-white placeholder-zinc-500 focus:bg-white/5 ring-1 ring-inset ring-white/10' : 'text-zinc-900 placeholder-zinc-500 focus:bg-black/5 ring-1 ring-inset ring-black/5'}`} placeholder="Buscar mesa..." value={buscaMesa} onChange={e => setBuscaMesa(e.target.value)} onKeyDown={handleKeyDownMesa} />
                                </div>
                                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setEditandoTotalMesas(!editandoTotalMesas)} className={`w-9 h-9 shrink-0 rounded-lg flex items-center justify-center transition-colors duration-200 ${editandoTotalMesas ? (isDark ? 'bg-white/10 text-white' : 'bg-black/5 text-zinc-900') : (isDark ? 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200' : 'text-zinc-500 hover:bg-black/5 hover:text-zinc-800')}`}><svg className="w-[16px] h-[16px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg></motion.button>
                              </div>

                              <AnimatePresence>
                                {editandoTotalMesas && (
                                  <motion.div key="edit-mesas" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden px-1">
                                    <div className={`mb-3 p-3 rounded-xl border ${isDark ? 'bg-white/[0.02] border-white/5' : 'bg-black/[0.02] border-black/5'}`}>
                                      <label className={`block text-[11px] font-medium mb-1.5 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Capacidade Operacional</label>
                                      <input type="number" min="1" value={totalMesas} onChange={e => setTotalMesas(Number(e.target.value))} className={`w-full h-8 px-2.5 rounded-lg text-[13px] font-medium outline-none bg-transparent transition-all ${isDark ? 'text-white focus:bg-white/5 ring-1 ring-inset ring-white/10' : 'text-zinc-900 focus:bg-black/5 ring-1 ring-inset ring-black/5'}`} />
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>

                              <div className="grid grid-cols-5 gap-1.5 max-h-[220px] overflow-y-auto scrollbar-hide p-1">
                                {mesasFiltradas.length > 0 ? mesasFiltradas.map((numero) => (
                                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} key={numero} onClick={() => vincularMesa(numero)} className={`relative overflow-hidden h-10 rounded-xl flex items-center justify-center text-[13px] font-medium transition-colors duration-200 ${mesaAtivaVisivel === numero ? (isDark ? 'bg-white/10 text-white ring-1 ring-inset ring-white/20' : 'bg-black/5 text-zinc-900 ring-1 ring-inset ring-black/10') : (isDark ? 'bg-transparent text-zinc-400 hover:bg-white/5 hover:text-zinc-200' : 'bg-transparent text-zinc-600 hover:bg-black/5 hover:text-zinc-900')}`}>{numero}</motion.button>
                                )) : (
                                  <div className={`col-span-5 text-center py-6 text-[13px] font-medium ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Nenhuma mesa encontrada.</div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>

                      <motion.div layout transition={cinematicSpring} className={`w-[1px] h-4 mx-1 md:mx-1.5 shrink-0 ${isDark ? 'bg-white/10' : 'bg-black/5'}`}></motion.div>
                      
                      <motion.button layout transition={cinematicSpring} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={alternarTipoComanda} className={`shrink-0 flex items-center justify-center sm:justify-start gap-2 h-8 w-8 md:w-auto sm:px-3 rounded-full text-[13px] font-medium tracking-[-0.01em] group relative overflow-hidden transition-colors duration-300 z-10 ${safeComanda?.tipo === 'Delivery' ? (isDark ? 'bg-white text-zinc-900' : 'bg-zinc-900 text-white') : (isDark ? 'bg-transparent text-zinc-400 hover:bg-white/5 hover:text-zinc-200' : 'bg-transparent text-zinc-600 hover:bg-black/5 hover:text-zinc-900')}`}>
                        <div className="relative flex items-center justify-center">
                          {safeComanda?.tipo === 'Delivery' ? (
                            <svg className="w-[14px] h-[14px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                          ) : (
                            <svg className="w-[14px] h-[14px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                          )}
                        </div>
                        <span className="hidden md:block relative z-10">{safeComanda?.tipo}</span>
                        <div className={`hidden xl:flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${safeComanda?.tipo === 'Delivery' ? (isDark ? 'text-zinc-900' : 'text-white') : ''}`}><Kbd>F6</Kbd></div>
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </LayoutGroup>
          
          {/* ========================================= */}
          {/* DUAL-CAPSULE SYSTEM INTEGRATION           */}
          {/* ========================================= */}
          <LayoutGroup>
            <div className="flex justify-end items-center gap-3 shrink-0 relative z-20 w-auto sm:w-[280px]">
              <AnimatePresence mode="wait">
                {!comandaAtiva && (
                  <SystemCapsule 
                    key="system-capsule-core"
                    isDark={isDark}
                    statusOperacao={statusOperacao}
                    tensaoEstado={tensaoEstado}
                    dataCaixaFormatada={dataCaixaFormatada}
                    abaAtiva={abaAtiva}
                    irParaControleOperacional={irParaControleOperacional}
                    isCicloAtrasado={isCicloAtrasado} 
                  />
                )}
              </AnimatePresence>
            </div>
          </LayoutGroup>

        </header>
      </motion.div>
    </motion.div>
  );
}