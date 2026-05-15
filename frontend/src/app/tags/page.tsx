import Link from 'next/link';
import { getTags } from '@/lib/api/tags';

export default async function TagsPage() {
  const tags = await getTags();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Tags</h1>

        {tags.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No tags available yet.</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {tags.map((tag) => (
              <Link
                key={tag.id}
                href={`/tags/${tag.slug}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
              >
                <span className="font-medium text-gray-900">{tag.name}</span>
                <span className="text-sm text-gray-500">
                  ({tag.article_count || 0})
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export const metadata = {
  title: 'Tags - MyBlogSpot',
  description: 'Browse articles by tag',
};

export const dynamic = 'force-dynamic';
