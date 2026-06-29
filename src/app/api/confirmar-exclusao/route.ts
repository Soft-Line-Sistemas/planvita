import { type NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { token?: unknown; tenantId?: unknown };
    const token = typeof body?.token === "string" ? body.token.trim() : "";
    const tenantId =
      typeof body?.tenantId === "string" ? body.tenantId.trim() : "";

    if (!token) {
      return NextResponse.json(
        { message: "Token não informado." },
        { status: 400 },
      );
    }
    if (!tenantId) {
      return NextResponse.json(
        { message: "Plano não identificado." },
        { status: 400 },
      );
    }

    const backendRes = await fetch(
      `${API_BASE}/v1/titular/public/confirmar-exclusao`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, tenantId }),
      },
    );

    const data = await backendRes.json().catch(() => ({}));
    return NextResponse.json(data, { status: backendRes.status });
  } catch {
    return NextResponse.json(
      { message: "Erro interno. Tente novamente mais tarde." },
      { status: 500 },
    );
  }
}
