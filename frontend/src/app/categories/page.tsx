'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { getCategories } from '@/lib/api/categories';
import type { Category } from '@/types/category';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategories();
        setCategories(data);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100">
      <div className="container-wide mx-auto px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-4 font-mono text-xs text-gray-500">
            <span className="text-purple-400">&gt;</span>
            <span>ls /synthesizer</span>
          </div>

          <h1 className="heading-1 mb-4">
            <span className="text-gradient-music">Synthesizer</span>
          </h1>

          <p className="body-large max-w-2xl">
            Explore stories organized by theme. Each category represents a different frequency —
            a different mood, tone, or aspect of life.
          </p>
        </motion.div>

        {/* Categories Grid */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 font-mono text-sm text-gray-500">Loading categories...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-20">
            <div className="glass-card p-12 max-w-md mx-auto">
              <div className="w-16 h-16 mx-auto mb-4 bg-purple-500/10 border-2 border-purple-500/30 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="heading-3 text-gray-300 mb-2">No Categories Yet</h3>
              <p className="body-small text-gray-500">
                Categories will appear here once articles are organized by theme.
              </p>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {categories.map((category, idx) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
              >
                <Link href={`/categories/${category.slug}`}>
                  <div className="group glass-card p-5 hover:border-purple-500/40 transition-all h-full flex flex-col">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-pink-500 rounded flex items-center justify-center text-lg font-bold text-white flex-shrink-0">
                        {category.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/30 rounded font-mono text-xs text-purple-400">
                        {category.article_count || 0}
                      </div>
                    </div>

                    <h2 className="text-lg font-semibold text-gray-100 group-hover:text-purple-400 transition-colors mb-2 font-heading">
                      {category.name}
                    </h2>

                    {category.description && (
                      <p className="body-small text-gray-400 line-clamp-2 mb-3 flex-1">
                        {category.description}
                      </p>
                    )}

                    <div className="flex items-center gap-2 font-mono text-xs text-gray-600 mt-auto pt-2 border-t border-gray-800">
                      <span>View stories</span>
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
