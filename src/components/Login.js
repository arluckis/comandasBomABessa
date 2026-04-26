'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

// Easing Cinematográfico (Regra Exata)
const EASE_PREMIUM = 'cubic-bezier(0.16, 1, 0.3, 1)';

const LoadingDots = ({ isLight }) => (
  <div className="flex items-center gap-1.5 justify-center h-full">
    {[0, 0.15, 0.3].map((delay, i) => (
      <div 
        key={i}
        className={`w-1.5 h-1.5 rounded-full ${isLight ? 'bg-zinc-900' : 'bg-white'}`}
        style={{ 
          animation: `pulse-premium 1s ${EASE_PREMIUM} infinite alternate`,
          animationDelay: `${delay}s`
        }}
      ></div>
    ))}
  </div>
);

const CheckIcon = ({ active }) => (
  <div className={`flex items-center justify-center w-3.5 h-3.5 rounded-full border transition-all duration-700 ease-[${EASE_PREMIUM}] ${active ? 'bg-zinc-900 border-zinc-900 dark:bg-white dark:border-white' : 'border-zinc-300 dark:border-zinc-700'}`}>
    <svg className={`w-2 h-2 transition-all duration-500 delay-100 ${active ? 'scale-100 opacity-100 text-white dark:text-black' : 'scale-0 opacity-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
    </svg>
  </div>
);

const PolicyModal = ({ isOpen, onClose, title, content, isLight }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12">
      <div className="absolute inset-0 backdrop-blur-[12px] bg-black/20 dark:bg-black/60 modal-backdrop" onClick={onClose} />
      <div 
        className={`relative w-full max-w-lg overflow-hidden rounded-[24px] shadow-2xl border modal-card ${isLight ? 'bg-white/90 backdrop-blur-3xl border-white/50' : 'bg-[#0a0a0a]/90 backdrop-blur-3xl border-white/[0.08]'}`}
      >
        <div className="p-8 border-b border-zinc-100 dark:border-white/5 flex justify-between items-center">
          <h3 className={`text-[11px] font-medium tracking-[0.2em] uppercase ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>{title}</h3>
          <button onClick={onClose} className="p-2 -mr-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className={`p-8 max-h-[60vh] overflow-y-auto text-[13.5px] leading-[1.8] antialiased font-light custom-scrollbar ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
          {content}
        </div>
      </div>
    </div>
  );
};

