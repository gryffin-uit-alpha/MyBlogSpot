'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { api } from '@/lib/api/client';

interface Article {
  id: string;
  title: string;
  slug: string;
  summary?: string;
  created_at: string;
}

interface RelatedArticlesProps {
  currentSlug: string;
}

export function RelatedArticles({ currentSlug }: RelatedArticlesProps) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRelated = async () => {
      try {
        const response = await api.get(`/articles/${currentSlug}/related`);
        setArticles(response.data || []);
      } catch (error) {
        console.error('Failed to fetch related articles:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRelated();
  }, [currentSlug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (articles.length === 0) {
    return null;
  }

  return (
    <div className="mt-16 pt-12 border-t border-gray-800">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-2xl font-bold text-gray-100 font-heading">You might also like</h2>
        <div className="flex-1 h-px bg-gradient-to-r from-cyan-500/50 to-transparent"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {articles.map((article, idx) => (
          <motion.div
            key={article.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Link
              href={`/articles/${article.slug}`}
              className="block group glass-card p-6 border-gray-800 hover:border-cyan-500/30 transition-all"
            >
              <h3 className="text-lg font-semibold text-gray-100 group-hover:text-cyan-400 transition-colors mb-2 font-heading">
                {article.title}
              </h3>
              {article.summary && (
                <p className="text-gray-500 text-sm line-clamp-2 mb-3">
                  {article.summary}
                </p>
              )}
              <div className="flex items-center gap-2 text-xs text-gray-600 font-mono">
                <span>{new Date(article.created_at).toLocaleDateString()}</span>
                <span>•</span>
                <span className="text-cyan-400 group-hover:text-cyan-300">Read more →</span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
