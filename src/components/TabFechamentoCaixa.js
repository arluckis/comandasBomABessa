// TabFechamentoCaixa.jsx
'use client';
import React, { useState } from 'react';
import dynamic from 'next/dynamic';

// Lógica de Negócio e Hooks
import { useFechamentoCaixa } from '@/hooks/useFechamentoCaixa';
import ErrorBoundary from './ui/ErrorBoundary';
import { SkeletonCardCaixa } from './TabFechamentoCaixa/SkeletonsCaixa';
import { renderIOSInput } from './TabFechamentoCaixa/WidgetsCaixa';

// Componentes Assíncronos Blindados com Alturas Independentes
const ApuracaoSistema = dynamic(() => import('./TabFechamentoCaixa/WidgetsCaixa').then(m => m.ApuracaoSistema), { ssr: false, loading: () => <SkeletonCardCaixa altura="min-h-[300px]" /> });
const DeclaracaoFisica = dynamic(() => import('./TabFechamentoCaixa/WidgetsCaixa').then(m => m.DeclaracaoFisica), { ssr: false, loading: () => <SkeletonCardCaixa altura="min-h-[300px]" /> });
const AcertoMotoboys = dynamic(() => import('./TabFechamentoCaixa/WidgetsCaixa').then(m => m.AcertoMotoboys), { ssr: false, loading: () => <SkeletonCardCaixa altura="min-h-[300px]" /> });

