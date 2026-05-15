'use client';

import React, { 
  useState, 
  useEffect, 
  memo,
  useRef
} from 'react';
import { 
  motion, 
  useScroll, 
  useTransform, 
  useMotionValueEvent,
  useSpring,
  useInView,
  AnimatePresence
} from 'framer-motion';
import { 
  ArrowRight, 
  Shield,
  Activity,
  Maximize,
  Crosshair,
  Lock,
  ChevronRight,
  TrendingUp,
  Map as MapIcon,
  CheckCircle2
} from 'lucide-react';

// ==========================================
// UTILS: CINEMATIC SCROLL (APPLE/AWWWARDS FEEL)
// ==========================================
const cinematicSmoothScroll = (e, targetId) => {
  e.preventDefault();
  const target = document.getElementById(targetId);
  if (!target) return;
  
  const startPosition = window.scrollY;
  const targetPosition = target.getBoundingClientRect().top + window.scrollY;
  const distance = targetPosition - startPosition;
  let startTime = null;

  // Curva EaseInOutCubic para peso e inércia física
  const animation = (currentTime) => {
    if (startTime === null) startTime = currentTime;
    const timeElapsed = currentTime - startTime;
    const progress = Math.min(timeElapsed / 1200, 1); // 1.2s de duração
    const ease = progress < 0.5 
      ? 4 * progress * progress * progress 
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      
    window.scrollTo(0, startPosition + distance * ease);
    if (timeElapsed < 1200) requestAnimationFrame(animation);
  };
  requestAnimationFrame(animation);
};

const cinematicEasing = [0.16, 1, 0.3, 1];
const smoothSpring = { stiffness: 40, damping: 20, mass: 1 };

export default function AroxEnterpriseOS() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  
  const [scenePhase, setScenePhase] = useState('ignition');

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (latest < 0.15) setScenePhase('ignition');
    else if (latest < 0.4) setScenePhase('reveal');
    else if (latest < 0.7) setScenePhase('sync');
    else setScenePhase('handoff');
  });

  return (
    <div 
      ref={containerRef}
      className="relative bg-[#030406] text-zinc-200 min-h-screen flex flex-col overflow-x-hidden selection:bg-white selection:text-black font-sans"
      style={{ WebkitFontSmoothing: 'antialiased' }}
    >
      {/* Scroll Snapping Magnético Global Injetado */}
      <style dangerouslySetInnerHTML={{__html: `
        html {
          scroll-snap-type: y proximity;
          scroll-padding-top: 100px;
        }
        section {
          scroll-snap-align: start;
        }
      `}} />

      <FilmGrain />
      <CinematicHeader />
      
      <div className="fixed inset-0 z-0 pointer-events-none">
        <AroxCinematicScene scenePhase={scenePhase} temaAnterior="dark" />
      </div>

      <main className="relative z-10 flex flex-col w-full">
        <HeroSection />
        <OperationalDensitySection />
        <MenuIntelligenceSection />
        <PrivateOnboarding />
      </main>

      <MinimalFooter />
    </div>
  );
}

// ==========================================
// CORE & UTILS
// ==========================================

const FilmGrain = memo(() => (
  <div 
    className="pointer-events-none fixed inset-0 z-[100] h-full w-full opacity-[0.04] mix-blend-overlay"
    style={{ 
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` 
    }}
  />
));
FilmGrain.displayName = 'FilmGrain';

const CinematicHeader = memo(() => {
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() ?? 0;
    setHidden(latest > previous && latest > 150);
    setIsScrolled(latest > 50);
  });

  return (
    <motion.header
      variants={{ visible: { y: 0, opacity: 1 }, hidden: { y: "-100%", opacity: 0 } }}
      animate={hidden ? "hidden" : "visible"}
      transition={{ duration: 0.8, ease: cinematicEasing }}
      className={`fixed top-0 left-0 right-0 z-[90] transition-colors duration-1000 ${
        isScrolled ? 'bg-[#030406]/60 backdrop-blur-3xl border-b border-white/[0.02]' : 'bg-transparent'
      }`}
    >
      <div className="max-w-[1600px] mx-auto px-8 py-5 flex items-center justify-between">
        <div 
          className="flex items-center gap-1 cursor-pointer group"
          onClick={(e) => cinematicSmoothScroll(e, 'hero')}
        >
          <span className="text-xl font-medium tracking-[0.25em] text-white group-hover:opacity-70 transition-opacity">
            AROX
          </span>
        </div>
        
        <nav className="hidden md:flex items-center gap-12 text-[10px] font-medium tracking-[0.2em] uppercase text-zinc-500">
          {['Ecossistema', 'Inteligência', 'Infraestrutura'].map((item) => {
            const sectionId = item.toLowerCase();
            return (
              <a 
                key={item} 
                href={`#${sectionId}`} 
                onClick={(e) => cinematicSmoothScroll(e, sectionId)}
                className="hover:text-white transition-colors duration-500"
              >
                {item}
              </a>
            );
          })}
        </nav>

        <a 
          href="#infraestrutura"
          onClick={(e) => cinematicSmoothScroll(e, 'infraestrutura')}
          className="relative overflow-hidden group px-6 py-2 border border-white/[0.1] rounded-full text-[10px] font-semibold tracking-widest uppercase text-white hover:border-white/[0.3] transition-all duration-500"
        >
          <span className="relative z-10 group-hover:text-black transition-colors duration-500">Iniciar Transição</span>
          <div className="absolute inset-0 bg-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]" />
        </a>
      </div>
    </motion.header>
  );
});
CinematicHeader.displayName = 'CinematicHeader';

