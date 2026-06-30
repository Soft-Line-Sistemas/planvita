import { headers } from "next/headers";

const SUBDOMAIN_ONLY_ROUTING_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_SUBDOMAIN_ONLY_ROUTING === "true";

function getBaseDomain(hostname: string): string {
  const parts = hostname.split(".");

  if (hostname === "localhost" || hostname.endsWith(".localhost")) {
    return "localhost";
  }

  if (SUBDOMAIN_ONLY_ROUTING_ENABLED) {
    if (parts.length >= 3 && parts.slice(-2).join(".") === "com.br") {
      return parts.slice(-3).join(".");
    }
    return parts.slice(-2).join(".");
  }

  if (parts.slice(-3).join(".") === "planvita.com.br") {
    return "planvita.com.br";
  }

  return parts.slice(-2).join(".");
}

function extractSubdomain(
  hostname: string,
  ignoredSubdomains: string[] = ["www", "app"],
): string | null {
  const baseDomain = getBaseDomain(hostname);

  if (baseDomain === "localhost") {
    const parts = hostname.split(".");
    if (parts.length === 1 && parts[0] === "localhost") return null;
    if (parts.length === 2 && parts[1] === "localhost") {
      return ignoredSubdomains.includes(parts[0]) ? null : parts[0];
    }
    return null;
  }

  if (hostname === baseDomain || !hostname.endsWith(`.${baseDomain}`)) {
    return null;
  }

  const subdomain = hostname.slice(0, -(baseDomain.length + 1));
  return ignoredSubdomains.includes(subdomain) ? null : subdomain;
}

export async function getSubdomain(): Promise<string | null> {
  const hdrs = await headers();
  const host = hdrs.get("host");
  return parseHost(host);
}

// ⚙️ Versão síncrona (para middleware)
export function getSubdomainFromHost(host?: string | null): string | null {
  if (!host) return null;

  const cleanHost = host.split(":")[0].toLowerCase(); // remove porta
  return extractSubdomain(cleanHost);
}

// 🔧 Função interna compartilhada
function parseHost(host?: string | null): string | null {
  if (!host) return null;

  const cleanHost = host.split(":")[0].toLowerCase();
  return extractSubdomain(cleanHost, ["app"]);
}