export default function Login({ getHoje, setSessao, setScenePhase, temaNoturno }) {
  const isLight = !temaNoturno;
  const [credenciais, setCredenciais] = useState({ email: '', senha: '' });
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [erro, setErro] = useState('');
  const [isShake, setIsShake] = useState(false);

  const [lastLogin, setLastLogin] = useState(null);
  const [mostrarFormPadrao, setMostrarFormPadrao] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const [stepTrocaSenha, setStepTrocaSenha] = useState(false);
  const [tempUser, setTempUser] = useState(null);
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState('');
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [modalContent, setModalContent] = useState({ open: false, title: '', text: null });

  // Parallax tracking
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const handleMouseMove = (e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 12; // max 6px shift
    const y = (e.clientY / window.innerHeight - 0.5) * 12;
    setMousePos({ x, y });
  };

  const policies = {
    privacidade: (
      <div className="space-y-6">
        <p>A arquitetura AROX opera sob protocolos AES-256. Dados operacionais e financeiros são processados em instâncias isoladas. A inteligência do seu negócio permanece estritamente privada.</p>
        <p>Não há compartilhamento de métricas. A telemetria coletada é convertida exclusivamente em estabilidade do sistema.</p>
      </div>
    ),
    termos: (
      <div className="space-y-6">
        <p>O acesso ao ecossistema AROX pressupõe operação em conformidade fiscal vigente. As credenciais master são de responsabilidade intransferível da administração local.</p>
        <p>Extração não autorizada e engenharia reversa do núcleo operacional resultarão em revogação imediata da licença.</p>
      </div>
    )
  };

  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem('arox_last_login');
    if (saved) {
      try { const parsed = JSON.parse(saved); if (parsed?.email) setLastLogin(parsed); else setMostrarFormPadrao(true); } 
      catch { setMostrarFormPadrao(true); }
    } else setMostrarFormPadrao(true);
  }, []);

  const triggerError = (msg) => {
    setErro(msg);
    setIsShake(true);
    setTimeout(() => setIsShake(false), 800);
    if(setScenePhase) setScenePhase('reveal');
  };

  const concluirAcesso = (data) => {
    const logoEmpresa = data.empresas?.logo_url || data.empresas?.logo || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
    const nomeEmpresa = data.empresas?.nome || (data.role === 'super_admin' ? 'Console Admin' : 'AROX');
    localStorage.setItem('arox_last_login', JSON.stringify({ email: data.email, senha: data.senha, nome_usuario: data.nome_usuario, nome_empresa: nomeEmpresa, logo: logoEmpresa }));
    const sessionObj = { ...data, data: getHoje ? getHoje() : new Date().toISOString() };
    delete sessionObj.empresas; 
    localStorage.setItem('bessa_session', JSON.stringify(sessionObj)); 
    if (data.role === 'super_admin') { window.location.href = '/admin'; return; }
    if (setSessao) setSessao(sessionObj);
  };

  const processarAutenticacao = async (emailBusca, senhaBusca) => {
    setLoadingLogin(true); setErro('');
    if(setScenePhase) setScenePhase('sync'); 

    const { data, error } = await supabase.from('usuarios').select('*, empresas ( ativo, nome, logo_url, validade_plano )').eq('email', emailBusca.trim()).eq('senha', senhaBusca).single();

    if (data && !error) { 
      if (data.role !== 'super_admin' && data.empresas) {
         const agora = new Date();
         const expirou = data.empresas.validade_plano ? new Date(data.empresas.validade_plano) < agora : false;
         if (data.empresas.ativo === false) return triggerError("Acesso restrito. Contate a administração.");
         if (expirou) return triggerError("Instância inativa. Regularize a assinatura.");
      }
      if (data.primeiro_login) { setTempUser(data); setStepTrocaSenha(true); setLoadingLogin(false); return; }
      concluirAcesso(data);
    } else { 
      triggerError("Credenciais não reconhecidas."); setLoadingLogin(false); 
    }
  };

  const handleLogin = (e) => { 
    e.preventDefault(); 
    if (!credenciais.email || !credenciais.senha) return triggerError("Preencha as credenciais."); 
    processarAutenticacao(credenciais.email, credenciais.senha); 
  };

  // Joia Digital: Estilos do Card baseados em materiais premium
  const cardMaterial = isLight 
    ? 'bg-white/60 backdrop-blur-[40px] border-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,1)]' 
    : 'bg-[#0a0a0a]/50 backdrop-blur-[40px] border-white/[0.08] shadow-[0_16px_48px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05)]';

  const inputMaterial = isLight
    ? 'bg-zinc-500/[0.04] border-black/5 hover:border-black/10 focus:bg-white focus:border-zinc-900 focus:shadow-[0_4px_12px_rgba(0,0,0,0.03)] text-zinc-900'
    : 'bg-white/[0.02] border-white/[0.06] hover:border-white/10 focus:bg-white/[0.04] focus:border-white/20 focus:shadow-[0_4px_12px_rgba(0,0,0,0.2)] text-white';

  if (!isMounted) return null;

  return (
    <main 
      onMouseMove={handleMouseMove}
      className={`min-h-[100dvh] w-full relative z-10 flex flex-col lg:flex-row overflow-hidden antialiased font-sans ${isLight ? 'selection:bg-zinc-900 selection:text-white' : 'selection:bg-white selection:text-black'}`}
    >
      {/* ATMOSFERA DO PLANETA (Preservação e Elevação) */}
      {/* O Planeta do layout pai continua existindo. Adicionamos lentes para interagir com ele */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Lente de Profundidade Clássica / Escura */}
        <div className={`absolute inset-0 transition-colors duration-1000 ${isLight ? 'bg-zinc-50/30' : 'bg-[#030303]/40'}`} />
        
        {/* Glow Respirando & Parallax Leve (max 6px) */}
        <div 
          className="absolute inset-0 planet-glow"
          style={{ 
            transform: `translate(${mousePos.x}px, ${mousePos.y}px) scale(1.02)`,
            background: isLight 
              ? 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.4) 0%, transparent 60%)'
              : 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.03) 0%, transparent 60%)'
          }}
        />
        {/* Vinheta Editorial (Oculta no mobile) */}
        <div className="hidden md:block absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(0,0,0,0.03)_100%)] dark:bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(0,0,0,0.6)_100%)]" />
      </div>

      {/* COLUNA ESQUERDA: HERO EDITORIAL */}
      <div className="w-full lg:w-[50%] flex flex-col justify-end lg:justify-center p-8 lg:p-24 relative z-20">
        <div className="hero-stagger">
          <div className="flex items-center gap-4 mb-10 hero-item">
            <div className={`h-[1px] w-6 ${isLight ? 'bg-zinc-300' : 'bg-white/20'}`}></div>
            <span className={`text-[10.5px] font-medium tracking-[0.25em] uppercase ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
              AROX Intelligence
            </span>
          </div>
          
          <h1 className={`text-[2.5rem] lg:text-[4.5rem] font-light leading-[1.05] tracking-[-0.03em] hero-item ${isLight ? 'text-zinc-900' : 'text-white'}`}>
            Controle <br/>
            <span className="font-semibold">estrutural.</span>
          </h1>
          
          <p className={`mt-8 text-[15px] lg:text-[17px] leading-[1.7] max-w-[400px] antialiased hero-item ${isLight ? 'text-zinc-600 font-light' : 'text-zinc-400 font-extralight'}`}>
            Governança financeira e precisão analítica. Autenticação exigida para acesso ao núcleo de operações.
          </p>

          <div className="mt-16 flex items-center gap-10 hero-item hidden lg:flex">
            <div>
              <p className={`text-[9.5px] font-semibold uppercase tracking-[0.2em] mb-2 ${isLight ? 'text-zinc-400' : 'text-zinc-500'}`}>Sessão</p>
              <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-200 text-[11px] font-medium tracking-wide">
                AES-256
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* COLUNA DIREITA: CARD JOIA DIGITAL */}
      <div className="w-full lg:w-[50%] flex flex-col justify-center items-center lg:items-start p-6 lg:p-20 relative z-20">
        
        <div className={`w-full max-w-[400px] rounded-[32px] p-10 border transition-all duration-[800ms] ease-[${EASE_PREMIUM}] card-entry ${cardMaterial} ${isShake ? 'animate-shake border-rose-500/50 shadow-[0_0_20px_rgba(225,29,72,0.1)]' : ''}`}>
          
          <div className="mb-10 card-content">
            <h2 className={`text-[20px] font-medium tracking-tight mb-2 ${isLight ? 'text-zinc-900' : 'text-zinc-100'}`}>
              {stepTrocaSenha ? 'Nova Credencial' : (!mostrarFormPadrao && lastLogin?.nome_usuario) ? `Bem-vindo, ${lastLogin.nome_usuario.split(' ')[0]}` : 'Identificação'}
            </h2>
            <p className={`text-[13px] font-light ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
              {stepTrocaSenha ? 'Configure sua chave mestra.' : 'Insira seus dados corporativos.'}
            </p>
          </div>

          <div className="relative overflow-hidden transition-all duration-500" style={{ height: mostrarFormPadrao || !lastLogin ? 'auto' : 'auto' }}>
            
            {/* VIEW: LOGIN PADRÃO */}
            {(mostrarFormPadrao || !lastLogin) && !stepTrocaSenha && (
              <form onSubmit={handleLogin} className="space-y-5 form-view">
                <div className="space-y-4">
                  <div className="group relative">
                    <input 
                      type="email" 
                      placeholder=" "
                      className={`peer w-full px-5 pb-3 pt-6 rounded-2xl outline-none border transition-all duration-300 text-[14px] font-medium ${inputMaterial} ${erro ? 'border-rose-500/40 focus:border-rose-500' : ''}`}
                      value={credenciais.email}
                      onChange={e => setCredenciais({...credenciais, email: e.target.value})}
                    />
                    <label className={`absolute left-5 top-4 text-[11px] font-medium tracking-wide transition-all duration-300 ease-[${EASE_PREMIUM}] peer-focus:-translate-y-2 peer-focus:scale-[0.85] peer-focus:text-zinc-900 dark:peer-focus:text-white ${credenciais.email ? '-translate-y-2 scale-[0.85]' : ''} ${isLight ? 'text-zinc-500' : 'text-zinc-500'}`}>
                      Email Corporativo
                    </label>
                  </div>

                  <div className="group relative">
                    <input 
                      type="password" 
                      placeholder=" "
                      className={`peer w-full px-5 pb-3 pt-6 rounded-2xl outline-none border transition-all duration-300 text-[14px] font-medium ${inputMaterial} ${erro ? 'border-rose-500/40 focus:border-rose-500' : ''}`}
                      value={credenciais.senha}
                      onChange={e => setCredenciais({...credenciais, senha: e.target.value})}
                    />
                    <label className={`absolute left-5 top-4 text-[11px] font-medium tracking-wide transition-all duration-300 ease-[${EASE_PREMIUM}] peer-focus:-translate-y-2 peer-focus:scale-[0.85] peer-focus:text-zinc-900 dark:peer-focus:text-white ${credenciais.senha ? '-translate-y-2 scale-[0.85]' : ''} ${isLight ? 'text-zinc-500' : 'text-zinc-500'}`}>
                      Chave Mestra
                    </label>
                  </div>
                </div>

                {erro && (
                  <div className="text-rose-500 text-[11px] font-medium px-2 py-1 animate-fade-rise flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                    {erro}
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={loadingLogin}
                  className={`w-full h-[52px] mt-2 rounded-2xl text-[11px] font-semibold uppercase tracking-[0.15em] transition-all duration-300 ease-[${EASE_PREMIUM}] active:scale-[0.985] flex items-center justify-center relative overflow-hidden ${isLight ? 'bg-zinc-900 text-white hover:bg-black hover:shadow-[0_8px_20px_rgba(0,0,0,0.12)] hover:-translate-y-[1px]' : 'bg-white text-black hover:bg-zinc-100 hover:shadow-[0_8px_24px_rgba(255,255,255,0.15)] hover:-translate-y-[1px]'}`}
                >
                  <span className={`transition-opacity duration-300 ${loadingLogin ? 'opacity-0' : 'opacity-100'}`}>Autenticar</span>
                  <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${loadingLogin ? 'opacity-100' : 'opacity-0'}`}>
                    <LoadingDots isLight={isLight} />
                  </div>
                </button>

                {lastLogin && (
                  <div className="pt-2">
                    <button 
                      type="button" 
                      onClick={() => setMostrarFormPadrao(false)}
                      className={`text-[11px] font-medium tracking-wide transition-colors ${isLight ? 'text-zinc-400 hover:text-zinc-900' : 'text-zinc-500 hover:text-zinc-200'}`}
                    >
                      &larr; Retornar à sessão ativa
                    </button>
                  </div>
                )}
              </form>
            )}

            {/* VIEW: CONTA SALVA */}
            {(!mostrarFormPadrao && lastLogin) && !stepTrocaSenha && (
              <div className="space-y-6 form-view">
                <div className={`p-5 rounded-[20px] border flex items-center gap-4 transition-all duration-300 hover:shadow-sm ${isLight ? 'bg-white/60 border-black/5 hover:border-black/10' : 'bg-black/20 border-white/5 hover:border-white/10'}`}>
                  <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/10 bg-zinc-900/50">
                    <img src={lastLogin.logo} alt="Org" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-[13px] font-medium truncate ${isLight ? 'text-zinc-900' : 'text-zinc-100'}`}>{lastLogin.nome_usuario}</h4>
                    <p className={`text-[11px] font-light truncate mt-0.5 ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>{lastLogin.nome_empresa}</p>
                  </div>
                </div>

                {erro && (
                  <div className="text-rose-500 text-[11px] font-medium px-2 animate-fade-rise flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>{erro}
                  </div>
                )}

                <div className="space-y-3">
                  <button 
                    onClick={() => processarAutenticacao(lastLogin.email, lastLogin.senha)} 
                    disabled={loadingLogin}
                    className={`w-full h-[52px] rounded-2xl text-[11px] font-semibold uppercase tracking-[0.15em] transition-all duration-300 ease-[${EASE_PREMIUM}] active:scale-[0.985] flex items-center justify-center relative ${isLight ? 'bg-zinc-900 text-white hover:bg-black hover:shadow-[0_8px_20px_rgba(0,0,0,0.12)] hover:-translate-y-[1px]' : 'bg-white text-black hover:bg-zinc-100 hover:shadow-[0_8px_24px_rgba(255,255,255,0.15)] hover:-translate-y-[1px]'}`}
                  >
                    <span className={`transition-opacity duration-300 ${loadingLogin ? 'opacity-0' : 'opacity-100'}`}>Acessar Instância</span>
                    <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${loadingLogin ? 'opacity-100' : 'opacity-0'}`}><LoadingDots isLight={isLight} /></div>
                  </button>
                  <button 
                    onClick={() => setMostrarFormPadrao(true)}
                    className={`w-full h-[52px] rounded-2xl text-[11px] font-medium tracking-wide border transition-all duration-300 ${isLight ? 'border-zinc-200 text-zinc-600 hover:bg-zinc-50' : 'border-white/[0.06] text-zinc-400 hover:bg-white/[0.03] hover:text-white'}`}
                  >
                    Utilizar outra credencial
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-10 flex justify-between items-center border-t border-zinc-200/50 dark:border-white/[0.06] pt-6 card-content">
            <span className={`text-[10px] font-medium tracking-[0.1em] ${isLight ? 'text-zinc-400' : 'text-zinc-600'}`}>AROX © 2026</span>
            <div className="flex gap-5">
              <button onClick={() => setModalContent({ open: true, title: 'Termos de Serviço', text: policies.termos })} className={`text-[10px] font-medium transition-colors ${isLight ? 'text-zinc-500 hover:text-zinc-900' : 'text-zinc-500 hover:text-zinc-300'}`}>Termos</button>
              <button onClick={() => setModalContent({ open: true, title: 'Privacidade', text: policies.privacidade })} className={`text-[10px] font-medium transition-colors ${isLight ? 'text-zinc-500 hover:text-zinc-900' : 'text-zinc-500 hover:text-zinc-300'}`}>Privacidade</button>
            </div>
          </div>
        </div>
      </div>

      <PolicyModal isOpen={modalContent.open} title={modalContent.title} content={modalContent.text} onClose={() => setModalContent({ ...modalContent, open: false })} isLight={isLight} />

      <style jsx global>{`
        /* --- Motions Core --- */
        @keyframes fadeRise {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shakePremium {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-4px); }
          40% { transform: translateX(4px); }
          60% { transform: translateX(-2px); }
          80% { transform: translateX(2px); }
        }
        @keyframes pulse-premium {
          0% { transform: scale(0.8); opacity: 0.3; }
          100% { transform: scale(1); opacity: 1; }
        }
        
        /* --- Animações de Entrada (Stagger) --- */
        .hero-item {
          animation: fadeRise 1.2s cubic-bezier(0.16, 1, 0.3, 1) both;
          filter: blur(6px);
          animation-name: heroEntry;
        }
        @keyframes heroEntry {
          from { opacity: 0; transform: translateY(18px); filter: blur(6px); }
          to { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        .hero-stagger > *:nth-child(1) { animation-delay: 0.1s; }
        .hero-stagger > *:nth-child(2) { animation-delay: 0.25s; }
        .hero-stagger > *:nth-child(3) { animation-delay: 0.4s; }
        .hero-stagger > *:nth-child(4) { animation-delay: 0.55s; }

        .card-entry {
          animation: cardEntry 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both;
        }
        @keyframes cardEntry {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* --- Fundo e Planeta --- */
        .planet-glow {
          animation: planetDrift 8s ease-in-out infinite alternate, glowPulse 6s ease-in-out infinite alternate;
        }
        @keyframes planetDrift {
          from { transform: translateY(-1%) scale(1.02); }
          to { transform: translateY(1%) scale(1.02); }
        }
        @keyframes glowPulse {
          from { opacity: 0.8; }
          to { opacity: 1; }
        }

        /* --- Transições de View --- */
        .form-view { animation: formCrossfade 0.3s cubic-bezier(0.16, 1, 0.3, 1) both; }
        @keyframes formCrossfade {
          from { opacity: 0; transform: translateX(8px); }
          to { opacity: 1; transform: translateX(0); }
        }

        /* --- Modais --- */
        .modal-backdrop { animation: fadeIn 0.2s ease-out; }
        .modal-card { animation: modalRise 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes modalRise {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* --- Utilitários --- */
        .animate-shake { animation: shakePremium 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-fade-rise { animation: fadeRise 0.3s cubic-bezier(0.16, 1, 0.3, 1) both; }
        
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(150,150,150,0.2); border-radius: 10px; }
      `}</style>
    </main>
  );
}