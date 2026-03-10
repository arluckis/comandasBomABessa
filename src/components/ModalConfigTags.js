'use client';
import { supabase } from '@/lib/supabase';

export default function ModalConfigTags({
  temaNoturno,
  tagsGlobais,
  setTagsGlobais,
  sessao,
  setMostrarConfigTags
}) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[70] backdrop-blur-sm">
      <div className={`rounded-3xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 border ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
        <div className={`flex justify-between items-center mb-6 border-b pb-4 ${temaNoturno ? 'border-gray-700' : 'border-gray-100'}`}>
          <h2 className={`text-xl font-black flex items-center gap-2 ${temaNoturno ? 'text-white' : 'text-purple-900'}`}>
            <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg>
            Configurar Tags
          </h2>
          <button onClick={() => setMostrarConfigTags(false)} className={`p-2 rounded-full font-bold transition ${temaNoturno ? 'bg-gray-700 text-gray-400 hover:text-white hover:bg-gray-600' : 'bg-gray-100 text-gray-400 hover:text-gray-600 hover:bg-gray-200'}`}>✕</button>
        </div>
        <div className="flex gap-2 mb-6">
          <input type="text" id="novaTagInput" placeholder="Nova tag (Ex: Consumo Local)" className={`flex-1 p-3 rounded-xl border outline-none text-sm font-medium focus:border-purple-500 transition ${temaNoturno ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
            onKeyDown={async (e) => {
              if (e.key === 'Enter' && e.target.value.trim() !== '') {
                const val = e.target.value.trim();
                if (!tagsGlobais.some(t => t.nome.toLowerCase() === val.toLowerCase())) {
                   const { data } = await supabase.from('tags').insert([{ nome: val, empresa_id: sessao.empresa_id }]).select();
                   if (data) setTagsGlobais([...tagsGlobais, data[0]]);
                }
                e.target.value = '';
              }
            }}
          />
          <button onClick={async () => {
              const input = document.getElementById('novaTagInput');
              const val = input.value.trim();
              if (val !== '' && !tagsGlobais.some(t => t.nome.toLowerCase() === val.toLowerCase())) {
                 const { data } = await supabase.from('tags').insert([{ nome: val, empresa_id: sessao.empresa_id }]).select();
                 if (data) setTagsGlobais([...tagsGlobais, data[0]]);
              }
              input.value = '';
            }}
            className="bg-purple-600 text-white font-bold px-4 rounded-xl hover:bg-purple-700 transition shadow-sm">Adicionar</button>
        </div>
        <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${temaNoturno ? 'text-gray-500' : 'text-gray-400'}`}>Tags Atuais</p>
        <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto pr-2 scrollbar-hide">
          {tagsGlobais.map(tagObj => (
            <div key={tagObj.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-bold ${temaNoturno ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
              {tagObj.nome}
              <button onClick={async () => {
                  if (confirm(`Excluir a tag '${tagObj.nome}' do sistema?`)) {
                    await supabase.from('tags').delete().eq('id', tagObj.id);
                    setTagsGlobais(tagsGlobais.filter(t => t.id !== tagObj.id));
                  }
                }} 
                className="ml-1 p-1 rounded transition text-red-500 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/30">✕</button>
            </div>
          ))}
          {tagsGlobais.length === 0 && <span className={`text-sm italic ${temaNoturno ? 'text-gray-500' : 'text-gray-400'}`}>Nenhuma tag configurada.</span>}
        </div>
      </div>
    </div>
  );
}