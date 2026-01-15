import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST - Criar custo fixo
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const custoFixo = await prisma.custoFixo.create({
      data: {
        empresaId: parseInt(id),
        nome: body.nome,
        valor: body.valor,
        periodicidade: body.periodicidade || "mensal",
        descricao: body.descricao || null,
      },
    });

    return NextResponse.json(custoFixo, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar custo fixo:", error);
    return NextResponse.json(
      { error: "Erro ao criar custo fixo" },
      { status: 500 }
    );
  }
}

// GET - Listar custos fixos da empresa
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const custosFixos = await prisma.custoFixo.findMany({
      where: { empresaId: parseInt(id) },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(custosFixos);
  } catch (error) {
    console.error("Erro ao listar custos fixos:", error);
    return NextResponse.json(
      { error: "Erro ao listar custos fixos" },
      { status: 500 }
    );
  }
}
