import { type NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

// POST /api/excluir-conta?step=buscar  → busca tenants pelo e-mail
// POST /api/excluir-conta?step=solicitar → envia e-mail de confirmação
export async function POST(req: NextRequest) {
  try {
    const step = req.nextUrl.searchParams.get("step") ?? "buscar";
    const body = (await req.json()) as Record<string, unknown>;

    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { message: "E-mail inválido ou não informado." },
        { status: 400 },
      );
    }

    if (step === "buscar") {
      const backendRes = await fetch(
        `${API_BASE}/v1/titular/public/buscar-tenants-email`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        },
      );
      const data = await backendRes.json().catch(() => ({}));
      return NextResponse.json(data, { status: backendRes.status });
    }

    if (step === "solicitar") {
      const tenantId =
        typeof body.tenantId === "string" ? body.tenantId.trim() : "";
      if (!tenantId) {
        return NextResponse.json(
          { message: "Plano não identificado." },
          { status: 400 },
        );
      }

      const backendRes = await fetch(
        `${API_BASE}/v1/titular/public/solicitar-exclusao`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, tenantId }),
        },
      );
      const data = await backendRes.json().catch(() => ({}));
      return NextResponse.json(data, { status: backendRes.status });
    }

    return NextResponse.json({ message: "Passo inválido." }, { status: 400 });
  } catch {
    return NextResponse.json(
      { message: "Erro interno. Tente novamente mais tarde." },
      { status: 500 },
    );
  }
}
