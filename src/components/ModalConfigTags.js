'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function ModalConfigTags({ temaNoturno, tagsGlobais, setTagsGlobais, sessao }) {
  const [abaMobile, setAbaMobile] = useState('adicionar');
  const [novaTag, setNovaTag] = useState('');

  const handleAdicionarTag = async () => {
    const val = novaTag.trim();
    if (val !== '' && !tagsGlobais.some(t => t.nome.toLowerCase() === val.toLowerCase())) {
       const { data } = await supabase.from('tags').insert([{ nome: val, empresa_id: sessao.empresa_id }]).select();
       if (data && setTagsGlobais) setTagsGlobais([...tagsGlobais, data[0]]);
    }
    setNovaTag('');
  };

  const handleExcluirTag = async (tagObj) => {
    if (confirm(`Excluir a tag '${tagObj.nome}' do sistema?`)) {
      await supabase.from('tags').delete().eq('id', tagObj.id);
      if(setTagsGlobais) setTagsGlobais(tagsGlobais.filter(t => t.id !== tagObj.id));
    }
  };

  const labelArox = `text-[10px] font-bold uppercase tracking-widest block mb-1.5 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`;
  const inputArox = `w-full px-4 py-3.5 rounded-xl border outline-none text-sm font-bold transition-all shadow-sm focus:ring-1 focus:ring-offset-0 ${temaNoturno ? 'bg-white/[0.02] border-white/10 focus:border-white/20 focus:ring-white/20 text-white placeholder-zinc-600' : 'bg-black/[0.02] border-zinc-200 focus:border-zinc-300 focus:ring-zinc-200 text-zinc-900 placeholder-zinc-400'}`;

  return (
    <div className="flex flex-col lg:flex-row h-full w-full relative">
      <div className={`lg:hidden flex border-b relative z-10 ${temaNoturno ? 'border-white/5' : 'border-zinc-200'}`}>
        <button onClick={() => setAbaMobile('adicionar')} className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-widest transition-colors ${abaMobile === 'adicionar' ? (temaNoturno ? 'text-white' : 'text-zinc-900') : (temaNoturno ? 'text-zinc-600' : 'text-zinc-400')}`}>Criar Tag</button>
        <button onClick={() => setAbaMobile('lista')} className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-widest transition-colors ${abaMobile === 'lista' ? (temaNoturno ? 'text-white' : 'text-zinc-900') : (temaNoturno ? 'text-zinc-600' : 'text-zinc-400')}`}>Tags Ativas</button>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col lg:flex-row max-w-7xl mx-auto w-full scrollbar-hide">
        {/* COLUNA 1: ADICIONAR */}
        <div className={`p-6 lg:p-8 flex-col gap-6 w-full lg:w-1/2 lg:border-r ${abaMobile === 'adicionar' ? 'flex' : 'hidden lg:flex'} ${temaNoturno ? 'border-white/[0.06]' : 'border-zinc-200'}`}>
          <h3 className={labelArox}>Nova Identificação</h3>
          <div className="space-y-5">
            <div className="group">
              <label className={labelArox}>Nome da Tag</label>
              <input type="text" placeholder="Ex: Consumo Local, VIP..." value={novaTag} onChange={e => setNovaTag(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdicionarTag()} className={inputArox} />
            </div>
            <button onClick={handleAdicionarTag} className={`w-full py-4 rounded-xl text-[13px] font-bold transition-all active:scale-95 ${temaNoturno ? 'bg-white text-zinc-900' : 'bg-zinc-900 text-white'}`}>Salvar Nova Tag</button>
          </div>
        </div>

        {/* COLUNA 2: LISTA */}
        <div className={`p-6 lg:p-8 flex-col gap-6 w-full lg:w-1/2 ${abaMobile === 'lista' ? 'flex' : 'hidden lg:flex'} ${temaNoturno ? 'bg-[#111111]/30' : 'bg-zinc-50/50'}`}>
          <h3 className={labelArox}>Banco de Tags ({(tagsGlobais || []).length})</h3>
          <div className="flex flex-wrap gap-2 overflow-y-auto pr-2 scrollbar-hide">
            {(tagsGlobais || []).map(tagObj => (
              <div key={tagObj.id} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border text-[13px] font-bold transition-all shadow-sm ${temaNoturno ? 'bg-[#111111] border-white/[0.06] text-zinc-200' : 'bg-white border-zinc-200 text-zinc-800'}`}>
                {tagObj.nome}
                <button onClick={() => handleExcluirTag(tagObj)} className={`p-1 rounded-md transition-colors ${temaNoturno ? 'text-zinc-500 hover:bg-rose-900/30 hover:text-rose-400' : 'text-zinc-400 hover:bg-rose-50 hover:text-rose-600'}`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
            ))}
            {(!tagsGlobais || tagsGlobais.length === 0) && (
              <div className="w-full text-center py-8 text-[13px] font-medium text-zinc-500">Nenhuma tag configurada.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}