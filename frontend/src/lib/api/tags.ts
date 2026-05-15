import { apiClient } from './client';
import { Tag } from '@/types/tag';
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

export async function getTags(): Promise<Tag[]> {
  const response = await apiClient<ApiResponse<Tag[]>>('/api/v1/tags');
  return response.data;
}

export async function getTag(slug: string): Promise<Tag> {
  const response = await apiClient<ApiResponse<Tag>>(`/api/v1/tags/${slug}`);
  return response.data;
}

export async function getTagArticles(
  slug: string,
  limit = 20,
  offset = 0
): Promise<{ articles: Article[]; total: number }> {
  const response = await apiClient<ApiResponse<Article[]>>(
    `/api/v1/tags/${slug}/articles?limit=${limit}&offset=${offset}`
  );
  return {
    articles: response.data,
    total: response.meta?.total || response.data.length,
  };
}
