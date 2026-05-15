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
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="mb-8">
            <nav className="text-sm text-gray-500 mb-4">
              <Link href="/categories" className="hover:text-blue-600">
                Categories
              </Link>
              <span className="mx-2">/</span>
              <span className="text-gray-900">{category.name}</span>
            </nav>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {category.name}
            </h1>
            {category.description && (
              <p className="text-lg text-gray-600">{category.description}</p>
            )}
            <p className="text-sm text-gray-500 mt-2">
              {total} {total === 1 ? 'article' : 'articles'}
            </p>
          </div>

          {articles.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No articles in this category yet.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {articles.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center gap-2">
                  {page > 1 && (
                    <Link
                      href={`/categories/${params.slug}?page=${page - 1}`}
                      className="px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50"
                    >
                      Previous
                    </Link>
                  )}
                  <span className="px-4 py-2">
                    Page {page} of {totalPages}
                  </span>
                  {page < totalPages && (
                    <Link
                      href={`/categories/${params.slug}?page=${page + 1}`}
                      className="px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50"
                    >
                      Next
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
