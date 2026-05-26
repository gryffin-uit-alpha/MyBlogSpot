import Link from 'next/link';
import { ArticleListItem } from '@/types/article';

interface ArticleCardProps {
  article: ArticleListItem;
}

export default function ArticleCard({ article }: ArticleCardProps) {
  const formattedDate = article.published_at
    ? new Date(article.published_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : new Date(article.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

  return (
    <article className="glass-card p-6 hover:border-purple-500/40 transition-all h-full flex flex-col">
      <Link href={`/articles/${article.slug}`} className="group flex-1">
        <h2 className="text-xl font-bold text-gray-100 group-hover:text-purple-400 transition-colors mb-3 font-heading">
          {article.title}
        </h2>

        {article.summary && (
          <p className="body-small text-gray-400 line-clamp-3 mb-4">{article.summary}</p>
        )}
      </Link>

      <div className="flex items-center justify-between text-xs font-mono text-gray-600 pt-3 border-t border-gray-800">
        <div className="flex items-center gap-3">
          <time dateTime={article.published_at || article.created_at}>
            {formattedDate}
          </time>

          {article.category && (
            <Link
              href={`/categories/${article.category.slug}`}
              className="text-purple-400 hover:text-purple-300 transition-colors"
            >
              {article.category.name}
            </Link>
          )}
        </div>

        <span className="flex items-center gap-1">
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
          {article.view_count}
        </span>
      </div>

      {article.tags && article.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {article.tags.map((tag) => (
            <Link
              key={tag.id}
              href={`/tags/${tag.slug}`}
              className="text-xs px-2 py-1 bg-amber-500/10 border border-amber-500/30 hover:border-amber-500/50 text-amber-400 rounded font-mono transition-colors"
            >
              #{tag.name}
            </Link>
          ))}
        </div>
      )}
    </article>
  );
}
