import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PUT - Atualizar custo fixo
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; custoId: string }> }
) {
  try {
    const { custoId } = await params;
    const body = await request.json();

    const custoFixo = await prisma.custoFixo.update({
      where: { id: parseInt(custoId) },
      data: {
        nome: body.nome,
        valor: body.valor,
        periodicidade: body.periodicidade,
        descricao: body.descricao,
      },
    });

    return NextResponse.json(custoFixo);
  } catch (error) {
    console.error("Erro ao atualizar custo fixo:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar custo fixo" },
      { status: 500 }
    );
  }
}

// DELETE - Excluir custo fixo
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; custoId: string }> }
) {
  try {
    const { custoId } = await params;
    await prisma.custoFixo.delete({
      where: { id: parseInt(custoId) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao excluir custo fixo:", error);
    return NextResponse.json(
      { error: "Erro ao excluir custo fixo" },
      { status: 500 }
    );
  }
}
