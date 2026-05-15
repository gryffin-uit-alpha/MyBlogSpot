import Link from 'next/link';
import { getCategories } from '@/lib/api/categories';

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Categories</h1>

        {categories.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No categories available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/categories/${category.slug}`}
                className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow border border-gray-200"
              >
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  {category.name}
                </h2>
                {category.description && (
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {category.description}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    {category.article_count || 0} {category.article_count === 1 ? 'article' : 'articles'}
                  </span>
                  <span className="text-blue-600 hover:text-blue-700 font-medium">
                    View →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export const metadata = {
  title: 'Categories - MyBlogSpot',
  description: 'Browse articles by category',
};

export const dynamic = 'force-dynamic';
