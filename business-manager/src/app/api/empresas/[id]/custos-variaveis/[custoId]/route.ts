import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PUT - Atualizar custo variável
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; custoId: string }> }
) {
  try {
    const { custoId } = await params;
    const body = await request.json();

    const custoVariavel = await prisma.custoVariavel.update({
      where: { id: parseInt(custoId) },
      data: {
        nome: body.nome,
        valorUnitario: body.valorUnitario,
        unidade: body.unidade,
        descricao: body.descricao,
      },
    });

    return NextResponse.json(custoVariavel);
  } catch (error) {
    console.error("Erro ao atualizar custo variável:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar custo variável" },
      { status: 500 }
    );
  }
}

// DELETE - Excluir custo variável
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; custoId: string }> }
) {
  try {
    const { custoId } = await params;
    await prisma.custoVariavel.delete({
      where: { id: parseInt(custoId) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao excluir custo variável:", error);
    return NextResponse.json(
      { error: "Erro ao excluir custo variável" },
      { status: 500 }
    );
  }
}
