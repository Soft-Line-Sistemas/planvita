import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// === GET /api/veiculos ===
// Lista todos os veículos
export async function GET() {
  try {
    const veiculos = await prisma.veiculo.findMany({
      orderBy: { id: "desc" },
    });
    return NextResponse.json(veiculos);
  } catch (error) {
    console.error("Erro ao buscar veículos:", error);
    return NextResponse.json(
      { error: "Erro ao buscar veículos" },
      { status: 500 },
    );
  }
}

// === POST /api/veiculos ===
// Cria um novo veículo
export async function POST(req: Request) {
  try {
    const data = await req.json();

    const novo = await prisma.veiculo.create({
      data: {
        placa: data.placa,
        modelo: data.modelo,
        ano: Number(data.ano),
        tipo: data.tipo,
        ativo: Boolean(data.ativo),
        quilometragemAtual: data.quilometragemAtual ?? null,
      },
    });

    return NextResponse.json(novo, { status: 201 });
  } catch (error: unknown) {
    console.error("Erro ao criar veículo:", error);
    return NextResponse.json(
      { error: "Erro ao criar veículo" },
      { status: 500 },
    );
  }
}
