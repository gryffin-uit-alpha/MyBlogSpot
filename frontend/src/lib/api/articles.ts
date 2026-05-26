import { apiClient } from './client';
import type { Article, ArticleListItem } from '@/types/article';
import type { ApiResponse, PaginationParams, PaginatedResponse } from '@/types/api';

export interface GetArticlesParams extends PaginationParams {
  category?: string;
  tag?: string;
}

export interface CreateArticleData {
  title: string;
  slug: string;
  summary: string;
  content: string;
  category_id: string;
  tag_ids: string[];
  status: 'draft' | 'published';
}

export interface UpdateArticleData extends Partial<CreateArticleData> {}

/**
 * Fetch a paginated list of published articles
 */
export async function getArticles(
  params?: GetArticlesParams
): Promise<ApiResponse<ArticleListItem[]>> {
  const searchParams = new URLSearchParams();

  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.per_page) searchParams.set('per_page', params.per_page.toString());
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  if (params?.offset) searchParams.set('offset', params.offset.toString());
  if (params?.category) searchParams.set('category', params.category);
  if (params?.tag) searchParams.set('tag', params.tag);

  const query = searchParams.toString();
  const endpoint = `/articles${query ? `?${query}` : ''}`;

  return apiClient<ApiResponse<ArticleListItem[]>>(endpoint);
}

/**
 * Fetch a single article by slug
 */
export async function getArticle(slug: string): Promise<ApiResponse<Article>> {
  return apiClient<ApiResponse<Article>>(`/articles/${slug}`);
}

/**
 * Track a view for an article
 */
export async function trackView(articleId: string): Promise<ApiResponse<{ message: string }>> {
  return apiClient<ApiResponse<{ message: string }>>(`/articles/${articleId}/view`, {
    method: 'POST',
  });
}

export const articlesApi = {
  /**
   * List all articles (admin - includes drafts)
   */
  list: async (params?: GetArticlesParams): Promise<PaginatedResponse<ArticleListItem>> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.per_page) searchParams.set('per_page', params.per_page.toString());
    if (params?.category) searchParams.set('category', params.category);
    if (params?.tag) searchParams.set('tag', params.tag);

    const query = searchParams.toString();
    const response = await apiClient<PaginatedResponse<ArticleListItem>>(`/admin/articles${query ? `?${query}` : ''}`);
    return response;
  },

  /**
   * Get single article by ID (admin)
   */
  get: async (id: string): Promise<Article> => {
    const response = await apiClient<ApiResponse<Article>>(`/admin/articles/${id}`);
    return response.data!;
  },

  /**
   * Create new article
   */
  create: async (data: CreateArticleData): Promise<Article> => {
    const response = await apiClient<ApiResponse<Article>>('/admin/articles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data!;
  },

  /**
   * Update existing article
   */
  update: async (id: string, data: UpdateArticleData): Promise<Article> => {
    const response = await apiClient<ApiResponse<Article>>(`/admin/articles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data!;
  },

  /**
   * Delete article
   */
  delete: async (id: string): Promise<void> => {
    await apiClient(`/admin/articles/${id}`, {
      method: 'DELETE',
    });
  },
};
