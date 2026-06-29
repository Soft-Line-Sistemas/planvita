import { type NextRequest, NextResponse } from "next/server";

function extractTenantFromHost(host: string): string | null {
  const h = host.split(":")[0].toLowerCase();
  if (h.endsWith(".localhost")) {
    const sub = h.replace(".localhost", "");
    return sub === "app" || sub === "www" ? null : sub;
  }
  if (h.endsWith(".planvita.com.br")) {
    const parts = h.split(".");
    if (parts.length > 3) {
      const sub = parts.slice(0, -3).join(".");
      return sub === "app" || sub === "www" ? null : sub;
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { token?: unknown; tenant?: unknown };
    const token = typeof body?.token === "string" ? body.token.trim() : "";
    const tenantFromBody =
      typeof body?.tenant === "string" ? body.tenant.trim() : "";

    if (!token) {
      return NextResponse.json(
        { message: "Token não informado." },
        { status: 400 },
      );
    }

    const host = req.headers.get("host") ?? "";
    const tenant = tenantFromBody || extractTenantFromHost(host);

    const apiBase =
      process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";
    const apiUrl = `${apiBase}/v1/titular/public/confirmar-exclusao`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (tenant) headers["X-Tenant"] = tenant;

    const backendRes = await fetch(apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({ token }),
    });

    const data = await backendRes.json().catch(() => ({}));
    return NextResponse.json(data, { status: backendRes.status });
  } catch {
    return NextResponse.json(
      { message: "Erro interno. Tente novamente mais tarde." },
      { status: 500 },
    );
  }
}
