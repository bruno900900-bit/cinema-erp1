// Fórmulas financeiras para análise empresarial

export interface AnaliseFinanceira {
  margemBruta: number;
  margemLiquida: number;
  lucro: number;
  percentualLucro: number;
  pontoEquilibrio: number;
}

/**
 * Calcula a margem bruta: (Preço Venda - Custo) / Preço Venda * 100
 */
export function calcularMargemBruta(
  precoVenda: number,
  precoCusto: number
): number {
  if (precoVenda === 0) return 0;
  return ((precoVenda - precoCusto) / precoVenda) * 100;
}

/**
 * Calcula a margem líquida: (Preço Venda - Custo - Custo Fixo Rateado) / Preço Venda * 100
 */
export function calcularMargemLiquida(
  precoVenda: number,
  precoCusto: number,
  custoFixoRateado: number
): number {
  if (precoVenda === 0) return 0;
  return ((precoVenda - precoCusto - custoFixoRateado) / precoVenda) * 100;
}

/**
 * Calcula o lucro por produto
 */
export function calcularLucro(precoVenda: number, precoCusto: number): number {
  return precoVenda - precoCusto;
}

/**
 * Calcula o percentual de lucro sobre o custo
 */
export function calcularPercentualLucro(
  precoVenda: number,
  precoCusto: number
): number {
  if (precoCusto === 0) return 0;
  return ((precoVenda - precoCusto) / precoCusto) * 100;
}

/**
 * Calcula o ponto de equilíbrio: Custos Fixos / (Preço Venda Médio - Custo Variável Médio)
 */
export function calcularPontoEquilibrio(
  custosFixosTotais: number,
  precoVendaMedio: number,
  custoVariavelMedio: number
): number {
  const margemContribuicao = precoVendaMedio - custoVariavelMedio;
  if (margemContribuicao <= 0) return Infinity;
  return custosFixosTotais / margemContribuicao;
}

/**
 * Calcula análise financeira completa de um produto
 */
export function calcularAnaliseCompleta(
  precoVenda: number,
  precoCusto: number,
  custoFixoRateado: number,
  custosFixosTotais: number,
  custoVariavelMedio: number
): AnaliseFinanceira {
  return {
    margemBruta: calcularMargemBruta(precoVenda, precoCusto),
    margemLiquida: calcularMargemLiquida(
      precoVenda,
      precoCusto,
      custoFixoRateado
    ),
    lucro: calcularLucro(precoVenda, precoCusto),
    percentualLucro: calcularPercentualLucro(precoVenda, precoCusto),
    pontoEquilibrio: calcularPontoEquilibrio(
      custosFixosTotais,
      precoVenda,
      custoVariavelMedio
    ),
  };
}

/**
 * Formata valor para moeda brasileira
 */
export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

/**
 * Formata percentual
 */
export function formatarPercentual(valor: number): string {
  return `${valor.toFixed(2)}%`;
}

// === SISTEMA DE VALUATION ===

export interface ValuationResult {
  dcf: number;
  multiploEbitda: number;
  multiploReceita: number;
  mediaValuation: number;
  metodoRecomendado: string;
  detalhes: {
    fluxosCaixa: number[];
    valorTerminal: number;
    ebitdaAnual: number;
    receitaAnual: number;
  };
}

export interface ProjecaoMensal {
  mes: number;
  receita: number;
  custos: number;
  lucro: number;
  ebitda: number;
}

/**
 * Múltiplos de mercado por setor
 */
export const MULTIPLOS_SETOR: Record<
  string,
  {
    ebitdaMin: number;
    ebitdaMax: number;
    receitaMin: number;
    receitaMax: number;
  }
> = {
  Tecnologia: { ebitdaMin: 8, ebitdaMax: 15, receitaMin: 2, receitaMax: 6 },
  Comércio: { ebitdaMin: 4, ebitdaMax: 8, receitaMin: 0.5, receitaMax: 1.5 },
  Serviços: { ebitdaMin: 5, ebitdaMax: 10, receitaMin: 1, receitaMax: 3 },
  Indústria: { ebitdaMin: 4, ebitdaMax: 7, receitaMin: 0.8, receitaMax: 2 },
  Alimentação: { ebitdaMin: 3, ebitdaMax: 6, receitaMin: 0.5, receitaMax: 1.2 },
  Outro: { ebitdaMin: 4, ebitdaMax: 8, receitaMin: 1, receitaMax: 2 },
};

/**
 * Calcula EBITDA mensal: Lucro + Depreciação + Juros + Impostos
 * Simplificado: Receita - Custos Operacionais (sem deprec/juros/impostos)
 */
export function calcularEbitdaMensal(
  receitaMensal: number,
  custosMensais: number
): number {
  return receitaMensal - custosMensais;
}

/**
 * Calcula Valuation pelo método DCF (Discounted Cash Flow)
 * @param fluxoCaixaAnual - Fluxo de caixa livre anual
 * @param taxaDesconto - WACC ou taxa de retorno esperada (ex: 0.15 = 15%)
 * @param taxaCrescimento - Taxa de crescimento anual (ex: 0.10 = 10%)
 * @param anos - Número de anos para projeção
 */
