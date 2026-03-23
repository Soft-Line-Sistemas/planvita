export default function getTenantFromHost(): string | null {
  if (typeof window === "undefined") return null;

  const host = window.location.hostname.toLowerCase();

  // localhost com subdomínio (ex: lider.localhost)
  if (host.endsWith(".localhost")) {
    const parts = host.split(".");
    return parts[0] || null;
  }

  // domínio principal de produção (ex: lider.planvita.com.br)
  if (host.endsWith(".planvita.com.br")) {
    const parts = host.split(".");
    if (parts.length > 3) {
      const subdomain = parts.slice(0, -3).join(".");
      return subdomain === "www" ? null : subdomain;
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
