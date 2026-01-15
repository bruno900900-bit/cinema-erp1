import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Buscar empresa por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const empresa = await prisma.empresa.findUnique({
      where: { id: parseInt(id) },
      include: {
        custosFixos: { orderBy: { createdAt: "desc" } },
        custosVariaveis: { orderBy: { createdAt: "desc" } },
        produtos: {
          include: { etapas: { orderBy: { ordem: "asc" } } },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!empresa) {
      return NextResponse.json(
        { error: "Empresa não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(empresa);
  } catch (error) {
    console.error("Erro ao buscar empresa:", error);
    return NextResponse.json(
      { error: "Erro ao buscar empresa" },
      { status: 500 }
    );
  }
}

// PUT - Atualizar empresa
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const empresa = await prisma.empresa.update({
      where: { id: parseInt(id) },
      data: {
        nome: body.nome,
        descricao: body.descricao,
        setor: body.setor,
      },
    });

    return NextResponse.json(empresa);
  } catch (error) {
    console.error("Erro ao atualizar empresa:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar empresa" },
      { status: 500 }
    );
  }
}

// DELETE - Excluir empresa
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.empresa.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao excluir empresa:", error);
    return NextResponse.json(
      { error: "Erro ao excluir empresa" },
      { status: 500 }
    );
  }
}
