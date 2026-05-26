import { Suspense } from 'react';
import SearchResults from '@/components/search/SearchResults';
import { searchArticles } from '@/lib/api/search';

interface SearchPageProps {
  searchParams: { q?: string };
}

async function SearchContent({ query }: { query: string }) {
  try {
    const { results, total } = await searchArticles(query);

    return <SearchResults results={results} query={query} total={total} />;
  } catch (error) {
    return (
      <div className="text-center py-12">
        <div className="glass-card p-8 max-w-md mx-auto">
          <p className="text-red-400 font-mono text-sm">
            [ ERROR ] Failed to perform search. Please try again.
          </p>
        </div>
      </div>
    );
  }
}

function SearchFallback() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="glass-card p-5 animate-pulse">
          <div className="h-6 bg-gray-800 rounded w-3/4 mb-3"></div>
          <div className="h-4 bg-gray-800 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-800 rounded w-5/6"></div>
        </div>
      ))}
    </div>
  );
}

export default function SearchPage({ searchParams }: SearchPageProps) {
  const query = searchParams.q || '';

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100">
      <div className="container-wide mx-auto px-6 py-12">
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-3 font-mono text-xs text-gray-600">
            <span className="text-gray-700">&gt;</span>
            <span>cd /database/search</span>
          </div>
          <h1 className="heading-1 mb-3">
            <span className="text-gradient-tech">Search Articles</span>
          </h1>
          <p className="body-base text-gray-500">
            Use the search box in the header above to find articles
          </p>
        </div>

        {query ? (
          <Suspense fallback={<SearchFallback />}>
            <SearchContent query={query} />
          </Suspense>
        ) : (
          <div className="text-center py-16">
            <div className="glass-card p-12 max-w-md mx-auto">
              <svg
                className="mx-auto h-12 w-12 text-gray-600 mb-4"
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
              <h3 className="text-lg font-medium text-gray-300 mb-2 font-heading">Start searching</h3>
              <p className="text-sm text-gray-500 mb-3">
                Click the search icon in the header or type to find articles.
              </p>
              <div className="pt-3 border-t border-gray-800">
                <p className="text-xs text-gray-600 font-mono">
                  Supports phrases, partial matches, and multiple keywords.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export const metadata = {
  title: 'Search Articles - MyBlogSpot',
  description: 'Search for articles on MyBlogSpot',
};