export function calcularDCF(
  fluxoCaixaAnual: number,
  taxaDesconto: number,
  taxaCrescimento: number,
  anos: number = 5
): { valor: number; fluxos: number[]; valorTerminal: number } {
  if (taxaDesconto <= taxaCrescimento) {
    // Taxa de desconto deve ser maior que taxa de crescimento
    return { valor: 0, fluxos: [], valorTerminal: 0 };
  }

  const fluxos: number[] = [];
  let valorPresente = 0;

  // Calcular valor presente dos fluxos de caixa projetados
  for (let i = 1; i <= anos; i++) {
    const fluxoProjetado = fluxoCaixaAnual * Math.pow(1 + taxaCrescimento, i);
    const fluxoDescontado = fluxoProjetado / Math.pow(1 + taxaDesconto, i);
    fluxos.push(fluxoDescontado);
    valorPresente += fluxoDescontado;
  }

  // Calcular valor terminal (perpetuidade de Gordon)
  const fluxoFinal = fluxoCaixaAnual * Math.pow(1 + taxaCrescimento, anos);
  const valorTerminal =
    (fluxoFinal * (1 + taxaCrescimento)) / (taxaDesconto - taxaCrescimento);
  const valorTerminalDescontado =
    valorTerminal / Math.pow(1 + taxaDesconto, anos);

  return {
    valor: valorPresente + valorTerminalDescontado,
    fluxos,
    valorTerminal: valorTerminalDescontado,
  };
}

/**
 * Calcula Valuation por múltiplos de EBITDA
 */
export function calcularValuationEbitda(
  ebitdaAnual: number,
  setor: string,
  multiploCustom?: number
): number {
  if (multiploCustom) {
    return ebitdaAnual * multiploCustom;
  }

  const multiplos = MULTIPLOS_SETOR[setor] || MULTIPLOS_SETOR["Outro"];
  const multiploMedio = (multiplos.ebitdaMin + multiplos.ebitdaMax) / 2;
  return ebitdaAnual * multiploMedio;
}

/**
 * Calcula Valuation por múltiplos de Receita
 */
export function calcularValuationReceita(
  receitaAnual: number,
  setor: string,
  multiploCustom?: number
): number {
  if (multiploCustom) {
    return receitaAnual * multiploCustom;
  }

  const multiplos = MULTIPLOS_SETOR[setor] || MULTIPLOS_SETOR["Outro"];
  const multiploMedio = (multiplos.receitaMin + multiplos.receitaMax) / 2;
  return receitaAnual * multiploMedio;
}

/**
 * Calcula valuation completo usando os 3 métodos
 */
export function calcularValuationCompleto(
  receitaMensal: number,
  custosMensais: number,
  setor: string,
  taxaDesconto: number = 0.15,
  taxaCrescimento: number = 0.1,
  anos: number = 5
): ValuationResult {
  const receitaAnual = receitaMensal * 12;
  const custosAnuais = custosMensais * 12;
  const ebitdaAnual = calcularEbitdaMensal(receitaMensal, custosMensais) * 12;
  const fluxoCaixaAnual = ebitdaAnual * 0.7; // Assumindo 30% para impostos e reinvestimentos

  // Método 1: DCF
  const dcfResult = calcularDCF(
    fluxoCaixaAnual,
    taxaDesconto,
    taxaCrescimento,
    anos
  );

  // Método 2: Múltiplos de EBITDA
  const valuationEbitda = calcularValuationEbitda(ebitdaAnual, setor);

  // Método 3: Múltiplos de Receita
  const valuationReceita = calcularValuationReceita(receitaAnual, setor);

  // Média ponderada (DCF tem mais peso para empresas com lucro estável)
  const temLucro = ebitdaAnual > 0;
  const mediaValuation = temLucro
    ? dcfResult.valor * 0.4 + valuationEbitda * 0.4 + valuationReceita * 0.2
    : valuationReceita * 0.7 + valuationEbitda * 0.3;

  // Determinar método recomendado
  let metodoRecomendado = "receita";
  if (temLucro) {
    metodoRecomendado = ebitdaAnual > receitaAnual * 0.15 ? "dcf" : "ebitda";
  }

  return {
    dcf: dcfResult.valor,
    multiploEbitda: valuationEbitda,
    multiploReceita: valuationReceita,
    mediaValuation,
    metodoRecomendado,
    detalhes: {
      fluxosCaixa: dcfResult.fluxos,
      valorTerminal: dcfResult.valorTerminal,
      ebitdaAnual,
      receitaAnual,
    },
  };
}

/**
 * Gera projeção de 12 meses
 */
export function gerarProjecao12Meses(
  receitaMensal: number,
  custosMensais: number,
  taxaCrescimentoMensal: number = 0.02 // 2% ao mês
): ProjecaoMensal[] {
  const projecoes: ProjecaoMensal[] = [];

  for (let mes = 1; mes <= 12; mes++) {
    const fatorCrescimento = Math.pow(1 + taxaCrescimentoMensal, mes - 1);
    const receita = receitaMensal * fatorCrescimento;
    const custos =
      custosMensais * Math.pow(1 + taxaCrescimentoMensal * 0.5, mes - 1); // Custos crescem mais devagar
    const lucro = receita - custos;
    const ebitda = lucro; // Simplificado

    projecoes.push({ mes, receita, custos, lucro, ebitda });
  }

  return projecoes;
}

/**
 * Formata valor grande de forma compacta (K, M, B)
 */
export function formatarValorCompacto(valor: number): string {
  if (valor >= 1_000_000_000) {
    return `R$ ${(valor / 1_000_000_000).toFixed(2)}B`;
  } else if (valor >= 1_000_000) {
    return `R$ ${(valor / 1_000_000).toFixed(2)}M`;
  } else if (valor >= 1_000) {
    return `R$ ${(valor / 1_000).toFixed(1)}K`;
  }
  return formatarMoeda(valor);
}
