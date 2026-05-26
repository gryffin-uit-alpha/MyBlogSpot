import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCategory, getCategoryArticles } from '@/lib/api/categories';
import ArticleCard from '@/components/article/ArticleCard';

interface CategoryPageProps {
  params: { slug: string };
  searchParams: { page?: string };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const page = parseInt(searchParams.page || '1', 10);
  const limit = 20;
  const offset = (page - 1) * limit;

  try {
    const [category, { articles, total }] = await Promise.all([
      getCategory(params.slug),
      getCategoryArticles(params.slug, limit, offset),
    ]);

    const totalPages = Math.ceil(total / limit);

    return (
      <div className="min-h-screen bg-[#0B0F19] text-gray-100">
        <div className="container-wide mx-auto px-6 py-12">
          {/* Breadcrumb */}
          <div className="mb-6">
            <nav className="font-mono text-xs text-gray-600">
              <Link href="/categories" className="hover:text-purple-400 transition-colors">
                <span className="text-gray-700">&gt;</span> cd ../synthesizer
              </Link>
              <span className="mx-2 text-gray-800">/</span>
              <span className="text-purple-400">{category.slug}</span>
            </nav>
          </div>

          {/* Header */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-2xl font-bold text-white">
                {category.name.charAt(0).toUpperCase()}
              </div>
              <div className="px-3 py-1 bg-purple-500/10 border border-purple-500/30 rounded font-mono text-xs text-purple-400">
                {total} {total === 1 ? 'article' : 'articles'}
              </div>
            </div>

            <h1 className="heading-1 mb-3">
              <span className="text-gradient-music">{category.name}</span>
            </h1>

            {category.description && (
              <p className="body-large text-gray-400 max-w-3xl">{category.description}</p>
            )}
          </div>

          {/* Articles Grid */}
          {articles.length === 0 ? (
            <div className="text-center py-20">
              <div className="glass-card p-12 max-w-md mx-auto">
                <div className="w-16 h-16 mx-auto mb-4 bg-purple-500/10 border-2 border-purple-500/30 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="heading-3 text-gray-300 mb-2">No Articles Yet</h3>
                <p className="body-small text-gray-500">
                  Articles in this category will appear here.
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
                      href={`/categories/${params.slug}?page=${page - 1}`}
                      className="px-4 py-2 bg-gray-800/50 border border-gray-700 hover:border-purple-500/50 text-gray-400 hover:text-purple-400 rounded-lg transition-all"
                    >
                      <span>←</span> Previous
                    </Link>
                  )}
                  <span className="px-4 py-2 text-gray-500">
                    Page {page} <span className="text-gray-700">/</span> {totalPages}
                  </span>
                  {page < totalPages && (
                    <Link
                      href={`/categories/${params.slug}?page=${page + 1}`}
                      className="px-4 py-2 bg-gray-800/50 border border-gray-700 hover:border-purple-500/50 text-gray-400 hover:text-purple-400 rounded-lg transition-all"
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

export async function generateMetadata({ params }: CategoryPageProps) {
  try {
    const category = await getCategory(params.slug);
    return {
      title: `${category.name} - MyBlogSpot`,
      description: category.description || `Articles in ${category.name} category`,
    };
  } catch {
    return {
      title: 'Category Not Found',
    };
  }
}
