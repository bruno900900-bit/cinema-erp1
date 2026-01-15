import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Listar todas as empresas
export async function GET() {
  try {
    const empresas = await prisma.empresa.findMany({
      include: {
        _count: {
          select: {
            custosFixos: true,
            custosVariaveis: true,
            produtos: true,
          },
        },
        custosFixos: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Calcular totais
    const empresasComResumo = empresas.map((empresa) => ({
      ...empresa,
      totalCustosFixos: empresa.custosFixos.reduce(
        (sum, c) => sum + c.valor,
        0
      ),
      totalProdutos: empresa._count.produtos,
      totalCustosVariaveis: empresa._count.custosVariaveis,
    }));

    return NextResponse.json(empresasComResumo);
  } catch (error) {
    console.error("Erro ao buscar empresas:", error);
    return NextResponse.json(
      { error: "Erro ao buscar empresas" },
      { status: 500 }
    );
  }
}

// POST - Criar nova empresa
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const empresa = await prisma.empresa.create({
      data: {
        nome: body.nome,
        descricao: body.descricao || null,
        setor: body.setor || null,
      },
    });

    return NextResponse.json(empresa, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar empresa:", error);
    return NextResponse.json(
      { error: "Erro ao criar empresa" },
      { status: 500 }
    );
  }
}
