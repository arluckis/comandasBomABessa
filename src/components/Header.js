'use client';

export default function Header({
  comandaAtiva, setIdSelecionado, setMenuMobileAberto, temaNoturno,
  caixaAtual, abaAtiva, setAbaAtiva, logoEmpresa, setTemaNoturno,
  mostrarMenuPerfil, setMostrarMenuPerfil, nomeEmpresa, sessao,
  setMostrarConfigEmpresa, setMostrarAdminUsuarios, setMostrarAdminProdutos,
  setMostrarConfigTags, fazerLogout
}) {
  return (
    <header className={`flex items-center justify-between p-3 xl:p-4 rounded-3xl shadow-sm border mb-6 sticky top-0 z-40 transition-colors duration-500 ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
      
      {/* --- ESQUERDA: Botão Voltar ou Ícone Mobile + Caixa Aberto --- */}
      <div className="flex flex-1 justify-start items-center gap-3">
        {comandaAtiva ? (
          <button onClick={() => setIdSelecionado(null)} className={`flex items-center gap-2 font-bold px-4 py-2 rounded-xl transition ${temaNoturno ? 'bg-gray-700 text-purple-300 hover:bg-gray-600' : 'bg-purple-50 text-purple-700 hover:bg-purple-100'}`}>
            <span className="text-xl">←</span> <span className="hidden sm:inline">Voltar</span>
          </button>
        ) : (
          <>
            <button onClick={() => setMenuMobileAberto(true)} className={`xl:hidden p-2 rounded-xl border transition ${temaNoturno ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600' : 'bg-gray-50 border-gray-200 text-gray-800 hover:bg-gray-100'}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            </button>
            <div className={`hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl border ${temaNoturno ? 'bg-green-900/20 border-green-800/50' : 'bg-green-50 border-green-100'}`}>
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>
              <span className={`text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${temaNoturno ? 'text-green-400' : 'text-green-700'}`}>Caixa Aberto: {caixaAtual.data_abertura.split('-').reverse().join('/')}</span>
            </div>
          </>
        )}
      </div>

      {/* --- CENTRO: Navegação Principal ou Nome da Comanda --- */}
      <div className="flex justify-center shrink-0">
        {!comandaAtiva ? (
          <>
            <div className={`hidden xl:flex rounded-xl p-1 text-sm border ${temaNoturno ? 'bg-gray-900 border-gray-700' : 'bg-gray-100/80 border-gray-200/50'}`}>
              <button onClick={() => setAbaAtiva('comandas')} className={`px-4 py-2 rounded-lg font-bold transition whitespace-nowrap flex items-center gap-2 ${abaAtiva === 'comandas' ? (temaNoturno ? 'bg-gray-700 text-white shadow-sm' : 'bg-white text-purple-800 shadow-sm') : (temaNoturno ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-purple-600')}`}>
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg> Comandas em Aberto
              </button>
              <button onClick={() => setAbaAtiva('fechadas')} className={`px-4 py-2 rounded-lg font-bold transition whitespace-nowrap flex items-center gap-2 ${abaAtiva === 'fechadas' ? (temaNoturno ? 'bg-gray-700 text-white shadow-sm' : 'bg-white text-purple-800 shadow-sm') : (temaNoturno ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-purple-600')}`}>
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> Comandas Encerradas
              </button>
              {(sessao.role === 'dono' || sessao.perm_faturamento) && (
                <button onClick={() => setAbaAtiva('faturamento')} className={`px-4 py-2 rounded-lg font-bold transition whitespace-nowrap flex items-center gap-2 ${abaAtiva === 'faturamento' ? (temaNoturno ? 'bg-gray-700 text-white shadow-sm' : 'bg-white text-purple-800 shadow-sm') : (temaNoturno ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-purple-600')}`}>
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> Faturamento
                </button>
              )}
              {(sessao.role === 'dono' || sessao.perm_estudo) && (
                <button onClick={() => setAbaAtiva('analises')} className={`px-4 py-2 rounded-lg font-bold transition whitespace-nowrap flex items-center gap-2 ${abaAtiva === 'analises' ? (temaNoturno ? 'bg-gray-700 text-white shadow-sm' : 'bg-white text-purple-800 shadow-sm') : (temaNoturno ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-purple-600')}`}>
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"></path></svg> Público-Alvo
                </button>
              )}
            </div>
            <div className={`xl:hidden flex items-center gap-2 px-3 py-1.5 rounded-xl border ${temaNoturno ? 'bg-green-900/20 border-green-800/50' : 'bg-green-50 border-green-100'}`}>
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>
              <span className={`text-[10px] font-black uppercase tracking-widest ${temaNoturno ? 'text-green-400' : 'text-green-700'}`}>Caixa Aberto: {caixaAtual.data_abertura.split('-').reverse().join('/')}</span>
            </div>
          </>
        ) : (
          <h2 className={`text-lg font-black truncate text-center cursor-pointer hover:opacity-70 transition ${temaNoturno ? 'text-purple-300' : 'text-purple-900'}`} onClick={() => alert("Edite o nome da comanda no painel interno.")}>{comandaAtiva?.nome} ✏️</h2>
        )}
      </div>
      
      {/* --- DIREITA: Tema e Menu de Perfil --- */}
      <div className="flex flex-1 justify-end items-center gap-2 xl:gap-6">
        {!comandaAtiva ? (
           <>
              <button onClick={() => setTemaNoturno(!temaNoturno)} className={`p-2 rounded-full transition-all duration-300 flex items-center justify-center border shrink-0 ${temaNoturno ? 'bg-gray-700 border-gray-600 text-yellow-400 hover:bg-gray-600' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-200'}`}>
                {temaNoturno ? ( <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg> ) : ( <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg> )}
              </button>
              
              <div className="hidden xl:block relative shrink-0 cursor-pointer" onClick={() => setMostrarMenuPerfil(!mostrarMenuPerfil)}>
                <div className="flex items-center gap-3 hover:opacity-80 transition">
                  <div className="flex flex-col text-right">
                    <span className={`text-[10px] font-black uppercase tracking-widest leading-none mb-1 ${temaNoturno ? 'text-gray-400' : 'text-gray-400'}`}>{nomeEmpresa}</span>
                    <span className={`font-black tracking-tight leading-none text-sm ${temaNoturno ? 'text-purple-300' : 'text-purple-900'}`}>{sessao.nome_usuario}</span>
                  </div>
                  <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-black text-lg overflow-hidden shrink-0 ${temaNoturno ? 'border-gray-600 bg-gray-700' : 'border-purple-200 bg-purple-50'}`}>
                     <img src={logoEmpresa} alt="Logo" className="w-full h-full object-cover" onError={(e) => { e.target.onerror = null; e.target.src = 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'; }} />
                  </div>
                  <span className={`text-xs ml-1 ${temaNoturno ? 'text-gray-500' : 'text-gray-300'}`}>▼</span>
                </div>
                
                {mostrarMenuPerfil && (
                  <div className={`absolute top-14 right-0 shadow-2xl rounded-2xl p-2 w-56 border z-50 transition-colors ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                    {sessao.role === 'dono' && (
                      <button onClick={() => { setMostrarConfigEmpresa(true); setMostrarMenuPerfil(false); }} className={`w-full text-left p-3 text-sm font-bold flex items-center gap-3 rounded-xl transition ${temaNoturno ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                        <svg className="w-4 h-4 opacity-70 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg> Configurar Loja
                      </button>
                    )}
                    {sessao.role === 'dono' && (
                      <button onClick={() => { setMostrarAdminUsuarios(true); setMostrarMenuPerfil(false); }} className={`w-full text-left p-3 text-sm font-bold flex items-center gap-3 rounded-xl transition ${temaNoturno ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                        <svg className="w-4 h-4 opacity-70 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg> Equipe
                      </button>
                    )}
                    {(sessao.role === 'dono' || sessao.perm_cardapio) && (
                      <button onClick={() => { setMostrarAdminProdutos(true); setMostrarMenuPerfil(false); }} className={`w-full text-left p-3 text-sm font-bold flex items-center gap-3 rounded-xl transition ${temaNoturno ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                        <svg className="w-4 h-4 opacity-70 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg> Cardápio
                      </button>
                    )}
                    {sessao.role === 'dono' && (
                      <button onClick={() => { setMostrarConfigTags(true); setMostrarMenuPerfil(false); }} className={`w-full text-left p-3 text-sm font-bold flex items-center gap-3 rounded-xl transition ${temaNoturno ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                        <svg className="w-4 h-4 opacity-70 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg> Tags
                      </button>
                    )}
                    <div className={`h-px my-1 ${temaNoturno ? 'bg-gray-700' : 'bg-gray-100'}`}></div>
                    <button onClick={fazerLogout} className={`w-full text-left p-3 text-sm font-bold flex items-center gap-3 rounded-xl transition ${temaNoturno ? 'text-red-400 hover:bg-red-900/30' : 'text-red-600 hover:bg-red-50'}`}>
                      <svg className="w-4 h-4 opacity-70 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg> Sair do Sistema
                    </button>
                  </div>
                )}
              </div>
           </>
        ) : (
          <div className="hidden xl:flex flex-wrap gap-1 justify-end">
            {comandaAtiva.tags.map(t => <span key={t} className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase border ${temaNoturno ? 'bg-purple-900/30 text-purple-300 border-purple-800' : 'bg-purple-50 text-purple-700 border-purple-100'}`}>{t}</span>)}
          </div>
        )}
      </div>
    </header>
  );
}