// ==========================================
// HERO SECTION
// ==========================================

function HeroSection() {
  const { scrollYProgress } = useScroll();
  const smoothY = useSpring(useTransform(scrollYProgress, [0, 0.3], [0, 150]), smoothSpring);
  const opacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const blur = useTransform(scrollYProgress, [0, 0.15], ["blur(0px)", "blur(20px)"]);

  return (
    <section id="hero" className="relative h-[110vh] flex flex-col items-center justify-center pt-20 overflow-visible pointer-events-none">
      <motion.div 
        style={{ y: smoothY, opacity, filter: blur }}
        className="relative z-10 flex flex-col items-center text-center px-6 max-w-6xl mx-auto mt-[-10vh]"
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, ease: cinematicEasing }}
          className="flex items-center gap-4 px-5 py-2.5 border border-white/[0.08] rounded-full bg-white/[0.02] backdrop-blur-xl mb-14"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          <span className="text-[9px] font-medium tracking-[0.3em] uppercase text-zinc-300">
            Engine Operacional Nível Tier-1
          </span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.8, ease: cinematicEasing, delay: 0.1 }}
          className="text-5xl md:text-7xl lg:text-[7rem] font-medium tracking-tight text-white leading-[1.02] mb-12 will-change-transform"
        >
          O padrão invisível <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-b from-zinc-100 to-zinc-500">
            de operações bilionárias.
          </span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ duration: 2, ease: cinematicEasing, delay: 0.4 }}
          className="max-w-2xl text-lg md:text-xl text-zinc-400 font-light leading-relaxed tracking-wide mix-blend-plus-lighter"
        >
          Projetado em arquitetura paralela para altíssima volumetria. Unificamos salão, cozinha, fidelização e auditoria com precisão milimétrica e latência rigorosamente zero.
        </motion.p>
      </motion.div>
    </section>
  );
}

// ==========================================
// OPERATIONAL DENSITY 
// ==========================================

function OperationalDensitySection() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useSpring(useTransform(scrollYProgress, [0, 1], [100, -100]), smoothSpring);

  return (
    <section ref={ref} id="ecossistema" className="relative py-40 z-20">
      <div className="max-w-[1600px] mx-auto px-8">
        <motion.div 
          initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }} transition={{ duration: 1.4, ease: cinematicEasing }}
          className="flex flex-col md:flex-row justify-between items-end mb-24 gap-10"
        >
          <div className="max-w-3xl">
            <h2 className="text-3xl md:text-5xl font-medium tracking-tight text-white mb-6">
              Densidade Operacional.
            </h2>
            <p className="text-zinc-500 text-lg font-light leading-relaxed">
              Enquanto sistemas comuns travam no pico de movimento, a AROX respira. Processamento assíncrono em múltiplas camadas garante que uma alteração no salão seja refletida no KDS (Kitchen Display System) em frações de segundo.
            </p>
          </div>
          <div className="flex gap-8 text-[10px] tracking-[0.2em] uppercase font-medium text-zinc-600">
            <span className="flex items-center gap-2"><Activity size={12}/> Zero Downtime</span>
            <span className="flex items-center gap-2"><Lock size={12}/> Auditoria Real-time</span>
          </div>
        </motion.div>

        <motion.div style={{ y }} className="relative w-full aspect-[16/9] md:aspect-[21/9] bg-[#050608] border border-white/[0.05] rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/[0.02]">
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
          
          <div className="h-12 border-b border-white/[0.05] flex items-center justify-between px-6 bg-[#030406]/80 backdrop-blur-md">
            <div className="flex items-center gap-4">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-zinc-800" /><div className="w-2 h-2 rounded-full bg-zinc-800" /><div className="w-2 h-2 rounded-full bg-zinc-800" />
              </div>
              <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono">AROX_EXEC_DASHBOARD</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-2 text-[10px] tracking-widest uppercase text-emerald-500 font-mono">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"/> Sync: 4ms
              </span>
            </div>
          </div>

          <div className="p-8 grid grid-cols-12 gap-8 h-[calc(100%-3rem)]">
            <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
              <div className="text-[10px] uppercase tracking-widest text-zinc-600 font-semibold mb-2">Pipeline de Produção</div>
              <div className="flex-1 overflow-hidden relative mask-image-b">
                <MassiveDataPipeline />
              </div>
            </div>

            <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
              <div className="grid grid-cols-3 gap-4">
                <MetricCard title="Gross Volume (Live)" value="R$ 142.890" trend="+14.2%" />
                <MetricCard title="Tempo Médio KDS" value="12m 40s" trend="-2m 10s" good />
                <MetricCard title="Mesas Ocupadas" value="94%" trend="Pico" />
              </div>
              
              <div className="flex-1 bg-[#020202] border border-white/[0.03] rounded-xl relative overflow-hidden flex items-center justify-center group">
                <MapIcon className="absolute text-white/[0.02] w-64 h-64" />
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-black/40 backdrop-blur-sm">
                  <Maximize className="text-white/50 w-8 h-8" />
                  <span className="text-[10px] uppercase tracking-widest text-white/50">Simulação de Heatmap Espacial</span>
                </div>
                <div className="absolute top-[30%] left-[20%] w-32 h-32 bg-orange-500/10 blur-3xl rounded-full" />
                <div className="absolute top-[50%] right-[30%] w-40 h-40 bg-emerald-500/10 blur-3xl rounded-full" />
                <div className="absolute bottom-[20%] left-[40%] w-24 h-24 bg-blue-500/10 blur-3xl rounded-full" />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function MetricCard({ title, value, trend, good = true }) {
  return (
    <div className="bg-[#020202] border border-white/[0.03] p-5 rounded-xl flex flex-col gap-3">
      <div className="text-[10px] uppercase tracking-widest text-zinc-600">{title}</div>
      <div className="text-2xl font-medium text-white tracking-tight">{value}</div>
      <div className={`text-[10px] font-mono ${good ? 'text-emerald-500/70' : 'text-zinc-500'}`}>{trend} vs ontem</div>
    </div>
  );
}

