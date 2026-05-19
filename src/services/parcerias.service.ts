import api from "@/utils/api";
import type {
  ParceriaCategoria,
  ParceriaVantagemDetalhe,
  ParceriaVantagemResumo,
} from "@/types/Parcerias";

export async function listarCategoriasCliente(): Promise<ParceriaCategoria[]> {
  const { data } = await api.get("/parcerias/cliente/categorias");
  return Array.isArray(data) ? data : [];
}

export async function listarVantagensCliente(params?: {
  q?: string;
  categoriaId?: number;
  destaque?: boolean;
  limit?: number;
  offset?: number;
}): Promise<ParceriaVantagemResumo[]> {
  const { data } = await api.get("/parcerias/cliente/vantagens", { params });
  return Array.isArray(data) ? data : [];
}

export async function obterVantagemCliente(
  slug: string,
): Promise<ParceriaVantagemDetalhe> {
  const { data } = await api.get(`/parcerias/cliente/vantagens/${slug}`);
  return data;
}

export async function registrarResgate(vantagemId: number, canal: string) {
  await api.post(`/parcerias/cliente/vantagens/${vantagemId}/resgates`, {
    canal,
  });
}

export async function listarVantagensPublicas(
  limit = 3,
): Promise<ParceriaVantagemResumo[]> {
  const { data } = await api.get("/parcerias/public/vantagens", {
    params: { limit },
  });
  return Array.isArray(data) ? data : [];
}

export async function listarCategoriasAdmin(): Promise<ParceriaCategoria[]> {
  const { data } = await api.get("/parcerias/categorias");
  return Array.isArray(data) ? data : [];
}

export async function salvarCategoriaAdmin(
  payload: Partial<ParceriaCategoria> & { nome: string },
) {
  const { data } = await api.post("/parcerias/categorias", payload);
  return data;
}

export async function listarParceirosAdmin(q?: string) {
  const { data } = await api.get("/parcerias/parceiros", {
    params: q ? { q } : undefined,
  });
  return Array.isArray(data) ? data : [];
}

export async function salvarParceiroAdmin(payload: Record<string, unknown>) {
  const { data } = await api.post("/parcerias/parceiros", payload);
  return data;
}

export async function listarVantagensAdmin(params?: Record<string, unknown>) {
  const { data } = await api.get("/parcerias/vantagens", { params });
  return Array.isArray(data) ? data : [];
}

export async function salvarVantagemAdmin(payload: Record<string, unknown>) {
  const { data } = await api.post("/parcerias/vantagens", payload);
  return data;
}

export async function excluirVantagemAdmin(id: number) {
  await api.delete(`/parcerias/vantagens/${id}`);
}
