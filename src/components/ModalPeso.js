'use client';
import { useState, useEffect, useRef } from 'react';

export default function ModalPeso({ opcoesPeso, onAdicionar, onCancelar, temaNoturno }) {
  const [pesoGramas, setPesoGramas] = useState('');
  const [opcaoSelecionada, setOpcaoSelecionada] = useState('');
  
  const selectRef = useRef(null);
  const inputPesoRef = useRef(null);

  useEffect(() => {
    if (opcoesPeso && opcoesPeso.length > 0) {
      setOpcaoSelecionada(opcoesPeso[0].id);
    }
    if (selectRef.current) {
      selectRef.current.focus();
    }
  }, [opcoesPeso]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') { 
        e.preventDefault(); 
        onCancelar(); 
      }
      if (/^[1-9]$/.test(e.key) && document.activeElement.tagName !== 'INPUT') {
        e.preventDefault();
        const index = parseInt(e.key) - 1;
        if (opcoesPeso && opcoesPeso[index]) {
          setOpcaoSelecionada(opcoesPeso[index].id);
          if (inputPesoRef.current) inputPesoRef.current.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancelar, opcoesPeso]);

  const configAtual = opcoesPeso?.find(o => o.id === opcaoSelecionada);
  const peso = parseFloat(pesoGramas) || 0;
  const multiplicador = peso / 1000;
  const valorCalculado = configAtual ? (configAtual.preco * multiplicador) : 0;
  const isValido = peso > 0 && configAtual;

  const handleAdicionar = () => {
    if (!isValido) return;
    onAdicionar({
      nome: `Açaí no Peso - ${configAtual.nome} (${peso}g)`,
      preco: valorCalculado,
      custo: (configAtual.custo || 0) * multiplicador
    });
  };

  return (
    <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-[70] transition-opacity">
      <div className={`w-full max-w-[440px] rounded-2xl shadow-2xl flex flex-col border overflow-hidden animate-in fade-in zoom-in-95 duration-200 ${temaNoturno ? 'bg-[#0A0A0A] border-white/10' : 'bg-white border-black/5'}`}>
        
        {/* HEADER */}
        <div className={`px-6 py-4 flex justify-between items-center border-b ${temaNoturno ? 'border-white/[0.06] bg-[#111]' : 'border-black/[0.04] bg-[#FAFAFA]'}`}>
          <h2 className={`text-[15px] font-semibold tracking-tight ${temaNoturno ? 'text-white' : 'text-zinc-900'}`}>
            Balança Integrada
          </h2>
          <button onClick={onCancelar} className={`p-1.5 rounded-md transition-colors ${temaNoturno ? 'hover:bg-white/10 text-zinc-400' : 'hover:bg-black/5 text-zinc-500'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="p-6">
          
          {/* SELETOR DE PREÇO */}
          <div className="mb-6">
            <label className={`block text-[12px] font-medium mb-2 ${temaNoturno ? 'text-zinc-400' : 'text-zinc-600'}`}>
              Tabela Base <span className="opacity-60 ml-1 font-normal">(Atalhos 1, 2, 3...)</span>
            </label>
            <div className={`relative rounded-lg border focus-within:ring-2 focus-within:ring-zinc-900/10 ${temaNoturno ? 'border-white/10 bg-[#222] focus-within:ring-white/10' : 'border-black/10 bg-white shadow-sm'}`}>
              <select 
                ref={selectRef}
                value={opcaoSelecionada} 
                onChange={e => { setOpcaoSelecionada(e.target.value); inputPesoRef.current?.focus(); }}
                className={`w-full p-3 appearance-none bg-transparent outline-none font-medium text-[13px] ${temaNoturno ? 'text-zinc-200' : 'text-zinc-900'}`}
              >
                {opcoesPeso && opcoesPeso.length > 0 ? (
                  opcoesPeso.map((op, idx) => (
                    <option key={op.id} value={op.id}>[{idx + 1}] {op.nome} — R$ {op.preco.toFixed(2)} /kg</option>
                  ))
                ) : (
                  <option value="">Nenhuma configuração encontrada</option>
                )}
              </select>
              <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>

          {/* DISPLAY DO PESO */}
          <div className="py-6 flex flex-col items-center justify-center">
            <div className="flex items-baseline gap-2">
              <input 
                ref={inputPesoRef}
                type="number" 
                placeholder="0" 
                className={`w-full max-w-[200px] bg-transparent text-center outline-none text-[56px] font-semibold tabular-nums tracking-tighter placeholder-zinc-300 dark:placeholder-zinc-700 transition-colors ${temaNoturno ? 'text-white' : 'text-zinc-900'}`} 
                value={pesoGramas} 
                onChange={e => setPesoGramas(e.target.value)} 
                onKeyDown={e => e.key === 'Enter' && isValido && handleAdicionar()}
              />
              <span className={`text-2xl font-semibold ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}`}>g</span>
            </div>
          </div>

        </div>

        {/* DECISÃO FINAL */}
        <div className={`px-6 py-5 border-t flex items-center justify-between ${temaNoturno ? 'border-white/[0.06] bg-[#111]' : 'border-black/[0.04] bg-[#FAFAFA]'}`}>
          <div className="flex flex-col">
            <span className={`text-[12px] font-medium ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>Total Calculado</span>
            <div className={`text-[20px] font-semibold tabular-nums tracking-tight ${isValido ? (temaNoturno ? 'text-white' : 'text-zinc-900') : (temaNoturno ? 'text-zinc-600' : 'text-zinc-400')}`}>
              R$ {valorCalculado.toFixed(2).replace('.', ',')}
            </div>
          </div>

          <button 
            onClick={handleAdicionar} 
            disabled={!isValido} 
            className={`px-6 py-2.5 rounded-xl font-medium text-[13px] transition-colors flex items-center gap-2
              ${isValido 
                ? (temaNoturno ? 'bg-white text-zinc-900 hover:bg-zinc-200' : 'bg-zinc-900 text-white hover:bg-zinc-800 shadow-sm') 
                : (temaNoturno ? 'bg-white/5 text-zinc-600' : 'bg-black/5 text-zinc-400')}
            `}
          >
            Adicionar
            {isValido && <span className="text-[10px] opacity-60 font-medium px-1.5 border border-current rounded">ENTER</span>}
          </button>
        </div>

      </div>
    </div>
  );
}