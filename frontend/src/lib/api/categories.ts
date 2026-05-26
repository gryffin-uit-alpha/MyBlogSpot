import { apiClient } from './client';
import { Category } from '@/types/category';
import { Article } from '@/types/article';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    total: number;
    limit: number;
    offset: number;
  };
}

export async function getCategories(): Promise<Category[]> {
  const response = await apiClient<ApiResponse<Category[]>>('/categories');
  return response.data;
}

export async function getCategory(slug: string): Promise<Category> {
  const response = await apiClient<ApiResponse<Category>>(`/categories/${slug}`);
  return response.data;
}

export async function getCategoryArticles(
  slug: string,
  limit = 20,
  offset = 0
): Promise<{ articles: Article[]; total: number }> {
  const response = await apiClient<ApiResponse<Article[]>>(
    `/categories/${slug}/articles?limit=${limit}&offset=${offset}`
  );
  return {
    articles: response.data,
    total: response.meta?.total || response.data.length,
  };
}

export const categoriesApi = {
  list: async (): Promise<ApiResponse<Category[]>> => {
    return apiClient<ApiResponse<Category[]>>('/categories');
  },

  get: async (slug: string): Promise<Category> => {
    const response = await apiClient<ApiResponse<Category>>(`/categories/${slug}`);
    return response.data;
  },

  create: async (data: { name: string; slug: string; description?: string }): Promise<ApiResponse<Category>> => {
    return apiClient<ApiResponse<Category>>('/admin/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: { name: string; slug: string; description?: string }): Promise<ApiResponse<Category>> => {
    return apiClient<ApiResponse<Category>>(`/admin/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<void> => {
    await apiClient(`/admin/categories/${id}`, {
      method: 'DELETE',
    });
  },
};
