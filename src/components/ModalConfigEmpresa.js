// ModalConfigEmpresa.jsx
'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import Cropper from 'react-easy-crop';
import { motion, AnimatePresence } from 'framer-motion';
import AdminProdutos from './AdminProdutos';
import AdminDelivery from './AdminDelivery';

// --- FUNÇÕES DE CROP DE IMAGEM ---
const createImage = (url) => new Promise((resolve, reject) => { const image = new Image(); image.addEventListener('load', () => resolve(image)); image.addEventListener('error', (error) => reject(error)); image.setAttribute('crossOrigin', 'anonymous'); image.src = url; });
async function getCroppedImg(imageSrc, pixelCrop) { const image = await createImage(imageSrc); const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d'); if (!ctx) return null; canvas.width = 300; canvas.height = 300; ctx.drawImage( image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, 300, 300 ); return new Promise((resolve) => { canvas.toBlob((file) => resolve(file), 'image/webp', 0.85); }); }
const CIDADES_POPULARES = ["Rio Branco, AC, BR", "Maceió, AL, BR", "Macapá, AP, BR", "Manaus, AM, BR", "Salvador, BA, BR", "Fortaleza, CE, BR", "Brasília, DF, BR", "Vitória, ES, BR", "Goiânia, GO, BR", "São Luís, MA, BR", "Cuiabá, MT, BR", "Campo Grande, MS, BR", "Belo Horizonte, MG, BR", "Belém, PA, BR", "João Pessoa, PB, BR", "Curitiba, PR, BR", "Recife, PE, BR", "Teresina, PI, BR", "Rio de Janeiro, RJ, BR", "Natal, RN, BR", "Parnamirim, RN, BR", "Porto Alegre, RS, BR", "Florianópolis, SC, BR", "São Paulo, SP, BR", "Aracaju, SE, BR", "Palmas, TO, BR"];

// --- UTILS DE FORMATAÇÃO (MÁSCARAS) ---
const formatarWhatsApp = (value) => {
  if (!value) return '';
  const num = value.replace(/\D/g, '').substring(0, 11);
  if (num.length === 0) return '';
  if (num.length <= 2) return `(${num}`;
  if (num.length <= 7) return `(${num.substring(0, 2)}) ${num.substring(2)}`;
  return `(${num.substring(0, 2)}) ${num.substring(2, 7)}-${num.substring(7, 11)}`;
};

const formatarCNPJ = (value) => {
  if (!value) return '';
  const num = value.replace(/\D/g, '').substring(0, 14);
  if (num.length === 0) return '';
  if (num.length <= 2) return num;
  if (num.length <= 5) return `${num.substring(0, 2)}.${num.substring(2)}`;
  if (num.length <= 8) return `${num.substring(0, 2)}.${num.substring(2, 5)}.${num.substring(5)}`;
  if (num.length <= 12) return `${num.substring(0, 2)}.${num.substring(2, 5)}.${num.substring(5, 8)}/${num.substring(8)}`;
  return `${num.substring(0, 2)}.${num.substring(2, 5)}.${num.substring(5, 8)}/${num.substring(8, 12)}-${num.substring(12, 14)}`;
};

const formatarInstagram = (value) => {
  if (!value) return '';
  let formatado = value.replace(/\s/g, ''); 
  if (formatado.startsWith('@')) formatado = formatado.substring(1); 
  return formatado;
};

const formatarEmail = (value) => {
  return value.trim().toLowerCase(); 
};


export default function ModalConfigEmpresa(props) {
  const { temaNoturno, sessao, setMostrarConfigEmpresa, nomeEmpresaEdicao, setNomeEmpresaEdicao, logoEmpresaEdicao, setLogoEmpresaEdicao, nomeUsuarioEdicao, setNomeUsuarioEdicao, planoUsuario, salvarConfigEmpresa, alterarSenhaConta } = props;

  const [abaPrincipal, setAbaPrincipal] = useState('geral'); 
  const [telefoneContato, setTelefoneContato] = useState(''); const [emailContato, setEmailContato] = useState(''); const [cnpj, setCnpj] = useState(''); const [instagram, setInstagram] = useState('');
  const [senhaAtual, setSenhaAtual] = useState(''); const [novaSenha, setNovaSenha] = useState(''); const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mostrarSenhas, setMostrarSenhas] = useState(false);
  const [localizacao, setLocalizacao] = useState(''); const [sugestoesLocalizacao, setSugestoesLocalizacao] = useState([]); const [mostrarSugestoes, setMostrarSugestoes] = useState(false);
  const [horarioAbertura, setHorarioAbertura] = useState(''); const [horarioFechamento, setHorarioFechamento] = useState('');
  const [isCarregandoOperacao, setIsCarregandoOperacao] = useState(true);
  const [temAlteracoes, setTemAlteracoes] = useState(false); const [isSalvando, setIsSalvando] = useState(false); const [estadoSalvamento, setEstadoSalvamento] = useState(''); 

  const fileInputRef = useRef(null); const [uploadError, setUploadError] = useState(''); const [imageToCrop, setImageToCrop] = useState(null); const [crop, setCrop] = useState({ x: 0, y: 0 }); const [zoom, setZoom] = useState(1); const [croppedAreaPixels, setCroppedAreaPixels] = useState(null); const [isProcessandoLogo, setIsProcessandoLogo] = useState(false);

  const ID_EMPRESA_REAL = sessao?.empresa_id;

  const progressoPerfil = Math.round(([nomeEmpresaEdicao, nomeUsuarioEdicao, logoEmpresaEdicao, telefoneContato, emailContato, cnpj, instagram, localizacao, horarioAbertura, horarioFechamento].filter(c => c && c.trim() !== '').length / 10) * 100);

  const registrarAlteracao = (setter, valor) => { setter(valor); if (!temAlteracoes) setTemAlteracoes(true); setEstadoSalvamento(''); };

  useEffect(() => {
    const buscarOperacao = async () => {
      try {
        if (!ID_EMPRESA_REAL) return;
        const { data, error } = await supabase.from('empresas').select('*').eq('id', ID_EMPRESA_REAL).single();
        if (data && !error) {
          setLocalizacao(data.localizacao || ''); setHorarioAbertura(data.horario_abertura ? data.horario_abertura.substring(0, 5) : '08:00'); setHorarioFechamento(data.horario_fechamento ? data.horario_fechamento.substring(0, 5) : '23:00');
          setTelefoneContato(formatarWhatsApp(data.telefone_contato || '')); 
          setEmailContato(data.email_contato || ''); 
          setCnpj(formatarCNPJ(data.cnpj || '')); 
          setInstagram(formatarInstagram(data.instagram || ''));
          setTimeout(() => setTemAlteracoes(false), 200); 
        }
      } catch (err) { } finally { setIsCarregandoOperacao(false); }
    };
    if (abaPrincipal === 'geral') buscarOperacao();
  }, [abaPrincipal, ID_EMPRESA_REAL]);

  const handleLocalizacaoChange = (e) => { const val = e.target.value; registrarAlteracao(setLocalizacao, val); if (val.trim().length > 1) { const match = CIDADES_POPULARES.filter(c => c.toLowerCase().includes(val.toLowerCase().trim())); setSugestoesLocalizacao(match.slice(0, 5)); setMostrarSugestoes(true); } else setMostrarSugestoes(false); };
  const selecionarSugestao = (sugestao) => { registrarAlteracao(setLocalizacao, sugestao); setMostrarSugestoes(false); };
  
  const handleFileChange = async (e) => { const file = e.target.files[0]; if (!file) return; if (!file.type.startsWith('image/')) { setUploadError('Use JPG ou PNG.'); return; } const reader = new FileReader(); reader.addEventListener('load', () => setImageToCrop(reader.result)); reader.readAsDataURL(file); e.target.value = ''; };
  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => setCroppedAreaPixels(croppedAreaPixels), []);

  const handleSaveCrop = async () => {
    setIsProcessandoLogo(true); setUploadError('');
    try {
      if (!ID_EMPRESA_REAL) throw new Error('ID ausente.');
      const croppedImageBlob = await getCroppedImg(imageToCrop, croppedAreaPixels);
      const fileName = `${ID_EMPRESA_REAL}-${Date.now()}.webp`;
      const { data, error } = await supabase.storage.from('logos').upload(fileName, croppedImageBlob);
      if (error) throw new Error("Erro de Storage.");
      const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(fileName);
      registrarAlteracao(setLogoEmpresaEdicao, publicUrl); setImageToCrop(null); 
    } catch (err) { setUploadError('Falha ao aplicar imagem.'); } finally { setIsProcessandoLogo(false); }
  };

  const handleSalvarGeral = async () => {
    setIsSalvando(true); setEstadoSalvamento('salvando');
    try {
      const dbTelefone = telefoneContato.replace(/\D/g, '');
      const dbCnpj = cnpj.replace(/\D/g, '');
      const dbEmail = emailContato.trim().toLowerCase();
      const dbInstagram = formatarInstagram(instagram);

      if (ID_EMPRESA_REAL) { 
        await supabase.from('empresas').update({ 
          localizacao, 
          horario_abertura: horarioAbertura, 
          horario_fechamento: horarioFechamento, 
          telefone_contato: dbTelefone, 
          email_contato: dbEmail, 
          cnpj: dbCnpj, 
          instagram: dbInstagram 
        }).eq('id', ID_EMPRESA_REAL); 
      }
      if(salvarConfigEmpresa) await salvarConfigEmpresa(); 
      setTemAlteracoes(false); setEstadoSalvamento('sucesso'); setTimeout(() => setEstadoSalvamento(''), 4000);
    } catch (err) { setEstadoSalvamento('erro'); setTimeout(() => setEstadoSalvamento(''), 4000); } finally { setIsSalvando(false); }
  };

  // --- DESIGN SYSTEM PREMIUM ---
  const isDark = temaNoturno;
  
  const bgMain = isDark ? 'bg-[#09090B]' : 'bg-[#FAFAFA]';
  const bgSidebar = isDark ? 'bg-[#09090B]/95 backdrop-blur-[20px]' : 'bg-[#FAFAFA]/95 backdrop-blur-[20px]';
  const textPrimary = isDark ? 'text-zinc-100' : 'text-zinc-900';
  const textSecondary = isDark ? 'text-zinc-400' : 'text-zinc-500';
  const borderSubtle = isDark ? 'border-white/5' : 'border-zinc-200/60';
  const borderSidebar = isDark ? 'border-white/[0.06]' : 'border-zinc-200/60';
  const borderFocus = isDark ? 'focus:border-zinc-500 focus:ring-zinc-500/20' : 'focus:border-zinc-400 focus:ring-zinc-400/20';
  const borderActive = isDark ? 'border-zinc-600' : 'border-zinc-400';
  
  const labelArox = `block text-[11px] font-semibold tracking-wide uppercase mb-1.5 ${textSecondary}`;
  const inputArox = `w-full h-10 px-3 rounded-lg border text-[13px] font-medium transition-colors outline-none bg-transparent ${borderSubtle} ${borderFocus} ${textPrimary} shadow-sm`;
  const btnPrimary = `h-10 px-4 rounded-lg text-[13px] font-semibold transition-colors shadow-sm active:scale-[0.98] flex items-center justify-center gap-2 ${isDark ? 'bg-zinc-100 text-zinc-900 hover:bg-white' : 'bg-zinc-900 text-white hover:bg-zinc-800'}`;
  const cardPanel = `p-6 sm:p-8 rounded-2xl border transition-all duration-300 ${isDark ? 'bg-[#121214] border-white/5 shadow-2xl' : 'bg-white border-zinc-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)]'} flex flex-col w-full relative`;
  
  const navItemClass = "relative w-full rounded-lg transition-all duration-[220ms] ease-[cubic-bezier(0.16,1,0.3,1)] flex items-center outline-none overflow-hidden py-3 px-3 gap-3 mb-1.5 group";
  const navItemActive = `${navItemClass} ${isDark ? 'bg-white/[0.08] text-white shadow-[0_1px_2px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.05)] ring-1 ring-white/[0.05]' : 'bg-white text-zinc-900 shadow-[0_1px_3px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,1)] ring-1 ring-zinc-200/50'}`;
  const navItemInactive = `${navItemClass} ${isDark ? 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100/60'}`;

  // --- REGRAS DE SENHA PREMIUM ---
  const regrasSenha = [
    { id: 'tamanho', label: 'Mín. 8 caracteres', valido: novaSenha.length >= 8 }, 
    { id: 'maiuscula', label: 'Letra maiúscula e minúscula', valido: /[a-z]/.test(novaSenha) && /[A-Z]/.test(novaSenha) }, 
    { id: 'numero', label: 'Pelo menos um número', valido: /[0-9]/.test(novaSenha) }
  ];
  const forcaSenha = Math.round((regrasSenha.filter(r => r.valido).length / regrasSenha.length) * 100);
  const senhaValida = forcaSenha === 100 && novaSenha === confirmarSenha && novaSenha.length > 0;
  
  const nomePlanoDisplay = planoUsuario?.nome ? (planoUsuario.nome.charAt(0).toUpperCase() + planoUsuario.nome.slice(1)) : 'Starter';
  const inicialEmpresa = nomeEmpresaEdicao ? nomeEmpresaEdicao.charAt(0).toUpperCase() : 'A';

  const formatarData = (dataString) => {
    if (!dataString) return '2024';
    const data = new Date(dataString);
    const dia = data.getDate();
    const mes = data.toLocaleString('pt-BR', { month: 'short' });
    const ano = data.getFullYear();
    return `${dia} ${mes} ${ano}`;
  };

  return (
    <div className={`fixed inset-0 z-[120] flex flex-col md:flex-row transition-opacity duration-300 animate-in fade-in ${bgMain}`}>
      
      {/* SIDEBAR LATERAL CONFIGURAÇÕES */}
      <aside className={`w-full md:w-[260px] lg:w-[288px] shrink-0 border-b md:border-b-0 md:border-r flex flex-col ${borderSidebar} ${bgSidebar}`}>
        
        {/* Cabeçalho */}
        <div className="h-[72px] px-5 flex items-center shrink-0 mb-2 mt-2 xl:mt-4">
             <span className={`font-bold tracking-[-0.04em] text-[18px] leading-none select-none flex items-center pr-3 bg-clip-text text-transparent ${isDark ? 'bg-gradient-to-b from-white to-zinc-400' : 'bg-gradient-to-b from-zinc-900 to-zinc-500'}`}>
                AROX
             </span>
             <button onClick={() => setMostrarConfigEmpresa(false)} className={`md:hidden ml-auto p-2 rounded-lg transition-colors active:scale-95 outline-none ${isDark ? 'hover:bg-white/10 text-zinc-400 hover:text-white' : 'hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900'}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
             </button>
         </div>

        {/* Área de Navegação */}
        <nav className="flex-1 px-4 xl:px-4 [&::-webkit-scrollbar]:hidden flex flex-col gap-1.5 pt-2 overflow-y-auto overflow-x-hidden">
          <p className={`px-3 text-[10px] font-semibold uppercase tracking-[0.15em] whitespace-nowrap mb-2 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
            Configurações
          </p>
          {[
            { id: 'geral', label: 'Visão Geral', icone: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /> },
            { id: 'catalogo', label: 'Cardápio & Preços', icone: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /> },
            { id: 'delivery', label: 'Zonas de Entrega', icone: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /> },
            { id: 'seguranca', label: 'Redefinição de Senha', icone: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /> },
          ].map(tab => (
            <button 
              key={tab.id} onClick={() => setAbaPrincipal(tab.id)}
              className={abaPrincipal === tab.id ? navItemActive : navItemInactive}
            >
              <span className={`shrink-0 transition-all duration-[220ms] flex items-center justify-center ${abaPrincipal === tab.id ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`}>
                <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">{tab.icone}</svg>
              </span>
              <span className="text-[14px] font-medium truncate whitespace-nowrap tracking-tight transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] w-auto opacity-100 ml-0.5">
                {tab.label}
              </span>
              {abaPrincipal === tab.id && (
                <span className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[18px] rounded-r-full shadow-[0_0_8px_rgba(255,255,255,0.4)] ${isDark ? 'bg-zinc-200' : 'bg-zinc-900'}`}></span>
              )}
            </button>
          ))}
        </nav>
        
        {/* RODAPÉ DA SIDEBAR */}
        <div className="mt-auto shrink-0 pb-4 xl:pb-6 pt-4 px-4 xl:px-4">
           
           <div className={`relative overflow-hidden rounded-2xl p-5 transition-all duration-500 group mb-3 ${isDark ? 'bg-gradient-to-br from-[#18181B] to-[#121214] border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] hover:border-white/20' : 'bg-gradient-to-br from-zinc-50 to-white border border-zinc-200/80 shadow-sm hover:border-zinc-300'}`}>
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/20 blur-[30px] rounded-full group-hover:bg-indigo-500/30 transition-colors duration-700 pointer-events-none"></div>

              <div className="relative z-10 flex flex-col gap-1">
                 <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${textSecondary}`}>Plano Atual</span>
                 <div className="flex items-center gap-2 mt-1">
                   <span className={`text-[22px] font-black tracking-tighter leading-none ${textPrimary}`}>{nomePlanoDisplay}</span>
                   <div className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest shadow-inner ${isDark ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/20' : 'bg-indigo-100 text-indigo-700 border border-indigo-200'}`}>
                     Ativo
                   </div>
                 </div>
              </div>

              <div className={`relative z-10 mt-5 pt-4 border-t ${borderSubtle} flex justify-between items-center`}>
                 <span className={`text-[10px] font-bold uppercase tracking-wider ${textSecondary}`}>Membro Desde</span>
                 <span className={`text-[11px] font-bold ${textPrimary}`}>{formatarData(planoUsuario?.criado_em)}</span>
              </div>
           </div>

           <button onClick={() => setMostrarConfigEmpresa(false)} className={`relative w-full rounded-lg transition-all duration-[220ms] ease-[cubic-bezier(0.16,1,0.3,1)] flex items-center outline-none overflow-hidden py-3 px-3 gap-3 group ${isDark ? 'text-zinc-500 hover:text-rose-400 hover:bg-white/[0.03]' : 'text-zinc-500 hover:text-rose-600 hover:bg-zinc-100/60'}`}>
             <span className="shrink-0 transition-all duration-[220ms] flex items-center justify-center opacity-70 group-hover:opacity-100 group-hover:text-rose-500">
               <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
             </span>
             <span className="text-[14px] font-medium truncate whitespace-nowrap tracking-tight transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] w-auto opacity-100 ml-0.5">
               Sair das Configurações
             </span>
           </button>
        </div>
      </aside>

      {/* ÁREA DE CONTEÚDO PRINCIPAL SCROLLÁVEL */}
      <main className="flex-1 overflow-y-auto w-full relative scrollbar-hide">
        
        {abaPrincipal === 'geral' && (
          <div className="max-w-[800px] mx-auto w-full px-5 sm:px-8 py-10 animate-in slide-in-from-bottom-4 fade-in duration-300 ease-out pb-32">
            <div className="flex flex-col gap-6 w-full">
              
              <div className="w-full mb-4">
                <div className="flex justify-between items-end mb-2.5">
                  <div>
                    <h3 className={`text-[24px] font-bold tracking-tight ${textPrimary}`}>Visão Geral</h3>
                    <p className={`text-[14px] font-medium mt-1 ${textSecondary}`}>Construa a identidade da sua operação.</p>
                  </div>
                  <span className={`text-[20px] font-bold tracking-tight ${progressoPerfil === 100 ? 'text-emerald-500' : textSecondary}`}>{progressoPerfil}%</span>
                </div>
                <div className={`w-full h-1.5 rounded-full overflow-hidden shadow-inner ${isDark ? 'bg-white/5' : 'bg-zinc-200'}`}>
                  <div className={`h-full transition-all duration-700 ease-out rounded-full ${progressoPerfil === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{ width: `${progressoPerfil}%` }}></div>
                </div>
              </div>

              {/* IDENTIDADE VISUAL */}
              <div className={cardPanel}>
                  <div className={`pb-3 mb-5 border-b ${borderSubtle}`}>
                    <h3 className={`text-[14px] font-semibold tracking-wide uppercase ${textPrimary}`}>Identidade Visual</h3>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-6 w-full items-start">
                    <div className="flex flex-col items-center gap-3 shrink-0">
                      <div className="relative group cursor-pointer">
                        <input type="file" accept="image/png, image/jpeg, image/webp" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                        <div onClick={() => fileInputRef.current?.click()} className={`w-28 h-28 rounded-2xl overflow-hidden flex items-center justify-center shadow-sm transition-all duration-300 relative border ${isDark ? 'bg-[#18181B] border-white/10 group-hover:border-zinc-500' : 'bg-zinc-50 border-zinc-200 group-hover:border-zinc-400'}`}>
                          {logoEmpresaEdicao ? (
                            <img src={logoEmpresaEdicao} alt="Logo" className="w-full h-full object-cover" />
                          ) : (
                            <span className={`text-4xl font-bold tracking-tighter opacity-30 ${textPrimary}`}>{inicialEmpresa}</span>
                          )}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center backdrop-blur-[2px] gap-1">
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 16V8a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11v6m0 0l-3-3m3 3l3-3M8 7h.01"/></svg>
                            <span className="text-white text-[10px] font-bold uppercase tracking-widest">Trocar</span>
                          </div>
                        </div>
                      </div>
                      {uploadError && <p className="text-[11px] text-rose-500 font-bold">{uploadError}</p>}
                    </div>

                    <div className="grid grid-cols-1 gap-5 w-full pt-1">
                      <div>
                        <label className={labelArox}>Nome da Marca</label>
                        <input type="text" value={nomeEmpresaEdicao} onChange={e => registrarAlteracao(setNomeEmpresaEdicao, e.target.value)} className={inputArox} />
                      </div>
                      <div>
                        <label className={labelArox}>Responsável Operacional</label>
                        <input type="text" value={nomeUsuarioEdicao} onChange={e => registrarAlteracao(setNomeUsuarioEdicao, e.target.value)} className={inputArox} />
                      </div>
                    </div>
                  </div>
              </div>

              {/* CONTATO PREMIUM - COM MOTION E FORMATADORES */}
              <div className={cardPanel}>
                  <div className={`pb-3 mb-5 border-b ${borderSubtle}`}>
                    <h3 className={`text-[14px] font-semibold tracking-wide uppercase ${textPrimary}`}>Canais Oficiais</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full">
                    {/* INPUT WHATSAPP */}
                    <div className="relative group">
                      <label className={labelArox}>WhatsApp</label>
                      <div className="relative flex items-center">
                        <input 
                          type="text" 
                          placeholder="(00) 00000-0000" 
                          value={telefoneContato} 
                          onChange={e => registrarAlteracao(setTelefoneContato, formatarWhatsApp(e.target.value))} 
                          className={`${inputArox} pl-10 focus:pl-10 transition-all duration-300`} 
                          maxLength={15}
                        />
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 opacity-80 group-focus-within:opacity-100 transition-opacity">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                        </div>
                        <AnimatePresence>
                          {telefoneContato.length === 15 && (
                             <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500">
                               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                             </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* INPUT EMAIL */}
                    <div className="relative group">
                      <label className={labelArox}>E-mail Comercial</label>
                      <div className="relative flex items-center">
                        <input 
                          type="email" 
                          placeholder="contato@empresa.com" 
                          value={emailContato} 
                          onChange={e => registrarAlteracao(setEmailContato, formatarEmail(e.target.value))} 
                          className={`${inputArox} pl-10 focus:pl-10 transition-all duration-300 lowercase`} 
                        />
                        <div className={`absolute left-3 top-1/2 -translate-y-1/2 transition-opacity ${isDark ? 'text-zinc-500 group-focus-within:text-zinc-300' : 'text-zinc-400 group-focus-within:text-zinc-600'}`}>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        </div>
                        <AnimatePresence>
                          {(emailContato.includes('@') && emailContato.includes('.')) && (
                             <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500">
                               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                             </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* INPUT CNPJ */}
                    <div className="relative group">
                      <label className={labelArox}>CNPJ</label>
                      <div className="relative flex items-center">
                         <input 
                            type="text" 
                            placeholder="00.000.000/0000-00" 
                            value={cnpj} 
                            onChange={e => registrarAlteracao(setCnpj, formatarCNPJ(e.target.value))} 
                            className={`${inputArox} font-mono tracking-tight transition-all duration-300`} 
                            maxLength={18}
                          />
                          <AnimatePresence>
                            {cnpj.length === 18 && (
                               <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500">
                                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                               </motion.div>
                            )}
                          </AnimatePresence>
                      </div>
                    </div>

                    {/* INPUT INSTAGRAM */}
                    <div className="relative group">
                      <label className={labelArox}>Instagram</label>
                      <div className="relative flex items-center">
                        <div className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors font-medium text-[14px] ${instagram ? (isDark ? 'text-zinc-300' : 'text-zinc-700') : (isDark ? 'text-zinc-600' : 'text-zinc-400')}`}>
                          @
                        </div>
                        <input 
                           type="text" 
                           placeholder="suamarca" 
                           value={instagram} 
                           onChange={e => registrarAlteracao(setInstagram, formatarInstagram(e.target.value))} 
                           className={`${inputArox} pl-7 focus:pl-7 transition-all duration-300`} 
                        />
                         <AnimatePresence>
                            {instagram.length > 2 && (
                               <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-500 opacity-70">
                                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                               </motion.div>
                            )}
                          </AnimatePresence>
                      </div>
                    </div>
                  </div>
              </div>

              {/* REGRAS */}
              <div className={cardPanel}>
                  <div className={`pb-3 mb-5 border-b ${borderSubtle}`}>
                    <h3 className={`text-[14px] font-semibold tracking-wide uppercase ${textPrimary}`}>Logística de Operação</h3>
                  </div>
                  
                  {isCarregandoOperacao ? (
                    <div className={`animate-pulse h-10 w-full rounded-xl ${isDark ? 'bg-white/5' : 'bg-zinc-100'}`}></div>
                  ) : (
                    <div className="flex flex-col gap-5 w-full">
                      <div className="w-full relative">
                        <label className={labelArox}>Cidade Base (Restrição de Busca Delivery)</label>
                        <input type="text" placeholder="Ex: Parnamirim, RN, BR" value={localizacao} onChange={handleLocalizacaoChange} onFocus={() => { if(localizacao.trim().length > 1) setMostrarSugestoes(true); }} onBlur={() => setTimeout(() => setMostrarSugestoes(false), 200)} className={inputArox} />
                        {mostrarSugestoes && sugestoesLocalizacao.length > 0 && (
                          <ul className={`absolute left-0 right-0 z-50 mt-2 py-1 rounded-xl border shadow-xl overflow-hidden max-h-48 overflow-y-auto scrollbar-hide backdrop-blur-xl ${isDark ? 'bg-[#18181B]/95 border-white/10' : 'bg-white/95 border-zinc-200'}`}>
                            {sugestoesLocalizacao.map((sugestao, idx) => (
                              <li key={idx} onClick={() => selecionarSugestao(sugestao)} className={`px-4 py-2.5 text-[13px] font-medium cursor-pointer transition-colors ${isDark ? 'text-zinc-300 hover:bg-white/5' : 'text-zinc-700 hover:bg-zinc-100'}`}>
                                {sugestao}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-5 w-full">
                        <div><label className={labelArox}>Abertura Automática</label><input type="time" value={horarioAbertura} onChange={e => registrarAlteracao(setHorarioAbertura, e.target.value)} className={inputArox} /></div>
                        <div><label className={labelArox}>Fechamento</label><input type="time" value={horarioFechamento} onChange={e => registrarAlteracao(setHorarioFechamento, e.target.value)} className={inputArox} /></div>
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </div>
        )}

        {/* MODAL DE CROP DE IMAGEM */}
        {imageToCrop && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300" onClick={() => setImageToCrop(null)}></div>
            <div className={`relative w-full max-w-sm flex flex-col rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 fade-in duration-200 ease-out border ${isDark ? 'bg-[#18181B] border-white/10' : 'bg-white border-zinc-200'}`}>
              <div className="relative w-full h-[300px] bg-black">
                <Cropper image={imageToCrop} crop={crop} zoom={zoom} aspect={1} cropShape="round" showGrid={false} onCropChange={setCrop} onCropComplete={onCropComplete} onZoomChange={setZoom} />
              </div>
              <div className="p-6 flex flex-col gap-5">
                <div>
                  <label className={`text-[11px] font-bold uppercase tracking-widest block mb-3 ${textSecondary}`}>Escala</label>
                  <input type="range" value={zoom} min={1} max={3} step={0.1} onChange={(e) => setZoom(e.target.value)} className="w-full accent-indigo-500 cursor-grab" />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setImageToCrop(null)} disabled={isProcessandoLogo} className={`flex-1 h-11 rounded-xl text-[13px] font-semibold border transition-all ${isDark ? 'bg-transparent border-white/10 text-white hover:bg-white/5' : 'bg-white border-zinc-200 text-zinc-900 hover:bg-zinc-50'}`}>Cancelar</button>
                  <button onClick={handleSaveCrop} disabled={isProcessandoLogo} className={`${btnPrimary} flex-1 h-11`}>
                    {isProcessandoLogo ? 'Salvando...' : 'Aplicar Imagem'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* REDEFINIÇÃO DE SENHA PREMIUM */}
        {abaPrincipal === 'seguranca' && (
           <div className="max-w-[800px] mx-auto w-full px-5 sm:px-8 py-10 animate-in fade-in duration-300 ease-out pb-32">
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h2 className={`text-[24px] font-bold tracking-tight ${textPrimary}`}>Redefinição de Senha</h2>
                  <p className={`text-[14px] mt-1.5 ${textSecondary}`}>Atualize a credencial mestra de acesso ao seu ambiente.</p>
                </div>
              </div>

              <div className={cardPanel}>
                  <div className={`pb-4 mb-6 border-b flex justify-between items-center ${borderSubtle}`}>
                    <h3 className={`text-[14px] font-semibold tracking-wide uppercase ${textPrimary}`}>Credenciais de Acesso</h3>
                    <button 
                      type="button" 
                      onClick={() => setMostrarSenhas(!mostrarSenhas)} 
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all outline-none border shadow-sm active:scale-95
                        ${isDark 
                          ? (mostrarSenhas ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-white/5 text-zinc-400 border-white/5 hover:text-white hover:bg-white/10') 
                          : (mostrarSenhas ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900')}`}
                    >
                      {mostrarSenhas ? (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0a10.05 10.05 0 015.71-1.583c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0l3.29 3.29" /></svg>
                          <span>Ocultar</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          <span>Revelar</span>
                        </>
                      )}
                    </button>
                  </div>
                  
                  <div className="flex flex-col gap-6 w-full">
                    <div>
                      <label className={labelArox}>Senha Atual</label>
                      <input type={mostrarSenhas ? "text" : "password"} value={senhaAtual} onChange={e => setSenhaAtual(e.target.value)} className={inputArox} />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="flex flex-col gap-2">
                        <label className={labelArox}>Nova Senha</label>
                        <input 
                           type={mostrarSenhas ? "text" : "password"} 
                           value={novaSenha} 
                           onChange={e => setNovaSenha(e.target.value)} 
                           className={`${inputArox} ${novaSenha.length > 0 && forcaSenha === 100 ? 'border-emerald-500/50 focus:border-emerald-500 focus:ring-emerald-500/20' : ''}`} 
                        />
                        
                        {/* BARRA DE PROGRESSO DE FORÇA DA SENHA COM MOTION */}
                        <div className="flex flex-col gap-1.5 mt-1">
                          <div className={`w-full h-1.5 rounded-full overflow-hidden shadow-inner ${isDark ? 'bg-white/5' : 'bg-zinc-200'}`}>
                            <motion.div 
                               initial={{ width: 0 }}
                               animate={{ width: `${forcaSenha}%` }}
                               transition={{ type: "spring", stiffness: 300, damping: 30 }}
                               className={`h-full rounded-full ${forcaSenha === 100 ? 'bg-emerald-500' : forcaSenha > 33 ? 'bg-amber-500' : 'bg-rose-500'}`}
                            />
                          </div>
                          <div className="flex flex-col gap-1 mt-1">
                             {regrasSenha.map(regra => (
                               <div key={regra.id} className="flex items-center gap-1.5">
                                 <motion.div 
                                    initial={false}
                                    animate={{ scale: regra.valido ? 1 : 0.8, opacity: regra.valido ? 1 : 0.5 }}
                                    className={`${regra.valido ? 'text-emerald-500' : (isDark ? 'text-zinc-600' : 'text-zinc-400')}`}
                                 >
                                    {regra.valido ? (
                                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                    ) : (
                                      <div className="w-3.5 h-3.5 rounded-full border-2 border-current flex items-center justify-center"></div>
                                    )}
                                 </motion.div>
                                 <span className={`text-[11px] font-medium transition-colors ${regra.valido ? (isDark ? 'text-zinc-300' : 'text-zinc-700') : (isDark ? 'text-zinc-600' : 'text-zinc-400')}`}>{regra.label}</span>
                               </div>
                             ))}
                          </div>
                        </div>

                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <label className={labelArox}>Confirme a Nova Senha</label>
                        <input 
                           type={mostrarSenhas ? "text" : "password"} 
                           value={confirmarSenha} 
                           onChange={e => setConfirmarSenha(e.target.value)} 
                           className={`${inputArox} ${confirmarSenha.length > 0 && novaSenha === confirmarSenha ? 'border-emerald-500/50 focus:border-emerald-500 focus:ring-emerald-500/20' : (confirmarSenha.length > 0 ? 'border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/20' : '')}`} 
                        />
                        <AnimatePresence>
                           {(confirmarSenha.length > 0 && novaSenha !== confirmarSenha) && (
                             <motion.span initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="text-[11px] font-medium text-rose-500 mt-1">
                               As senhas não coincidem.
                             </motion.span>
                           )}
                        </AnimatePresence>
                      </div>
                    </div>
                    
                    <div className={`mt-4 pt-6 border-t flex justify-end ${borderSubtle}`}>
                      <button disabled={!senhaValida || !senhaAtual} onClick={() => alterarSenhaConta(senhaAtual, novaSenha)} className={`${btnPrimary} ${!senhaValida || !senhaAtual ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        Atualizar Credencial
                      </button>
                    </div>
                  </div>
              </div>
           </div>
        )}

        {/* INJEÇÃO DOS COMPONENTES EXTERNOS */}
        {abaPrincipal === 'catalogo' && (
           <div className="w-full h-full">
             <AdminProdutos empresaId={ID_EMPRESA_REAL} temaNoturno={temaNoturno} {...props} />
           </div>
        )}

        {abaPrincipal === 'delivery' && (
           <div className="w-full h-full">
             <AdminDelivery empresaId={ID_EMPRESA_REAL} temaNoturno={temaNoturno} {...props} />
           </div>
        )}

      </main>

      {/* ACTION BAR INFERIOR PREMIUM (SALVAR ALTERAÇÕES) */}
      <AnimatePresence>
        {(temAlteracoes && abaPrincipal === 'geral') && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-6 md:left-[260px] lg:left-[288px] left-0 right-0 px-5 flex justify-center z-[130] pointer-events-auto"
          >
            <div className={`flex items-center justify-between gap-4 px-6 py-3.5 rounded-2xl shadow-2xl backdrop-blur-xl border w-full max-w-2xl relative overflow-hidden ${isDark ? 'bg-[#18181B]/95 border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.5)]' : 'bg-white/95 border-zinc-200 shadow-[0_10px_40px_rgba(0,0,0,0.1)]'}`}>
              
              {/* Efeito de brilho de fundo quando sucesso */}
              <AnimatePresence>
                 {estadoSalvamento === 'sucesso' && (
                   <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-emerald-500/10 pointer-events-none" />
                 )}
              </AnimatePresence>

              <div className="flex flex-col relative z-10">
                <span className={`text-[15px] font-bold tracking-tight ${textPrimary}`}>Dados Modificados</span>
                <span className={`text-[12px] font-medium ${textSecondary}`}>Não se esqueça de salvar o progresso.</span>
              </div>
              
              <button 
                onClick={handleSalvarGeral} 
                disabled={isSalvando || estadoSalvamento === 'sucesso'}
                className={`relative overflow-hidden min-w-[160px] h-11 px-6 rounded-xl text-[12px] font-bold tracking-wider uppercase transition-all shadow-md flex items-center justify-center
                  ${estadoSalvamento === 'sucesso' 
                    ? 'bg-emerald-500 text-white shadow-emerald-500/30 ring-2 ring-emerald-500/20 ring-offset-2 ring-offset-transparent pointer-events-none' 
                    : estadoSalvamento === 'erro' 
                      ? 'bg-rose-500 text-white shadow-rose-500/30' 
                      : (isDark ? 'bg-white text-zinc-900 hover:bg-zinc-200 active:scale-[0.98]' : 'bg-zinc-900 text-white hover:bg-black active:scale-[0.98]')}
                `}
              >
                <AnimatePresence mode="wait">
                  {isSalvando ? (
                    <motion.div key="salvando" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      <span>Salvando...</span>
                    </motion.div>
                  ) : estadoSalvamento === 'sucesso' ? (
                    <motion.div key="sucesso" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="flex items-center gap-2 text-white">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                      <span>Salvo</span>
                    </motion.div>
                  ) : estadoSalvamento === 'erro' ? (
                    <motion.div key="erro" initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 5 }} className="flex items-center gap-2">
                      <span>Erro ao Salvar</span>
                    </motion.div>
                  ) : (
                    <motion.div key="default" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      Salvar Alterações
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}