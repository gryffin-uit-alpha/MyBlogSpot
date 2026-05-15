'use client';

import Link from 'next/link';
import { useState } from 'react';
import SearchBar from '@/components/search/SearchBar';

export function Header() {
  const [showSearch, setShowSearch] = useState(false);

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
              MyBlogSpot
            </Link>
          </div>

          <div className="flex items-center gap-6">
            {showSearch ? (
              <div className="flex items-center gap-2">
                <SearchBar />
                <button
                  onClick={() => setShowSearch(false)}
                  className="text-gray-500 hover:text-gray-700"
                  aria-label="Close search"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <>
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
                <Link
                  href="/tags"
                  className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                >
                  Tags
                </Link>
                <button
                  onClick={() => setShowSearch(true)}
                  className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                  aria-label="Search"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
