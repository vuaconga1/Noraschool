import axiosClient from "@/lib/auth/axios";
import {
  CategoryFormPayload,
  CategorySearchParams,
} from "@/types/product-category";
import { Category } from "@/types/storage";

/* ================= SERVICE ================= */
export const categoryService = {
  /* ---------- SEARCH / LIST ---------- */
  async searchCategories(params: CategorySearchParams) {
    const res = await axiosClient.get<{
      data?: {
        items: Category[];
        pagination: { page: number; limit: number; total: number };
      };
      items?: Category[];
    }>("/categories", { params: { ...params } });
    if (res.data?.data) return res.data.data;
    return {
      items: (Array.isArray(res.data) ? res.data : res.data?.items) ?? [],
      pagination: { page: 1, limit: 20, total: 0 },
    };
  },

  /* ---------- DETAIL ---------- */
  async getCategoryById(id: string) {
    const res = await axiosClient.get<{ data?: Category } & Category>(
      `/categories/${id}`,
    );
    return (res.data as { data?: Category }).data ?? (res.data as Category);
  },

  /* ---------- CREATE ---------- */
  async createCategory(data: CategoryFormPayload) {
    return axiosClient.post("/categories", data);
  },

  /* ---------- UPDATE ---------- */
  async updateCategory(id: string, data: CategoryFormPayload) {
    return axiosClient.put(`/categories/${id}`, data);
  },

  /* ---------- DELETE ---------- */
  async deleteCategory(id: string) {
    return axiosClient.delete(`/categories/${id}/delete`);
  },
};
