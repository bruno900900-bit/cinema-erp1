import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PUT - Atualizar etapa
export async function PUT(
  request: NextRequest,
  {
    params,
  }: { params: Promise<{ id: string; produtoId: string; etapaId: string }> }
) {
  try {
    const { produtoId, etapaId } = await params;
    const body = await request.json();

    const etapa = await prisma.etapaProducao.update({
      where: { id: parseInt(etapaId) },
      data: {
        nome: body.nome,
        ordem: body.ordem,
        custo: body.custo,
        descricao: body.descricao,
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

    return NextResponse.json(etapa);
  } catch (error) {
    console.error("Erro ao atualizar etapa:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar etapa" },
      { status: 500 }
    );
  }
}

// DELETE - Excluir etapa
export async function DELETE(
  request: NextRequest,
  {
    params,
  }: { params: Promise<{ id: string; produtoId: string; etapaId: string }> }
) {
  try {
    const { produtoId, etapaId } = await params;

    await prisma.etapaProducao.delete({
      where: { id: parseInt(etapaId) },
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao excluir etapa:", error);
    return NextResponse.json(
      { error: "Erro ao excluir etapa" },
      { status: 500 }
    );
  }
}
