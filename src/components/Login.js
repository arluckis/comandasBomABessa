'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const LoadingDots = () => (
  <div className="flex items-center gap-1.5">
    <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></div>
    <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></div>
    <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
  </div>
);

// MOTION FIX: Microinterações nos validadores
const CheckIcon = ({ active }) => (
  <svg className={`w-4 h-4 transition-all duration-500 ease-out ${active ? 'text-emerald-400 scale-100 opacity-100' : 'text-zinc-600 scale-90 opacity-50'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
  </svg>
);

export default function Login({ getHoje, setSessao, setScenePhase }) {
  const [credenciais, setCredenciais] = useState({ email: '', senha: '' });
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [erro, setErro] = useState('');

  const [lastLogin, setLastLogin] = useState(null);
  const [mostrarFormPadrao, setMostrarFormPadrao] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const [stepTrocaSenha, setStepTrocaSenha] = useState(false);
  const [tempUser, setTempUser] = useState(null);
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState('');

  // MOTION FIX: Lógica de Validação Estrita (Storytelling & Security)
  const isNotEmpty = novaSenha.length > 0;
  const hasLength = novaSenha.length >= 8;
  const hasNumber = /\d/.test(novaSenha);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(novaSenha);
  const matchPasswords = isNotEmpty && novaSenha === confirmarNovaSenha;
  const confirmTouched = confirmarNovaSenha.length > 0;
  
  let pwdScore = 0;
  if (hasLength) pwdScore++;
  if (hasNumber) pwdScore++;
  if (hasSpecial) pwdScore++;
  if (pwdScore === 3 && matchPasswords) pwdScore++; 

  const progressWidth = `${(pwdScore / 4) * 100}%`;
  const progressColor = pwdScore <= 1 ? 'bg-rose-500' : pwdScore === 2 ? 'bg-amber-400' : pwdScore === 3 ? 'bg-emerald-500' : 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.6)]';

  useEffect(() => {
    setIsMounted(true);
    try {
      const saved = localStorage.getItem('arox_last_login');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.email) setLastLogin(parsed);
        else setMostrarFormPadrao(true);
      } else setMostrarFormPadrao(true);
    } catch (e) {
      localStorage.removeItem('arox_last_login');
      setMostrarFormPadrao(true);
    }
  }, []);

  const concluirAcesso = (data) => {
    const logoEmpresa = data.empresas?.logo_url || data.empresas?.logo || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
    const nomeEmpresa = data.empresas?.nome || (data.role === 'super_admin' ? 'Console Admin' : 'AROX');

    localStorage.setItem('arox_last_login', JSON.stringify({
      email: data.email, senha: data.senha, nome_usuario: data.nome_usuario, nome_empresa: nomeEmpresa, logo: logoEmpresa
    }));

    const sessionObj = { ...data, data: getHoje() };
    delete sessionObj.empresas; 
    localStorage.setItem('bessa_session', JSON.stringify(sessionObj)); 
    
    if (data.role === 'super_admin') { window.location.href = '/admin'; return; }
    setSessao(sessionObj);
    
    (async () => {
      try {
        const ipRes = await fetch('https://api.ipify.org?format=json');
        const ip = (await ipRes.json()).ip;
        const ua = navigator.userAgent;
        await supabase.from('logs_acesso').insert([{ usuario_id: data.id, empresa_id: data.empresa_id, email: data.email, ip: ip, navegador: ua }]);
        const { data: sessaoDb } = await supabase.from('sessoes_acesso').insert([{ usuario_id: data.id, empresa_id: data.empresa_id, ip_origem: ip, user_agent: ua }]).select().single();
        if (sessaoDb) localStorage.setItem('arox_session_id', sessaoDb.id);
        await supabase.from('usuarios').update({ status_presenca: 'online', ultimo_ping_at: new Date().toISOString() }).eq('id', data.id);
      } catch (err) {}
    })();
  };

  const processarAutenticacao = async (emailBusca, senhaBusca) => {
    setLoadingLogin(true); setErro('');
    if(setScenePhase) setScenePhase('sync'); 

    const { data, error } = await supabase.from('usuarios').select('*, empresas ( ativo, nome, logo_url )').eq('email', emailBusca.trim()).eq('senha', senhaBusca).single();

    if (data && !error) { 
      if (data.role !== 'super_admin' && data.empresas && data.empresas.ativo === false) {
        setErro("Acesso suspenso pelo administrador.");
        setLoadingLogin(false);
        if(setScenePhase) setScenePhase('reveal');
        return;
      }
      if (data.primeiro_login === true) {
        setTempUser(data);
        setStepTrocaSenha(true);
        setLoadingLogin(false);
        return;
      }
      concluirAcesso(data);
    } else { 
      setErro("Credenciais inválidas ou não autorizadas."); 
      setLoadingLogin(false);
      if(setScenePhase) setScenePhase('reveal'); 
    }
  };

  const fazerLogin = (e) => { e.preventDefault(); if (!credenciais.email || !credenciais.senha) return setErro("Preencha email e senha."); processarAutenticacao(credenciais.email, credenciais.senha); };
  const loginComContaSalva = () => { if (lastLogin && lastLogin.email) processarAutenticacao(lastLogin.email, lastLogin.senha); else setMostrarFormPadrao(true); };

  const salvarNovaSenha = async (e) => {
    e.preventDefault(); setErro('');
    if (pwdScore < 4) return setErro("A senha não atende aos requisitos corporativos.");
    
    setLoadingLogin(true);
    if(setScenePhase) setScenePhase('sync');
    
    const { error } = await supabase.from('usuarios').update({ senha: novaSenha, primeiro_login: false }).eq('id', tempUser.id);
    if (error) {
      setErro("Falha no túnel de segurança. Tente novamente.");
      setLoadingLogin(false);
      if(setScenePhase) setScenePhase('reveal');
    } else {
      const dataAtualizada = { ...tempUser, senha: novaSenha, primeiro_login: false };
      concluirAcesso(dataAtualizada);
    }
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-[100dvh] flex w-full font-sans selection:bg-white/20 selection:text-white relative z-10 overflow-x-hidden">
      
      {/* LADO ESQUERDO - MARKETING */}
      <div className="hidden lg:flex lg:w-[55%] relative flex-col justify-between px-20 py-16 pointer-events-none">
        <div className="relative z-20">
          <span className="text-white font-black tracking-[0.2em] text-2xl drop-shadow-lg">AROX</span>
        </div>
        
        <div className="relative z-20 w-full max-w-lg mt-8 pointer-events-auto">
          <h1 className="text-[3.5rem] font-bold text-white leading-[1.05] tracking-tight mb-6 drop-shadow-2xl">Domine sua operação.</h1>
          <p className="text-zinc-300 text-lg leading-relaxed max-w-md font-medium drop-shadow-md">A arquitetura definitiva para alta performance, controle absoluto e métricas em tempo real.</p>
        </div>

        <div className="relative z-20 grid grid-cols-2 gap-x-12 gap-y-6 text-[13px] font-medium text-zinc-400 max-w-md border-t border-white/10 pt-8 mt-12">
          <div className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"></div><span className="text-zinc-200">Workspaces Seguros</span></div>
          <div className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div><span className="text-zinc-200">99.9% Uptime</span></div>
          <div className="flex items-center gap-3"><svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg><span>Criptografia Avançada</span></div>
          <div className="flex items-center gap-3"><svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg><span>Instância Dedicada</span></div>
        </div>
      </div>

      {/* LADO DIREITO - FORMULÁRIO */}
      <div className="w-full lg:w-[45%] flex flex-col justify-center items-center p-6 sm:p-12 relative">
        
        <div className="w-full max-w-[400px] mt-[10vh] lg:mt-0 bg-[#05060A]/60 backdrop-blur-[30px] border border-white/[0.08] p-8 sm:p-10 rounded-[32px] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)] animate-in fade-in slide-in-from-bottom-6 duration-1000 relative z-20">
          
          <div className="lg:hidden mb-12 text-center">
            <span className="text-white font-black tracking-[0.3em] text-2xl drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">AROX</span>
          </div>

          {stepTrocaSenha ? (
            <div className="animate-in fade-in duration-500">
              <div className="mb-8">
                <h2 className="text-[1.75rem] font-semibold text-white tracking-tight">Credencial Blindada</h2>
                <p className="mt-2 text-[14px] text-zinc-400 leading-relaxed font-light">
                  Seja bem-vindo, <span className="font-medium text-zinc-200">{tempUser?.nome_usuario}</span>. A arquitetura exige que você defina uma chave de acesso robusta.
                </p>
              </div>

              <form onSubmit={salvarNovaSenha} className="space-y-6">
                <div>
                  <input 
                    type="password" placeholder="Nova senha" 
                    className="w-full px-5 py-4 bg-white/[0.03] border border-white/10 rounded-2xl focus:border-white/30 focus:bg-white/[0.05] focus:ring-0 outline-none transition-all font-medium text-white placeholder:text-zinc-600 shadow-inner text-[15px]" 
                    value={novaSenha} onChange={e => setNovaSenha(e.target.value)} 
                    onFocus={() => setScenePhase && setScenePhase('sync')} onBlur={() => setScenePhase && setScenePhase('reveal')} autoFocus 
                  />
                </div>
                <div>
                  <input 
                    type="password" placeholder="Confirme a senha" 
                    className={`w-full px-5 py-4 bg-white/[0.03] border rounded-2xl focus:bg-white/[0.05] focus:ring-0 outline-none transition-all font-medium text-white placeholder:text-zinc-600 shadow-inner text-[15px] ${confirmTouched && !matchPasswords ? 'border-rose-500/50 focus:border-rose-400 text-rose-200' : 'border-white/10 focus:border-white/30'}`} 
                    value={confirmarNovaSenha} onChange={e => setConfirmarNovaSenha(e.target.value)} 
                    onFocus={() => setScenePhase && setScenePhase('sync')} onBlur={() => setScenePhase && setScenePhase('reveal')}
                  />
                </div>

                <div className="pt-2">
                  <div className="h-[3px] w-full bg-white/10 rounded-full overflow-hidden mb-5">
                    <div className={`h-full transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] rounded-full ${progressColor}`} style={{ width: progressWidth }}></div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className={`flex items-center gap-2 text-[12px] font-medium transition-colors duration-300 ${hasLength ? 'text-zinc-200' : 'text-zinc-500'}`}>
                      <CheckIcon active={hasLength} /> Mín. 8 dígitos
                    </div>
                    <div className={`flex items-center gap-2 text-[12px] font-medium transition-colors duration-300 ${hasNumber ? 'text-zinc-200' : 'text-zinc-500'}`}>
                      <CheckIcon active={hasNumber} /> Pelo menos 1 número
                    </div>
                    <div className={`flex items-center gap-2 text-[12px] font-medium transition-colors duration-300 ${hasSpecial ? 'text-zinc-200' : 'text-zinc-500'}`}>
                      <CheckIcon active={hasSpecial} /> Caractere Especial
                    </div>
                    <div className={`flex items-center gap-2 text-[12px] font-medium transition-colors duration-300 ${matchPasswords ? 'text-zinc-200' : 'text-zinc-500'}`}>
                      <CheckIcon active={matchPasswords} /> Senhas idênticas
                    </div>
                  </div>
                </div>

                {erro && <div className="text-[13px] text-rose-400 font-medium animate-in fade-in bg-rose-500/10 p-3 rounded-lg border border-rose-500/20">{erro}</div>}
                
                <button type="submit" disabled={loadingLogin || pwdScore < 4} className={`w-full flex justify-center items-center py-4 px-4 rounded-2xl text-[14px] font-semibold tracking-wide transition-all duration-500 mt-6 ${pwdScore === 4 ? 'bg-white text-black hover:bg-zinc-200 shadow-[0_0_30px_rgba(255,255,255,0.15)] active:scale-[0.98]' : 'bg-white/5 text-white/30 cursor-not-allowed border border-white/5'}`}>
                  {loadingLogin ? <LoadingDots /> : 'Confirmar Credencial'}
                </button>
              </form>
            </div>

          ) : (!mostrarFormPadrao && lastLogin) ? (
            <div className="animate-in fade-in duration-500 w-full">
              <div className="mb-10 text-center sm:text-left">
                <h2 className="text-[1.75rem] font-semibold text-white tracking-tight">Bem-vindo de volta</h2>
                <p className="mt-2 text-[14px] text-zinc-400 font-light">Acesse seu ambiente de trabalho.</p>
              </div>

              <div 
                className="w-full flex items-center justify-between p-5 bg-white/[0.03] border border-white/10 rounded-[20px] shadow-inner hover:bg-white/[0.06] hover:border-white/20 transition-all duration-300 mb-8 group cursor-pointer"
                onMouseEnter={() => setScenePhase && setScenePhase('sync')} onMouseLeave={() => setScenePhase && setScenePhase('reveal')}
                onClick={loginComContaSalva}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden border border-white/20 shadow-lg bg-black/50 flex items-center justify-center relative">
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent"></div>
                    <img src={lastLogin.logo || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'} alt="Logo" className="w-full h-full object-cover z-10" onError={(e) => e.currentTarget.style.display = 'none'} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[15px] font-semibold text-white tracking-wide">{lastLogin.nome_usuario}</span>
                    <span className="text-[12px] font-medium text-zinc-400">{lastLogin.nome_empresa}</span>
                  </div>
                </div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)] relative">
                  <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-50"></div>
                </div>
              </div>

              {erro && <div className="text-[13px] text-rose-400 font-medium animate-in fade-in mb-6 bg-rose-500/10 p-3 rounded-lg border border-rose-500/20">{erro}</div>}

              <div className="space-y-3">
                <button onClick={loginComContaSalva} disabled={loadingLogin} className="w-full flex justify-center items-center py-4 px-4 rounded-2xl text-[14px] font-semibold text-black tracking-wide bg-white hover:bg-zinc-200 shadow-[0_0_30px_rgba(255,255,255,0.1)] transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed">
                  {loadingLogin ? <LoadingDots /> : 'Entrar na Operação'}
                </button>
                <button onClick={() => setMostrarFormPadrao(true)} className="w-full flex justify-center items-center py-4 px-4 rounded-2xl text-[13px] font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-all border border-transparent hover:border-white/10">
                  Acessar com outra conta
                </button>
              </div>
            </div>

          ) : (
            <div className="animate-in fade-in duration-500">
              <div className="mb-10 text-center sm:text-left">
                <h2 className="text-[1.75rem] font-semibold text-white tracking-tight">Autenticação</h2>
                <p className="mt-2 text-[14px] text-zinc-400 font-light">Identifique-se para acessar o cluster da AROX.</p>
              </div>
              
              <form className="space-y-5" onSubmit={fazerLogin}>
                <div className="space-y-4">
                  <div>
                    <input 
                      id="email" type="email" placeholder="E-mail corporativo" 
                      className="w-full px-5 py-4 bg-white/[0.03] border border-white/10 rounded-2xl focus:border-white/30 focus:bg-white/[0.05] focus:ring-0 outline-none transition-all font-medium text-white placeholder:text-zinc-600 shadow-inner text-[15px]" 
                      value={credenciais.email} onChange={e => setCredenciais({...credenciais, email: e.target.value})} 
                      onFocus={() => setScenePhase && setScenePhase('sync')} onBlur={() => setScenePhase && setScenePhase('reveal')} autoFocus 
                    />
                  </div>
                  <div>
                    <input 
                      id="senha" type="password" placeholder="Sua senha" 
                      className="w-full px-5 py-4 bg-white/[0.03] border border-white/10 rounded-2xl focus:border-white/30 focus:bg-white/[0.05] focus:ring-0 outline-none transition-all font-medium text-white placeholder:text-zinc-600 shadow-inner text-[15px]" 
                      value={credenciais.senha} onChange={e => setCredenciais({...credenciais, senha: e.target.value})} 
                      onFocus={() => setScenePhase && setScenePhase('sync')} onBlur={() => setScenePhase && setScenePhase('reveal')}
                    />
                  </div>
                </div>

                {erro && <div className="text-[13px] text-rose-400 font-medium animate-in fade-in pt-1 bg-rose-500/10 p-3 rounded-lg border border-rose-500/20">{erro}</div>}

                <button type="submit" disabled={loadingLogin} className="w-full flex justify-center items-center py-4 px-4 rounded-2xl text-[14px] tracking-wide font-semibold text-black bg-white hover:bg-zinc-200 shadow-[0_0_30px_rgba(255,255,255,0.1)] transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-4">
                  {loadingLogin ? <LoadingDots /> : 'Entrar no Sistema'}
                </button>
                
                {lastLogin && (
                   <div className="text-center pt-6">
                     <button type="button" onClick={() => setMostrarFormPadrao(false)} className="text-[13px] font-medium text-zinc-500 hover:text-zinc-300 transition-colors flex items-center justify-center gap-2 mx-auto">
                       <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                       Retornar para {lastLogin.nome_usuario}
                     </button>
                   </div>
                )}
              </form>
            </div>
          )}
          
        </div>
        
        <div className="mt-12 text-center lg:text-left relative z-20 w-full max-w-[400px]">
          <p className="text-[11px] font-medium tracking-widest uppercase text-zinc-600">© {new Date().getFullYear()} AROX Core</p>
        </div>

      </div>
    </div>
  );
}