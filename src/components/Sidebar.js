// src/components/Sidebar.js
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function Sidebar({
  menuMobileAberto, setMenuMobileAberto, temaNoturno, logoEmpresa,
  sessao, nomeEmpresa, abaAtiva, setAbaAtiva, setMostrarConfigEmpresa,
  setMostrarAdminProdutos, setMostrarConfigTags, setMostrarAdminDelivery,
  fazerLogout
}) {
  const [planoEmpresa, setPlanoEmpresa] = useState('Carregando...');

  // Busca o plano real da empresa no banco de dados
  useEffect(() => {
    const buscarPlano = async () => {
      if (sessao?.empresa_id) {
        const { data, error } = await supabase
          .from('empresas')
          .select('plano')
          .eq('id', sessao.empresa_id)
          .single();
          
        if (!error && data?.plano) {
          setPlanoEmpresa(data.plano);
        } else {
          setPlanoEmpresa('Premium'); // Fallback caso esteja vazio
        }
      }
    };
    
    buscarPlano();
  }, [sessao?.empresa_id]);

  // Ícones Premium Reutilizáveis
  const iconeComandas = <svg className="w-5 h-5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>;
  const iconeEncerradas = <svg className="w-5 h-5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>;
  const iconeFaturamento = <svg className="w-5 h-5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>;
  const iconeCaixa = <svg className="w-5 h-5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path></svg>;
  const iconeClientes = <svg className="w-5 h-5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>;
  const iconeLoja = <svg className="w-5 h-5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>;
  const iconeCardapio = <svg className="w-5 h-5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>;
  const iconeTags = <svg className="w-5 h-5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg>;
  const iconeDelivery = <svg className="w-5 h-5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"></path></svg>;

  // Função auxiliar para renderizar botões com estilo de abas ativas/inativas sem gradiente
  const MenuItem = ({ id, titulo, icone, onClick, isAtivo }) => (
    <button 
      onClick={onClick} 
      className={`w-full p-3.5 rounded-xl text-left font-bold text-sm transition-all duration-300 flex items-center gap-3 relative overflow-hidden group ${
        isAtivo 
          ? (temaNoturno 
              ? 'bg-gray-800 text-purple-400 border-l-4 border-purple-500 shadow-sm' 
              : 'bg-purple-50 text-purple-700 border-l-4 border-purple-600 shadow-sm') 
          : (temaNoturno 
              ? 'text-gray-400 hover:bg-gray-800/80 hover:text-gray-200 border-l-4 border-transparent' 
              : 'text-gray-500 hover:bg-gray-50 hover:text-purple-600 border-l-4 border-transparent')
      }`}
    >
      <span className={`transition-transform duration-300 ${isAtivo ? 'scale-110' : 'group-hover:scale-110'}`}>
        {icone}
      </span>
      {titulo}
    </button>
  );

  return (
    <>
      {/* OVERLAY DE FUNDO COM TRANSIÇÃO (Backdrop) */}
      <div 
        className={`fixed inset-0 z-[100] xl:hidden bg-black/60 backdrop-blur-sm transition-opacity duration-500 ease-in-out ${menuMobileAberto ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} 
        onClick={() => setMenuMobileAberto(false)}
      ></div>
      
      {/* PAINEL LATERAL COM DESLIZE (Slide) */}
      <div className={`fixed top-0 left-0 h-full w-[85%] max-w-[320px] z-[101] xl:hidden transform transition-transform duration-500 ease-[cubic-bezier(0.2,1,0.3,1)] shadow-2xl flex flex-col overflow-hidden ${menuMobileAberto ? 'translate-x-0' : '-translate-x-full'} ${temaNoturno ? 'bg-[#0f0f13] border-r border-gray-800/60' : 'bg-white border-r border-gray-100'}`}>
         
         {/* Efeitos Glow Premium Fundo */}
         {temaNoturno ? (
           <>
             <div className="absolute top-0 left-0 w-64 h-64 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none"></div>
             <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none"></div>
           </>
         ) : (
           <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-br from-purple-50/50 to-transparent pointer-events-none"></div>
         )}

         {/* HEADER DA SIDEBAR & BOTÃO FECHAR */}
         <div className="p-4 flex items-center relative z-10">
            <button 
              onClick={() => setMenuMobileAberto(false)} 
              className={`relative w-10 h-10 flex items-center justify-center rounded-full border transition-colors active:scale-95 ${temaNoturno ? 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-400' : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-500'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
         </div>

         {/* PERFIL E LOGO */}
         <div className={`px-6 pb-6 pt-2 border-b relative z-10 flex flex-col ${temaNoturno ? 'border-gray-800/60' : 'border-gray-100'}`}>
            <div className="flex gap-4 items-center">
              <div className={`w-16 h-16 rounded-full shadow-inner overflow-hidden border-2 shrink-0 ${temaNoturno ? 'border-gray-700 bg-gray-800' : 'border-purple-100 bg-purple-50'}`}>
                 <img src={logoEmpresa} alt="Logo" className="w-full h-full object-cover" onError={(e) => e.target.src='https://cdn-icons-png.flaticon.com/512/3135/3135715.png'} />
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <h3 className={`font-black text-xl leading-tight truncate ${temaNoturno ? 'text-white' : 'text-gray-900'}`}>{sessao.nome_usuario}</h3>
                <p className={`text-xs font-bold uppercase tracking-widest mt-0.5 truncate ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`}>{nomeEmpresa}</p>
                
                {/* Badge Premium Plano */}
                <div className="mt-2 flex">
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border shadow-sm ${temaNoturno ? 'bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/20' : 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200'}`}>
                    <svg className={`w-3 h-3 ${temaNoturno ? 'text-amber-400' : 'text-amber-600'}`} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                    <span className={`text-[9px] font-black uppercase tracking-widest ${temaNoturno ? 'text-amber-400' : 'text-amber-600'}`}>{planoEmpresa}</span>
                  </div>
                </div>
              </div>
            </div>
         </div>

         {/* NAVEGAÇÃO ROLÁVEL */}
         <div className="flex-1 overflow-y-auto py-6 custom-scrollbar relative z-10">
            <p className={`px-6 text-[10px] font-black uppercase tracking-[0.2em] mb-3 ${temaNoturno ? 'text-gray-600' : 'text-gray-400'}`}>Gestão Diária</p>
            <nav className="flex flex-col gap-1 px-3">
              <MenuItem id="comandas" titulo="Comandas em Aberto" icone={iconeComandas} isAtivo={abaAtiva === 'comandas'} onClick={() => { setAbaAtiva('comandas'); setMenuMobileAberto(false); }} />
              <MenuItem id="fechadas" titulo="Comandas Encerradas" icone={iconeEncerradas} isAtivo={abaAtiva === 'fechadas'} onClick={() => { setAbaAtiva('fechadas'); setMenuMobileAberto(false); }} />
              
              {(sessao.role === 'dono' || sessao.perm_faturamento) && (
                <MenuItem id="faturamento" titulo="Faturamento" icone={iconeFaturamento} isAtivo={abaAtiva === 'faturamento'} onClick={() => { setAbaAtiva('faturamento'); setMenuMobileAberto(false); }} />
              )}
              
              <MenuItem id="caixa" titulo="Fechamento de Caixa" icone={iconeCaixa} isAtivo={abaAtiva === 'caixa'} onClick={() => { setAbaAtiva('caixa'); setMenuMobileAberto(false); }} />
              
              {(sessao.role === 'dono' || sessao.perm_fidelidade || sessao.perm_estudo) && (
                <MenuItem id="fidelidade" titulo="Fidelidade e Clientes" icone={iconeClientes} isAtivo={abaAtiva === 'fidelidade'} onClick={() => { setAbaAtiva('fidelidade'); setMenuMobileAberto(false); }} />
              )}
            </nav>

            {/* SEÇÃO ADMINISTRAÇÃO */}
            <p className={`px-6 text-[10px] font-black uppercase tracking-[0.2em] mb-3 mt-8 ${temaNoturno ? 'text-gray-600' : 'text-gray-400'}`}>Administração</p>
            <nav className="flex flex-col gap-1 px-3">
              {sessao.role === 'dono' && (
                <MenuItem titulo="Configurações da Loja" icone={iconeLoja} onClick={() => { setMostrarConfigEmpresa(true); setMenuMobileAberto(false); }} />
              )}
              {(sessao.role === 'dono' || sessao.perm_cardapio) && (
                <MenuItem titulo="Gerenciar Cardápio" icone={iconeCardapio} onClick={() => { setMostrarAdminProdutos(true); setMenuMobileAberto(false); }} />
              )}
              {sessao.role === 'dono' && (
                <MenuItem titulo="Configurar Tags" icone={iconeTags} onClick={() => { setMostrarConfigTags(true); setMenuMobileAberto(false); }} />
              )}
              {sessao.role === 'dono' && (
                <MenuItem titulo="Delivery e Taxas" icone={iconeDelivery} onClick={() => { setMostrarAdminDelivery(true); setMenuMobileAberto(false); }} />
              )}
            </nav>
         </div>

         {/* BOTÃO SAIR */}
         <div className={`p-4 border-t relative z-10 ${temaNoturno ? 'border-gray-800/60 bg-black/20' : 'border-gray-100 bg-gray-50/50'}`}>
           <button onClick={fazerLogout} className={`w-full font-black text-sm p-4 rounded-xl transition-all shadow-sm flex justify-center items-center gap-2 active:scale-95 group ${temaNoturno ? 'bg-red-900/10 text-red-400 border border-red-900/30 hover:bg-red-900/30' : 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-100'}`}>
             <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg> 
             Desconectar Sessão
           </button>
         </div>

      </div>
    </>
  );
}