'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminDelivery({ empresaId, temaNoturno }) {
  const [bairros, setBairros] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [abaMobile, setAbaMobile] = useState('configurar');
  const [modoMassa, setModoMassa] = useState(false);
  
  const [nome, setNome] = useState('');
  const [taxa, setTaxa] = useState('');
  const [editandoId, setEditandoId] = useState(null);
  const [textoMassa, setTextoMassa] = useState('');

  useEffect(() => { if(empresaId) carregarBairros(); }, [empresaId]);

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
    if (editandoId) { await supabase.from('bairros_entrega').update({ nome, taxa: valorTaxa }).eq('id', editandoId); setEditandoId(null); } 
    else { await supabase.from('bairros_entrega').insert([{ empresa_id: empresaId, nome, taxa: valorTaxa }]); }
    setNome(''); setTaxa(''); carregarBairros();
  };

  const editarBairro = (bairro) => { setModoMassa(false); setEditandoId(bairro.id); setNome(bairro.nome); setTaxa(bairro.taxa.toString()); setAbaMobile('configurar'); };
  const excluirBairro = async (id, nomeBairro) => { if (confirm(`Tem certeza que deseja excluir o bairro "${nomeBairro}"?`)) { await supabase.from('bairros_entrega').delete().eq('id', id); carregarBairros(); } };

  const processarEmMassa = async () => {
    if (!textoMassa.trim()) return alert("Cole a lista de bairros primeiro.");
    const linhas = textoMassa.split('\n'); const novosBairros = [];
    linhas.forEach(linha => {
      const partes = linha.split(/[-;,]/);
      if (partes.length >= 2) {
        const nomeParte = partes[0].trim(); const taxaParte = parseFloat(partes[1].replace(/[^\d.,]/g, '').replace(',', '.'));
        if (nomeParte && !isNaN(taxaParte)) novosBairros.push({ empresa_id: empresaId, nome: nomeParte, taxa: taxaParte });
      }
    });
    if (novosBairros.length === 0) return alert("Nenhum bairro válido encontrado. Siga o formato: Nome - 5,00");
    if (confirm(`Encontrados ${novosBairros.length} bairros. Importá-los?`)) {
      setIsLoading(true); await supabase.from('bairros_entrega').insert(novosBairros);
      setTextoMassa(''); setModoMassa(false); carregarBairros(); setAbaMobile('bairros');
    }
  };

  const labelArox = `text-[10px] font-bold uppercase tracking-widest block mb-1.5 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`;
  const inputArox = `w-full px-4 py-3.5 rounded-xl border outline-none text-sm font-bold transition-all shadow-sm focus:ring-1 focus:ring-offset-0 ${temaNoturno ? 'bg-white/[0.02] border-white/10 focus:border-white/20 focus:ring-white/20 text-white placeholder-zinc-600' : 'bg-black/[0.02] border-zinc-200 focus:border-zinc-300 focus:ring-zinc-200 text-zinc-900 placeholder-zinc-400'}`;

  return (
    <div className="flex flex-col lg:flex-row h-full w-full relative">
      <div className={`lg:hidden flex border-b relative z-10 ${temaNoturno ? 'border-white/5' : 'border-zinc-200'}`}>
        <button onClick={() => setAbaMobile('configurar')} className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-widest transition-colors ${abaMobile === 'configurar' ? (temaNoturno ? 'text-white' : 'text-zinc-900') : (temaNoturno ? 'text-zinc-600' : 'text-zinc-400')}`}>Configurar</button>
        <button onClick={() => setAbaMobile('bairros')} className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-widest transition-colors ${abaMobile === 'bairros' ? (temaNoturno ? 'text-white' : 'text-zinc-900') : (temaNoturno ? 'text-zinc-600' : 'text-zinc-400')}`}>Bairros Salvos</button>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col lg:flex-row max-w-7xl mx-auto w-full scrollbar-hide">
        {/* CONFIGURAÇÃO */}
        <div className={`p-6 lg:p-8 flex-col gap-6 w-full lg:w-1/2 lg:border-r ${abaMobile === 'configurar' ? 'flex' : 'hidden lg:flex'} ${temaNoturno ? 'border-white/[0.06]' : 'border-zinc-200'}`}>
          <div className={`flex p-1.5 rounded-xl mb-6 shadow-sm border ${temaNoturno ? 'bg-[#0A0A0A] border-white/10' : 'bg-white border-zinc-200'}`}>
            <button onClick={() => { setModoMassa(false); setEditandoId(null); setNome(''); setTaxa(''); }} className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${!modoMassa ? (temaNoturno ? 'bg-white/10 text-white' : 'bg-black/5 text-zinc-900') : (temaNoturno ? 'text-zinc-500' : 'text-zinc-500')}`}>Individual</button>
            <button onClick={() => { setModoMassa(true); setEditandoId(null); }} className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${modoMassa ? (temaNoturno ? 'bg-white/10 text-white' : 'bg-black/5 text-zinc-900') : (temaNoturno ? 'text-zinc-500' : 'text-zinc-500')}`}>Em Massa</button>
          </div>

          {!modoMassa ? (
            <form onSubmit={salvarBairro} className="space-y-5">
              <div className="group"><label className={labelArox}>Nome do Bairro</label><input type="text" placeholder="Ex: Centro" value={nome} onChange={(e) => setNome(e.target.value)} className={inputArox} /></div>
              <div className="group"><label className={labelArox}>Taxa (R$)</label><input type="number" step="0.01" placeholder="5.00" value={taxa} onChange={(e) => setTaxa(e.target.value)} className={inputArox} /></div>
              <div className="pt-4 flex flex-col gap-3">
                <button type="submit" className={`w-full py-4 rounded-xl text-[13px] font-bold transition-all active:scale-95 ${temaNoturno ? 'bg-white text-zinc-900' : 'bg-zinc-900 text-white'}`}>{editandoId ? 'Atualizar Taxa' : 'Salvar Bairro'}</button>
                {editandoId && <button type="button" onClick={() => { setEditandoId(null); setNome(''); setTaxa(''); }} className={`w-full py-3.5 rounded-xl text-[13px] font-bold transition-all ${temaNoturno ? 'bg-white/10 text-white' : 'bg-black/5 text-zinc-900'}`}>Cancelar Edição</button>}
              </div>
            </form>
          ) : (
            <div className="space-y-5">
              <div><label className={labelArox}>Cole sua lista (Bairro - Valor)</label><textarea rows="6" placeholder={`Centro - 5,00\nZona Norte - 10,00`} value={textoMassa} onChange={(e) => setTextoMassa(e.target.value)} className={`${inputArox} font-mono resize-y`}></textarea></div>
              <button onClick={processarEmMassa} className={`w-full py-4 rounded-xl text-[13px] font-bold transition-all active:scale-95 ${temaNoturno ? 'bg-white text-zinc-900' : 'bg-zinc-900 text-white'}`}>Importar Lista de Bairros</button>
            </div>
          )}
        </div>

        {/* LISTA DE BAIRROS */}
        <div className={`p-6 lg:p-8 flex-col gap-4 w-full lg:w-1/2 ${abaMobile === 'bairros' ? 'flex' : 'hidden lg:flex'} ${temaNoturno ? 'bg-[#111111]/30' : 'bg-zinc-50/50'}`}>
          <h3 className={labelArox}>Bairros Ativos ({bairros.length})</h3>
          <div className="flex flex-col gap-3 h-full overflow-y-auto pr-2 scrollbar-hide">
            {isLoading ? (
              <div className="text-center py-8 font-bold text-zinc-500 animate-pulse">Carregando...</div>
            ) : bairros.length === 0 ? (
              <div className="text-center py-8 text-[13px] font-medium text-zinc-500">Nenhum bairro cadastrado.</div>
            ) : (
              bairros.map(b => (
                <div key={b.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${temaNoturno ? 'bg-[#111111] border-white/[0.06]' : 'bg-white border-zinc-200 shadow-sm'}`}>
                  <div>
                    <p className="font-bold text-[14px]">{b.nome}</p>
                    <p className={labelArox}>R$ {parseFloat(b.taxa).toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => editarBairro(b)} className={`p-2.5 rounded-lg transition-colors ${temaNoturno ? 'bg-white/5 text-zinc-400 hover:text-white' : 'bg-black/5 text-zinc-500 hover:text-black'}`}><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg></button>
                    <button onClick={() => excluirBairro(b.id, b.nome)} className={`p-2.5 rounded-lg transition-colors ${temaNoturno ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20' : 'bg-rose-50 text-rose-600 hover:bg-rose-100'}`}><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}