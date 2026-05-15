import { getArticles } from '@/lib/api/articles';
import { ArticleList } from '@/components/article/ArticleList';
import { ArticleListItem } from '@/types/article';
import { PaginationMeta } from '@/types/api';

interface PageProps {
  searchParams: { page?: string; per_page?: string };
}

export default async function ArticlesPage({ searchParams }: PageProps) {
  const page = parseInt(searchParams.page || '1', 10);
  const perPage = parseInt(searchParams.per_page || '20', 10);

  let articles: ArticleListItem[] = [];
  let meta: PaginationMeta | null = null;
  let error: string | null = null;

  try {
    const response = await getArticles({ page, per_page: perPage });
    if (response.success && response.data) {
      articles = response.data;
      meta = response.meta || null;
    } else {
      error = response.error?.message || 'Failed to fetch articles';
    }
  } catch (err) {
    error = err instanceof Error ? err.message : 'An error occurred';
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">All Articles</h1>
        <p className="text-gray-600">Browse all published articles</p>
      </div>

      {error ? (
        <div className="text-center py-12">
          <p className="text-red-500">{error}</p>
        </div>
      ) : (
        <ArticleList articles={articles} meta={meta} basePath="/articles" />
      )}
    </div>
  );
}
