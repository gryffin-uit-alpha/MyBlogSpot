import { Suspense } from 'react';
import SearchBar from '@/components/search/SearchBar';
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
        <p className="text-red-600">
          Failed to perform search. Please try again.
        </p>
      </div>
    );
  }
}

function SearchFallback() {
  return (
    <div className="space-y-6">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-3"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      ))}
    </div>
  );
}

export default function SearchPage({ searchParams }: SearchPageProps) {
  const query = searchParams.q || '';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Search Articles</h1>
          <SearchBar autoFocus />
        </div>

        {query ? (
          <Suspense fallback={<SearchFallback />}>
            <SearchContent query={query} />
          </Suspense>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <svg
              className="mx-auto h-12 w-12 text-gray-400 mb-4"
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
            <p>Enter a search query to find articles</p>
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
