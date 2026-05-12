'use client';

import { 
  motion, 
  useScroll, 
  useSpring, 
  useTransform, 
  AnimatePresence 
} from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowRight, 
  BarChart3, 
  LayoutDashboard, 
  Award, 
  Smartphone, 
  ShieldCheck,
  ChefHat,
  ChevronRight,
  Zap,
  Activity,
  CreditCard,
  TrendingUp,
  Clock,
  CheckCircle2,
  Utensils
} from 'lucide-react';

export default function AroxPremiumLanding() {
  // Use window scroll to avoid ResizeObserver jitter loops on dynamic height containers
  const { scrollYProgress } = useScroll();
  
  const scaleProgress = useSpring(scrollYProgress, { 
    stiffness: 100, 
    damping: 30, 
    restDelta: 0.001 
  });

  return (
    <main className="bg-zinc-950 text-zinc-50 min-h-screen flex flex-col overflow-hidden selection:bg-violet-500/30 selection:text-white font-sans">
      <motion.div 
        className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-500 via-blue-500 to-emerald-500 z-[100] origin-left"
        style={{ scaleX: scaleProgress }}
      />

      <Navigation />
      <HeroSection />
      <SocialProofMetrics />
      <FeaturesStorytelling />
      <BentoGridSection />
      <CtaFooter />
    </main>
  );
}

function Navigation() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header 
      className={`fixed top-0 w-full px-8 md:px-12 py-6 flex justify-between items-center z-[60] transition-all duration-500 ${
        scrolled ? 'bg-zinc-950/80 backdrop-blur-xl border-b border-white/5 shadow-2xl shadow-black/50 py-4' : 'bg-transparent'
      }`}
    >
      <div className="flex items-center gap-4 group cursor-pointer">
        <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center font-bold text-lg shadow-[0_0_20px_rgba(124,58,237,0.3)] transition-transform duration-500 group-hover:scale-110">
          <div className="absolute inset-0 bg-white/20 rounded-lg blur-[2px] mix-blend-overlay"></div>
          <span className="relative z-10 text-white">A</span>
        </div>
        <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70">
          AROX
        </span>
      </div>
      
      <div className="flex items-center gap-8">
        <nav className="hidden md:flex gap-8 text-sm font-medium text-zinc-400">
          <Link href="#produto" className="hover:text-white transition-colors">Produto</Link>
          <Link href="#features" className="hover:text-white transition-colors">Ecossistema</Link>
          <Link href="#cases" className="hover:text-white transition-colors">Cases</Link>
        </nav>
        <div className="h-4 w-px bg-white/10 hidden md:block"></div>
        <Link 
          href="#demo"
          className="group relative inline-flex h-10 items-center justify-center overflow-hidden rounded-full bg-white px-8 font-medium text-zinc-950 transition-transform hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
        >
          <span className="absolute h-0 w-0 rounded-full bg-zinc-200 transition-all duration-300 ease-out group-hover:h-56 group-hover:w-56"></span>
          <span className="relative flex items-center gap-2 text-sm">
            Agendar Demo <ArrowRight className="w-4 h-4" />
          </span>
        </Link>
      </div>
    </header>
  );
}

