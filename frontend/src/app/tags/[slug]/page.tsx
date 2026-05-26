import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTag, getTagArticles } from '@/lib/api/tags';
import ArticleCard from '@/components/article/ArticleCard';

interface TagPageProps {
  params: { slug: string };
  searchParams: { page?: string };
}

export default async function TagPage({ params, searchParams }: TagPageProps) {
  const page = parseInt(searchParams.page || '1', 10);
  const limit = 20;
  const offset = (page - 1) * limit;

  try {
    const [tag, { articles, total }] = await Promise.all([
      getTag(params.slug),
      getTagArticles(params.slug, limit, offset),
    ]);

    const totalPages = Math.ceil(total / limit);

    const getRankBadge = (count: number) => {
      if (count >= 10) return { rank: 'S+', color: '#FFD700' };
      if (count >= 7) return { rank: 'S', color: '#8B5CF6' };
      if (count >= 5) return { rank: 'A', color: '#22D3EE' };
      if (count >= 3) return { rank: 'B', color: '#10B981' };
      return { rank: 'C', color: '#6B7280' };
    };

    const { rank, color } = getRankBadge(total);

    return (
      <div className="min-h-screen bg-[#0B0F19] text-gray-100">
        <div className="container-wide mx-auto px-6 py-12">
          {/* Breadcrumb */}
          <div className="mb-6">
            <nav className="font-mono text-xs text-gray-600">
              <Link href="/tags" className="hover:text-amber-400 transition-colors">
                <span className="text-gray-700">&gt;</span> cd ../match_history
              </Link>
              <span className="mx-2 text-gray-800">/</span>
              <span className="text-amber-400">{tag.slug}</span>
            </nav>
          </div>

          {/* Header */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center font-bold text-xl border-2"
                style={{
                  backgroundColor: `${color}20`,
                  borderColor: `${color}50`,
                  color: color
                }}
              >
                {rank}
              </div>
              <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded font-mono text-xs text-amber-400">
                {total} {total === 1 ? 'article' : 'articles'}
              </div>
            </div>

            <h1 className="heading-1 mb-2">
              <span className="text-gradient-music">#{tag.name}</span>
            </h1>

            <p className="body-base text-gray-500 font-mono">
              All articles tagged with <span className="text-amber-400">#{tag.name}</span>
            </p>
          </div>

          {/* Articles Grid */}
          {articles.length === 0 ? (
            <div className="text-center py-20">
              <div className="glass-card p-12 max-w-md mx-auto">
                <div className="w-16 h-16 mx-auto mb-4 bg-amber-500/10 border-2 border-amber-500/30 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <h3 className="heading-3 text-gray-300 mb-2">No Articles Yet</h3>
                <p className="body-small text-gray-500">
                  Articles with this tag will appear here.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
                {articles.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-3 font-mono text-sm">
                  {page > 1 && (
                    <Link
                      href={`/tags/${params.slug}?page=${page - 1}`}
                      className="px-4 py-2 bg-gray-800/50 border border-gray-700 hover:border-amber-500/50 text-gray-400 hover:text-amber-400 rounded-lg transition-all"
                    >
                      <span>←</span> Previous
                    </Link>
                  )}
                  <span className="px-4 py-2 text-gray-500">
                    Page {page} <span className="text-gray-700">/</span> {totalPages}
                  </span>
                  {page < totalPages && (
                    <Link
                      href={`/tags/${params.slug}?page=${page + 1}`}
                      className="px-4 py-2 bg-gray-800/50 border border-gray-700 hover:border-amber-500/50 text-gray-400 hover:text-amber-400 rounded-lg transition-all"
                    >
                      Next <span>→</span>
                    </Link>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  } catch (error) {
    notFound();
  }
}

export async function generateMetadata({ params }: TagPageProps) {
  try {
    const tag = await getTag(params.slug);
    return {
      title: `#${tag.name} - MyBlogSpot`,
      description: `Articles tagged with ${tag.name}`,
    };
  } catch {
    return {
      title: 'Tag Not Found',
    };
  }
}
