import Link from 'next/link';

export function Header() {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
              MyBlogSpot
            </Link>
          </div>

          <div className="flex items-center space-x-8">
            <Link
              href="/articles"
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
            >
              Articles
            </Link>
            <Link
              href="/categories"
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
            >
              Categories
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}
