import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST - Criar produto
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const produto = await prisma.produto.create({
      data: {
        empresaId: parseInt(id),
        nome: body.nome,
        descricao: body.descricao || null,
        precoCusto: body.precoCusto || 0,
        precoVenda: body.precoVenda,
      },
      include: { etapas: true },
    });

    return NextResponse.json(produto, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar produto:", error);
    return NextResponse.json(
      { error: "Erro ao criar produto" },
      { status: 500 }
    );
  }
}

// GET - Listar produtos da empresa
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const produtos = await prisma.produto.findMany({
      where: { empresaId: parseInt(id) },
      include: {
        etapas: { orderBy: { ordem: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calcular precoCusto baseado nas etapas
    const produtosComCusto = produtos.map((produto) => ({
      ...produto,
      precoCusto:
        produto.etapas.reduce((sum, etapa) => sum + etapa.custo, 0) ||
        produto.precoCusto,
    }));

    return NextResponse.json(produtosComCusto);
  } catch (error) {
    console.error("Erro ao listar produtos:", error);
    return NextResponse.json(
      { error: "Erro ao listar produtos" },
      { status: 500 }
    );
  }
}
