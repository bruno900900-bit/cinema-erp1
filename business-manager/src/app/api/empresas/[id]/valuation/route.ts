import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  calcularValuationCompleto,
  gerarProjecao12Meses,
  MULTIPLOS_SETOR,
} from "@/lib/calculations";

// GET - Calcular valuation da empresa
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const empresaId = parseInt(id);

    // Buscar empresa com dados financeiros
    const empresa = await prisma.empresa.findUnique({
      where: { id: empresaId },
      include: {
        custosFixos: true,
        custosVariaveis: true,
        produtos: true,
        valuationConfig: true,
      },
    });

    if (!empresa) {
      return NextResponse.json(
        { error: "Empresa não encontrada" },
        { status: 404 }
      );
    }

    // Calcular custos fixos mensais
    const custosMensais = empresa.custosFixos.reduce((sum, c) => {
      if (c.periodicidade === "anual") return sum + c.valor / 12;
      if (c.periodicidade === "semanal") return sum + c.valor * 4;
      return sum + c.valor;
    }, 0);

    // Usar receita da config ou estimar baseado nos produtos
    const config = empresa.valuationConfig;
    const receitaMensal =
      config?.receitaMensal ||
      empresa.produtos.reduce((sum, p) => sum + p.precoVenda, 0) * 10; // Estimativa

    const taxaDesconto = config?.taxaDesconto || 0.15;
    const taxaCrescimento = config?.taxaCrescimento || 0.1;
    const anos = config?.anosProjecao || 5;
    const setor = empresa.setor || "Outro";

    // Calcular valuation
    const valuation = calcularValuationCompleto(
      receitaMensal,
      custosMensais,
      setor,
      taxaDesconto,
      taxaCrescimento,
      anos
    );

    // Gerar projeção 12 meses
    const projecao12Meses = gerarProjecao12Meses(
      receitaMensal,
      custosMensais,
      taxaCrescimento / 12
    );

    // Múltiplos do setor
    const multiplosSetor = MULTIPLOS_SETOR[setor] || MULTIPLOS_SETOR["Outro"];

    return NextResponse.json({
      empresa: {
        id: empresa.id,
        nome: empresa.nome,
        setor: empresa.setor,
      },
      config: {
        receitaMensal,
        custosMensais,
        taxaDesconto,
        taxaCrescimento,
        anos,
      },
      valuation,
      projecao12Meses,
      multiplosSetor,
      resumoAnual: {
        receitaAnual: receitaMensal * 12,
        custosAnuais: custosMensais * 12,
        lucroAnual: (receitaMensal - custosMensais) * 12,
        lucroPorMes: projecao12Meses.map((p) => p.lucro),
      },
    });
  } catch (error) {
    console.error("Erro ao calcular valuation:", error);
    return NextResponse.json(
      { error: "Erro ao calcular valuation" },
      { status: 500 }
    );
  }
}

// POST - Salvar/atualizar configuração de valuation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const empresaId = parseInt(id);
    const body = await request.json();

    const config = await prisma.valuationConfig.upsert({
      where: { empresaId },
      create: {
        empresaId,
        receitaMensal: body.receitaMensal || 0,
        taxaDesconto: body.taxaDesconto || 0.15,
        taxaCrescimento: body.taxaCrescimento || 0.1,
        anosProjecao: body.anosProjecao || 5,
        multiploManual: body.multiploManual || null,
        metodoPreferido: body.metodoPreferido || "ebitda",
      },
      update: {
        receitaMensal: body.receitaMensal,
        taxaDesconto: body.taxaDesconto,
        taxaCrescimento: body.taxaCrescimento,
        anosProjecao: body.anosProjecao,
        multiploManual: body.multiploManual,
        metodoPreferido: body.metodoPreferido,
      },
    });

    return NextResponse.json(config);
  } catch (error) {
    console.error("Erro ao salvar config de valuation:", error);
    return NextResponse.json(
      { error: "Erro ao salvar config" },
      { status: 500 }
    );
  }
}
