export default function getTenantFromHost(): string | null {
  if (typeof window === "undefined") return null;

  const host = window.location.hostname;
  const parts = host.split(".");

  if (host.endsWith("localhost") && parts.length >= 2) {
    return parts[0];
  }

  if (parts.length >= 3) {
    return parts[0];
  }

  return null;
}
