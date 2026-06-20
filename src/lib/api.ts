import axios, { AxiosError } from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

let accessToken: string | null = null;
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as typeof error.config & {
      _retry?: boolean;
    };

    const reqUrl = originalRequest?.url ?? "";
    const isAuthEndpoint =
      reqUrl.includes("/auth/login/") ||
      reqUrl.includes("/auth/refresh/") ||
      reqUrl.includes("/auth/logout/") ||
      reqUrl.includes("/auth/register/");

    if (
      error.response?.status === 401 &&
      !originalRequest?._retry &&
      !isAuthEndpoint
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((token) => {
            if (originalRequest) {
              originalRequest.headers = originalRequest.headers ?? {};
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            } else {
              reject(error);
            }
          });
        });
      }

      originalRequest!._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(
          `${BASE_URL}/auth/refresh/`,
          {},
          { withCredentials: true },
        );
        const newToken: string = data.access;
        setAccessToken(newToken);
        onRefreshed(newToken);
        isRefreshing = false;

        if (originalRequest) {
          originalRequest.headers = originalRequest.headers ?? {};
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch {
        isRefreshing = false;
        setAccessToken(null);
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);

export function extractApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (!data) return error.message;
    // { error: "..." }
    if (typeof data.error === "string") return data.error;
    // { detail: "..." }  (DRF 認証エラー等)
    if (typeof data.detail === "string") return data.detail;
    // { errors: { field: ["..."] } }
    if (data.errors && typeof data.errors === "object") {
      for (const v of Object.values(data.errors as Record<string, unknown>)) {
        if (typeof v === "string") return v;
        if (Array.isArray(v) && typeof v[0] === "string") return v[0];
      }
    }
    // DRF フィールドバリデーションエラー: { field: ["..."] } or { field: "..." }
    if (typeof data === "object" && data !== null) {
      for (const v of Object.values(data as Record<string, unknown>)) {
        if (typeof v === "string") return v;
        if (Array.isArray(v) && typeof v[0] === "string") return v[0];
      }
    }
    return error.message;
  }
  return "An unexpected error occurred";
}
