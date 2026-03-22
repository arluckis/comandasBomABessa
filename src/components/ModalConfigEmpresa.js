'use client';
import { useState } from 'react';

export default function ModalConfigEmpresa({
  temaNoturno,
  nomeEmpresaEdicao,
  setNomeEmpresaEdicao,
  logoEmpresaEdicao,
  setLogoEmpresaEdicao,
  nomeUsuarioEdicao,
  setNomeUsuarioEdicao,
  planoUsuario,
  salvarConfigEmpresa,
  setMostrarConfigEmpresa,
  alterarSenhaConta
}) {
  // Controle de Abas no Mobile
  const [abaMobile, setAbaMobile] = useState('identidade'); // 'identidade' | 'seguranca'

  // Estados da Senha
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mostrarSenhas, setMostrarSenhas] = useState(false);

  // Validações
  const regrasSenha = [
    { id: 'tamanho', texto: 'Mínimo de 8 caracteres', valido: novaSenha.length >= 8 },
    { id: 'maiuscula', texto: 'Letras maiúscula e minúscula', valido: /[a-z]/.test(novaSenha) && /[A-Z]/.test(novaSenha) },
    { id: 'numero', texto: 'Pelo menos 1 número', valido: /[0-9]/.test(novaSenha) },
    { id: 'especial', texto: 'Caractere especial (@, #, etc)', valido: /[^A-Za-z0-9]/.test(novaSenha) },
  ];

  const forcaSenha = regrasSenha.filter(r => r.valido).length;
  const coresProgress = ['bg-red-500', 'bg-red-500', 'bg-orange-500', 'bg-amber-400', 'bg-green-500'];
  const corAtual = coresProgress[forcaSenha];
  const senhaValida = forcaSenha === 4 && novaSenha === confirmarSenha && novaSenha.length > 0;

  // Plano
  const nomePlano = planoUsuario?.nome?.toLowerCase() || 'free';
  const isPremium = nomePlano.includes('premium') || nomePlano.includes('pro') || nomePlano.includes('anual') || nomePlano.includes('mensal') || nomePlano.includes('semestral');
  const nomePlanoDisplay = planoUsuario?.nome ? (planoUsuario.nome.charAt(0).toUpperCase() + planoUsuario.nome.slice(1)) : 'Beta Tester Especial';

  const formatarData = (dataString) => {
    if (!dataString) return 'Vitalício / Indeterminado';
    return new Date(dataString).toLocaleDateString('pt-BR');
  };

  const handleSalvarSenha = () => {
    if (!senhaValida) return;
    if (alterarSenhaConta) alterarSenhaConta(senhaAtual, novaSenha);
    setSenhaAtual(''); setNovaSenha(''); setConfirmarSenha('');
  };

  return (
    // items-start no mobile evita que o topo seja cortado caso a tela seja pequena
    <div className="fixed inset-0 bg-black/80 flex items-start sm:items-center justify-center p-4 sm:p-6 z-[70] backdrop-blur-md overflow-y-auto">
      
      {/* Container Principal */}
      <div className={`relative w-full max-w-5xl rounded-3xl shadow-2xl animate-in zoom-in-95 border flex flex-col overflow-hidden my-auto shrink-0 transition-colors duration-500 ${temaNoturno ? 'bg-gradient-to-br from-[#15151e] to-[#0a0a0f] border-gray-800' : 'bg-white border-gray-200'}`}>
        
        {/* Glow Effects Premium */}
        {temaNoturno ? (
          <>
            <div className="absolute -top-32 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none"></div>
          </>
        ) : (
          <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-purple-50/40 via-transparent to-amber-50/30 pointer-events-none"></div>
        )}

        {/* Header do Modal */}
        <div className={`flex justify-between items-center p-5 lg:p-7 border-b relative z-10 ${temaNoturno ? 'border-gray-800/80 bg-[#15151e]/50' : 'border-gray-100 bg-white/50'} backdrop-blur-md`}>
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl shadow-inner ${temaNoturno ? 'bg-gradient-to-br from-amber-500/20 to-amber-700/10 text-amber-400 border border-amber-500/20' : 'bg-gradient-to-br from-amber-100 to-amber-50 text-amber-600 border border-amber-200'}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            </div>
            <div>
              <h2 className={`text-xl lg:text-2xl font-black tracking-tight ${temaNoturno ? 'text-gray-100' : 'text-gray-900'}`}>Ajustes da Conta</h2>
              <p className={`text-xs mt-0.5 font-medium ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`}>Gerencie sua identidade, plano e segurança.</p>
            </div>
          </div>
          <button onClick={() => setMostrarConfigEmpresa(false)} className={`p-2.5 rounded-full font-bold transition active:scale-95 ${temaNoturno ? 'bg-gray-800/80 text-gray-400 hover:text-white hover:bg-gray-700' : 'bg-gray-100 text-gray-400 hover:text-gray-900 hover:bg-gray-200'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        {/* Abas Mobile */}
        <div className={`lg:hidden flex border-b relative z-10 ${temaNoturno ? 'border-gray-800' : 'border-gray-200'}`}>
          <button onClick={() => setAbaMobile('identidade')} className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-colors relative ${abaMobile === 'identidade' ? (temaNoturno ? 'text-purple-400' : 'text-purple-600') : (temaNoturno ? 'text-gray-500' : 'text-gray-400')}`}>
            Identidade
            {abaMobile === 'identidade' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-500 rounded-t-full"></span>}
          </button>
          <button onClick={() => setAbaMobile('seguranca')} className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-colors relative ${abaMobile === 'seguranca' ? (temaNoturno ? 'text-amber-400' : 'text-amber-500') : (temaNoturno ? 'text-gray-500' : 'text-gray-400')}`}>
            Plano e Segurança
            {abaMobile === 'seguranca' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-500 rounded-t-full"></span>}
          </button>
        </div>

        {/* Grid de 2 Colunas */}
        <div className="flex flex-col lg:flex-row relative z-10 flex-1 min-h-0">
          
          {/* COLUNA 1: IDENTIDADE DA MARCA */}
          <div className={`p-6 lg:p-8 flex-col gap-6 lg:w-1/2 lg:border-r ${abaMobile === 'identidade' ? 'flex' : 'hidden lg:flex'} ${temaNoturno ? 'border-gray-800' : 'border-gray-100 bg-gradient-to-b from-transparent to-purple-50/30'}`}>
            <h3 className={`text-xs font-black uppercase tracking-[0.2em] mb-2 flex items-center gap-2 ${temaNoturno ? 'text-purple-400' : 'text-purple-600'}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg> 
              Identidade Visual
            </h3>

            <div className="space-y-5">
              <div className="group">
                <label className={`text-[10px] font-black uppercase tracking-widest mb-1.5 block transition-colors ${temaNoturno ? 'text-gray-400 group-focus-within:text-purple-400' : 'text-gray-500 group-focus-within:text-purple-600'}`}>Estabelecimento</label>
                <input type="text" value={nomeEmpresaEdicao} onChange={e => setNomeEmpresaEdicao(e.target.value)} className={`w-full px-4 py-3.5 rounded-xl border outline-none text-sm font-bold transition-all focus:ring-2 focus:ring-purple-500/20 ${temaNoturno ? 'bg-gray-900/60 border-gray-700/80 focus:border-purple-500 text-white' : 'bg-white border-gray-200 focus:border-purple-500 text-gray-900 shadow-sm'}`} />
              </div>

              <div className="group">
                <label className={`text-[10px] font-black uppercase tracking-widest mb-1.5 block transition-colors ${temaNoturno ? 'text-gray-400 group-focus-within:text-purple-400' : 'text-gray-500 group-focus-within:text-purple-600'}`}>Gestor Responsável</label>
                <input type="text" value={nomeUsuarioEdicao} onChange={e => setNomeUsuarioEdicao(e.target.value)} className={`w-full px-4 py-3.5 rounded-xl border outline-none text-sm font-bold transition-all focus:ring-2 focus:ring-purple-500/20 ${temaNoturno ? 'bg-gray-900/60 border-gray-700/80 focus:border-purple-500 text-white' : 'bg-white border-gray-200 focus:border-purple-500 text-gray-900 shadow-sm'}`} />
              </div>

              <div className="group">
                <label className={`text-[10px] font-black uppercase tracking-widest mb-1.5 block transition-colors ${temaNoturno ? 'text-gray-400 group-focus-within:text-purple-400' : 'text-gray-500 group-focus-within:text-purple-600'}`}>Logotipo (URL da Imagem)</label>
                <div className="flex gap-4 items-center">
                  <div className={`w-16 h-16 rounded-2xl border shrink-0 overflow-hidden flex items-center justify-center p-0.5 shadow-md ${temaNoturno ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
                    <img src={logoEmpresaEdicao || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'} alt="Preview" className="w-full h-full object-cover rounded-xl" onError={(e) => e.target.src='https://cdn-icons-png.flaticon.com/512/3135/3135715.png'} />
                  </div>
                  <input type="text" placeholder="Ex: https://i.imgur.com/logo.png" value={logoEmpresaEdicao} onChange={e => setLogoEmpresaEdicao(e.target.value)} className={`w-full px-4 py-3.5 rounded-xl border outline-none text-sm font-bold transition-all focus:ring-2 focus:ring-purple-500/20 ${temaNoturno ? 'bg-gray-900/60 border-gray-700/80 focus:border-purple-500 text-white' : 'bg-white border-gray-200 focus:border-purple-500 text-gray-900 shadow-sm'}`} />
                </div>
              </div>
            </div>

            <div className="mt-auto pt-6">
              <button onClick={salvarConfigEmpresa} className={`w-full font-black py-4 rounded-xl transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2 group ${temaNoturno ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-900/20' : 'bg-gray-900 hover:bg-black text-white shadow-gray-900/20'}`}>
                <span>Salvar Identidade</span>
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
              </button>
            </div>
          </div>

          {/* COLUNA 2: PLANO E SEGURANÇA */}
          <div className={`p-6 lg:p-8 flex-col gap-6 lg:w-1/2 ${abaMobile === 'seguranca' ? 'flex' : 'hidden lg:flex'} ${temaNoturno ? 'bg-black/20' : 'bg-gray-50/50'}`}>
            
            {/* Bloco do Plano */}
            <h3 className={`text-xs font-black uppercase tracking-[0.2em] mb-0 flex items-center gap-2 ${temaNoturno ? 'text-amber-400' : 'text-amber-600'}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path></svg> 
              Assinatura Ativa
            </h3>

            <div className={`p-5 rounded-2xl border flex items-center justify-between shadow-sm ${isPremium ? (temaNoturno ? 'bg-gradient-to-br from-amber-900/30 to-yellow-900/10 border-amber-500/30' : 'bg-gradient-to-br from-amber-50 to-yellow-50/50 border-amber-200') : (temaNoturno ? 'bg-gray-800/60 border-gray-700/50' : 'bg-white border-gray-200')}`}>
              <div className="flex flex-col">
                <span className={`text-[10px] font-black uppercase tracking-widest ${isPremium ? 'text-amber-600 dark:text-amber-500' : (temaNoturno ? 'text-gray-400' : 'text-gray-500')}`}>Plano Vigente</span>
                <span className={`text-lg font-black tracking-tight ${temaNoturno ? 'text-white' : 'text-gray-900'}`}>{nomePlanoDisplay}</span>
                {isPremium && <span className={`text-[10px] font-bold mt-1 ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`}>Válido até: {formatarData(planoUsuario?.validade)}</span>}
              </div>
              {!isPremium ? (
                 <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 shrink-0">
                   <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                   <span className="text-[10px] font-black text-green-600 dark:text-green-400 uppercase tracking-widest">Sistema Ativo</span>
                 </div>
              ) : (
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-inner shrink-0 bg-gradient-to-br from-amber-400 to-yellow-600 text-white`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                </div>
              )}
            </div>

            {/* Bloco de Segurança com Barra de Progresso */}
            <div className="mt-4">
              <h3 className={`text-xs font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2 ${temaNoturno ? 'text-gray-400' : 'text-gray-600'}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg> 
                Segurança de Acesso
              </h3>
              
              <div className="space-y-4">
                <input type={mostrarSenhas ? "text" : "password"} placeholder="Senha Atual" value={senhaAtual} onChange={e => setSenhaAtual(e.target.value)} className={`w-full px-4 py-3.5 rounded-xl border outline-none text-sm font-bold transition-all focus:ring-2 focus:ring-amber-500/20 ${temaNoturno ? 'bg-gray-900/60 border-gray-700/80 focus:border-amber-500 text-white placeholder-gray-600' : 'bg-white border-gray-200 focus:border-amber-500 text-gray-900 placeholder-gray-400 shadow-sm'}`} />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input type={mostrarSenhas ? "text" : "password"} placeholder="Nova Senha" value={novaSenha} onChange={e => setNovaSenha(e.target.value)} className={`w-full px-4 py-3.5 rounded-xl border outline-none text-sm font-bold transition-all focus:ring-2 focus:ring-amber-500/20 ${temaNoturno ? 'bg-gray-900/60 border-gray-700/80 focus:border-amber-500 text-white placeholder-gray-600' : 'bg-white border-gray-200 focus:border-amber-500 text-gray-900 placeholder-gray-400 shadow-sm'}`} />
                  <input type={mostrarSenhas ? "text" : "password"} placeholder="Confirmar Nova" value={confirmarSenha} onChange={e => setConfirmarSenha(e.target.value)} className={`w-full px-4 py-3.5 rounded-xl border outline-none text-sm font-bold transition-all focus:ring-2 focus:ring-amber-500/20 ${novaSenha && confirmarSenha && novaSenha !== confirmarSenha ? 'border-red-500 focus:border-red-500' : (temaNoturno ? 'bg-gray-900/60 border-gray-700/80 focus:border-amber-500' : 'bg-white border-gray-200 focus:border-amber-500')} ${temaNoturno ? 'text-white placeholder-gray-600' : 'text-gray-900 placeholder-gray-400 shadow-sm'}`} />
                </div>
                
                {/* Barra de Progresso Suave */}
                <div className="flex flex-col gap-1.5 pt-1">
                  <div className="flex justify-between items-center mb-1">
                     <span className={`text-[10px] font-black uppercase tracking-widest ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`}>Força da Senha</span>
                     <button onClick={() => setMostrarSenhas(!mostrarSenhas)} className={`text-[9px] font-black uppercase tracking-widest transition-colors ${temaNoturno ? 'text-amber-400 hover:text-amber-300' : 'text-amber-600 hover:text-amber-700'}`}>
                       {mostrarSenhas ? 'Ocultar' : 'Mostrar'}
                     </button>
                  </div>
                  
                  <div className={`h-1.5 w-full rounded-full overflow-hidden ${temaNoturno ? 'bg-gray-800' : 'bg-gray-200'}`}>
                     <div className={`h-full transition-all duration-500 ease-out ${corAtual}`} style={{ width: `${(forcaSenha / 4) * 100}%` }}></div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-2 gap-y-1.5 mt-2">
                    {regrasSenha.map(regra => (
                      <div key={regra.id} className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full flex items-center justify-center shrink-0 transition-colors duration-300 ${regra.valido ? 'bg-green-500 text-white' : (temaNoturno ? 'bg-gray-700 text-gray-500' : 'bg-gray-200 text-gray-400')}`}>
                          {regra.valido && <svg className="w-2 h-2" fill="none" stroke="currentColor" strokeWidth="4" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>}
                        </div>
                        <span className={`text-[9px] font-bold uppercase tracking-wider transition-colors duration-300 ${regra.valido ? (temaNoturno ? 'text-green-400' : 'text-green-600') : (temaNoturno ? 'text-gray-500' : 'text-gray-400')}`}>{regra.texto}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <button disabled={!senhaValida || !senhaAtual} onClick={handleSalvarSenha} className={`w-full font-black py-4 rounded-xl mt-6 transition-all shadow-sm flex items-center justify-center gap-2 ${senhaValida && senhaAtual ? (temaNoturno ? 'bg-green-600/20 text-green-400 border border-green-600/50 hover:bg-green-600/30' : 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 cursor-pointer') : (temaNoturno ? 'bg-gray-800/80 text-gray-600 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed')}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"></path></svg>
                <span>Atualizar Senha de Acesso</span>
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}