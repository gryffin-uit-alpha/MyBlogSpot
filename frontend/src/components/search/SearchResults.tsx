import Link from 'next/link';
import { SearchResult } from '@/lib/api/search';

interface SearchResultsProps {
  results: SearchResult[];
  query: string;
  total: number;
}

export default function SearchResults({ results, query, total }: SearchResultsProps) {
  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 className="mt-4 text-lg font-medium text-gray-900">No results found</h3>
        <p className="mt-2 text-sm text-gray-500">
          No articles match your search for &quot;{query}&quot;. Try different keywords.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-sm text-gray-600">
        Found {total} {total === 1 ? 'result' : 'results'} for &quot;{query}&quot;
      </div>

      <div className="space-y-6">
        {results.map((article) => (
          <article key={article.id} className="border-b border-gray-200 pb-6 last:border-0">
            <Link
              href={`/articles/${article.slug}`}
              className="group"
            >
              <h2 className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                {article.title}
              </h2>
            </Link>

            {article.summary && (
              <p className="mt-3 text-gray-600 line-clamp-2">
                {article.summary}
              </p>
            )}

            {article.excerpt && (
              <p className="mt-2 text-sm text-gray-500 italic">
                ...{article.excerpt}...
              </p>
            )}

            <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
              {article.published_at && (
                <time dateTime={article.published_at}>
                  {new Date(article.published_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </time>
              )}

              {article.category && (
                <Link
                  href={`/categories/${article.category.slug}`}
                  className="hover:text-blue-600 transition-colors"
                >
                  {article.category.name}
                </Link>
              )}

              {article.view_count !== undefined && (
                <span>{article.view_count} views</span>
              )}
            </div>

            {article.tags && article.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {article.tags.map((tag) => (
                  <Link
                    key={tag.id}
                    href={`/tags/${tag.slug}`}
                    className="inline-block px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
                  >
                    {tag.name}
                  </Link>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
