import axios from "axios";
import getTenantFromHost from "./getTenantFromHost";
import { getApiUrl, API_VERSION } from "../config/api-config";

const api = axios.create({
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    // Garante que a baseURL seja calculada dinamicamente se estiver errada ou for localhost em produção
    const currentBase = getApiUrl();
    config.baseURL = `${currentBase}/${API_VERSION}`;

    const tenant = getTenantFromHost();
    if (tenant) {
      config.headers["X-Tenant"] = tenant;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === "ERR_NETWORK") {
      console.error(
        "Erro de rede: Não foi possível conectar ao servidor da API. Verifique se o backend está rodando e a URL está correta.",
        {
          baseURL: error.config?.baseURL,
          url: error.config?.url,
        },
      );
    } else if (
      error.response?.status === 403 &&
      error.response?.data?.message?.includes("CORS")
    ) {
      console.error(
        "Erro de CORS: A origem atual não é permitida pelo backend.",
        {
          origin:
            typeof window !== "undefined" ? window.location.origin : "unknown",
        },
      );
    }
    return Promise.reject(error);
  },
);

export default api;
