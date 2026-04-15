import { useMemo } from 'react';
import { Zap, Clock, Award, DollarSign, TrendingUp, AlertTriangle, Activity, BarChart2 } from 'lucide-react';

export function useMetricasFaturamento({
  comandas, comandasFiltradas, fTipo, fValor, fInicio, fFim,
  strHoje, strMesAtual, strAnoAtual, fatTotalSafe, dadosPizza, rankingProdutos, temaNoturno
}) {

  const rankingMaiusculo = useMemo(() => {
    return (rankingProdutos || []).map(p => ({ 
      ...p, nome: p?.nome || 'Desconhecido', custo: Math.max(0, (p?.valor || 0) - (p?.lucro || 0)) || 0,
      lucro: p?.lucro || 0, valor: p?.valor || 0
    }));
  }, [rankingProdutos]);

  const { diffAbsoluta, percentualReal, percentualBarra, bateuMeta, semHistorico, diferenca, mediaHistorica } = useMemo(() => {
    const defaultMetrics = { mediaHistorica: 0, diferenca: 0, diffAbsoluta: 0, percentualReal: 0, percentualBarra: 0, bateuMeta: false, semHistorico: true };
    if (!comandas || !Array.isArray(comandas) || comandas.length === 0) return defaultMetrics;

    let media = 0; let hasPastData = false;

    if (fTipo === 'dia') {
       const dataAtual = fValor || strHoje;
       const diaSemanaAtual = new Date(dataAtual + 'T12:00:00').getDay();
       let somaPassada = 0; let diasUnicos = new Set();
       comandas.forEach(c => {
           if (c?.data && c.data < dataAtual) {
               const dtCmd = new Date(c.data + 'T12:00:00');
               if (dtCmd.getDay() === diaSemanaAtual) {
                   somaPassada += (c.produtos || []).reduce((acc, p) => acc + (p?.preco || 0), 0);
                   diasUnicos.add(c.data);
               }
           }
       });
       if (diasUnicos.size > 0) { media = somaPassada / diasUnicos.size; hasPastData = true; }
    } else {
       let pastStart = null; let pastEnd = null;
       if (fTipo === '7 dias') {
           let end = new Date(strHoje + 'T12:00:00'); end.setDate(end.getDate() - 7);
           let start = new Date(end.getTime()); start.setDate(start.getDate() - 6);
           pastStart = start.toISOString().split('T')[0]; pastEnd = end.toISOString().split('T')[0];
       } else if (fTipo === 'mes') {
           const [ano, mes] = (fValor || strMesAtual).split('-');
           let prevMes = parseInt(mes, 10) - 1; let prevAno = parseInt(ano, 10);
           if (prevMes === 0) { prevMes = 12; prevAno--; }
           pastStart = `${prevAno}-${String(prevMes).padStart(2, '0')}-01`; pastEnd = `${prevAno}-${String(prevMes).padStart(2, '0')}-31`; 
       } else if (fTipo === 'ano') {
           const valAno = parseInt(fValor || strAnoAtual, 10);
           pastStart = `${valAno - 1}-01-01`; pastEnd = `${valAno - 1}-12-31`;
       } else if (fTipo === 'periodo') {
           if (!fInicio || !fFim) return defaultMetrics;
           const start = new Date(fInicio + 'T12:00:00'); const end = new Date(fFim + 'T12:00:00');
           const diffDays = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24));
           let pEnd = new Date(start.getTime()); pEnd.setDate(pEnd.getDate() - 1);
           let pStart = new Date(pEnd.getTime()); pStart.setDate(pStart.getDate() - diffDays);
           pastStart = pStart.toISOString().split('T')[0]; pastEnd = pEnd.toISOString().split('T')[0];
       }
       if (pastStart && pastEnd) {
           let somaPassada = 0; let found = false;
           comandas.forEach(c => {
              if (c?.data >= pastStart && c?.data <= pastEnd) {
                somaPassada += (c.produtos || []).reduce((acc, p) => acc + (p?.preco || 0), 0); found = true;
              }
           });
           if (found) { media = somaPassada; hasPastData = true; }
       }
    }

    if (!hasPastData) return defaultMetrics;
    const pctReal = media > 0 ? (fatTotalSafe / media) * 100 : (fatTotalSafe > 0 ? 100 : 0);
    const diff = fatTotalSafe - media;
    return { mediaHistorica: media, diferenca: diff, diffAbsoluta: Math.abs(diff), percentualReal: pctReal || 0, percentualBarra: Math.min(pctReal || 0, 100), bateuMeta: fatTotalSafe >= media && fatTotalSafe > 0, semHistorico: false };
  }, [comandas, fTipo, fValor, fInicio, fFim, fatTotalSafe, strHoje, strMesAtual, strAnoAtual]);

  const dadosGraficoAcumulado = useMemo(() => {
    if (fTipo !== 'dia' || !comandas || comandas.length === 0) return [];
    const dataAtual = fValor || strHoje; const diaSemanaAtual = new Date(dataAtual + 'T12:00:00').getDay();
    let hourlyCurrent = Array(24).fill(0); let hourlyPast = Array(24).fill(0); let diasUnicosPassados = new Set();

    comandas.forEach(c => {
        const h = c?.hora_abertura ? new Date(c.hora_abertura).getHours() : null;
        if (h !== null && !isNaN(h) && h >= 0 && h < 24) {
            const val = (c.produtos || []).reduce((acc, p) => acc + (p?.preco || 0), 0);
            if (c.data === dataAtual) hourlyCurrent[h] += val;
            else if (c.data && c.data < dataAtual) {
                const dtCmd = new Date(c.data + 'T12:00:00');
                if (dtCmd.getDay() === diaSemanaAtual) { hourlyPast[h] += val; diasUnicosPassados.add(c.data); }
            }
        }
    });

    const qtdDiasPassados = diasUnicosPassados.size || 1;
    for (let i = 0; i < 24; i++) hourlyPast[i] = hourlyPast[i] / qtdDiasPassados;

    let accCur = 0, accPast = 0; const res = []; const horaAtualDoSistema = new Date().getHours(); const isHoje = dataAtual === strHoje;
    for (let i = 0; i < 24; i++) {
        accCur += hourlyCurrent[i]; accPast += hourlyPast[i];
        if (isHoje && i > horaAtualDoSistema) res.push({ hora: `${i}h`, atual: null, passado: accPast });
        else res.push({ hora: `${i}h`, atual: accCur, passado: accPast });
    }
    return res;
  }, [comandas, fTipo, fValor, strHoje]);

  const { mapaCalor, maxCalor, topCombos } = useMemo(() => {
    const horasVisiveis = [17, 18, 19, 20, 21, 22, 23]; const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    let matrizSoma = Array(7).fill(0).map(() => Array(24).fill(0)); let diasUnicos = Array(7).fill(0).map(() => new Set());
    let pares = {};

    (comandas || []).forEach(c => {
      if (c?.hora_abertura && c?.data) {
        const dt = new Date(c.hora_abertura); const d = dt.getDay(); const h = dt.getHours();
        if (!isNaN(d) && !isNaN(h) && d >= 0 && d <= 6 && h >= 0 && h <= 23) { matrizSoma[d][h]++; diasUnicos[d].add(c.data); }
      }
    });

    let matrizMedia = Array(7).fill(0).map(() => Array(24).fill(0)); let localMaxCalor = 0;
    for (let d = 0; d < 7; d++) {
       const qtdDias = diasUnicos[d].size || 1;
       for (let h = 0; h < 24; h++) {
          const media = parseFloat((matrizSoma[d][h] / qtdDias).toFixed(1));
          matrizMedia[d][h] = media;
          if (media > localMaxCalor) localMaxCalor = media;
       }
    }

    (comandasFiltradas || []).forEach(c => {
      if (c?.produtos && c.produtos.length > 1 && c.produtos.length < 10) {
        const nomesUnicos = Array.from(new Set(c.produtos.map(p => (p?.nome || '').replace(/\s*\(\d+(?:\.\d+)?\s*g\)/i, '').trim()).filter(Boolean)));
        for(let i = 0; i < nomesUnicos.length; i++) {
          for(let j = i + 1; j < nomesUnicos.length; j++) {
            const pair = [nomesUnicos[i], nomesUnicos[j]].sort().join(' + ');
            pares[pair] = (pares[pair] || 0) + 1;
          }
        }
      }
    });

    return { mapaCalor: { matriz: matrizMedia, diasSemana, horasVisiveis }, maxCalor: localMaxCalor, topCombos: Object.entries(pares).map(([nome, qtd]) => ({ nome, qtd })).sort((a,b) => b.qtd - a.qtd).slice(0, 5) };
  }, [comandas, comandasFiltradas]);

  const insightsDinamicos = useMemo(() => {
    const frases = []; const totalPagamentos = (dadosPizza || []).reduce((acc, item) => acc + (item?.value || 0), 0);
    const aindaSemMovimentoHoje = fTipo === 'dia' && fatTotalSafe === 0 && fValor === strHoje;

    if (aindaSemMovimentoHoje) {
      let maxVolHoje = 0; let horaPicoHoje = -1;
      if (mapaCalor?.matriz) {
        const diaSemanaHoje = new Date().getDay();
        (mapaCalor.matriz[diaSemanaHoje] || []).forEach((volume, hora) => { if (volume > maxVolHoje) { maxVolHoje = volume; horaPicoHoje = hora; } });
      }
      if (maxVolHoje > 0) frases.push({ icone: <Zap className="w-5 h-5 text-amber-500" />, titulo: 'Previsão Operacional', texto: `Com base no seu histórico, prepare a operação para um maior fluxo esperado próximo às ${horaPicoHoje}h.` });
      else frases.push({ icone: <Clock className={`w-5 h-5 ${temaNoturno ? 'text-zinc-400' : 'text-zinc-500'}`} />, titulo: 'Aguardando Operação', texto: 'Aguardando movimentações suficientes para gerar inteligência de dados.' });
      return frases; 
    }

    if (rankingMaiusculo?.length > 0) {
      const topProduto = [...rankingMaiusculo].sort((a, b) => (b?.valor || 0) - (a?.valor || 0))[0];
      if (topProduto?.valor > 0) frases.push({ icone: <Award className="w-5 h-5 text-indigo-500" />, titulo: 'Destaque Comercial', texto: `${topProduto.nome} liderou as vendas gerando R$ ${(topProduto.valor || 0).toFixed(2)}.` });
    }

    if (dadosPizza?.length > 0 && totalPagamentos > 0) {
      const topPagamento = [...dadosPizza].sort((a, b) => (b?.value || 0) - (a?.value || 0))[0];
      if (topPagamento) frases.push({ icone: <DollarSign className="w-5 h-5 text-emerald-500" />, titulo: 'Comportamento Financeiro', texto: `${topPagamento.name} representou ${(((topPagamento.value || 0) / totalPagamentos) * 100).toFixed(0)}% de todo o volume.` });
    }

    if (!semHistorico && mediaHistorica > 0) {
      const variacao = ((diffAbsoluta / mediaHistorica) * 100).toFixed(1);
      if (diferenca >= 0) frases.push({ icone: <TrendingUp className="w-5 h-5 text-emerald-500" />, titulo: 'Alta Performance', texto: `Faturamento operando ${variacao}% acima da sua média histórica.` });
      else frases.push({ icone: <AlertTriangle className="w-5 h-5 text-amber-500" />, titulo: 'Atenção ao Volume', texto: `O faturamento está ${variacao}% abaixo do padrão histórico esperado.` });
    }

    if (frases.length === 0) frases.push({ icone: <Clock className="w-5 h-5 text-zinc-500" />, titulo: 'Processando Dados', texto: 'Aguardando mais movimentações no período para cruzar métricas.' });
    return frases;
  }, [rankingMaiusculo, dadosPizza, semHistorico, diferenca, diffAbsoluta, mediaHistorica, maxCalor, mapaCalor, fatTotalSafe, fTipo, fValor, strHoje, temaNoturno]);

  return {
    rankingMaiusculo, diffAbsoluta, percentualReal, percentualBarra, bateuMeta, semHistorico, diferenca, mediaHistorica,
    dadosGraficoAcumulado, mapaCalor, maxCalor, topCombos, insightsDinamicos
  };
}