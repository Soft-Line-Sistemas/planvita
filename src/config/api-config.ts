export const getApiUrl = () => {
  // 1. Prioridade Máxima: Variável de ambiente (Vercel Panel ou .env)
  if (process.env.NEXT_PUBLIC_API_URL) {
    console.log("API URL from ENV:", process.env.NEXT_PUBLIC_API_URL);
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // 2. Fallback para Vercel: Se o domínio contém vercel.app
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname.includes("vercel.app")) {
      const url = "https://planvita-api.vercel.app/api";
      console.log("API URL inferred for Vercel:", url);
      return url;
    }
  }

  // 3. Fallback para Desenvolvimento Local
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:61348/api";
  }

  return "";
};

export const API_VERSION =
  process.env.NEXT_PUBLIC_API_VERSION || process.env.API_VERSION || "v1";
