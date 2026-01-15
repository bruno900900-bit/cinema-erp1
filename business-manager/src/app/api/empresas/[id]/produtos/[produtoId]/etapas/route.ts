import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST - Criar etapa de produção
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; produtoId: string }> }
) {
  try {
    const { produtoId } = await params;
    const body = await request.json();

    // Obter a última ordem
    const ultimaEtapa = await prisma.etapaProducao.findFirst({
      where: { produtoId: parseInt(produtoId) },
      orderBy: { ordem: "desc" },
    });

    const novaOrdem = ultimaEtapa ? ultimaEtapa.ordem + 1 : 1;

    const etapa = await prisma.etapaProducao.create({
      data: {
        produtoId: parseInt(produtoId),
        nome: body.nome,
        ordem: body.ordem ?? novaOrdem,
        custo: body.custo,
        descricao: body.descricao || null,
      },
    });

    // Atualizar o precoCusto do produto
    const todasEtapas = await prisma.etapaProducao.findMany({
      where: { produtoId: parseInt(produtoId) },
    });
    const custoTotal = todasEtapas.reduce((sum, e) => sum + e.custo, 0);

    await prisma.produto.update({
      where: { id: parseInt(produtoId) },
      data: { precoCusto: custoTotal },
    });

    return NextResponse.json(etapa, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar etapa:", error);
    return NextResponse.json({ error: "Erro ao criar etapa" }, { status: 500 });
  }
}

// GET - Listar etapas do produto
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; produtoId: string }> }
) {
  try {
    const { produtoId } = await params;
    const etapas = await prisma.etapaProducao.findMany({
      where: { produtoId: parseInt(produtoId) },
      orderBy: { ordem: "asc" },
    });

    return NextResponse.json(etapas);
  } catch (error) {
    console.error("Erro ao listar etapas:", error);
    return NextResponse.json(
      { error: "Erro ao listar etapas" },
      { status: 500 }
    );
  }
}
