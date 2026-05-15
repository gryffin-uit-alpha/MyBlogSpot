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
  const response = await apiClient<ApiResponse<Category[]>>('/api/v1/categories');
  return response.data;
}

export async function getCategory(slug: string): Promise<Category> {
  const response = await apiClient<ApiResponse<Category>>(`/api/v1/categories/${slug}`);
  return response.data;
}

export async function getCategoryArticles(
  slug: string,
  limit = 20,
  offset = 0
): Promise<{ articles: Article[]; total: number }> {
  const response = await apiClient<ApiResponse<Article[]>>(
    `/api/v1/categories/${slug}/articles?limit=${limit}&offset=${offset}`
  );
  return {
    articles: response.data,
    total: response.meta?.total || response.data.length,
  };
}
