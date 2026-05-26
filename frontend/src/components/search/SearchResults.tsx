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
      <div className="text-center py-16">
        <div className="glass-card p-12 max-w-md mx-auto">
          <svg
            className="mx-auto h-12 w-12 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-300">No results found</h3>
          <p className="mt-2 text-sm text-gray-500">
            No articles match &quot;<span className="text-cyan-400">{query}</span>&quot;. Try different keywords.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="font-mono text-xs text-gray-600 flex items-center gap-2">
        <span className="text-gray-700">&gt;</span>
        <span>Found {total} {total === 1 ? 'result' : 'results'} for</span>
        <span className="text-cyan-400">&quot;{query}&quot;</span>
      </div>

      <div className="space-y-4">
        {results.map((article) => (
          <article key={article.id} className="glass-card p-5 hover:border-gray-700/50 transition-all">
            <Link
              href={`/articles/${article.slug}`}
              className="group block"
            >
              <h2 className="text-xl font-bold text-gray-100 group-hover:text-cyan-400 transition-colors mb-2 font-heading">
                {article.title}
              </h2>
            </Link>

            {article.summary && (
              <p className="text-gray-400 text-sm line-clamp-2 mb-3">
                {article.summary}
              </p>
            )}

            {article.excerpt && (
              <p className="text-xs text-gray-600 italic mb-3">
                ...{article.excerpt}...
              </p>
            )}

            <div className="flex items-center gap-3 text-xs font-mono text-gray-600 mb-3">
              {article.published_at && (
                <time dateTime={article.published_at} className="text-gray-500">
                  {new Date(article.published_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </time>
              )}

              {article.category && (
                <>
                  <span className="text-gray-800">|</span>
                  <Link
                    href={`/categories/${article.category.slug}`}
                    className="text-purple-500 hover:text-purple-400 transition-colors"
                  >
                    {article.category.name}
                  </Link>
                </>
              )}

              {article.view_count !== undefined && (
                <>
                  <span className="text-gray-800">|</span>
                  <span className="text-gray-600">{article.view_count} views</span>
                </>
              )}
            </div>

            {article.tags && article.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {article.tags.map((tag) => (
                  <Link
                    key={tag.id}
                    href={`/tags/${tag.slug}`}
                    className="px-2 py-0.5 text-[10px] font-mono bg-gray-800/50 border border-gray-700/50 text-gray-500 hover:text-amber-400 hover:border-amber-500/50 rounded transition-all"
                  >
                    #{tag.name}
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
