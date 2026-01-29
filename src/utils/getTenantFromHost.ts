export default function getTenantFromHost(): string | null {
  if (typeof window === "undefined") return null;

  const host = window.location.hostname;

  // Se estivermos na Vercel, priorizamos o parâmetro da URL 'tenant' ou o cookie
  if (host.includes("vercel.app")) {
    const urlParams = new URLSearchParams(window.location.search);
    const tenantParam = urlParams.get("tenant");
    if (tenantParam) return tenantParam;

    const tenantCookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("tenant="))
      ?.split("=")[1];
    if (tenantCookie) return tenantCookie;
  }

  const parts = host.split(".");

  // Se for localhost, o primeiro parte costuma ser o tenant (ex: lider.localhost)
  if (host === "localhost") return null;

  const forbidden = [
    "www",
    "api",
    "app",
    "vercel",
    "planvita-lilac",
    "planvita-api",
  ];
  const candidate = parts.find(
    (part) => part && !forbidden.includes(part.toLowerCase()),
  );

  return candidate || null;
}
