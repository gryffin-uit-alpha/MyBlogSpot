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
  const response = await apiClient<ApiResponse<Tag[]>>('/tags');
  return response.data;
}

export async function getTag(slug: string): Promise<Tag> {
  const response = await apiClient<ApiResponse<Tag>>(`/tags/${slug}`);
  return response.data;
}

export async function getTagArticles(
  slug: string,
  limit = 20,
  offset = 0
): Promise<{ articles: Article[]; total: number }> {
  const response = await apiClient<ApiResponse<Article[]>>(
    `/tags/${slug}/articles?limit=${limit}&offset=${offset}`
  );
  return {
    articles: response.data,
    total: response.meta?.total || response.data.length,
  };
}

export const tagsApi = {
  list: async (): Promise<ApiResponse<Tag[]>> => {
    return apiClient<ApiResponse<Tag[]>>('/tags');
  },

  get: async (slug: string): Promise<Tag> => {
    const response = await apiClient<ApiResponse<Tag>>(`/tags/${slug}`);
    return response.data;
  },

  create: async (data: { name: string; slug: string }): Promise<ApiResponse<Tag>> => {
    return apiClient<ApiResponse<Tag>>('/admin/tags', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: { name: string; slug: string }): Promise<ApiResponse<Tag>> => {
    return apiClient<ApiResponse<Tag>>(`/admin/tags/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<void> => {
    await apiClient(`/admin/tags/${id}`, {
      method: 'DELETE',
    });
  },
};
