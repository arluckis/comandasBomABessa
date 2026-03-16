'use client';
import { useState } from 'react';
import { ResponsiveContainer, Cell, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';

const CORES_VIBRANTES = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#0ea5e9', '#f97316', '#14b8a6', '#84cc16'];

export default function TabFidelidade({ temaNoturno, sessao, mostrarAlerta, dadosTags, clientesFidelidade, setClientesFidelidade }) {
  const [abaInterna, setAbaInterna] = useState('clientes'); 
  const [busca, setBusca] = useState('');
  
  const [meta, setMeta] = useState({ pontos_necessarios: 10, premio: '1 Açaí de 500ml' });
  const [mostrarModalNovo, setMostrarModalNovo] = useState(false);
  const [mostrarModalImportacao, setMostrarModalImportacao] = useState(false);
  
  const [novoCliente, setNovoCliente] = useState({ nome: '', telefone: '', aniversario: '', pontos: 0 });
  const [textoImportacao, setTextoImportacao] = useState('');

  const clientesFiltrados = clientesFidelidade.filter(c => c.nome.toLowerCase().includes(busca.toLowerCase()) || (c.telefone && c.telefone.includes(busca)));
  const ranking = [...clientesFidelidade].sort((a, b) => b.pontos - a.pontos).slice(0, 10);

  const salvarNovoCliente = () => {
    if (!novoCliente.nome) return mostrarAlerta("Erro", "O nome é obrigatório.");
    setClientesFidelidade([...clientesFidelidade, { ...novoCliente, id: Date.now() }]);
    setMostrarModalNovo(false);
    setNovoCliente({ nome: '', telefone: '', aniversario: '', pontos: 0 });
    mostrarAlerta("Sucesso", "Cliente cadastrado com sucesso!");
  };

  const processarImportacao = () => {
    if(!textoImportacao.trim()) return;
    try {
      const linhas = textoImportacao.trim().split('\n');
      const novos = linhas.map((l, index) => {
        const cols = l.includes('\t') ? l.split('\t') : l.split(',');
        if(cols.length >= 1 && cols[0].trim()) {
          return { id: Date.now() + index, nome: cols[0].trim(), telefone: cols[1] ? cols[1].trim() : '', aniversario: cols[2] ? cols[2].trim() : '', pontos: parseInt(cols[3]) || 0 };
        }
        return null;
      }).filter(Boolean);

      if (novos.length > 0) {
        setClientesFidelidade([...clientesFidelidade, ...novos]);
        setMostrarModalImportacao(false);
        setTextoImportacao('');
        mostrarAlerta("Sucesso", `${novos.length} clientes importados com sucesso!`);
      } else { mostrarAlerta("Aviso", "Nenhum cliente válido encontrado na tabela."); }
    } catch(e) { mostrarAlerta("Erro", "Formato inválido. Siga o modelo: Nome, Telefone, Aniversário, Pontos."); }
  };

  return (
    <div className="flex-1 animate-in slide-in-from-bottom-4 duration-500 w-full max-w-7xl mx-auto px-2 lg:px-0 pb-10">
      
      <div className={`p-6 rounded-3xl shadow-sm border mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
        <div>
           <h2 className={`text-xl font-black flex items-center gap-2 uppercase tracking-wide ${temaNoturno ? 'text-white' : 'text-gray-900'}`}>
             <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
             Gestão de Clientes
           </h2>
           <p className={`text-xs font-bold uppercase tracking-widest mt-1 ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`}>Controle de Retenção e Relacionamento</p>
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button onClick={() => setMostrarModalImportacao(true)} className={`flex-1 md:flex-none px-4 py-2.5 rounded-xl font-bold text-xs uppercase transition shadow-sm border ${temaNoturno ? 'bg-gray-900 border-gray-700 text-gray-300 hover:bg-gray-700' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'}`}>
            Importar Excel
          </button>
          <button onClick={() => setMostrarModalNovo(true)} className="flex-1 md:flex-none px-4 py-2.5 rounded-xl font-bold text-xs uppercase bg-purple-600 hover:bg-purple-700 text-white shadow-md transition">
            + Cadastrar Cliente
          </button>
        </div>
      </div>

      <div className={`flex p-1 rounded-xl mb-6 border w-full lg:w-fit ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
        <button onClick={() => setAbaInterna('clientes')} className={`flex-1 lg:px-8 py-2 text-xs font-bold rounded-lg transition uppercase tracking-wider ${abaInterna === 'clientes' ? (temaNoturno ? 'bg-gray-700 text-white shadow-sm' : 'bg-white text-purple-700 shadow-sm') : (temaNoturno ? 'text-gray-500 hover:text-gray-300' : 'text-gray-500 hover:text-purple-600')}`}>Base</button>
        <button onClick={() => setAbaInterna('ranking')} className={`flex-1 lg:px-8 py-2 text-xs font-bold rounded-lg transition uppercase tracking-wider ${abaInterna === 'ranking' ? (temaNoturno ? 'bg-gray-700 text-white shadow-sm' : 'bg-white text-purple-700 shadow-sm') : (temaNoturno ? 'text-gray-500 hover:text-gray-300' : 'text-gray-500 hover:text-purple-600')}`}>Ranking</button>
        <button onClick={() => setAbaInterna('config')} className={`flex-1 lg:px-8 py-2 text-xs font-bold rounded-lg transition uppercase tracking-wider ${abaInterna === 'config' ? (temaNoturno ? 'bg-gray-700 text-white shadow-sm' : 'bg-white text-purple-700 shadow-sm') : (temaNoturno ? 'text-gray-500 hover:text-gray-300' : 'text-gray-500 hover:text-purple-600')}`}>Regras</button>
        {(sessao?.role === 'dono' || sessao?.perm_estudo) && (
          <button onClick={() => setAbaInterna('publico')} className={`flex-1 lg:px-8 py-2 text-xs font-bold rounded-lg transition uppercase tracking-wider ${abaInterna === 'publico' ? (temaNoturno ? 'bg-gray-700 text-white shadow-sm' : 'bg-white text-purple-700 shadow-sm') : (temaNoturno ? 'text-gray-500 hover:text-gray-300' : 'text-gray-500 hover:text-purple-600')}`}>Público-Alvo</button>
        )}
      </div>

      {abaInterna === 'clientes' && (
        <div className={`p-6 rounded-3xl border shadow-sm flex flex-col min-h-[400px] ${temaNoturno ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
          <div className="mb-6 relative">
            <svg className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${temaNoturno ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            <input type="text" placeholder="Pesquisar registro..." value={busca} onChange={e => setBusca(e.target.value)} className={`w-full pl-12 pr-4 py-3 rounded-xl border outline-none font-bold text-sm transition focus:border-purple-500 ${temaNoturno ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 placeholder-gray-400'}`} />
          </div>
          
          <div className="overflow-x-auto flex-1">
            {clientesFiltrados.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-10 opacity-50">
                <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                <p className="font-bold uppercase tracking-widest text-sm">Registro Vazio</p>
                <p className="text-xs mt-1">Nenhum cliente cadastrado ou localizado na pesquisa.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className={`border-b text-[10px] font-black uppercase tracking-widest ${temaNoturno ? 'border-gray-800 text-gray-500' : 'border-gray-200 text-gray-400'}`}>
                    <th className="p-4 rounded-tl-xl">Nome do Cliente</th>
                    <th className="p-4">Dados de Contato</th>
                    <th className="p-4">Métricas de Fidelidade</th>
                    <th className="p-4 text-right rounded-tr-xl">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {clientesFiltrados.map(c => {
                    const progresso = Math.min((c.pontos / meta.pontos_necessarios) * 100, 100);
                    const atingiuMeta = c.pontos >= meta.pontos_necessarios;
                    return (
                      <tr key={c.id} className={`border-b last:border-0 hover:bg-gray-50/50 transition-colors ${temaNoturno ? 'border-gray-800 hover:bg-gray-800/50 text-gray-300' : 'border-gray-50 text-gray-700'}`}>
                        <td className="p-4">
                          <p className={`font-black text-sm uppercase ${temaNoturno ? 'text-gray-200' : 'text-gray-900'}`}>{c.nome}</p>
                          {atingiuMeta && <p className="text-[10px] font-bold text-purple-500 mt-0.5 uppercase tracking-widest">Apto a Prêmio</p>}
                        </td>
                        <td className="p-4 text-xs font-bold opacity-80">
                          {c.telefone && <p>Tel: {c.telefone}</p>}
                          {c.aniversario && <p className="mt-0.5">Nasc: {c.aniversario.split('-').reverse().join('/')}</p>}
                        </td>
                        <td className="p-4">
                          <div className="w-full max-w-[150px]">
                            <div className={`w-full rounded-full h-1.5 mb-1.5 overflow-hidden ${temaNoturno ? 'bg-gray-800' : 'bg-gray-200'}`}>
                              <div className={`h-1.5 rounded-full transition-all duration-1000 ${atingiuMeta ? 'bg-green-500' : 'bg-purple-500'}`} style={{ width: `${progresso}%` }}></div>
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-bold">
                              <span className={temaNoturno ? 'text-gray-400' : 'text-gray-500'}>{c.pontos} Pts Acumulados</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <button className={`px-4 py-1.5 rounded-lg text-xs font-bold transition border ${temaNoturno ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>Editar</button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {abaInterna === 'ranking' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={`p-6 rounded-3xl border shadow-sm ${temaNoturno ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
            <h3 className={`font-black text-sm mb-6 uppercase tracking-widest flex items-center gap-2 ${temaNoturno ? 'text-white' : 'text-gray-800'}`}>
              <svg className="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
              Ranking de Clientes
            </h3>
            
            {ranking.length === 0 ? (
              <p className="text-sm text-gray-500 font-bold">Sem dados suficientes para ranking.</p>
            ) : (
              <div className="space-y-3">
                {ranking.map((c, idx) => (
                  <div key={c.id} className={`flex justify-between items-center p-3 rounded-xl border transition ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
                    <div className="flex items-center gap-4">
                      <div className={`text-sm font-black w-6 text-center ${idx < 3 ? 'text-purple-500' : (temaNoturno ? 'text-gray-500' : 'text-gray-400')}`}>#{idx + 1}</div>
                      <span className={`font-black text-xs uppercase ${temaNoturno ? 'text-gray-200' : 'text-gray-800'}`}>{c.nome}</span>
                    </div>
                    <span className={`font-black px-3 py-1 rounded-md text-[10px] uppercase tracking-wider ${temaNoturno ? 'bg-gray-900 text-gray-400' : 'bg-white text-gray-600 border border-gray-200'}`}>
                      {c.pontos} Pts
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {abaInterna === 'config' && (
        <div className={`p-6 rounded-3xl border shadow-sm max-w-lg ${temaNoturno ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
          <h3 className={`font-black text-sm mb-6 uppercase tracking-widest ${temaNoturno ? 'text-white' : 'text-gray-900'}`}>Diretrizes de Retenção</h3>
          <div className="space-y-5">
            <div>
              <label className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2 block">Pontos necessários para o prêmio</label>
              <input type="number" value={meta.pontos_necessarios} onChange={e => setMeta({...meta, pontos_necessarios: e.target.value})} className={`w-full p-3 rounded-xl border outline-none font-bold text-sm transition focus:border-purple-500 ${temaNoturno ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`} />
            </div>
            <div>
              <label className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2 block">Prêmio Oferecido</label>
              <input type="text" value={meta.premio} onChange={e => setMeta({...meta, premio: e.target.value})} className={`w-full p-3 rounded-xl border outline-none font-bold text-sm transition focus:border-purple-500 ${temaNoturno ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`} />
            </div>
            <button className="w-full py-4 mt-4 rounded-xl font-black uppercase text-xs tracking-widest bg-purple-600 hover:bg-purple-700 text-white shadow-md active:scale-95 transition-all">
              Atualizar Sistema
            </button>
          </div>
        </div>
      )}

      {abaInterna === 'publico' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={`p-6 rounded-3xl shadow-sm border flex flex-col h-[400px] md:col-span-2 lg:col-span-1 ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
            <h3 className={`text-sm font-black uppercase tracking-widest mb-4 text-center ${temaNoturno ? 'text-white' : 'text-gray-900'}`}>Inteligência de Tags</h3>
            {dadosTags && dadosTags.length > 0 ? (
              <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dadosTags} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="nome" type="category" axisLine={false} tickLine={false} tick={{fill: temaNoturno ? '#9ca3af' : '#6b7280', fontSize: 10, fontWeight: 'bold'}} width={120} />
                    <RechartsTooltip cursor={{fill: temaNoturno ? '#374151' : '#f3f4f6'}} content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className={`p-3 shadow-xl rounded-xl border ${temaNoturno ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                              <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${temaNoturno ? 'text-gray-300' : 'text-gray-600'}`}>{data.nome}</p>
                              <p className="text-sm font-bold text-purple-500">{data.qtd} comandas</p>
                            </div>
                          );
                        } return null;
                      }} 
                    />
                    <Bar dataKey="qtd" radius={[0, 4, 4, 0]} barSize={20} label={{ position: 'right', formatter: (val) => `${val} cmds`, fill: temaNoturno ? '#9ca3af' : '#6b7280', fontSize: 10, fontWeight: 'bold' }}>
                      {dadosTags.map((entry, index) => <Cell key={`cell-${index}`} fill={CORES_VIBRANTES[index % CORES_VIBRANTES.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : <div className={`flex-1 flex items-center justify-center text-sm font-bold ${temaNoturno ? 'text-gray-600' : 'text-gray-400'}`}>As comandas não receberam tags.</div>}
          </div>
        </div>
      )}

      {/* MODAL NOVO CLIENTE CORPORATIVO */}
      {mostrarModalNovo && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className={`w-full max-w-md p-8 rounded-3xl border shadow-2xl ${temaNoturno ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
            <h2 className={`text-xl font-black mb-6 uppercase tracking-widest ${temaNoturno ? 'text-white' : 'text-gray-900'}`}>Cadastrar Registro</h2>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-1 mb-1 block">Nome do Cliente</label>
                <input type="text" placeholder="Ex: Lucas Arruda" value={novoCliente.nome} onChange={e => setNovoCliente({...novoCliente, nome: e.target.value})} className={`w-full p-3 rounded-xl border outline-none font-bold text-sm transition focus:border-purple-500 ${temaNoturno ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`} />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-1 mb-1 block">Contato (WhatsApp)</label>
                <input type="text" placeholder="Ex: 84999999999" value={novoCliente.telefone} onChange={e => setNovoCliente({...novoCliente, telefone: e.target.value})} className={`w-full p-3 rounded-xl border outline-none font-bold text-sm transition focus:border-purple-500 ${temaNoturno ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`} />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-1 mb-1 block">Data de Nascimento</label>
                <input type="date" value={novoCliente.aniversario} onChange={e => setNovoCliente({...novoCliente, aniversario: e.target.value})} className={`w-full p-3 rounded-xl border outline-none font-bold text-sm transition focus:border-purple-500 color-scheme-dark ${temaNoturno ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`} />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-1 mb-1 block">Saldo de Pontos Iniciais</label>
                <input type="number" placeholder="Ex: 0" value={novoCliente.pontos} onChange={e => setNovoCliente({...novoCliente, pontos: parseInt(e.target.value) || 0})} className={`w-full p-3 rounded-xl border outline-none font-bold text-sm transition focus:border-purple-500 ${temaNoturno ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`} />
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setMostrarModalNovo(false)} className={`flex-1 py-3 rounded-xl font-bold uppercase text-[10px] tracking-widest transition ${temaNoturno ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Cancelar</button>
              <button onClick={salvarNovoCliente} className="flex-1 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest bg-purple-600 text-white shadow-md hover:bg-purple-700 active:scale-95 transition">Registrar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL IMPORTAÇÃO EM MASSA VIA IA/TEXTO */}
      {mostrarModalImportacao && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className={`w-full max-w-lg p-8 rounded-3xl border shadow-2xl ${temaNoturno ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
            <h2 className={`text-xl font-black mb-2 uppercase tracking-widest ${temaNoturno ? 'text-white' : 'text-gray-900'}`}>Importar Base de Dados</h2>
            <p className={`text-xs font-bold mb-6 leading-relaxed ${temaNoturno ? 'text-gray-400' : 'text-gray-500'}`}>
              Cole direto do Excel ou peça para uma IA formatar seus dados. <br/><br/>
              <span className="text-purple-500">Padrão esperado: Nome, Telefone, Data (AAAA-MM-DD), Pontos</span>
            </p>
            
            <textarea 
              rows="6"
              placeholder="Ex: Lucas Arruda, 84999999999, 1999-05-10, 5&#10;Hanilton, 84988888888, 1995-12-25, 2" 
              value={textoImportacao} 
              onChange={e => setTextoImportacao(e.target.value)} 
              className={`w-full p-4 rounded-xl border outline-none font-mono text-xs transition focus:border-purple-500 ${temaNoturno ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-600' : 'bg-gray-50 border-gray-200 placeholder-gray-400'}`} 
            />
            
            <div className="flex gap-3 mt-8">
              <button onClick={() => setMostrarModalImportacao(false)} className={`flex-1 py-3 rounded-xl font-bold uppercase text-[10px] tracking-widest transition ${temaNoturno ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Cancelar</button>
              <button onClick={processarImportacao} className="flex-1 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest bg-purple-600 text-white shadow-md hover:bg-purple-700 active:scale-95 transition">Processar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}