import { headers } from "next/headers";

export async function getSubdomain(): Promise<string | null> {
  const hdrs = await headers();
  const host = hdrs.get("host");
  return parseHost(host);
}

// ⚙️ Versão síncrona (para middleware)
export function getSubdomainFromHost(host?: string | null): string | null {
  if (!host) return null;

  const cleanHost = host.split(":")[0]; // remove porta
  const parts = cleanHost.split(".");

  // localhost sem subdomínio
  if (parts.length === 1 && parts[0] === "localhost") return null;

  // localhost com subdomínio: pax.localhost
  if (parts.length === 2 && parts[1] === "localhost") return parts[0];

  // Produção: pax.planvita.com.br
  if (parts.length > 2 && parts.slice(-3).join(".") === "planvita.com.br")
    return parts[0];

  return parts.length > 2 ? parts[0] : null;
}

// 🔧 Função interna compartilhada
function parseHost(host?: string | null): string | null {
  if (!host) return null;

  const cleanHost = host.split(":")[0];
  const parts = cleanHost.split(".");

  if (parts.length === 1 && parts[0] === "localhost") return null;

  if (parts.length === 2 && parts[1] === "localhost") {
    return parts[0];
  }

  if (parts.length > 2 && parts.slice(-3).join(".") === "planvita.com.br") {
    return parts[0];
  }

  return parts.length > 2 ? parts[0] : null;
}
