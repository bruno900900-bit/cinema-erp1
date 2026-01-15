import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Buscar produto por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; produtoId: string }> }
) {
  try {
    const { produtoId } = await params;
    const produto = await prisma.produto.findUnique({
      where: { id: parseInt(produtoId) },
      include: { etapas: { orderBy: { ordem: "asc" } } },
    });

    if (!produto) {
      return NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 }
      );
    }

    // Calcular custo real das etapas
    const precoCustoCalculado = produto.etapas.reduce(
      (sum, e) => sum + e.custo,
      0
    );

    return NextResponse.json({
      ...produto,
      precoCusto: precoCustoCalculado || produto.precoCusto,
    });
  } catch (error) {
    console.error("Erro ao buscar produto:", error);
    return NextResponse.json(
      { error: "Erro ao buscar produto" },
      { status: 500 }
    );
  }
}

// PUT - Atualizar produto
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; produtoId: string }> }
) {
  try {
    const { produtoId } = await params;
    const body = await request.json();

    const produto = await prisma.produto.update({
      where: { id: parseInt(produtoId) },
      data: {
        nome: body.nome,
        descricao: body.descricao,
        precoCusto: body.precoCusto,
        precoVenda: body.precoVenda,
      },
      include: { etapas: { orderBy: { ordem: "asc" } } },
    });

    return NextResponse.json(produto);
  } catch (error) {
    console.error("Erro ao atualizar produto:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar produto" },
      { status: 500 }
    );
  }
}

// DELETE - Excluir produto
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; produtoId: string }> }
) {
  try {
    const { produtoId } = await params;
    await prisma.produto.delete({
      where: { id: parseInt(produtoId) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao excluir produto:", error);
    return NextResponse.json(
      { error: "Erro ao excluir produto" },
      { status: 500 }
    );
  }
}
