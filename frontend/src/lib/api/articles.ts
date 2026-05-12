import { apiClient } from './client';
import type { Article, ArticleListItem } from '@/types/article';
import type { ApiResponse, PaginationParams } from '@/types/api';

export interface GetArticlesParams extends PaginationParams {
  category?: string;
  tag?: string;
}

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
  const endpoint = `/api/v1/articles${query ? `?${query}` : ''}`;

  return apiClient<ApiResponse<ArticleListItem[]>>(endpoint);
}

/**
 * Fetch a single article by slug
 */
export async function getArticle(slug: string): Promise<ApiResponse<Article>> {
  return apiClient<ApiResponse<Article>>(`/api/v1/articles/${slug}`);
}

/**
 * Track a view for an article
 */
export async function trackView(articleId: string): Promise<ApiResponse<{ message: string }>> {
  return apiClient<ApiResponse<{ message: string }>>(`/api/v1/articles/${articleId}/view`, {
    method: 'POST',
  });
}
