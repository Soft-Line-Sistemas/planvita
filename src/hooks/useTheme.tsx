"use client";

import api from "@/utils/api";

/**
 * Carrega e injeta o CSS dinâmico de tema no <head>
 * - Busca do backend (/layout/css)
 * - Cache local opcional via localStorage
 * - Substitui automaticamente se o tema mudar
 */

export const useTheme = async () => {
  // 🔒 Desativado por enquanto
  return;

  // Se quiser, pode deixar o código antigo comentado para referência
  /*
  if (typeof window === "undefined") return;

  const LOCAL_STORAGE_KEY = "dynamic-theme-css";

  try {
    const cachedCss = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (cachedCss) injectTheme(cachedCss);

    const res = await api.get("/layout/css", { responseType: "text" });
    const css = res.data;

    if (css && css !== cachedCss) {
      injectTheme(css);
      localStorage.setItem(LOCAL_STORAGE_KEY, css);
    }
  } catch (err) {
    console.error("Erro ao injetar CSS do tema:", err);
  }
  */
};
/**
 * Função utilitária que injeta ou atualiza o <style id="theme">
 */
function injectTheme(css: string) {
  let styleTag = document.getElementById("theme") as HTMLStyleElement;

  if (!styleTag) {
    styleTag = document.createElement("style");
    styleTag.id = "theme";
    document.head.appendChild(styleTag);
  }

  // Substitui o conteúdo anterior (sem duplicar)
  styleTag.innerHTML = css;
}