const MassiveDataPipeline = memo(() => {
  return (
    <div className="flex flex-col gap-3 relative font-mono text-xs w-full h-full pb-10">
      <div className="absolute top-0 bottom-0 left-[11px] w-px bg-gradient-to-b from-white/[0.1] to-transparent z-0" />
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scrollUp {
          0% { transform: translateY(100%); opacity: 0; }
          10% { transform: translateY(0); opacity: 1; }
          90% { transform: translateY(-200%); opacity: 0.3; }
          100% { transform: translateY(-250%); opacity: 0; }
        }
        .log-item { animation: scrollUp 8s linear infinite; will-change: transform, opacity; opacity: 0; position: absolute; width: 100%; }
        .log-1 { animation-delay: 0s; } .log-2 { animation-delay: 2s; }
        .log-3 { animation-delay: 4s; } .log-4 { animation-delay: 6s; }
      `}} />
      {[
        { id: 'T-849', action: 'ORDER_SYNC', mesa: 'M24', time: '0.04ms' },
        { id: 'T-850', action: 'PAYMENT_AUTH', mesa: 'M12', time: '0.12ms' },
        { id: 'T-851', action: 'KDS_DISPATCH', mesa: 'M04', time: '0.01ms' },
        { id: 'T-852', action: 'STOCK_UPDATE', mesa: 'SYS', time: '0.08ms' }
      ].map((log, i) => (
        <div key={i} className={`log-item log-${i+1} flex items-start gap-4 z-10`}>
          <div className="w-6 h-6 rounded-full bg-[#050608] border border-white/[0.1] flex items-center justify-center shrink-0 mt-0.5">
            <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full" />
          </div>
          <div className="flex-1 bg-white/[0.01] border border-white/[0.03] p-3 rounded-lg flex flex-col gap-2 backdrop-blur-sm">
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-zinc-300">{log.action}</span>
              <span className="text-zinc-600">{log.time}</span>
            </div>
            <div className="flex justify-between items-center text-[10px] text-zinc-500">
              <span>{log.id}</span>
              <span>{log.mesa}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});
MassiveDataPipeline.displayName = 'MassiveDataPipeline';

// ==========================================
// DIGITAL MENU INTELLIGENCE
// ==========================================

function MenuIntelligenceSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} id="inteligencia" className="relative py-40 z-20 border-t border-white/[0.02]">
      <div className="max-w-[1600px] mx-auto px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
          
          <motion.div 
            initial={{ opacity: 0, x: -40 }} animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 1.4, ease: cinematicEasing }}
            className="flex flex-col gap-12 order-2 lg:order-1"
          >
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Crosshair className="text-white/40 w-5 h-5" />
                <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-semibold">Cardápio Inteligente</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-medium tracking-tight text-white mb-6 leading-tight">
                Não é um PDF.<br />É predição de consumo.
              </h2>
              <p className="text-zinc-500 text-lg font-light leading-relaxed">
                Esqueça catálogos estáticos. O Cardápio Digital da AROX atua como um sommelier silencioso. Ele analisa o histórico do cliente, calcula itens de maior margem no momento, e sugere upsells estrategicamente formulados para elevar o Ticket Médio sem atrito.
              </p>
            </div>

            <div className="flex flex-col gap-6">
              {[
                "Recomendação Dinâmica baseada no clima e histórico",
                "Analytics de rejeição (onde o cliente abandonou a tela)",
                "Campanhas automáticas para recuperação de inativos",
                "Testes A/B nativos para fotografia e copy de pratos"
              ].map((feat, i) => (
                <div key={i} className="flex items-center gap-4 border-b border-white/[0.03] pb-6">
                  <div className="w-1 h-1 bg-white/40 rounded-full" />
                  <span className="text-zinc-400 font-light text-sm tracking-wide">{feat}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95, rotateY: 10 }} animate={isInView ? { opacity: 1, scale: 1, rotateY: 0 } : {}}
            transition={{ duration: 1.8, ease: cinematicEasing }}
            style={{ perspective: 1000 }}
            className="order-1 lg:order-2 relative aspect-[4/5] rounded-3xl overflow-hidden group"
          >
            <div className="absolute inset-0 bg-[#0A0A0C] border border-white/[0.05] rounded-3xl z-0" />
            
            <div className="absolute inset-4 rounded-2xl bg-gradient-to-br from-zinc-900 to-[#020202] border border-white/[0.02] overflow-hidden z-10 flex flex-col">
              <div className="h-2/3 bg-[url('https://images.unsplash.com/photo-1544025162-878f895c8986?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-40 mix-blend-luminosity transition-all duration-1000 group-hover:scale-105 group-hover:opacity-60" />
              <div className="h-1/3 bg-black flex flex-col justify-center px-8 relative">
                <div className="absolute -top-6 right-8 w-12 h-12 bg-white text-black rounded-full flex items-center justify-center font-bold tracking-tighter">98%</div>
                <h3 className="text-white text-xl font-medium tracking-wide mb-1">Wagyu A5 Striploin</h3>
                <p className="text-zinc-500 text-xs font-light tracking-widest uppercase mb-4">Taxa de Conversão após View</p>
                
                <div className="w-full h-1 bg-white/[0.05] rounded-full overflow-hidden">
                  <div className="w-[98%] h-full bg-gradient-to-r from-zinc-500 to-white" />
                </div>
              </div>
            </div>

            <div className="absolute top-12 -left-6 z-20 bg-[#050608]/90 backdrop-blur-xl border border-white/[0.05] p-4 rounded-xl shadow-2xl flex items-center gap-4">
              <TrendingUp className="text-white/60 w-5 h-5" />
              <div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Ticket Médio</div>
                <div className="text-white font-medium">+24.5%</div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}

// ==========================================
// PRIVATE ONBOARDING (FUNCIONAL)
// ==========================================

function PrivateOnboarding() {
  const [focusedField, setFocusedField] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | loading | success

  const handleSubmit = (e) => {
    e.preventDefault();
    setStatus('loading');
    
    // Mock de requisição com delay realista para feedback visual
    setTimeout(() => {
      setStatus('success');
    }, 2000);
  };

  return (
    <section id="infraestrutura" className="relative py-40 z-20 bg-black min-h-screen flex items-center justify-center">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.02)_0%,rgba(0,0,0,1)_60%)] pointer-events-none" />
      
      <div className="max-w-[800px] w-full px-8 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 1.2, ease: cinematicEasing }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-medium tracking-tight text-white mb-6">
            Inicie a transição.
          </h2>
          <p className="text-zinc-500 text-lg font-light">
            O acesso à arquitetura AROX requer alinhamento técnico prévio.<br/>Detalhe sua operação abaixo para acionarmos nossa diretoria.
          </p>
        </motion.div>

        <div className="relative bg-[#030406] border border-white/[0.05] rounded-3xl p-1 shadow-2xl">
          <AnimatePresence mode="wait">
            {status === 'success' ? (
              <motion.div 
                key="success-state"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#050608] rounded-[22px] p-8 md:p-12 border border-transparent min-h-[400px] flex flex-col items-center justify-center text-center"
              >
                <div className="w-16 h-16 bg-white/[0.02] border border-white/[0.05] rounded-full flex items-center justify-center mb-6">
                  <Shield className="text-white w-8 h-8" />
                </div>
                <h3 className="text-2xl font-medium text-white mb-3">Protocolo Executivo Iniciado</h3>
                <p className="text-zinc-500 font-light max-w-md">
                  Sua requisição de arquitetura foi registrada em nosso pipeline seguro. Nossa diretoria técnica analisará seu perfil operacional e retornará o contato em breve.
                </p>
              </motion.div>
            ) : (
              <motion.form 
                key="form-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onSubmit={handleSubmit}
                className="bg-[#050608] rounded-[22px] p-8 md:p-12"
              >
                <div className="flex flex-col gap-8">
                  <PremiumInput 
                    id="name" label="Nome do Responsável Executivo" required
                    isFocused={focusedField === 'name'} 
                    onFocus={() => setFocusedField('name')} onBlur={() => setFocusedField(null)}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <PremiumInput 
                      id="email" label="E-mail Corporativo" type="email" required
                      isFocused={focusedField === 'email'} 
                      onFocus={() => setFocusedField('email')} onBlur={() => setFocusedField(null)}
                    />
                    <PremiumInput 
                      id="phone" label="Telefone de Contato" type="tel" required
                      isFocused={focusedField === 'phone'} 
                      onFocus={() => setFocusedField('phone')} onBlur={() => setFocusedField(null)}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="flex flex-col gap-3 relative">
                      <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold">Volume Mensal (Faturamento)</label>
                      <select required className="w-full bg-transparent border-b border-white/[0.1] pb-3 text-white outline-none appearance-none cursor-pointer focus:border-white transition-colors text-sm rounded-none">
                        <option value="" className="bg-black text-zinc-500">Selecione...</option>
                        <option value="1" className="bg-black">Até R$ 100k</option>
                        <option value="2" className="bg-black">R$ 100k - R$ 500k</option>
                        <option value="3" className="bg-black">Acima de R$ 500k</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-3 relative">
                      <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold">Desafio Operacional Principal</label>
                      <select required className="w-full bg-transparent border-b border-white/[0.1] pb-3 text-white outline-none appearance-none cursor-pointer focus:border-white transition-colors text-sm rounded-none">
                        <option value="" className="bg-black text-zinc-500">Selecione...</option>
                        <option value="sync" className="bg-black">Lentidão e Quedas de Sistema</option>
                        <option value="data" className="bg-black">Falta de Dados Confiáveis</option>
                        <option value="scale" className="bg-black">Dificuldade de Escalar/Franquear</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="mt-16 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-white/[0.05] pt-8">
                  <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest text-zinc-600">
                    <Shield size={14} /> Transmissão Criptografada P2P
                  </div>
                  <button 
                    type="submit"
                    disabled={status === 'loading'}
                    className="group w-full md:w-auto flex items-center justify-center gap-4 bg-white text-black px-8 py-4 rounded-full text-xs font-bold tracking-widest uppercase hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {status === 'loading' ? 'Processando...' : 'Solicitar Diretoria'} 
                    {status !== 'loading' && (
                      <span className="w-6 h-6 rounded-full bg-black flex items-center justify-center group-hover:translate-x-1 transition-transform">
                        <ChevronRight size={12} className="text-white" />
                      </span>
                    )}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

function PremiumInput({ id, label, type = "text", required, isFocused, onFocus, onBlur }) {
  const [val, setVal] = useState('');
  
  return (
    <div className="relative flex flex-col">
      <label 
        htmlFor={id}
        className={`absolute left-0 transition-all duration-300 font-medium tracking-wide ${
          isFocused || val ? '-top-5 text-[10px] text-zinc-400 uppercase tracking-widest' : 'top-0 text-sm text-zinc-600'
        }`}
      >
        {label}
      </label>
      <input 
        id={id} type={type} required={required}
        onFocus={onFocus} onBlur={onBlur}
        onChange={(e) => setVal(e.target.value)} value={val}
        className="w-full bg-transparent border-b border-white/[0.1] pb-3 pt-1 text-white text-base outline-none focus:border-white transition-colors rounded-none"
      />
      <div className={`absolute bottom-0 left-0 h-px bg-white transition-all duration-500 ${isFocused ? 'w-full' : 'w-0'}`} />
    </div>
  );
}

// ==========================================
// FOOTER (FUNCIONAL E MAPEADO)
// ==========================================

function MinimalFooter() {
  return (
    <footer className="relative z-20 bg-black border-t border-white/[0.05] pt-24 pb-12 px-8">
      <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-start gap-16">
        <div>
          <span 
            className="text-2xl font-medium tracking-[0.25em] text-white block mb-4 cursor-pointer"
            onClick={(e) => cinematicSmoothScroll(e, 'hero')}
          >
            AROX
          </span>
          <p className="text-xs text-zinc-600 font-light max-w-xs leading-relaxed">
            A infraestrutura silenciosa desenhada para padronizar e escalar as maiores operações gastronômicas.
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-16 text-xs text-zinc-600">
          <div className="flex flex-col gap-4">
            <span className="text-[10px] uppercase tracking-widest text-white/50 mb-2">Produto</span>
            <a href="#ecossistema" onClick={(e) => cinematicSmoothScroll(e, 'ecossistema')} className="hover:text-white transition-colors">Sistema Operacional</a>
            <a href="#inteligencia" onClick={(e) => cinematicSmoothScroll(e, 'inteligencia')} className="hover:text-white transition-colors">Cardápio de Alta Conversão</a>
            <a href="#ecossistema" onClick={(e) => cinematicSmoothScroll(e, 'ecossistema')} className="hover:text-white transition-colors">KDS de Baixa Latência</a>
          </div>
          <div className="flex flex-col gap-4">
            <span className="text-[10px] uppercase tracking-widest text-white/50 mb-2">Corporativo</span>
            <a href="#hero" onClick={(e) => cinematicSmoothScroll(e, 'hero')} className="hover:text-white transition-colors">A Empresa</a>
            <a href="#infraestrutura" onClick={(e) => cinematicSmoothScroll(e, 'infraestrutura')} className="hover:text-white transition-colors">Segurança & Auditoria</a>
            <a href="#infraestrutura" onClick={(e) => cinematicSmoothScroll(e, 'infraestrutura')} className="hover:text-white transition-colors">Contato Executivo</a>
          </div>
        </div>
      </div>
      <div className="max-w-[1600px] mx-auto mt-32 text-[10px] text-zinc-700 font-mono flex flex-col md:flex-row justify-between items-center gap-4 border-t border-white/[0.02] pt-8">
        <span>© 2026 AROX SYSTEMS. TODOS OS DIREITOS RESERVADOS.</span>
        <button 
          onClick={(e) => cinematicSmoothScroll(e, 'hero')}
          className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer"
        >
          <span className="w-1.5 h-1.5 bg-zinc-700 rounded-full"></span>
          VOLTAR AO TOPO
        </button>
      </div>
    </footer>
  );
}

// ==========================================
// CÓDIGO REFERENCIAL INTOCADO DO PLANETA
// (Injetado para funcionamento autônomo do arquivo)
// ==========================================

export function AroxCinematicScene({
  scenePhase = 'ignition', 
  customConfig = null,
  temaAnterior = 'dark',
  children
}) {
  const [isClient, setIsClient] = useState(false);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const requestRef = useRef();
  const [isMobile, setIsMobile] = useState(false);

  const isLight = temaAnterior === 'light';

  useEffect(() => {
    setIsClient(true);
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const phaseConfig = {
    ignition:    { light: 0.00, rotation: -2,   planetY: isMobile ? -240 : 60, scale: isMobile ? 0.90 : 0.85, blur: 0,   overlay: 0 },
    reveal:      { light: 0.02, rotation: -1.5, planetY: isMobile ? -260 : 40, scale: isMobile ? 0.95 : 0.90, blur: 0,   overlay: 0 },
    sync:        { light: 0.10, rotation: 0.0,  planetY: isMobile ? -280 : 15, scale: isMobile ? 1.05 : 0.98, blur: isMobile ? 0 : 2, overlay: isMobile ? 0 : 0.05 },
    handoff:     { light: 0.30, rotation: 1.5,  planetY: isMobile ? -200 : -10, scale: 1.00, blur: 4,   overlay: 0.15 },
    bridgeLight: { light: 150.0, rotation: 1.5, planetY: isMobile ? -200 : -10, scale: 1.00, blur: 12,  overlay: 1 }, 
    bridgeDark:  { light: 0.00,  rotation: 1.5, planetY: isMobile ? -200 : -10, scale: 1.00, blur: 16,  overlay: 1 } 
  };

  const activeConfig = customConfig || phaseConfig[scenePhase] || phaseConfig.ignition;

  const physics = useRef({
    mouseX: 0, targetMouseX: 0, 
    mouseY: 0, targetMouseY: 0,
    light: activeConfig.light, targetLight: activeConfig.light, 
    rotation: activeConfig.rotation, targetRotation: activeConfig.rotation, 
    planetY: activeConfig.planetY, targetPlanetY: activeConfig.planetY,
    scale: activeConfig.scale, targetScale: activeConfig.scale
  });

  useEffect(() => {
    physics.current.targetLight = activeConfig.light;
    physics.current.targetRotation = activeConfig.rotation;
    physics.current.targetPlanetY = activeConfig.planetY;
    physics.current.targetScale = activeConfig.scale;
  }, [activeConfig]);

  useEffect(() => {
    if (!isClient) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
    let width = window.innerWidth; 
    let height = window.innerHeight;
    canvas.width = width; 
    canvas.height = height;

    const PI2 = Math.PI * 2; 
    const baseCount = isMobile ? 200 : 800;
    const particleCount = isLight ? Math.floor(baseCount * 0.25) : baseCount;

    const particles = Array.from({ length: particleCount }).map(() => ({ 
      x: (Math.random() - 0.5) * 6000, 
      y: (Math.random() - 0.5) * 6000,
      baseZ: Math.random() * 2000 + 500, 
      size: isLight ? (Math.random() * 1.5 + 0.5) : (Math.random() * 0.8 + 0.1), 
      alphaMult: Math.random() * 0.5 + 0.1, 
      twinkle: !isLight && Math.random() > 0.5, 
      timeOffset: Math.random() * PI2,
      hasHalo: !isLight && Math.random() > 0.9
    }));

    const lerp = (start, end, f) => start + (end - start) * f;
    const fov = 1000;

    const handleMouseMove = (e) => {
      if (scenePhase === 'bridgeLight' || scenePhase === 'bridgeDark') return;
      physics.current.targetMouseX = (e.clientX / width - 0.5) * 0.4;
      physics.current.targetMouseY = (e.clientY / height - 0.5) * 0.4;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('resize', () => {
      width = window.innerWidth; height = window.innerHeight;
      canvas.width = width; canvas.height = height;
    }, { passive: true });

    let time = 0;

    const render = () => {
      time += 0.01; 
      const p = physics.current;
      const isBridge = scenePhase === 'bridgeLight' || scenePhase === 'bridgeDark' || activeConfig.overlay === 1;
      
      p.scale = lerp(p.scale, p.targetScale, 0.02);
      p.rotation = lerp(p.rotation, p.targetRotation, 0.02);
      p.planetY = lerp(p.planetY, p.targetPlanetY, 0.02);
      p.mouseX = lerp(p.mouseX, isBridge ? 0 : p.targetMouseX, 0.04);
      p.mouseY = lerp(p.mouseY, isBridge ? 0 : p.targetMouseY, 0.04);

      let speedLight = 0.02;
      if (isBridge && isLight) {
        const progress = Math.min(p.light / p.targetLight, 1);
        speedLight = 0.005 + (Math.pow(progress, 3) * 0.1); 
      }
      p.light = lerp(p.light, p.targetLight, speedLight);

      ctx.fillStyle = isLight ? '#fdfdfd' : '#030406';
      ctx.fillRect(0, 0, width, height);

      if (isLight) {
        const gradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width * 0.8);
        gradient.addColorStop(0, 'rgba(255,255,255,0)');
        gradient.addColorStop(1, 'rgba(240,244,248,0.8)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
      }

      const cx = width / 2; 
      const cy = (height / 2) + p.planetY; 
      const dimFactor = Math.max(0, 1 - (p.light * (isLight ? 2.0 : 0.08))); 

      if (dimFactor > 0.01) {
        const currentScale = p.scale;
        const parallaxX = p.mouseX * 120;
        const parallaxY = p.mouseY * 120;

        for (let i = 0; i < particles.length; i++) {
          const pt = particles[i]; 
          const actualZ = pt.baseZ / currentScale; 
          const zRatio = fov / actualZ; 
          
          const px = (pt.x * zRatio) + cx - (parallaxX * zRatio); 
          const py = (pt.y * zRatio) + cy - (parallaxY * zRatio);
          const size = Math.max(0.1, pt.size * zRatio);

          if (px < -size || px > width + size || py < -size || py > height + size) continue;

          let currentAlpha = pt.alphaMult;
          if (pt.twinkle) currentAlpha *= (0.6 + Math.sin(time + pt.timeOffset) * 0.4);
          
          const alpha = Math.min(currentAlpha, (3000 - actualZ) / 1000); 
          
          if (alpha > 0) {
             ctx.fillStyle = isLight ? `rgba(148, 163, 184, ${alpha * dimFactor * 0.4})` : `rgba(220, 235, 255, ${alpha * dimFactor})`; 
             ctx.beginPath(); 
             ctx.arc(px, py, size, 0, PI2); 
             ctx.fill();

             if (pt.hasHalo) {
               ctx.fillStyle = `rgba(160, 200, 255, ${alpha * 0.25 * dimFactor})`;
               ctx.beginPath(); ctx.arc(px, py, size * 3, 0, PI2); ctx.fill();
             }
          }
        }
      }

      if (containerRef.current) {
        const lightProg = Math.min(p.light / 150.0, 1);
        containerRef.current.style.cssText = `
          --pr-mouse-x: ${p.mouseX}; --pr-mouse-y: ${p.mouseY};
          --pr-light: ${p.light}; --pr-light-prog: ${lightProg};
          --pr-rot: ${p.rotation}deg; --pr-planet-y: ${p.planetY}px; --pr-scale: ${p.scale};
        `;
      }
      
      requestRef.current = requestAnimationFrame(render);
    };

    render();
    return () => { window.removeEventListener('mousemove', handleMouseMove); cancelAnimationFrame(requestRef.current); };
  }, [isClient, scenePhase, temaAnterior]);

  if (!isClient) return null;

  const themeClass = isLight ? 'theme-light' : 'theme-dark';
  const overlayColor = isLight ? '253, 253, 253' : '3, 4, 6'; 
  const isExiting = activeConfig.overlay === 1;

  return (
    <div ref={containerRef} className={`fixed inset-0 w-full h-[100dvh] z-0 overflow-hidden font-sans select-none ${themeClass} ${isLight ? 'bg-[#fdfdfd]' : 'bg-[#030406]'}`}>
      
      <style dangerouslySetInnerHTML={{__html: `
        .cinematic-entry { animation: cinematicFadeIn 3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes cinematicFadeIn { 0% { opacity: 0; filter: blur(12px); } 100% { opacity: 1; filter: blur(0); } }

        .orbital-backlight {
          position: absolute; top: 50%; left: 50%;
          width: clamp(320px, 50vw, 600px); height: clamp(320px, 50vw, 600px);
          border-radius: 50%;
          transform: translate(-50%, -50%) translateY(var(--pr-planet-y, 0px)) scale(calc(1 + (var(--pr-light-prog) * 30))) translateZ(0);
          z-index: 0; pointer-events: none; mix-blend-mode: screen;
        }

        .arox-planet-system {
          position: absolute; top: 50%; left: 50%;
          width: clamp(320px, 50vw, 600px); height: clamp(320px, 50vw, 600px);
          pointer-events: none; z-index: 1;
          transform: translate(-50%, -50%) translateY(var(--pr-planet-y, 0px)) scale(var(--pr-scale, 1)) rotate(var(--pr-rot, 0deg)) translateZ(0);
        }

        .arox-planet {
          position: absolute; inset: 0; border-radius: 50%;
          transform: translate3d(calc(var(--pr-mouse-x, 0) * -20px), calc(var(--pr-mouse-y, 0) * -20px), 0);
          z-index: 20;
        }

        .arox-planet::after, .arox-planet::before { content: ''; position: absolute; inset: 0; border-radius: 50%; pointer-events: none; }

        .arox-ring-main {
          position: absolute; top: 50%; left: 50%; width: 120%; height: 120%; border-radius: 50%;
          transform: translate(-50%, -50%) translate3d(calc(var(--pr-mouse-x, 0) * -30px), calc(var(--pr-mouse-y, 0) * -30px), 0); 
          z-index: 10; border: 1px solid transparent;
        }
        .arox-ring-thin-group {
          position: absolute; top: 50%; left: 50%; width: 140%; height: 140%;
          transform: translate(-50%, -50%) translate3d(calc(var(--pr-mouse-x, 0) * -16px), calc(var(--pr-mouse-y, 0) * -16px), 0); z-index: 5;
        }
        .arox-ring-thin { position: absolute; top: 50%; left: 50%; border-radius: 50%; transform: translate(-50%, -50%); border: 1px solid transparent; }
        .arox-ring-thin:nth-child(1) { width: 100%; height: 100%; } .arox-ring-thin:nth-child(2) { width: 92%; height: 92%; }
        .arox-ring-thin:nth-child(3) { width: 84%; height: 84%; } .arox-ring-thin:nth-child(4) { width: 76%; height: 76%; }

        .arox-flare { position: absolute; width: 160px; height: 160px; z-index: 40; }
        .flare-bl { bottom: 10%; left: -2%; transform: translate3d(calc(var(--pr-mouse-x, 0) * -50px), calc(var(--pr-mouse-y, 0) * -50px), 0) rotate(20deg); }
        .flare-tr { top: 10%; right: -2%; transform: translate3d(calc(var(--pr-mouse-x, 0) * -50px), calc(var(--pr-mouse-y, 0) * -50px), 0) rotate(20deg); }
        .flare-core { position: absolute; top: 50%; left: 50%; width: 2px; height: 2px; border-radius: 50%; transform: translate(-50%, -50%); }
        .flare-beam { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); }
        .flare-beam.h { width: 80%; height: 1px; } .flare-beam.v { width: 80%; height: 1px; transform: translate(-50%, -50%) rotate(90deg); }
        .flare-beam.diag { width: 120%; height: 1px; transform: translate(-50%, -50%) rotate(30deg); }

        .theme-dark .orbital-backlight { background: radial-gradient(circle at center, rgba(160, 190, 255, 0.15) 0%, transparent 65%); opacity: calc(var(--pr-light, 0) * 0.8); }
        .theme-dark .arox-planet-system { opacity: calc(1 - (var(--pr-light-prog) * 1.5)); }
        .theme-dark .arox-planet { background: radial-gradient(circle at 50% 50%, #06080b 0%, #020304 60%, #000000 100%); box-shadow: inset 0 0 40px rgba(0,0,0,1); }
        .theme-dark .arox-planet::after { inset: -2px; background: radial-gradient(circle at 50% 50%, rgba(255,255,255,0) 30%, rgba(255,255,255,1) 80%); opacity: calc(var(--pr-light-prog) * 4); mix-blend-mode: screen; }
        .theme-dark .arox-planet::before { background: radial-gradient(circle at 50% 100%, rgba(255,255,255,calc(min(0.2, var(--pr-light, 0) * 0.015))) 0%, transparent 60%); z-index: 21; }
        .theme-dark .arox-ring-main { border-color: rgba(255, 255, 255, 0.20); } .theme-dark .arox-ring-thin { border-color: rgba(255, 255, 255, 0.04); }
        .theme-dark .arox-ring-thin:nth-child(1) { border-color: rgba(255, 255, 255, 0.06); }
        .theme-dark .flare-core { background: rgba(255, 255, 255, 0.9); box-shadow: 0 0 6px 1px rgba(255,255,255,0.4); }
        .theme-dark .flare-beam { background: radial-gradient(ellipse at center, rgba(255,255,255,0.5) 0%, transparent 60%); }
        .theme-dark .flare-beam.diag { opacity: 0.4; }
        .theme-dark .arox-ring-main, .theme-dark .arox-ring-thin-group, .theme-dark .arox-flare { opacity: calc(1 - (var(--pr-light-prog) * 12)); }
      `}} />

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      <div className="orbital-backlight"></div>

      <div className="arox-planet-system cinematic-entry">
         <div className="arox-ring-main"></div>
         <div className="arox-ring-thin-group">
            <div className="arox-ring-thin"></div>
            <div className="arox-ring-thin"></div>
            <div className="arox-ring-thin"></div>
            <div className="arox-ring-thin"></div>
         </div>
         <div className="arox-planet"></div>
         <div className="arox-flare flare-bl"><div className="flare-core"></div><div className="flare-beam h"></div><div className="flare-beam v"></div><div className="flare-beam diag"></div></div>
         <div className="arox-flare flare-tr"><div className="flare-core"></div><div className="flare-beam h"></div><div className="flare-beam v"></div><div className="flare-beam diag"></div></div>
      </div>

      <div 
        className={`absolute inset-0 z-[50] pointer-events-none transition-all ${isExiting ? 'duration-[800ms] ease-in' : 'duration-[2000ms] ease-[cubic-bezier(0.25,0.1,0.25,1)]'}`}
        style={{ backdropFilter: `blur(${activeConfig.blur}px)`, WebkitBackdropFilter: `blur(${activeConfig.blur}px)`, backgroundColor: `rgba(${overlayColor}, ${activeConfig.overlay})` }}
      />
      <div className="relative z-[20] w-full h-full">{children}</div>
    </div>
  );
}