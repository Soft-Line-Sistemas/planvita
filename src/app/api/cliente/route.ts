import { NextRequest, NextResponse } from "next/server";
import { clientesPlanosMock } from "@/data/mock-clientes-planos";

const normalizeCpf = (value: string) => value.replace(/\D/g, "");

export async function GET(request: NextRequest) {
  const cpf = request.nextUrl.searchParams.get("cpf");

  if (!cpf) {
    return NextResponse.json(
      { error: "CPF é obrigatório para consulta." },
      { status: 400 },
    );
  }

  const cliente = clientesPlanosMock.find(
    (item) => normalizeCpf(item.cpf) === normalizeCpf(cpf),
  );

  if (!cliente) {
    return NextResponse.json(
      { error: "Plano não encontrado para o CPF informado." },
      { status: 404 },
    );
  }

  return NextResponse.json({ data: cliente });
}
