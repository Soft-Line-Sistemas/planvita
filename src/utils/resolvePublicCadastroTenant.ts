const TENANT_FORMAT = /^[a-z0-9-]+$/;
const DEFAULT_PUBLIC_CADASTRO_TENANT = "bosque";

export default function resolvePublicCadastroTenant(search: string): string {
  const params = new URLSearchParams(search);
  const consultorTenant = params.get("consultorTenant")?.trim().toLowerCase();

  if (consultorTenant && TENANT_FORMAT.test(consultorTenant)) {
    return consultorTenant;
  }

  return DEFAULT_PUBLIC_CADASTRO_TENANT;
}
