export const getApiUrl = () => {
  // 1. Se estiver no Navegador (Client-side)
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;

    // Se estiver na Vercel, ignoramos qualquer variável de ambiente que aponte para localhost
    if (
      hostname.includes("vercel.app") ||
      hostname.includes("planvita-lilac")
    ) {
      return "https://planvita-api.vercel.app/api";
    }

    // Se for localhost real no navegador
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "http://localhost:61348/api";
    }
  }

  // 2. Se estiver no Servidor (Build/SSR)
  // Prioridade para a variável de ambiente, mas validamos se não é localhost em produção
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl && !envUrl.includes("localhost")) {
    return envUrl;
  }

  // Fallback padrão para produção Vercel
  if (process.env.VERCEL || process.env.NODE_ENV === "production") {
    return "https://planvita-api.vercel.app/api";
  }

  return "http://localhost:61348/api";
};

export const API_VERSION =
  process.env.NEXT_PUBLIC_API_VERSION || process.env.API_VERSION || "v1";
