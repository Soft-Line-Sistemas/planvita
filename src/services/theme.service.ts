import api from "@/utils/api";
import { LayoutConfigType } from "@/types/LayoutConfigType";

const LOCAL_STORAGE_KEY = "layout-config";

export const fetchTheme = async (): Promise<LayoutConfigType | null> => {
  if (typeof window === "undefined") return null; // server-side safety

  const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (cached) return JSON.parse(cached);

  try {
    const { data } = await api.get<LayoutConfigType>("/api/v1/layout");
    if (data) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
      return data;
    }
    return null;
  } catch (err) {
    console.error("Erro ao buscar tema:", err);
    return null;
  }
};
