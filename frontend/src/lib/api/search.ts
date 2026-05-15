import { apiClient } from './client';
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

export interface SearchResult extends Article {
  excerpt?: string;
  rank?: number;
}

export async function searchArticles(
  query: string,
  limit = 10,
  offset = 0
): Promise<{ results: SearchResult[]; total: number }> {
  const params = new URLSearchParams({
    q: query,
    limit: limit.toString(),
    offset: offset.toString(),
  });

  const response = await apiClient<ApiResponse<SearchResult[]>>(
    `/api/v1/search?${params.toString()}`
  );

  return {
    results: response.data,
    total: response.meta?.total || response.data.length,
  };
}
