export default function getTenantFromHost(): string | null {
  if (typeof window === "undefined") return null;

  const host = window.location.hostname.toLowerCase();
  const explicitHostTenantMap: Record<string, string> = {
    "app.campodobosque.com.br": "bosque",
  };
  const subdomainOnlyRoutingEnabled =
    process.env.NEXT_PUBLIC_ENABLE_SUBDOMAIN_ONLY_ROUTING === "true";
  const productionBaseDomains = ["planvita.com.br", "campodobosque.com.br"];

  if (explicitHostTenantMap[host]) {
    return explicitHostTenantMap[host];
  }

  const getBaseDomain = () => {
    const parts = host.split(".");
    if (parts.length >= 3 && parts.slice(-2).join(".") === "com.br") {
      return parts.slice(-3).join(".");
    }
    return parts.slice(-2).join(".");
  };

  // localhost com subdomínio (ex: lider.localhost) — ignora app.localhost
  if (host.endsWith(".localhost")) {
    const parts = host.split(".");
    const sub = parts[0] || null;
    return sub === "app" ? null : sub;
  }

  if (subdomainOnlyRoutingEnabled) {
    const baseDomain = getBaseDomain();
    if (host === baseDomain || !host.endsWith(`.${baseDomain}`)) {
      return null;
    }

    const subdomain = host.slice(0, -(baseDomain.length + 1));
    return subdomain === "www" || subdomain === "app" ? null : subdomain;
  }

  const matchingProductionDomain = productionBaseDomains.find(
    (domain) => host === domain || host.endsWith(`.${domain}`),
  );
  if (matchingProductionDomain) {
    const suffixLength = matchingProductionDomain.split(".").length;
    const parts = host.split(".");
    if (parts.length > suffixLength) {
      const subdomain = parts.slice(0, -suffixLength).join(".");
      return subdomain === "www" || subdomain === "app" ? null : subdomain;
    }
  }

  const urlParams = new URLSearchParams(window.location.search);
  const tenantParam = urlParams.get("tenant");
  if (tenantParam) return tenantParam.toLowerCase();

  const tenantCookie = document.cookie
    .split("; ")
    .find((row) => row.startsWith("tenant="))
    ?.split("=")[1];

  return tenantCookie ? tenantCookie.toLowerCase() : null;
}
