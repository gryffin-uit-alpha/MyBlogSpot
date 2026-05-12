'use client';

import { useState, useEffect } from 'react';
import { getArticles, GetArticlesParams } from '../api/articles';
import type { ArticleListItem } from '@/types/article';
import type { PaginationMeta } from '@/types/api';

interface UseArticlesResult {
  articles: ArticleListItem[];
  meta: PaginationMeta | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch and manage articles list
 */
export function useArticles(params?: GetArticlesParams): UseArticlesResult {
  const [articles, setArticles] = useState<ArticleListItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getArticles(params);

      if (response.success && response.data) {
        setArticles(response.data);
        setMeta(response.meta || null);
      } else {
        setError(response.error?.message || 'Failed to fetch articles');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(params)]);

  return {
    articles,
    meta,
    loading,
    error,
    refetch: fetchArticles,
  };
}
