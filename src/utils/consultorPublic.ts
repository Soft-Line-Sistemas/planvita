import api from "@/utils/api";

export type ConsultorPublicResult = {
  id: number;
  codigo: string;
  nome: string;
  nomeCompleto: string;
  whatsapp: string | null;
  email: string | null;
  avatarUrl: string | null;
  userId: number | null;
  tenantId: string;
  tenantLabel: string;
  selectionKey: string;
};

export function normalizeConsultorCode(value?: string | null) {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

export async function resolveConsultorPublicByCode(codigo: string) {
  const normalizedCode = normalizeConsultorCode(codigo);
  if (!normalizedCode) return null;

  const { data } = await api.get<ConsultorPublicResult>("/consultor/public", {
    params: {
      codigo: normalizedCode,
    },
  });

  return data;
}

export async function resolveConsultorPublicLegacy(
  consultorId: number,
  consultorTenant: string,
) {
  const { data } = await api.get<ConsultorPublicResult>("/consultor/public", {
    params: {
      consultorId,
      consultorTenant,
    },
  });

  return data;
}

export function buildConsultorCadastroLink(
  origin: string,
  params: {
    codigo?: string | null;
    tenantId?: string | null;
    legacyId?: number | null;
  },
) {
  const query = new URLSearchParams();

  if (params.codigo) {
    query.set("consultorCodigo", normalizeConsultorCode(params.codigo));
  } else if (params.legacyId) {
    query.set("consultorId", String(params.legacyId));
  }

  if (params.tenantId) {
    query.set("consultorTenant", String(params.tenantId).trim().toLowerCase());
  }

  return `${origin}/cliente/cadastro?${query.toString()}`;
}
