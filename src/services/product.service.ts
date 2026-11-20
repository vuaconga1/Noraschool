import axiosClient from "@/lib/auth/axios";

/* ================= TYPES ================= */

export interface StorageSearchParams {
  page?: number;
  limit?: number;
  q?: string;
  status?: "in_stock" | "out_of_stock" | "cancelled";
  categoryId?: string;
  minQuantity?: number;
  maxQuantity?: number;
}

/** Payload tạo mới: bắt buộc code */
export interface CreateProductPayload {
  code: string;
  name: string;
  categoryId: string;
  unit: string;
  quantity: number;
  description: string;
  imageUrl?: string | null;
}

/** Payload update: KHÔNG bắt code (vì thường không cho sửa code) */
export interface UpdateProductPayload {
  code: string;
  name: string;
  categoryId: string;
  unit: string;
  quantity: number;
  description: string;
  imageUrl?: string | null;
}

/* ================= SERVICE ================= */

export const storageService = {
  /* ---------- SEARCH ---------- */
  async searchProducts(params: StorageSearchParams, includeCancelled: boolean) {
    const res = await axiosClient.get<{
      data?: {
        items?: unknown[];
        pagination?: { total?: number };
        total?: number;
      };
      items?: unknown[];
      pagination?: { total?: number };
      total?: number;
    }>("/product", {
      params: { ...params, includeCancelled },
    });
    const payload = res.data?.data ?? res.data;
    return {
      items: (payload as { items?: unknown[] })?.items ?? [],
      pagination: (payload as { pagination?: { total?: number } })?.pagination,
      total: (payload as { total?: number })?.total ?? 0,
    };
  },

  /* ---------- DETAIL ---------- */
  getProductById(id: string, includeCancelled = false) {
    return axiosClient.get<{ data?: unknown }>(`/product/${id}`, {
      params: { includeCancelled },
    });
  },

  /* ---------- HISTORY ---------- */
  getInventoryHistory(productId: string) {
    return axiosClient.get("/product/history", {
      params: { productId },
    });
  },

  /* ---------- CREATE ---------- */
  createProduct(data: CreateProductPayload) {
    return axiosClient.post("/product", data);
  },

  /* ---------- UPDATE ---------- */
  updateProduct(id: string, data: UpdateProductPayload) {
    // bạn đang dùng PUT => giữ PUT
    return axiosClient.put(`/product/${id}`, data);
    // nếu backend support PATCH thì dùng patch sẽ "đúng nghĩa" hơn:
    // return axiosClient.patch(`/product/${id}`, data);
  },

  /* ---------- DISABLE ---------- */
  disableProduct(id: string) {
    return axiosClient.put(`/product/${id}/cancel`);
  },

  /* ---------- ACTIVATE ---------- */
  activateProduct(id: string) {
    return axiosClient.put(`/product/${id}/activate`);
  },
};