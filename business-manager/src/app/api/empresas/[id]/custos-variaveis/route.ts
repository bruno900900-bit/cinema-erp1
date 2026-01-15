import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST - Criar custo variável
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const custoVariavel = await prisma.custoVariavel.create({
      data: {
        empresaId: parseInt(id),
        nome: body.nome,
        valorUnitario: body.valorUnitario,
        unidade: body.unidade || "unidade",
        descricao: body.descricao || null,
      },
    });

    return NextResponse.json(custoVariavel, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar custo variável:", error);
    return NextResponse.json(
      { error: "Erro ao criar custo variável" },
      { status: 500 }
    );
  }
}

// GET - Listar custos variáveis da empresa
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const custosVariaveis = await prisma.custoVariavel.findMany({
      where: { empresaId: parseInt(id) },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(custosVariaveis);
  } catch (error) {
    console.error("Erro ao listar custos variáveis:", error);
    return NextResponse.json(
      { error: "Erro ao listar custos variáveis" },
      { status: 500 }
    );
  }
}
