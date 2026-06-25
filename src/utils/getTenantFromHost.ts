export default function getTenantFromHost(): string | null {
  if (typeof window === "undefined") return null;

  const host = window.location.hostname.toLowerCase();

  // localhost com subdomínio (ex: lider.localhost) — ignora app.localhost
  if (host.endsWith(".localhost")) {
    const parts = host.split(".");
    const sub = parts[0] || null;
    return sub === "app" ? null : sub;
  }

  // domínio principal de produção (ex: lider.planvita.com.br) — ignora app.planvita.com.br
  if (host.endsWith(".planvita.com.br")) {
    const parts = host.split(".");
    if (parts.length > 3) {
      const subdomain = parts.slice(0, -3).join(".");
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
