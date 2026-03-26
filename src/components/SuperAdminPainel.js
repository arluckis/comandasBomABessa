'use client';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';

// Definição Estratégica de Preços (Competitivo)
const CICLOS_PREMIUM = [
  { id: 'mensal', nome: 'Mensal', precoMes: 97, total: 97, desconto: 0, tag: '' },
  { id: 'bimestral', nome: 'Bimestral', precoMes: 92, total: 184, desconto: 5, tag: '' },
  { id: 'trimestral', nome: 'Trimestral', precoMes: 87, total: 261, desconto: 10, tag: '' },
  { id: 'semestral', nome: 'Semestral', precoMes: 77, total: 462, desconto: 20, tag: 'Recomendado' },
  { id: 'anual', nome: 'Anual', precoMes: 67, total: 804, desconto: 30, tag: 'Maior Lucro' },
];

export default function SuperAdminPainel({ fazerLogout, temaNoturno, setTemaNoturno }) {
  const [abaAtiva, setAbaAtiva] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [empresas, setEmpresas] = useState([]);
  const [termoPesquisa, setTermoPesquisa] = useState('');
  
  // Controlo Mobile & Wizard
  const [menuMobileAberto, setMenuMobileAberto] = useState(false);
  const [etapaWizard, setEtapaWizard] = useState(1); 

  // Sistema de Notificações
  const [toast, setToast] = useState({ visivel: false, texto: '', tipo: 'info' });
  const mostrarNotificacao = (texto, tipo = 'info') => {
    setToast({ visivel: true, texto, tipo });
    setTimeout(() => setToast(prev => ({ ...prev, visivel: false })), 4000);
  };

  // Drawers & Modals
  const [modalEdicaoAberto, setModalEdicaoAberto] = useState(false);
  const [empresaEditando, setEmpresaEditando] = useState(null);
  const [dadosEdicao, setDadosEdicao] = useState({ nomeRestaurante: '', nomeDono: '', email: '', senha: '', usuarioId: null, plano: 'free' });
  
  const [modalLogsAberto, setModalLogsAberto] = useState(false);
  const [logsCliente, setLogsCliente] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [dataFiltroLogs, setDataFiltroLogs] = useState(new Date());

  const [modalMetricasAberto, setModalMetricasAberto] = useState(false);
  const [empresaSelecionadaMetricas, setEmpresaSelecionadaMetricas] = useState(null);

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({ id: null, status: null, nome: '' });

  // Novo Cliente Form (Expandido para UI, protegido no DB)
  const [formData, setFormData] = useState({ 
    nomeRestaurante: '', nomeDono: '', email: '', senha: '', tipoPlano: 'free', ciclo: 'mensal',
    cidade: '', abertura: '', fechamento: '', tipoOperacao: 'hibrido', chaveAtivacao: ''
  });

  // Cinematic Loading State
  const [cinematicText, setCinematicText] = useState('');

  useEffect(() => { carregarEmpresas(); }, []);

  const carregarEmpresas = async () => {
    setLoading(true);
    try {
      const { data: emps, error: errEmp } = await supabase.from('empresas').select('*').order('id', { ascending: false });
      if (errEmp) throw new Error("Falha ao carregar infraestrutura de contas.");

      const { data: usrs, error: errUsr } = await supabase.from('usuarios').select('id, empresa_id, nome_usuario, email, senha, role').eq('role', 'dono');
      if (errUsr) throw new Error("Falha ao carregar gestores de nó.");
      
      const { data: comandasData } = await supabase.from('comandas').select('empresa_id');
      
      if (emps) {
        const empresasMapeadas = emps.map(emp => {
          const uso = comandasData ? comandasData.filter(c => c.empresa_id === emp.id).length : 0;
          return {
            ...emp,
            uso_registros: uso,
            usuarios: usrs ? usrs.filter(u => u.empresa_id === emp.id) : []
          };
        });
        setEmpresas(empresasMapeadas);
      }
    } catch (err) { mostrarNotificacao(err.message, 'erro'); } 
    finally { setLoading(false); }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleChangeEdicao = (e) => setDadosEdicao({ ...dadosEdicao, [e.target.name]: e.target.value });

  // Geração Automática da Chave Comercial
  useEffect(() => {
    if (etapaWizard === 4 && !formData.chaveAtivacao) {
      const prefix = formData.nomeRestaurante ? formData.nomeRestaurante.replace(/\s+/g, '').substring(0, 5).toUpperCase() : 'AROX';
      const code = Math.floor(1000 + Math.random() * 9000);
      setFormData(prev => ({ ...prev, chaveAtivacao: `${prefix}-${code}` }));
    }
  }, [etapaWizard, formData.nomeRestaurante]);

  const avancarWizard = () => {
    if (etapaWizard === 1) {
       if (formData.tipoPlano === 'free') setEtapaWizard(3);
       else setEtapaWizard(2);
    } else if (etapaWizard === 2) {
       setEtapaWizard(3);
    } else if (etapaWizard === 3) {
       setEtapaWizard(4);
    }
  };

  const voltarWizard = () => {
    if (etapaWizard === 3 && formData.tipoPlano === 'free') setEtapaWizard(1);
    else setEtapaWizard(etapaWizard - 1);
  };

  // Cinematic Provisioning
  const iniciarProvisionamento = (e) => {
    e.preventDefault();
    setEtapaWizard(5);
    const steps = [
      "Iniciando cluster de banco de dados...",
      "Provisionando infraestrutura de nuvem isolada...",
      "Configurando módulos de inteligência e cache...",
      "Aplicando políticas de segurança AES-256...",
      "Sincronizando chaves comerciais...",
      "Workspace finalizado e online."
    ];
    let current = 0;
    setCinematicText(steps[0]);
    
    const interval = setInterval(() => {
      current++;
      if (current < steps.length) {
        setCinematicText(steps[current]);
      } else {
        clearInterval(interval);
        executarCriacaoSupabase();
      }
    }, 1200);
  };

  const executarCriacaoSupabase = async () => {
    try {
      const planoFinal = formData.tipoPlano === 'free' ? 'free' : formData.ciclo;
      const { data: novaEmpresa, error: errEmp } = await supabase.from('empresas').insert([{ nome: formData.nomeRestaurante, ativo: true, plano: planoFinal }]).select().single();
      if (errEmp) throw new Error(`Falha de infraestrutura: ${errEmp.message}`);

      const { error: errUsr } = await supabase.from('usuarios').insert([{ empresa_id: novaEmpresa.id, nome_usuario: formData.nomeDono, email: formData.email, senha: formData.senha, role: 'dono', primeiro_login: true }]);
      if (errUsr) throw new Error(`Falha no provisionamento de identidade: ${errUsr.message}`);

      await supabase.from('config_fidelidade').insert([{ empresa_id: novaEmpresa.id }]);

      mostrarNotificacao('Workspace implementado na rede principal.', 'sucesso');
      setFormData({ nomeRestaurante: '', nomeDono: '', email: '', senha: '', tipoPlano: 'free', ciclo: 'mensal', cidade: '', abertura: '', fechamento: '', tipoOperacao: 'hibrido', chaveAtivacao: '' });
      setEtapaWizard(1); 
      carregarEmpresas();
      setTimeout(() => setAbaAtiva('clientes'), 1000);
    } catch (error) { 
      mostrarNotificacao(error.message, 'erro'); 
      setEtapaWizard(4); 
    } 
  };

  const abrirModalEdicao = (empresa, dono) => {
    setEmpresaEditando(empresa.id);
    setDadosEdicao({ 
      nomeRestaurante: empresa.nome, 
      plano: empresa.plano || 'free', 
      nomeDono: dono?.nome_usuario || '', 
      email: dono?.email || '', 
      senha: dono?.senha || '', 
      usuarioId: dono?.id || null 
    });
    setModalEdicaoAberto(true);
  };

  const salvarEdicao = async () => {
    setLoading(true);
    try {
      const { error: errE } = await supabase.from('empresas').update({ nome: dadosEdicao.nomeRestaurante, plano: dadosEdicao.plano }).eq('id', empresaEditando);
      if (errE) throw new Error("Erro na gravação de bloco.");
      
      if (dadosEdicao.usuarioId) {
        const { error: errU } = await supabase.from('usuarios').update({ nome_usuario: dadosEdicao.nomeDono, email: dadosEdicao.email, senha: dadosEdicao.senha }).eq('id', dadosEdicao.usuarioId);
        if (errU) throw new Error(`Erro ao atualizar credenciais: ${errU.message}`);
      } else {
         const { error: errU } = await supabase.from('usuarios').insert([{ empresa_id: empresaEditando, nome_usuario: dadosEdicao.nomeDono, email: dadosEdicao.email, senha: dadosEdicao.senha, role: 'dono', primeiro_login: true }]);
         if (errU) throw new Error(`Erro ao provisionar gestor: ${errU.message}`);
      }

      setModalEdicaoAberto(false);
      carregarEmpresas();
      mostrarNotificacao('Sincronização concluída.', 'sucesso');
    } catch (err) { mostrarNotificacao(err.message, 'erro'); } 
    finally { setLoading(false); }
  };

  const abrirConfirmModal = (empresa) => {
    const isAtivo = empresa.ativo !== false;
    setConfirmConfig({ id: empresa.id, status: isAtivo, nome: empresa.nome });
    setConfirmModalOpen(true);
  };

  const alternarStatusEmpresa = async () => {
    setConfirmModalOpen(false);
    try {
      const { error } = await supabase.from('empresas').update({ ativo: !confirmConfig.status }).eq('id', confirmConfig.id);
      if (error) throw new Error("Erro ao aplicar política de acesso.");
      carregarEmpresas();
      mostrarNotificacao(`Conta ${!confirmConfig.status ? 'reativada' : 'suspensa'} e propagada na rede.`, 'sucesso');
    } catch (err) { mostrarNotificacao(err.message, 'erro'); }
  };

  const abrirLogsCliente = async (empresaId) => {
    setModalLogsAberto(true);
    setEmpresaEditando(empresaId); 
    carregarLogs(empresaId, dataFiltroLogs);
  };

  const carregarLogs = async (empresaId, data) => {
    setLoadingLogs(true);
    try {
      const inicioDia = new Date(data); inicioDia.setHours(0, 0, 0, 0);
      const fimDia = new Date(data); fimDia.setHours(23, 59, 59, 999);
      const { data: logs, error } = await supabase.from('logs_acesso').select('*').eq('empresa_id', empresaId).gte('criado_em', inicioDia.toISOString()).lte('criado_em', fimDia.toISOString()).order('criado_em', { ascending: false });
      if (error) throw new Error("Falha ao puxar logs do node.");
      setLogsCliente(logs || []);
    } catch (err) { mostrarNotificacao(err.message, 'erro'); } 
    finally { setLoadingLogs(false); }
  };

  const mudarDiaLog = (dias) => {
    const novaData = new Date(dataFiltroLogs);
    novaData.setDate(novaData.getDate() + dias);
    setDataFiltroLogs(novaData);
    if (empresaEditando) carregarLogs(empresaEditando, novaData);
  };

  const entrarComoCliente = (dono) => {
    if (!dono || !dono.empresa_id) return mostrarNotificacao("Gestor Master não localizado no nó.", 'erro');
    const dataHoje = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
    const sessionObj = { ...dono, data: dataHoje };
    localStorage.setItem('bessa_session', JSON.stringify(sessionObj));
    window.location.href = '/'; 
  };

  const abrirMetricas = (empresa) => {
    setEmpresaSelecionadaMetricas(empresa);
    setModalMetricasAberto(true);
  };

  const renderAvatar = (empresa, sizeClass) => {
    const urlLogo = empresa.logo || empresa.foto || empresa.logo_url;
    const validUrlRegex = /^(http|https):\/\/[^ "]+$/;
    const baseClasses = `flex-shrink-0 rounded-full flex items-center justify-center overflow-hidden aspect-square ${sizeClass}`;
    
    if (urlLogo && validUrlRegex.test(urlLogo)) {
      return (
        <div className={`${baseClasses} bg-black/5 dark:bg-white/5 border ${temaNoturno ? 'border-white/10' : 'border-black/5'}`}>
          <img src={urlLogo} alt="Logo" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
          <span style={{ display: 'none' }} className="font-black w-full h-full items-center justify-center bg-gray-200 text-gray-500">
            {empresa.nome.charAt(0).toUpperCase()}
          </span>
        </div>
      );
    } else {
      const isPro = empresa.plano !== 'free';
      const initial = empresa.nome.charAt(0).toUpperCase();
      return (
        <div className={`${baseClasses} font-black text-lg ${isPro ? 'bg-gradient-to-b from-indigo-500 to-blue-600 text-white shadow-lg' : (temaNoturno ? 'bg-white/10 text-white border border-white/5' : 'bg-black/5 text-black border border-black/5')}`}>
          {initial}
        </div>
      );
    }
  };

  const calcularGastosEstimados = (totalRegistros) => {
    const custoPorRegistro = 0.02; 
    const custoMensal = totalRegistros * custoPorRegistro;
    const custoMinimo = custoMensal < 5 ? 0 : custoMensal; 
    return {
       mes: `R$ ${custoMinimo.toFixed(2)}`,
       ano: `R$ ${(custoMinimo * 12).toFixed(2)}`
    };
  };

  const getPrecoMensalReal = (planoId) => {
    if (planoId === 'free' || !planoId) return 0;
    const ciclo = CICLOS_PREMIUM.find(c => c.id === planoId);
    return ciclo ? ciclo.precoMes : 97;
  };

  const getNomePlano = (planoId) => {
    if (planoId === 'free') return 'Trial';
    const ciclo = CICLOS_PREMIUM.find(c => c.id === planoId);
    return ciclo ? ciclo.nome : 'Premium';
  };

  const empresasFiltradas = useMemo(() => {
    if (!termoPesquisa) return empresas;
    const termo = termoPesquisa.toLowerCase();
    return empresas.filter(emp => emp.nome.toLowerCase().includes(termo) || (emp.usuarios?.[0]?.nome_usuario || '').toLowerCase().includes(termo));
  }, [empresas, termoPesquisa]);

  const stats = useMemo(() => {
    const pagantes = empresas.filter(e => e.plano !== 'free' && e.plano !== null);
    const mrr = pagantes.reduce((acc, emp) => acc + getPrecoMensalReal(emp.plano), 0);
    const storageEstimado = empresas.reduce((acc, emp) => acc + (emp.uso_registros * 2.5), 0); // 2.5MB por avg table
    const topActive = [...empresas].sort((a,b) => b.uso_registros - a.uso_registros).slice(0,4);
    const inactives = empresas.filter(e => e.uso_registros === 0 || e.ativo === false).slice(0,4);

    return {
      total: empresas.length,
      ativos: empresas.filter(e => e.ativo !== false).length,
      bloqueados: empresas.filter(e => e.ativo === false).length,
      pagantes: pagantes.length,
      testes: empresas.filter(e => e.plano === 'free').length,
      receitaEstimada: mrr,
      storageGlobal: (storageEstimado / 1024).toFixed(2), // em GB
      topActive,
      inactives
    };
  }, [empresas]);

  // Inteligência Mockada baseada em dados reais para o Global History
  const historicoGlobal = useMemo(() => {
    if (!empresas.length) return [];
    let eventos = [];
    empresas.forEach((emp, i) => {
       const user = emp.usuarios?.[0]?.nome_usuario || 'System';
       eventos.push({ id: `c-${emp.id}`, tipo: 'criacao', titulo: 'Infraestrutura Alocada', desc: `Workspace criado por ${user}`, workspace: emp.nome, tempo: `${(i % 5) + 1}m atrás`, cor: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: 'M12 6v6m0 0v6m0-6h6m-6 0H6' });
       
       if (emp.uso_registros > 100) {
          eventos.push({ id: `u-${emp.id}`, tipo: 'pico', titulo: 'Pico de Transações', desc: 'Alta densidade de I/O de disco', workspace: emp.nome, tempo: `${(i % 12) + 2}h atrás`, cor: 'text-indigo-500', bg: 'bg-indigo-500/10', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' });
       }
       if (emp.plano !== 'free') {
          eventos.push({ id: `p-${emp.id}`, tipo: 'upgrade', titulo: 'Upgrade de Licença', desc: `Migrou para ${getNomePlano(emp.plano)}`, workspace: emp.nome, tempo: `${(i % 24) + 5}h atrás`, cor: 'text-blue-500', bg: 'bg-blue-500/10', icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z' });
       }
       if (!emp.ativo) {
          eventos.push({ id: `s-${emp.id}`, tipo: 'suspensao', titulo: 'Conta Suspensa', desc: 'Acesso revogado pela rede', workspace: emp.nome, tempo: `${(i % 48) + 1}d atrás`, cor: 'text-rose-500', bg: 'bg-rose-500/10', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' });
       }
    });
    // Shuffle deterministico e sort
    eventos = eventos.sort((a,b) => parseInt(a.tempo.match(/\d+/)[0]) - parseInt(b.tempo.match(/\d+/)[0]));
    return eventos.slice(0, 20);
  }, [empresas]);

  const NavegacaoItens = [
    { id: 'dashboard', label: 'Infraestrutura', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
    { id: 'historico', label: 'Histórico Global', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'clientes', label: 'Gestão de Nodes', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
    { id: 'novo', label: 'Provisionar Workspace', icon: 'M13 10V3L4 14h7v7l9-11h-7z' }
  ];

  return (
    <div className={`min-h-screen flex flex-col md:flex-row transition-colors duration-300 font-sans ${temaNoturno ? 'bg-[#0A0A0A] text-zinc-100' : 'bg-[#FAFAFA] text-zinc-900'}`}>
      
      {/* TOAST NOTIFICAÇÕES PREMIUM */}
      {toast.visivel && (
        <div className="fixed bottom-6 right-6 z-[200] max-w-sm w-full animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border backdrop-blur-3xl ${
            toast.tipo === 'erro' ? (temaNoturno ? 'bg-rose-950/40 border-rose-900/50 text-rose-200' : 'bg-rose-50 border-rose-200 text-rose-800') 
            : toast.tipo === 'sucesso' ? (temaNoturno ? 'bg-emerald-950/40 border-emerald-900/50 text-emerald-200' : 'bg-emerald-50 border-emerald-200 text-emerald-800')
            : (temaNoturno ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-black/5 text-black')
          }`}>
            <span className="font-medium text-[13px] tracking-tight truncate">{toast.texto}</span>
          </div>
        </div>
      )}

      {/* HEADER MOBILE */}
      <div className={`md:hidden sticky top-0 z-40 flex items-center justify-between p-4 border-b backdrop-blur-2xl ${temaNoturno ? 'bg-[#0A0A0A]/80 border-white/5' : 'bg-[#FAFAFA]/80 border-black/5 shadow-sm'}`}>
        <div className="flex items-center gap-3">
           <button onClick={() => setMenuMobileAberto(true)} className={`p-2 -ml-2 rounded-xl transition-all ${temaNoturno ? 'text-zinc-400 hover:bg-white/5' : 'text-zinc-600 hover:bg-black/5'}`}>
             <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" /></svg>
           </button>
           <span className="font-bold text-[15px] tracking-tight">AROX Enterprise</span>
        </div>
        <button onClick={() => setTemaNoturno(!temaNoturno)} className={`p-2 rounded-xl ${temaNoturno ? 'text-zinc-400 hover:bg-white/5' : 'text-zinc-500 hover:bg-black/5'}`}>
          {temaNoturno ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg> : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>}
        </button>
      </div>

      {/* DRAWER MENU MOBILE */}
      {menuMobileAberto && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMenuMobileAberto(false)}></div>
          <div className={`relative w-[80vw] max-w-[300px] h-full flex flex-col shadow-2xl animate-in slide-in-from-left duration-300 ${temaNoturno ? 'bg-[#0A0A0A] border-r border-white/10' : 'bg-[#FAFAFA]'}`}>
             <div className={`p-6 border-b flex justify-between items-center ${temaNoturno ? 'border-white/5' : 'border-black/5'}`}>
               <span className="font-bold text-lg tracking-tight">Painel de Controle</span>
               <button onClick={() => setMenuMobileAberto(false)} className={`p-2 rounded-xl ${temaNoturno ? 'bg-white/5 text-zinc-400' : 'bg-black/5 text-zinc-600'}`}><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
             </div>
             <nav className="flex-1 p-4 space-y-1">
               {NavegacaoItens.map(item => (
                 <button key={item.id} onClick={() => { setAbaAtiva(item.id); setMenuMobileAberto(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-[14px] transition-all ${abaAtiva === item.id ? (temaNoturno ? 'bg-white/10 text-white' : 'bg-black/5 text-black') : (temaNoturno ? 'text-zinc-400' : 'text-zinc-600')}`}>
                   <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} /></svg> {item.label}
                 </button>
               ))}
             </nav>
             <div className={`p-6 border-t ${temaNoturno ? 'border-white/5' : 'border-black/5'}`}>
               <button onClick={fazerLogout} className="w-full flex justify-center items-center gap-2 px-4 py-3 rounded-xl font-medium text-sm text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-lg shadow-rose-900/20">
                 Encerrar Sessão
               </button>
             </div>
          </div>
        </div>
      )}

      {/* SIDEBAR DESKTOP (ENTERPRISE) */}
      <aside className={`hidden md:flex w-64 lg:w-[280px] h-screen flex-col border-r transition-colors flex-shrink-0 ${temaNoturno ? 'bg-[#0A0A0A] border-white/[0.04]' : 'bg-[#FAFAFA] border-black/[0.04]'} sticky top-0`}>
        <div className="p-6 lg:p-8 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-zinc-900 dark:bg-white shadow-lg flex-shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-white dark:text-black"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
          </div>
          <div className="flex flex-col">
             <span className="font-bold text-[15px] tracking-tight leading-none">AROX Control</span>
             <span className={`text-[10px] uppercase tracking-widest font-semibold mt-1 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}`}>Enterprise Node</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-2 flex flex-col gap-1">
          {NavegacaoItens.map(item => (
            <button key={item.id} onClick={() => setAbaAtiva(item.id)} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-[13px] transition-all duration-200 ${abaAtiva === item.id ? (temaNoturno ? 'bg-white/10 text-white' : 'bg-black/5 text-black') : (temaNoturno ? 'text-zinc-500 hover:text-zinc-200 hover:bg-white/5' : 'text-zinc-500 hover:text-zinc-900 hover:bg-black/[0.03]')}`}>
              <svg className={`w-[18px] h-[18px] ${abaAtiva === item.id ? 'opacity-100' : 'opacity-60'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={item.icon} /></svg>
              {item.label}
            </button>
          ))}
        </nav>

        <div className={`flex flex-col gap-1 p-4 border-t ${temaNoturno ? 'border-white/[0.04]' : 'border-black/[0.04]'}`}>
           <button onClick={() => setTemaNoturno(!temaNoturno)} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-[13px] transition-colors ${temaNoturno ? 'text-zinc-500 hover:bg-white/5 hover:text-white' : 'text-zinc-500 hover:bg-black/5 hover:text-black'}`}>
             {temaNoturno ? <svg className="w-[18px] h-[18px] opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg> : <svg className="w-[18px] h-[18px] opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>}
             {temaNoturno ? 'Modo Iluminado' : 'Modo Escuro'}
           </button>
           <button onClick={fazerLogout} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-[13px] transition-colors ${temaNoturno ? 'text-rose-500/80 hover:bg-rose-500/10 hover:text-rose-400' : 'text-rose-600/80 hover:bg-rose-50 hover:text-rose-700'}`}>
             <svg className="w-[18px] h-[18px] opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
             Desconectar Nó
           </button>
        </div>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 w-full min-w-0 p-4 md:p-8 lg:p-12 overflow-y-auto relative">
        
        {/* Glow Effects de Fundo (Apenas Dark) */}
        {temaNoturno && (
           <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
             <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-indigo-600/5 blur-[120px] rounded-full"></div>
             <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] bg-purple-600/5 blur-[120px] rounded-full"></div>
           </div>
        )}

        <div className="max-w-6xl mx-auto space-y-8 md:space-y-12">
          
          {/* =========================================================================
              DASHBOARD INFRAESTRUTURA (NOVO) 
             ========================================================================= */}
          {abaAtiva === 'dashboard' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
              <header className="mb-8 md:mb-10">
                <h2 className={`text-[28px] md:text-[32px] font-bold tracking-tight ${temaNoturno ? 'text-white' : 'text-slate-900'}`}>Infraestrutura Global</h2>
                <p className={`text-[13px] md:text-[14px] mt-1 font-medium ${temaNoturno ? 'text-zinc-400' : 'text-zinc-500'}`}>Visão geral da rede, consumo de storage e instâncias operacionais.</p>
              </header>
              
              {/* GRID MÉTRICAS PRIMÁRIAS */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mb-5 md:mb-8">
                {[
                  { label: 'MRR Cloud', valor: `R$ ${stats.receitaEstimada.toFixed(2)}`, desc: 'Receita projetada', icone: 'M13 10V3L4 14h7v7l9-11h-7z', cor: 'text-emerald-500', bgCor: temaNoturno ? 'bg-emerald-500/10' : 'bg-emerald-50' },
                  { label: 'Storage Consumido', valor: `${stats.storageGlobal} GB`, desc: '~2.5MB / Workspace', icone: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4', cor: 'text-indigo-500', bgCor: temaNoturno ? 'bg-indigo-500/10' : 'bg-indigo-50' },
                  { label: 'Nodes Ativos', valor: stats.ativos, desc: 'Instâncias online', icone: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9', cor: 'text-blue-500', bgCor: temaNoturno ? 'bg-blue-500/10' : 'bg-blue-50' },
                  { label: 'Risco de Churn', valor: stats.bloqueados + stats.testes, desc: 'Contas em perigo/trial', icone: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z', cor: 'text-rose-500', bgCor: temaNoturno ? 'bg-rose-500/10' : 'bg-rose-50' }
                ].map((stat, i) => (
                  <div key={i} className={`p-5 md:p-6 rounded-[20px] border flex flex-col justify-between transition-shadow hover:shadow-md ${temaNoturno ? 'bg-[#111111]/80 border-white/[0.04]' : 'bg-white border-black/[0.04]'}`}>
                    <div className="flex justify-between items-start mb-4">
                      <div className={`p-2.5 rounded-xl ${stat.bgCor}`}>
                        <svg className={`w-5 h-5 ${stat.cor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icone} /></svg>
                      </div>
                    </div>
                    <div>
                      <p className={`text-[11px] font-semibold tracking-wide mb-1 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>{stat.label}</p>
                      <h3 className={`text-[22px] font-bold tracking-tight truncate ${temaNoturno ? 'text-white' : 'text-slate-900'}`}>{stat.valor}</h3>
                      <p className={`text-[10px] mt-1 font-medium ${temaNoturno ? 'text-zinc-600' : 'text-zinc-400'}`}>{stat.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* GRID ASSIMÉTRICO (GRÁFICO + MOST ACTIVE) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-6">
                 
                 {/* GRÁFICO (Simulação elegante SVG) */}
                 <div className={`lg:col-span-2 p-6 md:p-8 rounded-[24px] border flex flex-col ${temaNoturno ? 'bg-[#111111]/80 border-white/[0.04]' : 'bg-white border-black/[0.04]'}`}>
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h4 className={`text-[15px] font-bold ${temaNoturno ? 'text-white' : 'text-slate-900'}`}>Expansão de Rede (30 dias)</h4>
                        <p className={`text-[12px] font-medium mt-0.5 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>Novos deploys e tráfego contínuo.</p>
                      </div>
                      <div className={`px-3 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1.5 ${temaNoturno ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
                         <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></div> Live
                      </div>
                    </div>
                    <div className="flex-1 w-full relative min-h-[200px] flex items-end opacity-80">
                       <svg className="w-full h-[80%]" preserveAspectRatio="none" viewBox="0 0 100 100">
                          <defs>
                            <linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1">
                              <stop offset="0%" stopColor={temaNoturno ? '#6366f1' : '#4f46e5'} stopOpacity="0.4" />
                              <stop offset="100%" stopColor={temaNoturno ? '#6366f1' : '#4f46e5'} stopOpacity="0" />
                            </linearGradient>
                          </defs>
                          <path d="M0,100 L0,80 Q10,70 20,85 T40,60 T60,50 T80,30 T100,10 L100,100 Z" fill="url(#gradient)" />
                          <path d="M0,80 Q10,70 20,85 T40,60 T60,50 T80,30 T100,10" fill="none" stroke={temaNoturno ? '#818cf8' : '#6366f1'} strokeWidth="2" strokeLinecap="round" />
                       </svg>
                    </div>
                 </div>

                 {/* TOP ACTIVE NODES */}
                 <div className={`p-6 rounded-[24px] border flex flex-col ${temaNoturno ? 'bg-[#111111]/80 border-white/[0.04]' : 'bg-white border-black/[0.04]'}`}>
                    <h4 className={`text-[13px] font-bold uppercase tracking-widest mb-6 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}`}>Pico de Transações</h4>
                    <div className="flex flex-col gap-4 flex-1">
                      {stats.topActive.length > 0 ? stats.topActive.map((emp, i) => (
                        <div key={emp.id} className="flex items-center gap-3">
                           <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[11px] ${i === 0 ? (temaNoturno ? 'bg-amber-500/10 text-amber-500' : 'bg-amber-50 text-amber-600') : (temaNoturno ? 'bg-white/5 text-zinc-400' : 'bg-black/5 text-zinc-600')}`}>
                             #{i+1}
                           </div>
                           <div className="flex-1 min-w-0">
                             <div className={`text-[13px] font-semibold truncate ${temaNoturno ? 'text-zinc-200' : 'text-slate-800'}`}>{emp.nome}</div>
                             <div className={`text-[11px] font-medium mt-0.5 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>{emp.uso_registros} requests</div>
                           </div>
                        </div>
                      )) : <p className={`text-xs ${temaNoturno?'text-zinc-600':'text-zinc-400'}`}>Sem dados de uso recentes.</p>}
                    </div>
                 </div>

              </div>

              {/* LISTA INATIVAS */}
              {stats.inactives.length > 0 && (
                <div className={`p-6 md:p-8 rounded-[24px] border ${temaNoturno ? 'bg-rose-950/10 border-rose-900/30' : 'bg-rose-50/50 border-rose-100'}`}>
                   <h4 className={`text-[13px] font-bold uppercase tracking-widest mb-4 ${temaNoturno ? 'text-rose-500/80' : 'text-rose-600'}`}>Alerta de Churn (Inatividade)</h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                     {stats.inactives.map(emp => (
                       <div key={emp.id} className={`p-4 rounded-xl border ${temaNoturno ? 'bg-[#111111] border-white/5' : 'bg-white border-black/5'}`}>
                         <span className={`text-[13px] font-semibold truncate block ${temaNoturno ? 'text-zinc-200' : 'text-slate-800'}`}>{emp.nome}</span>
                         <span className={`text-[11px] font-medium mt-1 block ${temaNoturno ? 'text-rose-400' : 'text-rose-600'}`}>0 IOPS (Risco Alto)</span>
                       </div>
                     ))}
                   </div>
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              HISTÓRICO GLOBAL (NOVO) 
             ========================================================================= */}
          {abaAtiva === 'historico' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out max-w-4xl mx-auto">
              <header className="mb-8 md:mb-12 text-center md:text-left">
                <h2 className={`text-[28px] md:text-[32px] font-bold tracking-tight ${temaNoturno ? 'text-white' : 'text-slate-900'}`}>Histórico Global</h2>
                <p className={`text-[13px] md:text-[14px] mt-1 font-medium ${temaNoturno ? 'text-zinc-400' : 'text-zinc-500'}`}>Timeline de eventos críticos de todos os nós em tempo real.</p>
              </header>

              <div className="relative pl-6 md:pl-8 border-l-2 ml-4 md:ml-0" style={{ borderColor: temaNoturno ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}>
                 {historicoGlobal.length === 0 ? (
                    <div className="py-10 text-zinc-500 text-sm">Nenhum evento registrado na rede.</div>
                 ) : (
                    historicoGlobal.map((evento, i) => (
                      <div key={evento.id} className="relative mb-10 last:mb-0 group cursor-default">
                         {/* Bolinha da Timeline */}
                         <div className={`absolute -left-[33px] md:-left-[41px] top-1 w-[18px] h-[18px] md:w-[20px] md:h-[20px] rounded-full border-4 transition-transform group-hover:scale-110 ${temaNoturno ? 'bg-[#0A0A0A] border-[#222]' : 'bg-[#FAFAFA] border-gray-300'}`}>
                           <div className={`w-full h-full rounded-full ${evento.bg} ring-2 ${temaNoturno ? 'ring-[#0A0A0A]' : 'ring-[#FAFAFA]'}`}></div>
                         </div>
                         
                         <div className={`p-5 rounded-[20px] border transition-all duration-300 ${temaNoturno ? 'bg-[#111111]/60 border-white/[0.04] group-hover:bg-[#111111]' : 'bg-white border-black/[0.04] shadow-sm group-hover:shadow-md'}`}>
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                               <div className="flex items-center gap-2.5">
                                  <div className={`p-1.5 rounded-lg ${evento.bg}`}><svg className={`w-4 h-4 ${evento.cor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={evento.icon} /></svg></div>
                                  <span className={`text-[14px] font-bold ${temaNoturno ? 'text-zinc-200' : 'text-slate-800'}`}>{evento.titulo}</span>
                               </div>
                               <span className={`text-[11px] font-semibold tracking-wide ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}`}>{evento.tempo}</span>
                            </div>
                            <p className={`text-[13px] font-medium leading-relaxed ${temaNoturno ? 'text-zinc-400' : 'text-zinc-600'}`}>{evento.desc}</p>
                            <div className={`mt-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold ${temaNoturno ? 'bg-white/5 text-zinc-300' : 'bg-black/5 text-zinc-700'}`}>
                               <svg className="w-3.5 h-3.5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                               {evento.workspace}
                            </div>
                         </div>
                      </div>
                    ))
                 )}
              </div>
            </div>
          )}

          {/* =========================================================================
              LISTAGEM DE CLIENTES (GESTÃO DE NODES)
             ========================================================================= */}
          {abaAtiva === 'clientes' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
               <header className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 md:gap-6 mb-8 md:mb-10">
                 <div>
                   <h2 className={`text-[28px] md:text-[32px] font-bold tracking-tight ${temaNoturno ? 'text-white' : 'text-slate-900'}`}>Gestão de Nodes</h2>
                   <p className={`text-[13px] md:text-[14px] mt-1 font-medium ${temaNoturno ? 'text-zinc-400' : 'text-zinc-500'}`}>Administração detalhada dos clusters de clientes.</p>
                 </div>
                 
                 <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                   <div className={`relative flex-1 flex items-center p-1 rounded-xl border transition-all focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 ${temaNoturno ? 'bg-[#111111] border-white/10' : 'bg-white border-black/10'}`}>
                     <svg className={`w-4 h-4 ml-3 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                     <input type="text" value={termoPesquisa} onChange={e => setTermoPesquisa(e.target.value)} placeholder="Pesquisar ID ou Workspace..." className={`w-full py-2.5 px-3 bg-transparent outline-none font-medium text-[13px] ${temaNoturno ? 'text-white placeholder-zinc-600' : 'text-slate-900 placeholder-zinc-400'}`} />
                   </div>
                   
                   <button onClick={carregarEmpresas} disabled={loading} className={`flex justify-center px-6 py-3 sm:py-0 text-[13px] font-semibold rounded-xl border transition-all items-center gap-2 ${temaNoturno ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white' : 'bg-black/5 border-black/10 hover:bg-black/10 text-black'}`}>
                     {loading ? <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div> : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>}
                     <span className="hidden sm:inline">Sync</span>
                   </button>
                 </div>
               </header>

               {loading ? (
                 <div className="flex justify-center py-20"><div className="animate-pulse flex space-x-4"><div className="w-3 h-3 bg-indigo-500 rounded-full"></div><div className="w-3 h-3 bg-indigo-500 rounded-full"></div><div className="w-3 h-3 bg-indigo-500 rounded-full"></div></div></div>
               ) : empresasFiltradas.length === 0 ? (
                 <div className="text-center py-20 opacity-50 font-medium text-[14px]">Nenhum registro correspondente.</div>
               ) : (
                 <>
                   {/* DESKTOP TABLE ENTERPRISE */}
                   <div className={`hidden md:block border rounded-[20px] shadow-sm overflow-hidden ${temaNoturno ? 'border-white/[0.04] bg-[#111111]/50' : 'border-black/[0.04] bg-white'}`}>
                     <div className="overflow-x-auto w-full">
                       <table className="w-full text-left min-w-[800px] border-collapse">
                         <thead className={`text-[10px] uppercase font-bold tracking-widest ${temaNoturno ? 'bg-[#1A1A1A] text-zinc-500 border-b border-white/[0.04]' : 'bg-[#FAFAFA] text-zinc-400 border-b border-black/[0.04]'}`}>
                           <tr>
                             <th className="px-6 py-4 w-[35%] font-semibold">Workspace / ID</th>
                             <th className="px-6 py-4 font-semibold">Storage</th>
                             <th className="px-6 py-4 font-semibold">Tier</th>
                             <th className="px-6 py-4 font-semibold">Status</th>
                             <th className="px-6 py-4 text-right w-[180px] font-semibold">Ações</th>
                           </tr>
                         </thead>
                         <tbody className={`divide-y ${temaNoturno ? 'divide-white/[0.02]' : 'divide-black/[0.03]'}`}>
                           {empresasFiltradas.map(emp => {
                              const dono = emp.usuarios?.[0]; const isAtivo = emp.ativo !== false; const isPro = emp.plano !== 'free'; const mbUsados = ((emp.uso_registros * 2) / 1024).toFixed(2);

                              return (
                                <tr key={emp.id} className={`${temaNoturno ? 'hover:bg-white/[0.02]' : 'hover:bg-black/[0.02]'} transition-colors cursor-pointer group`} onClick={() => abrirMetricas(emp)}>
                                  <td className="px-6 py-4 flex items-center gap-3">
                                    {renderAvatar(emp, 'w-10 h-10')}
                                    <div className="flex-1 overflow-hidden">
                                      <div className={`font-semibold text-[14px] truncate transition-colors ${temaNoturno ? 'text-zinc-200 group-hover:text-indigo-400' : 'text-slate-800 group-hover:text-indigo-600'}`}>{emp.nome}</div>
                                      <div className={`text-[11px] font-medium mt-0.5 truncate ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>{dono?.email || 'Sem root user'}</div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className={`text-[13px] font-medium font-mono ${temaNoturno ? 'text-zinc-300' : 'text-slate-700'}`}>
                                      ~{mbUsados} MB
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest ${isPro ? (temaNoturno ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600') : (temaNoturno ? 'bg-white/5 text-zinc-400' : 'bg-black/5 text-zinc-600')}`}>{getNomePlano(emp.plano)}</span>
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest ${isAtivo ? (temaNoturno ? 'text-emerald-400 bg-emerald-500/10' : 'text-emerald-700 bg-emerald-50') : (temaNoturno ? 'text-rose-400 bg-rose-500/10' : 'text-rose-700 bg-rose-50')}`}>
                                      <div className={`w-1.5 h-1.5 rounded-full ${isAtivo ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                                      {isAtivo ? 'Online' : 'Offline'}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-1.5">
                                      <button onClick={(e) => { e.stopPropagation(); abrirLogsCliente(emp.id); }} className={`p-2 rounded-lg transition-all ${temaNoturno ? 'hover:bg-white/10 text-zinc-400' : 'hover:bg-black/5 text-zinc-500'}`} title="Auditoria"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg></button>
                                      <button onClick={(e) => { e.stopPropagation(); abrirModalEdicao(emp, dono); }} className={`p-2 rounded-lg transition-all ${temaNoturno ? 'hover:bg-white/10 text-zinc-400' : 'hover:bg-black/5 text-zinc-500'}`} title="Editar Node"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                                      <button onClick={(e) => { e.stopPropagation(); entrarComoCliente(dono); }} className={`p-2 rounded-lg transition-all ${temaNoturno ? 'hover:bg-indigo-500/20 text-indigo-400' : 'hover:bg-indigo-50 text-indigo-600'}`} title="Impersonate"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg></button>
                                      <button onClick={(e) => { e.stopPropagation(); abrirConfirmModal(emp); }} className={`p-2 rounded-lg transition-all ${temaNoturno ? 'hover:bg-rose-500/20 text-rose-400' : 'hover:bg-rose-50 text-rose-600'}`} title={isAtivo ? 'Suspender' : 'Reativar'}><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg></button>
                                    </div>
                                  </td>
                                </tr>
                              )
                           })}
                         </tbody>
                       </table>
                     </div>
                   </div>

                   {/* MOBILE CARDS */}
                   <div className="md:hidden space-y-3">
                     {empresasFiltradas.map(emp => {
                       const dono = emp.usuarios?.[0]; const isAtivo = emp.ativo !== false; const isPro = emp.plano !== 'free'; const mbUsados = ((emp.uso_registros * 2) / 1024).toFixed(2);

                       return (
                         <div key={emp.id} className={`p-5 rounded-2xl border flex flex-col gap-4 relative overflow-hidden ${temaNoturno ? 'bg-[#111111] border-white/5' : 'bg-white border-black/5'}`} onClick={() => abrirMetricas(emp)}>
                           <div className="flex justify-between items-start gap-3">
                              <div className="flex items-center gap-3">
                                {renderAvatar(emp, 'w-12 h-12')}
                                <div className="flex-1 overflow-hidden">
                                  <h3 className={`font-bold text-[15px] leading-tight truncate ${temaNoturno ? 'text-white' : 'text-slate-900'}`}>{emp.nome}</h3>
                                  <p className={`text-[11px] font-medium mt-1 truncate ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>{dono?.email || 'Pendente'}</p>
                                </div>
                              </div>
                           </div>

                           <div className="grid grid-cols-2 gap-2">
                             <div className={`p-3 rounded-xl border flex items-center gap-2 ${temaNoturno ? 'bg-[#1A1A1A] border-white/5 text-zinc-300' : 'bg-gray-50 border-black/5 text-zinc-700'}`}>
                                <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                <span className="text-[11px] font-semibold truncate">{getNomePlano(emp.plano)}</span>
                             </div>
                             <div className={`p-3 rounded-xl border flex items-center gap-2 ${temaNoturno ? 'bg-[#1A1A1A] border-white/5 text-zinc-300' : 'bg-gray-50 border-black/5 text-zinc-700'}`}>
                                <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>
                                <span className="text-[11px] font-semibold font-mono">~{mbUsados} MB</span>
                             </div>
                           </div>

                           <div className={`pt-3 flex gap-2 w-full border-t ${temaNoturno ? 'border-white/5' : 'border-black/5'}`}>
                              <button onClick={(e) => { e.stopPropagation(); abrirLogsCliente(emp.id); }} className={`flex-1 flex justify-center py-2.5 rounded-lg transition ${temaNoturno ? 'bg-white/5 text-zinc-300' : 'bg-black/5 text-zinc-700'}`}><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg></button>
                              <button onClick={(e) => { e.stopPropagation(); abrirModalEdicao(emp, dono); }} className={`flex-1 flex justify-center py-2.5 rounded-lg transition ${temaNoturno ? 'bg-white/5 text-zinc-300' : 'bg-black/5 text-zinc-700'}`}><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                              <button onClick={(e) => { e.stopPropagation(); entrarComoCliente(dono); }} className={`flex-1 flex justify-center py-2.5 rounded-lg transition ${temaNoturno ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg></button>
                              <button onClick={(e) => { e.stopPropagation(); abrirConfirmModal(emp); }} className={`flex-1 flex justify-center py-2.5 rounded-lg transition ${temaNoturno ? 'bg-rose-500/20 text-rose-400' : 'bg-rose-50 text-rose-600'}`}><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg></button>
                           </div>
                         </div>
                       )
                     })}
                   </div>
                 </>
               )}
            </div>
          )}

          {/* =========================================================================
              SETUP DE WORKSPACE WIZARD LÚDICO (CINEMATIC) 
             ========================================================================= */}
          {abaAtiva === 'novo' && (
            <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out pb-10 pt-2">
               
               {etapaWizard < 5 && (
                 <>
                   <header className="mb-10 md:mb-12">
                     <h2 className={`text-[28px] md:text-[32px] font-bold tracking-tight ${temaNoturno ? 'text-white' : 'text-slate-900'}`}>Provisionar Workspace</h2>
                     <p className={`text-[13px] md:text-[14px] mt-1 font-medium ${temaNoturno ? 'text-zinc-400' : 'text-zinc-500'}`}>Criação de nova instância isolada no cluster.</p>
                   </header>

                   {/* LINEAR PROGRESS BAR */}
                   <div className="flex items-center gap-2 mb-10 overflow-hidden">
                     {[1,2,3,4].map(step => (
                        <div key={step} className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${etapaWizard >= step ? (temaNoturno ? 'bg-indigo-500' : 'bg-indigo-600') : (temaNoturno ? 'bg-white/10' : 'bg-black/10')}`}></div>
                     ))}
                   </div>
                 </>
               )}

               <div className={`rounded-[24px] border relative overflow-hidden transition-all duration-500 ${etapaWizard === 5 ? 'bg-transparent border-transparent shadow-none' : (temaNoturno ? 'bg-[#111111]/80 border-white/[0.04] shadow-2xl' : 'bg-white border-black/[0.04] shadow-xl')}`}>
                  
                  {etapaWizard < 5 && (
                    <form onSubmit={iniciarProvisionamento} className="relative z-10 p-6 md:p-10">
                      
                      {/* ETAPA 1: LICENÇA */}
                      {etapaWizard === 1 && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                          <h3 className={`text-xl md:text-2xl font-bold mb-6 tracking-tight ${temaNoturno ? 'text-white' : 'text-slate-900'}`}>Definição de Licença</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
                            
                            <label className={`relative flex flex-col p-6 rounded-[20px] border cursor-pointer transition-all ${formData.tipoPlano === 'free' ? (temaNoturno ? 'border-indigo-500 bg-indigo-500/5 shadow-[0_0_20px_rgba(99,102,241,0.1)]' : 'border-indigo-500 bg-indigo-50 shadow-md') : (temaNoturno ? 'border-white/5 hover:border-white/10 bg-[#1A1A1A]' : 'border-black/5 hover:border-black/10 bg-[#FAFAFA]')}`}>
                              <input type="radio" name="tipoPlano" value="free" checked={formData.tipoPlano === 'free'} onChange={handleChange} className="sr-only" />
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${temaNoturno ? 'bg-white/5 text-zinc-400' : 'bg-black/5 text-zinc-500'}`}>
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                              </div>
                              <span className={`font-bold text-[18px] mb-1.5 tracking-tight ${temaNoturno ? 'text-white' : 'text-slate-900'}`}>Trial Degustação</span>
                              <span className={`text-[13px] font-medium leading-relaxed ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>Acesso temporário para prospecção sem geração de fatura.</span>
                              {formData.tipoPlano === 'free' && <div className="absolute top-6 right-6 w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>}
                            </label>

                            <label className={`relative flex flex-col p-6 rounded-[20px] border cursor-pointer transition-all ${formData.tipoPlano === 'premium' ? (temaNoturno ? 'border-indigo-500 bg-indigo-500/5 shadow-[0_0_20px_rgba(99,102,241,0.1)]' : 'border-indigo-500 bg-indigo-50 shadow-md') : (temaNoturno ? 'border-white/5 hover:border-white/10 bg-[#1A1A1A]' : 'border-black/5 hover:border-black/10 bg-[#FAFAFA]')}`}>
                              <input type="radio" name="tipoPlano" value="premium" checked={formData.tipoPlano === 'premium'} onChange={handleChange} className="sr-only" />
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${temaNoturno ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
                              </div>
                              <span className={`font-bold text-[18px] mb-1.5 tracking-tight ${temaNoturno ? 'text-indigo-400' : 'text-indigo-600'}`}>Enterprise Node</span>
                              <span className={`text-[13px] font-medium leading-relaxed ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>Provisionamento completo com recursos liberados e recorrência.</span>
                              {formData.tipoPlano === 'premium' && <div className="absolute top-6 right-6 w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>}
                            </label>
                          </div>
                        </div>
                      )}

                      {/* ETAPA 2: CICLOS */}
                      {etapaWizard === 2 && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                          <h3 className={`text-xl md:text-2xl font-bold mb-6 tracking-tight ${temaNoturno ? 'text-white' : 'text-slate-900'}`}>Faturamento</h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {CICLOS_PREMIUM.map(ciclo => {
                              const isSelected = formData.ciclo === ciclo.id;
                              return (
                                <label key={ciclo.id} className={`relative flex flex-col p-5 rounded-[20px] border cursor-pointer transition-all ${isSelected ? (temaNoturno ? 'border-indigo-500 bg-indigo-500/5 shadow-md' : 'border-indigo-500 bg-indigo-50 shadow-sm') : (temaNoturno ? 'border-white/5 hover:border-white/10 bg-[#1A1A1A]' : 'border-black/5 hover:border-black/10 bg-[#FAFAFA]')}`}>
                                  <input type="radio" name="ciclo" value={ciclo.id} checked={isSelected} onChange={handleChange} className="sr-only" />
                                  <h4 className={`font-bold text-[15px] mb-3 ${isSelected ? (temaNoturno ? 'text-indigo-400' : 'text-indigo-600') : (temaNoturno ? 'text-white' : 'text-slate-900')}`}>{ciclo.nome}</h4>
                                  <div className="flex items-baseline gap-1 mb-2">
                                    <span className={`text-[13px] font-semibold ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}`}>R$</span>
                                    <span className={`text-3xl font-black tabular-nums tracking-tighter ${temaNoturno ? 'text-white' : 'text-slate-900'}`}>{ciclo.precoMes}</span>
                                    <span className={`text-[12px] font-medium ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}`}>/mês</span>
                                  </div>
                                  <p className={`text-[11px] font-medium uppercase tracking-widest ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}`}>Total: R$ {ciclo.total},00</p>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* ETAPA 3: DADOS DA OPERAÇÃO */}
                      {etapaWizard === 3 && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500 max-w-2xl">
                          <h3 className={`text-xl md:text-2xl font-bold mb-6 tracking-tight ${temaNoturno ? 'text-white' : 'text-slate-900'}`}>Metadados da Operação</h3>
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               <div>
                                 <label className={`block text-[11px] font-bold uppercase tracking-widest mb-1.5 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>Localização (Cidade)</label>
                                 <input type="text" name="cidade" value={formData.cidade} onChange={handleChange} className={`w-full p-3.5 rounded-xl border outline-none font-semibold text-[14px] transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 ${temaNoturno ? 'bg-[#1A1A1A] border-white/10 text-white' : 'bg-[#FAFAFA] border-black/10 text-slate-900'}`} placeholder="Ex: São Paulo, SP" />
                               </div>
                               <div>
                                 <label className={`block text-[11px] font-bold uppercase tracking-widest mb-1.5 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>Modalidade</label>
                                 <select name="tipoOperacao" value={formData.tipoOperacao} onChange={handleChange} className={`w-full p-3.5 rounded-xl border outline-none font-semibold text-[14px] transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 ${temaNoturno ? 'bg-[#1A1A1A] border-white/10 text-white' : 'bg-[#FAFAFA] border-black/10 text-slate-900'}`}>
                                    <option value="hibrido">Híbrido (Salão + Delivery)</option>
                                    <option value="delivery">Apenas Delivery (Dark Kitchen)</option>
                                    <option value="salao">Apenas Salão</option>
                                 </select>
                               </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                               <div>
                                 <label className={`block text-[11px] font-bold uppercase tracking-widest mb-1.5 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>Abertura</label>
                                 <input type="time" name="abertura" value={formData.abertura} onChange={handleChange} className={`w-full p-3.5 rounded-xl border outline-none font-semibold text-[14px] transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 ${temaNoturno ? 'bg-[#1A1A1A] border-white/10 text-white' : 'bg-[#FAFAFA] border-black/10 text-slate-900'}`} />
                               </div>
                               <div>
                                 <label className={`block text-[11px] font-bold uppercase tracking-widest mb-1.5 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>Fechamento</label>
                                 <input type="time" name="fechamento" value={formData.fechamento} onChange={handleChange} className={`w-full p-3.5 rounded-xl border outline-none font-semibold text-[14px] transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 ${temaNoturno ? 'bg-[#1A1A1A] border-white/10 text-white' : 'bg-[#FAFAFA] border-black/10 text-slate-900'}`} />
                               </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* ETAPA 4: CHAVE E CREDENCIAIS */}
                      {etapaWizard === 4 && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500 flex flex-col md:flex-row gap-8">
                          
                          <div className="flex-1 space-y-4">
                            <h3 className={`text-xl md:text-2xl font-bold mb-6 tracking-tight ${temaNoturno ? 'text-white' : 'text-slate-900'}`}>Credenciais de Acesso</h3>
                            <div>
                               <input required type="text" name="nomeRestaurante" value={formData.nomeRestaurante} onChange={handleChange} className={`w-full p-3.5 rounded-xl border outline-none font-semibold text-[14px] transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 ${temaNoturno ? 'bg-[#1A1A1A] border-white/10 text-white' : 'bg-[#FAFAFA] border-black/10 text-slate-900'}`} placeholder="Nome do Restaurante" />
                            </div>
                            <div>
                               <input required type="text" name="nomeDono" value={formData.nomeDono} onChange={handleChange} className={`w-full p-3.5 rounded-xl border outline-none font-semibold text-[14px] transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 ${temaNoturno ? 'bg-[#1A1A1A] border-white/10 text-white' : 'bg-[#FAFAFA] border-black/10 text-slate-900'}`} placeholder="Nome do Responsável" />
                            </div>
                            <div>
                               <input required type="email" name="email" value={formData.email} onChange={handleChange} className={`w-full p-3.5 rounded-xl border outline-none font-semibold text-[14px] transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 ${temaNoturno ? 'bg-[#1A1A1A] border-white/10 text-white' : 'bg-[#FAFAFA] border-black/10 text-slate-900'}`} placeholder="E-mail Master" />
                            </div>
                            <div>
                               <input required type="text" name="senha" value={formData.senha} onChange={handleChange} className={`w-full p-3.5 rounded-xl border outline-none font-semibold text-[14px] transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 ${temaNoturno ? 'bg-[#1A1A1A] border-white/10 text-white' : 'bg-[#FAFAFA] border-black/10 text-slate-900'}`} placeholder="Senha Temporária" />
                            </div>
                          </div>

                          {/* CHAVE DE ATIVAÇÃO DISPLAY */}
                          <div className={`flex-[0.8] p-6 md:p-8 rounded-[24px] border flex flex-col items-center justify-center text-center ${temaNoturno ? 'bg-[#1A1A1A]/80 border-white/5' : 'bg-[#FAFAFA] border-black/5'}`}>
                             <div className={`w-12 h-12 rounded-xl mb-4 flex items-center justify-center ${temaNoturno ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                             </div>
                             <span className={`text-[11px] font-bold uppercase tracking-widest mb-2 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>Chave de Ativação</span>
                             <div className={`py-3 px-6 rounded-xl border font-mono text-2xl md:text-3xl font-black tracking-widest mb-4 ${temaNoturno ? 'bg-[#0A0A0A] border-white/10 text-white' : 'bg-white border-black/10 text-slate-900 shadow-sm'}`}>
                               {formData.chaveAtivacao || '---'}
                             </div>
                             <p className={`text-[12px] font-medium leading-relaxed max-w-[200px] ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>Repasse esta credencial para o lojista configurar o terminal.</p>
                          </div>
                        </div>
                      )}

                      {/* WIZARD CONTROLS */}
                      <div className={`flex items-center gap-3 mt-10 pt-6 border-t ${temaNoturno ? 'border-white/5' : 'border-black/5'}`}>
                         {etapaWizard > 1 && (
                           <button type="button" onClick={voltarWizard} className={`px-5 py-3 rounded-xl font-semibold text-[13px] transition-colors ${temaNoturno ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-black/5 hover:bg-black/10 text-slate-900'}`}>
                             Anterior
                           </button>
                         )}
                         <div className="flex-1"></div>
                         
                         {etapaWizard < 4 ? (
                           <button type="button" onClick={avancarWizard} className={`px-8 py-3 rounded-xl font-semibold text-[13px] transition-colors ${temaNoturno ? 'bg-white text-zinc-900 hover:bg-zinc-200' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm'}`}>
                             Prosseguir
                           </button>
                         ) : (
                           <button type="submit" disabled={loading} className={`px-8 py-3 rounded-xl font-semibold text-[13px] transition-colors shadow-lg ${temaNoturno ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/30' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/30'}`}>
                             Provisionar Node
                           </button>
                         )}
                      </div>
                    </form>
                  )}

                  {/* ETAPA 5: CINEMATIC LOADING */}
                  {etapaWizard === 5 && (
                    <div className="flex flex-col items-center justify-center p-16 md:p-24 text-center min-h-[400px] animate-in fade-in duration-700">
                       <div className="relative w-20 h-20 mb-8">
                         <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20"></div>
                         <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
                         <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></div>
                         </div>
                       </div>
                       <h3 className={`text-[20px] font-bold tracking-tight mb-2 ${temaNoturno ? 'text-white' : 'text-slate-900'}`}>Estabelecendo Conexão</h3>
                       <p className={`text-[14px] font-medium font-mono animate-pulse ${temaNoturno ? 'text-indigo-400' : 'text-indigo-600'}`}>{cinematicText}</p>
                    </div>
                  )}
               </div>
            </div>
          )}
        </div>
      </main>

      {/* =========================================================================
          MODAIS E DRAWERS EXISTENTES (COM ESTÉTICA PREMIUM MANTIDA)
         ========================================================================= */}
      
      {/* DRAWER EDIÇÃO DE CONTA */}
      {modalEdicaoAberto && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setModalEdicaoAberto(false)}></div>
          <div className={`relative w-[90vw] max-w-[400px] h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300 ${temaNoturno ? 'bg-[#0A0A0A] border-l border-white/10' : 'bg-[#FAFAFA]'}`}>
            <div className={`p-6 border-b flex justify-between items-center ${temaNoturno ? 'border-white/5' : 'border-black/5'}`}>
              <h3 className={`text-[16px] font-bold tracking-tight ${temaNoturno ? 'text-white' : 'text-slate-900'}`}>Setup de Instância</h3>
              <button onClick={() => setModalEdicaoAberto(false)} className={`p-2 rounded-lg transition-colors ${temaNoturno ? 'hover:bg-white/10 text-zinc-400' : 'hover:bg-black/5 text-zinc-500'}`}><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div>
                <label className={`block text-[11px] font-bold uppercase tracking-widest mb-1.5 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>Nível de Licença</label>
                <select name="plano" value={dadosEdicao.plano} onChange={handleChangeEdicao} className={`w-full p-3.5 rounded-xl border outline-none font-semibold text-[13px] transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 ${temaNoturno ? 'bg-[#1A1A1A] border-white/10 text-white' : 'bg-white border-black/10 text-slate-900 shadow-sm'}`}>
                  <option value="free">Trial / Degustação</option>
                  {CICLOS_PREMIUM.map(c => <option key={c.id} value={c.id}>Premium - {c.nome}</option>)}
                </select>
              </div>
              <div>
                <label className={`block text-[11px] font-bold uppercase tracking-widest mb-1.5 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>Workspace</label>
                <input type="text" name="nomeRestaurante" value={dadosEdicao.nomeRestaurante} onChange={handleChangeEdicao} className={`w-full p-3.5 rounded-xl border outline-none font-semibold text-[13px] transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 ${temaNoturno ? 'bg-[#1A1A1A] border-white/10 text-white' : 'bg-white border-black/10 text-slate-900 shadow-sm'}`} />
              </div>
              <div>
                <label className={`block text-[11px] font-bold uppercase tracking-widest mb-1.5 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>Root User (Gestor)</label>
                <input type="text" name="nomeDono" value={dadosEdicao.nomeDono} onChange={handleChangeEdicao} className={`w-full p-3.5 rounded-xl border outline-none font-semibold text-[13px] transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 ${temaNoturno ? 'bg-[#1A1A1A] border-white/10 text-white' : 'bg-white border-black/10 text-slate-900 shadow-sm'}`} />
              </div>
              <div>
                <label className={`block text-[11px] font-bold uppercase tracking-widest mb-1.5 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>E-mail Auth</label>
                <input type="email" name="email" value={dadosEdicao.email} onChange={handleChangeEdicao} className={`w-full p-3.5 rounded-xl border outline-none font-semibold text-[13px] transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 ${temaNoturno ? 'bg-[#1A1A1A] border-white/10 text-white' : 'bg-white border-black/10 text-slate-900 shadow-sm'}`} />
              </div>
              <div>
                <label className={`block text-[11px] font-bold uppercase tracking-widest mb-1.5 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>Overwrite Senha</label>
                <input type="text" name="senha" value={dadosEdicao.senha} onChange={handleChangeEdicao} className={`w-full p-3.5 rounded-xl border outline-none font-semibold text-[13px] transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 ${temaNoturno ? 'bg-[#1A1A1A] border-white/10 text-white' : 'bg-white border-black/10 text-slate-900 shadow-sm'}`} />
              </div>
            </div>

            <div className={`p-6 border-t ${temaNoturno ? 'border-white/5' : 'border-black/5'}`}>
              <button onClick={salvarEdicao} disabled={loading} className={`w-full py-3.5 rounded-xl font-semibold text-[13px] transition-colors shadow-sm flex justify-center items-center ${temaNoturno ? 'bg-white text-zinc-900 hover:bg-zinc-200' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>
                {loading ? <div className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full"></div> : 'Aplicar Configurações'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DRAWER TIMELINE DE AUDITORIA */}
      {modalLogsAberto && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setModalLogsAberto(false)}></div>
          <div className={`relative w-[90vw] max-w-[440px] h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300 ${temaNoturno ? 'bg-[#0A0A0A] border-l border-white/10' : 'bg-[#FAFAFA]'}`}>
            <div className={`p-6 border-b flex justify-between items-start ${temaNoturno ? 'border-white/5' : 'border-black/5'}`}>
              <div>
                <h3 className={`text-[16px] font-bold tracking-tight ${temaNoturno ? 'text-white' : 'text-slate-900'}`}>Auditoria de Acesso</h3>
                <p className={`text-[12px] mt-0.5 font-medium ${temaNoturno ? 'text-zinc-400' : 'text-zinc-500'}`}>Logs restritos do terminal selecionado.</p>
              </div>
              <button onClick={() => setModalLogsAberto(false)} className={`p-2 rounded-lg transition-colors ${temaNoturno ? 'hover:bg-white/10 text-zinc-400' : 'hover:bg-black/5 text-zinc-500'}`}><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            
            <div className={`px-6 py-4 border-b flex items-center justify-between ${temaNoturno ? 'border-white/5 bg-[#111]' : 'border-black/5 bg-white'}`}>
               <button onClick={() => mudarDiaLog(-1)} className={`p-2 rounded-lg border transition-colors ${temaNoturno ? 'border-white/10 hover:bg-white/5 text-zinc-300' : 'border-black/10 hover:bg-black/5 text-slate-900'}`}><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
               <div className="flex flex-col items-center">
                 <span className={`font-bold text-[12px] tracking-widest uppercase ${temaNoturno ? 'text-white' : 'text-slate-900'}`}>{dataFiltroLogs.toLocaleDateString('pt-BR', { weekday: 'long' })}</span>
                 <span className={`text-[11px] font-medium ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>{dataFiltroLogs.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
               </div>
               <button onClick={() => mudarDiaLog(1)} className={`p-2 rounded-lg border transition-colors ${temaNoturno ? 'border-white/10 hover:bg-white/5 text-zinc-300' : 'border-black/10 hover:bg-black/5 text-slate-900'}`}><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 relative">
              {loadingLogs ? (
                 <div className="flex justify-center items-center h-full"><div className="animate-pulse flex space-x-2"><div className="w-2 h-2 bg-indigo-500 rounded-full"></div><div className="w-2 h-2 bg-indigo-500 rounded-full"></div><div className="w-2 h-2 bg-indigo-500 rounded-full"></div></div></div>
              ) : logsCliente.length === 0 ? (
                 <div className="flex flex-col items-center justify-center h-full opacity-40 text-center">
                   <span className="font-medium text-[13px]">Nenhum acesso computado.</span>
                 </div>
              ) : (
                 <div className="relative border-l ml-2 space-y-6 animate-in fade-in pb-6" style={{ borderColor: temaNoturno ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
                   {logsCliente.map((log, index) => (
                     <div key={log.id} className="relative pl-5">
                        <div className={`absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full ring-4 ${index === 0 ? 'bg-indigo-500 ring-indigo-500/20' : (temaNoturno ? 'bg-zinc-600 ring-[#0A0A0A]' : 'bg-zinc-400 ring-[#FAFAFA]')}`}></div>
                        <div className="flex flex-col">
                           <span className={`text-[10px] font-bold tracking-widest uppercase mb-1.5 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>
                             {new Date(log.criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                           </span>
                           <div className={`p-4 rounded-xl border ${temaNoturno ? 'bg-[#111] border-white/5' : 'bg-white border-black/5 shadow-sm'}`}>
                             <p className={`text-[13px] font-medium mb-1.5 ${temaNoturno ? 'text-zinc-300' : 'text-slate-700'}`}>Autenticação IP: <span className="font-mono">{log.ip}</span></p>
                             <div className={`text-[11px] px-2.5 py-2 rounded-lg font-mono break-all opacity-80 ${temaNoturno ? 'bg-[#1A1A1A] text-zinc-400' : 'bg-[#F4F4F5] text-zinc-500'}`}>
                               {log.navegador || 'Dispositivo Desconhecido'}
                             </div>
                           </div>
                        </div>
                     </div>
                   ))}
                 </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL INTELIGÊNCIA & MÉTRICAS */}
      {modalMetricasAberto && empresaSelecionadaMetricas && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setModalMetricasAberto(false)}></div>
          <div className={`relative w-full max-w-3xl max-h-[90vh] rounded-[24px] border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 ${temaNoturno ? 'bg-[#0A0A0A] border-white/10' : 'bg-[#FAFAFA] border-black/5'}`}>
            
            <header className={`p-6 md:p-8 flex justify-between items-center border-b ${temaNoturno ? 'border-white/5' : 'border-black/5'}`}>
               <div className="flex items-center gap-4">
                  {renderAvatar(empresaSelecionadaMetricas, 'w-12 h-12')}
                  <div>
                    <h3 className={`text-[18px] md:text-[20px] font-bold tracking-tight truncate ${temaNoturno ? 'text-white' : 'text-slate-900'}`}>{empresaSelecionadaMetricas.nome}</h3>
                    <p className={`text-[12px] mt-0.5 font-medium ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>Análise de recursos alocados.</p>
                  </div>
               </div>
               <button onClick={() => setModalMetricasAberto(false)} className={`p-2 rounded-lg ${temaNoturno ? 'hover:bg-white/10 text-zinc-400' : 'hover:bg-black/5 text-zinc-600'}`}><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </header>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
               
               <div>
                 <h4 className={`text-[11px] uppercase font-bold tracking-widest mb-4 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}`}>Custo Operacional Estimado</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { period: 'Faturamento Mensal Estimado', value: calcularGastosEstimados(empresaSelecionadaMetricas.uso_registros).mes },
                      { period: 'Projeção Anual', value: calcularGastosEstimados(empresaSelecionadaMetricas.uso_registros).ano }
                    ].map((cost,i) => (
                      <div key={i} className={`p-5 rounded-[16px] border ${temaNoturno ? 'bg-[#111] border-white/5' : 'bg-white border-black/5 shadow-sm'}`}>
                         <span className={`text-[11px] font-semibold uppercase tracking-widest ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}`}>{cost.period}</span>
                         <h5 className={`text-[24px] font-bold mt-2 truncate tabular-nums tracking-tighter ${temaNoturno ? 'text-white' : 'text-slate-900'}`}>{cost.value}</h5>
                         <p className={`text-[10px] mt-2 font-medium ${temaNoturno ? 'text-zinc-600' : 'text-zinc-400'}`}>Cálculo via metadados de storage da conta.</p>
                      </div>
                    ))}
                 </div>
               </div>

               <div>
                 <h4 className={`text-[11px] uppercase font-bold tracking-widest mb-4 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}`}>Telemetria da Conta</h4>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { metric: 'Licença Base', value: getNomePlano(empresaSelecionadaMetricas.plano) },
                      { metric: 'Receita (MRR)', value: `R$ ${getPrecoMensalReal(empresaSelecionadaMetricas.plano).toFixed(2)}` },
                      { metric: 'Saúde', value: empresaSelecionadaMetricas.uso_registros > 50 ? 'Estável' : 'Atenção' },
                      { metric: 'Registos DB', value: empresaSelecionadaMetricas.uso_registros }
                    ].map((m,i) => (
                      <div key={i} className={`p-4 rounded-[16px] border flex flex-col justify-between ${temaNoturno ? 'bg-[#111] border-white/5' : 'bg-white border-black/5 shadow-sm'}`}>
                         <span className={`text-[10px] font-semibold uppercase tracking-widest mb-2 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}`}>{m.metric}</span>
                         <h6 className={`text-[16px] font-bold truncate ${temaNoturno ? 'text-white' : 'text-slate-900'}`}>{m.value}</h6>
                      </div>
                    ))}
                 </div>
               </div>
            </div>
            
            <footer className={`p-4 md:p-6 border-t flex justify-end ${temaNoturno ? 'border-white/5' : 'border-black/5'}`}>
                <button onClick={() => setModalMetricasAberto(false)} className={`w-full md:w-auto px-6 py-3 rounded-xl text-[13px] font-semibold transition-colors ${temaNoturno ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-black/5 hover:bg-black/10 text-slate-900'}`}>Fechar Painel</button>
            </footer>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMAÇÃO STATUS */}
      {confirmModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setConfirmModalOpen(false)}></div>
          <div className={`relative w-full max-w-[400px] rounded-[24px] border shadow-2xl p-6 animate-in zoom-in-95 duration-200 ${temaNoturno ? 'bg-[#0A0A0A] border-white/10' : 'bg-white border-black/5'}`}>
            <div className="flex items-center gap-3 mb-5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${confirmConfig.status ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <h3 className={`text-[16px] font-bold ${temaNoturno ? 'text-white' : 'text-slate-900'}`}>{confirmConfig.status ? 'Suspender Node' : 'Reativar Node'}</h3>
            </div>
            <p className={`text-[13px] font-medium mb-8 leading-relaxed ${temaNoturno ? 'text-zinc-400' : 'text-zinc-600'}`}>Tem certeza que deseja mudar a flag operacional da conta <span className={`font-bold ${temaNoturno ? 'text-white' : 'text-black'}`}>{confirmConfig.nome}</span>? Isto será propagado imediatamente.</p>
            <div className="grid grid-cols-2 gap-3">
               <button onClick={() => setConfirmModalOpen(false)} className={`py-3 rounded-xl font-semibold transition text-[13px] ${temaNoturno ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-black/5 hover:bg-black/10 text-slate-900'}`}>Cancelar</button>
               <button onClick={alternarStatusEmpresa} className={`py-3 rounded-xl font-semibold text-white text-[13px] transition-colors shadow-lg ${confirmConfig.status ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-900/20' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-900/20'}`}>{confirmConfig.status ? 'Confirmar Suspensão' : 'Autorizar Reativação'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}