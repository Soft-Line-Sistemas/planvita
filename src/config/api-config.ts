export const getApiUrl = () => {
  // Se estiver definido no ambiente, usa ele (prioridade para Vercel ou VPS via env)
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // Fallback para desenvolvimento local se nada estiver definido
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:61348/api";
  }

  // Fallback baseado no hostname atual se estiver no browser
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;

    // Se estiver em um domínio .vercel.app, usamos as URLs oficiais fornecidas
    if (hostname.includes("vercel.app")) {
      // Se for uma URL de preview (contém traços e hashes), podemos manter uma lógica de dev ou usar a de produção
      const projectSlug = hostname.split(".vercel.app")[0];

      if (
        projectSlug.includes("-git-") ||
        (projectSlug.split("-").length > 2 &&
          /[a-z0-9]{9}/.test(projectSlug.split("-").pop() || ""))
      ) {
        // Você pode configurar um backend de testes aqui se preferir
        return "https://planvita-api.vercel.app/api";
      }

      // URL oficial do backend na Vercel
      return "https://planvita-api.vercel.app/api";
    }
  }

  return "";
};

export const API_VERSION =
  process.env.NEXT_PUBLIC_API_VERSION || process.env.API_VERSION || "v1";