export default function TabFechamentoCaixa({ temaNoturno, sessao, caixaAtual, comandas, fetchData, mostrarAlerta }) {
  
  const [modalConfirm, setModalConfirm] = useState({ visivel: false, titulo: '', mensagem: '', onConfirm: null });
  
  const localMostrarConfirmacao = (titulo, mensagem, onConfirm) => {
    setModalConfirm({ visivel: true, titulo, mensagem, onConfirm });
  };

  const ctx = useFechamentoCaixa({ 
    sessao, 
    caixaAtual, 
    comandas, 
    fetchData, 
    mostrarAlerta, 
    mostrarConfirmacao: localMostrarConfirmacao
  });

  const bgPrincipal = temaNoturno ? 'bg-[#0A0A0A]' : 'bg-[#FAFAFA]';
  const textPrincipal = temaNoturno ? 'text-zinc-100' : 'text-zinc-900';
  const textSecundario = temaNoturno ? 'text-zinc-400' : 'text-zinc-500'; 
  const bordaDestaque = temaNoturno ? 'border-white/[0.06]' : 'border-black/[0.06]';
  
  const btnAROXPrimario = `px-5 py-2.5 rounded-xl text-[12px] font-semibold tracking-wide transition-all shadow-sm flex items-center justify-center gap-2 active:scale-[0.98] border ${temaNoturno ? 'bg-zinc-100 text-black border-transparent hover:bg-white hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]' : 'bg-zinc-900 text-white border-transparent hover:bg-black hover:shadow-md'}`;
  const btnAROXSecundario = `px-5 py-2.5 rounded-xl text-[12px] font-medium tracking-wide transition-all shadow-sm flex items-center justify-center gap-2 active:scale-[0.98] border ${temaNoturno ? 'bg-[#151515] border-white/10 text-zinc-300 hover:text-white hover:bg-[#1A1A1A]' : 'bg-white border-black/10 text-zinc-700 hover:text-black hover:bg-zinc-50'}`;
  const cardHistoricoStyle = `relative p-6 md:p-8 rounded-[24px] transition-all duration-400 border backdrop-blur-xl shadow-sm hover:-translate-y-[2px] hover:shadow-lg overflow-hidden flex flex-col w-full arox-cinematic ${temaNoturno ? 'bg-[#111111]/80 border-white/[0.06] hover:border-white/[0.1]' : 'bg-white/80 border-black/[0.04] hover:border-black/[0.08]'}`;

  const tabs = [{ id: 'atual', label: 'Ciclo Operacional' }, { id: 'historico', label: 'Trilha de Auditoria' }];

  const percentRecebido = ctx.totaisDossie?.devido > 0 ? Math.min(100, (ctx.totaisDossie.pago / ctx.totaisDossie.devido) * 100) : 0;

  return (
    <div className={`w-full h-full flex flex-col relative font-sans overflow-hidden arox-cinematic ${bgPrincipal} ${textPrincipal}`}>
      <style dangerouslySetInnerHTML={{__html: `
        .arox-cinematic { animation: arox-fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; transform: translateY(10px); }
        @keyframes arox-fade-up { 100% { opacity: 1; transform: translateY(0); } }
        .arox-scale-in { animation: arox-zoom 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
        @keyframes arox-zoom { 0% { transform: scale(0.97); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />

      <div className={`relative z-10 flex flex-col gap-6 w-full h-full max-w-[1400px] mx-auto`}>
        <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 shrink-0 border-b mt-2 mb-2 ${bordaDestaque}`}>
          <div className="flex flex-wrap items-center gap-6">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => { if (!ctx.senhaModal.visivel && !ctx.movModal.visivel && !ctx.modalEdicao.visivel) ctx.setAbaInterna(tab.id); }} className={`relative py-2 text-[13px] font-semibold tracking-wide transition-colors duration-300 ${ctx.abaInterna === tab.id ? (temaNoturno ? 'text-zinc-100' : 'text-zinc-900') : `${textSecundario} hover:${textPrincipal}`}`}>
                {tab.label}
                {ctx.abaInterna === tab.id && <div className="absolute -bottom-[17px] left-0 right-0 h-[2px] rounded-t-full bg-emerald-500 shadow-[0_-2px_10px_rgba(16,185,129,0.5)]" />}
              </button>
            ))}
          </div>
          {ctx.abaInterna === 'atual' && caixaAtual?.status === 'aberto' && (
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto arox-cinematic" style={{animationDelay: '0ms'}}>
              <button onClick={() => ctx.setMovModal({ visivel: true, tipo: 'suprimento', valor: '', descricao: '' })} className={`${btnAROXPrimario} flex-1 md:flex-none justify-center`}><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path></svg> Entrada Extra</button>
              <button onClick={() => ctx.setMovModal({ visivel: true, tipo: 'sangria', valor: '', descricao: '' })} className={`${btnAROXSecundario} flex-1 md:flex-none justify-center`}><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 12H4"></path></svg> Retirada (Sangria)</button>
            </div>
          )}
        </div>

        <main className="flex-1 min-w-0 w-full relative overflow-y-auto scrollbar-hide pb-24">
            <div className={`w-full ${ctx.abaInterna === 'atual' ? 'block' : 'hidden'}`}>
              {caixaAtual?.status === 'aberto' ? (
                <div className="flex flex-col gap-6 w-full">
                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 w-full">
                    
                    <ErrorBoundary codigoErro="ERR-CAIXA-APUR-101" modulo="Apuração Sistema" temaNoturno={temaNoturno} fallbackClassName="w-full h-full min-h-[300px]">
                       <ApuracaoSistema temaNoturno={temaNoturno} mostrarEsperado={ctx.mostrarEsperado} setMostrarEsperado={ctx.setMostrarEsperado} saldoGavetaEsperado={ctx.saldoGavetaEsperado} saldoInicial={ctx.saldoInicial} totalSistemaDinheiro={ctx.totalSistemaDinheiro} totalSuprimentos={ctx.totalSuprimentos} totalSangrias={ctx.totalSangrias} totalSistemaCartao={ctx.totalSistemaCartao} totalSistemaPix={ctx.totalSistemaPix} senhaApuracao={ctx.senhaApuracao} setSenhaApuracao={ctx.setSenhaApuracao} handleVerificarSenhaApuracao={ctx.handleVerificarSenhaApuracao} setExtratoExpandido={ctx.setExtratoExpandido} />
                    </ErrorBoundary>

                    <ErrorBoundary codigoErro="ERR-CAIXA-DECL-202" modulo="Declaração Física" temaNoturno={temaNoturno} fallbackClassName="w-full h-full min-h-[300px]">
                       <DeclaracaoFisica temaNoturno={temaNoturno} valorInformadoDinheiro={ctx.valorInformadoDinheiro} setValorInformadoDinheiro={ctx.setValorInformadoDinheiro} valorInformadoCartao={ctx.valorInformadoCartao} setValorInformadoCartao={ctx.setValorInformadoCartao} valorInformadoPix={ctx.valorInformadoPix} setValorInformadoPix={ctx.setValorInformadoPix} />
                    </ErrorBoundary>

                    <ErrorBoundary codigoErro="ERR-CAIXA-MOTO-303" modulo="Acerto Motoboys" temaNoturno={temaNoturno} fallbackClassName="w-full h-full min-h-[300px]">
                       <AcertoMotoboys temaNoturno={temaNoturno} motoboyAtivo={ctx.motoboyAtivo} toggleMotoboy={ctx.toggleMotoboy} pendenteMotoboy={ctx.pendenteMotoboy} abrirConfirmacaoMotoboy={ctx.abrirConfirmacaoMotoboy} />
                    </ErrorBoundary>

                  </div>
                  <div className="pt-6 pb-12 w-full max-w-[400px] mx-auto arox-cinematic" style={{animationDelay: '100ms'}}>
                    <button 
                      onClick={() => localMostrarConfirmacao('Fechar Ciclo', 'Confirma o encerramento do ciclo atual?', ctx.encerrarCaixaConfirmado)} 
                      disabled={ctx.isConsolidating} 
                      className={`relative w-full py-4 rounded-xl text-[13px] font-semibold tracking-wide transition-all duration-200 active:scale-[0.98] shadow-md border disabled:opacity-80 flex justify-center items-center gap-3 ${temaNoturno ? 'bg-zinc-100 text-black border-transparent hover:bg-white hover:shadow-[0_0_20px_rgba(255,255,255,0.15)]' : 'bg-zinc-900 text-white border-transparent hover:bg-black hover:shadow-lg'}`}
                    >
                      {ctx.isConsolidating ? <><svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Consolidando...</> : 'Confirmar e Fechar Ciclo'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[50vh] w-full"><div className="text-center arox-cinematic"><div className={`w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center border shadow-sm ${temaNoturno ? 'bg-[#111111] border-white/[0.08] text-zinc-500' : 'bg-white border-black/[0.05] text-zinc-400'}`}><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg></div><p className={`text-[18px] font-semibold tracking-tight mb-1 ${temaNoturno ? 'text-zinc-200' : 'text-zinc-800'}`}>Ciclo Fechado</p><p className={`text-[13px] font-medium ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>Nenhuma sessão operacional aberta no momento.</p></div></div>
              )}
            </div>

            <div className={`w-full ${ctx.abaInterna === 'historico' ? 'block' : 'hidden'}`}>
                {!ctx.historicoLiberado ? (
                  <div className="flex flex-col items-center justify-center h-[60vh] w-full max-w-[340px] mx-auto arox-cinematic">
                    <div className={`w-20 h-20 mb-8 rounded-[24px] flex items-center justify-center border shadow-xl ${temaNoturno ? 'bg-[#111111] border-white/10 text-zinc-300' : 'bg-white border-black/10 text-zinc-700'}`}><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg></div>
                    <h2 className={`text-2xl font-semibold tracking-tight mb-2 ${temaNoturno ? 'text-white' : 'text-black'}`}>Acesso Restrito</h2>
                    <p className={`text-sm mb-8 font-medium text-center ${temaNoturno ? 'text-zinc-400' : 'text-zinc-500'}`}>Insira sua credencial gerencial para acessar a trilha de auditoria.</p>
                    <div className="w-full space-y-4">
                      {renderIOSInput(ctx.senhaHistorico, ctx.setSenhaHistorico, ctx.handleVerificarSenhaHistorico, temaNoturno)}
                      <button onClick={ctx.handleVerificarSenhaHistorico} className={`w-full py-4 rounded-[16px] text-[12px] font-semibold tracking-wide transition-all active:scale-[0.98] shadow-md border ${temaNoturno ? 'bg-zinc-100 text-black border-transparent hover:bg-white' : 'bg-zinc-900 text-white border-transparent hover:bg-black'}`}>Validar Acesso</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 border-b pb-4 border-transparent arox-cinematic" style={{animationDelay: '0ms'}}>
                      <div className={`flex items-center p-1.5 rounded-xl border ${temaNoturno ? 'bg-[#111111] border-white/[0.06]' : 'bg-white border-black/[0.06]'}`}>
                        <button onClick={() => ctx.alterarData(-1)} className={`p-2.5 rounded-lg active:scale-95 transition-colors ${temaNoturno ? 'hover:bg-white/[0.08] text-zinc-400 hover:text-white' : 'hover:bg-black/[0.05] text-zinc-500 hover:text-black'}`}><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg></button>
                        <span className={`min-w-[140px] text-center text-[12px] font-semibold tracking-wide ${temaNoturno ? 'text-zinc-200' : 'text-zinc-800'}`}>{ctx.renderDataLabel()}</span>
                        <button onClick={() => ctx.alterarData(1)} disabled={ctx.isHoje} className={`p-2.5 rounded-lg active:scale-95 transition-colors disabled:opacity-20 ${temaNoturno ? 'hover:bg-white/[0.08] text-zinc-400 hover:text-white' : 'hover:bg-black/[0.05] text-zinc-500 hover:text-black'}`}><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg></button>
                      </div>
                    </div>
                    {ctx.historicoCaixas.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-[30vh] text-center border-t border-dashed pt-10 mt-2 w-full arox-cinematic"><p className={`text-sm font-medium ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}`}>Nenhum fechamento registrado nesta data.</p></div>
                    ) : (
                      <ErrorBoundary codigoErro="ERR-CAIXA-HIST-404" modulo="Trilha Auditoria" temaNoturno={temaNoturno} fallbackClassName="w-full h-full min-h-[300px]">
                        <div className="relative pt-2 w-full">
                          <div className={`absolute top-6 bottom-12 left-[19px] md:left-[27px] w-[2px] rounded-full ${temaNoturno ? 'bg-gradient-to-b from-white/[0.1] to-transparent' : 'bg-gradient-to-b from-black/[0.1] to-transparent'}`} />
                          <div className="flex flex-col gap-6 relative z-10 w-full">
                            {ctx.historicoCaixas.map((caixa, index) => {
                              const isEstornado = caixa.status === 'estornado'; const diferenca = caixa.relatorio_fechamento?.diferencaDinheiro || 0; const isDiferenca = diferenca !== 0;
                              let corMarcador = temaNoturno ? 'bg-zinc-400 ring-[#0A0A0A]' : 'bg-zinc-400 ring-[#FAFAFA]';
                              if (isEstornado) corMarcador = 'bg-rose-500 ring-rose-500/20'; else if (isDiferenca) corMarcador = diferenca > 0 ? 'bg-emerald-500 ring-emerald-500/20' : 'bg-amber-500 ring-amber-500/20';
                              return (
                                <div key={caixa.id} className="relative pl-12 md:pl-16 group w-full arox-cinematic" style={{animationDelay: `${index * 50 + 50}ms`}}>
                                  <div className={`absolute left-[14px] md:left-[22px] top-[34px] w-3 h-3 rounded-full ring-[6px] transition-transform duration-300 group-hover:scale-125 ${corMarcador}`} />
                                  <div className={`${cardHistoricoStyle} ${isEstornado ? (temaNoturno ? 'bg-rose-950/5 border-rose-500/10 opacity-70 grayscale-[20%]' : 'bg-rose-50/50 border-rose-200/50 opacity-70 grayscale-[20%]') : ''}`}>
                                    <div className="relative z-10 flex flex-col gap-6">
                                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5 border-zinc-500/10">
                                        <div>
                                          <div className="flex items-center gap-3 mb-1.5">
                                            <h3 className={`text-[16px] font-semibold tracking-tight ${temaNoturno ? 'text-zinc-100' : 'text-zinc-900'}`}>{isEstornado ? 'Ciclo Estornado' : 'Fechamento de Ciclo'}</h3>
                                            {isEstornado ? <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold tracking-wide border ${temaNoturno ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-rose-50 text-rose-600 border-rose-200/50'}`}>Anulado</span> : isDiferenca ? <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold tracking-wide border ${diferenca > 0 ? (temaNoturno ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border-emerald-200/50') : (temaNoturno ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-amber-50 text-amber-600 border-amber-200/50')}`}>{diferenca > 0 ? 'Sobra de Dinheiro' : 'Falta de Dinheiro'}</span> : <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold tracking-wide border ${temaNoturno ? 'bg-white/5 text-zinc-300 border-white/10' : 'bg-black/5 text-zinc-600 border-black/5'}`}>Conciliado</span>}
                                          </div>
                                          <p className={`text-[13px] flex items-center font-medium gap-2 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}><span>Aberto às {ctx.formatarHora(caixa.data_abertura)}</span><span className="w-1 h-1 rounded-full bg-current opacity-40" /><span>Fechado às {ctx.formatarHora(caixa.data_fechamento)}</span></p>
                                        </div>
                                        {!isEstornado && (
                                          <div className="flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300">
                                            <button onClick={() => { ctx.setCaixaEditando(caixa); ctx.setAcaoPendente('editar_fechamento'); ctx.setSenhaModal({ visivel: true, senha: '' }); }} className={`px-4 py-2 rounded-xl text-[11px] font-semibold tracking-wide border shadow-sm ${temaNoturno ? 'bg-[#151515] border-white/10 text-zinc-300 hover:text-white hover:bg-[#1A1A1A]' : 'bg-white border-black/10 text-zinc-600 hover:text-black hover:bg-zinc-50'}`}>Editar</button>
                                            <button onClick={() => { ctx.setCaixaEditando(caixa); ctx.setAcaoPendente('excluir_fechamento'); ctx.setSenhaModal({ visivel: true, senha: '' }); }} className={`px-4 py-2 rounded-xl text-[11px] font-semibold tracking-wide border shadow-sm ${temaNoturno ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20' : 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100'}`}>Estornar</button>
                                          </div>
                                        )}
                                      </div>
                                      <div className={`grid grid-cols-2 sm:grid-cols-4 gap-6 ${isEstornado ? 'opacity-50' : ''}`}>
                                        <div><p className={`text-[11px] font-medium mb-1.5 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>Dinheiro Informado</p><p className={`text-[16px] font-black tracking-tight tabular-nums ${temaNoturno ? 'text-zinc-200' : 'text-zinc-800'}`}>R$ {(caixa.relatorio_fechamento?.informadoDinheiro || 0).toFixed(2)}</p></div>
                                        <div><p className={`text-[11px] font-medium mb-1.5 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>Total Digital</p><p className={`text-[16px] font-black tracking-tight tabular-nums ${temaNoturno ? 'text-zinc-200' : 'text-zinc-800'}`}>R$ {((caixa.relatorio_fechamento?.informadoCartao || 0) + (caixa.relatorio_fechamento?.informadoPix || 0)).toFixed(2)}</p></div>
                                        <div className="col-span-2 sm:text-right">
                                          {isDiferenca && !isEstornado && (
                                            <><p className={`text-[11px] font-medium mb-1.5 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>Diferença em Espécie</p><p className={`text-[20px] font-black tracking-tight tabular-nums ${diferenca > 0 ? 'text-emerald-500' : 'text-amber-500'}`}>{diferenca > 0 ? '+' : '-'} R$ {Math.abs(diferenca).toFixed(2)}</p></>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </ErrorBoundary>
                    )}
                  </>
                )}
            </div>
        </main>
      </div>

      {/* SUPERFÍCIE DOSSIÊ DE AUDITORIA (INTEGRADA E FULL-AREA) */}
      {ctx.extratoExpandido && (
        <ErrorBoundary codigoErro="ERR-CAIXA-EXTR-505" modulo="Dossiê Auditoria" temaNoturno={temaNoturno} fallbackClassName="absolute inset-0 z-[100]">
          <div className={`absolute inset-0 z-[100] flex flex-col animate-in fade-in duration-300 ${temaNoturno ? 'bg-[#0A0A0A]' : 'bg-[#FAFAFA]'}`}>
            
            <div className="relative w-full h-full flex flex-col overflow-hidden">
              
              {/* TOPO DA SUPERFÍCIE */}
              <div className={`shrink-0 px-6 py-5 md:px-8 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between z-20 gap-4 ${temaNoturno ? 'bg-[#0A0A0A] border-white/[0.06]' : 'bg-[#FAFAFA] border-black/[0.05]'}`}>
                <div>
                  <h2 className={`text-xl md:text-2xl font-semibold tracking-tight ${temaNoturno ? 'text-zinc-100' : 'text-zinc-900'}`}>Dossiê de Auditoria</h2>
                  <p className={`text-sm mt-0.5 font-medium ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>Visão consolidada do ciclo operacional ativo.</p>
                </div>
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <div className={`relative flex items-center w-full sm:w-72 h-11 rounded-xl border px-3 transition-colors ${temaNoturno ? 'bg-[#111111] border-white/[0.08] focus-within:border-white/[0.15]' : 'bg-white border-black/[0.08] focus-within:border-black/[0.15] shadow-sm'}`}>
                    <svg className={`w-4 h-4 mr-2.5 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    <input type="text" placeholder="Localizar operação..." value={ctx.buscaExtrato} onChange={(e) => ctx.setBuscaExtrato(e.target.value)} className={`w-full h-full bg-transparent outline-none text-[13px] font-medium ${temaNoturno ? 'text-zinc-200 placeholder-zinc-600' : 'text-zinc-800 placeholder-zinc-400'}`} />
                  </div>
                  <button onClick={() => ctx.setExtratoExpandido(false)} className={`shrink-0 p-2.5 rounded-xl border transition-colors ${temaNoturno ? 'bg-[#111111] border-white/[0.08] hover:bg-white/10 text-zinc-400 hover:text-zinc-200' : 'bg-white border-black/[0.08] hover:bg-black/5 text-zinc-500 hover:text-zinc-800 shadow-sm'}`}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>

              {/* GRID INTERNA */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8 scrollbar-hide relative">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start relative">
                  
                  {/* COLUNA ESQUERDA (FIXA/INTELIGENTE) */}
                  <div className="lg:col-span-4 flex flex-col gap-6 lg:sticky lg:top-0 lg:h-[calc(100vh-140px)]">
                    
                    {/* CARD 1 - RESUMO FINANCEIRO */}
                    <div className={`p-6 md:p-8 rounded-[20px] md:rounded-[24px] border shadow-sm transition-all hover:shadow-md ${temaNoturno ? 'bg-[#111111] border-white/[0.06]' : 'bg-white border-black/[0.04]'}`}>
                        <h3 className={`text-[13px] font-semibold mb-6 ${temaNoturno ? 'text-zinc-400' : 'text-zinc-500'}`}>Resumo Financeiro</h3>
                        
                        <div className="flex flex-col gap-8">
                          <div>
                            <p className={`text-[13px] font-medium mb-1 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>Valor Faturado</p>
                            <p className={`text-4xl md:text-[40px] font-black tracking-tighter tabular-nums ${temaNoturno ? 'text-white' : 'text-zinc-900'}`}>R$ {ctx.totaisDossie.devido.toFixed(2)}</p>
                          </div>

                          <div className="w-full flex flex-col gap-2">
                             <div className="w-full h-1.5 rounded-full overflow-hidden flex bg-zinc-500/20">
                                <div className="h-full bg-emerald-500 transition-all duration-1000 ease-out" style={{ width: `${percentRecebido}%` }} />
                             </div>
                             <div className="flex justify-between items-center text-[11px] font-semibold">
                                <span className={temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}>Progresso de Recebimento</span>
                                <span className={temaNoturno ? 'text-zinc-400' : 'text-zinc-500'}>{percentRecebido.toFixed(0)}%</span>
                             </div>
                          </div>

                          <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                            <div>
                               <p className={`text-[12px] font-medium mb-1 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>Recebido</p>
                               <p className="text-[18px] font-bold tracking-tight tabular-nums text-emerald-500">R$ {ctx.totaisDossie.pago.toFixed(2)}</p>
                            </div>
                            <div>
                               <p className={`text-[12px] font-medium mb-1 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>Excedente / Troco</p>
                               <p className="text-[18px] font-bold tracking-tight tabular-nums text-blue-500">R$ {ctx.totaisDossie.troco.toFixed(2)}</p>
                            </div>
                            <div className="col-span-2 pt-5 border-t border-dashed border-zinc-500/20">
                               <p className={`text-[12px] font-medium mb-1 ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>Pendência (Falta)</p>
                               <p className={`text-[20px] font-bold tracking-tight tabular-nums ${ctx.totaisDossie.pendente > 0 ? 'text-amber-500' : (temaNoturno ? 'text-zinc-400' : 'text-zinc-400')}`}>R$ {ctx.totaisDossie.pendente.toFixed(2)}</p>
                            </div>
                          </div>
                        </div>
                    </div>

                    {/* CARD 2 - MOVIMENTAÇÕES EXTRAS */}
                    <div className={`flex-1 p-6 md:p-8 rounded-[20px] md:rounded-[24px] border shadow-sm flex flex-col min-h-[250px] lg:min-h-0 overflow-hidden transition-all hover:shadow-md ${temaNoturno ? 'bg-[#111111] border-white/[0.06]' : 'bg-white border-black/[0.04]'}`}>
                        <div className="flex items-center justify-between mb-6">
                           <h3 className={`text-[13px] font-semibold ${temaNoturno ? 'text-zinc-400' : 'text-zinc-500'}`}>Movimentações Extras</h3>
                           <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${temaNoturno ? 'bg-white/5 text-zinc-400' : 'bg-black/5 text-zinc-500'}`}>{ctx.movimentacoes.length} registros</span>
                        </div>

                        {ctx.movimentacoes.length === 0 ? (
                          <div className="flex-1 flex items-center justify-center text-center">
                             <p className={`text-[13px] font-medium ${temaNoturno ? 'text-zinc-600' : 'text-zinc-400'}`}>Nenhuma movimentação<br/>extraordinária neste ciclo.</p>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-3 overflow-y-auto scrollbar-hide pr-1 pb-2">
                            {ctx.movimentacoes.map(m => (
                              <div key={m.id} className={`p-4 rounded-xl border flex justify-between items-center transition-colors ${temaNoturno ? 'bg-[#151515] border-white/[0.04] hover:bg-[#1A1A1A]' : 'bg-[#FAFAFA] border-black/[0.03] hover:bg-zinc-50'}`}>
                                <div className="flex items-center gap-3 truncate">
                                   <div className={`w-1.5 h-8 rounded-full shrink-0 ${m.tipo === 'sangria' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                                   <div className="flex flex-col truncate pr-3">
                                      <span className={`text-[11px] font-medium uppercase tracking-wide opacity-60 ${m.tipo === 'sangria' ? 'text-rose-500' : 'text-emerald-500'}`}>{m.tipo === 'sangria' ? 'Sangria' : 'Entrada Extra'}</span>
                                      <span className={`text-[14px] font-semibold truncate ${temaNoturno ? 'text-zinc-200' : 'text-zinc-800'}`}>{m.descricao}</span>
                                   </div>
                                </div>
                                <span className={`text-[15px] font-black tracking-tight shrink-0 tabular-nums ${m.tipo === 'sangria' ? 'text-rose-500' : 'text-emerald-500'}`}>
                                   {m.tipo === 'sangria' ? '-' : '+'} R$ {m.valor.toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                    </div>
                  </div>

                  {/* COLUNA DIREITA (FLUXO PRINCIPAL DE ROLAGEM) */}
                  <div className="lg:col-span-8 flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                       <h3 className={`text-[13px] font-semibold ${temaNoturno ? 'text-zinc-400' : 'text-zinc-500'}`}>Contas Vinculadas ({ctx.comandasExtratoFiltradas.length})</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4 pb-10">
                        {ctx.comandasExtratoFiltradas.length === 0 ? (
                          <div className={`py-24 text-center border border-dashed rounded-[24px] ${temaNoturno ? 'border-white/[0.08] bg-[#111111]/50' : 'border-black/[0.08] bg-white/50'}`}>
                             <p className={`text-[14px] font-medium ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>Nenhuma operação vinculada ao ciclo atual.<br/>Novas comandas aparecerão aqui automaticamente.</p>
                          </div>
                        ) : (
                          ctx.comandasExtratoFiltradas.map((c, idx) => (
                            <div key={c.id} className={`p-5 md:p-6 rounded-[20px] border shadow-sm flex flex-col sm:flex-row justify-between gap-6 transition-all duration-300 hover:-translate-y-[2px] hover:shadow-md arox-cinematic ${temaNoturno ? 'bg-[#111111] border-white/[0.06] hover:border-white/[0.12]' : 'bg-white border-black/[0.04] hover:border-black/[0.08]'}`} style={{animationDelay: `${idx * 15}ms`}}>
                              <div className="flex flex-col gap-2 flex-1 min-w-0 justify-center">
                                <div className="flex items-center gap-3">
                                   <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide border ${c.statusFinanceiro === 'PAGO' ? (temaNoturno ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700') : c.statusFinanceiro === 'PARCIAL' ? (temaNoturno ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-700') : (temaNoturno ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-700')}`}>
                                      {c.statusFinanceiro}
                                   </span>
                                   <span className={`text-[11px] font-medium uppercase tracking-wide ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}`}>
                                      {c.tipo}
                                   </span>
                                </div>
                                <h4 className={`text-[18px] font-semibold tracking-tight truncate mt-0.5 ${temaNoturno ? 'text-zinc-100' : 'text-zinc-900'}`}>{c.nome}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                   <span className={`text-[12px] font-medium ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>Itens: {(c.produtos || []).length}</span>
                                   {(c.pagamentos || []).length > 0 && (
                                     <>
                                        <span className="w-1 h-1 rounded-full bg-zinc-500 opacity-40"></span>
                                        <span className={`text-[12px] font-medium ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>Via: {Array.from(new Set((c.pagamentos || []).map(p => p.forma))).join(', ')}</span>
                                     </>
                                   )}
                                </div>
                              </div>
                              <div className="flex items-end sm:items-center gap-6 shrink-0">
                                <div className="flex flex-col gap-2 text-right w-full min-w-[150px]">
                                  <div className="flex justify-between sm:justify-end items-baseline gap-4 w-full">
                                     <span className={`text-[12px] font-medium ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>Total Devido</span>
                                     <span className={`text-[15px] font-bold tracking-tight tabular-nums ${temaNoturno ? 'text-zinc-200' : 'text-zinc-800'}`}>R$ {c.totalDevido.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between sm:justify-end items-baseline gap-4 w-full">
                                     <span className={`text-[12px] font-medium ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>Recebido</span>
                                     <span className={`text-[15px] font-bold tracking-tight tabular-nums ${c.totalPago > 0 ? 'text-emerald-500' : (temaNoturno ? 'text-zinc-400' : 'text-zinc-400')}`}>R$ {c.totalPago.toFixed(2)}</span>
                                  </div>
                                  {(c.troco > 0 || c.pendente > 0) && (
                                     <div className={`flex justify-between sm:justify-end items-baseline gap-4 w-full pt-2 mt-1 border-t border-dashed ${temaNoturno ? 'border-zinc-500/20' : 'border-zinc-500/20'}`}>
                                        <span className={`text-[12px] font-semibold ${c.troco > 0 ? 'text-blue-500' : 'text-amber-500'}`}>{c.troco > 0 ? 'Troco' : 'Pendente'}</span>
                                        <span className={`text-[16px] font-black tracking-tight tabular-nums ${c.troco > 0 ? 'text-blue-500' : 'text-amber-500'}`}>R$ {c.troco > 0 ? c.troco.toFixed(2) : c.pendente.toFixed(2)}</span>
                                     </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </ErrorBoundary>
      )}

      {/* MODAIS SIMPLES */}
      {ctx.movModal.visivel && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className={`absolute inset-0 transition-opacity backdrop-blur-md ${temaNoturno ? 'bg-[#000000]/60' : 'bg-zinc-900/40'}`} onClick={() => ctx.setMovModal({ visivel: false, tipo: '', valor: '', descricao: '' })} />
          <div className={`relative w-full max-w-[420px] p-8 md:p-10 rounded-[24px] shadow-2xl border arox-scale-in ${temaNoturno ? 'bg-[#111111] border-white/[0.08]' : 'bg-white backdrop-blur-2xl border-black/[0.05]'}`}>
            <h2 className="text-[20px] font-semibold tracking-tight mb-8">{ctx.movModal.tipo === 'sangria' ? 'Registrar Retirada' : 'Entrada Extraordinária'}</h2>
            <div className="space-y-6 mb-8">
              <div>
                <label className={`text-[12px] font-medium mb-2 block ${temaNoturno ? 'text-zinc-400' : 'text-zinc-500'}`}>Valor</label>
                <div className={`relative flex items-center bg-transparent rounded-xl border transition-colors ${temaNoturno ? 'border-white/[0.08] bg-[#151515] focus-within:border-white/[0.15]' : 'border-black/10 bg-white focus-within:border-black/20 shadow-sm'}`}><span className={`absolute left-4 font-semibold ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}`}>R$</span><input type="number" step="0.01" value={ctx.movModal.valor} onChange={e => ctx.setMovModal({...ctx.movModal, valor: e.target.value})} autoFocus className={`w-full bg-transparent py-3 pr-4 pl-12 outline-none font-bold tabular-nums ${temaNoturno ? 'text-white' : 'text-black'}`} /></div>
              </div>
              <div>
                <label className={`text-[12px] font-medium mb-2 block ${temaNoturno ? 'text-zinc-400' : 'text-zinc-500'}`}>Justificativa</label>
                <div className={`relative flex items-center bg-transparent rounded-xl border transition-colors ${temaNoturno ? 'border-white/[0.08] bg-[#151515] focus-within:border-white/[0.15]' : 'border-black/10 bg-white focus-within:border-black/20 shadow-sm'}`}><input type="text" value={ctx.movModal.descricao} onChange={e => ctx.setMovModal({...ctx.movModal, descricao: e.target.value})} className={`w-full bg-transparent py-3 px-4 outline-none font-medium ${temaNoturno ? 'text-white' : 'text-black'}`} /></div>
              </div>
            </div>
            <div className="flex justify-end gap-3"><button onClick={() => ctx.setMovModal({ visivel: false, tipo: '', valor: '', descricao: '' })} className={`px-5 py-2.5 rounded-xl text-[12px] font-medium transition-colors ${temaNoturno ? 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5' : 'text-zinc-600 hover:text-zinc-900 hover:bg-black/5'}`}>Cancelar</button><button onClick={ctx.handleSalvarMovimentacao} className={btnAROXPrimario}>Confirmar</button></div>
          </div>
        </div>
      )}

      {ctx.senhaModal.visivel && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className={`absolute inset-0 backdrop-blur-md ${temaNoturno ? 'bg-[#000000]/60' : 'bg-zinc-900/40'}`} onClick={() => ctx.setSenhaModal({ visivel: false, senha: '' })} />
          <div className={`relative w-full max-w-[420px] p-8 md:p-10 rounded-[24px] shadow-2xl border arox-scale-in ${temaNoturno ? 'bg-[#111111] border-white/[0.08]' : 'bg-white backdrop-blur-2xl border-black/[0.05]'}`}>
            <h2 className="text-[20px] font-semibold tracking-tight mb-2">Autenticação Necessária</h2>
            <p className={`text-[13px] mb-8 font-medium ${temaNoturno ? 'text-zinc-500' : 'text-zinc-500'}`}>Credencial gerencial obrigatória.</p>
            <div className="mb-8 w-full">{renderIOSInput(ctx.senhaModal.senha, (val) => ctx.setSenhaModal({...ctx.senhaModal, senha: val}), ctx.handleVerificarSenha, temaNoturno)}</div>
            <div className="flex justify-end gap-3"><button onClick={() => ctx.setSenhaModal({ visivel: false, senha: '' })} className={`px-5 py-2.5 rounded-xl text-[12px] font-medium transition-colors ${temaNoturno ? 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5' : 'text-zinc-600 hover:text-zinc-900 hover:bg-black/5'}`}>Cancelar</button><button onClick={ctx.handleVerificarSenha} className={btnAROXPrimario}>Autenticar</button></div>
          </div>
        </div>
      )}

      {ctx.modalEdicao.visivel && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className={`absolute inset-0 backdrop-blur-md ${temaNoturno ? 'bg-[#000000]/60' : 'bg-zinc-900/40'}`} onClick={() => ctx.setModalEdicao({ visivel: false, dinheiro: '', cartao: '', pix: '' })} />
          <div className={`relative w-full max-w-[420px] p-8 md:p-10 rounded-[24px] shadow-2xl border arox-scale-in ${temaNoturno ? 'bg-[#111111] border-white/[0.08]' : 'bg-white backdrop-blur-2xl border-black/[0.05]'}`}>
            <h2 className="text-[20px] font-semibold tracking-tight mb-8">Editar Valores Declarados</h2>
            <div className="space-y-6 mb-8">
              <div><label className={`text-[12px] font-medium mb-2 block ${temaNoturno ? 'text-zinc-400' : 'text-zinc-500'}`}>Dinheiro</label><div className={`relative flex items-center bg-transparent rounded-xl border transition-colors ${temaNoturno ? 'border-white/[0.08] bg-[#151515] focus-within:border-white/[0.15]' : 'border-black/10 bg-white focus-within:border-black/20 shadow-sm'}`}><span className={`absolute left-4 font-semibold ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}`}>R$</span><input type="number" value={ctx.modalEdicao.dinheiro} onChange={e => ctx.setModalEdicao({...ctx.modalEdicao, dinheiro: e.target.value})} className={`w-full bg-transparent py-3 pr-4 pl-12 outline-none font-bold tabular-nums ${temaNoturno ? 'text-white' : 'text-black'}`} /></div></div>
              <div><label className={`text-[12px] font-medium mb-2 block ${temaNoturno ? 'text-zinc-400' : 'text-zinc-500'}`}>Cartão</label><div className={`relative flex items-center bg-transparent rounded-xl border transition-colors ${temaNoturno ? 'border-white/[0.08] bg-[#151515] focus-within:border-white/[0.15]' : 'border-black/10 bg-white focus-within:border-black/20 shadow-sm'}`}><span className={`absolute left-4 font-semibold ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}`}>R$</span><input type="number" value={ctx.modalEdicao.cartao} onChange={e => ctx.setModalEdicao({...ctx.modalEdicao, cartao: e.target.value})} className={`w-full bg-transparent py-3 pr-4 pl-12 outline-none font-bold tabular-nums ${temaNoturno ? 'text-white' : 'text-black'}`} /></div></div>
              <div><label className={`text-[12px] font-medium mb-2 block ${temaNoturno ? 'text-zinc-400' : 'text-zinc-500'}`}>Pix</label><div className={`relative flex items-center bg-transparent rounded-xl border transition-colors ${temaNoturno ? 'border-white/[0.08] bg-[#151515] focus-within:border-white/[0.15]' : 'border-black/10 bg-white focus-within:border-black/20 shadow-sm'}`}><span className={`absolute left-4 font-semibold ${temaNoturno ? 'text-zinc-500' : 'text-zinc-400'}`}>R$</span><input type="number" value={ctx.modalEdicao.pix} onChange={e => ctx.setModalEdicao({...ctx.modalEdicao, pix: e.target.value})} className={`w-full bg-transparent py-3 pr-4 pl-12 outline-none font-bold tabular-nums ${temaNoturno ? 'text-white' : 'text-black'}`} /></div></div>
            </div>
            <div className="flex justify-end gap-3"><button onClick={() => ctx.setModalEdicao({ visivel: false, dinheiro: '', cartao: '', pix: '' })} className={`px-5 py-2.5 rounded-xl text-[12px] font-medium transition-colors ${temaNoturno ? 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5' : 'text-zinc-600 hover:text-zinc-900 hover:bg-black/5'}`}>Cancelar</button><button onClick={ctx.salvarEdicaoFechamento} className={btnAROXPrimario}>Salvar Alterações</button></div>
          </div>
        </div>
      )}

      {/* MODAL PREMIUM DE CONFIRMAÇÃO */}
      {modalConfirm.visivel && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
          <div className={`absolute inset-0 transition-opacity duration-300 backdrop-blur-md ${temaNoturno ? 'bg-[#000000]/60' : 'bg-zinc-900/40'}`} onClick={() => setModalConfirm({ visivel: false, titulo: '', mensagem: '', onConfirm: null })} />
          <div className={`relative w-full max-w-sm p-8 md:p-10 rounded-[24px] shadow-2xl border arox-scale-in flex flex-col items-center text-center ${temaNoturno ? 'bg-[#111111] border-white/[0.08]' : 'bg-white backdrop-blur-2xl border-black/[0.05]'}`}>
            <div className={`relative w-16 h-16 rounded-[20px] flex items-center justify-center mb-6 border shadow-sm ${temaNoturno ? 'bg-[#151515] text-white border-white/[0.06]' : 'bg-zinc-50 text-black border-black/[0.05]'}`}>
               <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h2 className="text-xl font-semibold tracking-tight mb-2">{modalConfirm.titulo}</h2>
            <p className={`text-[13px] mb-8 leading-relaxed font-medium ${temaNoturno ? 'text-zinc-400' : 'text-zinc-500'}`}>{modalConfirm.mensagem}</p>
            <div className="flex flex-col gap-3 w-full relative z-10">
              <button 
                onClick={() => { if(modalConfirm.onConfirm) modalConfirm.onConfirm(); setModalConfirm({ visivel: false, titulo: '', mensagem: '', onConfirm: null }); }} 
                className={`w-full py-3.5 text-[12px] font-semibold tracking-wide rounded-xl shadow-md active:scale-[0.98] transition-all border ${temaNoturno ? 'bg-zinc-100 text-black border-transparent hover:bg-white hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]' : 'bg-zinc-900 text-white border-transparent hover:bg-black hover:shadow-lg'}`}
              >
                Confirmar Ação
              </button>
              <button 
                onClick={() => setModalConfirm({ visivel: false, titulo: '', mensagem: '', onConfirm: null })} 
                className={`w-full py-3.5 text-[12px] font-medium rounded-xl transition-colors border border-transparent ${temaNoturno ? 'hover:bg-white/5 text-zinc-400 hover:text-white' : 'hover:bg-black/5 text-zinc-600 hover:text-black'}`}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}