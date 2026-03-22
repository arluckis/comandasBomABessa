'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function ModalConfigTags({
  temaNoturno,
  tagsGlobais,
  setTagsGlobais,
  sessao,
  setMostrarConfigTags
}) {
  const [abaMobile, setAbaMobile] = useState('adicionar'); // 'adicionar' | 'lista'
  const [novaTag, setNovaTag] = useState('');

  const handleAdicionarTag = async () => {
    const val = novaTag.trim();
    if (val !== '' && !tagsGlobais.some(t => t.nome.toLowerCase() === val.toLowerCase())) {
       const { data } = await supabase.from('tags').insert([{ nome: val, empresa_id: sessao.empresa_id }]).select();
       if (data) setTagsGlobais([...tagsGlobais, data[0]]);
    }
    setNovaTag('');
  };

  const handleExcluirTag = async (tagObj) => {
    if (confirm(`Excluir a tag '${tagObj.nome}' do sistema?`)) {
      await supabase.from('tags').delete().eq('id', tagObj.id);
      setTagsGlobais(tagsGlobais.filter(t => t.id !== tagObj.id));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-start sm:items-center justify-center p-4 sm:p-6 z-[70] backdrop-blur-md overflow-y-auto">
      <div className={`relative w-full max-w-4xl rounded-3xl shadow-2xl animate-in zoom-in-95 border flex flex-col overflow-hidden my-auto shrink-0 transition-colors duration-500 ${temaNoturno ? 'bg-gradient-to-br from-[#15151e] to-[#0a0a0f] border-gray-800' : 'bg-white border-gray-200'}`}>
        
        {/* Glow Effects */}
        {temaNoturno ? (
          <>
            <div className="absolute -top-32 -right-32 w-96 h-96 bg-pink-500/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none"></div>
          </>
        ) : (
          <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-pink-50/40 via-transparent to-purple-50/30 pointer-events-none"></div>
        )}

        {/* Header */}
        <div className={`flex justify-between items-center p-5 lg:p-7 border-b relative z-10 ${temaNoturno ? 'border-gray-800/80 bg-[#15151e]/50' : 'border-gray-100 bg-white/50'} backdrop-blur-md`}>
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl shadow-inner ${temaNoturno ? 'bg-gradient-to-br from-pink-500/20 to-purple-700/10 text-pink-400 border border-pink-500/20' : 'bg-gradient-to-br from-pink-100 to-purple-50 text-pink-600 border border-pink-200'}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg>
            </div>
            <div>
              <h2 className={`text-xl lg:text-2xl font-black tracking-tight ${temaNoturno ? 'text-gray-100' : 'text-gray-900'}`}>Gestão de Tags</h2>
              <p className={`text-xs mt-0.5 font-medium ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`}>Organize identificadores para comandas e produtos.</p>
            </div>
          </div>
          <button onClick={() => setMostrarConfigTags(false)} className={`p-2.5 rounded-full font-bold transition active:scale-95 ${temaNoturno ? 'bg-gray-800/80 text-gray-400 hover:text-white hover:bg-gray-700' : 'bg-gray-100 text-gray-400 hover:text-gray-900 hover:bg-gray-200'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        {/* Abas Mobile */}
        <div className={`lg:hidden flex border-b relative z-10 ${temaNoturno ? 'border-gray-800' : 'border-gray-200'}`}>
          <button onClick={() => setAbaMobile('adicionar')} className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-colors relative ${abaMobile === 'adicionar' ? (temaNoturno ? 'text-pink-400' : 'text-pink-600') : (temaNoturno ? 'text-gray-500' : 'text-gray-400')}`}>
            Criar Tag
            {abaMobile === 'adicionar' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-pink-500 rounded-t-full"></span>}
          </button>
          <button onClick={() => setAbaMobile('lista')} className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-colors relative ${abaMobile === 'lista' ? (temaNoturno ? 'text-purple-400' : 'text-purple-500') : (temaNoturno ? 'text-gray-500' : 'text-gray-400')}`}>
            Tags Ativas
            {abaMobile === 'lista' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-500 rounded-t-full"></span>}
          </button>
        </div>

        {/* Grid de 2 Colunas */}
        <div className="flex flex-col lg:flex-row relative z-10 flex-1 min-h-0">
          
          {/* COLUNA 1: ADICIONAR */}
          <div className={`p-6 lg:p-8 flex-col gap-6 lg:w-1/2 lg:border-r ${abaMobile === 'adicionar' ? 'flex' : 'hidden lg:flex'} ${temaNoturno ? 'border-gray-800' : 'border-gray-100 bg-gradient-to-b from-transparent to-pink-50/30'}`}>
            <h3 className={`text-xs font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2 ${temaNoturno ? 'text-pink-400' : 'text-pink-600'}`}>Nova Identificação</h3>
            
            <div className="space-y-5">
              <div className="group">
                <label className={`text-[10px] font-black uppercase tracking-widest mb-1.5 block transition-colors ${temaNoturno ? 'text-gray-400 group-focus-within:text-pink-400' : 'text-gray-500 group-focus-within:text-pink-600'}`}>Nome da Tag</label>
                <input type="text" placeholder="Ex: Consumo Local, VIP, Ifood..." value={novaTag} onChange={e => setNovaTag(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdicionarTag()} className={`w-full px-4 py-3.5 rounded-xl border outline-none text-sm font-bold transition-all focus:ring-2 focus:ring-pink-500/20 ${temaNoturno ? 'bg-gray-900/60 border-gray-700/80 focus:border-pink-500 text-white placeholder-gray-600' : 'bg-white border-gray-200 focus:border-pink-500 text-gray-900 placeholder-gray-400 shadow-sm'}`} />
              </div>

              <button onClick={handleAdicionarTag} className={`w-full font-black py-4 rounded-xl transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2 group ${temaNoturno ? 'bg-pink-600 hover:bg-pink-500 text-white shadow-pink-900/20' : 'bg-gray-900 hover:bg-black text-white shadow-gray-900/20'}`}>
                <span>Salvar Nova Tag</span>
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"></path></svg>
              </button>
            </div>
          </div>

          {/* COLUNA 2: LISTA */}
          <div className={`p-6 lg:p-8 flex-col gap-6 lg:w-1/2 ${abaMobile === 'lista' ? 'flex' : 'hidden lg:flex'} ${temaNoturno ? 'bg-black/20' : 'bg-gray-50/50'}`}>
            <h3 className={`text-xs font-black uppercase tracking-[0.2em] mb-0 flex items-center gap-2 ${temaNoturno ? 'text-purple-400' : 'text-purple-600'}`}>
              Banco de Tags ({tagsGlobais.length})
            </h3>

            <div className="flex flex-wrap gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar mt-4">
              {tagsGlobais.map(tagObj => (
                <div key={tagObj.id} className={`flex items-center gap-3 px-4 py-2 rounded-xl border text-sm font-bold transition-all shadow-sm ${temaNoturno ? 'bg-gray-800/80 border-gray-700 text-gray-200 hover:border-gray-500' : 'bg-white border-gray-200 text-gray-700 hover:border-purple-200'}`}>
                  {tagObj.nome}
                  <button onClick={() => handleExcluirTag(tagObj)} className={`p-1 rounded-md transition-colors ${temaNoturno ? 'text-gray-500 hover:bg-red-900/30 hover:text-red-400' : 'text-gray-400 hover:bg-red-50 hover:text-red-600'}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>
                </div>
              ))}
              {tagsGlobais.length === 0 && (
                <div className={`w-full p-8 rounded-2xl border border-dashed flex flex-col items-center justify-center text-center ${temaNoturno ? 'border-gray-700 bg-gray-900/30' : 'border-gray-300 bg-gray-50'}`}>
                  <span className={`text-sm font-bold ${temaNoturno ? 'text-gray-500' : 'text-gray-400'}`}>Nenhuma tag configurada ainda.</span>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}