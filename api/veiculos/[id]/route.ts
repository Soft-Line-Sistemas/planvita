import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { unknown } from "zod";

const prisma = new PrismaClient();

// === GET /api/veiculos/:id ===
export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    const veiculo = await prisma.veiculo.findUnique({ where: { id } });

    if (!veiculo) {
      return NextResponse.json(
        { error: "Veículo não encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json(veiculo);
  } catch (error) {
    console.error("Erro ao buscar veículo:", error);
    return NextResponse.json(
      { error: "Erro ao buscar veículo" },
      { status: 500 },
    );
  }
}

// === PUT /api/veiculos/:id ===
export async function PUT(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const id = Number(params.id);
    const data = await req.json();

    const atualizado = await prisma.veiculo.update({
      where: { id },
      data: {
        placa: data.placa,
        modelo: data.modelo,
        ano: Number(data.ano),
        tipo: data.tipo,
        ativo: Boolean(data.ativo),
        quilometragemAtual: data.quilometragemAtual ?? null,
      },
    });

    return NextResponse.json(atualizado);
  } catch (error: unknown) {
    console.error("Erro ao atualizar veículo:", error);
    if (unknown.arguments === "P2025") {
      return NextResponse.json(
        { error: "Veículo não encontrado" },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { error: "Erro ao atualizar veículo" },
      { status: 500 },
    );
  }
}

// === DELETE /api/veiculos/:id ===
export async function DELETE(
  _: Request,
  { params }: { params: { id: string } },
) {
  try {
    const id = Number(params.id);
    await prisma.veiculo.delete({ where: { id } });
    return NextResponse.json({ message: "Veículo excluído com sucesso" });
  } catch (error: unknown) {
    console.error("Erro ao excluir veículo:", error);
    if (unknown.arguments === "P2025") {
      return NextResponse.json(
        { error: "Veículo não encontrado" },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { error: "Erro ao excluir veículo" },
      { status: 500 },
    );
  }
}
