import { getArticles } from '@/lib/api/articles';
import { ArticleList } from '@/components/article/ArticleList';
import { ArticleListItem } from '@/types/article';
import { PaginationMeta } from '@/types/api';

export default async function Home() {
  let articles: ArticleListItem[] = [];
  let meta: PaginationMeta | null = null;
  let error: string | null = null;

  try {
    const response = await getArticles({ per_page: 10 });
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
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Welcome to MyBlogSpot
        </h1>
        <p className="text-lg text-gray-600">
          Technical writing, DevOps insights, and backend engineering explorations
        </p>
      </div>

      {error ? (
        <div className="text-center py-12">
          <p className="text-red-500">{error}</p>
        </div>
      ) : (
        <ArticleList articles={articles} meta={meta} basePath="/" />
      )}
    </div>
  );
}
