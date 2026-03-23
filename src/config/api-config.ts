export const getApiUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

  // 1. Se estiver no Navegador (Client-side)
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;

    // Se estiver na Vercel, ignoramos qualquer variável de ambiente que aponte para localhost
    if (
      hostname.includes("vercel.app") ||
      hostname.includes("planvita-lilac")
    ) {
      if (envUrl && !envUrl.includes("localhost")) {
        return envUrl;
      }
      return "https://planvita-api.vercel.app/api";
    }

    // Em desenvolvimento local, prioriza a variável de ambiente
    if ((hostname === "localhost" || hostname === "127.0.0.1") && envUrl) {
      return envUrl;
    }
  }

  // 2. Se estiver no Servidor (Build/SSR)
  // Prioridade para a variável de ambiente
  if (envUrl) {
    return envUrl;
  }

  // Fallback padrão para produção Vercel
  if (process.env.VERCEL || process.env.NODE_ENV === "production") {
    return "https://planvita-api.vercel.app/api";
  }

  return "https://localhost:61348/api";
};

export const API_VERSION =
  process.env.NEXT_PUBLIC_API_VERSION || process.env.API_VERSION || "v1";
