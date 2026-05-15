'use client';

import { ArticleListItem } from '@/types/article';
import { PaginationMeta } from '@/types/api';
import ArticleCard from './ArticleCard';
import Link from 'next/link';

interface ArticleListProps {
  articles: ArticleListItem[];
  meta?: PaginationMeta | null;
  basePath?: string;
}

export function ArticleList({ articles, meta, basePath = '/articles' }: ArticleListProps) {
  if (articles.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No articles found.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>

      {meta && meta.total_pages > 1 && (
        <div className="mt-8 flex justify-center items-center gap-2">
          {meta.has_prev && (
            <Link
              href={`${basePath}?page=${meta.page - 1}`}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Previous
            </Link>
          )}

          <span className="px-4 py-2 text-gray-600">
            Page {meta.page} of {meta.total_pages}
          </span>

          {meta.has_next && (
            <Link
              href={`${basePath}?page=${meta.page + 1}`}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
