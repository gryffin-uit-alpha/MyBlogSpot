'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { listAllArticles } from '@/lib/api/admin';
import type { Article } from '@/types/article';

interface Stats {
  total: number;
  published: number;
  drafts: number;
}

export default function DashboardPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState<Stats>({ total: 0, published: 0, drafts: 0 });
  const [recentArticles, setRecentArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await listAllArticles(1, 100, token);

        const articles = response.data || [];
        const total = articles.length;
        const published = articles.filter((a: Article) => a.status === 'published').length;
        const drafts = articles.filter((a: Article) => a.status === 'draft').length;

        setStats({ total, published, drafts });
        setRecentArticles(articles.slice(0, 5));
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const statCards = [
    {
      label: 'Total Articles',
      value: stats.total,
      icon: '📚',
      color: 'cyan',
      gradient: 'from-cyan-500 to-blue-500',
    },
    {
      label: 'Published',
      value: stats.published,
      icon: '✅',
      color: 'green',
      gradient: 'from-green-500 to-emerald-500',
    },
    {
      label: 'Drafts',
      value: stats.drafts,
      icon: '📝',
      color: 'amber',
      gradient: 'from-amber-500 to-orange-500',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2 font-mono text-xs text-gray-600">
          <span className="text-cyan-400">&gt;</span>
          <span>SYSTEM_OVERVIEW</span>
        </div>
        <h1 className="heading-1 text-gray-100">Dashboard</h1>
        <p className="text-gray-500 mt-2">Welcome back, monitor your content at a glance.</p>
      </div>

      {/* Stats Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card p-6 animate-pulse">
              <div className="h-12 bg-gray-800 rounded mb-4"></div>
              <div className="h-8 bg-gray-800 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {statCards.map((card, idx) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              whileHover={{ scale: 1.02, y: -5 }}
              className="relative group"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} rounded-lg blur opacity-20 group-hover:opacity-30 transition-opacity`}></div>
              <div className="relative glass-card p-6 border-gray-800 group-hover:border-gray-700">
                <div className="flex items-start justify-between mb-4">
                  <div className={`text-4xl p-3 bg-gradient-to-br ${card.gradient} rounded-lg shadow-lg`}>
                    {card.icon}
                  </div>
                  <div className="font-mono text-xs text-gray-600">METRIC</div>
                </div>
                <div className="space-y-1">
                  <div className="text-4xl font-bold text-gray-100">{card.value}</div>
                  <div className="font-mono text-sm text-gray-500">{card.label}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="glass-card p-6"
      >
        <h2 className="heading-3 text-gray-100 mb-4 flex items-center gap-2">
          <span className="text-purple-400">⚡</span>
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/admin/articles/new"
            className="group relative overflow-hidden px-6 py-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-lg hover:border-purple-400/50 transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">📝</span>
              <div>
                <div className="font-semibold text-gray-100 group-hover:text-purple-400 transition-colors">New Article</div>
                <div className="text-xs text-gray-500 font-mono">Create post</div>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/categories"
            className="group relative overflow-hidden px-6 py-4 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-lg hover:border-amber-400/50 transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">📁</span>
              <div>
                <div className="font-semibold text-gray-100 group-hover:text-amber-400 transition-colors">Categories</div>
                <div className="text-xs text-gray-500 font-mono">Manage</div>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/tags"
            className="group relative overflow-hidden px-6 py-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-lg hover:border-green-400/50 transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🏷️</span>
              <div>
                <div className="font-semibold text-gray-100 group-hover:text-green-400 transition-colors">Tags</div>
                <div className="text-xs text-gray-500 font-mono">Organize</div>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/comments"
            className="group relative overflow-hidden px-6 py-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-lg hover:border-blue-400/50 transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">💬</span>
              <div>
                <div className="font-semibold text-gray-100 group-hover:text-blue-400 transition-colors">Comments</div>
                <div className="text-xs text-gray-500 font-mono">Moderate</div>
              </div>
            </div>
          </Link>
        </div>
      </motion.div>

      {/* Recent Articles */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="glass-card p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="heading-3 text-gray-100 flex items-center gap-2">
            <span className="text-cyan-400">📄</span>
            Recent Articles
          </h2>
          <Link
            href="/admin/articles"
            className="text-sm text-cyan-400 hover:text-cyan-300 font-mono transition-colors"
          >
            View All →
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-800/30 rounded-lg p-4 animate-pulse">
                <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-700 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : recentArticles.length === 0 ? (
          <div className="text-center py-12 text-gray-500 font-mono text-sm">
            No articles yet. Create your first one!
          </div>
        ) : (
          <div className="space-y-3">
            {recentArticles.map((article, idx) => (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
              >
                <Link
                  href={`/admin/articles/${article.id}/edit`}
                  className="block group bg-gray-800/30 hover:bg-gray-800/50 border border-gray-800 hover:border-gray-700 rounded-lg p-4 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-100 group-hover:text-cyan-400 transition-colors mb-1">
                        {article.title}
                      </h3>
                      <div className="flex items-center gap-3 text-xs font-mono text-gray-600">
                        <span>
                          status:{' '}
                          <span className={article.status === 'published' ? 'text-green-400' : 'text-amber-400'}>
                            {article.status}
                          </span>
                        </span>
                        <span>•</span>
                        <span>{new Date(article.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <span className="text-gray-600 group-hover:text-gray-400 transition-colors">→</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