function HeroSection() {
  const { scrollY } = useScroll();
  
  // Parallax effects to create the "slide behind" z-index illusion
  const yText = useTransform(scrollY, [0, 800], [0, 400]);
  const opacityText = useTransform(scrollY, [0, 500], [1, 0]);
  const scaleText = useTransform(scrollY, [0, 500], [1, 0.9]);

  const heroVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] } 
    }
  };

  return (
    <section className="relative min-h-[110vh] pt-48 pb-28 px-8 overflow-visible flex flex-col items-center justify-start">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-violet-600/15 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute top-40 right-1/4 w-[400px] h-[400px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Hero Content (Z-10) - Parallax down behind dashboard */}
      <motion.div 
        style={{ y: yText, opacity: opacityText, scale: scaleText }}
        variants={heroVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 flex flex-col items-center text-center max-w-5xl w-full mx-auto"
      >
        <motion.div variants={itemVariants} className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-zinc-900/80 border border-white/10 text-zinc-300 text-xs font-medium tracking-wide mb-10 backdrop-blur-md shadow-[0_0_20px_rgba(0,0,0,0.5)]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          AROX OS 2.0 Operante
          <ChevronRight className="w-3 h-3 text-zinc-500" />
        </motion.div>

        <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl lg:text-[6rem] font-bold tracking-tighter leading-[1.05] mb-8 text-white drop-shadow-2xl">
          O sistema operacional da <br className="hidden md:block" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-300 to-zinc-500">
            gastronomia de alta performance.
          </span>
        </motion.h1>

        <motion.p variants={itemVariants} className="max-w-2xl text-zinc-400 text-lg md:text-xl leading-relaxed mb-12 font-light">
          Muito além de um PDV. Orquestre comandas, faturamento em tempo real, delivery e a experiência do cliente em um único ecossistema hiper-responsivo.
        </motion.p>

        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center gap-6 w-full sm:w-auto">
          <Link href="#demo" className="group relative w-full sm:w-auto px-10 py-4 bg-white text-zinc-950 font-semibold rounded-full overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.15)]">
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-zinc-200/50 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
            <span className="relative flex items-center justify-center gap-2 text-base">
              Solicitar Acesso <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>
          <Link href="#tour" className="w-full sm:w-auto px-10 py-4 bg-zinc-900/80 border border-white/10 text-zinc-300 font-medium rounded-full hover:bg-zinc-800 hover:text-white transition-all backdrop-blur-md text-base flex items-center justify-center gap-2">
            Ver Tour Virtual
          </Link>
        </motion.div>
      </motion.div>

      {/* Dashboard Simulation (Z-30) - Overlaps and stays in front */}
      <motion.div
        initial={{ opacity: 0, y: 140, rotateX: 15, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
        transition={{ duration: 1.4, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{ perspective: "1200px" }}
        className="relative z-30 w-full max-w-6xl mx-auto mt-28 md:mt-32"
      >
        <ProductSimulation />
      </motion.div>
    </section>
  );
}

function ProductSimulation() {
  const [revenue, setRevenue] = useState(18420.50);
  const [activeOrders, setActiveOrders] = useState(42);
  const [orders, setOrders] = useState([
    { id: '1084', status: 'preparando', type: 'Mesa 12', items: 'T-Bone Steak, Vinho Tinto', total: 345.00, time: 'Agora', statusColor: 'text-amber-400', bg: 'bg-amber-400/10' },
    { id: '1083', status: 'novo', type: 'Delivery iFood', items: '2x Burger Artesanal, Fritas', total: 89.90, time: '1m atrás', statusColor: 'text-blue-400', bg: 'bg-blue-400/10' },
    { id: '1082', status: 'pronto', type: 'Mesa 04', items: 'Risoto de Funghi', total: 120.00, time: '4m atrás', statusColor: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  ]);

  // Realistic operation simulator
  useEffect(() => {
    const events = [
      { type: 'Balcão', items: 'Café Expresso, Água', val: 18.50 },
      { type: 'Mesa 08', items: 'Ceviche Clássico', val: 75.00 },
      { type: 'Delivery Rappi', items: 'Combo Sushi 40pc', val: 189.90 },
      { type: 'Mesa 22', items: 'Garrafa Chablis', val: 450.00 }
    ];

    let counter = 1085;

    const interval = setInterval(() => {
      const isNewOrder = Math.random() > 0.4;
      
      if (isNewOrder) {
        const randomEvent = events[Math.floor(Math.random() * events.length)];
        const newTotal = randomEvent.val;
        
        setRevenue(prev => prev + newTotal);
        setActiveOrders(prev => prev + 1);
        
        setOrders(prev => {
          const newOrder = { 
            id: `${counter++}`, 
            status: 'novo', 
            type: randomEvent.type,
            items: randomEvent.items,
            total: newTotal, 
            time: 'Agora',
            statusColor: 'text-blue-400',
            bg: 'bg-blue-400/10'
          };
          return [newOrder, prev[0], prev[1]]; // Keep array size fixed to prevent layout shift
        });
      } else {
        // Just update time strings or simulate state changes
        setOrders(prev => {
          const updated = [...prev];
          if(updated[1].status === 'novo') {
            updated[1].status = 'preparando';
            updated[1].statusColor = 'text-amber-400';
            updated[1].bg = 'bg-amber-400/10';
          }
          return updated;
        });
      }
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full rounded-2xl border border-white/10 bg-zinc-950 shadow-[0_30px_100px_-20px_rgba(0,0,0,1)] overflow-hidden flex flex-col h-[600px] ring-1 ring-white/5">
      {/* App Header Bar */}
      <div className="h-12 bg-zinc-900/80 border-b border-white/5 flex items-center justify-between px-6 backdrop-blur-md z-10">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-zinc-700" />
          <div className="w-3 h-3 rounded-full bg-zinc-700" />
          <div className="w-3 h-3 rounded-full bg-zinc-700" />
        </div>
        <div className="flex items-center gap-4 text-xs font-medium text-zinc-500">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Sistema Online
          </div>
          <span>•</span>
          <span>Caixa Aberto (Operador: João M.)</span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-zinc-900/40 via-zinc-950 to-zinc-950">
        {/* Sidebar */}
        <div className="hidden md:flex w-64 border-r border-white/5 bg-zinc-950/50 p-6 flex-col gap-8">
          <div>
            <div className="text-xs font-semibold text-zinc-500 mb-4 tracking-wider uppercase">Operação</div>
            <div className="flex flex-col gap-2">
              <NavItem icon={<LayoutDashboard size={18} />} label="Visão Geral" active />
              <NavItem icon={<Utensils size={18} />} label="Salão & Mesas" />
              <NavItem icon={<Smartphone size={18} />} label="Delivery" badge="3" />
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-zinc-500 mb-4 tracking-wider uppercase">Gestão</div>
            <div className="flex flex-col gap-2">
              <NavItem icon={<ChefHat size={18} />} label="Cardápio" />
              <NavItem icon={<CreditCard size={18} />} label="Financeiro" />
              <NavItem icon={<BarChart3 size={18} />} label="Relatórios" />
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-8 flex flex-col gap-8 relative overflow-hidden">
          {/* Top Stats */}
          <div className="flex justify-between items-end">
            <div>
              <p className="text-zinc-400 text-sm mb-2 font-medium">Faturamento Bruto (Hoje)</p>
              <div className="text-5xl font-bold tracking-tight text-white flex items-center gap-4 drop-shadow-md">
                R$ {revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium">
                <TrendingUp size={16} />
                +14.5% vs. ontem
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <DashboardCard title="Ticket Médio" value="R$ 164,20" trend="+R$ 12,50" isPositive />
            <DashboardCard title="Comandas Abertas" value={activeOrders.toString()} trend="Capacidade: 85%" isNeutral />
            <DashboardCard title="Tempo Médio" value="18 min" trend="-2 min" isPositive />
          </div>

          {/* Live Orders Section */}
          <div className="flex-1 border border-white/5 bg-zinc-900/40 rounded-2xl flex flex-col shadow-inner backdrop-blur-xl">
            <div className="flex justify-between items-center p-6 border-b border-white/5 bg-white/[0.02]">
              <h4 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                <Activity size={16} className="text-violet-400" />
                Live Feed da Operação
              </h4>
              <button className="text-xs font-medium text-violet-400 hover:text-violet-300 transition-colors">
                Ver Todas
              </button>
            </div>
            
            <div className="flex-1 p-6 relative overflow-hidden">
              <div className="absolute top-6 left-6 right-6 bottom-6 flex flex-col gap-4">
                <AnimatePresence>
                  {orders.map((order, index) => (
                    <motion.div 
                      key={order.id}
                      initial={{ opacity: 0, y: -20, scale: 0.98 }}
                      animate={{ opacity: 1, y: index * 80, scale: 1 }} // Fixed spacing to prevent overlap
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute w-full h-[68px] flex justify-between items-center px-5 rounded-xl bg-zinc-800/40 border border-white/5 hover:bg-zinc-800/60 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-5">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-sm font-bold ${order.bg} ${order.statusColor}`}>
                          #{order.id.slice(-3)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-bold text-white">{order.type}</span>
                            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider px-2 py-0.5 rounded-full bg-white/5">
                              {order.status}
                            </span>
                          </div>
                          <div className="text-xs text-zinc-400 truncate max-w-[200px] sm:max-w-[300px]">{order.items}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-base font-bold text-white mb-1">R$ {order.total.toFixed(2)}</div>
                        <div className="text-xs text-zinc-500 flex items-center justify-end gap-1">
                          <Clock size={12} /> {order.time}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NavItem({ icon, label, active, badge }) {
  return (
    <div className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${active ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'}`}>
      <div className="flex items-center gap-3">
        {icon}
        <span className={`text-sm ${active ? 'font-medium' : ''}`}>{label}</span>
      </div>
      {badge && (
        <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
          {badge}
        </span>
      )}
    </div>
  );
}

function DashboardCard({ title, value, trend, isNeutral, isPositive = true }) {
  return (
    <div className="p-6 rounded-2xl border border-white/5 bg-zinc-900/50 backdrop-blur-sm flex flex-col gap-2 transition-transform hover:-translate-y-1 duration-300">
      <span className="text-sm text-zinc-400 font-medium">{title}</span>
      <div className="text-3xl font-bold text-zinc-100 mt-1">{value}</div>
      <div className={`text-sm font-semibold flex items-center gap-1 mt-2 ${isNeutral ? 'text-zinc-500' : isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
        {isPositive && !isNeutral && <TrendingUp size={14} />}
        {trend}
      </div>
    </div>
  );
}

function SocialProofMetrics() {
  return (
    <section className="py-24 border-y border-white/5 bg-zinc-950 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-900/5 to-transparent pointer-events-none" />
      <div className="max-w-7xl mx-auto px-8 md:px-12 grid grid-cols-2 md:grid-cols-4 gap-12 md:gap-8 divide-x divide-white/5 relative z-10">
        <MetricItem value="R$ 150M+" label="Transacionados em 2023" />
        <MetricItem value="0.05s" label="Latência de Sincronização" />
        <MetricItem value="99.99%" label="Uptime Garantido" />
        <MetricItem value="4.9/5" label="Avaliação nas Stores" />
      </div>
    </section>
  );
}

function MetricItem({ value, label }) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-4">
      <span className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-3 drop-shadow-md">{value}</span>
      <span className="text-sm md:text-base text-zinc-500 font-medium">{label}</span>
    </div>
  );
}

function FeaturesStorytelling() {
  return (
    <section id="features" className="py-40 px-8 md:px-12 overflow-hidden relative bg-zinc-950">
      <div className="max-w-7xl mx-auto">
        <div className="mb-32">
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-8 max-w-3xl leading-[1.1]">
            A ponte definitiva entre <br/> 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-blue-400 to-emerald-400">
              operação e experiência.
            </span>
          </h2>
          <p className="text-zinc-400 text-lg md:text-xl max-w-2xl leading-relaxed font-light">
            Nós não substituímos o seu caixa. Nós transformamos o seu estabelecimento em uma máquina de dados, previsibilidade e retenção de clientes.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <RevealWrapper>
            <div className="relative rounded-[2.5rem] overflow-hidden border border-white/5 bg-gradient-to-b from-zinc-900/80 to-zinc-950 aspect-square flex items-center justify-center group shadow-2xl">
              <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              
              {/* Phone Mockup */}
              <div className="relative w-[320px] h-[640px] bg-zinc-950 rounded-[50px] border-[12px] border-zinc-800 shadow-2xl overflow-hidden transform group-hover:scale-105 transition-transform duration-700 ease-[0.16,1,0.3,1] ring-1 ring-white/10">
                <div className="absolute top-0 inset-x-0 h-7 bg-zinc-800 rounded-b-3xl w-40 mx-auto z-20" />
                
                {/* Fake Mobile App UI */}
                <div className="flex flex-col h-full bg-zinc-950 relative z-10">
                  {/* Header */}
                  <div className="pt-14 pb-6 px-6 bg-zinc-900/80 backdrop-blur-md border-b border-white/5 flex justify-between items-center">
                    <div>
                      <div className="text-xs font-bold text-violet-400 tracking-wider uppercase mb-1">Mesa 14</div>
                      <div className="text-xl font-bold text-white">Menu Digital</div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-white">
                      <Utensils size={18} />
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="flex-1 p-6 space-y-6 overflow-hidden">
                    <div className="text-sm font-semibold text-zinc-400 mb-2">Mais Pedidos</div>
                    {[
                      { name: 'Burger Trufado', desc: 'Blend 180g, queijo brie, maionese', price: 'R$ 48,00', img: 'bg-orange-900/30' },
                      { name: 'Steak Frites', desc: 'Ancho grelhado com fritas da casa', price: 'R$ 89,00', img: 'bg-rose-900/30' },
                      { name: 'Gin Tônica', desc: 'Gin premium, tônica, limão siciliano', price: 'R$ 35,00', img: 'bg-blue-900/30' },
                    ].map((item, i) => (
                      <div key={i} className="flex gap-4 items-center group/item cursor-pointer">
                        <div className={`w-20 h-20 rounded-2xl ${item.img} flex-shrink-0 border border-white/5`} />
                        <div className="flex-1">
                          <div className="text-base font-bold text-zinc-200 group-hover/item:text-white transition-colors">{item.name}</div>
                          <div className="text-xs text-zinc-500 leading-snug mt-1 mb-2 line-clamp-2">{item.desc}</div>
                          <div className="text-sm font-bold text-emerald-400">{item.price}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Bottom Bar */}
                  <div className="p-6 bg-zinc-900/90 border-t border-white/5 backdrop-blur-md">
                    <div className="flex justify-between items-center mb-4 px-2">
                      <span className="text-sm text-zinc-400">Total da Mesa</span>
                      <span className="text-xl font-bold text-white">R$ 172,00</span>
                    </div>
                    <div className="h-14 bg-violet-600 hover:bg-violet-500 transition-colors cursor-pointer rounded-2xl flex items-center justify-center text-white font-bold text-base shadow-[0_10px_30px_rgba(124,58,237,0.4)]">
                      Fechar Conta
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </RevealWrapper>

          <RevealWrapper delay={0.2}>
            <div className="flex flex-col gap-12">
              <FeatureTextItem 
                icon={<Smartphone />} 
                title="Cardápio Digital Nativo" 
                desc="Esqueça integrações complexas. O cardápio digital lê o seu estoque em tempo real. Se acabou na cozinha, some do menu do cliente instantaneamente."
              />
              <FeatureTextItem 
                icon={<Award />} 
                title="Motor de Retenção (CRM)" 
                desc="Cada comanda gera inteligência. Crie programas de fidelidade invisíveis, onde o cliente acumula cashback sem precisar baixar nenhum aplicativo."
              />
              <FeatureTextItem 
                icon={<CreditCard />} 
                title="Faturamento Sem Atrito" 
                desc="Split inteligente, pagamento via PIX integrado à comanda e conciliação bancária automática. O fim do expediente focado em descanso, não planilhas."
              />
            </div>
          </RevealWrapper>
        </div>
      </div>
    </section>
  );
}

function FeatureTextItem({ icon, title, desc }) {
  return (
    <div className="flex gap-6 group">
      <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-400 group-hover:text-violet-400 group-hover:bg-violet-500/10 group-hover:border-violet-500/30 transition-all duration-500 shadow-lg">
        <div className="w-6 h-6">{icon}</div>
      </div>
      <div>
        <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-violet-100 transition-colors">{title}</h3>
        <p className="text-zinc-400 text-lg leading-relaxed font-light">{desc}</p>
      </div>
    </div>
  );
}

function BentoGridSection() {
  return (
    <section className="py-32 px-8 md:px-12 relative bg-zinc-950">
      <div className="absolute top-1/2 left-0 w-[800px] h-[800px] bg-emerald-600/5 blur-[200px] rounded-full pointer-events-none" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-20 max-w-3xl leading-[1.1]">
          Controle absoluto da operação. <br/>
          <span className="text-zinc-500 font-medium">Arquitetado para a escala.</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 auto-rows-[360px]">
          <SpotlightCard className="md:col-span-2 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-900/60 to-zinc-950/90 z-0" />
            <div className="relative z-10 flex flex-col h-full justify-between p-10">
              <div className="w-14 h-14 rounded-2xl bg-zinc-800/80 flex items-center justify-center text-zinc-300 border border-white/5 mb-6 shadow-inner">
                <Activity className="w-7 h-7 text-emerald-400" />
              </div>
              <div className="mt-auto">
                <h3 className="text-3xl font-bold mb-4 text-white">Sincronização Sub-segundo</h3>
                <p className="text-zinc-400 text-lg max-w-xl leading-relaxed font-light">
                  Arquitetura edge-first. Mesas, comandas e pedidos atualizados instantaneamente em todos os dispositivos da rede, garantindo zero gargalos no horário de pico.
                </p>
              </div>
            </div>
            {/* Abstract decorative graphic */}
            <div className="absolute right-10 top-1/2 -translate-y-1/2 w-[250px] h-[250px] opacity-20 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none flex items-center justify-center">
              <div className="absolute w-full h-full border border-emerald-500/30 rounded-full animate-ping [animation-duration:3s]" />
              <div className="absolute w-2/3 h-2/3 border border-emerald-500/40 rounded-full animate-ping [animation-duration:2s]" />
              <div className="w-1/3 h-1/3 bg-emerald-500/50 rounded-full blur-md" />
            </div>
          </SpotlightCard>

          <SpotlightCard className="relative overflow-hidden">
             <div className="relative z-10 flex flex-col h-full justify-between p-10">
              <div className="w-14 h-14 rounded-2xl bg-zinc-800/80 flex items-center justify-center text-zinc-300 border border-white/5 mb-6 shadow-inner">
                <BarChart3 className="w-7 h-7 text-blue-400" />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-3 text-white">Business Intelligence</h3>
                <p className="text-zinc-400 text-base leading-relaxed font-light">
                  Métricas de lucratividade, curva ABC de produtos e previsibilidade de demanda baseada no seu histórico.
                </p>
              </div>
            </div>
          </SpotlightCard>

          <SpotlightCard className="relative overflow-hidden">
             <div className="relative z-10 flex flex-col h-full justify-between p-10">
              <div className="w-14 h-14 rounded-2xl bg-zinc-800/80 flex items-center justify-center text-zinc-300 border border-white/5 mb-6 shadow-inner">
                <ChefHat className="w-7 h-7 text-amber-400" />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-3 text-white">Gestão de Catálogo</h3>
                <p className="text-zinc-400 text-base leading-relaxed font-light">
                  Controle centralizado de insumos, ficha técnica e regras dinâmicas de precificação em tempo real.
                </p>
              </div>
            </div>
          </SpotlightCard>

          <SpotlightCard className="md:col-span-2 relative overflow-hidden bg-white group">
             <div className="relative z-10 flex flex-col h-full justify-between p-10">
              <div className="w-14 h-14 rounded-2xl bg-zinc-100 flex items-center justify-center border border-black/5 mb-6 shadow-sm">
                <ShieldCheck className="w-7 h-7 text-zinc-900" />
              </div>
              <div className="mt-auto">
                <h3 className="text-3xl font-bold mb-4 text-zinc-950">Segurança Institucional</h3>
                <p className="text-zinc-600 text-lg max-w-xl leading-relaxed font-light">
                  Seus dados protegidos com padrão bancário. Criptografia end-to-end, conformidade nativa com a LGPD e controle de acesso granular para sua equipe.
                </p>
              </div>
            </div>
          </SpotlightCard>
        </div>
      </div>
    </section>
  );
}

function CtaFooter() {
  return (
    <footer className="relative border-t border-white/5 bg-zinc-950 overflow-hidden pt-40 pb-16 px-8 md:px-12">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1200px] h-[500px] bg-gradient-to-t from-violet-600/10 to-transparent blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <h2 className="text-5xl md:text-7xl font-bold tracking-tighter mb-8 leading-[1.1]">
          Pronto para elevar o padrão?
        </h2>
        <p className="text-zinc-400 text-xl md:text-2xl mb-14 max-w-3xl mx-auto font-light leading-relaxed">
          Junte-se à nova geração de estabelecimentos que usam o AROX para reduzir custos operacionais e escalar a experiência do cliente.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-6 mb-40">
          <Link 
            href="#demo"
            className="group inline-flex items-center justify-center gap-3 px-10 py-5 bg-white text-zinc-950 font-bold rounded-full hover:scale-105 transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)] text-lg"
          >
            Começar Agora
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link 
            href="#contato"
            className="inline-flex items-center justify-center px-10 py-5 bg-zinc-900 border border-white/10 text-white font-medium rounded-full hover:bg-zinc-800 transition-colors text-lg"
          >
            Falar com Especialista
          </Link>
        </div>

        <div className="border-t border-white/10 pt-10 flex flex-col md:flex-row justify-between items-center gap-6 text-sm font-medium text-zinc-500 tracking-wide">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-zinc-900 flex items-center justify-center text-white font-bold text-sm">A</div>
            <span>© 2026 AROX SYSTEMS INC.</span>
          </div>
          <div className="flex gap-8">
            <Link href="#" className="hover:text-zinc-400 transition-colors">Privacidade</Link>
            <Link href="#" className="hover:text-zinc-400 transition-colors">Termos</Link>
            <span className="text-zinc-700 hidden sm:inline">|</span>
            <span className="uppercase text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 block"></span> Status: Operacional
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

// Reusable animated wrapper for scroll reveals
function RevealWrapper({ children, delay = 0, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Premium bento grid card with spotlight hover effect
function SpotlightCard({ children, className = '' }) {
  const divRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e) => {
    if (!divRef.current || isFocused) return;
    const div = divRef.current;
    const rect = div.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleFocus = () => {
    setIsFocused(true);
    setOpacity(1);
  };

  const handleBlur = () => {
    setIsFocused(false);
    setOpacity(0);
  };

  const handleMouseEnter = () => setOpacity(1);
  const handleMouseLeave = () => setOpacity(0);

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative rounded-[2rem] border border-white/5 bg-zinc-900/40 overflow-hidden shadow-lg ${className}`}
    >
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-500 z-20"
        style={{
          opacity,
          background: `radial-gradient(800px circle at ${position.x}px ${position.y}px, rgba(255,255,255,.08), transparent 40%)`,
        }}
      />
      {children}
    </div>
  );
}