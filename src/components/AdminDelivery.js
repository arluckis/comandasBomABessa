'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminDelivery({ empresaId, temaNoturno, onFechar }) {
  const [bairros, setBairros] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [abaMobile, setAbaMobile] = useState('configurar'); // 'configurar' | 'bairros'
  const [modoMassa, setModoMassa] = useState(false);
  
  const [nome, setNome] = useState('');
  const [taxa, setTaxa] = useState('');
  const [editandoId, setEditandoId] = useState(null);
  const [textoMassa, setTextoMassa] = useState('');

  useEffect(() => { carregarBairros(); }, []);

  const carregarBairros = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('bairros_entrega').select('*').eq('empresa_id', empresaId).order('nome');
    if (!error && data) setBairros(data);
    setIsLoading(false);
  };

  const salvarBairro = async (e) => {
    if (e) e.preventDefault();
    if (!nome.trim() || taxa === '') return alert("Preencha o nome e a taxa do bairro.");
    const valorTaxa = parseFloat(taxa.toString().replace(',', '.'));

    if (editandoId) {
      await supabase.from('bairros_entrega').update({ nome, taxa: valorTaxa }).eq('id', editandoId);
      setEditandoId(null);
    } else {
      await supabase.from('bairros_entrega').insert([{ empresa_id: empresaId, nome, taxa: valorTaxa }]);
    }
    setNome(''); setTaxa('');
    carregarBairros();
  };

  const editarBairro = (bairro) => {
    setModoMassa(false); setEditandoId(bairro.id); setNome(bairro.nome); setTaxa(bairro.taxa.toString()); setAbaMobile('configurar');
  };

  const excluirBairro = async (id, nomeBairro) => {
    if (confirm(`Tem certeza que deseja excluir o bairro "${nomeBairro}"?`)) {
      await supabase.from('bairros_entrega').delete().eq('id', id);
      carregarBairros();
    }
  };

  const processarEmMassa = async () => {
    if (!textoMassa.trim()) return alert("Cole a lista de bairros primeiro.");
    const linhas = textoMassa.split('\n');
    const novosBairros = [];

    linhas.forEach(linha => {
      const partes = linha.split(/[-;,]/);
      if (partes.length >= 2) {
        const nomeParte = partes[0].trim();
        const taxaParte = parseFloat(partes[1].replace(/[^\d.,]/g, '').replace(',', '.'));
        if (nomeParte && !isNaN(taxaParte)) novosBairros.push({ empresa_id: empresaId, nome: nomeParte, taxa: taxaParte });
      }
    });

    if (novosBairros.length === 0) return alert("Nenhum bairro válido encontrado. Siga o formato: Nome do Bairro - 5,00");

    if (confirm(`Encontrados ${novosBairros.length} bairros. Deseja importá-los?`)) {
      setIsLoading(true);
      await supabase.from('bairros_entrega').insert(novosBairros);
      setTextoMassa(''); setModoMassa(false); carregarBairros(); setAbaMobile('bairros');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-start sm:items-center justify-center p-4 sm:p-6 z-[100] backdrop-blur-md overflow-y-auto">
      <div className={`relative w-full max-w-5xl rounded-3xl shadow-2xl animate-in zoom-in-95 border flex flex-col overflow-hidden my-auto shrink-0 transition-colors duration-500 ${temaNoturno ? 'bg-gradient-to-br from-[#15151e] to-[#0a0a0f] border-gray-800' : 'bg-white border-gray-200'}`}>
        
        {/* Glow Effects */}
        {temaNoturno ? (
          <>
            <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none"></div>
          </>
        ) : (
          <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-blue-50/40 via-transparent to-emerald-50/30 pointer-events-none"></div>
        )}

        {/* Header */}
        <div className={`flex justify-between items-center p-5 lg:p-7 border-b relative z-10 ${temaNoturno ? 'border-gray-800/80 bg-[#15151e]/50' : 'border-gray-100 bg-white/50'} backdrop-blur-md`}>
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl shadow-inner ${temaNoturno ? 'bg-gradient-to-br from-blue-500/20 to-blue-700/10 text-blue-400 border border-blue-500/20' : 'bg-gradient-to-br from-blue-100 to-blue-50 text-blue-600 border border-blue-200'}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"></path></svg>
            </div>
            <div>
              <h2 className={`text-xl lg:text-2xl font-black tracking-tight ${temaNoturno ? 'text-gray-100' : 'text-gray-900'}`}>Taxas de Entrega</h2>
              <p className={`text-xs mt-0.5 font-medium ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`}>Gerencie os bairros e valores para Delivery.</p>
            </div>
          </div>
          <button onClick={onFechar} className={`p-2.5 rounded-full font-bold transition active:scale-95 ${temaNoturno ? 'bg-gray-800/80 text-gray-400 hover:text-white hover:bg-gray-700' : 'bg-gray-100 text-gray-400 hover:text-gray-900 hover:bg-gray-200'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        {/* Abas Mobile */}
        <div className={`lg:hidden flex border-b relative z-10 ${temaNoturno ? 'border-gray-800' : 'border-gray-200'}`}>
          <button onClick={() => setAbaMobile('configurar')} className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-colors relative ${abaMobile === 'configurar' ? (temaNoturno ? 'text-blue-400' : 'text-blue-600') : (temaNoturno ? 'text-gray-500' : 'text-gray-400')}`}>
            Configurar
            {abaMobile === 'configurar' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 rounded-t-full"></span>}
          </button>
          <button onClick={() => setAbaMobile('bairros')} className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-colors relative ${abaMobile === 'bairros' ? (temaNoturno ? 'text-emerald-400' : 'text-emerald-500') : (temaNoturno ? 'text-gray-500' : 'text-gray-400')}`}>
            Bairros Salvos
            {abaMobile === 'bairros' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-500 rounded-t-full"></span>}
          </button>
        </div>

        <div className="flex flex-col lg:flex-row relative z-10 flex-1 min-h-0">
          
          {/* COLUNA 1: CONFIGURAÇÃO */}
          <div className={`p-6 lg:p-8 flex-col gap-6 lg:w-1/2 lg:border-r ${abaMobile === 'configurar' ? 'flex' : 'hidden lg:flex'} ${temaNoturno ? 'border-gray-800 bg-gradient-to-b from-transparent to-blue-900/10' : 'border-gray-100 bg-gradient-to-b from-transparent to-blue-50/30'}`}>
            <div className="flex bg-black/5 dark:bg-white/5 p-1 rounded-xl mb-6">
              <button onClick={() => { setModoMassa(false); setEditandoId(null); setNome(''); setTaxa(''); }} className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${!modoMassa ? (temaNoturno ? 'bg-gray-800 text-white shadow' : 'bg-white text-gray-900 shadow') : (temaNoturno ? 'text-gray-500' : 'text-gray-500')}`}>Individual</button>
              <button onClick={() => { setModoMassa(true); setEditandoId(null); }} className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${modoMassa ? (temaNoturno ? 'bg-gray-800 text-white shadow' : 'bg-white text-gray-900 shadow') : (temaNoturno ? 'text-gray-500' : 'text-gray-500')}`}>Em Massa</button>
            </div>

            {!modoMassa ? (
              <form onSubmit={salvarBairro} className="space-y-5">
                <div className="group">
                  <label className={`text-[10px] font-black uppercase tracking-widest mb-1.5 block transition-colors ${temaNoturno ? 'text-gray-400 group-focus-within:text-blue-400' : 'text-gray-500 group-focus-within:text-blue-600'}`}>Nome do Bairro</label>
                  <input type="text" placeholder="Ex: Centro" value={nome} onChange={(e) => setNome(e.target.value)} className={`w-full px-4 py-3.5 rounded-xl border outline-none text-sm font-bold transition-all focus:ring-2 focus:ring-blue-500/20 ${temaNoturno ? 'bg-gray-900/60 border-gray-700/80 focus:border-blue-500 text-white placeholder-gray-600' : 'bg-white border-gray-200 focus:border-blue-500 text-gray-900 placeholder-gray-400 shadow-sm'}`} />
                </div>
                <div className="group">
                  <label className={`text-[10px] font-black uppercase tracking-widest mb-1.5 block transition-colors ${temaNoturno ? 'text-gray-400 group-focus-within:text-blue-400' : 'text-gray-500 group-focus-within:text-blue-600'}`}>Taxa (R$)</label>
                  <input type="number" step="0.01" placeholder="5.00" value={taxa} onChange={(e) => setTaxa(e.target.value)} className={`w-full px-4 py-3.5 rounded-xl border outline-none text-sm font-bold transition-all focus:ring-2 focus:ring-blue-500/20 ${temaNoturno ? 'bg-gray-900/60 border-gray-700/80 focus:border-blue-500 text-white placeholder-gray-600' : 'bg-white border-gray-200 focus:border-blue-500 text-gray-900 placeholder-gray-400 shadow-sm'}`} />
                </div>
                <div className="pt-4 flex flex-col gap-3">
                  <button type="submit" className={`w-full font-black py-4 rounded-xl transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2 ${temaNoturno ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/20' : 'bg-gray-900 hover:bg-black text-white shadow-gray-900/20'}`}>
                    {editandoId ? 'Atualizar Taxa' : 'Salvar Bairro'}
                  </button>
                  {editandoId && (
                    <button type="button" onClick={() => { setEditandoId(null); setNome(''); setTaxa(''); }} className={`w-full font-bold py-3.5 rounded-xl transition-all ${temaNoturno ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Cancelar Edição</button>
                  )}
                </div>
              </form>
            ) : (
              <div className="space-y-5">
                <div>
                  <label className={`text-[10px] font-black uppercase tracking-widest mb-1.5 block ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`}>Cole sua lista abaixo (Bairro - Valor)</label>
                  <textarea rows="6" placeholder={`Exemplo:\nCentro - 5,00\nZona Norte - 10,00`} value={textoMassa} onChange={(e) => setTextoMassa(e.target.value)} className={`w-full px-4 py-3.5 rounded-xl border outline-none text-sm font-mono transition-all focus:ring-2 focus:ring-blue-500/20 ${temaNoturno ? 'bg-gray-900/60 border-gray-700/80 focus:border-blue-500 text-white placeholder-gray-600' : 'bg-white border-gray-200 focus:border-blue-500 text-gray-900 placeholder-gray-400 shadow-sm'}`}></textarea>
                </div>
                <button onClick={processarEmMassa} className={`w-full font-black py-4 rounded-xl transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2 ${temaNoturno ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/20' : 'bg-gray-900 hover:bg-black text-white shadow-gray-900/20'}`}>
                  Importar Lista de Bairros
                </button>
              </div>
            )}
          </div>

          {/* COLUNA 2: LISTA DE BAIRROS */}
          <div className={`p-6 lg:p-8 flex-col gap-4 lg:w-1/2 ${abaMobile === 'bairros' ? 'flex' : 'hidden lg:flex'} ${temaNoturno ? 'bg-black/20' : 'bg-gray-50/50'}`}>
             <h3 className={`text-xs font-black uppercase tracking-[0.2em] mb-2 flex items-center gap-2 ${temaNoturno ? 'text-emerald-400' : 'text-emerald-600'}`}>
              Bairros Ativos ({bairros.length})
            </h3>
            
            <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {isLoading ? (
                <div className="text-center py-8 font-bold text-gray-400 animate-pulse">Carregando bairros...</div>
              ) : bairros.length === 0 ? (
                <div className={`w-full p-8 rounded-2xl border border-dashed flex flex-col items-center justify-center text-center ${temaNoturno ? 'border-gray-700 bg-gray-900/30' : 'border-gray-300 bg-gray-50'}`}>
                  <span className={`text-sm font-bold ${temaNoturno ? 'text-gray-500' : 'text-gray-400'}`}>Nenhum bairro cadastrado.</span>
                </div>
              ) : (
                bairros.map(b => (
                  <div key={b.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-all hover:shadow-md ${temaNoturno ? 'bg-gray-800/80 border-gray-700 hover:border-gray-500' : 'bg-white border-gray-200 hover:border-blue-200'}`}>
                    <div>
                      <p className={`font-black tracking-tight ${temaNoturno ? 'text-gray-100' : 'text-gray-900'}`}>{b.nome}</p>
                      <p className={`text-xs font-bold mt-0.5 ${temaNoturno ? 'text-blue-400' : 'text-blue-600'}`}>Taxa: R$ {parseFloat(b.taxa).toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => editarBairro(b)} className={`p-2.5 rounded-xl transition-colors ${temaNoturno ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-900'}`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                      </button>
                      <button onClick={() => excluirBairro(b.id, b.nome)} className={`p-2.5 rounded-xl transition-colors ${temaNoturno ? 'bg-red-900/20 text-red-400 hover:bg-red-900/40' : 'bg-red-50 text-red-500 hover:bg-red-100'}`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}