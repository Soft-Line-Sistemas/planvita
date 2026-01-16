export default function getTenantFromHost(): string | null {
  if (typeof window === "undefined") return null;

  const host = window.location.hostname;
  const parts = host.split(".");

  const forbidden = ["www", "api", "app"];
  const candidate = parts.find(
    (part) => part && !forbidden.includes(part.toLowerCase()),
  );

  return candidate || null;
}
