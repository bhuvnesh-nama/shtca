import axios from "axios";
import type { AxiosInstance } from "axios";

const rawBase = import.meta.env.VITE_API_BASE_URL ?? "";
const apiBase = rawBase ? `${rawBase.replace(/\/$/, "")}/api` : "/api";

export const api: AxiosInstance = axios.create({
  baseURL: apiBase,
  withCredentials: true,
  timeout: 20000,
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        const refreshUrl = rawBase
          ? `${rawBase.replace(/\/$/, "")}/api/auth/refresh-token`
          : "/api/auth/refresh-token";
        await axios.post(refreshUrl, {}, { withCredentials: true });
        return api.request(error.config);
      } catch (err) {
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);
