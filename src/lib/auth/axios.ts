/**
 * Cookie-session API client (relative /api). Drop-in shape for former axios usage.
 */

type Query = Record<string, string | number | boolean | undefined | null> | object;

export type ApiResponse<T = unknown> = {
  data: T;
  status: number;
  headers: Headers;
};

export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(status: number, data: unknown, message?: string) {
    super(message ?? `Request failed (${status})`);
    this.status = status;
    this.data = data;
  }
}

function buildUrl(path: string, params?: Query): string {
  const base = path.startsWith("http")
    ? path
    : path.startsWith("/api")
      ? path
      : `/api${path.startsWith("/") ? path : `/${path}`}`;
  if (!params) return base;
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params as Record<string, unknown>)) {
    if (v === undefined || v === null || v === "") continue;
    sp.set(k, String(v));
  }
  const q = sp.toString();
  return q ? `${base}?${q}` : base;
}

async function request<T>(
  method: string,
  path: string,
  options?: {
    params?: Query;
    data?: unknown;
    timeout?: number;
    responseType?: "json" | "blob";
    headers?: Record<string, string>;
  },
): Promise<ApiResponse<T>> {
  const controller = new AbortController();
  const timeout = options?.timeout ?? 15000;
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(buildUrl(path, options?.params), {
      method,
      credentials: "include",
      signal: controller.signal,
      headers: {
        ...(options?.data !== undefined && !(options.data instanceof FormData)
          ? { "Content-Type": "application/json" }
          : {}),
        ...options?.headers,
      },
      body:
        options?.data === undefined
          ? undefined
          : options.data instanceof FormData
            ? options.data
            : JSON.stringify(options.data),
    });

    if (options?.responseType === "blob") {
      if (!res.ok) {
        throw new ApiError(res.status, null, res.statusText);
      }
      const blob = (await res.blob()) as T;
      return { data: blob, status: res.status, headers: res.headers };
    }

    const text = await res.text();
    let data: unknown = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }

    if (!res.ok) {
      const msg =
        typeof data === "object" &&
        data &&
        "message" in data &&
        typeof (data as { message: unknown }).message === "string"
          ? (data as { message: string }).message
          : res.statusText;
      throw new ApiError(res.status, data, msg);
    }

    return { data: data as T, status: res.status, headers: res.headers };
  } finally {
    clearTimeout(timer);
  }
}

const axiosClient = {
  get: <T = unknown>(path: string, config?: { params?: Query; timeout?: number; responseType?: "json" | "blob"; headers?: Record<string, string> }) =>
    request<T>("GET", path, config),
  post: <T = unknown>(path: string, data?: unknown, config?: { params?: Query; timeout?: number; headers?: Record<string, string> }) =>
    request<T>("POST", path, { ...config, data }),
  put: <T = unknown>(path: string, data?: unknown, config?: { params?: Query; timeout?: number }) =>
    request<T>("PUT", path, { ...config, data }),
  patch: <T = unknown>(path: string, data?: unknown, config?: { params?: Query; timeout?: number }) =>
    request<T>("PATCH", path, { ...config, data }),
  delete: <T = unknown>(path: string, config?: { params?: Query; timeout?: number; data?: unknown }) =>
    request<T>("DELETE", path, config),
};

export default axiosClient;
