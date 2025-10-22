import axios from "axios";
import getTenantFromHost from "./getTenantFromHost";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const API_VERSION = process.env.API_VERSION || "v1";

const api = axios.create({
  baseURL: `${BASE_URL}/${API_VERSION}`,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
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
    return Promise.reject(error);
  },
);

export default api;
