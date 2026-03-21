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

  // Novo Cliente Form
  const [formData, setFormData] = useState({ nomeRestaurante: '', nomeDono: '', email: '', senha: '', tipoPlano: 'free', ciclo: 'mensal' });

  useEffect(() => { carregarEmpresas(); }, []);

  const carregarEmpresas = async () => {
    setLoading(true);
    try {
      const { data: emps, error: errEmp } = await supabase.from('empresas').select('*').order('id', { ascending: false });
      if (errEmp) throw new Error("Falha ao carregar contas.");

      const { data: usrs, error: errUsr } = await supabase.from('usuarios').select('id, empresa_id, nome_usuario, email, senha, role').eq('role', 'dono');
      if (errUsr) throw new Error("Falha ao carregar gestores.");
      
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

  const avancarWizard = () => {
    if (etapaWizard === 1) {
       if (formData.tipoPlano === 'free') setEtapaWizard(3); // Pula faturamento
       else setEtapaWizard(2); // Vai para ciclos
    } else if (etapaWizard === 2) {
       setEtapaWizard(3);
    }
  };

  const voltarWizard = () => {
    if (etapaWizard === 3 && formData.tipoPlano === 'free') setEtapaWizard(1);
    else setEtapaWizard(etapaWizard - 1);
  };

  const criarCliente = async (e) => {
    e.preventDefault();
    setLoading(true); 
    try {
      const planoFinal = formData.tipoPlano === 'free' ? 'free' : formData.ciclo;
      
      const { data: novaEmpresa, error: errEmp } = await supabase.from('empresas').insert([{ nome: formData.nomeRestaurante, ativo: true, plano: planoFinal }]).select().single();
      if (errEmp) throw new Error(`Falha na empresa: ${errEmp.message}`);

      const { error: errUsr } = await supabase.from('usuarios').insert([{ empresa_id: novaEmpresa.id, nome_usuario: formData.nomeDono, email: formData.email, senha: formData.senha, role: 'dono' }]);
      if (errUsr) throw new Error(`Falha no gestor: ${errUsr.message}`);

      await supabase.from('config_fidelidade').insert([{ empresa_id: novaEmpresa.id }]);

      mostrarNotificacao('Workspace gerado com sucesso!', 'sucesso');
      setFormData({ nomeRestaurante: '', nomeDono: '', email: '', senha: '', tipoPlano: 'free', ciclo: 'mensal' });
      setEtapaWizard(1); 
      carregarEmpresas();
      setTimeout(() => setAbaAtiva('clientes'), 1500);
    } catch (error) { mostrarNotificacao(error.message, 'erro'); } 
    finally { setLoading(false); }
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
      if (errE) throw new Error("Erro ao atualizar dados.");
      
      if (dadosEdicao.usuarioId) {
        const { error: errU } = await supabase.from('usuarios').update({ nome_usuario: dadosEdicao.nomeDono, email: dadosEdicao.email, senha: dadosEdicao.senha }).eq('id', dadosEdicao.usuarioId);
        if (errU) throw new Error(`Erro ao atualizar credenciais: ${errU.message}`);
      } else {
         const { error: errU } = await supabase.from('usuarios').insert([{ empresa_id: empresaEditando, nome_usuario: dadosEdicao.nomeDono, email: dadosEdicao.email, senha: dadosEdicao.senha, role: 'dono' }]);
         if (errU) throw new Error(`Erro ao provisionar gestor: ${errU.message}`);
      }

      setModalEdicaoAberto(false);
      carregarEmpresas();
      mostrarNotificacao('Configurações aplicadas.', 'sucesso');
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
      if (error) throw new Error("Erro ao alterar o status.");
      carregarEmpresas();
      mostrarNotificacao(`Conta ${!confirmConfig.status ? 'reativada' : 'suspensa'} com sucesso.`, 'sucesso');
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
      if (error) throw new Error("Falha ao puxar auditoria.");
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
    if (!dono || !dono.empresa_id) return mostrarNotificacao("Gestor Master não configurado.", 'erro');
    const dataHoje = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
    const sessionObj = { ...dono, data: dataHoje };
    localStorage.setItem('bessa_session', JSON.stringify(sessionObj));
    window.location.href = '/'; 
  };

  const abrirMetricas = (empresa) => {
    setEmpresaSelecionadaMetricas(empresa);
    setModalMetricasAberto(true);
  };

  // Avatar Component Seguro (Sempre Redondo)
  const renderAvatar = (empresa, sizeClass) => {
    const urlLogo = empresa.logo || empresa.foto || empresa.logo_url;
    const validUrlRegex = /^(http|https):\/\/[^ "]+$/;
    const baseClasses = `flex-shrink-0 rounded-full flex items-center justify-center overflow-hidden aspect-square ${sizeClass}`;
    
    if (urlLogo && validUrlRegex.test(urlLogo)) {
      return (
        <div className={`${baseClasses} bg-white border ${temaNoturno ? 'border-gray-700' : 'border-gray-200'}`}>
          <img src={urlLogo} alt="Logo" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
          <span style={{ display: 'none' }} className="font-black w-full h-full items-center justify-center bg-gray-200 text-gray-500">
            {empresa.nome.charAt(0).toUpperCase()}
          </span>
        </div>
      );
    } else {
      const isPro = empresa.plano !== 'free';
      const initial = empresa.nome.charAt(0).toUpperCase();
      const fontSize = sizeClass.includes('16') ? 'text-2xl' : sizeClass.includes('14') ? 'text-xl' : 'text-lg';
      return (
        <div className={`${baseClasses} font-black ${fontSize} ${isPro ? 'bg-gradient-to-br from-purple-500 to-blue-500 text-white shadow-md' : (temaNoturno ? 'bg-gray-800 text-gray-400 border border-gray-700' : 'bg-gray-100 text-gray-500 border border-gray-200')}`}>
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

  // Funções Auxiliares para Planos
  const getPrecoMensalReal = (planoId) => {
    if (planoId === 'free' || !planoId) return 0;
    const ciclo = CICLOS_PREMIUM.find(c => c.id === planoId);
    return ciclo ? ciclo.precoMes : 97; // Fallback para mensal base
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
    return {
      total: empresas.length,
      ativos: empresas.filter(e => e.ativo !== false).length,
      bloqueados: empresas.filter(e => e.ativo === false).length,
      pagantes: pagantes.length,
      testes: empresas.filter(e => e.plano === 'free').length,
      receitaEstimada: mrr
    };
  }, [empresas]);

  const NavegacaoItens = [
    { id: 'dashboard', label: 'Visão Geral', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
    { id: 'clientes', label: 'Gestão de Contas', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    { id: 'novo', label: 'Provisionar Workspace', icon: 'M13 10V3L4 14h7v7l9-11h-7z' }
  ];

  return (
    <div className={`min-h-screen flex flex-col md:flex-row transition-colors duration-300 font-sans ${temaNoturno ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      
      {/* TOAST NOTIFICAÇÕES */}
      {toast.visivel && (
        <div className="fixed top-4 md:top-6 left-1/2 transform -translate-x-1/2 z-[200] w-[90%] md:w-auto animate-in slide-in-from-top-5 fade-in duration-300">
          <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border backdrop-blur-xl ${
            toast.tipo === 'erro' ? (temaNoturno ? 'bg-rose-950/90 border-rose-900/50 text-rose-200' : 'bg-rose-50 border-rose-200 text-rose-800') 
            : toast.tipo === 'sucesso' ? (temaNoturno ? 'bg-emerald-950/90 border-emerald-900/50 text-emerald-200' : 'bg-emerald-50 border-emerald-200 text-emerald-800')
            : (temaNoturno ? 'bg-gray-800/90 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-800')
          }`}>
            <span className="font-bold text-sm tracking-wide truncate">{toast.texto}</span>
          </div>
        </div>
      )}

      {/* HEADER MOBILE */}
      <div className={`md:hidden sticky top-0 z-40 flex items-center justify-between p-3 px-4 border-b backdrop-blur-xl ${temaNoturno ? 'bg-gray-900/80 border-gray-800' : 'bg-white/80 border-gray-200 shadow-sm'}`}>
        <div className="flex items-center gap-3">
           <button onClick={() => setMenuMobileAberto(true)} className={`p-2 rounded-xl transition-all ${temaNoturno ? 'text-gray-200 bg-gray-800 hover:bg-gray-700' : 'text-gray-800 bg-gray-100 hover:bg-gray-200'}`}>
             <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
           </button>
           <div className="flex items-center gap-2">
             <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-md">
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-white"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>
             </div>
             <span className="font-black text-lg tracking-tight">Admin SaaS</span>
           </div>
        </div>
        <button onClick={() => setTemaNoturno(!temaNoturno)} className={`p-2 rounded-xl ${temaNoturno ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-500 hover:bg-gray-100'}`}>
          {temaNoturno ? <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg> : <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>}
        </button>
      </div>

      {/* DRAWER MENU MOBILE */}
      {menuMobileAberto && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMenuMobileAberto(false)}></div>
          <div className={`relative w-72 h-full flex flex-col shadow-2xl animate-in slide-in-from-left duration-300 ${temaNoturno ? 'bg-gray-900 border-r border-gray-800' : 'bg-white'}`}>
             <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
               <span className="font-black text-xl">Navegação</span>
               <button onClick={() => setMenuMobileAberto(false)} className={`p-2 rounded-xl ${temaNoturno ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'}`}><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
             </div>
             <nav className="flex-1 p-4 space-y-2">
               {NavegacaoItens.map(item => (
                 <button key={item.id} onClick={() => { setAbaAtiva(item.id); setMenuMobileAberto(false); }} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold text-base transition-all ${abaAtiva === item.id ? (temaNoturno ? 'bg-purple-600/20 text-purple-400' : 'bg-purple-50 text-purple-700') : (temaNoturno ? 'text-gray-400' : 'text-gray-600')}`}>
                   <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} /></svg> {item.label}
                 </button>
               ))}
             </nav>
             <div className="p-6 border-t border-gray-200 dark:border-gray-800">
               <button onClick={fazerLogout} className="w-full flex justify-center items-center gap-3 px-4 py-4 rounded-2xl font-bold text-base text-white bg-rose-500 hover:bg-rose-600 transition-colors shadow-lg shadow-rose-500/20">
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg> Encerrar Sessão
               </button>
             </div>
          </div>
        </div>
      )}

      {/* SIDEBAR DESKTOP */}
      <aside className={`hidden md:flex w-64 lg:w-72 h-screen flex-col border-r transition-colors flex-shrink-0 ${temaNoturno ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} sticky top-0`}>
        <div className="p-6 lg:p-8 flex items-center gap-3 lg:gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600 shadow-lg shadow-purple-500/30 flex-shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-white"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>
          </div>
          <span className="font-black text-xl lg:text-2xl tracking-tight truncate">Admin SaaS</span>
        </div>

        <nav className="flex-1 px-4 lg:px-5 py-2 flex flex-col gap-2">
          {NavegacaoItens.map(item => (
            <button key={item.id} onClick={() => setAbaAtiva(item.id)} className={`flex items-center gap-3 lg:gap-4 px-4 lg:px-5 py-3 lg:py-4 rounded-2xl font-bold text-sm lg:text-base transition-all duration-300 ${abaAtiva === item.id ? (temaNoturno ? 'bg-purple-600/15 text-purple-400 border border-purple-500/20' : 'bg-purple-50 text-purple-700 border border-purple-100') : (temaNoturno ? 'text-gray-400 hover:bg-gray-800 hover:text-gray-200 border border-transparent' : 'text-gray-500 hover:bg-gray-100/80 hover:text-gray-900 border border-transparent')}`}>
              <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} /></svg>
              {item.label}
            </button>
          ))}
        </nav>

        <div className={`flex flex-col gap-2 p-4 lg:p-5 border-t ${temaNoturno ? 'border-gray-800' : 'border-gray-100'}`}>
           <button onClick={() => setTemaNoturno(!temaNoturno)} className={`flex items-center gap-3 lg:gap-4 px-4 lg:px-5 py-3 lg:py-4 rounded-2xl font-bold text-sm lg:text-base transition-colors ${temaNoturno ? 'text-gray-400 hover:bg-gray-800 hover:text-gray-200' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}>
             {temaNoturno ? <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg> : <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>}
             Mudar Tema
           </button>
           <button onClick={fazerLogout} className="flex items-center justify-center gap-2 lg:gap-3 w-full px-4 lg:px-5 py-3 lg:py-4 rounded-2xl font-black text-sm lg:text-base text-white bg-rose-500 hover:bg-rose-600 transition-colors shadow-lg shadow-rose-500/20">
             <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
             Encerrar Sessão
           </button>
        </div>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 w-full min-w-0 p-4 md:p-8 lg:p-12 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6 md:space-y-10">
          
          {/* DASHBOARD */}
          {abaAtiva === 'dashboard' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <header className="mb-6 md:mb-10">
                <h2 className={`text-3xl md:text-4xl font-black tracking-tight ${temaNoturno ? 'text-white' : 'text-slate-900'}`}>Performance Geral</h2>
                <p className={`text-sm md:text-base mt-1 md:mt-2 font-medium ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`}>Resumo da base de clientes e receita recorrente.</p>
              </header>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {[
                  { label: 'MRR Estimado', valor: `R$ ${stats.receitaEstimada.toFixed(2)}`, icone: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', cor: 'text-emerald-500', bgCor: temaNoturno ? 'bg-emerald-500/10' : 'bg-emerald-50' },
                  { label: 'Contas Premium', valor: stats.pagantes, icone: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z', cor: 'text-purple-500', bgCor: temaNoturno ? 'bg-purple-500/10' : 'bg-purple-50' },
                  { label: 'Trials', valor: stats.testes, icone: 'M12 6v6m0 0v6m0-6h6m-6 0H6', cor: 'text-blue-500', bgCor: temaNoturno ? 'bg-blue-500/10' : 'bg-blue-50' },
                  { label: 'Suspensos', valor: stats.bloqueados, icone: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z', cor: 'text-rose-500', bgCor: temaNoturno ? 'bg-rose-500/10' : 'bg-rose-50' }
                ].map((stat, i) => (
                  <div key={i} className={`p-5 md:p-8 rounded-[2rem] border shadow-sm flex flex-col justify-between hover:shadow-lg transition-all ${temaNoturno ? 'bg-gray-800/40 border-gray-700/50' : 'bg-white border-gray-100'}`}>
                    <div className="flex justify-between items-start mb-4 md:mb-6">
                      <div className={`p-3 rounded-2xl ${stat.bgCor}`}>
                        <svg className={`w-6 h-6 ${stat.cor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={stat.icone} /></svg>
                      </div>
                    </div>
                    <div>
                      <p className={`text-[10px] md:text-sm font-bold uppercase tracking-widest mb-1 md:mb-2 ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`}>{stat.label}</p>
                      <h3 className={`text-2xl lg:text-4xl font-black truncate ${temaNoturno ? 'text-white' : 'text-slate-900'}`}>{stat.valor}</h3>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* LISTAGEM DE CLIENTES (GESTÃO) */}
          {abaAtiva === 'clientes' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
               <header className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 md:gap-6 mb-6 md:mb-10">
                  <div>
                    <h2 className={`text-3xl md:text-4xl font-black tracking-tight ${temaNoturno ? 'text-white' : 'text-slate-900'}`}>Gestão de Contas</h2>
                    <p className={`text-sm md:text-base mt-1 md:mt-2 font-medium ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`}>Clique na conta para Inteligência de Mercado e Métricas.</p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                    <div className={`relative flex-1 flex items-center p-2 rounded-2xl border-2 transition-all focus-within:ring-4 focus-within:ring-purple-500/20 focus-within:border-purple-500 ${temaNoturno ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
                      <svg className={`w-5 h-5 ml-3 ${temaNoturno ? 'text-gray-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                      <input type="text" value={termoPesquisa} onChange={e => setTermoPesquisa(e.target.value)} placeholder="Buscar restaurante ou dono..." className={`w-full py-2 px-3 bg-transparent outline-none font-bold text-sm md:text-base ${temaNoturno ? 'text-white placeholder-gray-500' : 'text-slate-900 placeholder-gray-400'}`} />
                    </div>
                    
                    <button onClick={carregarEmpresas} disabled={loading} className={`flex justify-center px-6 py-4 sm:py-0 text-sm font-black rounded-2xl border transition-all items-center gap-2 shadow-sm ${temaNoturno ? 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-white' : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-800'}`}>
                      {loading ? <div className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full"></div> : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>}
                      <span className="hidden sm:inline">Atualizar</span>
                    </button>
                  </div>
               </header>

               {loading ? (
                 <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-4 border-purple-500"></div></div>
               ) : empresasFiltradas.length === 0 ? (
                 <div className="text-center py-20 opacity-50 font-black text-lg">Nenhum cliente encontrado.</div>
               ) : (
                 <>
                   {/* DESKTOP/IPAD (TABELA PREMIUM COM SCROLL-X) */}
                   <div className={`hidden md:block border rounded-3xl shadow-sm ${temaNoturno ? 'border-gray-800 bg-gray-900/50' : 'border-gray-200 bg-white'}`}>
                     <div className="overflow-x-auto w-full pb-4">
                       <table className="w-full text-left min-w-[800px]">
                         <thead className={`text-xs uppercase font-black tracking-widest ${temaNoturno ? 'bg-gray-800/80 text-gray-400 border-b border-gray-800' : 'bg-gray-50/80 text-gray-500 border-b border-gray-200'}`}>
                           <tr>
                             <th className="px-6 py-5 w-[35%]">Workspace (Dono)</th>
                             <th className="px-6 py-5">Storage DB</th>
                             <th className="px-6 py-5">Plano</th>
                             <th className="px-6 py-5">Status</th>
                             <th className="px-6 py-5 text-right w-[180px]">Controlos</th>
                           </tr>
                         </thead>
                         <tbody className={`divide-y ${temaNoturno ? 'divide-gray-800/60' : 'divide-gray-100'}`}>
                           {empresasFiltradas.map(emp => {
                              const dono = emp.usuarios?.[0]; const isAtivo = emp.ativo !== false; const isPro = emp.plano !== 'free'; const mbUsados = ((emp.uso_registros * 2) / 1024).toFixed(2);

                              return (
                                <tr key={emp.id} className={`${temaNoturno ? 'hover:bg-gray-800/40' : 'hover:bg-gray-50/50'} transition-colors cursor-pointer group`} onClick={() => abrirMetricas(emp)}>
                                  <td className="px-6 py-5 flex items-center gap-4">
                                    {renderAvatar(emp, 'w-10 h-10 lg:w-12 lg:h-12')}
                                    <div className="flex-1 overflow-hidden">
                                      <div className={`font-black text-base lg:text-lg truncate group-hover:text-purple-500 transition-colors ${temaNoturno ? 'text-white' : 'text-slate-900'}`}>{emp.nome}</div>
                                      <div className={`text-[11px] lg:text-xs font-bold mt-1 truncate ${temaNoturno ? 'text-gray-400' : 'text-slate-700'}`}>{dono?.nome_usuario || 'Pendente'}</div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-5">
                                    <div className={`text-sm lg:text-base font-bold flex items-center gap-2 ${temaNoturno ? 'text-gray-200' : 'text-slate-800'}`}>
                                      <svg className="w-4 h-4 lg:w-5 lg:h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>
                                      ~{mbUsados} MB
                                    </div>
                                  </td>
                                  <td className="px-6 py-5">
                                    <span className={`px-3 py-1.5 rounded-lg text-[10px] lg:text-xs font-black uppercase tracking-wider border ${isPro ? (temaNoturno ? 'bg-purple-900/30 text-purple-400 border-purple-800' : 'bg-purple-50 text-purple-700 border-purple-200') : (temaNoturno ? 'bg-gray-800 text-gray-400 border-gray-700' : 'bg-gray-100 text-gray-600 border-gray-200')}`}>{getNomePlano(emp.plano)}</span>
                                  </td>
                                  <td className="px-6 py-5">
                                    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] lg:text-xs font-black uppercase tracking-wider ${isAtivo ? (temaNoturno ? 'text-emerald-400 bg-emerald-500/10' : 'text-emerald-700 bg-emerald-100') : (temaNoturno ? 'text-rose-400 bg-rose-500/10' : 'text-rose-700 bg-rose-100')}`}>
                                      <span className="relative flex h-2 w-2">
                                        {isAtivo && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                                        <span className={`relative inline-flex rounded-full h-2 w-2 ${isAtivo ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                                      </span>
                                      {isAtivo ? 'Ativo' : 'Suspenso'}
                                    </span>
                                  </td>
                                  <td className="px-6 py-5 text-right">
                                    <div className="flex justify-end gap-2">
                                      <button onClick={(e) => { e.stopPropagation(); abrirLogsCliente(emp.id); }} className={`p-2.5 rounded-xl transition-all ${temaNoturno ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`} title="Auditoria"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg></button>
                                      <button onClick={(e) => { e.stopPropagation(); abrirModalEdicao(emp, dono); }} className={`p-2.5 rounded-xl transition-all ${temaNoturno ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`} title="Editar Conta"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                                      <button onClick={(e) => { e.stopPropagation(); entrarComoCliente(dono); }} className={`p-2.5 rounded-xl transition-all ${temaNoturno ? 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-400' : 'bg-blue-50 hover:bg-blue-100 text-blue-600'}`} title="Acessar Cliente"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg></button>
                                      <button onClick={(e) => { e.stopPropagation(); abrirConfirmModal(emp); }} className={`p-2.5 rounded-xl transition-all ${temaNoturno ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400' : 'bg-rose-100 hover:bg-rose-200 text-rose-600'}`} title={isAtivo ? 'Suspender' : 'Reativar'}><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg></button>
                                    </div>
                                  </td>
                                </tr>
                              )
                           })}
                         </tbody>
                       </table>
                     </div>
                   </div>

                   {/* MOBILE (CARDS PREMIUM) */}
                   <div className="md:hidden space-y-4">
                     {empresasFiltradas.map(emp => {
                       const dono = emp.usuarios?.[0]; const isAtivo = emp.ativo !== false; const isPro = emp.plano !== 'free'; const mbUsados = ((emp.uso_registros * 2) / 1024).toFixed(2);

                       return (
                         <div key={emp.id} className={`p-6 rounded-[2rem] border shadow-lg flex flex-col gap-5 relative overflow-hidden ${temaNoturno ? 'bg-gray-800/60 border-gray-700/50 backdrop-blur-md' : 'bg-white border-gray-100'}`} onClick={() => abrirMetricas(emp)}>
                           {temaNoturno && <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-600/10 blur-[50px] pointer-events-none"></div>}

                           <div className="flex justify-between items-start gap-3 relative z-10">
                              <div className="flex items-center gap-4">
                                {renderAvatar(emp, 'w-14 h-14')}
                                <div className="flex-1 overflow-hidden">
                                  <h3 className={`font-black text-xl leading-tight truncate ${temaNoturno ? 'text-white' : 'text-slate-900'}`}>{emp.nome}</h3>
                                  <p className={`text-xs font-bold mt-1.5 truncate ${temaNoturno ? 'text-gray-400' : 'text-slate-700'}`}>{dono?.nome_usuario || 'Pendente'}</p>
                                </div>
                              </div>
                              <span className={`inline-flex flex-shrink-0 items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider ${isAtivo ? (temaNoturno ? 'text-emerald-400 bg-emerald-500/10' : 'text-emerald-700 bg-emerald-100') : (temaNoturno ? 'text-rose-400 bg-rose-500/10' : 'text-rose-700 bg-rose-100')}`}>
                                <span className="relative flex h-2 w-2">
                                  {isAtivo && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                                  <span className={`relative inline-flex rounded-full h-2 w-2 ${isAtivo ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                                </span>
                                {isAtivo ? 'Ativo' : 'Suspenso'}
                              </span>
                           </div>

                           <div className="grid grid-cols-2 gap-3 relative z-10">
                             <div className={`p-4 rounded-2xl border flex items-center gap-2.5 ${temaNoturno ? 'bg-gray-900/50 border-gray-800 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                                <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                <span className="text-xs font-black truncate">{getNomePlano(emp.plano)}</span>
                             </div>
                             <div className={`p-4 rounded-2xl border flex items-center gap-2.5 ${temaNoturno ? 'bg-gray-900/50 border-gray-800 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                                <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>
                                <span className="text-xs font-black truncate">~{mbUsados} MB</span>
                             </div>
                           </div>

                           <div className="pt-3 flex gap-2 w-full relative z-10 border-t" style={{ borderColor: temaNoturno ? 'rgba(55, 65, 81, 0.5)' : '#f3f4f6' }}>
                              <button onClick={(e) => { e.stopPropagation(); abrirLogsCliente(emp.id); }} className={`flex-1 flex justify-center py-4 rounded-2xl transition ${temaNoturno ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg></button>
                              <button onClick={(e) => { e.stopPropagation(); abrirModalEdicao(emp, dono); }} className={`flex-1 flex justify-center py-4 rounded-2xl transition ${temaNoturno ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                              <button onClick={(e) => { e.stopPropagation(); entrarComoCliente(dono); }} className={`flex-1 flex justify-center py-4 rounded-2xl transition ${temaNoturno ? 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-400' : 'bg-blue-100 text-blue-700'}`}><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg></button>
                              <button onClick={(e) => { e.stopPropagation(); abrirConfirmModal(emp); }} className={`flex-1 flex justify-center py-4 rounded-2xl transition ${temaNoturno ? 'bg-rose-600/20 hover:bg-rose-600/30 text-rose-400' : 'bg-rose-100 text-rose-700'}`}><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg></button>
                           </div>
                         </div>
                       )
                     })}
                   </div>
                 </>
               )}
            </div>
          )}

          {/* SETUP DE WORKSPACE WIZARD LÚDICO (LINEAR 3 PASSOS) */}
          {abaAtiva === 'novo' && (
            <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10 pt-4">
               
               <header className="text-center mb-8 md:mb-12">
                 <div className="inline-flex items-center justify-center gap-3 mb-2">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-purple-600/10 flex items-center justify-center">
                        <svg className="w-6 h-6 md:w-7 md:h-7 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </div>
                    <h2 className={`text-3xl md:text-5xl font-black tracking-tight ${temaNoturno ? 'text-white' : 'text-slate-900'}`}>Setup de Workspace</h2>
                 </div>
                 <p className={`text-sm md:text-base font-bold ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`}>Provisionamento inteligente de infraestrutura para restaurantes.</p>
               </header>

               {/* PROGRESS BAR */}
               <div className="flex justify-center items-center gap-2 md:gap-4 mb-8 md:mb-12 px-4">
                  <div className={`flex flex-col items-center gap-2 ${etapaWizard >= 1 ? 'opacity-100' : 'opacity-40'}`}>
                     <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-black text-sm md:text-base transition-colors ${etapaWizard >= 1 ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/40' : (temaNoturno ? 'bg-gray-800 text-gray-500' : 'bg-gray-200 text-gray-400')}`}>1</div>
                     <span className={`text-[10px] md:text-xs font-bold uppercase tracking-wider ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`}>Licença</span>
                  </div>
                  <div className={`h-1 w-12 md:w-20 rounded-full transition-colors ${etapaWizard >= 2 ? 'bg-purple-600' : (temaNoturno ? 'bg-gray-800' : 'bg-gray-200')}`}></div>
                  <div className={`flex flex-col items-center gap-2 ${etapaWizard >= 2 ? 'opacity-100' : 'opacity-40'}`}>
                     <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-black text-sm md:text-base transition-colors ${etapaWizard >= 2 ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/40' : (temaNoturno ? 'bg-gray-800 text-gray-500' : 'bg-gray-200 text-gray-400')}`}>2</div>
                     <span className={`text-[10px] md:text-xs font-bold uppercase tracking-wider ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`}>Faturamento</span>
                  </div>
                  <div className={`h-1 w-12 md:w-20 rounded-full transition-colors ${etapaWizard >= 3 ? 'bg-purple-600' : (temaNoturno ? 'bg-gray-800' : 'bg-gray-200')}`}></div>
                  <div className={`flex flex-col items-center gap-2 ${etapaWizard >= 3 ? 'opacity-100' : 'opacity-40'}`}>
                     <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-black text-sm md:text-base transition-colors ${etapaWizard >= 3 ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/40' : (temaNoturno ? 'bg-gray-800 text-gray-500' : 'bg-gray-200 text-gray-400')}`}>3</div>
                     <span className={`text-[10px] md:text-xs font-bold uppercase tracking-wider ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`}>Dados</span>
                  </div>
               </div>

               <div className={`rounded-[2.5rem] border shadow-2xl relative overflow-hidden ${temaNoturno ? 'bg-gray-900/60 border-gray-700 backdrop-blur-xl' : 'bg-white border-gray-100'}`}>
                  {temaNoturno && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-40 bg-purple-600/10 blur-[100px] pointer-events-none"></div>}

                  <form onSubmit={criarCliente} className="relative z-10 p-6 md:p-12">
                    
                    {/* ETAPA 1: TIPO DE LICENÇA */}
                    {etapaWizard === 1 && (
                      <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                        <h3 className="text-2xl md:text-3xl font-black mb-8 text-center">Qual o nível de acesso?</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 max-w-3xl mx-auto">
                          <label className={`relative flex flex-col p-6 md:p-8 rounded-[2rem] border-2 cursor-pointer transition-all ${formData.tipoPlano === 'free' ? (temaNoturno ? 'border-purple-500 bg-purple-500/10 shadow-[0_0_30px_rgba(168,85,247,0.15)]' : 'border-purple-600 bg-purple-50 shadow-xl') : (temaNoturno ? 'border-gray-800 hover:border-gray-700 bg-gray-900/50' : 'border-gray-200 hover:border-gray-300 bg-gray-50')}`}>
                            <input type="radio" name="tipoPlano" value="free" checked={formData.tipoPlano === 'free'} onChange={handleChange} className="sr-only" />
                            <div className="w-12 h-12 rounded-2xl bg-gray-200 dark:bg-gray-800 flex items-center justify-center mb-6">
                              <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                            </div>
                            <span className={`font-black text-2xl mb-2 ${temaNoturno ? 'text-white' : 'text-slate-900'}`}>Degustação (Trial)</span>
                            <span className={`text-sm font-bold leading-relaxed ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`}>Acesso limitado para demonstrações. Sem vínculos de faturamento recorrente.</span>
                            {formData.tipoPlano === 'free' && <div className="absolute top-6 right-6 w-3 h-3 rounded-full bg-purple-500 ring-4 ring-purple-500/30"></div>}
                          </label>

                          <label className={`relative flex flex-col p-6 md:p-8 rounded-[2rem] border-2 cursor-pointer transition-all ${formData.tipoPlano === 'premium' ? (temaNoturno ? 'border-purple-500 bg-purple-500/10 shadow-[0_0_30px_rgba(168,85,247,0.15)]' : 'border-purple-600 bg-purple-50 shadow-xl') : (temaNoturno ? 'border-gray-800 hover:border-gray-700 bg-gray-900/50' : 'border-gray-200 hover:border-gray-300 bg-gray-50')}`}>
                            <input type="radio" name="tipoPlano" value="premium" checked={formData.tipoPlano === 'premium'} onChange={handleChange} className="sr-only" />
                            <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center mb-6">
                              <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
                            </div>
                            <span className="font-black text-2xl text-purple-500 mb-2">Licença Premium</span>
                            <span className={`text-sm font-bold leading-relaxed ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`}>Workspace de alta performance liberado com cobrança recorrente automatizada.</span>
                            {formData.tipoPlano === 'premium' && <div className="absolute top-6 right-6 w-3 h-3 rounded-full bg-purple-500 ring-4 ring-purple-500/30"></div>}
                          </label>
                        </div>
                      </div>
                    )}

                    {/* ETAPA 2: CICLOS DE FATURAMENTO (Apenas se for Premium) */}
                    {etapaWizard === 2 && (
                      <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                         <h3 className="text-2xl md:text-3xl font-black mb-8 text-center">Escolha o Ciclo de Faturamento</h3>
                         
                         {/* Scroll horizontal no mobile, Grid no Desktop */}
                         <div className="flex md:grid md:grid-cols-3 lg:grid-cols-5 overflow-x-auto snap-x snap-mandatory gap-4 md:gap-4 pb-6 px-2 -mx-2 hide-scrollbar">
                           {CICLOS_PREMIUM.map(ciclo => {
                             const isSelected = formData.ciclo === ciclo.id;
                             return (
                               <label key={ciclo.id} className={`relative flex flex-col p-6 rounded-3xl border-2 cursor-pointer transition-all snap-center min-w-[260px] md:min-w-0 ${isSelected ? (temaNoturno ? 'border-purple-500 bg-purple-500/10 shadow-[0_0_25px_rgba(168,85,247,0.15)] scale-105 z-10' : 'border-purple-600 bg-purple-50 shadow-xl scale-105 z-10') : (temaNoturno ? 'border-gray-800 hover:border-gray-700 bg-gray-900/50 scale-100' : 'border-gray-200 hover:border-gray-300 bg-gray-50 scale-100')}`}>
                                 <input type="radio" name="ciclo" value={ciclo.id} checked={isSelected} onChange={handleChange} className="sr-only" />
                                 
                                 {ciclo.tag && (
                                   <span className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap shadow-md ${isSelected ? 'bg-purple-600 text-white' : (temaNoturno ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')}`}>
                                     {ciclo.tag}
                                   </span>
                                 )}

                                 <h4 className={`text-center font-black text-lg mb-4 ${isSelected ? 'text-purple-500' : (temaNoturno ? 'text-gray-300' : 'text-slate-700')}`}>{ciclo.nome}</h4>
                                 
                                 <div className="flex flex-col items-center justify-center mb-6">
                                   <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Equivalente a</span>
                                   <div className="flex items-start">
                                     <span className={`text-sm font-bold mt-1 mr-1 ${isSelected ? 'text-purple-500' : (temaNoturno ? 'text-gray-400' : 'text-gray-500')}`}>R$</span>
                                     <span className={`text-5xl font-black tracking-tighter ${temaNoturno ? 'text-white' : 'text-slate-900'}`}>{ciclo.precoMes}</span>
                                   </div>
                                   <span className={`text-xs font-bold mt-1 ${temaNoturno ? 'text-gray-500' : 'text-gray-400'}`}>/ mês</span>
                                 </div>
                                 
                                 <div className={`mt-auto pt-4 border-t border-dashed flex flex-col items-center text-center ${temaNoturno ? 'border-gray-700' : 'border-gray-200'}`}>
                                    <span className="text-xs font-black uppercase text-gray-500 mb-1">Cobrado {ciclo.nome}</span>
                                    <span className={`text-sm font-bold ${temaNoturno ? 'text-white' : 'text-slate-900'}`}>R$ {ciclo.total},00</span>
                                    {ciclo.desconto > 0 && <span className="text-xs font-bold text-emerald-500 mt-2 bg-emerald-500/10 px-2 py-1 rounded-lg">-{ciclo.desconto}% de desconto</span>}
                                 </div>
                               </label>
                             );
                           })}
                         </div>
                      </div>
                    )}

                    {/* ETAPA 3: DADOS DO WORKSPACE */}
                    {etapaWizard === 3 && (
                      <div className="animate-in fade-in slide-in-from-right-4 duration-300 max-w-3xl mx-auto">
                        <h3 className="text-2xl md:text-3xl font-black mb-8 text-center">Dados do Estabelecimento</h3>
                        
                        <div className="space-y-5">
                          <div className={`flex items-center p-2 rounded-2xl border-2 transition-all focus-within:border-purple-500 focus-within:ring-4 focus-within:ring-purple-500/10 ${temaNoturno ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
                            <div className={`pl-4 pr-3 ${temaNoturno ? 'text-gray-500' : 'text-gray-400'}`}><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg></div>
                            <input required type="text" name="nomeRestaurante" value={formData.nomeRestaurante} onChange={handleChange} className={`w-full py-4 pr-4 bg-transparent outline-none font-black text-xl placeholder-gray-400 ${temaNoturno ? 'text-white' : 'text-slate-900'}`} placeholder="Razão Social ou Fantasia" />
                          </div>
                          
                          <div className={`flex items-center p-2 rounded-2xl border-2 transition-all focus-within:border-purple-500 focus-within:ring-4 focus-within:ring-purple-500/10 ${temaNoturno ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
                            <div className={`pl-4 pr-3 ${temaNoturno ? 'text-gray-500' : 'text-gray-400'}`}><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg></div>
                            <input required type="text" name="nomeDono" value={formData.nomeDono} onChange={handleChange} className={`w-full py-4 pr-4 bg-transparent outline-none font-bold text-xl placeholder-gray-400 ${temaNoturno ? 'text-white' : 'text-slate-900'}`} placeholder="Nome do Gestor (Dono)" />
                          </div>

                          <div className={`flex items-center p-2 rounded-2xl border-2 transition-all focus-within:border-purple-500 focus-within:ring-4 focus-within:ring-purple-500/10 ${temaNoturno ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
                            <div className={`pl-4 pr-3 ${temaNoturno ? 'text-gray-500' : 'text-gray-400'}`}><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg></div>
                            <input required type="email" name="email" value={formData.email} onChange={handleChange} className={`w-full py-4 pr-4 bg-transparent outline-none font-bold text-xl placeholder-gray-400 ${temaNoturno ? 'text-white' : 'text-slate-900'}`} placeholder="E-mail Administrativo" />
                          </div>
                          
                          <div className={`flex items-center p-2 rounded-2xl border-2 transition-all focus-within:border-purple-500 focus-within:ring-4 focus-within:ring-purple-500/10 ${temaNoturno ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
                            <div className={`pl-4 pr-3 ${temaNoturno ? 'text-gray-500' : 'text-gray-400'}`}><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg></div>
                            <input required type="text" name="senha" value={formData.senha} onChange={handleChange} className={`w-full py-4 pr-4 bg-transparent outline-none font-bold text-xl placeholder-gray-400 ${temaNoturno ? 'text-white' : 'text-slate-900'}`} placeholder="Credencial Temporária" />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* CONTROLES DO WIZARD (Rodapé) */}
                    <div className="flex gap-4 mt-12 max-w-3xl mx-auto border-t pt-8 border-gray-100 dark:border-gray-800">
                       {etapaWizard > 1 && (
                         <button type="button" onClick={voltarWizard} className={`py-5 px-8 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 ${temaNoturno ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                           <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg> Voltar
                         </button>
                       )}

                       {etapaWizard < 3 ? (
                         <button type="button" onClick={avancarWizard} className={`flex-1 py-5 px-8 rounded-2xl font-black text-lg text-white bg-slate-900 dark:bg-white dark:text-slate-900 shadow-2xl transition-all flex items-center justify-center gap-3 hover:scale-[1.02]`}>
                           Continuar <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                         </button>
                       ) : (
                         <button disabled={loading} type="submit" className={`relative flex-1 overflow-hidden rounded-2xl disabled:opacity-70 disabled:cursor-not-allowed shadow-2xl shadow-purple-500/40 hover:scale-[1.02] transition-transform`}>
                           <span className="absolute inset-0 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 opacity-100"></span>
                           <span className="relative flex justify-center items-center py-5 px-8 font-black text-xl text-white">
                             {loading ? (
                               <><div className="animate-spin h-6 w-6 border-4 border-white border-t-transparent rounded-full mr-3"></div> Configurando Workspace...</>
                             ) : (
                               <><svg className="w-7 h-7 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> Provisionar Ambiente</>
                             )}
                           </span>
                         </button>
                       )}
                    </div>
                  </form>
               </div>
            </div>
          )}
        </div>
      </main>

      {/* DRAWER DE EDIÇÃO DE CONTA */}
      {modalEdicaoAberto && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setModalEdicaoAberto(false)}></div>
          <div className={`relative w-full max-w-md h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300 ${temaNoturno ? 'bg-gray-900 border-l border-gray-800' : 'bg-white'}`}>
            <div className={`p-6 border-b flex justify-between items-center ${temaNoturno ? 'border-gray-800' : 'border-gray-100'}`}>
              <h3 className={`text-xl font-black ${temaNoturno ? 'text-white' : 'text-slate-900'}`}>Configurações da Conta</h3>
              <button onClick={() => setModalEdicaoAberto(false)} className={`p-2 rounded-xl transition-colors ${temaNoturno ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div>
                <label className={`block text-xs font-bold mb-2 uppercase tracking-wider ${temaNoturno ? 'text-gray-500' : 'text-gray-400'}`}>Licença Base</label>
                <select name="plano" value={dadosEdicao.plano} onChange={handleChangeEdicao} className={`w-full p-4 rounded-xl border outline-none font-bold text-base ${temaNoturno ? 'bg-gray-800 border-gray-700 text-white focus:border-purple-500' : 'bg-gray-50 border-gray-200 focus:border-purple-500'}`}>
                  <option value="free">Trial / Degustação</option>
                  {CICLOS_PREMIUM.map(c => <option key={c.id} value={c.id}>Premium - {c.nome}</option>)}
                </select>
              </div>
              <div>
                <label className={`block text-xs font-bold mb-2 uppercase tracking-wider ${temaNoturno ? 'text-gray-500' : 'text-gray-400'}`}>Estabelecimento</label>
                <input type="text" name="nomeRestaurante" value={dadosEdicao.nomeRestaurante} onChange={handleChangeEdicao} className={`w-full p-4 rounded-xl border outline-none font-bold text-base ${temaNoturno ? 'bg-gray-800 border-gray-700 text-white focus:border-purple-500' : 'bg-gray-50 border-gray-200 focus:border-purple-500'}`} />
              </div>
              <div>
                <label className={`block text-xs font-bold mb-2 uppercase tracking-wider ${temaNoturno ? 'text-gray-500' : 'text-gray-400'}`}>Gestor Master (Dono)</label>
                <input type="text" name="nomeDono" value={dadosEdicao.nomeDono} onChange={handleChangeEdicao} className={`w-full p-4 rounded-xl border outline-none font-bold text-base ${temaNoturno ? 'bg-gray-800 border-gray-700 text-white focus:border-purple-500' : 'bg-gray-50 border-gray-200 focus:border-purple-500'}`} />
              </div>
              <div>
                <label className={`block text-xs font-bold mb-2 uppercase tracking-wider ${temaNoturno ? 'text-gray-500' : 'text-gray-400'}`}>E-mail Autenticado</label>
                <input type="email" name="email" value={dadosEdicao.email} onChange={handleChangeEdicao} className={`w-full p-4 rounded-xl border outline-none font-bold text-base ${temaNoturno ? 'bg-gray-800 border-gray-700 text-white focus:border-purple-500' : 'bg-gray-50 border-gray-200 focus:border-purple-500'}`} />
              </div>
              <div>
                <label className={`block text-xs font-bold mb-2 uppercase tracking-wider ${temaNoturno ? 'text-gray-500' : 'text-gray-400'}`}>Forçar Nova Senha</label>
                <input type="text" name="senha" value={dadosEdicao.senha} onChange={handleChangeEdicao} className={`w-full p-4 rounded-xl border outline-none font-bold text-base ${temaNoturno ? 'bg-gray-800 border-gray-700 text-white focus:border-purple-500' : 'bg-gray-50 border-gray-200 focus:border-purple-500'}`} />
              </div>
            </div>

            <div className={`p-6 border-t ${temaNoturno ? 'border-gray-800 bg-gray-900/80' : 'border-gray-100 bg-gray-50'}`}>
              <button onClick={salvarEdicao} disabled={loading} className="w-full py-4 bg-purple-600 text-white rounded-2xl font-black text-lg hover:bg-purple-700 transition-colors shadow-lg shadow-purple-500/30 flex justify-center items-center">
                {loading ? <div className="animate-spin h-6 w-6 border-4 border-white border-t-transparent rounded-full"></div> : 'Salvar Configurações'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DRAWER TIMELINE DE AUDITORIA */}
      {modalLogsAberto && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setModalLogsAberto(false)}></div>
          <div className={`relative w-full max-w-lg h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300 ${temaNoturno ? 'bg-gray-900 border-l border-gray-800' : 'bg-white'}`}>
            <div className={`p-6 border-b flex justify-between items-start ${temaNoturno ? 'border-gray-800' : 'border-gray-100'}`}>
              <div>
                <h3 className={`text-xl font-black ${temaNoturno ? 'text-white' : 'text-slate-900'}`}>Auditoria de Segurança</h3>
                <p className={`text-sm mt-1 font-bold ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`}>Histórico restrito de autenticações.</p>
              </div>
              <button onClick={() => setModalLogsAberto(false)} className={`p-2 rounded-xl transition-colors ${temaNoturno ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            
            <div className={`px-6 py-4 border-b flex items-center justify-between ${temaNoturno ? 'border-gray-800 bg-gray-900/50' : 'border-gray-100 bg-gray-50'}`}>
               <button onClick={() => mudarDiaLog(-1)} className={`p-2.5 rounded-xl border shadow-sm transition-colors ${temaNoturno ? 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-white' : 'bg-white border-gray-200 hover:bg-gray-100 text-slate-900'}`}><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg></button>
               <div className="flex flex-col items-center">
                 <span className={`font-black text-sm tracking-widest uppercase ${temaNoturno ? 'text-white' : 'text-slate-900'}`}>{dataFiltroLogs.toLocaleDateString('pt-BR', { weekday: 'long' })}</span>
                 <span className={`text-xs font-bold ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`}>{dataFiltroLogs.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
               </div>
               <button onClick={() => mudarDiaLog(1)} className={`p-2.5 rounded-xl border shadow-sm transition-colors ${temaNoturno ? 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-white' : 'bg-white border-gray-200 hover:bg-gray-100 text-slate-900'}`}><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 relative">
              {loadingLogs ? (
                 <div className="flex justify-center items-center h-full"><div className="animate-spin rounded-full h-10 w-10 border-4 border-purple-500 border-t-transparent"></div></div>
              ) : logsCliente.length === 0 ? (
                 <div className="flex flex-col items-center justify-center h-full opacity-40 space-y-4 text-center">
                   <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                   <p className="font-black text-lg">Sem Acessos<br/>Neste Dia</p>
                 </div>
              ) : (
                 <div className="relative border-l-4 ml-4 space-y-8 animate-in fade-in pb-10" style={{ borderColor: temaNoturno ? '#374151' : '#e5e7eb' }}>
                   {logsCliente.map((log, index) => (
                     <div key={log.id} className="relative pl-6">
                        <div className={`absolute -left-[10px] top-1.5 w-4 h-4 rounded-full border-4 ${index === 0 ? 'bg-emerald-500 border-emerald-900/30' : (temaNoturno ? 'bg-gray-500 border-gray-900' : 'bg-gray-300 border-white')}`}></div>
                        <div className="flex flex-col">
                           <span className="text-xs font-black tracking-widest uppercase text-purple-500 mb-1">
                             {new Date(log.criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                           </span>
                           <div className={`p-5 rounded-2xl border shadow-sm ${temaNoturno ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-200'}`}>
                             <p className={`text-sm font-bold mb-2 ${temaNoturno ? 'text-gray-300' : 'text-gray-700'}`}>Login via <span className={temaNoturno ? 'text-white' : 'text-slate-900'}>{log.ip}</span></p>
                             <div className={`text-xs p-3 rounded-xl font-mono break-all ${temaNoturno ? 'bg-gray-900 text-gray-400' : 'bg-gray-50 text-gray-500'}`}>
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

      {/* MODAL INTELIGÊNCIA & MÉTRICAS (PREMIUM PROJECTION) */}
      {modalMetricasAberto && empresaSelecionadaMetricas && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-950/80 backdrop-blur-sm transition-opacity" onClick={() => setModalMetricasAberto(false)}></div>
          <div className={`relative w-full max-w-4xl max-h-[90vh] rounded-[2rem] border-2 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 ${temaNoturno ? 'bg-gray-900/90 border-gray-800' : 'bg-white'}`}>
            {temaNoturno && <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-purple-500/10 to-transparent blur-[50px]"></div>}
            
            <header className="p-6 md:p-8 border-b border-slate-100 dark:border-gray-800 flex justify-between items-center relative z-10">
               <div className="flex items-center gap-4">
                  {renderAvatar(empresaSelecionadaMetricas, 'w-14 h-14 md:w-16 md:h-16')}
                  <div>
                    <h3 className={`text-xl md:text-2xl font-black truncate max-w-[200px] md:max-w-none ${temaNoturno ? 'text-white' : 'text-slate-900'}`}>{empresaSelecionadaMetricas.nome}</h3>
                    <p className={`text-xs md:text-sm mt-1 font-bold ${temaNoturno ? 'text-gray-400' : 'text-slate-500'}`}>Inteligência de Consumo & Projeção.</p>
                  </div>
               </div>
               <button onClick={() => setModalMetricasAberto(false)} className={`p-2.5 md:p-3 rounded-2xl ${temaNoturno ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'}`}><svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </header>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 md:space-y-8 relative z-10">
               {/* 1. Projeção de Gastos Cloud (Usage based) */}
               <div>
                 <h4 className="text-[10px] md:text-xs uppercase font-black tracking-widest mb-3 md:mb-4 text-purple-500">1. Custo Operacional de Nuvem (DB)</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                    {[
                      { period: 'Consumo / Mês', value: calcularGastosEstimados(empresaSelecionadaMetricas.uso_registros).mes, iconColor: 'text-blue-500' },
                      { period: 'Projeção Anual', value: calcularGastosEstimados(empresaSelecionadaMetricas.uso_registros).ano, iconColor: 'text-emerald-500' }
                    ].map((cost,i) => (
                      <div key={i} className={`p-5 md:p-6 rounded-2xl border ${temaNoturno ? 'bg-gray-800/40 border-gray-800' : 'bg-gray-50 border-gray-100 shadow-sm'}`}>
                         <div className="flex justify-between items-center mb-2">
                           <span className={`text-[10px] md:text-[11px] font-bold uppercase tracking-wider ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`}>{cost.period}</span>
                           <svg className={`w-4 h-4 md:w-5 md:h-5 ${cost.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                         </div>
                         <h5 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white truncate">{cost.value}</h5>
                         <p className={`text-[9px] md:text-[10px] mt-1.5 font-bold ${temaNoturno ? 'text-gray-500' : 'text-gray-400'}`}>Base de cálculo: ~R$ 0,02 por registro (Supabase API).</p>
                      </div>
                    ))}
                 </div>
               </div>

               <hr className="border-slate-100 dark:border-gray-800/60" />
               
               {/* 2. Métricas de Mercado */}
               <div>
                 <h4 className="text-[10px] md:text-xs uppercase font-black tracking-widest mb-3 md:mb-4 text-purple-500">2. Performance da Conta</h4>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                    {[
                      { metric: 'Receita (MRR)', value: `R$ ${getPrecoMensalReal(empresaSelecionadaMetricas.plano).toFixed(2)}`, iconPath: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
                      { metric: 'Saúde (Uso)', value: empresaSelecionadaMetricas.uso_registros > 100 ? 'Alta' : 'Risco', iconPath: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
                      { metric: 'Total Registos', value: empresaSelecionadaMetricas.uso_registros, iconPath: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
                      { metric: 'Licença Base', value: getNomePlano(empresaSelecionadaMetricas.plano), iconPath: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' }
                    ].map((m,i) => (
                      <div key={i} className={`p-4 md:p-5 rounded-2xl border flex flex-col justify-between ${temaNoturno ? 'bg-gray-800/20 border-gray-800' : 'bg-gray-50 border-gray-100'}`}>
                         <div className="flex justify-between items-start mb-2 md:mb-3">
                           <span className={`text-[9px] md:text-[10px] font-bold uppercase tracking-widest ${temaNoturno ? 'text-gray-500' : 'text-gray-400'}`}>{m.metric}</span>
                           <svg className="w-4 h-4 md:w-5 md:h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={m.iconPath} /></svg>
                         </div>
                         <h6 className={`text-lg md:text-2xl font-black truncate ${temaNoturno ? 'text-white' : 'text-slate-900'}`}>{m.value}</h6>
                      </div>
                    ))}
                 </div>
               </div>
            </div>
            
            <footer className="p-4 md:p-6 border-t border-slate-100 dark:border-gray-800 flex justify-end relative z-10">
                <button onClick={() => setModalMetricasAberto(false)} className={`w-full md:w-auto px-6 py-3.5 md:py-3 rounded-xl text-sm font-black transition-colors ${temaNoturno ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white shadow-md'}`}>Fechar Inteligência</button>
            </footer>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMAÇÃO STATUS (Premium) */}
      {confirmModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-950/80 backdrop-blur-sm transition-opacity" onClick={() => setConfirmModalOpen(false)}></div>
          <div className={`relative w-full max-w-md rounded-[2rem] border-2 shadow-2xl p-6 md:p-8 animate-in zoom-in-95 duration-200 ${temaNoturno ? 'bg-gray-900 border-gray-800' : 'bg-white'}`}>
            <div className="flex items-center gap-4 mb-5 md:mb-6">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${confirmConfig.status ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <h3 className={`text-lg md:text-xl font-black ${temaNoturno ? 'text-white' : 'text-slate-900'}`}>{confirmConfig.status ? 'Suspender Operação' : 'Reativar Sistema'}</h3>
            </div>
            <p className={`text-sm md:text-base mb-6 md:mb-8 font-bold ${temaNoturno ? 'text-gray-300' : 'text-gray-700'}`}>Confirma a alteração para a conta <span className={temaNoturno ? 'text-white' : 'text-slate-900'}>{confirmConfig.nome}</span>? Esta ação tem efeito imediato.</p>
            <div className="grid grid-cols-2 gap-3">
               <button onClick={() => setConfirmModalOpen(false)} className={`py-3.5 md:py-4 rounded-xl font-black transition text-sm md:text-base ${temaNoturno ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>Cancelar</button>
               <button onClick={alternarStatusEmpresa} className={`py-3.5 md:py-4 rounded-xl font-black text-white text-sm md:text-base ${confirmConfig.status ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-500/20' : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20'} shadow-lg`}>{confirmConfig.status ? 'Suspender' : 'Reativar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}